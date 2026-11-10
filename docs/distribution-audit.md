# 分发与来源核查

本次核查以 Windows x64 本地完整测试包 `dsh-pdf-paper-translator-0.1.3-windows-x64.tgz` 为样本。文件大小为 546,225,856 字节，SHA-256 为 `a5f9a47dabf2f3a9e5d34737f2076f953b0d3aeb880f2571bb94a2ce4f86e1cb`。清单记录了 133 个 Python 分发包的许可声明和包内许可文件位置，以及 182 个版面资源的文件哈希。许可声明来自上游元数据，具体分发条件还要结合包内条款。[实际组件清单](windows-bundle-0.1.3-inventory.tsv)

## 与 Magic for Zotero 的来源比对

对比样本为本机安装的 Magic for Zotero 2.8.14，XPI SHA-256 为 `b7fe34f954be21d1534058e50cc95d2a0d2df1cb43df1f4acc4c5e666a857639`。比对范围包括截至 `7dd37909c6bbb5e626c43f58812ea4b7b41cfa68` 的 46 个 Git 历史文件对象、当前插件源码及本地完整包内的 21,799 个运行时文件。

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
| 34 个字体文件 | 检查了字体元数据和上游许可。Noto、Klee、LXGW 等字体需要保留相应通知。NAVER 允许随软件分发 MaruBuri，并要求附带许可和版权说明。包内 20 个 Source Han TrueType 文件来自格式转换版本，仍含 Adobe 的保留字体名称。本次未找到明确的保留名授权，发布前需要确认授权，或换成经验证的合规字体。[BabelDOC 字体来源](https://github.com/funstory-ai/BabelDOC-Assets#fonts-and-licenses) · [Source Han TrueType 许可](https://github.com/Pal3love/Source-Han-TrueType/blob/main/LICENSE.txt) · [OFL FAQ](https://openfontlicense.org/ofl-faq/) · [NAVER 字体条款](https://hangeul.naver.com/font) |
| 版面模型、字符映射和 tokenizer 数据 | DocLayout-YOLO 原权重与打包使用的 ONNX 转换版均标注 Apache-2.0。还需要随包补齐模型通知，核实 146 个 CMap JSON 的具体来源及通知，并确认 `o200k_base` 缓存数据的再分发依据。tiktoken 软件本身的 MIT 许可与缓存数据分别核对。[原始版面权重](https://huggingface.co/juliozhao/DocLayout-YOLO-DocStructBench) · [ONNX 转换版](https://huggingface.co/wybxc/DocLayout-YOLO-DocStructBench-onnx) · [Adobe CMap 许可](https://github.com/adobe-type-tools/cmap-resources/blob/master/LICENSE.md) · [tiktoken 许可](https://github.com/openai/tiktoken/blob/main/LICENSE) |

GitHub Release 与 npm 公开包采用同一份轻量插件，排版组件由用户端从上游下载。公开包的文件清单已排除运行时压缩档。构建脚本仅在生成独立 Windows x64 本地测试包时加入该档。完整包的公开分发仍需处理上表所列事项。

## 0.1.5-beta.1 的排版包来源

此预览版在本机已有可用引擎时直接复用。Windows x64 的全新安装从 PDFMathTranslate-next 的 GitHub Release 下载其官方完整包，并按上游发布的 SHA-256 `7ac1811b0f82078a86bcce88e185efff75fc55a3752c7f9c015186e5214b3c0b` 校验。完整包由上游提供。项目在 npm 和 GitHub Release 分发的预览安装包只包含插件源码和文档。 [官方发行文件](https://github.com/PDFMathTranslate-next/PDFMathTranslate-next/releases/expanded_assets/v2.10.2)
