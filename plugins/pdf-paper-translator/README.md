# PDF Paper Translator for DeepSeek Harness

在 Harness 左侧打开「PDF 文献翻译」。可以一次选择多份 PDF，或把文件拖到翻译页面任意位置。文件按加入顺序排队，可以移除尚未开始的文献。点击「翻译模型」可搜索和选择 Harness 聊天目录中的模型，初始使用 Harness 的默认模型。模型自动判断原文语言，目标语言默认简体中文。页码留空时翻译全文，也可以输入 `1-3,5`。成品可选择仅译文，或按「原文第 1 页、译文第 1 页」交替排列。

「输出文件夹」默认是用户目录下的 `Downloads`。可以点击「更改…」选择文件夹，也可以直接输入本机路径。插件会记住路径。点击「开始翻译」后，队列共用同一套设置，依次处理。每完成一篇，PDF 就自动保存并列在「输出文件」里，点击文件名即可打开。同名结果会加序号；单篇失败会显示原因，队列继续处理后面的文献。

面板底部显示当前文献的生成阶段、进度和 API 用量。用量包括模型请求数和提供方返回的 token，具体额度扣减由提供方计量。处理时仍可追加文件；点击「停止队列」会取消当前翻译，保留已经完成的结果和尚未开始的文献。

## 工作方式

插件在本机调用 PDFMathTranslate-next / BabelDOC 解析页面并重排译文，尽量保留公式和图表。排版引擎通过仅绑定回环地址的一次性接口，把待译文本交给本次选择的模型。PDF 文件交给本机排版进程，提取出的文本由该模型服务处理，使用量由所选模型提供方计入。引擎首次运行需要下载版面模型和字体。

单份文件最大 60 MB。任务的中间文件保存在系统临时目录，处理完成后清理。请在翻译期间保持面板打开。扫描件需先 OCR。复杂版面、带密码的文件和损坏的 PDF 可能需要先行处理。

## Windows 安装

### 图形界面

在「插件 → 添加插件」选择 npm 官方源或国内镜像，输入包名并点击「安装」。

~~~text
dsh-pdf-paper-translator
~~~

也可以粘贴完整的 GitHub 仓库地址。

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

如果拿到 Windows x64 完整包（文件名以 `-windows-x64.tgz` 结尾），可先完全退出 Harness，再在 PowerShell 用本地路径安装。

~~~powershell
dsh plugin --profile desktop add 'C:\下载\dsh-pdf-paper-translator-0.1.3-windows-x64.tgz'
~~~

完整包包含便携 Python、排版引擎、字体和版面模型。第一次选好 PDF 并点击「准备并开始翻译」时，插件自动解包并接着翻译。翻译仍使用 Harness 中选定的模型。

普通版按以下方式自动准备排版环境。

打开「PDF 文献翻译」，选好 PDF 后点击「准备并开始翻译」。插件在当前用户目录安装 PDFMathTranslate-next 2.10.2，环境就绪后自动翻译队列中的 PDF。用户无需提前安装 Python。插件可使用本机兼容的 64 位 Python 3.12 或 3.13，也会在需要时下载便携运行时。运行时优先从华为云 NuGet 镜像下载，无法获取有效文件时改用 NuGet 官方源。两种来源都校验 SHA-256。

下载依赖先尝试清华 PyPI 镜像，再尝试 PyPI 官方源。单个源的下载最长 6 分钟，连续 90 秒无下载输出时也会切换来源。下载结束后在本机写入依赖。面板会显示当前来源、安装阶段和失败原因。安装失败时可重试，完成后即可翻译已加入队列的 PDF。

也可以在 PowerShell 手动运行包内安装脚本。

~~~powershell
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$installer = Join-Path $dshHome 'profiles\desktop\node_modules\dsh-pdf-paper-translator\plugins\pdf-paper-translator\setup-engine.ps1'
& $installer
~~~

默认引擎环境在 `%LOCALAPPDATA%\DshPdfTranslate\engine-2.10.2`。已有兼容的 `pdf2zh_next` 时，可以在启动 Harness 前用 `DSH_PDF2ZH_PATH` 指定可执行文件的绝对路径。

## 许可与依赖

插件源码采用 [AGPL-3.0](../../LICENSE)。排版依赖为 [PDFMathTranslate-next](https://pypi.org/project/pdf2zh-next/2.10.2/) 和 [BabelDOC](https://github.com/funstory-ai/BabelDOC/blob/v0.7.1/LICENSE)，它们由用户单独安装。
