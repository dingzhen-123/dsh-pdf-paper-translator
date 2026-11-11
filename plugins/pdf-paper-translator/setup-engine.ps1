[CmdletBinding()]
param(
    [switch]$Yes,
    [switch]$CheckOnly,
    [switch]$Doctor,
    [string]$Python,
    [string]$PythonArchive,
    [Alias('Offline')][string]$Wheelhouse,
    [string]$OfflineAssets
)

$ErrorActionPreference = 'Stop'
# The bundled native wheels target Windows AMD64.
if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') {
    Write-Output 'DSH_PDF_SETUP unsupported-arch'
    Write-Host '本安装包仅支持 Windows x64（AMD64）。ARM64 或 32 位系统需要单独构建的安装包。' -ForegroundColor Red
    exit 1
}
$ProgressPreference = 'SilentlyContinue'
$config = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'engine-config.json') -Raw | ConvertFrom-Json
$root = Join-Path $env:LOCALAPPDATA 'DshPdfTranslate'
$engine = Join-Path $root ('engine-' + $config.pdf2zh)
$runtime = Join-Path $root 'runtime'
$assetCache = Join-Path $root ('assets-' + $config.babeldoc)
$runner = Join-Path $PSScriptRoot 'pdf-progress.py'
$lockPath = Join-Path $root 'engine-setup.lock'
$curl = Join-Path $env:SystemRoot 'System32\curl.exe'
$tar = Join-Path $env:SystemRoot 'System32\tar.exe'
$taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'

function Remove-SetupScratch([string]$Directory) {
    $item = Get-Item -LiteralPath $Directory -Force -ErrorAction SilentlyContinue
    if ($item -and $item.PSIsContainer -and !($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -and
        $item.Parent.FullName -eq (Get-Item -LiteralPath $root).FullName) {
        Remove-Item -LiteralPath $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Assert-SetupDirectory([string]$Directory) {
    if (Test-Path -LiteralPath $Directory) {
        $item = Get-Item -LiteralPath $Directory -Force
        if (!$item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -or
            $item.Parent.FullName -ne (Get-Item -LiteralPath $root).FullName) {
            throw 'The engine directory must be a regular directory inside the plugin data folder.'
        }
    }
}

function Quote-SetupArgument([string]$Value) {
    if ($Value -match '^[^\s"]+$') { return $Value }
    return '"' + (($Value -replace '(\\*)"', '$1$1\"') -replace '(\\+)$', '$1$1') + '"'
}

function Read-ProbeOutput([string]$Executable, [string[]]$Arguments) {
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = $Executable
    $info.Arguments = ($Arguments | ForEach-Object { Quote-SetupArgument $_ }) -join ' '
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    try { $child = [Diagnostics.Process]::Start($info) } catch { return }
    try {
        $out = $child.StandardOutput.ReadToEndAsync()
        $null = $child.StandardError.ReadToEndAsync()
        if ($child.WaitForExit(8000) -and $child.ExitCode -eq 0) {
            return $out.GetAwaiter().GetResult()
        }
    } finally {
        if (!$child.HasExited) { & $taskkill /PID $child.Id /T /F 2>$null | Out-Null }
        $child.Dispose()
    }
}

function Write-AssetSources([string]$LogPath, [hashtable]$Reported) {
    foreach ($line in @(Select-String -LiteralPath $LogPath -ErrorAction SilentlyContinue -Pattern 'Downloading fonts from (github|huggingface|modelscope)\b|Download doclayout onnx model from (huggingface|modelscope) success')) {
        $match = $line.Matches[0]
        $kind = if ($match.Groups[1].Success) { 'fonts' } else { 'model' }
        if (!$Reported.ContainsKey($kind)) {
            $source = $match.Groups[1].Value + $match.Groups[2].Value
            $Reported[$kind] = $source
            Write-Host "DSH_PDF_SETUP upstream $kind $source"
        }
    }
}

function Invoke-SetupProcess([string]$Executable, [string[]]$Arguments, [int]$Limit, [int]$IdleLimit = 0, $Output, [switch]$ReportAssets) {
    $stdout = $lockPath + '.stdout'
    $stderr = $lockPath + '.stderr'
    $commandLine = ($Arguments | ForEach-Object { Quote-SetupArgument $_ }) -join ' '
    $child = Start-Process -FilePath $Executable -ArgumentList $commandLine -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    try {
        # Windows PowerShell needs the handle retained to read the exit code after the process exits.
        $null = $child.Handle
        $total = [Diagnostics.Stopwatch]::StartNew()
        $idle = [Diagnostics.Stopwatch]::StartNew()
        $lastBytes = 0
        $assetSources = @{}
        while (!$child.WaitForExit(1000)) {
            if ($IdleLimit) {
                $bytes = (Get-Item -LiteralPath $stdout).Length + (Get-Item -LiteralPath $stderr).Length
                if ($bytes -ne $lastBytes) {
                    $lastBytes = $bytes
                    $idle.Restart()
                    if ($ReportAssets) { Write-AssetSources $stderr $assetSources }
                }
            }
            if ($total.Elapsed.TotalSeconds -ge $Limit -or ($IdleLimit -and $idle.Elapsed.TotalSeconds -ge $IdleLimit)) {
                return 'timeout'
            }
        }
        if ($ReportAssets) { Write-AssetSources $stderr $assetSources }
        if ($child.ExitCode -eq 0) {
            if ($Output) { $Output.Value = Get-Content -LiteralPath $stdout -Raw }
            return 'ok'
        }

        $diagnostics = (Get-Content -LiteralPath $stderr, $stdout -Tail 40) -join "`n"
        switch -Regex ($diagnostics) {
            'WinError 112|Errno 28|No space left' { return 'disk' }
            'WinError (32|33)\]|being used by another process' { return 'busy' }
            'WinError 5\]|Errno 13|Permission denied|Access is denied' { return 'permission' }
            'curl: \(28\)' { return 'timeout' }
            'ReadTimeout|ConnectTimeout|timed out|ConnectionError|SSLError|ProxyError|Failed to establish a new connection|curl: \((5|6|7|35|56|60)\)' { return 'network' }
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

function Get-SystemProxyOptions([uri]$Destination) {
    if ($env:HTTPS_PROXY -or $env:ALL_PROXY) { return }
    try {
        $settings = [Net.WebRequest]::GetSystemWebProxy()
        if (!$settings.IsBypassed($Destination)) {
            $proxy = $settings.GetProxy($Destination)
            if ($proxy.Scheme -in @('http', 'https') -and !$proxy.UserInfo) {
                return @('--proxy', $proxy.AbsoluteUri)
            }
        }
    } catch {
        # Fall back to curl's normal route when system settings are unavailable.
    }
}

function Find-Python {
    $candidates = @($Python)
    $launcher = Get-Command py.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($launcher -and $launcher.Source -notmatch '\\WindowsApps\\') {
        $candidates += @((Read-ProbeOutput $launcher.Source @('-0p')) -split '\r?\n' | ForEach-Object {
            if ($_ -match '([A-Z]:\\.*python\.exe)\s*$') { $Matches[1] }
        })
    }
    $candidates += @(Get-Command python.exe, python3.exe -All -CommandType Application -ErrorAction SilentlyContinue | ForEach-Object Source)
    $locations = @((Join-Path $env:LOCALAPPDATA 'Programs\Python'), $env:ProgramFiles, $env:SystemDrive + '\')
    foreach ($location in $locations) {
        $candidates += @(Get-ChildItem -LiteralPath $location -Directory -Filter 'Python3*' -ErrorAction SilentlyContinue |
            ForEach-Object { Join-Path $_.FullName 'python.exe' })
    }
    $candidates += @(Get-ChildItem -LiteralPath $runtime -Directory -ErrorAction SilentlyContinue |
        ForEach-Object { Join-Path $_.FullName 'python.exe' })

    foreach ($candidate in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
        if ($candidate -match '(?:^|[\\/])WindowsApps[\\/]' -or !(Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        $probe = 'import sys, struct, venv, ensurepip; assert (3, 10) <= sys.version_info[:2] < (3, 14) and struct.calcsize(''P'') == 8 and getattr(sys, ''_is_gil_enabled'', lambda: True)(); print(sys.version.split()[0])'
        $version = Read-ProbeOutput $candidate @('-I', '-B', '-S', '-c', $probe)
        if ($version -match '^\d+\.\d+\.\d+\s*$') {
            return @{ Path = $candidate; Version = $version.Trim() }
        }
    }
}

function Test-PythonArchive([string]$Archive, $Source) {
    $file = Get-Item -LiteralPath $Archive -ErrorAction SilentlyContinue
    return $file -and !$file.PSIsContainer -and $file.Length -eq $Source.bytes -and
        (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -eq $Source.sha256
}

function Install-PortablePython([string]$ArchivePath = $PythonArchive) {
    $sources = $config.pythonSources
    $localArchive = $null
    if ($ArchivePath) {
        Write-Host 'DSH_PDF_SETUP python-archive'
        $localArchive = (Resolve-Path -LiteralPath $ArchivePath).ProviderPath
        $sources = @($sources | Where-Object { Test-PythonArchive $localArchive $_ })
        if (!$sources) {
            Write-Host 'DSH_PDF_SETUP issue checksum'
            throw 'The local Python archive does not match an official archive listed in engine-config.json.'
        }
    } elseif ($Wheelhouse) {
        Write-Host 'DSH_PDF_SETUP python-archive'
        throw 'Offline dependency installation requires a local Python or -PythonArchive.'
    }

    Assert-SetupDirectory $runtime
    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    $scratch = Join-Path $root ('python-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    try {
        New-Item -ItemType Directory -Path $scratch | Out-Null
        foreach ($source in $sources) {
            $archive = $localArchive
            if (!$archive) {
                Write-Host "DSH_PDF_SETUP python-download $($source.id)"
                $archive = Join-Path $scratch ($source.id + '.archive')
                $options = @('--fail', '--location', '--silent', '--show-error', '--proto', '=https', '--proto-redir', '=https',
                    '--connect-timeout', '8', '--max-time', '120', '--retry', '1', '--retry-max-time', '140',
                    '--speed-limit', '2048', '--speed-time', '35', '--max-filesize', [string]$source.bytes, '--output', $archive)
                $options += @(Get-SystemProxyOptions $source.url)
                $result = Invoke-SetupProcess $curl ($options + $source.url) 150
                if ($result -ne 'ok') {
                    Write-Host "DSH_PDF_SETUP issue $result"
                    if ($result -in @('disk', 'permission')) { break }
                    continue
                }
                if (!(Test-PythonArchive $archive $source)) {
                    Write-Host 'DSH_PDF_SETUP issue checksum'
                    continue
                }
            }
            Write-Host "DSH_PDF_SETUP python-archive $($source.id)"
            $expanded = Join-Path $scratch $source.id
            New-Item -ItemType Directory -Path $expanded | Out-Null
            if ($source.id -eq 'nuget') {
                Add-Type -AssemblyName System.IO.Compression.FileSystem
                [IO.Compression.ZipFile]::ExtractToDirectory($archive, $expanded)
            } elseif ((Invoke-SetupProcess $tar @('-xf', $archive, '-C', $expanded) 90) -ne 'ok') {
                continue
            }
            $pythonDir = Join-Path $expanded $source.directory
            $pythonExe = Join-Path $pythonDir 'python.exe'
            if (!(Read-ProbeOutput $pythonExe @('-I', '-B', '-S', '-c', 'import venv, ensurepip; print("ok")'))) { continue }
            $destination = Join-Path $runtime ($source.id + '-' + $source.version)
            if (Test-Path -LiteralPath $destination) {
                # Never replace a base interpreter used by another virtual environment.
                $destination += '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
            }
            [IO.Directory]::Move($pythonDir, $destination)
            return (Join-Path $destination 'python.exe')
        }
        throw 'Could not prepare portable Python from an official archive.'
    } finally {
        Remove-SetupScratch $scratch
    }
}

function Get-Health([string]$Executable) {
    if (!(Test-Path -LiteralPath $Executable -PathType Leaf)) { return }
    $report = ''
    if ((Invoke-SetupProcess $Executable @('-I', '-B', $runner, '--dsh-health') 25 0 ([ref]$report)) -eq 'ok') {
        return (($report.Trim() -split '\r?\n')[-1] | ConvertFrom-Json)
    }
}

function Test-ExpectedVersion($Health) {
    return $Health.version -eq $config.pdf2zh -and $Health.babeldoc -eq $config.babeldoc
}

function Get-PipInstallArguments {
    return @('-I', '-m', 'pip', '--isolated', 'install', '--disable-pip-version-check', '--no-input',
        '--timeout', '30', '--retries', '3', '--only-binary=:all:',
        ('pdf2zh-next==' + $config.pdf2zh), ('BabelDOC==' + $config.babeldoc))
}

function Install-BundledWheels([string]$Source, [string]$Destination) {
    $python = Install-PortablePython (Join-Path $Source 'python.archive')
    $engineDir = Join-Path $Destination 'engine'
    $enginePython = Join-Path $engineDir 'Scripts\python.exe'
    Write-Output 'DSH_PDF_SETUP venv'
    if ((Invoke-SetupProcess $python @('-I', '-m', 'venv', $engineDir) 90 45) -ne 'ok') {
        throw 'Could not create the bundled virtual environment.'
    }
    Write-Output 'DSH_PDF_SETUP dependencies wheelhouse'
    $env:PIP_CONFIG_FILE = 'nul'
    $wheelArgs = (Get-PipInstallArguments) + @('--no-index', '--no-cache-dir', '--find-links', (Join-Path $Source 'wheels'))
    $result = Invoke-SetupProcess $enginePython $wheelArgs 1200 135
    if ($result -ne 'ok') {
        Write-Output "DSH_PDF_SETUP issue $result"
        throw 'Could not install the bundled wheel files.'
    }
    $env:DSH_PDF_ASSETS = Join-Path $Destination 'assets'
    [IO.Directory]::Move((Join-Path $Source 'assets'), $env:DSH_PDF_ASSETS)
    Write-Output 'DSH_PDF_SETUP verify'
    $health = Get-Health $enginePython
    if (!(Test-ExpectedVersion $health) -or !$health.resources) {
        throw 'The bundled engine or its resources failed verification.'
    }
    New-Item -ItemType File -Path (Join-Path $Destination '.ready') | Out-Null
}

function Install-BundledEngine {
    Write-Output 'DSH_PDF_SETUP bundled'
    $digest = $config.offlineRuntimeSha256
    $installOnTarget = $config.offlineRuntimeFormat -eq 'installer'
    $archiveName = if ($installOnTarget) { 'win32-x64.tar.xz' } else { 'win32-x64.zip' }
    $archive = Join-Path $PSScriptRoot ('runtime\' + $archiveName)
    if ($digest -cnotmatch '^[a-f0-9]{64}$' -or !(Test-Path -LiteralPath $archive -PathType Leaf) -or
        (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $digest) {
        Write-Output 'DSH_PDF_SETUP issue checksum'
        throw 'The bundled engine archive is missing or damaged.'
    }
    $destination = Join-Path $root ('offline-' + $digest.Substring(0, 12))
    Assert-SetupDirectory $destination
    $ready = Join-Path $destination '.ready'
    if ($installOnTarget -and (Test-Path -LiteralPath $ready -PathType Leaf)) {
        $env:DSH_PDF_ASSETS = Join-Path $destination 'assets'
        $health = Get-Health (Join-Path $destination 'engine\Scripts\python.exe')
        if ((Test-ExpectedVersion $health) -and $health.resources) { return }
    }
    $scratch = Join-Path $root ('offline-staging-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    try {
        if (Test-Path -LiteralPath $tar -PathType Leaf) {
            New-Item -ItemType Directory -Path $scratch | Out-Null
            if ((Invoke-SetupProcess $tar @('-xf', $archive, '-C', $scratch) 180) -ne 'ok') {
                throw 'Could not extract the bundled engine.'
            }
        } elseif (!$installOnTarget) {
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            [IO.Compression.ZipFile]::ExtractToDirectory($archive, $scratch)
        } else {
            throw 'Windows tar.exe is required to extract the offline setup archive.'
        }
        if ($installOnTarget) {
            Remove-SetupScratch $destination
            New-Item -ItemType Directory -Path $destination | Out-Null
            try {
                Install-BundledWheels $scratch $destination
            } finally {
                if (!(Test-Path -LiteralPath $ready -PathType Leaf)) { Remove-SetupScratch $destination }
            }
            Write-Output 'DSH_PDF_SETUP complete'
            return
        }
        Write-Output 'DSH_PDF_SETUP verify'
        $env:DSH_PDF_ASSETS = Join-Path $scratch 'assets'
        $health = Get-Health (Join-Path $scratch 'python\python.exe')
        if (!(Test-ExpectedVersion $health) -or !$health.resources) {
            throw 'The bundled engine or its resources failed verification.'
        }
        Remove-SetupScratch $destination
        [IO.Directory]::Move($scratch, $destination)
        Write-Output 'DSH_PDF_SETUP complete'
    } finally {
        Remove-SetupScratch $scratch
    }
}

function Test-WriteAccess {
    $destination = if (Test-Path -LiteralPath $root) { $root } else { $env:LOCALAPPDATA }
    $probe = Join-Path $destination ('.dsh-write-' + [guid]::NewGuid().ToString('N'))
    try {
        [IO.File]::WriteAllBytes($probe, [byte[]]@())
        [IO.File]::Delete($probe)
        return $true
    } catch { return $false }
}

function Test-Endpoint([string]$Url) {
    $options = @('--fail', '--location', '--silent', '--output', 'NUL', '--connect-timeout', '3', '--max-time', '4',
        '--proto', '=https', '--proto-redir', '=https')
    $options += @(Get-SystemProxyOptions $Url)
    & $curl @options $Url
    return $LASTEXITCODE -eq 0
}

if ($CheckOnly) {
    Write-Output "Windows architecture: $env:PROCESSOR_ARCHITECTURE"
    $selected = Find-Python
    if ($selected) { Write-Output "Python $($selected.Version): $($selected.Path)" }
    else { Write-Output 'No local 64-bit Python 3.10-3.13 found. The installer will prepare portable Python.' }
    $packages = Join-Path $engine 'Lib\site-packages'
    $checkedAssets = $assetCache
    if ($config.offlineRuntimeSha256 -cmatch '^[a-f0-9]{64}$') {
        $bundle = Join-Path $root ('offline-' + $config.offlineRuntimeSha256.Substring(0, 12))
        $engineFolder = if ($config.offlineRuntimeFormat -eq 'installer') { 'engine' } else { 'python' }
        $packages = Join-Path $bundle "$engineFolder\Lib\site-packages"
        $checkedAssets = Join-Path $bundle 'assets'
    }
    $pdf2zh = Get-ChildItem -LiteralPath $packages -Filter 'pdf2zh_next-*.dist-info' -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    $babeldoc = Get-ChildItem -LiteralPath $packages -Filter 'babeldoc-*.dist-info' -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pdf2zh) { Write-Output ('PDFMathTranslate-next: ' + ($pdf2zh.Name -replace '^pdf2zh_next-|\.dist-info$')) }
    else { Write-Output 'PDFMathTranslate-next: not installed in the managed environment' }
    if ($babeldoc) { Write-Output ('BabelDOC: ' + ($babeldoc.Name -replace '^babeldoc-|\.dist-info$')) }
    $model = Test-Path -LiteralPath (Join-Path $checkedAssets 'models\doclayout_yolo_docstructbench_imgsz1024.onnx') -PathType Leaf
    $fonts = @(Get-ChildItem -LiteralPath (Join-Path $checkedAssets 'fonts') -File -ErrorAction SilentlyContinue |
        Where-Object Extension -in @('.ttf', '.otf', '.ttc', '.woff', '.woff2')).Count
    Write-Output "Managed cache: $checkedAssets"
    Write-Output "Layout model cached: $model"
    Write-Output "Cached fonts: $fonts"
    return
}

foreach ($key in @(Get-ChildItem Env: | Where-Object Name -match '^(PDF2ZH_|PDF_TRANSLATE_|DSH_PDF_(ASSETS|ASSET_MIRROR|RESTORE_ASSETS)$)')) {
    Remove-Item -LiteralPath ('Env:' + $key.Name)
}

if ($Doctor) {
    if (Test-WriteAccess) { Write-Output 'DSH_PDF_DOCTOR write ok' } else { Write-Output 'DSH_PDF_DOCTOR write failed' }
    if ($config.offlineRuntimeSha256) { return }
    $selected = Find-Python
    if ($selected) {
        Write-Output 'DSH_PDF_DOCTOR python ok'
        Write-Output "DSH_PDF_DOCTOR pythonVersion $($selected.Version)"
    } else { Write-Output 'DSH_PDF_DOCTOR python missing' }
    foreach ($source in $config.pipSources) {
        if (Test-Endpoint ($source.url + '/pdf2zh-next/')) {
            Write-Output "DSH_PDF_DOCTOR pip $($source.id)"
            break
        }
    }
    if (Test-Endpoint 'https://www.modelscope.cn/datasets/awwaawwa/BabelDOCAssets/resolve/master/font_metadata.json') {
        Write-Output 'DSH_PDF_DOCTOR assets modelscope'
    } elseif (Test-Endpoint 'https://huggingface.co/datasets/awwaawwa/BabelDOC-Assets/resolve/main/font_metadata.json?download=true') {
        Write-Output 'DSH_PDF_DOCTOR assets huggingface'
    }
    return
}

Write-Output "PDFMathTranslate-next $($config.pdf2zh) + BabelDOC $($config.babeldoc) (AGPL-3.0)"
Write-Output 'Python: reuses compatible local Python or downloads portable Python from the official Python NuGet package or Astral release.'
Write-Output 'Portable Python includes the PSF license and Windows binary terms.'
Write-Output ('Package sources: ' + ($config.pipSources.url -join ', '))
Write-Output "Destination: $root"
if (!$Yes -and (Read-Host 'Download and install these components? [y/N]') -notmatch '^(y|yes)$') { return }

Write-Output 'DSH_PDF_SETUP check'
$enginePython = Join-Path $engine 'Scripts\python.exe'
New-Item -ItemType Directory -Path $root -Force | Out-Null
try {
    $lock = [IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
} catch [IO.IOException] {
    Write-Output 'DSH_PDF_SETUP locked'
    throw
}

$installing = $engine + '.installing'
try {
    if ($config.offlineRuntimeSha256) {
        Install-BundledEngine
        return
    }
    Assert-SetupDirectory $engine
    Assert-SetupDirectory $assetCache
    $env:DSH_PDF_ASSETS = $assetCache
    if (!$env:HF_ENDPOINT) { $env:HF_ENDPOINT = $config.assetMirror }
    $env:HF_HUB_DISABLE_TELEMETRY = '1'
    $health = Get-Health $enginePython
    New-Item -ItemType File -Path $installing -Force | Out-Null
    if (!(Test-ExpectedVersion $health)) {
        $baseExecutable = (Find-Python).Path
        if (!$baseExecutable) {
            $baseExecutable = Install-PortablePython
        }
        Write-Output 'DSH_PDF_SETUP venv'
        if ((Invoke-SetupProcess $baseExecutable @('-I', '-m', 'venv', $engine) 90 45) -ne 'ok') {
            Remove-SetupScratch $engine
            if ((Invoke-SetupProcess $baseExecutable @('-I', '-m', 'venv', $engine) 90 45) -ne 'ok') { throw 'Could not create the virtual environment.' }
        }

        $env:PIP_CONFIG_FILE = 'nul'
        $pipArgs = (Get-PipInstallArguments) + @('--cache-dir', (Join-Path $root 'pip-cache'))
        $sources = if ($Wheelhouse) { @(@{id='wheelhouse'; url=$Wheelhouse}) } else { $config.pipSources }
        foreach ($source in $sources) {
            Write-Output "DSH_PDF_SETUP dependencies $($source.id)"
            $options = if ($Wheelhouse) { @('--no-index', '--find-links', $source.url) } else { @('--index-url', $source.url) }
            $result = Invoke-SetupProcess $enginePython ($pipArgs + $options) 1200 135
            if ($result -eq 'ok') { break }
            Write-Output "DSH_PDF_SETUP issue $result"
            if ($result -in @('disk', 'permission', 'busy')) { break }
        }
        if ($result -ne 'ok') { throw 'The engine dependencies could not be installed.' }
    }

    if ($OfflineAssets) {
        Write-Output 'DSH_PDF_SETUP assets offline'
        $env:DSH_PDF_RESTORE_ASSETS = (Resolve-Path -LiteralPath $OfflineAssets).ProviderPath
    } else { Write-Output 'DSH_PDF_SETUP assets' }
    $result = Invoke-SetupProcess $enginePython @('-I', '-B', $runner, '--dsh-warmup') 1200 180 -ReportAssets
    if ($result -ne 'ok') {
        Write-Output "DSH_PDF_SETUP issue $result"
        throw 'The BabelDOC assets could not be prepared.'
    }
    Write-Output 'DSH_PDF_SETUP verify'
    $health = Get-Health $enginePython
    if (!(Test-ExpectedVersion $health) -or !$health.resources) { throw 'The engine or its assets failed verification.' }
    Write-Output 'DSH_PDF_SETUP complete'
} finally {
    Remove-Item -LiteralPath $installing -Force -ErrorAction SilentlyContinue
    $lock.Dispose()
}
