import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { parseExcelBuffer } from './importData';

describe('parseExcelBuffer legacy', () => {
  it('giữ API cũ nhưng đọc xlsx từ package cục bộ', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Tên nhiệm vụ', 'Cán bộ', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn'],
      ['Rà soát', 'Nguyễn An', 3, 1, '2026-09-30'],
    ]), 'Du lieu');
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    await expect(parseExcelBuffer(buffer)).resolves.toEqual([expect.objectContaining({ taskTitle: 'Rà soát', officerName: 'Nguyễn An', assigned: 3 })]);
  });
});
