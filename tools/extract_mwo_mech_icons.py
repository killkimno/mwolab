#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
import struct
import subprocess
import tempfile
import zipfile
import zlib
from pathlib import Path, PurePosixPath


DEFAULT_GAME_DIR = Path(r"F:\Game\Steam\steamapps\common\MechWarrior Online")
GAME_DATA_PAK = Path("Game") / "GameData.pak"
ICON_PREFIX = "Libs/UI/Screens/Assets/MechIcons/"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
DEFAULT_PUBLIC_OUTPUT = Path("public") / "assets" / "mech-icons"
DEFAULT_MECHS_DATA = Path("public") / "data" / "mechs.json"


def validate_mech_icon(data: bytes, source: str):
    if len(data) < 33 or not data.startswith(PNG_SIGNATURE):
        raise RuntimeError(f"{source} is not a PNG file")
    if data[12:16] != b"IHDR":
        raise RuntimeError(f"{source} has no PNG IHDR header")
    width, height, bit_depth, color_type, compression, filtering, interlace = struct.unpack(
        ">IIBBBBB", data[16:29]
    )
    if (width, height, bit_depth, color_type, compression, filtering, interlace) != (
        256,
        256,
        8,
        6,
        0,
        0,
        0,
    ):
        raise RuntimeError(
            f"{source} must be a non-interlaced 256x256 8-bit RGBA PNG; got "
            f"{width}x{height}, bit depth {bit_depth}, color type {color_type}, "
            f"compression {compression}, filter {filtering}, interlace {interlace}"
        )

    offset = 8
    idat = []
    saw_iend = False
    while offset < len(data):
        if offset + 12 > len(data):
            raise RuntimeError(f"{source} has a truncated PNG chunk")
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        chunk_end = offset + 12 + length
        if chunk_end > len(data):
            raise RuntimeError(f"{source} has a truncated PNG chunk payload")
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + length]
        expected_crc = struct.unpack(">I", data[offset + 8 + length:chunk_end])[0]
        actual_crc = zlib.crc32(kind + payload) & 0xFFFFFFFF
        if actual_crc != expected_crc:
            raise RuntimeError(f"{source} has an invalid PNG chunk checksum")
        if kind == b"IDAT":
            idat.append(payload)
        elif kind == b"IEND":
            saw_iend = True
            if chunk_end != len(data):
                raise RuntimeError(f"{source} has data after its PNG IEND chunk")
        offset = chunk_end
    if not idat or not saw_iend:
        raise RuntimeError(f"{source} is missing PNG image data or IEND")
    try:
        pixels = zlib.decompress(b"".join(idat))
    except zlib.error as exc:
        raise RuntimeError(f"{source} has invalid compressed PNG image data") from exc
    if len(pixels) != 256 * (1 + 256 * 4):
        raise RuntimeError(f"{source} has an invalid amount of decoded PNG image data")
    row_size = 1 + 256 * 4
    if any(pixels[offset] > 4 for offset in range(0, len(pixels), row_size)):
        raise RuntimeError(f"{source} contains an invalid PNG scanline filter")


def read_archive_icons(game_data: zipfile.ZipFile):
    icons = {}
    canonical_names = {}
    for member in game_data.namelist():
        if not member.lower().startswith(ICON_PREFIX.lower()):
            continue
        relative = member[len(ICON_PREFIX):]
        path = PurePosixPath(relative)
        if len(path.parts) != 1 or path.suffix.lower() != ".png":
            continue
        source_filename = path.name
        filename = source_filename.lower()
        key = filename.casefold()
        if key in canonical_names:
            raise RuntimeError(
                "Duplicate case-insensitive mech icon filename in GameData.pak: "
                f"{canonical_names[key]} and {source_filename}"
            )
        data = game_data.read(member)
        validate_mech_icon(data, f"GameData.pak:{member}")
        canonical_names[key] = source_filename
        icons[filename] = data
    if not icons:
        raise RuntimeError(f"No PNG files found below {ICON_PREFIX} in GameData.pak")
    return icons


def apply_replacements(icons, replace_dir: Path):
    if not replace_dir.is_dir():
        raise RuntimeError(f"Replacement icon directory not found: {replace_dir}")

    archive_names = {name.casefold(): name for name in icons}
    replacements = []
    unmatched = []
    for path in sorted(replace_dir.iterdir(), key=lambda item: item.name.casefold()):
        if not path.is_file():
            continue
        if path.suffix.lower() != ".png":
            raise RuntimeError(f"Replacement directory contains a non-PNG file: {path}")
        archive_name = archive_names.get(path.name.casefold())
        if archive_name is None:
            unmatched.append(path.name)
            continue
        data = path.read_bytes()
        validate_mech_icon(data, str(path))
        icons[archive_name] = data
        replacements.append(archive_name)
    return replacements, unmatched


def validate_browser_coverage(icons, output_dir: Path, mechs_data_path: Path):
    if not mechs_data_path.is_file():
        raise RuntimeError(f"Mech data file not found: {mechs_data_path}")
    try:
        mechs = json.loads(mechs_data_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Could not read mech data: {mechs_data_path}") from exc
    if not isinstance(mechs, list):
        raise RuntimeError(f"Mech data must be a JSON array: {mechs_data_path}")

    fallback_files = []
    missing = []
    for mech in mechs:
        name = mech.get("name") if isinstance(mech, dict) else None
        if not isinstance(name, str) or not name.strip():
            raise RuntimeError(f"Mech data contains a record without a valid name: {mechs_data_path}")
        filename = name.lower() + ".png"
        if filename in icons:
            continue
        fallback = output_dir / filename
        if not fallback.is_file():
            missing.append(filename)
            continue
        validate_mech_icon(fallback.read_bytes(), str(fallback))
        fallback_files.append(filename)
    if missing:
        raise RuntimeError(
            "GameData.pak and the existing browser icon directory do not cover "
            f"the current mech data: {', '.join(sorted(set(missing)))}"
        )
    return sorted(set(fallback_files))


def enable_acl_inheritance(path: Path):
    if os.name != "nt":
        return
    result = subprocess.run(
        ["icacls", str(path), "/inheritance:e"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()
        raise RuntimeError(f"Could not enable ACL inheritance for {path}: {detail}")


def publish_icon_sets(icons, output_dirs):
    resolved = [output_dir.resolve() for output_dir in output_dirs]
    if len(set(resolved)) != len(resolved):
        raise RuntimeError("Duplicate icon output directories are not allowed")

    summaries = {}
    entries = []
    preserve_backups = False
    try:
        for output_dir in output_dirs:
            output_dir.mkdir(parents=True, exist_ok=True)
            enable_acl_inheritance(output_dir)
            summary = {"created": 0, "updated": 0, "unchanged": 0}
            summaries[output_dir] = summary
            for filename in sorted(icons, key=str.casefold):
                destination = output_dir / filename
                data = icons[filename]
                existed = destination.exists()
                if existed and destination.read_bytes() == data:
                    summary["unchanged"] += 1
                    continue
                summary["updated" if existed else "created"] += 1
                handle, temporary_name = tempfile.mkstemp(
                    prefix=f".{filename}.", suffix=".tmp", dir=output_dir
                )
                try:
                    with os.fdopen(handle, "wb") as temporary_file:
                        temporary_file.write(data)
                        temporary_file.flush()
                        os.fsync(temporary_file.fileno())
                except BaseException:
                    try:
                        os.unlink(temporary_name)
                    except FileNotFoundError:
                        pass
                    raise
                entries.append({
                    "destination": destination,
                    "temporary": Path(temporary_name),
                    "backup": None,
                    "existed": existed,
                    "installed": False,
                })

        for entry in entries:
            destination = entry["destination"]
            if entry["existed"]:
                handle, backup_name = tempfile.mkstemp(
                    prefix=f".{destination.name}.", suffix=".bak", dir=destination.parent
                )
                os.close(handle)
                os.unlink(backup_name)
                entry["backup"] = Path(backup_name)
                os.replace(destination, entry["backup"])
            os.replace(entry["temporary"], destination)
            entry["installed"] = True

        for output_dir in output_dirs:
            enable_acl_inheritance(output_dir)
    except BaseException as publish_error:
        rollback_errors = []
        for entry in reversed(entries):
            destination = entry["destination"]
            try:
                if entry["installed"] and destination.exists():
                    destination.unlink()
                if entry["backup"] is not None and entry["backup"].exists():
                    os.replace(entry["backup"], destination)
            except BaseException as rollback_error:
                backup = entry["backup"]
                backup_detail = (
                    f"; backup preserved at {backup}"
                    if backup is not None and backup.exists()
                    else ""
                )
                rollback_errors.append(
                    f"{destination}: {rollback_error}{backup_detail}"
                )
        if rollback_errors:
            preserve_backups = True
            raise RuntimeError(
                f"Icon publishing failed ({publish_error}); rollback also failed: "
                + "; ".join(rollback_errors)
            ) from publish_error
        raise
    finally:
        for entry in entries:
            cleanup_paths = [entry["temporary"]]
            if not preserve_backups:
                cleanup_paths.append(entry["backup"])
            for temporary in cleanup_paths:
                if temporary is not None:
                    try:
                        temporary.unlink()
                    except FileNotFoundError:
                        pass

    return summaries


def publish_icons(icons, output_dir: Path):
    return publish_icon_sets(icons, [output_dir])[output_dir]


def sha256(data: bytes):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Extract all MWO mech-icon PNGs, apply filename-matched ReplaceIcon "
            "overrides, and publish them to the local and browser asset folders."
        )
    )
    parser.add_argument("--game-dir", type=Path, default=DEFAULT_GAME_DIR)
    parser.add_argument("--replace-dir", type=Path, default=Path("ReplaceIcon"))
    parser.add_argument("--mechs-data", type=Path, default=DEFAULT_MECHS_DATA)
    parser.add_argument(
        "--out",
        action="append",
        type=Path,
        help=(
            "Output directory; repeat for multiple targets. Defaults to "
            "local-mech-icons and public/assets/mech-icons."
        ),
    )
    args = parser.parse_args()

    game_data_path = args.game_dir / GAME_DATA_PAK
    if not game_data_path.is_file():
        parser.error(f"GameData.pak not found: {game_data_path}")
    output_dirs = args.out or [
        Path("local-mech-icons"),
        DEFAULT_PUBLIC_OUTPUT,
    ]

    with zipfile.ZipFile(game_data_path) as game_data:
        icons = read_archive_icons(game_data)
    replacements, unmatched_replacements = apply_replacements(
        icons, args.replace_dir
    )
    browser_fallbacks = []
    for output_dir in output_dirs:
        if output_dir.resolve() == DEFAULT_PUBLIC_OUTPUT.resolve():
            browser_fallbacks = validate_browser_coverage(
                icons, output_dir, args.mechs_data
            )

    print(f"Archive icons: {len(icons)}")
    print(f"Replacement icons: {len(replacements)}")
    for filename in replacements:
        print(f"  {filename}: {sha256(icons[filename])}")
    print(f"Unmatched replacement icons preserved: {len(unmatched_replacements)}")
    for filename in unmatched_replacements:
        print(f"  {filename}")
    print(f"Preserved PAK-absent browser icons: {len(browser_fallbacks)}")
    for filename in browser_fallbacks:
        print(f"  {filename}")
    results = publish_icon_sets(icons, output_dirs)
    for output_dir in output_dirs:
        result = results[output_dir]
        print(
            f"Published {output_dir}: created {result['created']}, "
            f"updated {result['updated']}, unchanged {result['unchanged']}"
        )


if __name__ == "__main__":
    main()
