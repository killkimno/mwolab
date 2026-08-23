import importlib.util
import io
import json
import struct
import tempfile
import unittest
import zipfile
import zlib
from pathlib import Path
from unittest import mock


MODULE_PATH = Path(__file__).parents[1] / "tools" / "extract_mwo_mech_icons.py"
SPEC = importlib.util.spec_from_file_location("extract_mwo_mech_icons", MODULE_PATH)
EXTRACTOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EXTRACTOR)


def png_chunk(kind, data):
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def rgba_png(color):
    scanline = b"\x00" + bytes(color) * 256
    pixels = scanline * 256
    return (
        EXTRACTOR.PNG_SIGNATURE
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", 256, 256, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(pixels))
        + png_chunk(b"IEND", b"")
    )


def make_pak(files):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name, data in files.items():
            archive.writestr(EXTRACTOR.ICON_PREFIX + name, data)
    buffer.seek(0)
    return buffer


class ExtractMwoMechIconsTests(unittest.TestCase):
    def test_replacement_wins_and_publish_preserves_unrelated_existing_file(self):
        archive_icon = rgba_png((1, 2, 3, 255))
        replacement_icon = rgba_png((4, 5, 6, 255))
        with zipfile.ZipFile(make_pak({"NVA-PRIMEI.PNG": archive_icon})) as archive:
            icons = EXTRACTOR.read_archive_icons(archive)
        self.assertEqual(list(icons), ["nva-primei.png"])

        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            replace_dir = root / "ReplaceIcon"
            output_dir = root / "icons"
            replace_dir.mkdir()
            output_dir.mkdir()
            (replace_dir / "NVA-PRIMEI.PNG").write_bytes(replacement_icon)
            (output_dir / "legacy.png").write_bytes(b"preserved")

            replacements = EXTRACTOR.apply_replacements(icons, replace_dir)
            with mock.patch.object(EXTRACTOR, "enable_acl_inheritance"):
                result = EXTRACTOR.publish_icons(icons, output_dir)

            self.assertEqual(replacements, ["nva-primei.png"])
            self.assertEqual((output_dir / "nva-primei.png").read_bytes(), replacement_icon)
            self.assertEqual((output_dir / "legacy.png").read_bytes(), b"preserved")
            self.assertEqual(result, {"created": 1, "updated": 0, "unchanged": 0})

    def test_unknown_replacement_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary_dir:
            replace_dir = Path(temporary_dir)
            (replace_dir / "typo.png").write_bytes(rgba_png((1, 2, 3, 255)))
            with self.assertRaisesRegex(RuntimeError, "no matching GameData.pak icon"):
                EXTRACTOR.apply_replacements(
                    {"known.png": rgba_png((4, 5, 6, 255))}, replace_dir
                )

    def test_browser_coverage_accepts_and_validates_existing_pak_absent_icon(self):
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            output_dir = root / "icons"
            output_dir.mkdir()
            mechs_data = root / "mechs.json"
            mechs_data.write_text(
                json.dumps([{"name": "known"}, {"name": "legacy"}]),
                encoding="utf-8",
            )
            (output_dir / "legacy.png").write_bytes(rgba_png((1, 2, 3, 255)))

            fallbacks = EXTRACTOR.validate_browser_coverage(
                {"known.png": rgba_png((4, 5, 6, 255))}, output_dir, mechs_data
            )

            self.assertEqual(fallbacks, ["legacy.png"])

    def test_browser_coverage_rejects_missing_icon(self):
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            output_dir = root / "icons"
            output_dir.mkdir()
            mechs_data = root / "mechs.json"
            mechs_data.write_text(json.dumps([{"name": "missing"}]), encoding="utf-8")

            with self.assertRaisesRegex(RuntimeError, "missing.png"):
                EXTRACTOR.validate_browser_coverage({}, output_dir, mechs_data)

    def test_wrong_icon_dimensions_are_rejected(self):
        invalid = (
            EXTRACTOR.PNG_SIGNATURE
            + png_chunk(b"IHDR", struct.pack(">IIBBBBB", 64, 64, 8, 6, 0, 0, 0))
            + png_chunk(b"IEND", b"")
        )
        with self.assertRaisesRegex(RuntimeError, "256x256"):
            EXTRACTOR.validate_mech_icon(invalid, "invalid.png")

    def test_invalid_scanline_filter_is_rejected(self):
        pixels = (b"\x05" + bytes((1, 2, 3, 255)) * 256) * 256
        invalid = (
            EXTRACTOR.PNG_SIGNATURE
            + png_chunk(b"IHDR", struct.pack(">IIBBBBB", 256, 256, 8, 6, 0, 0, 0))
            + png_chunk(b"IDAT", zlib.compress(pixels))
            + png_chunk(b"IEND", b"")
        )
        with self.assertRaisesRegex(RuntimeError, "scanline filter"):
            EXTRACTOR.validate_mech_icon(invalid, "invalid-filter.png")

    def test_multi_output_failure_rolls_back_every_output(self):
        old_icon = rgba_png((1, 2, 3, 255))
        new_icon = rgba_png((4, 5, 6, 255))
        with tempfile.TemporaryDirectory() as temporary_dir:
            root = Path(temporary_dir)
            first = root / "first"
            second = root / "second"
            first.mkdir()
            second.mkdir()
            (first / "icon.png").write_bytes(old_icon)
            (second / "icon.png").write_bytes(old_icon)
            real_replace = EXTRACTOR.os.replace
            failed = False

            def fail_second_install(source, destination):
                nonlocal failed
                source = Path(source)
                destination = Path(destination)
                if (
                    not failed
                    and source.suffix == ".tmp"
                    and destination.parent == second
                ):
                    failed = True
                    raise OSError("simulated publish failure")
                return real_replace(source, destination)

            with mock.patch.object(EXTRACTOR, "enable_acl_inheritance"):
                with mock.patch.object(EXTRACTOR.os, "replace", fail_second_install):
                    with self.assertRaisesRegex(OSError, "simulated publish failure"):
                        EXTRACTOR.publish_icon_sets(
                            {"icon.png": new_icon}, [first, second]
                        )

            self.assertEqual((first / "icon.png").read_bytes(), old_icon)
            self.assertEqual((second / "icon.png").read_bytes(), old_icon)
            self.assertEqual(list(first.glob(".*.tmp")), [])
            self.assertEqual(list(second.glob(".*.tmp")), [])

    def test_rollback_failure_preserves_backup_for_manual_recovery(self):
        old_icon = rgba_png((1, 2, 3, 255))
        new_icon = rgba_png((4, 5, 6, 255))
        with tempfile.TemporaryDirectory() as temporary_dir:
            output_dir = Path(temporary_dir) / "icons"
            output_dir.mkdir()
            destination = output_dir / "icon.png"
            destination.write_bytes(old_icon)
            real_replace = EXTRACTOR.os.replace

            def fail_install_and_restore(source, target):
                source = Path(source)
                target = Path(target)
                if source.suffix == ".tmp" or source.suffix == ".bak":
                    raise OSError(f"simulated {source.suffix} failure")
                return real_replace(source, target)

            with mock.patch.object(EXTRACTOR, "enable_acl_inheritance"):
                with mock.patch.object(EXTRACTOR.os, "replace", fail_install_and_restore):
                    with self.assertRaisesRegex(
                        RuntimeError, "backup preserved at"
                    ):
                        EXTRACTOR.publish_icon_sets(
                            {"icon.png": new_icon}, [output_dir]
                        )

            backups = list(output_dir.glob(".*.bak"))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].read_bytes(), old_icon)
            self.assertFalse(destination.exists())

    def test_case_insensitive_archive_collision_is_rejected(self):
        icon = rgba_png((1, 2, 3, 255))
        with zipfile.ZipFile(make_pak({"same.png": icon, "SAME.PNG": icon})) as archive:
            with self.assertRaisesRegex(RuntimeError, "Duplicate case-insensitive"):
                EXTRACTOR.read_archive_icons(archive)


if __name__ == "__main__":
    unittest.main()
