# PDF Paper Translator

DeepSeek Harness 的 PDF 论文翻译插件。可拖入多篇论文，用 Harness 中的模型即时或定时翻译，并逐篇保存译文 PDF。

## 在 Harness 中安装

先安装 DeepSeek Harness 并配置可用的翻译模型。自动准备排版引擎支持 Windows x64（AMD64）。

打开「插件 → 添加插件」，输入 npm 包名并点击「安装」。

~~~text
dsh-pdf-paper-translator
~~~

也可以在同一个输入框粘贴 GitHub 仓库地址。

~~~text
https://github.com/dingzhen-123/dsh-pdf-paper-translator
~~~

也可以下载 GitHub Release 中的 `.tgz`，将文件的完整本机路径填入安装框。安装后点击「立即启用」，从侧栏打开「PDF 文献翻译」。如果已启用旧版或本地开发版，请先停用旧版或开发版。

## 首次使用

GitHub 和 npm 提供轻量安装包。插件会复用已通过自检的排版引擎。首次使用时如缺少引擎，在翻译面板点击「确认安装」，插件会联网准备所需的 Python、排版依赖和资源。自检通过后即可上传 PDF 并开始翻译。 [安装与离线准备](plugins/pdf-paper-translator/README.md#排版引擎)

遇到排版引擎安装问题，可在翻译面板点击「环境检测」查看状态。

## 0.1.9 更新

- 支持按北京时间定时翻译，并显示 DeepSeek 官方 API 的错峰时段。
- API 用量区以环形图显示 token 分项占比，同时保留总量、请求数和分项数字。
- 「联系作者」提供公众号「多功能复材研究进展」的二维码和 Bilibili 主页入口。

仓库采用 AGPL-3.0。[项目许可](LICENSE) · [第三方组件](THIRD-PARTY.md) · [分发审计](docs/distribution-audit.md)
