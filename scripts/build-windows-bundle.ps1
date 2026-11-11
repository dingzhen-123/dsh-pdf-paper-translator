[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$RuntimeArchive,
    [Parameter(Mandatory)][string]$OutputDirectory,
    [switch]$InstallOnTarget
)

$ErrorActionPreference = 'Stop'
$repo = (Get-Item -LiteralPath (Join-Path $PSScriptRoot '..')).FullName
$archive = Get-Item -LiteralPath $RuntimeArchive
$output = (Get-Item -LiteralPath $OutputDirectory).FullName
$temp = (Get-Item -LiteralPath ([IO.Path]::GetTempPath())).FullName
$scratch = Join-Path $temp ('dsh-offline-pack-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$stage = Join-Path $scratch 'package'
New-Item -ItemType Directory -Path $stage | Out-Null

try {
    foreach ($file in @('package.json', 'README.md', 'LICENSE', 'NOTICE', 'THIRD-PARTY.md', 'third-party', 'plugins', 'docs')) {
        Copy-Item -LiteralPath (Join-Path $repo $file) -Destination $stage -Recurse
    }
    $plugin = Join-Path $stage 'plugins\pdf-paper-translator'
    $configPath = Join-Path $plugin 'engine-config.json'
    $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    $digest = (Get-FileHash -LiteralPath $archive.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $config | Add-Member -NotePropertyName offlineRuntimeSha256 -NotePropertyValue $digest -Force
    if ($InstallOnTarget) {
        $config | Add-Member -NotePropertyName offlineRuntimeFormat -NotePropertyValue 'installer' -Force
    }
    [IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 16))

    $runtimeName = if ($InstallOnTarget) { 'win32-x64.tar.xz' } else { 'win32-x64.zip' }
    $payload = Join-Path $plugin 'runtime'
    New-Item -ItemType Directory -Path $payload | Out-Null
    Copy-Item -LiteralPath $archive.FullName -Destination (Join-Path $payload $runtimeName)
    $manifestPath = Join-Path $stage 'package.json'
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $manifest | Add-Member -NotePropertyName private -NotePropertyValue $true -Force
    $manifest.files += 'plugins/pdf-paper-translator/runtime/' + $runtimeName
    [IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 16))

    $suffix = if ($InstallOnTarget) { 'offline-setup' } else { 'offline' }
    $artifact = Join-Path $output "$($manifest.name)-$($manifest.version)-windows-x64-$suffix.tgz"
    if (Test-Path -LiteralPath $artifact) { throw "Output file already exists: $artifact" }
    $pack = npm.cmd pack $stage --ignore-scripts --json --pack-destination $scratch | ConvertFrom-Json
    if ($LASTEXITCODE -or !$pack.filename) { throw 'Could not package the offline plugin.' }
    Copy-Item -LiteralPath (Join-Path $scratch $pack.filename) -Destination $artifact
    $artifactDigest = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText((Join-Path $output 'SHA256SUMS.txt'),
        $artifactDigest + '  ' + [IO.Path]::GetFileName($artifact) + [Environment]::NewLine)
    Write-Output $artifact
} finally {
    $item = Get-Item -LiteralPath $scratch -Force -ErrorAction SilentlyContinue
    if ($item -and $item.PSIsContainer -and !($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -and
        $item.Parent.FullName -eq $temp) {
        Remove-Item -LiteralPath $item.FullName -Recurse -Force
    }
}
