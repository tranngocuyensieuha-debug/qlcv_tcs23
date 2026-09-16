from __future__ import annotations

from pathlib import Path
import shutil
import tempfile
import zipfile
import xml.etree.ElementTree as ET


SOURCE = Path(r"D:\quan ly cong viec\file du lieu.xlsx")
OUTPUTS = [
    Path(r"D:\quan ly cong viec\app\dist\file"),
    Path(r"D:\quan ly cong viec\app\dist\file du lieu.xlsx"),
]
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def main() -> None:
    ET.register_namespace("", REL_NS)
    with tempfile.TemporaryDirectory() as temp_dir:
        extract_dir = Path(temp_dir) / "xlsx"
        with zipfile.ZipFile(SOURCE, "r") as zf:
            zf.extractall(extract_dir)

        rels_path = extract_dir / "xl" / "_rels" / "workbook.xml.rels"
        tree = ET.parse(rels_path)
        root = tree.getroot()
        changed = False
        for rel in root.findall(f"{{{REL_NS}}}Relationship"):
            target = rel.attrib.get("Target", "")
            if target.startswith("xl/worksheets/"):
                rel.set("Target", target.replace("xl/", "", 1))
                changed = True
            elif target.startswith("/xl/worksheets/"):
                rel.set("Target", target.replace("/xl/", "", 1))
                changed = True
        tree.write(rels_path, encoding="utf-8", xml_declaration=True)

        patched = Path(temp_dir) / "patched.xlsx"
        with zipfile.ZipFile(patched, "w", zipfile.ZIP_DEFLATED) as zf:
            for file in extract_dir.rglob("*"):
                if file.is_file():
                    zf.write(file, file.relative_to(extract_dir).as_posix())

        for output in OUTPUTS:
            shutil.copy2(patched, output)
            print(f"{output}: {output.stat().st_size} bytes")
        print(f"relationship_changed={changed}")


if __name__ == "__main__":
    main()
