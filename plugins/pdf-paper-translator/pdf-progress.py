"""Run the installed PDF engine and send its progress events to the panel."""

import asyncio
import json
import logging
import multiprocessing
import os
import sys
from importlib.metadata import version
from pathlib import Path
from runpy import run_path

if assets_path := os.environ.get("DSH_PDF_ASSETS"):
    from babeldoc import const

    assets = Path(assets_path)
    original_cache_path = const.get_cache_file_path

    def bundled_cache_path(filename, sub_folder=None):
        if sub_folder in {"fonts", "models", "cmap", "tiktoken"}:
            directory = assets / sub_folder
            directory.mkdir(parents=True, exist_ok=True)
            return directory / filename
        return original_cache_path(filename, sub_folder)

    const.get_cache_file_path = bundled_cache_path
    const.TIKTOKEN_CACHE_FOLDER = assets / "tiktoken"
    os.environ["TIKTOKEN_CACHE_DIR"] = str(const.TIKTOKEN_CACHE_FOLDER)


def prepare_assets():
    from babeldoc.assets import assets as upstream

    if action := os.environ.get("DSH_PDF_RESTORE_ASSETS"):
        upstream.restore_offline_assets_package(Path(action))
    upstream.warmup()


def engine_health():
    from babeldoc.assets.assets import generate_all_assets_file_list, verify_file
    from babeldoc.const import get_cache_file_path
    import onnxruntime
    import pymupdf
    from pdf2zh_next.high_level import do_translate_async_stream

    missing = any(
        not verify_file(get_cache_file_path(entry["name"], group), entry["sha3_256"])
        for group, entries in generate_all_assets_file_list().items()
        for entry in entries
    )
    print(json.dumps({
        "version": version("pdf2zh-next"),
        "babeldoc": version("BabelDOC"),
        "resources": not missing,
    }))


def check_fonts():
    from babeldoc.assets.assets import generate_all_assets_file_list, verify_file
    from babeldoc.const import get_cache_file_path

    fonts = generate_all_assets_file_list()["fonts"]
    directory = get_cache_file_path(fonts[0]["name"], "fonts").parent
    known = {entry["name"]: entry["sha3_256"] for entry in fonts}
    for font in directory.iterdir():
        if font.suffix.lower() in {".ttf", ".otf", ".ttc", ".woff", ".woff2"} and font.name not in known:
            raise ValueError(f"Unknown BabelDOC font: {font.name}")
    for name, digest in sorted(known.items()):
        if not verify_file(directory / name, digest):
            raise ValueError(f"Missing or altered BabelDOC font: {name}")
        license_name = "NAVER font license" if name.startswith("MaruBuri-") else "OFL-1.1"
        print(f"{name} [{license_name}]")


async def main():
    from pdf2zh_next.config import ConfigManager
    from pdf2zh_next.high_level import do_translate_async_stream

    logging.basicConfig(level=logging.WARNING)
    settings = ConfigManager().initialize_config()
    (document,) = settings.basic.input_files
    settings.basic.input_files = set()
    prepare_assets()

    async for event in do_translate_async_stream(settings, document):
        if event["type"] in {"progress_start", "progress_update", "progress_end"}:
            payload = {
                "stage": event["stage"],
                "progress": event["overall_progress"],
            }
            print("DSH_PDF_PROGRESS " + json.dumps(payload, allow_nan=False), flush=True)
        elif event["type"] == "finish":
            return 0
        elif event["type"] == "error":
            logging.error("PDF translation: %s", event.get("error", "unknown error"))
            return 1
    return 1


if __name__ in {"__main__", "__mp_main__"} and not any(arg.startswith("--dsh-") for arg in sys.argv[1:]):
    # 参考文献过滤是增强项：装不上就退化成整篇翻译，不能让任务直接崩。
    try:
        run_path(str(Path(__file__).with_name("reference-layout.py")))["install_reference_filter"]()
    except Exception as error:  # noqa: BLE001
        print(f"[dsh-pdf] 参考文献过滤未启用：{type(error).__name__}: {error}", flush=True)


if __name__ == "__main__":
    match sys.argv[1:]:
        case ["--dsh-warmup"]:
            logging.basicConfig(level=logging.INFO)
            prepare_assets()
        case ["--dsh-health"]:
            engine_health()
        case ["--dsh-check-fonts"]:
            check_fonts()
        case ["--dsh-generate-assets", directory]:
            from babeldoc.assets.assets import generate_offline_assets_package, get_offline_assets_tag

            output = Path(directory)
            generate_offline_assets_package(output)
            print(output / f"offline_assets_{get_offline_assets_tag()}.zip")
        case _:
            multiprocessing.freeze_support()
            raise SystemExit(asyncio.run(main()))
