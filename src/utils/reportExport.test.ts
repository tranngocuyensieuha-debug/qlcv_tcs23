import * as XLSX from 'xlsx';
import { describe, expect, it, vi } from 'vitest';
import { seedDataset } from '../data/seedDataset';
import { buildWorkReportWorkbook, downloadWorkReport, WORK_REPORT_FILENAME } from './reportExport';

describe('xuất báo cáo XLSX', () => {
  it('chỉ chứa các work item đã lọc và tên quan hệ an toàn', () => {
    const item = seedDataset.workItems[0];
    const workbook = buildWorkReportWorkbook(seedDataset, [item]);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets['Bao cao']);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(expect.objectContaining({ 'Mã công việc': item.id, 'Cán bộ': 'Ngô Mai Trang', 'Nhiệm vụ': 'Số thu', 'Phải thực hiện': 6987737521 }));
  });
  it('ghi đúng tên file xlsx', () => {
    const write = vi.fn();
    downloadWorkReport(seedDataset, [seedDataset.workItems[0]], write);
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ SheetNames: ['Bao cao'] }), WORK_REPORT_FILENAME);
  });
});
