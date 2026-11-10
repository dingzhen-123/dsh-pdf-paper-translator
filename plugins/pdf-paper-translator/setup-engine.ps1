param([string]$Python)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = Join-Path $env:LOCALAPPDATA 'DshPdfTranslate'
$engineDir = Join-Path $root 'engine-2.10.2'
$enginePython = Join-Path $engineDir 'Scripts\python.exe'
$engine = Join-Path $engineDir 'Scripts\pdf2zh_next.exe'
$marker = $engineDir + '.installing'

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
        $uri = "https://api.nuget.org/v3-flatcontainer/python/$version/python.$version.nupkg"
        $curl = Join-Path $env:SystemRoot 'System32\curl.exe'
        & $curl --fail --location --silent --show-error --retry 2 --connect-timeout 20 --max-time 120 --output $archive $uri
        if ($LASTEXITCODE) { throw 'Could not download the Python runtime.' }
        $expected = 'DCE409744B088F94C6E37BA41F8100C384C27E029E843237364C602D30D475E5'
        if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expected) {
            throw 'Python archive checksum mismatch.'
        }
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $unpacked = Join-Path $scratch 'unpacked'
        [IO.Compression.ZipFile]::ExtractToDirectory($archive, $unpacked)
        [IO.Directory]::Move((Join-Path $unpacked 'tools'), $runtime)
        return $executable
    } finally {
        Remove-Item -LiteralPath $scratch -Recurse -Force -ErrorAction SilentlyContinue
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
    if (!(Test-Path -LiteralPath $marker) -and (Test-Path -LiteralPath $engine) -and
        (Test-Path -LiteralPath $enginePython)) { return }
    New-Item -ItemType File -Path $marker -Force | Out-Null

    Write-Output 'DSH_PDF_SETUP python'
    if (!(Find-Python $enginePython)) {
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

    Write-Output 'DSH_PDF_SETUP packages'
    $pip = @('-m', 'pip', '--isolated', 'install', '--disable-pip-version-check', '--retries', '1', '--timeout', '20')
    & $enginePython @pip --index-url https://pypi.org/simple 'pdf2zh-next==2.10.2'
    if ($LASTEXITCODE) {
        & $enginePython @pip --index-url https://pypi.tuna.tsinghua.edu.cn/simple 'pdf2zh-next==2.10.2'
    }
    if ($LASTEXITCODE) { throw 'Could not install PDFMathTranslate-next.' }

    Write-Output 'DSH_PDF_SETUP verify'
    & $engine --version
    if ($LASTEXITCODE) { throw 'PDFMathTranslate-next could not start.' }
    Remove-Item -LiteralPath $marker
} finally {
    $lock.Dispose()
}
