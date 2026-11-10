$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$root = Join-Path $env:LOCALAPPDATA 'DshPdfTranslate'
$archivePath = Join-Path $PSScriptRoot 'runtime\win32-x64.zip'
$bundleDir = Join-Path $root 'bundle-0.1.3'
$upstreamDir = Join-Path $root 'upstream-2.10.2-babeldoc-0.7.1'
$upstreamZip = $upstreamDir + '.zip'
$upstreamBytes = 607049119
$upstreamHash = '7AC1811B0F82078A86BCCE88E185EFFF75FC55A3752C7F9C015186E5214B3C0B'
$upstreamUrl = 'https://github.com/PDFMathTranslate-next/PDFMathTranslate-next/releases/download/v2.10.2/pdf2zh-v2.10.2-BabelDOC-v0.7.1-with-assets-win64.zip'
$lockPath = Join-Path $root 'portable-setup.lock'
$curl = Join-Path $env:SystemRoot 'System32\curl.exe'
$taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'

function Remove-SetupScratch([string]$Directory) {
    $parent = (Resolve-Path -LiteralPath $root).ProviderPath.TrimEnd('\') + '\'
    $target = (Resolve-Path -LiteralPath $Directory -ErrorAction SilentlyContinue).ProviderPath
    if ($target -and $target.StartsWith($parent, [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Assert-SetupDirectory([string]$Directory) {
    if (Test-Path -LiteralPath $Directory) {
        $item = Get-Item -LiteralPath $Directory -Force
        if (!$item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -or
            $item.Parent.FullName -ne (Resolve-Path -LiteralPath $root).ProviderPath) {
            throw 'The engine directory must be a regular directory inside the plugin data folder.'
        }
    }
}

function Invoke-SetupProcess([string]$Executable, [string[]]$Arguments, [int]$Limit, [int]$IdleLimit = 0) {
    $stdout = $lockPath + '.stdout'
    $stderr = $lockPath + '.stderr'
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

        $diagnostics = (Get-Content -LiteralPath $stderr, $stdout -Tail 40) -join "`n"
        switch -Regex ($diagnostics) {
            'WinError 112|Errno 28|No space left' { return 'disk' }
            'WinError (32|33)\]|being used by another process' { return 'busy' }
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

function Test-BundledEngine([string]$Directory) {
    return (Test-Path -LiteralPath (Join-Path $Directory 'python\python.exe') -PathType Leaf) -and
        (Test-Path -LiteralPath (Join-Path $Directory 'assets\models\doclayout_yolo_docstructbench_imgsz1024.onnx') -PathType Leaf)
}

function Install-BundledEngine {
    if (Test-BundledEngine $bundleDir) { return }
    Write-Output 'DSH_PDF_SETUP bundled'
    Assert-SetupDirectory $bundleDir
    $scratch = Join-Path $root ('bundle-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [IO.Compression.ZipFile]::ExtractToDirectory($archivePath, $scratch)
        if (!(Test-BundledEngine $scratch)) { throw 'The bundled engine is incomplete.' }
        Write-Output 'DSH_PDF_SETUP verify'
        $python = Join-Path $scratch 'python\python.exe'
        $probe = @('-I', '-B', '-c', '"import onnxruntime, pymupdf, pdf2zh_next"')
        if ((Invoke-SetupProcess $python $probe 60) -ne 'ok') { throw 'The bundled engine could not start.' }
        Remove-SetupScratch $bundleDir
        [IO.Directory]::Move($scratch, $bundleDir)
    } finally {
        Remove-SetupScratch $scratch
    }
}

function Get-UpstreamArchive {
    Write-Output 'DSH_PDF_SETUP download'
    $length = 0
    if (Test-Path -LiteralPath $upstreamZip) {
        $archive = Get-Item -LiteralPath $upstreamZip -Force
        if ($archive.PSIsContainer -or ($archive.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            throw 'The download path must be a regular file.'
        }
        $length = $archive.Length
        if ($length -gt $upstreamBytes) {
            Remove-Item -LiteralPath $upstreamZip
            $length = 0
        }
    }

    if ($length -lt $upstreamBytes) {
        $options = @('--fail', '--location', '--silent', '--show-error', '--proto', '=https', '--proto-redir', '=https',
            '--connect-timeout', '12', '--max-time', '900', '--speed-limit', '1024', '--speed-time', '75',
            '--max-filesize', [string]$upstreamBytes, '--output', $upstreamZip)
        $resume = if ($length -gt 0) { @('--continue-at', '-') } else { @() }
        & $curl @options @resume $upstreamUrl
        $downloadExitCode = $LASTEXITCODE
        if ($downloadExitCode -eq 33 -and $length -gt 0) {
            Remove-Item -LiteralPath $upstreamZip
            & $curl @options $upstreamUrl
            $downloadExitCode = $LASTEXITCODE
        }
        if ($downloadExitCode -ne 0) {
            $reason = switch ($downloadExitCode) { 23 { 'disk' } 28 { 'timeout' } default { 'network' } }
            Write-Output "DSH_PDF_SETUP issue $reason"
            throw 'The upstream package could not be downloaded.'
        }
    }

    if ((Get-Item -LiteralPath $upstreamZip).Length -ne $upstreamBytes -or
        (Get-FileHash -LiteralPath $upstreamZip -Algorithm SHA256).Hash -ne $upstreamHash) {
        Remove-Item -LiteralPath $upstreamZip
        Write-Output 'DSH_PDF_SETUP issue checksum'
        throw 'The upstream package did not match the pinned release digest.'
    }
}

function Install-UpstreamEngine {
    Assert-SetupDirectory $upstreamDir
    Get-UpstreamArchive
    Write-Output 'DSH_PDF_SETUP unpack'
    $scratch = Join-Path $root ('up-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [IO.Compression.ZipFile]::ExtractToDirectory($upstreamZip, $scratch)
        $distribution = $scratch
        if (!(Test-Path -LiteralPath (Join-Path $distribution 'runtime') -PathType Container)) {
            $directories = @(Get-ChildItem -LiteralPath $scratch -Directory)
            if ($directories.Count -eq 1) { $distribution = $directories[0].FullName }
        }
        $embedded = Join-Path $distribution 'runtime'
        $sitePackages = Join-Path $distribution 'site-packages'
        $assetsZip = @(Get-ChildItem -LiteralPath $distribution -Filter 'offline_assets_*.zip' -File)
        if (!(Test-Path -LiteralPath (Join-Path $embedded 'python.exe') -PathType Leaf) -or
            !(Test-Path -LiteralPath (Join-Path $sitePackages 'pdf2zh_next') -PathType Container) -or $assetsZip.Count -ne 1) {
            throw 'The official Windows package is missing its Python, engine or offline assets.'
        }

        $prepared = Join-Path $scratch 'prepared'
        New-Item -ItemType Directory -Path $prepared | Out-Null
        $pythonDir = Join-Path $prepared 'python'
        [IO.Directory]::Move($embedded, $pythonDir)
        [IO.Directory]::Move($sitePackages, (Join-Path $pythonDir 'site-packages'))
        $embeddedPath = Join-Path $pythonDir 'python313._pth'
        if (Test-Path -LiteralPath $embeddedPath -PathType Leaf) {
            $modulePaths = @(Get-Content -LiteralPath $embeddedPath) + 'site-packages'
            Set-Content -LiteralPath $embeddedPath -Value $modulePaths -Encoding ASCII
        }
        [IO.Compression.ZipFile]::ExtractToDirectory($assetsZip[0].FullName, (Join-Path $prepared 'assets'))
        if (!(Test-BundledEngine $prepared)) { throw 'The extracted offline assets are incomplete.' }

        Write-Output 'DSH_PDF_SETUP verify'
        $python = Join-Path $pythonDir 'python.exe'
        $probe = @('-I', '-B', '-c', '"import onnxruntime, pymupdf, pdf2zh_next; from importlib.metadata import version; assert version(''pdf2zh-next'') == ''2.10.2'' and version(''BabelDOC'') == ''0.7.1''"')
        if ((Invoke-SetupProcess $python $probe 60) -ne 'ok') { throw 'The official engine could not start.' }
        Remove-SetupScratch $upstreamDir
        [IO.Directory]::Move($prepared, $upstreamDir)
        Remove-Item -LiteralPath $upstreamZip -ErrorAction SilentlyContinue
    } finally {
        Remove-SetupScratch $scratch
    }
}

Write-Output 'DSH_PDF_SETUP check'
New-Item -ItemType Directory -Path $root -Force | Out-Null
try {
    $lock = [IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None')
} catch [IO.IOException] {
    Write-Output 'DSH_PDF_SETUP locked'
    throw
}

try {
    if ((Test-BundledEngine $bundleDir) -or (Test-BundledEngine $upstreamDir)) { return }
    if (Test-Path -LiteralPath $archivePath -PathType Leaf) { Install-BundledEngine }
    else { Install-UpstreamEngine }
} finally {
    $lock.Dispose()
}
