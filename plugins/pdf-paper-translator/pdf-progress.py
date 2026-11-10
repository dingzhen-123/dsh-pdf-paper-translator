"""Run the installed PDF engine and send its progress events to the panel."""

import asyncio
import json
import logging
import multiprocessing

from babeldoc.assets.assets import warmup
from pdf2zh_next.config import ConfigManager
from pdf2zh_next.high_level import do_translate_async_stream


async def main():
    logging.basicConfig(level=logging.WARNING)
    settings = ConfigManager().initialize_config()
    (document,) = settings.basic.input_files
    settings.basic.input_files = set()
    warmup()

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


if __name__ == "__main__":
    multiprocessing.freeze_support()
    raise SystemExit(asyncio.run(main()))
