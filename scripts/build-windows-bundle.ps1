[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PythonPackage,
    [Parameter(Mandatory)][string]$Wheelhouse,
    [Parameter(Mandatory)][string]$AssetCache,
    [Parameter(Mandatory)][string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).ProviderPath
$pythonArchive = (Resolve-Path -LiteralPath $PythonPackage).ProviderPath
$wheelDirectory = (Resolve-Path -LiteralPath $Wheelhouse).ProviderPath
$assetDirectory = (Resolve-Path -LiteralPath $AssetCache).ProviderPath
$expectedHash = 'DCE409744B088F94C6E37BA41F8100C384C27E029E843237364C602D30D475E5'
if ((Get-FileHash -LiteralPath $pythonArchive -Algorithm SHA256).Hash -ne $expectedHash) {
    throw 'Expected the official Python 3.13.17 NuGet package for Windows x64.'
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$output = (Resolve-Path -LiteralPath $OutputDirectory).ProviderPath
$temp = (Resolve-Path -LiteralPath ([IO.Path]::GetTempPath())).ProviderPath
$scratch = Join-Path $temp ('db-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$stage = Join-Path $scratch 'package'
New-Item -ItemType Directory -Path $stage | Out-Null
try {
    foreach ($file in @('package.json', 'README.md', 'LICENSE', 'plugins', 'docs')) {
        Copy-Item -LiteralPath (Join-Path $repo $file) -Destination $stage -Recurse
    }
    $runtime = Join-Path $scratch 'runtime'
    New-Item -ItemType Directory -Path $runtime | Out-Null
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $nuget = Join-Path $scratch 'nuget'
    [IO.Compression.ZipFile]::ExtractToDirectory($pythonArchive, $nuget)
    $pythonDirectory = Join-Path $runtime 'python'
    Copy-Item -LiteralPath (Join-Path $nuget 'tools') -Destination $pythonDirectory -Recurse
    $python = Join-Path $pythonDirectory 'python.exe'
    & $python -I -B -m pip --isolated --disable-pip-version-check --no-input install --quiet --no-warn-script-location --no-index --no-compile --find-links $wheelDirectory 'pdf2zh-next==2.10.2' 'babeldoc==0.7.1'
    if ($LASTEXITCODE) { throw 'Could not assemble the engine from the supplied Windows wheels.' }

    $verifyAssets = Join-Path $scratch 'copy-assets.py'
    @'
import hashlib
import shutil
import sys
from pathlib import Path

from babeldoc.assets.assets import generate_all_assets_file_list

source, target = map(Path, sys.argv[1:])
for group, entries in generate_all_assets_file_list().items():
    directory = target / group
    directory.mkdir(parents=True, exist_ok=True)
    for entry in entries:
        file = source / group / entry["name"]
        with file.open("rb") as stream:
            if hashlib.file_digest(stream, "sha3_256").hexdigest() != entry["sha3_256"]:
                raise ValueError(f"Unexpected digest for {file}")
        shutil.copyfile(file, directory / file.name)
'@ | Set-Content -LiteralPath $verifyAssets -Encoding utf8
    & $python -I -B $verifyAssets $assetDirectory (Join-Path $runtime 'assets')
    if ($LASTEXITCODE) { throw 'The cache does not contain all verified BabelDOC 0.7.1 resources.' }

    $payload = Join-Path $stage 'plugins\pdf-paper-translator\runtime'
    New-Item -ItemType Directory -Path $payload | Out-Null
    [IO.Compression.ZipFile]::CreateFromDirectory($runtime, (Join-Path $payload 'win32-x64.zip'))
    # The runtime belongs only in the separate bundle staged by this script.
    $manifestPath = Join-Path $stage 'package.json'
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $manifest.files += 'plugins/pdf-paper-translator/runtime/win32-x64.zip'
    $manifest | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath $manifestPath -Encoding utf8
    $pack = npm.cmd pack $stage --ignore-scripts --json --pack-destination $scratch | ConvertFrom-Json
    if ($LASTEXITCODE) { throw 'Could not package the bundled plugin.' }
    $artifact = Join-Path $output "$($manifest.name)-$($manifest.version)-windows-x64.tgz"
    Copy-Item -LiteralPath (Join-Path $scratch $pack.filename) -Destination $artifact
    Write-Output $artifact
} finally {
    $resolved = (Resolve-Path -LiteralPath $scratch -ErrorAction SilentlyContinue).ProviderPath
    if ($resolved -and $resolved.StartsWith($temp.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
