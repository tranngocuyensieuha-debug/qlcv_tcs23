import * as XLSX from 'xlsx';
import type { ImportIssue } from './excelAdapter';

export const IMPORT_ERRORS_FILENAME = 'loi-nhap-du-lieu-tcs23.xlsx';

export function buildImportErrorsWorkbook(errors: ImportIssue[]): XLSX.WorkBook {
  const rows = [['Sheet', 'Dòng', 'Cột', 'Giá trị', 'Mã lỗi', 'Thông báo'], ...errors.map((e) => [e.sheet, e.row, e.column, e.value ?? '', e.code, e.message])];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Loi nhap du lieu');
  return workbook;
}

export function downloadImportErrors(errors: ImportIssue[], writer: (workbook: XLSX.WorkBook, filename: string) => void = XLSX.writeFile): void {
  writer(buildImportErrorsWorkbook(errors), IMPORT_ERRORS_FILENAME);
}
