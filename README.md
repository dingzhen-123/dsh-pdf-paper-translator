# DeepSeek Harness Plugins

适用于 DeepSeek Harness 的社区插件。每个插件有自己的安装说明和依赖。

| 插件 | 功能 |
| --- | --- |
| [PDF Paper Translator](plugins/pdf-paper-translator/) | 在桌面侧栏批量翻译论文，选择 Harness 模型，查看进度，并逐篇保存译文 PDF。 |

## 在 Harness 中安装

打开「插件 → 添加插件」，把下面这一整行粘贴到输入框，再点击「安装」。

~~~text
github:dingzhen-123/deepseek-harness-plugins#path:/plugins/pdf-paper-translator
~~~

`#path:` 指向包含插件清单的子目录。使用这个 GitHub 地址时，无需切换 npm 源。安装完成后可在「已安装」里启用插件。首次使用时，按[插件安装说明](plugins/pdf-paper-translator/README.md#windows-安装)单独安装排版引擎。

仓库采用 [AGPL-3.0](LICENSE)。插件所用的排版引擎单独安装。
