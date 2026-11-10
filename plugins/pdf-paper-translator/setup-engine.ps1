param([string]$Python)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = Join-Path $env:LOCALAPPDATA 'DshPdfTranslate'
$engineDir = Join-Path $root 'engine-2.10.2'
$enginePython = Join-Path $engineDir 'Scripts\python.exe'
$engine = Join-Path $engineDir 'Scripts\pdf2zh_next.exe'
$marker = $engineDir + '.installing'
$curl = Join-Path $env:SystemRoot 'System32\curl.exe'
$taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'

function Remove-SetupScratch([string]$Directory) {
    $parent = (Resolve-Path -LiteralPath $root).ProviderPath.TrimEnd('\') + '\'
    $target = (Resolve-Path -LiteralPath $Directory -ErrorAction SilentlyContinue).ProviderPath
    if ($target -and $target.StartsWith($parent, [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Find-Python([string]$Command, [string[]]$Options = @()) {
    $application = Get-Command -Name $Command -CommandType Application -ErrorAction SilentlyContinue |
        Where-Object Source -NotLike '*\Microsoft\WindowsApps\*' | Select-Object -First 1
    if (!$application) { return }
    try {
        $candidate = & $application.Source @Options -I -c 'import sys, struct, venv, ensurepip; assert sys.version_info[:2] in ((3, 12), (3, 13)) and struct.calcsize(''P'') == 8; print(sys.executable)' 2>$null
        if ($LASTEXITCODE -eq 0) { $candidate | Select-Object -Last 1 }
    } catch {
        # Continue probing if a launcher or interpreter is incomplete.
    }
}

function Get-ManagedPython {
    $version = '3.13.17'
    $runtime = Join-Path $root "python-$version-x64"
    $executable = Join-Path $runtime 'python.exe'
    if (Test-Path -LiteralPath $executable) { return $executable }

    $scratch = Join-Path $root ('python-download-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $scratch | Out-Null
    try {
        $archive = Join-Path $scratch 'python.nupkg'
        $expected = 'DCE409744B088F94C6E37BA41F8100C384C27E029E843237364C602D30D475E5'
        $sources = [ordered]@{
            huawei = 'https://mirrors.huaweicloud.com/artifactory/api/nuget/v3/nuget-remote'
            nuget = 'https://api.nuget.org/v3-flatcontainer'
        }
        $verified = $false
        foreach ($source in $sources.Keys) {
            [Console]::WriteLine("DSH_PDF_SETUP python $source")
            $uri = "$($sources[$source])/python/$version/python.$version.nupkg"
            & $curl --fail --location --silent --connect-timeout 8 --max-time 120 --output $archive $uri
            if ($LASTEXITCODE) {
                [Console]::WriteLine("DSH_PDF_SETUP issue $source unreachable")
                continue
            }
            if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expected) {
                [Console]::WriteLine("DSH_PDF_SETUP issue $source checksum")
                continue
            }
            $verified = $true
            break
        }
        if (!$verified) { throw 'Could not download and verify the Python runtime.' }
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $unpacked = Join-Path $scratch 'unpacked'
        [IO.Compression.ZipFile]::ExtractToDirectory($archive, $unpacked)
        [IO.Directory]::Move((Join-Path $unpacked 'tools'), $runtime)
        return $executable
    } finally {
        Remove-SetupScratch $scratch
    }
}

function Invoke-SetupProcess([string]$Executable, [string[]]$Arguments, [int]$Limit, [int]$IdleLimit = 0) {
    $stdout = Join-Path $root 'engine-setup.stdout'
    $stderr = Join-Path $root 'engine-setup.stderr'
    $child = Start-Process -FilePath $Executable -ArgumentList $Arguments -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    try {
        # Windows PowerShell needs the handle retained to read the exit code after the process exits.
        $null = $child.Handle
        $total = [Diagnostics.Stopwatch]::StartNew()
        $idle = [Diagnostics.Stopwatch]::StartNew()
        $lastBytes = 0
        while (!$child.WaitForExit(1000)) {
            if ($IdleLimit) {
                $bytes = (Get-Item -LiteralPath $stdout).Length + (Get-Item -LiteralPath $stderr).Length
                if ($bytes -ne $lastBytes) {
                    $lastBytes = $bytes
                    $idle.Restart()
                }
            }
            if ($total.Elapsed.TotalSeconds -ge $Limit -or ($IdleLimit -and $idle.Elapsed.TotalSeconds -ge $IdleLimit)) {
                return 'timeout'
            }
        }
        if ($child.ExitCode -eq 0) { return 'ok' }

        $diagnostics = (Get-Content -LiteralPath $stderr -Tail 40) -join "`n"
        switch -Regex ($diagnostics) {
            'WinError 112|Errno 28|No space left' { return 'disk' }
            'WinError 5\]|Errno 13|Permission denied|Access is denied' { return 'permission' }
            'ReadTimeout|ConnectTimeout|timed out|ConnectionError|SSLError|ProxyError|Failed to establish a new connection' { return 'network' }
            'No matching distribution|Could not find a version that satisfies' { return 'missing' }
            default { return 'failed' }
        }
    } finally {
        if (!$child.HasExited) {
            # The virtual environment launcher can have a separate Python child.
            & $taskkill /PID $child.Id /T /F | Out-Null
            if (!$child.WaitForExit(5000)) { throw 'Could not stop the engine installer.' }
        }
        $child.Dispose()
        Remove-Item -LiteralPath $stdout, $stderr -Force -ErrorAction SilentlyContinue
    }
}

function Install-EnginePackages {
    $sources = [ordered]@{
        tuna = 'https://pypi.tuna.tsinghua.edu.cn/simple'
        pypi = 'https://pypi.org/simple'
    }
    $wheelhouse = Join-Path $root ('engine-wheels-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $wheelhouse | Out-Null
    $wheelArgument = '"' + $wheelhouse + '"'
    $pip = @('-u', '-m', 'pip', '--isolated', '--disable-pip-version-check', '--no-input')
    $requirement = 'pdf2zh-next==2.10.2'
    try {
        foreach ($source in $sources.Keys) {
            $index = $sources[$source]
            [Console]::WriteLine("DSH_PDF_SETUP connect $source")
            & $curl --fail --location --silent --connect-timeout 5 --max-time 8 --output NUL "$index/pdf2zh-next/"
            if ($LASTEXITCODE) {
                [Console]::WriteLine("DSH_PDF_SETUP issue $source unreachable")
                continue
            }
            [Console]::WriteLine("DSH_PDF_SETUP packages $source")
            $download = @('download', '--only-binary=:all:', '--progress-bar', 'raw', '--retries', '0', '--timeout', '15',
                '--dest', $wheelArgument, '--index-url', $index, $requirement)
            $result = Invoke-SetupProcess $enginePython ($pip + $download) 360 90
            if ($result -eq 'ok') {
                [Console]::WriteLine("DSH_PDF_SETUP writing $source")
                $install = @('install', '--no-index', '--find-links', $wheelArgument, $requirement)
                $result = Invoke-SetupProcess $enginePython ($pip + $install) 600
                if ($result -eq 'ok') { return }
                [Console]::WriteLine("DSH_PDF_SETUP issue $source $result")
                break
            }
            [Console]::WriteLine("DSH_PDF_SETUP issue $source $result")
            if ($result -in @('disk', 'permission')) { break }
        }
        throw 'Could not install PDFMathTranslate-next.'
    } finally {
        Remove-SetupScratch $wheelhouse
    }
}

Write-Output 'DSH_PDF_SETUP check'
New-Item -ItemType Directory -Path $root -Force | Out-Null
try {
    $lock = [IO.File]::Open(($engineDir + '.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
} catch [IO.IOException] {
    Write-Output 'DSH_PDF_SETUP locked'
    throw
}

try {
    $retry = Test-Path -LiteralPath $marker
    if (!$retry -and (Test-Path -LiteralPath $engine) -and
        (Test-Path -LiteralPath $enginePython)) { return }
    New-Item -ItemType File -Path $marker -Force | Out-Null

    Write-Output 'DSH_PDF_SETUP python'
    if ($retry -or !(Find-Python $enginePython)) {
        $basePython = if ($Python) {
            Find-Python $Python
        } else {
            Find-Python 'py.exe' @('-3.13')
        }
        if (!$basePython -and !$Python) { $basePython = Find-Python 'py.exe' @('-3.12') }
        if (!$basePython -and !$Python) { $basePython = Find-Python 'python.exe' }
        if (!$basePython -and $Python) { throw 'Use a 64-bit Python 3.12 or 3.13 executable.' }
        if (!$basePython) { $basePython = Get-ManagedPython }
        & $basePython -m venv --clear $engineDir
        if ($LASTEXITCODE) { throw 'Could not create the engine virtual environment.' }
    }

    Install-EnginePackages

    Write-Output 'DSH_PDF_SETUP verify'
    if ((Invoke-SetupProcess $engine @('--version') 60) -ne 'ok') { throw 'PDFMathTranslate-next could not start.' }
    Remove-Item -LiteralPath $marker
} finally {
    $lock.Dispose()
}
