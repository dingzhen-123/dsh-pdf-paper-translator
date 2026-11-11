"""Compress an offline Windows installation payload without copying a virtualenv."""

import argparse
import lzma
import shutil
import tarfile
import tempfile
import zipfile
from pathlib import Path


def store_wheel(wheel, destination):
    with zipfile.ZipFile(wheel) as original, zipfile.ZipFile(destination, "w") as stored:
        for entry in original.infolist():
            if entry.is_dir():
                continue
            member = zipfile.ZipInfo(entry.filename, entry.date_time)
            member.external_attr = entry.external_attr
            with original.open(entry) as source, stored.open(member, "w") as target:
                shutil.copyfileobj(source, target, 1024 * 1024)


def add_assets(bundle, asset_zip):
    with zipfile.ZipFile(asset_zip) as assets:
        for entry in sorted(assets.infolist(), key=lambda item: item.filename):
            if entry.is_dir():
                continue
            name = Path(entry.filename)
            if len(name.parts) != 2 or name.parts[0] not in {"fonts", "models", "cmap", "tiktoken"}:
                raise ValueError(f"Unexpected asset path: {entry.filename}")
            if name.name in {"..", "."} or ":" in name.name or "\\" in entry.filename:
                raise ValueError(f"Unexpected asset path: {entry.filename}")
            info = tarfile.TarInfo("assets/" + name.as_posix())
            info.size = entry.file_size
            with assets.open(entry) as source:
                bundle.addfile(info, source)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("python_archive", type=Path)
    parser.add_argument("wheelhouse", type=Path)
    parser.add_argument("asset_zip", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    wheels = sorted(args.wheelhouse.glob("*.whl"))
    if not wheels:
        raise ValueError("The wheel directory is empty")
    with tempfile.TemporaryDirectory(prefix="dsh-offline-wheels-") as directory:
        filters = [{"id": lzma.FILTER_LZMA2, "preset": 5, "dict_size": 64 * 1024 * 1024}]
        with lzma.open(args.output, "xb", filters=filters) as compressed, tarfile.open(
            fileobj=compressed, mode="w|", bufsize=1024 * 1024
        ) as bundle:
            bundle.add(args.python_archive, arcname="python.archive")
            for index, wheel in enumerate(wheels, 1):
                stored = Path(directory) / wheel.name
                store_wheel(wheel, stored)
                bundle.add(stored, arcname=f"wheels/{wheel.name}")
                stored.unlink()
                if index % 20 == 0:
                    print(f"Wheels: {index}/{len(wheels)}", flush=True)
            print("Compressing BabelDOC resources", flush=True)
            add_assets(bundle, args.asset_zip)
    print(f"{args.output}: {args.output.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
