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

在 Windows Harness 的侧栏打开「PDF 文献翻译」，选好 PDF 后点击「准备并开始翻译」。环境就绪后会自动翻译已选的 PDF。

Windows x64 完整包自带便携 Python、排版引擎和版面资源，首次使用时自动解包。普通版首次使用时自动下载排版组件、版面模型和字体。两种版本都使用 Harness 中选定的翻译模型。详见[插件使用说明](plugins/pdf-paper-translator/README.md)。

仓库采用 [AGPL-3.0](LICENSE)。
