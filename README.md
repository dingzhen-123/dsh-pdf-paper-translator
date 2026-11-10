# PDF Paper Translator

DeepSeek Harness 的 PDF 论文翻译插件。在桌面侧栏拖入多篇论文，选择 Harness 模型，查看进度，并逐篇保存译文 PDF。

## 在 Harness 中安装

打开「插件 → 添加插件」，输入包名并点击「安装」。

~~~text
dsh-pdf-paper-translator
~~~

也可以在同一个输入框粘贴 GitHub 仓库地址。

~~~text
https://github.com/dingzhen-123/dsh-pdf-paper-translator
~~~

安装完成后可在「已安装」里启用插件。如果当前配置装有旧版或开发版，请先卸载旧版，再按包名安装。

## 首次使用

在 Windows Harness 的侧栏打开「PDF 文献翻译」，选好 PDF 后点击「准备并开始翻译」。环境就绪后会自动翻译已选的 PDF。

Windows x64 版优先复用本机已有的排版组件。首次翻译时如果缺少引擎，插件从 GitHub Releases 自动下载 PDFMathTranslate-next 官方完整包，约 607 MB，里面有 Python、字体和版面模型。下载完成后在本机解包并开始翻译。 [插件使用说明](plugins/pdf-paper-translator/README.md)

仓库采用 AGPL-3.0。公开包与本地测试包的内容、第三方许可和来源核查见分发审计。[项目许可](LICENSE) · [分发审计](docs/distribution-audit.md)
