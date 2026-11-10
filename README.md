# PDF Paper Translator

DeepSeek Harness 的 PDF 论文翻译插件。在桌面侧栏拖入多篇论文，选择 Harness 模型，查看进度，并逐篇保存译文 PDF。

## 在 Harness 中安装

打开「插件 → 添加插件」，选择 npm 官方源或国内镜像，输入下方包名并点击「安装」。

~~~text
dsh-pdf-paper-translator
~~~

也可以在同一个输入框粘贴 GitHub 仓库地址。

~~~text
https://github.com/dingzhen-123/dsh-pdf-paper-translator
~~~

安装完成后可在「已安装」里启用插件。如果当前配置装有旧版或开发版，请先卸载旧版，再按包名安装。

## 首次使用

在 Windows Harness 的侧栏打开「PDF 文献翻译」。如果缺少排版引擎，点击「安装排版引擎」。插件会在当前用户目录下载并安装引擎，缺少兼容 Python 时会准备独立运行时。安装完成后可直接开始翻译。引擎首次使用时会下载版面模型和字体。详见[插件使用说明](plugins/pdf-paper-translator/README.md)。

仓库采用 [AGPL-3.0](LICENSE)。插件所用的排版引擎单独安装。
