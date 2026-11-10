# PDF Paper Translator for DeepSeek Harness

在 Harness 左侧打开「PDF 文献翻译」。可以一次选择多份 PDF，或把文件拖到翻译页面任意位置。文件按加入顺序排队，可以移除尚未开始的文献。点击「翻译模型」可搜索和选择 Harness 聊天目录中的模型，初始使用 Harness 的默认模型。模型自动判断原文语言，目标语言默认简体中文。页码留空时翻译全文，也可以输入 `1-3,5`。成品可选择仅译文，或按「原文第 1 页、译文第 1 页」交替排列。

「输出文件夹」默认是用户目录下的 `Downloads`。可以点击「更改…」选择文件夹，也可以直接输入本机路径。插件会记住路径。点击「开始翻译」后，队列共用同一套设置，依次处理。每完成一篇，PDF 就自动保存并列在「输出文件」里，点击文件名即可打开。同名结果会加序号；单篇失败会显示原因，队列继续处理后面的文献。

面板底部显示当前文献的生成阶段、进度和 API 用量。用量包括模型请求数和提供方返回的 token，具体额度扣减由提供方计量。处理时仍可追加文件；点击「停止队列」会取消当前翻译，保留已经完成的结果和尚未开始的文献。

## 工作方式

插件在本机调用 PDFMathTranslate-next / BabelDOC 解析页面并重排译文，尽量保留公式和图表。排版引擎通过仅绑定回环地址的一次性接口，把待译文本交给本次选择的模型。PDF 文件交给本机排版进程，提取出的文本由该模型服务处理，使用量由所选模型提供方计入。

单份文件最大 60 MB。任务的中间文件保存在系统临时目录，处理完成后清理。请在翻译期间保持面板打开。扫描件需先 OCR。复杂版面、带密码的文件和损坏的 PDF 可能需要先行处理。

## Windows 安装

### 图形界面

在「插件 → 添加插件」选择 npm 官方源，输入预览版包名并点击「安装」。

~~~text
dsh-pdf-paper-translator@next
~~~

也可以粘贴带预览版标签的 GitHub 仓库地址。

~~~text
https://github.com/dingzhen-123/dsh-pdf-paper-translator#v0.1.5-beta.1
~~~

安装完成后可在「已安装」里启用插件。如果当前配置装有旧包 `@dingzhen-123/dsh-pdf-paper-translator` 或开发版 `@local/dsh-pdf-translate`，请先卸载旧包，再安装新版。

### 命令行

安装示例使用 DeepSeek Harness Desktop 的 `desktop` 配置，安装命令已用 0.2.1-rc.5 随附的 CLI 验证。若 `dsh` 未加入 PATH，使用 Harness 安装目录下的 `resources\runtime\cli\bin\dsh.cmd` 完整路径。

先完全退出 Harness，再运行以下命令。

~~~powershell
dsh plugin --profile desktop add dsh-pdf-paper-translator@next
~~~

若要通过 GitHub 安装，把命令中的包名换成上面的完整仓库地址。

### 排版引擎

在 Windows x64 上，预览版会复用已有的插件排版环境。首次需要准备引擎时，选好 PDF 并点击「准备并开始翻译」。插件从 PDFMathTranslate-next 的 GitHub Release 下载约 607 MB 的 Windows 完整包，校验 SHA-256 后在当前用户目录解包，随后翻译已选文献。重新点击可继续中断的下载。 [上游完整包](https://github.com/PDFMathTranslate-next/PDFMathTranslate-next/releases/expanded_assets/v2.10.2)

全新环境需要能够访问 GitHub Release。排版包含 PDFMathTranslate-next 2.10.2、BabelDOC 0.7.1、便携 Python、字体和模型。已有兼容的 `pdf2zh_next` 时，可以在启动 Harness 前用 `DSH_PDF2ZH_PATH` 指定可执行文件的绝对路径。

## 许可与依赖

插件源码采用 AGPL-3.0。Windows 预览版从上游取得其官方发行包，插件安装包只包含自身源码及文档。旧版独立测试包的组件清单见分发审计。[项目许可](../../LICENSE) · [分发审计](../../docs/distribution-audit.md)
