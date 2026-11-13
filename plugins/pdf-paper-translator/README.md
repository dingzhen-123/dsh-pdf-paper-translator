# PDF Paper Translator for DeepSeek Harness

在 Harness 左侧打开「PDF 文献翻译」。可以一次选择多份 PDF，或把文件拖到翻译页面任意位置。文件按加入顺序排队，可以移除尚未开始的文献。点击「翻译模型」可搜索和选择 Harness 聊天目录中的模型，初始使用 Harness 的默认模型。模型自动判断原文语言，目标语言默认简体中文。页码留空时翻译全文，也可以输入 `1-3,5`。成品可选择仅译文，或按「原文第 1 页、译文第 1 页」交替排列。

「输出文件夹」默认是用户目录下的 `Downloads`。可以点击「更改…」选择文件夹，也可以直接输入本机路径。插件会记住路径。点击「开始翻译」后，队列共用同一套设置，依次处理。每完成一篇，PDF 就自动保存并列在「输出文件」里，点击文件名即可打开。同名结果会加序号；单篇失败会显示原因，队列继续处理后面的文献。

面板底部显示当前文献的生成阶段、进度和 API 用量。模型返回分项用量后，环形图展示未缓存输入、输出和缓存读写的占比，并列出各项 token 数、总量和请求次数。实际额度扣减由所选模型提供方计量。处理时仍可追加文件。点击「停止队列」会取消当前翻译，保留已完成的结果和尚未开始的文献。

点击「定时翻译」可按北京时间设置开始时间，查看 DeepSeek 官方 API 的错峰定价时段。定时后可以修改时间、取消或立即开始。定时任务可在 Harness 其他页面等待并执行。请保持电脑唤醒，退出或重启 Harness 会清除定时。

点击「联系作者」可扫码关注公众号「多功能复材研究进展」，获取插件下载和版本更新，也可以访问作者的 Bilibili 主页交流使用问题。

## 工作方式

插件在本机调用 PDFMathTranslate-next / BabelDOC 解析页面并重排译文，尽量保留公式和图表。排版引擎通过仅绑定回环地址的一次性接口，把待译文本交给本次选择的模型。PDF 文件交给本机排版进程，提取出的文本由该模型服务处理，使用量由所选模型提供方计入。

检测到的参考文献章节保留原文。同一台电脑可以复用此前生成的译文缓存，公开安装包不含个人缓存。

单份文件最大 60 MB。任务的中间文件保存在系统临时目录，处理完成后清理。手动开始的任务请保持翻译面板打开。扫描件需先 OCR。复杂版面、带密码的文件和损坏的 PDF 可能需要先行处理。

## Windows 安装

### 图形界面

在「插件 → 添加插件」输入包名并点击「安装」。

~~~text
dsh-pdf-paper-translator
~~~

也可以粘贴 GitHub 仓库地址。

~~~text
https://github.com/dingzhen-123/dsh-pdf-paper-translator
~~~

安装完成后可在「已安装」里启用插件。如果当前配置装有旧包 `@dingzhen-123/dsh-pdf-paper-translator` 或开发版 `@local/dsh-pdf-translate`，请先卸载旧包，再安装新版。

### 命令行

安装示例使用 DeepSeek Harness Desktop 的 `desktop` 配置，安装命令已用 0.2.1-rc.5 随附的 CLI 验证。若 `dsh` 未加入 PATH，使用 Harness 安装目录下的 `resources\runtime\cli\bin\dsh.cmd` 完整路径。

先完全退出 Harness，再运行以下命令。

~~~powershell
dsh plugin --profile desktop add dsh-pdf-paper-translator
~~~

若要通过 GitHub 安装，把命令中的包名换成上面的完整仓库地址。

### 排版引擎

使用 Windows x64 离线安装包时，安装并启用插件后打开面板。插件会从包内解出便携 Python、wheel 和排版资源，在当前电脑上创建独立环境、离线安装依赖并完成自检。译文由 Harness 中所选模型生成。在线模型仍需要联网。

Windows x64 用户打开侧栏后，点击「确认安装」。首次安装需要联网，面板会显示各阶段。完成自检后，直接点击「开始翻译」即可。「环境检测」可选，用于查看 Python、引擎、资源、网络和目录写入权限。

1. 在 Python Launcher、PATH 和常见安装位置中查找 64 位 Python 3.10–3.13，并跳过 WindowsApps 占位程序。缺少兼容版本时自动获取便携 Python，优先使用 Python 官方 NuGet，备用源为 Astral 官方发行。插件在解包前校验 SHA-256，并把便携版放在当前用户的插件数据目录下。 [Python Windows 文档](https://docs.python.org/3.13/using/windows.html#the-nuget-org-packages)
2. 在 `%LOCALAPPDATA%\DshPdfTranslate\engine-2.10.2` 创建虚拟环境，安装 PDFMathTranslate-next 2.10.2 和 BabelDOC 0.7.1。Python 软件源按清华、阿里云、PyPI 顺序尝试。
3. 调用 BabelDOC 原生预热函数。BabelDOC 并发探测 GitHub、Hugging Face 和 ModelScope，版面模型通过 Hugging Face 或 ModelScope 下载。面板显示本次实际选中的字体来源和成功下载模型的来源。资源缓存位于 `%LOCALAPPDATA%\DshPdfTranslate\assets-0.7.1`。若预热失败，可重试或导入离线资源 ZIP。
4. 核对版本、Python 模块和资源摘要后，面板才会开放翻译。旧版本留下的引擎也会先做同样的自检。

### 命令行与离线准备

以下命令用于批量部署或内网安装，从仓库根目录执行。

~~~powershell
$plugin = Join-Path (Get-Location) 'plugins\pdf-paper-translator'
& (Join-Path $plugin 'setup-engine.ps1') -CheckOnly
& (Join-Path $plugin 'setup-engine.ps1') -Doctor
& (Join-Path $plugin 'setup-engine.ps1') -Yes
~~~

`-CheckOnly` 只读取本机 Python、已安装的引擎版本、缓存模型和字体数量。`-Doctor` 还会检测网络和安装目录写入权限。去掉 `-Yes` 会在安装前等待确认。

在已完成安装的机器上，可以用 BabelDOC 生成资源 ZIP。保留生成的 `offline_assets_<摘要>.zip` 文件名。

~~~powershell
$root = Join-Path $env:LOCALAPPDATA 'DshPdfTranslate'
$python = Join-Path $root 'engine-2.10.2\Scripts\python.exe'
$env:DSH_PDF_ASSETS = Join-Path $root 'assets-0.7.1'
& $python -I -B (Join-Path $plugin 'pdf-progress.py') --dsh-generate-assets (Get-Location).Path
& $python -I -B (Join-Path $plugin 'pdf-progress.py') --dsh-check-fonts
~~~

在目标机器导入 ZIP 时，安装器会校验每项资源。有本机 Python 时可只传 `-OfflineAssets`，依赖仍可联网安装。完全离线时，在联网的同架构、同 Python 小版本的 Windows 机器上用 `pip download --only-binary=:all:` 下载两项固定版本及其全部依赖，目标机用 `-Offline` 或 `-Wheelhouse` 指向该目录。没有 Python 时，再用 `-PythonArchive` 提供 `engine-config.json` 中任一官方归档。

~~~powershell
& (Join-Path $plugin 'setup-engine.ps1') -Yes -OfflineAssets 'D:\transfer\offline_assets_<摘要>.zip' -Offline 'D:\transfer\wheels' -PythonArchive 'D:\transfer\python.3.13.17.nupkg'
~~~

### 外部引擎

也可在启动 Harness 前把 `DSH_PDF2ZH_PATH` 设为兼容的 `pdf2zh_next` 可执行文件的绝对路径。外部引擎须报告 2.10.2，资源由其安装程序准备。插件使用 `--lang-in`、`--lang-out`、`--pages`、`--openaicompatible`、`--no-mono`、`--no-dual`、`--use-alternating-pages-dual` 等命令行参数，完整调用见 `engine.js`。

macOS 或 Linux 可用本机 Python 3.10–3.13 创建虚拟环境，在其中安装 `pdf2zh-next==2.10.2` 和 `BabelDOC==0.7.1`，再运行虚拟环境中的 `pdf2zh_next --warmup --disable-config-auto-save`。预热完成后，把 `DSH_PDF2ZH_PATH` 指向虚拟环境的 `bin/pdf2zh_next`。

## 许可与依赖

插件源码采用 AGPL-3.0。插件安装包包含源码、文档和安装脚本。排版组件由本机安装器从上游取得。 [项目许可](../../LICENSE) · [第三方组件](../../THIRD-PARTY.md) · [分发审计](../../docs/distribution-audit.md)
