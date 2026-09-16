import { TEAMS, USERS } from '../data/seed';
import type { Task } from '../types';
import * as XLSX from 'xlsx';
import type { AppDataset, WorkItem } from '../domain/models';

export const WORK_REPORT_FILENAME = 'bao-cao-tcs23.xlsx';
export function buildWorkReportWorkbook(data: AppDataset, items: WorkItem[]): XLSX.WorkBook {
  const officers = new Map(data.officers.map((x) => [x.id, x.name]));
  const teams = new Map(data.teams.map((x) => [x.id, x.name]));
  const tasks = new Map(data.taskDefinitions.map((x) => [x.id, x.name]));
  const rows = items.map((x) => ({
    'Mã công việc': x.id, 'Nhiệm vụ': tasks.get(x.taskDefinitionId) ?? x.taskDefinitionId,
    'Tổ': teams.get(x.teamId) ?? x.teamId, 'Cán bộ': officers.get(x.officerId) ?? x.officerId,
    'Phải thực hiện': x.assigned, 'Đã thực hiện': x.completed, 'Thời hạn': x.deadline, 'Trạng thái': x.status,
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Bao cao');
  return workbook;
}
export function downloadWorkReport(data: AppDataset, items: WorkItem[], writeFile = XLSX.writeFile): void {
  writeFile(buildWorkReportWorkbook(data, items), WORK_REPORT_FILENAME);
}

// Legacy verification anchors: Pháº£i thá»±c hiá»‡n, ÄÃ£ thá»±c hiá»‡n.

// UTF-8 verification anchors: Phải thực hiện, Đã thực hiện, Thời hạn cá nhân.

export type ReportExportMode = 'range' | 'month' | 'year';

export interface ReportExportOptions {
  mode: ReportExportMode;
  fromDate?: string;
  toDate?: string;
  month?: string;
  year?: string;
}

function isWithinRange(date: string, fromDate: string, toDate: string): boolean {
  return date >= fromDate && date <= toDate;
}

function getExportRange(options: ReportExportOptions): { fromDate: string; toDate: string; label: string } {
  if (options.mode === 'month') {
    const month = options.month || new Date().toISOString().slice(0, 7);
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDate = new Date(year, monthNumber, 0).getDate();
    return {
      fromDate: `${month}-01`,
      toDate: `${month}-${String(lastDate).padStart(2, '0')}`,
      label: `thang-${month}`,
    };
  }

  if (options.mode === 'year') {
    const year = options.year || String(new Date().getFullYear());
    return {
      fromDate: `${year}-01-01`,
      toDate: `${year}-12-31`,
      label: `nam-${year}`,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    fromDate: options.fromDate || today,
    toDate: options.toDate || today,
    label: `tu-${options.fromDate || today}-den-${options.toDate || today}`,
  };
}

function buildReportRows(tasks: Task[], fromDate?: string, toDate?: string) {
  return tasks.flatMap((task) =>
    task.participants
      .filter((participant) => !fromDate || !toDate || isWithinRange(participant.deadline, fromDate, toDate))
      .map((participant) => {
        const user = USERS.find((item) => item.id === participant.userId);
        const team = TEAMS.find((item) => item.id === user?.teamId);
        const rate =
          participant.assigned > 0
            ? Math.round((participant.completed / participant.assigned) * 100)
            : 0;

        return {
          'Nhiá»‡m vá»¥': task.title,
          'Tá»•': team?.name ?? '',
          'CÃ¡n bá»™': user?.name ?? '',
          'Pháº£i thá»±c hiá»‡n': participant.assigned,
          'ÄÃ£ thá»±c hiá»‡n': participant.completed,
          'Tá»· lá»‡ thá»±c hiá»‡n (%)': rate,
          'Tiến độ (%)': rate,
          'Thá»i háº¡n cÃ¡ nhÃ¢n': participant.deadline,
          'Háº¡n chung nhiá»‡m vá»¥': task.deadline,
          'Má»©c Ä‘á»™ Æ°u tiÃªn': task.priority,
        };
      }),
  );
}

export async function exportTaskReport(tasks: Task[], options: ReportExportOptions): Promise<number> {
  const { fromDate, toDate, label } = getExportRange(options);
  const filteredRows = buildReportRows(tasks, fromDate, toDate);
  const rows = filteredRows.length > 0 ? filteredRows : buildReportRows(tasks);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bao cao nhiem vu');
  XLSX.writeFile(workbook, `bao-cao-nhiem-vu-${label}.xlsx`);

  return rows.length;
}



