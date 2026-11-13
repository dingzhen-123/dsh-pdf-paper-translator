# 第三方组件

轻量插件包包含插件源码、许可和安装脚本。以下组件由用户确认后从各自的发行源下载到本机，或由用户提供本地归档。安装脚本保留上游发布文件中的许可。

| 组件 | 版本 | 许可和来源 | 用途 |
| --- | --- | --- | --- |
| PDFMathTranslate-next | 2.10.2 | [AGPL-3.0](https://github.com/PDFMathTranslate-next/PDFMathTranslate-next/blob/v2.10.2/LICENSE) · [发行文件](https://pypi.org/project/pdf2zh-next/2.10.2/#files) | 协调翻译和 PDF 输出 |
| BabelDOC | 0.7.1 | [AGPL-3.0](https://pypi.org/project/BabelDOC/0.7.1/#files) | 识别原文版面并回填译文 |
| PyMuPDF / MuPDF | 由 BabelDOC 的依赖约束解析 | [PyMuPDF 源码和许可](https://github.com/pymupdf/PyMuPDF) · [MuPDF 许可](https://mupdf.com/licensing) | PDF 读写 |
| CPython 便携环境 | 官方 NuGet 3.13.17 或 Astral 3.13.18 | [PSF 许可和 Windows 附加条件](https://github.com/python/cpython/blob/v3.13.17/PC/crtlicense.txt) · [Python NuGet 发行文件](https://www.nuget.org/packages/python/3.13.17) · [Astral 发行文件](https://github.com/astral-sh/python-build-standalone/releases/tag/20261026) | 在缺少兼容 Python 时创建本机虚拟环境，支持使用本地归档离线准备 |
| ONNX Runtime | 由 BabelDOC 的依赖约束解析 | [MIT 许可及第三方声明](https://github.com/microsoft/onnxruntime) | 运行版面识别模型 |
| DocLayout-YOLO ONNX | BabelDOC 0.7.1 资源清单中的固定摘要 | [Apache-2.0 原权重](https://huggingface.co/juliozhao/DocLayout-YOLO-DocStructBench) · [ONNX 转换版](https://huggingface.co/wybxc/DocLayout-YOLO-DocStructBench-onnx) | 版面识别 |
| 字体和字符映射 | BabelDOC 0.7.1 资源清单中的固定摘要 | [BabelDOC 字体来源](https://github.com/funstory-ai/BabelDOC-Assets#fonts-and-licenses) · [Adobe CMap 许可](https://github.com/adobe-type-tools/cmap-resources/blob/master/LICENSE.md) | 字体嵌入和字符映射 |

运行时使用 BabelDOC 自带资源清单的文件名和 SHA3-256。各 Python 依赖的实际安装版本可以用引擎虚拟环境中的 Python 执行 `-m pip list` 核对。

## 字体资源来源

0.1.8 和 0.1.9 离线安装包的 34 个字体文件来自 BabelDOC-Assets 上游资源，由 BabelDOC 导出为离线资源包。

其中 Source Han Sans / Source Han Serif 的 TrueType 文件为上游提供的格式转换版本，沿用 Adobe 声明的保留字体名 Source（Reserved Font Name）。本分发包未对这些字体文件作任何修改，其授权范围以 Adobe 与上游项目的许可文本为准。

| 字体 | 许可 | 许可文本 |
| --- | --- | --- |
| Source Han Sans / Serif | SIL OFL 1.1 | [OFL-SourceHan.txt](third-party/fonts-licenses/OFL-SourceHan.txt) |
| Noto Sans / Noto Serif | SIL OFL 1.1 | [OFL-Noto.txt](third-party/fonts-licenses/OFL-Noto.txt) |
| Go Noto Kurrent | SIL OFL 1.1 | [OFL-GoNoto.txt](third-party/fonts-licenses/OFL-GoNoto.txt) |
| Klee One | SIL OFL 1.1 | [OFL-KleeOne.txt](third-party/fonts-licenses/OFL-KleeOne.txt) |
| LXGW WenKai GB / TC | SIL OFL 1.1 | [OFL-LXGW.txt](third-party/fonts-licenses/OFL-LXGW.txt) |
| MaruBuri | NAVER 字体许可（SIL OFL 1.1） | [LICENSE-MaruBuri.txt](third-party/fonts-licenses/LICENSE-MaruBuri.txt) |

[BabelDOC-Assets 字体来源](https://github.com/funstory-ai/BabelDOC-Assets#fonts-and-licenses)
