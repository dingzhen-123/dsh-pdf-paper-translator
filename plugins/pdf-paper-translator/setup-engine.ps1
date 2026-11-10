param([string]$Python = 'python')
$ErrorActionPreference = 'Stop'
$engineDir = Join-Path $env:LOCALAPPDATA 'DshPdfTranslate\engine-2.10.2'
$enginePython = Join-Path $engineDir 'Scripts\python.exe'

if (!(Test-Path -LiteralPath $enginePython)) {
    & $Python -m venv $engineDir
    if ($LASTEXITCODE) { throw '创建 Python 虚拟环境失败。请使用 Python 3.12 或 3.13。' }
}
& $enginePython -m pip --isolated install --index-url https://pypi.org/simple --disable-pip-version-check 'pdf2zh-next==2.10.2'
if ($LASTEXITCODE) { throw '安装 PDFMathTranslate-next 失败。' }
& (Join-Path $engineDir 'Scripts\pdf2zh_next.exe') --version
if ($LASTEXITCODE) { throw 'PDFMathTranslate-next 无法启动。' }
