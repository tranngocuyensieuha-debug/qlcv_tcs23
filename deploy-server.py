#!/usr/bin/env python3
from __future__ import annotations

import json
import mimetypes
import os
import re
import sys
import zipfile
import sqlite3
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "5173"))
EXCEL_PATH = Path(os.environ.get("EXCEL_FILE", ROOT / "file du lieu.xlsx")).resolve()
DB_PATH = Path(os.environ.get("DB_FILE", ROOT / "tcs23_work.db")).resolve()

TASKS = [
    ("Số thu", 7, 8, 9),
    ("Kê khai thuế", 10, 11, 12),
    ("Quản lý rủi ro HKD", 13, 14, 15),
    ("Kiểm tra HKD", 16, 17, 18),
    ("Rà soát TMĐT", 19, 20, 21),
    ("Hỗ trợ hóa đơn điện tử", 22, 23, 24),
    ("Chuyển đổi lên doanh nghiệp", 25, 26, 27),
    ("Nộp thuế điện tử", 28, 29, 30),
    ("Nợ thuế", 31, 32, 33),
    ("Cưỡng chế xuất nhập cảnh", 34, 35, 36),
    ("Cưỡng chế tài khoản hóa đơn", 37, 38, 39),
    ("Hệ số K", 40, 41, 42),
    ("Thủ tục hành chính", 43, 44, 45),
]

NAME_MAP = {
    "Nguyễn Văn Toàn": "Nguyễn Viết Toàn",
}

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

SOURCE_METRICS = [
    [[6987737521,2930793434,"2026-12-31"],[0,0,"2026-10-06"],[21,0,"2026-06-30"],[1,0,"2026-07-31"],[60,27,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[550201428,225582585,"2026-06-30"],[0,0,"2026-12-31"],[44,32,"2026-06-30"],[81,70,"2026-06-30"],[21,21,"2026-05-31"],[0,0,"2026-10-06"]],
    [[13995553692,5733359454,"2026-12-31"],[0,0,"2026-10-06"],[90,0,"2026-06-30"],[2,0,"2026-07-31"],[29,9,"2026-06-30"],[0,0,"2026-12-31"],[1,0,"2026-12-31"],[569678837,199387593,"2026-06-30"],[0,0,"2026-12-31"],[238,238,"2026-06-30"],[369,358,"2026-06-30"],[32,32,"2026-05-31"],[0,0,"2026-10-06"]],
    [[8710597958,3505958322,"2026-12-31"],[0,0,"2026-10-06"],[54,0,"2026-06-30"],[0,0,"2026-07-31"],[32,21,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[387539226,147264906,"2026-06-30"],[0,0,"2026-12-31"],[92,80,"2026-06-30"],[142,112,"2026-06-30"],[40,40,"2026-05-31"],[0,0,"2026-10-06"]],
    [[3787728937,1678682224,"2026-12-31"],[0,0,"2026-10-06"],[48,0,"2026-06-30"],[0,0,"2026-07-31"],[3,1,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[462977387,143522990,"2026-06-30"],[0,0,"2026-12-31"],[47,43,"2026-06-30"],[73,58,"2026-06-30"],[65,65,"2026-05-31"],[0,0,"2026-10-06"]],
    [[5690048845,2503333052,"2026-12-31"],[0,0,"2026-10-06"],[67,0,"2026-06-30"],[1,0,"2026-07-31"],[64,22,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[208446572,66702903,"2026-06-30"],[0,0,"2026-12-31"],[131,112,"2026-06-30"],[226,193,"2026-06-30"],[77,77,"2026-05-31"],[0,0,"2026-10-06"]],
    [[8422383047,3782873514,"2026-12-31"],[0,0,"2026-10-06"],[46,0,"2026-06-30"],[0,0,"2026-07-31"],[56,13,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[175105514,64789040,"2026-06-30"],[0,0,"2026-12-31"],[63,47,"2026-06-30"],[95,82,"2026-06-30"],[16,16,"2026-05-31"],[0,0,"2026-10-06"]],
    [[9900000000,3757974007,"2026-12-31"],[0,0,"2026-10-06"],[28,0,"2026-06-30"],[3,0,"2026-07-31"],[47,21,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[304488729,121795492,"2026-06-30"],[0,0,"2026-12-31"],[33,14,"2026-06-30"],[18,13,"2026-06-30"],[64,64,"2026-05-31"],[0,0,"2026-10-06"]],
    [[13200000000,4968679675,"2026-12-31"],[0,0,"2026-10-06"],[24,0,"2026-06-30"],[11,0,"2026-07-31"],[55,24,"2026-06-30"],[0,0,"2026-12-31"],[1,0,"2026-12-31"],[548100316,197316114,"2026-06-30"],[0,0,"2026-12-31"],[29,10,"2026-06-30"],[34,28,"2026-06-30"],[7,7,"2026-05-31"],[0,0,"2026-10-06"]],
    [[13500000000,7118539599,"2026-12-31"],[0,0,"2026-10-06"],[39,0,"2026-06-30"],[3,0,"2026-07-31"],[51,20,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[639978944,217592841,"2026-06-30"],[0,0,"2026-12-31"],[54,28,"2026-06-30"],[71,59,"2026-06-30"],[75,75,"2026-05-31"],[0,0,"2026-10-06"]],
    [[6750000000,3264043975,"2026-12-31"],[0,0,"2026-10-06"],[65,0,"2026-06-30"],[0,0,"2026-07-31"],[49,15,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[391624729,137068655,"2026-06-30"],[0,0,"2026-12-31"],[30,14,"2026-06-30"],[24,21,"2026-06-30"],[75,75,"2026-05-31"],[0,0,"2026-10-06"]],
    [[6750000000,3264043975,"2026-12-31"],[0,0,"2026-10-06"],[65,0,"2026-06-30"],[0,0,"2026-07-31"],[50,15,"2026-06-30"],[0,0,"2026-12-31"],[1,0,"2026-12-31"],[391624729,137068655,"2026-06-30"],[0,0,"2026-12-31"],[30,14,"2026-06-30"],[25,21,"2026-06-30"],[76,76,"2026-05-31"],[0,0,"2026-10-06"]],
    [[9500000000,3005958709,"2026-12-31"],[0,0,"2026-10-06"],[33,0,"2026-06-30"],[4,0,"2026-07-31"],[72,25,"2026-06-30"],[0,0,"2026-12-31"],[1,0,"2026-12-31"],[339110799,128862104,"2026-06-30"],[0,0,"2026-12-31"],[33,25,"2026-06-30"],[34,31,"2026-06-30"],[38,38,"2026-05-31"],[0,0,"2026-10-06"]],
    [[9820000000,4515745218,"2026-12-31"],[0,0,"2026-10-06"],[34,0,"2026-06-30"],[0,0,"2026-07-31"],[67,6,"2026-06-30"],[0,0,"2026-12-31"],[0,0,"2026-12-31"],[714971654,214491496,"2026-06-30"],[0,0,"2026-12-31"],[133,124,"2026-06-30"],[45,34,"2026-06-30"],[132,132,"2026-05-31"],[0,0,"2026-10-06"]],
    [[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"],[0,0,"2026-10-06"]]
]


def column_to_index(cell_ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", cell_ref.upper())
    value = 0
    for letter in letters:
        value = value * 26 + (ord(letter) - 64)
    return value


def excel_serial_to_date(value: str) -> str:
    try:
        serial = float(value)
    except ValueError:
        return value[:10]
    if serial < 1 or serial > 60000:
        return "2026-10-06"
    try:
        date = datetime(1899, 12, 30) + timedelta(days=serial)
        return date.date().isoformat()
    except (OverflowError, ValueError):
        return "2026-10-06"


def normalize_date(value: object) -> str:
    text = "" if value is None else str(value).strip()
    if not text:
        return ""
    if re.match(r"^\d{4}-\d{2}-\d{2}", text):
        return text[:10]
    for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text[:10], fmt).date().isoformat()
        except ValueError:
            pass
    if re.match(r"^\d+(\.\d+)?$", text):
        return excel_serial_to_date(text)
    return text[:10] or "2026-10-06"


def number(value: object) -> int:
    text = "" if value is None else str(value).strip()
    if not text:
        return 0
    text = text.replace(".", "").replace(",", ".")
    text = re.sub(r"[^\d.-]", "", text)
    try:
        return round(float(text), 4)
    except ValueError:
        return 0


def read_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for item in root.findall("main:si", NS):
        texts = [node.text or "" for node in item.findall(".//main:t", NS)]
        strings.append("".join(texts))
    return strings


def first_sheet_path(zf: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    first_sheet = workbook.find("main:sheets/main:sheet", NS)
    if first_sheet is None:
        raise ValueError("Workbook không có sheet")
    relationship_id = first_sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    for rel in rels.findall("rel:Relationship", NS):
        if rel.attrib.get("Id") == relationship_id:
            target = rel.attrib["Target"]
            normalized = target.lstrip("/")
            if normalized.startswith("xl/"):
                return normalized
            return "xl/" + normalized
    return "xl/worksheets/sheet1.xml"


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("main:v", NS)
    if cell_type == "inlineStr":
        texts = [node.text or "" for node in cell.findall(".//main:t", NS)]
        return "".join(texts)
    if value_node is None or value_node.text is None:
        return ""
    value = value_node.text
    if cell_type == "s":
        return shared_strings[int(value)]
    return value


def read_sheet_matrix(path: Path) -> list[list[str]]:
    # Late import to prevent global XML parser errors
    from xml.etree import ElementTree as ET
    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf)
        sheet = ET.fromstring(zf.read(first_sheet_path(zf)))
    rows: list[list[str]] = []
    for row in sheet.findall(".//main:sheetData/main:row", NS):
        values: dict[int, str] = {}
        for cell in row.findall("main:c", NS):
            ref = cell.attrib.get("r", "")
            if not ref:
                continue
            values[column_to_index(ref)] = cell_value(cell, shared_strings)
        if values:
            max_col = max(values)
            rows.append([values.get(index, "") for index in range(1, max_col + 1)])
        else:
            rows.append([])
    return rows


def local_excel_rows() -> list[dict[str, object]]:
    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"Không tìm thấy {EXCEL_PATH}")
    sheet_rows = read_sheet_matrix(EXCEL_PATH)
    output: list[dict[str, object]] = []
    for row in sheet_rows[2:16]:
        officer = row[0].strip() if row else ""
        if not officer:
            continue
        officer = NAME_MAP.get(officer, officer)
        for task_title, assigned_col, completed_col, deadline_col in TASKS:
            output.append(
                {
                    "taskTitle": task_title,
                    "officerName": officer,
                    "assigned": number(row[assigned_col - 1] if len(row) >= assigned_col else ""),
                    "completed": number(row[completed_col - 1] if len(row) >= completed_col else ""),
                    "deadline": normalize_date(row[deadline_col - 1] if len(row) >= deadline_col else ""),
                }
            )
    return output


# --- DATABASE OPERATIONS ---

def init_db(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS metadata (
        schemaVersion INTEGER,
        updatedAt TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT,
        shortName TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS officers (
        id TEXT PRIMARY KEY,
        name TEXT,
        title TEXT,
        teamId TEXT,
        area TEXT,
        areaDetail TEXT,
        dataStatus TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS task_definitions (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        unit TEXT,
        measurement TEXT,
        reportPeriod TEXT,
        applicableTeamIds TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS work_items (
        id TEXT PRIMARY KEY,
        taskDefinitionId TEXT,
        teamId TEXT,
        officerId TEXT,
        taxpayerCode TEXT,
        subjectName TEXT,
        assigned REAL,
        completed REAL,
        deadline TEXT,
        status TEXT,
        updatedAt TEXT
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS backups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        dataset_json TEXT
    )
    """)
    
    cursor.execute("SELECT COUNT(*) FROM teams")
    if cursor.fetchone()[0] == 0:
        print("Database trống. Đang seeding dữ liệu mẫu...")
        seed_db(conn)
        
    conn.commit()
    conn.close()


def seed_db(conn: sqlite3.Connection) -> None:
    import seed_data
    cursor = conn.cursor()
    cursor.execute("INSERT INTO metadata (schemaVersion, updatedAt) VALUES (1, '2026-08-25T00:00:00.000Z')")
    
    # 1. Insert teams
    teams = []
    for t in seed_data.DEMO_TEAMS:
        teams.append((t["code"], t["name"], t["short"]))
    cursor.executemany("INSERT INTO teams (id, name, shortName) VALUES (?, ?, ?)", teams)
    
    # 2. Insert officers
    officers = []
    for team_id, staff_list in seed_data.DEMO_STAFF.items():
        for idx, s in enumerate(staff_list):
            officers.append((
                f"{team_id}-CB{str(idx+1).zfill(2)}",
                s["name"],
                s["role"],
                team_id,
                s["area"],
                s.get("detail", ""),
                s.get("status", "Đã xác định")
            ))
    cursor.executemany("INSERT INTO officers (id, name, title, teamId, area, areaDetail, dataStatus) VALUES (?, ?, ?, ?, ?, ?, ?)", officers)
    
    # 3. Insert task definitions
    definitions = []
    for t in seed_data.DEMO_TASKS:
        applicable_teams = []
        for team_id, task_codes in seed_data.DEMO_TASK_APP.items():
            if t["Mã nhiệm vụ"] in task_codes:
                applicable_teams.append(team_id)
        
        definitions.append((
            t["Mã nhiệm vụ"],
            t["Tên nhiệm vụ"],
            t["Lĩnh vực"],
            t["Đơn vị"],
            t["Loại đo lường"],
            t["Kỳ"].split(',')[0].strip(),
            json.dumps(applicable_teams)
        ))
    cursor.executemany("INSERT INTO task_definitions (id, name, category, unit, measurement, reportPeriod, applicableTeamIds) VALUES (?, ?, ?, ?, ?, ?, ?)", definitions)
    
    # 4. Insert work items
    def hash_num(s: str, min_val: int, max_val: int) -> int:
        h = 0
        for char in s:
            h = (h * 31 + ord(char)) & 0xFFFFFFFF
        return min_val + (h % (max_val - min_val + 1))
        
    def metric_for(key: str, task_id: str, is_revenue: bool, idx: int = 0):
        base = hash_num(key + task_id, 18, 145) + idx * 3
        ratio = hash_num("r" + key + task_id, 68, 96) / 100.0
        if is_revenue:
            target = hash_num(key, 20, 95) * 1000000000.0
            done = target * ratio
            return {
                "total": target,
                "done": done,
                "remain": max(0.0, target - done),
                "ratio": ratio
            }
        done = int(base * ratio)
        return {
            "total": base,
            "done": done,
            "remain": base - done,
            "ratio": ratio
        }

    work_items = []
    for team_id, staff_list in seed_data.DEMO_STAFF.items():
        applicable_tasks = seed_data.DEMO_TASK_APP.get(team_id, [])
        for o_idx, s in enumerate(staff_list):
            officer_id = f"{team_id}-CB{str(o_idx+1).zfill(2)}"
            for t_idx, task_id in enumerate(applicable_tasks):
                is_revenue = (task_id == "THU")
                m = metric_for(team_id + s["name"], task_id, is_revenue, t_idx)
                
                completed = round(m["done"])
                assigned = round(m["total"])
                status = "done" if (assigned > 0 and completed >= assigned) else "in_progress"
                
                work_items.append((
                    f"{team_id}-CV-{officer_id}-{task_id}",
                    task_id,
                    team_id,
                    officer_id,
                    "",
                    "",
                    assigned,
                    completed,
                    "2026-12-31",
                    status,
                    "2026-08-25T00:00:00.000Z"
                ))
                
    cursor.executemany("""
    INSERT INTO work_items (
        id, taskDefinitionId, teamId, officerId, taxpayerCode, subjectName, assigned, completed, deadline, status, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, work_items)


def get_dataset(db_path: Path) -> dict[str, object]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT schemaVersion, updatedAt FROM metadata LIMIT 1")
    meta = cursor.fetchone()
    schema_version = meta["schemaVersion"] if meta else 1
    updated_at = meta["updatedAt"] if meta else "2026-08-25T00:00:00.000Z"
    
    cursor.execute("SELECT id, name, shortName FROM teams")
    teams = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT id, name, title, teamId, area, areaDetail, dataStatus FROM officers")
    officers = []
    for r in cursor.fetchall():
        d = dict(r)
        if not d["areaDetail"]:
            del d["areaDetail"]
        if not d["dataStatus"]:
            del d["dataStatus"]
        officers.append(d)
        
    cursor.execute("SELECT id, name, category, unit, measurement, reportPeriod, applicableTeamIds FROM task_definitions")
    task_definitions = []
    for r in cursor.fetchall():
        d = dict(r)
        d["applicableTeamIds"] = json.loads(d["applicableTeamIds"])
        task_definitions.append(d)
        
    cursor.execute("SELECT id, taskDefinitionId, teamId, officerId, taxpayerCode, subjectName, assigned, completed, deadline, status, updatedAt FROM work_items")
    work_items = []
    for r in cursor.fetchall():
        d = dict(r)
        if not d["taxpayerCode"]:
            del d["taxpayerCode"]
        if not d["subjectName"]:
            del d["subjectName"]
        work_items.append(d)
        
    conn.close()
    
    return {
        "schemaVersion": schema_version,
        "updatedAt": updated_at,
        "teams": teams,
        "officers": officers,
        "taskDefinitions": task_definitions,
        "workItems": work_items
    }


def save_dataset(db_path: Path, data: dict[str, object]) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("BEGIN TRANSACTION")
        
        # Backup existing
        cursor.execute("SELECT COUNT(*) FROM teams")
        if cursor.fetchone()[0] > 0:
            current_dataset = get_dataset(db_path)
            current_json = json.dumps(current_dataset, ensure_ascii=False)
            cursor.execute("INSERT INTO backups (timestamp, dataset_json) VALUES (?, ?)", (datetime.now().isoformat(), current_json))
            
        cursor.execute("DELETE FROM metadata")
        cursor.execute("DELETE FROM teams")
        cursor.execute("DELETE FROM officers")
        cursor.execute("DELETE FROM task_definitions")
        cursor.execute("DELETE FROM work_items")
        
        schema_version = data.get("schemaVersion", 1)
        updated_at = data.get("updatedAt", datetime.utcnow().isoformat() + "Z")
        cursor.execute("INSERT INTO metadata (schemaVersion, updatedAt) VALUES (?, ?)", (schema_version, updated_at))
        
        teams_data = [(t["id"], t["name"], t["shortName"]) for t in data.get("teams", [])]
        cursor.executemany("INSERT INTO teams (id, name, shortName) VALUES (?, ?, ?)", teams_data)
        
        officers_data = [
            (
                o["id"],
                o["name"],
                o["title"],
                o["teamId"],
                o["area"],
                o.get("areaDetail", ""),
                o.get("dataStatus", "")
            )
            for o in data.get("officers", [])
        ]
        cursor.executemany("INSERT INTO officers (id, name, title, teamId, area, areaDetail, dataStatus) VALUES (?, ?, ?, ?, ?, ?, ?)", officers_data)
        
        task_defs_data = [
            (
                td["id"],
                td["name"],
                td["category"],
                td["unit"],
                td["measurement"],
                td["reportPeriod"],
                json.dumps(td.get("applicableTeamIds", []))
            )
            for td in data.get("taskDefinitions", [])
        ]
        cursor.executemany("INSERT INTO task_definitions (id, name, category, unit, measurement, reportPeriod, applicableTeamIds) VALUES (?, ?, ?, ?, ?, ?, ?)", task_defs_data)
        
        work_items_data = [
            (
                wi["id"],
                wi["taskDefinitionId"],
                wi["teamId"],
                wi["officerId"],
                wi.get("taxpayerCode", ""),
                wi.get("subjectName", ""),
                wi["assigned"],
                wi["completed"],
                wi["deadline"],
                wi["status"],
                wi.get("updatedAt", "")
            )
            for wi in data.get("workItems", [])
        ]
        cursor.executemany("""
        INSERT INTO work_items (
            id, taskDefinitionId, teamId, officerId, taxpayerCode, subjectName, assigned, completed, deadline, status, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, work_items_data)
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def restore_latest_backup(db_path: Path) -> dict[str, object]:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, dataset_json FROM backups ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError("Không có bản sao lưu nào được lưu trên máy chủ.")
        
    backup_id, backup_json = row[0], row[1]
    cursor.execute("DELETE FROM backups WHERE id = ?", (backup_id,))
    conn.commit()
    conn.close()
    
    dataset = json.loads(backup_json)
    save_dataset(db_path, dataset)
    return dataset


def reset_to_seed(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM teams")
    if cursor.fetchone()[0] > 0:
        current_dataset = get_dataset(db_path)
        current_json = json.dumps(current_dataset, ensure_ascii=False)
        cursor.execute("INSERT INTO backups (timestamp, dataset_json) VALUES (?, ?)", (datetime.now().isoformat(), current_json))
        conn.commit()
        
    cursor.execute("DELETE FROM metadata")
    cursor.execute("DELETE FROM teams")
    cursor.execute("DELETE FROM officers")
    cursor.execute("DELETE FROM task_definitions")
    cursor.execute("DELETE FROM work_items")
    
    seed_db(conn)
    conn.commit()
    conn.close()


# --- HTTP SERVER HANDLER ---

class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: object) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        
        # REST API: GET current dataset
        if parsed.path == "/api/dataset":
            try:
                self.send_json(200, get_dataset(DB_PATH))
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return
            
        elif parsed.path == "/api/local-file-du-lieu":
            try:
                self.send_json(200, local_excel_rows())
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return

        request_path = unquote(parsed.path).lstrip("/")
        if not request_path:
            request_path = "index.html"
            
        # Support React SPA Router (fallback non-file requests to index.html)
        file_path = (ROOT / request_path).resolve()
        if not str(file_path).startswith(str(ROOT)) or not file_path.exists() or file_path.is_dir():
            file_path = ROOT / "index.html"

        if file_path.exists():
            data = file_path.read_bytes()
            content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_error(404, "Không tìm thấy file")

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        
        # REST API: Replace/Save dataset
        if parsed.path == "/api/dataset":
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                dataset = json.loads(body.decode("utf-8"))
                
                save_dataset(DB_PATH, dataset)
                self.send_json(200, get_dataset(DB_PATH))
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return
            
        # REST API: Restore latest backup
        elif parsed.path == "/api/dataset/restore":
            try:
                dataset = restore_latest_backup(DB_PATH)
                self.send_json(200, dataset)
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return
            
        # REST API: Reset to seed data
        elif parsed.path == "/api/dataset/reset":
            try:
                reset_to_seed(DB_PATH)
                self.send_json(200, get_dataset(DB_PATH))
            except Exception as exc:
                self.send_json(500, {"error": str(exc)})
            return
            
        self.send_error(404, "Không tìm thấy API tương ứng")

    def log_message(self, format: str, *args: object) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main() -> None:
    # Khởi tạo database
    print(f"Đang cấu hình cơ sở dữ liệu SQLite tại: {DB_PATH}")
    init_db(DB_PATH)
    
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Server chạy tại http://{HOST}:{PORT}")
    print(f"File Excel: {EXCEL_PATH}")
    server.serve_forever()


if __name__ == "__main__":
    main()
