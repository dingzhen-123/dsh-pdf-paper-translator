"""识别论文后置内容（参考文献、致谢、作者信息等）的起始页。

引擎会把整篇逐段送去翻译，参考文献区一条一 DOI、一行一条目，
既没有阅读价值，也占掉可观的开销。这里在翻译前定位后置内容的起点，
再交给引擎的 --pages 只翻正文。

两个要点（此前踩过的坑）：
1. 不能只看页面前几十行。论文常把正文与参考文献排在同一页，标题出现在
   页面中段（实测 Nature 子刊在第 13 页的第 83 行），只扫页首必漏。
2. 参考文献标题与「Additional information」这类文末小节的优先级不同。
   前者一旦出现就应作为 cutoff；后者只能在没有参考文献时兜底，否则会把
   cutoff 推到最后一页，中间的文献全被翻译。

用法：python pdf-tail.py <pdf>   输出 {"cutoff": N, "heading": "...", "score": K}
cutoff 为 1 起的页码；0 表示未识别到后置内容。
"""

import json
import re
import sys

import pymupdf

# 参考文献类标题：出现即视为正文结束，优先采用。
STRONG = re.compile(
    r"^(?:(?:\d{1,2}|[ivxlc]{1,4})\s*[.)]?\s*)?(?:"
    r"references(?:\s+and\s+notes)?|reference\s+list|references\s+cited|"
    r"bibliography|literature\s+cited|cited\s+literature|works\s+cited|"
    r"参考文献|参考资料|引用文献"
    r")\s*:?\s*$",
    re.I,
)

# 其他后置小节：只在找不到参考文献标题时兜底。
WEAK = re.compile(
    r"^(?:(?:\d{1,2}|[ivxlc]{1,4})\s*[.)]?\s*)?(?:"
    r"acknowledg(?:e)?ments?|acknowledgment|致谢|"
    r"author\s+(?:information|contributions)|authors'?\s+contributions|作者贡献|作者信息|"
    r"competing\s+interests?|conflicts?\s+of\s+interest|declaration\s+of\s+interests|利益冲突|"
    r"additional\s+information|rights\s+and\s+permissions|about\s+this\s+journal|"
    r"supplementary\s+(?:information|materials?)|supporting\s+information|补充材料|"
    r"data\s+availability|code\s+availability|数据可用性"
    r")\s*:?\s*$",
    re.I,
)

# 参考文献条目的典型特征：年份、DOI、卷期页码。
ENTRY = re.compile(r"(?:\(?(?:19|20)\d{2}\)?|doi|10\.\d{4,9}/)")


def page_lines(page):
    return [line.strip() for line in page.get_text("text").splitlines() if line.strip()]


def reference_density(pages, start, span=2):
    """候选页与其后一页里，像文献条目的行数。用来排除正文中的同名小标题。"""
    score = 0
    for page in pages[start:start + span]:
        for line in page_lines(page):
            if ENTRY.search(line):
                score += 1
    return score


def detect(path):
    document = pymupdf.open(path)
    total = document.page_count
    if total < 3:
        return {"cutoff": 0, "heading": "", "score": 0, "pages": total}

    # 后置内容只会出现在后 65%，避免把目录、正文引用误判成参考文献区。
    first = max(0, int(total * 0.35))
    found = []

    for index in range(first, total):
        lines = page_lines(document[index])
        for number, line in enumerate(lines):
            if len(line) > 48:
                continue
            if STRONG.match(line):
                score = reference_density(document, index)
                # 参考文献标题后面通常紧跟条目；条目极少的短文献也接受，
                # 只要标题出现在页面前半部分（说明正文已在上方结束）。
                near_top = number <= max(3, len(lines) // 2)
                if score >= 2 or near_top:
                    found.append({
                        "cutoff": index + 1, "heading": line, "score": score,
                        "kind": "references",
                        # 标题在页面上部 → 整页基本是文献，可整页跳过；
                        # 在页面中下部 → 该页仍有正文，必须保留该页翻译。
                        "at_top": number <= max(2, int(len(lines) * 0.25)),
                    })
                    break
            elif WEAK.match(line):
                found.append({
                    "cutoff": index + 1, "heading": line, "score": 0,
                    "kind": "post-matter",
                    "at_top": number <= max(2, int(len(lines) * 0.25)),
                })
                # 不跳出：同一页可能先出现「Data availability」，再出现「References」，
                # 需要把后者也记下来，截断点相同但标题更准确。

    if not found:
        return {"cutoff": 0, "heading": "", "score": 0, "pages": total}

    # 「作者信息往后的都不翻译」：参考文献与文末小节一并算作后置内容，
    # 取最靠前的那一处作为截断点，后面的全部保留原文。同页时优先报参考文献标题。
    chosen = min(found, key=lambda item: (item["cutoff"], 0 if item["kind"] == "references" else 1))
    chosen["pages"] = total
    return chosen


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"cutoff": 0, "error": "missing pdf path"}))
        return 1
    try:
        print(json.dumps(detect(sys.argv[1]), ensure_ascii=False))
    except Exception as error:  # 识别失败不应阻断翻译
        print(json.dumps({"cutoff": 0, "error": str(error)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
