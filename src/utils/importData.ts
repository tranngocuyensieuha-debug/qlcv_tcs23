import type { TaskImportRow } from '../types';
import * as XLSX from 'xlsx';

type RawRow = Record<string, unknown>;
type RawSheetRow = unknown[];

const HEADER_ALIASES = {
  taskTitle: ['nhiệm vụ', 'ten nhiem vu', 'tên nhiệm vụ', 'công việc', 'ten cong viec', 'tên công việc'],
  officerName: ['cán bộ', 'can bo', 'người thực hiện', 'nguoi thuc hien', 'người được giao', 'nguoi duoc giao'],
  teamName: ['tổ', 'to', 'tổ quản lý', 'to quan ly', 'tổ phụ trách', 'to phu trach'],
  taxpayerCode: ['mã số thuế', 'ma so thue', 'mst', 'mã mst', 'ma mst'],
  citizenId: ['căn cước công dân', 'can cuoc cong dan', 'cccd', 'cmnd', 'số căn cước', 'so can cuoc'],
  assigned: ['phải thực hiện', 'phai thuc hien', 'tổng phải thực hiện', 'tong phai thuc hien', 'chỉ tiêu', 'chi tieu'],
  completed: ['đã thực hiện', 'da thuc hien', 'số đã thực hiện', 'so da thuc hien', 'thực hiện', 'thuc hien'],
  deadline: ['deadline', 'thời hạn', 'thoi han', 'hạn xử lý', 'han xu ly', 'tiến độ thời hạn', 'tien do thoi han'],
} as const;

const WIDE_TASKS = [
  { match: 'tong thu tren dia ban', title: 'Số thu' },
  { match: 'quan ly khai thue', title: 'Kê khai thuế' },
  { match: 'quan ly rui ro hoa don', title: 'Quản lý rủi ro HKD' },
  { match: 'kiem tra ho kinh doanh', title: 'Kiểm tra HKD' },
  { match: 'goi du lieu ho kinh doanh', title: 'Rà soát TMĐT' },
  { match: 'hoa don dien tu', title: 'Hỗ trợ hóa đơn điện tử' },
  { match: 'chuyen doi len doanh nghiep', title: 'Chuyển đổi lên doanh nghiệp' },
  { match: 'nop thue dien tu', title: 'Nộp thuế điện tử' },
  { match: 'no thue', title: 'Nợ thuế' },
  { match: 'cuong che xnc', title: 'Cưỡng chế xuất nhập cảnh' },
  { match: 'cuong che tk hd', title: 'Cưỡng chế tài khoản hóa đơn' },
  { match: 'he so k', title: 'Hệ số K' },
  { match: 'tthc', title: 'Thủ tục hành chính' },
];

const OFFICER_NAME_MAP: Record<string, string> = {
  'nguyen van toan': 'Nguyễn Viết Toàn',
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[đ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;

  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const text = String(value).trim();
  if (!text) return undefined;

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const dateParts = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dateParts) {
    const [, day, month, year] = dateParts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return undefined;
}

function getCell(row: RawRow, aliases: readonly string[]): unknown {
  const entries = Object.entries(row);
  const normalizedAliases = aliases.map(normalizeText);
  const found = entries.find(([key]) => normalizedAliases.includes(normalizeText(key)));
  return found?.[1];
}

function toImportRow(row: RawRow): TaskImportRow | null {
  const taskTitle = getCell(row, HEADER_ALIASES.taskTitle);
  const officerName = getCell(row, HEADER_ALIASES.officerName);
  if (!taskTitle || !officerName) return null;

  return {
    taskTitle: String(taskTitle).trim(),
    officerName: String(officerName).trim(),
    teamName: String(getCell(row, HEADER_ALIASES.teamName) ?? '').trim() || undefined,
    taxpayerCode: String(getCell(row, HEADER_ALIASES.taxpayerCode) ?? '').trim() || undefined,
    citizenId: String(getCell(row, HEADER_ALIASES.citizenId) ?? '').trim() || undefined,
    assigned: parseNumber(getCell(row, HEADER_ALIASES.assigned)),
    completed: parseNumber(getCell(row, HEADER_ALIASES.completed)),
    deadline: parseDate(getCell(row, HEADER_ALIASES.deadline)),
  };
}

function getWideTaskTitle(group: string): string | undefined {
  const normalized = normalizeText(group);
  return WIDE_TASKS.find((task) => normalized.includes(task.match))?.title;
}

function normalizeOfficerName(name: string): string {
  return OFFICER_NAME_MAP[normalizeText(name)] ?? name.trim();
}

function parseWideSummaryRows(rows: RawSheetRow[]): TaskImportRow[] {
  if (rows.length < 3) return [];

  const firstHeader = normalizeText(String(rows[0]?.[0] ?? ''));
  const hasWideHeader =
    firstHeader.includes('ten can bo') ||
    rows[0]?.some((cell) => normalizeText(String(cell ?? '')).includes('tong thu tren dia ban'));
  if (!hasWideHeader) return [];

  const output: TaskImportRow[] = [];
  let activeGroup = '';
  const columns: { taskTitle: string; assigned?: number; completed?: number; deadline?: number }[] = [];

  for (let columnIndex = 0; columnIndex < Math.max(rows[0].length, rows[1].length); columnIndex += 1) {
    const group = String(rows[0]?.[columnIndex] ?? '').trim();
    if (group) activeGroup = group;

    const taskTitle = getWideTaskTitle(activeGroup);
    const subHeader = normalizeText(String(rows[1]?.[columnIndex] ?? ''));
    if (!taskTitle) continue;

    const existing = columns.find((item) => item.taskTitle === taskTitle) ?? { taskTitle };
    if (!columns.includes(existing)) columns.push(existing);
    if (subHeader === 'so phai thuc hien') existing.assigned = columnIndex;
    if (subHeader === 'so da thuc hien') existing.completed = columnIndex;
    if (subHeader === 'thoi han') existing.deadline = columnIndex;
  }

  for (const row of rows.slice(2)) {
    const rawName = String(row[0] ?? '').trim();
    const normalizedName = normalizeText(rawName);
    if (!rawName || normalizedName === 'tong' || normalizedName.includes('mo ta cach thuc')) break;

    const officerName = normalizeOfficerName(rawName);
    for (const column of columns) {
      if (column.assigned === undefined || column.completed === undefined || column.deadline === undefined) continue;

      output.push({
        taskTitle: column.taskTitle,
        officerName,
        assigned: parseNumber(row[column.assigned]) ?? 0,
        completed: parseNumber(row[column.completed]) ?? 0,
        deadline: parseDate(row[column.deadline]) ?? '',
      });
    }
  }

  return output;
}

export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<TaskImportRow[]> {
  const workbook = XLSX.read(buffer, { type: 'array' });

  const wideRows = workbook.SheetNames.flatMap((sheetName) =>
    parseWideSummaryRows(
      XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false }) as RawSheetRow[],
    ),
  );
  if (wideRows.length > 0) return wideRows;

  const flatRows = workbook.SheetNames.flatMap((sheetName) =>
    XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '', raw: false }) as RawRow[],
  );

  return flatRows.map(toImportRow).filter((row): row is TaskImportRow => row !== null);
}

export async function parseExcelFile(file: File): Promise<TaskImportRow[]> {
  return parseExcelBuffer(await file.arrayBuffer());
}

export function normalizeGoogleDriveUrl(input: string): string {
  const url = input.trim();
  const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch) {
    return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=xlsx`;
  }

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
  }

  return url;
}

export async function parseExcelFromUrl(url: string): Promise<TaskImportRow[]> {
  const response = await fetch(normalizeGoogleDriveUrl(url));
  if (!response.ok) throw new Error(`Không tải được file: HTTP ${response.status}`);
  return parseExcelBuffer(await response.arrayBuffer());
}
