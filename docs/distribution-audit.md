# 分发与来源核查

Windows x64 离线安装包 `dsh-pdf-paper-translator-0.1.9-windows-x64-offline-setup.tgz` 沿用 0.1.8 的运行时载荷。压缩包约 356.2 MB（约 339.7 MiB），精确校验值见同附的 `SHA256SUMS.txt`。运行时载荷解压后为 1,224,458,403 字节（约 1,167.7 MiB），包含 1 个 Python 归档、132 个 wheel 和 182 项资源。资源包括 34 个字体、1 个版面模型、146 个字符映射文件和 1 个 tokenizer 缓存。排版环境安装后的实测文件合计约 1.44 GB。

历史样本 `dsh-pdf-paper-translator-0.1.3-windows-x64.tgz` 的清单记录了该版 133 个 Python 分发包的许可声明及 182 个版面资源的文件哈希。[0.1.3 组件清单](windows-bundle-0.1.3-inventory.tsv)

## 与 Magic for Zotero 的来源比对

对比样本为本机安装的 Magic for Zotero 2.8.14，XPI SHA-256 为 `b7fe34f954be21d1534058e50cc95d2a0d2df1cb43df1f4acc4c5e666a857639`。当时的比对范围包括截至 `7dd37909c6bbb5e626c43f58812ea4b7b41cfa68` 的 46 个 Git 历史文件对象、该次核查的插件源码及 0.1.3 完整包内的 21,799 个运行时文件。

| 核查对象 | 结果 |
| --- | --- |
| 插件源码、图标与配置 | 与 Magic XPI 没有完全相同的文件。将至少 75 字符的非注释源码行与 XPI 中的脚本文本比对也没有命中。 |
| 功能与实现路径 | 两个插件都能输出翻译后的 PDF。Magic 的默认导出使用 Zotero 的段落和位置数据以及 pdf-lib。本项目通过独立的本机接口调用上游 PDFMathTranslate-next 和 BabelDOC，并通过 Harness 中配置的模型翻译。项目代码和打包脚本没有引用 Magic 的模块、授权接口或品牌素材。 |
| 完整包中的相同文件 | 118 个命中全部是 Gradio 5.35.0 自带的 KaTeX 数学字体，对应 XPI 中 59 个不同文件。完整包里这些文件的路径和 SHA-256 与 PyPI 发布的 Gradio wheel 全部一致。该 wheel 的 SHA-256 为 `781a80df25355861e44fd2819fac4ed43cf08ea77911570fb0682f6ae16b9c7c`，已与 PyPI 登记值核对。 |

这次静态比对未发现 Magic 专有代码或品牌素材进入本项目公开包。它覆盖上述版本和比对方法，无法判定所有可能的实质性相似情形。[Gradio 5.35.0](https://pypi.org/project/gradio/5.35.0/#files) · [KaTeX 字体文档](https://katex.org/docs/font.html) · [计算机软件保护条例第六条](https://xzfg.moj.gov.cn/mobile/law/detail?LawID=914)

## 完整测试包的分发核查

| 组件 | 当前证据和公开发布前需完成的工作 |
| --- | --- |
| PDFMathTranslate-next 2.10.2、BabelDOC 0.7.1、PyMuPDF 1.28.2 及 MuPDF 1.28.2 | 包内有许可文本。若按 AGPL 分发，需要为实际二进制提供对应源码、构建资料和等效获取方式，特别是编译进 wheel 的 Rust 和 MuPDF 代码。[PDFMathTranslate-next 源文件](https://pypi.org/project/pdf2zh-next/2.10.2/#files) · [BabelDOC 源文件](https://pypi.org/project/BabelDOC/0.7.1/#files) · [PyMuPDF 源文件](https://pypi.org/project/PyMuPDF/1.28.2/#files) · [AGPL 第六条](https://www.gnu.org/licenses/agpl-3.0.en.html#section6) |
| 其他 Python wheel 和内嵌二进制 | 例如 Levenshtein 的 GPL、certifi 与 orjson 等组件的 MPL，以及 OpenCV wheel 内的 FFmpeg 动态库，都要按实际构建版本核对源码和通知义务。已确认 ONNX Runtime 的许可证和第三方声明在包目录内。有些 wheel 的元数据声明了许可，但包内未发现相应许可正文，需要补齐。[Levenshtein 源文件](https://pypi.org/project/Levenshtein/0.27.5/#files) · [OpenCV 5.0.0.93 分发声明](https://pypi.org/project/opencv-python-headless/5.0.0.93/) |
| 便携 Python 3.13.17 和 Microsoft 可分发代码 | 官方 NuGet 包的 `tools/LICENSE.txt` 含 Windows 二进制的附加分发条款，包括对分发者和最终用户条款的要求。公开交付方式需要满足这些条款，完整包已保留原始文件。[Python NuGet 包](https://www.nuget.org/packages/python/3.13.17) · [Microsoft 许可条款](https://visualstudio.microsoft.com/license-terms/vs2022-ga-community/) |
| 34 个字体文件 | 检查了字体元数据和上游许可。包内 20 个 Source Han TrueType 文件来自上游资源包提供的格式转换版本，沿用 Adobe 声明的保留字体名 Source（Reserved Font Name）。本分发包未对这些文件作修改，其授权范围以 Adobe 与上游项目的许可文本为准。[随包字体许可](../THIRD-PARTY.md#字体资源来源) · [BabelDOC 字体来源](https://github.com/funstory-ai/BabelDOC-Assets#fonts-and-licenses) · [OFL FAQ](https://openfontlicense.org/ofl-faq/) |
| 版面模型、字符映射和 tokenizer 数据 | DocLayout-YOLO 原权重与打包使用的 ONNX 转换版均标注 Apache-2.0。还需要随包补齐模型通知，核实 146 个 CMap JSON 的具体来源及通知，并确认 `o200k_base` 缓存数据的再分发依据。tiktoken 软件本身的 MIT 许可与缓存数据分别核对。[原始版面权重](https://huggingface.co/juliozhao/DocLayout-YOLO-DocStructBench) · [ONNX 转换版](https://huggingface.co/wybxc/DocLayout-YOLO-DocStructBench-onnx) · [Adobe CMap 许可](https://github.com/adobe-type-tools/cmap-resources/blob/master/LICENSE.md) · [tiktoken 许可](https://github.com/openai/tiktoken/blob/main/LICENSE) |

0.1.5 的 GitHub Release 与 npm 公开包采用同一份轻量插件。上表中的完整包由旧版脚本生成，仅用于本地测试。当前代码改为在本机安装引擎，支持通过上游归档、wheel 目录和 BabelDOC 资源 ZIP 离线准备。 [安装与离线准备](../plugins/pdf-paper-translator/README.md#命令行与离线准备)

## 0.1.5 的排版包来源

本机已有可用引擎时直接复用。Windows x64 首次准备引擎时从 PDFMathTranslate-next 的 GitHub Release 下载其官方完整包，并按上游发布的 SHA-256 `7ac1811b0f82078a86bcce88e185efff75fc55a3752c7f9c015186e5214b3c0b` 校验。完整包由上游提供。项目在 npm 和 GitHub Release 分发的安装包只包含插件源码和文档。 [官方发行文件](https://github.com/PDFMathTranslate-next/PDFMathTranslate-next/releases/expanded_assets/v2.10.2)

## 内置引擎的 npm 安装测试与补充核查

将 0.1.5 插件源码与旧测试包的运行时打成私有 npm 测试包，压缩档为 546,240,088 字节。DeepSeek Harness 在空白配置中从本机 npm 测试源按包名安装。将系统 Python 移出测试进程的 PATH，并将外部下载代理指向无服务的本机端口后，插件解包内置引擎，使用模拟模型生成了三页论文的三页仅译文 PDF 和六页逐页对照 PDF。核对了页面尺寸、中文文本以及原论文中的嵌入图片。这个测试覆盖本地安装与出图流程，公开 npm 的包体积和镜像同步仍待验证。

- `o200k_base` 的 199,998 条 BPE 词表可从 OpenAI 以 Apache-2.0 发布的 gpt-oss-20b `tokenizer.json` 复现。生成文件的 SHA-256 为 `446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d`，与测试包内的缓存逐字节一致。公开构建可改为从该明确授权来源生成，并附许可证和来源说明。[gpt-oss-20b 固定版本](https://huggingface.co/openai/gpt-oss-20b/tree/6cee5e81ee83917806bbde320786a8fb61efebee)
- 用 BabelDOC 0.7.1 的 CMap 解析器核对 Adobe 上游。内置的 146 个 CMap JSON 中，123 个的 `usecmap`、CID 范围和单字符映射全部一致。其余 23 个的同名文件存在差异，需要追溯准确版本或验证替换。BabelDOC 源码中的 Rust CMap 另附 Adobe 许可文件，公开构建应保留该许可。[Adobe CMap 固定版本](https://github.com/adobe-type-tools/cmap-resources/tree/f5cf3bca7fdfeaceb77aa82847e974f2306c20b4) · [BabelDOC 0.7.1 源文件](https://pypi.org/project/BabelDOC/0.7.1/#files)
- 已从本地包直接读取 Python 的 `LICENSE.txt`。其中明确说明微软可分发代码编入多个 Windows 二进制。发布前需要落实该部分适用的分发者和最终用户条款，同时保留 Python 自身的许可。[CPython Windows 附加条件](https://github.com/python/cpython/blob/v3.13.17/PC/crtlicense.txt)
