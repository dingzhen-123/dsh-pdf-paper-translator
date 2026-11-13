"""Keep detected bibliography sections in BabelDOC's original PDF text layer."""

import re
import unicodedata
from collections import Counter


REFERENCE_HEADINGS = {
    "references", "reference", "reference list", "reference list and notes",
    "references and notes", "references cited", "references cited in text",
    "bibliography", "bibliography and notes", "bibliographical references",
    "works cited", "literature cited", "cited literature", "notes and references",
    "参考文献", "参考资料", "引用文献",
    "références", "bibliographie", "literaturverzeichnis", "referencias",
    "referencias bibliográficas", "referências", "リファレンス", "참고문헌",
}
FOLLOWING_HEADINGS = {
    "acknowledgments", "acknowledgements", "author contributions",
    "author information", "competing interests", "conflict of interest",
    "conflicts of interest", "declarations", "declaration of competing interest",
    "funding", "funding information", "ethics declarations", "additional information",
    "data availability", "code availability", "data availability statement",
    "supporting information", "supplementary information", "supplementary material",
    "supplementary materials", "publisher's note", "致谢", "作者贡献", "利益冲突",
    "附录", "补充材料", "数据可用性",
}
SECTION_NUMBER = re.compile(r"^(?:(?:\d+(?:\.\d+)*)|(?:[ivxlc]{1,5}))[.)]?\s+")
APPENDIX = re.compile(r"appendix(?:\s+[a-z0-9]+(?:[. :–—-].*)?)?$")


def heading(text):
    text = unicodedata.normalize("NFKC", text).casefold().strip().rstrip(":").strip()
    return SECTION_NUMBER.sub("", text)


def page_lines(page):
    import pymupdf

    flags = pymupdf.TEXTFLAGS_DICT & ~pymupdf.TEXT_PRESERVE_IMAGES
    return [
        (line["bbox"], "".join(span["text"] for span in line["spans"]).strip())
        for block in page.get_text("dict", flags=flags)["blocks"]
        for line in block.get("lines", [])
    ]


def reading_order(lines, width):
    # Full-width lines separate bands of two-column text.
    middle = width / 2
    long_line = width * 0.18
    left = sum(box[2] <= middle and box[2] - box[0] >= long_line for box, _ in lines)
    right = sum(box[0] >= middle and box[2] - box[0] >= long_line for box, _ in lines)
    lines.sort(key=lambda line: (line[0][1], line[0][0]))
    if min(left, right) < 3:
        return lines

    ordered, left_column, right_column = [], [], []
    for box, text in lines:
        if box[2] <= middle:
            left_column.append((box, text))
        elif box[0] >= middle:
            right_column.append((box, text))
        else:
            ordered.extend(left_column + right_column + [(box, text)])
            left_column, right_column = [], []
    return ordered + left_column + right_column


def running_margin(box, text, height):
    if box[3] <= height * 0.05:
        return "top", re.sub(r"\d+", "#", text)
    if box[1] >= height * 0.95:
        return "bottom", re.sub(r"\d+", "#", text)
    return None


def reference_boxes(pdf):
    pages, margins = [], Counter()
    for page in pdf:
        width, height = page.cropbox.width, page.cropbox.height
        lines = page_lines(page)
        pages.append((width, height, lines))
        keys = {running_margin(box, text, height) for box, text in lines}
        keys.discard(None)
        margins.update(keys)

    in_references = False
    result = {}
    for number, (width, height, lines) in enumerate(pages):
        protected = []
        body = [
            (box, text) for box, text in lines
            if text and margins[running_margin(box, text, height)] < 2
        ]
        for box, text in reading_order(body, width):
            title = heading(text)
            if title in REFERENCE_HEADINGS:
                in_references = True
            elif title in FOLLOWING_HEADINGS or APPENDIX.fullmatch(title):
                in_references = False
            if in_references:
                protected.append(box)
        if protected:
            result[number] = protected
    return result


def install_reference_filter():
    from babeldoc import rust_layout_service

    original = rust_layout_service.project_result
    last_document, protected = None, {}

    def project_result(page, layouts, pdf, index):
        nonlocal last_document, protected
        result = original(page, layouts, pdf, index)
        # 任何异常都退回原始结果：宁可这一页的参考文献被翻译，也不能让版面流程失败。
        try:
            index, size, boxes = result
            if pdf is not last_document:
                protected = reference_boxes(pdf)
                last_document = pdf
            references = protected.get(page.page_number)
            if references:
                source = pdf[page.page_number]
                size = (source.mediabox_size.x, source.mediabox_size.y)
                # The native "reference" label keeps these glyphs out of translation
                # paragraphs and retains them for the PDF writer.
                for box in references:
                    boxes.append((tuple((64, value) for value in box), 1.0, "reference"))
            return index, size, boxes
        except Exception:  # noqa: BLE001
            return result

    rust_layout_service.project_result = project_result
