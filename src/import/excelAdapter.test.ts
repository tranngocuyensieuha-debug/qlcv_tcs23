/// <reference types="node" />
import * as XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { importWorkbook, MAX_IMPORT_BYTES, parseExcelDataset } from './excelAdapter';
import { buildImportErrorsWorkbook, downloadImportErrors, IMPORT_ERRORS_FILENAME } from './exportErrors';
import { migrateDataset } from '../data/localStorageRepository';
import { mergeTeamDataset } from '../data/mergeTeamDataset';
import { mergeThematicDataset } from '../data/mergeThematicDataset';
import { seedDataset } from '../data/seedDataset';

function bufferOf(sheets: Record<string, unknown[][]>): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  }
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

function date1904Buffer(sheets: Record<string, unknown[][]>): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  workbook.Workbook = { WBProps: { date1904: true } };
  for (const [name, rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name);
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

const validSheets = {
  Teams: [['Mã tổ', 'Tên tổ', 'Tên ngắn'], ['T1', 'Tổ Một', 'T1']],
  Officers: [['Mã cán bộ', 'Tên cán bộ', 'Chức danh', 'Mã tổ', 'Địa bàn'], ['CB1', 'Nguyễn An', 'Công chức', 'T1', 'Xã A']],
  TaskDefinitions: [['Mã nhiệm vụ', 'Tên nhiệm vụ', 'Nhóm', 'Đơn vị', 'Cách đo', 'Kỳ báo cáo', 'Mã tổ áp dụng'], ['NV1', 'Rà soát', 'Quản lý', 'Hồ sơ', 'Số hoàn thành', 'Tháng', 'T1']],
  WorkItems: [['Mã công việc', 'Mã nhiệm vụ', 'Mã tổ', 'Mã cán bộ', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn', 'Trạng thái'], ['CV1', 'NV1', 'T1', 'CB1', 5, 2, '2026-09-30', 'in_progress']],
};

describe('parseExcelDataset', () => {
  it('đọc trực tiếp workbook wide nguồn', () => {
    const result = parseExcelDataset(readFileSync('../../../file du lieu.xlsx'));
    expect(result.errors).toEqual([]);
    expect(result.dataset?.workItems.length).toBeGreaterThan(0);
    expect(result.dataset?.workItems.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.deadline))).toBe(true);
    expect(result.dataset?.teams).toHaveLength(8);
    expect(result.dataset?.workItems.every((item) => item.teamId === 'HKD1')).toBe(true);
    expect(result).toEqual(expect.objectContaining({ scope: 'team', teamId: 'HKD1' }));
  });

  it('dùng tổ mặc định hợp lệ cho summary và vẫn giữ đủ 8 tổ', () => {
    const source = bufferOf({ 'Du lieu': [
      ['Tên cán bộ', 'Số thu', '', ''],
      ['', 'Số phải thực hiện', 'Số đã thực hiện', 'Thời hạn'],
      ['Người mới', 10, 4, '2026-12-31'],
    ] });
    const result = importWorkbook(source, { defaultTeamId: 'HKD2' });
    expect(result.dataset?.teams).toHaveLength(8);
    expect(result.dataset?.officers[0].teamId).toBe('HKD2');
  });
  it('namespace mọi ID summary theo tổ', () => {
    const source = bufferOf({ 'Du lieu': [['Tên cán bộ','Số thu','',''],['','Số phải thực hiện','Số đã thực hiện','Thời hạn'],['Cùng tên',2,1,'2026-12-31']] });
    const first = importWorkbook(source, { defaultTeamId: 'HKD1' }).dataset!;
    const second = importWorkbook(source, { defaultTeamId: 'HKD2' }).dataset!;
    expect(first.officers[0].id).not.toBe(second.officers[0].id);
    expect(first.taskDefinitions[0].id).not.toBe(second.taskDefinitions[0].id);
    expect(first.workItems[0].id).not.toBe(second.workItems[0].id);
    expect(first.workItems[0]).toEqual(expect.objectContaining({ officerId: first.officers[0].id, taskDefinitionId: first.taskDefinitions[0].id }));
  });
  it('merge cùng workbook lần lượt vào HKD1 và HKD2 không trùng ID', () => {
    const source = bufferOf({ 'Du lieu': [['Tên cán bộ','Số thu','',''],['','Số phải thực hiện','Số đã thực hiện','Thời hạn'],['Cùng tên',2,1,'2026-12-31']] });
    const hkd1 = importWorkbook(source, { defaultTeamId: 'HKD1' }).dataset!;
    const afterHkd1 = mergeTeamDataset(seedDataset, hkd1, 'HKD1');
    const hkd2 = importWorkbook(source, { defaultTeamId: 'HKD2' }).dataset!;
    const merged = mergeTeamDataset(afterHkd1, hkd2, 'HKD2');
    expect(merged.officers.some((x) => x.teamId === 'HKD1' && x.name === 'Cùng tên')).toBe(true);
    expect(merged.officers.some((x) => x.teamId === 'HKD2' && x.name === 'Cùng tên')).toBe(true);
    expect(merged.workItems.some((x) => x.teamId === 'HKD1')).toBe(true);
    expect(merged.workItems.some((x) => x.teamId === 'HKD2')).toBe(true);
    for (const values of [merged.officers, merged.taskDefinitions, merged.workItems]) expect(new Set(values.map((x) => x.id)).size).toBe(values.length);
    expect(migrateDataset(merged)).toEqual(merged);
  });
  it('giữ danh sách tổ hiện tại tùy biến và từ chối default không có trong danh sách', () => {
    const source = bufferOf({ 'Du lieu': [['Tên cán bộ','Số thu','',''],['','Số phải thực hiện','Số đã thực hiện','Thời hạn'],['An',2,1,'2026-12-31']] });
    const custom = [{ id: 'CUSTOM', name: 'Tổ tùy biến', shortName: 'TC' }];
    expect(importWorkbook(source, { defaultTeamId: 'CUSTOM', availableTeams: custom }).dataset?.teams).toEqual(custom);
    const invalid = importWorkbook(source, { defaultTeamId: 'MISSING', availableTeams: custom });
    expect(invalid.dataset).toBeUndefined();
    expect(invalid.errors).toContainEqual(expect.objectContaining({ sheet: 'Du lieu', row: 1, column: 'A', code: 'unknown-reference', value: 'MISSING' }));
  });

  it('đọc trực tiếp template flat và báo ô còn thiếu thay vì nuốt lỗi', () => {
    const result = parseExcelDataset(readFileSync('public/mau-tong-hop.xlsx'));
    expect(result.dataset).toBeUndefined();
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'Du lieu', row: 3, column: 'K', code: 'missing' }));
    expect(result.errors.length).toBeLessThan(100);
  });

  it('công khai API importWorkbook', () => {
    expect(importWorkbook(bufferOf(validSheets)).dataset?.workItems).toHaveLength(1);
  });

  it('nhập workbook chuẩn thành dataset hợp lệ', () => {
    const result = parseExcelDataset(bufferOf(validSheets));
    expect(result.errors).toEqual([]);
    expect(result.validRowCount).toBe(1);
    expect(result.dataset?.workItems).toHaveLength(1);
    expect(result.scope).toBe('full');
  });

  it('báo đúng vị trí giá trị bắt buộc bị thiếu', () => {
    const sheets = structuredClone(validSheets);
    sheets.WorkItems[1][3] = '';
    const result = parseExcelDataset(bufferOf(sheets));
    expect(result.dataset).toBeUndefined();
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'WorkItems', row: 2, column: 'D', value: '', code: 'missing' }));
    expect(result.validRowCount).toBe(0);
  });

  it('giữ nguyên số dòng Excel khi có dòng trắng', () => {
    const sheets = structuredClone(validSheets);
    sheets.WorkItems.splice(1, 0, []);
    sheets.WorkItems[2][3] = '';
    expect(importWorkbook(bufferOf(sheets)).errors).toContainEqual(expect.objectContaining({ sheet: 'WorkItems', row: 3, column: 'D' }));
  });

  it.each([
    ['Teams', 0], ['Officers', 0], ['TaskDefinitions', 0], ['WorkItems', 0],
  ])('phát hiện ID trùng trong %s', (sheet, keyIndex) => {
    const sheets = structuredClone(validSheets) as Record<string, unknown[][]>;
    const duplicate = [...sheets[sheet][1]];
    duplicate[keyIndex] = sheets[sheet][1][keyIndex];
    sheets[sheet].push(duplicate);
    const result = importWorkbook(bufferOf(sheets));
    expect(result.duplicateCount).toBe(1);
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet, row: 3, column: 'A', code: 'duplicate' }));
  });

  it('coi ID chuẩn chỉ khác case/khoảng trắng là duplicate', () => {
    const sheets = structuredClone(validSheets);
    sheets.Teams.push([' t1 ', 'Tổ trùng', 'T1X']);
    const result = importWorkbook(bufferOf(sheets));
    expect(result.duplicateCount).toBe(1);
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'Teams', row: 3, column: 'A', value: 't1', code: 'duplicate' }));
  });

  it('rewrite foreign keys canonical về đúng actual parent IDs', () => {
    const sheets = structuredClone(validSheets);
    sheets.Officers[1][3] = 't1';
    sheets.TaskDefinitions[1][6] = ' t1 ';
    sheets.WorkItems[1][1] = 'nv1';
    sheets.WorkItems[1][2] = ' t1 ';
    sheets.WorkItems[1][3] = 'cb1';
    const result = importWorkbook(bufferOf(sheets));
    expect(result.errors).toEqual([]);
    const dataset = result.dataset!;
    expect(dataset.officers[0].teamId).toBe('T1');
    expect(dataset.taskDefinitions[0].applicableTeamIds).toEqual(['T1']);
    expect(dataset.workItems[0]).toEqual(expect.objectContaining({ teamId: 'T1', officerId: 'CB1', taskDefinitionId: 'NV1' }));
    expect(migrateDataset(dataset)).toEqual(dataset);
  });

  it.each([
    [4, 'abc', 'E'], [5, -1, 'F'], [5, 6, 'F'], [6, '31/31/2026', 'G'], [7, 'doing', 'H'],
  ])('báo kiểu/giá trị công việc không hợp lệ', (index, value, column) => {
    const sheets = structuredClone(validSheets);
    sheets.WorkItems[1][index] = value;
    expect(importWorkbook(bufferOf(sheets)).errors).toContainEqual(expect.objectContaining({ sheet: 'WorkItems', row: 2, column, value, code: 'invalid' }));
  });

  it('không cho work item tham chiếu parent có lỗi', () => {
    const sheets = structuredClone(validSheets);
    sheets.Officers[1][3] = 'MISSING';
    const result = importWorkbook(bufferOf(sheets));
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'Officers', row: 2, column: 'D', code: 'unknown-reference' }));
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'WorkItems', row: 2, column: 'D', value: 'CB1', code: 'unknown-reference' }));
    expect(result.validRowCount).toBe(0);
  });

  it('phát hiện trùng stable key', () => {
    const sheets = structuredClone(validSheets);
    sheets.WorkItems.push([...sheets.WorkItems[1]]);
    const result = parseExcelDataset(bufferOf(sheets));
    expect(result.duplicateCount).toBe(1);
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'WorkItems', row: 3, column: 'A', code: 'duplicate' }));
  });

  it.each([
    [1, 'ZZ', 'B'],
    [2, 'ZZ', 'C'],
    [3, 'ZZ', 'D'],
  ])('báo tham chiếu không tồn tại tại ô tương ứng', (index, value, column) => {
    const sheets = structuredClone(validSheets);
    sheets.WorkItems[1][index] = value;
    const result = parseExcelDataset(bufferOf(sheets));
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'WorkItems', row: 2, column, value, code: 'unknown-reference' }));
  });

  it('báo officer khác team tại đúng cột cán bộ', () => {
    const sheets = structuredClone(validSheets);
    sheets.Teams.push(['T2', 'Tổ Hai', 'T2']);
    sheets.Officers.push(['CB2', 'Bình', 'Công chức', 'T2', 'Xã B']);
    sheets.WorkItems[1][3] = 'CB2';
    const result = importWorkbook(bufferOf(sheets));
    expect(result.dataset).toBeUndefined();
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'WorkItems', row: 2, column: 'D', code: 'invalid' }));
  });

  it('báo nhiệm vụ không áp dụng cho team tại đúng cột nhiệm vụ', () => {
    const sheets = structuredClone(validSheets);
    sheets.Teams.push(['T2', 'Tổ Hai', 'T2']);
    sheets.TaskDefinitions[1][6] = 'T2';
    const result = importWorkbook(bufferOf(sheets));
    expect(result.dataset).toBeUndefined();
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'WorkItems', row: 2, column: 'B', code: 'invalid' }));
  });

  it('đọc cấu trúc wide summary và sinh ID xác định', () => {
    const source = bufferOf({ 'Du lieu': [
      ['Tên cán bộ', 'Số thu', '', ''],
      ['', 'Số phải thực hiện', 'Số đã thực hiện', 'Thời hạn'],
      ['Nguyễn An', 10, 4, '2026-12-31'],
    ] });
    const first = parseExcelDataset(source);
    const second = parseExcelDataset(source);
    expect(first.errors).toEqual([]);
    expect(first.dataset?.workItems).toHaveLength(1);
    expect(first.dataset?.workItems[0].id).toBe(second.dataset?.workItems[0].id);
  });

  it('ID deterministic không va chạm giữa slug giống nhau và giữ đúng references', () => {
    const source = bufferOf({ 'Du lieu': [
      ['Tên nhiệm vụ', 'Cán bộ', '', '', '', '', '', '', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn'],
      ['A-B', 'Lê An', '', '', '', '', '', '', 2, 1, '2026-09-30'],
      ['A B', 'Le An', '', '', '', '', '', '', 3, 1, '2026-09-30'],
    ] });
    const first = importWorkbook(source).dataset!;
    const second = importWorkbook(source).dataset!;
    expect(new Set(first.taskDefinitions.map((item) => item.id)).size).toBe(2);
    expect(new Set(first.officers.map((item) => item.id)).size).toBe(2);
    expect(first.workItems.map((item) => item.id)).toEqual(second.workItems.map((item) => item.id));
    expect(first.workItems.every((item) => first.taskDefinitions.some((task) => task.id === item.taskDefinitionId))).toBe(true);
  });

  it('gộp identity chỉ khác case và khoảng trắng thành cùng entity', () => {
    const source = bufferOf({ 'Du lieu': [
      ['Tên nhiệm vụ', 'Cán bộ', '', '', '', '', '', '', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn'],
      ['Rà  soát', 'Lê  An', '', '', '', '', '', '', 2, 1, '2026-09-30'],
      ['rà soát', 'lê an', '', '', '', '', '', '', 3, 1, '2026-09-30'],
    ] });
    const dataset = importWorkbook(source).dataset!;
    expect(dataset.officers).toHaveLength(1);
    expect(dataset.taskDefinitions).toHaveLength(1);
    expect(new Set(dataset.workItems.map((item) => item.officerId))).toEqual(new Set([dataset.officers[0].id]));
  });

  it('áp dụng đúng epoch workbook date1904 cho serial date', () => {
    const sheets = structuredClone(validSheets);
    sheets.WorkItems[1][6] = 1;
    const result = importWorkbook(date1904Buffer(sheets));
    expect(result.errors).toEqual([]);
    expect(result.dataset?.workItems[0].deadline).toBe('1904-01-02');
  });

  it.each([
    ['1,5', 1.5], ['1.000', 1000], ['1.000,5', 1000.5], ['1000.5', 1000.5], [1.5, 1.5],
  ])('đọc số locale %s thành %s', (input, expected) => {
    const sheets = structuredClone(validSheets);
    sheets.WorkItems[1][4] = input;
    sheets.WorkItems[1][5] = 1;
    const result = importWorkbook(bufferOf(sheets));
    expect(result.errors).toEqual([]);
    expect(result.dataset?.workItems[0].assigned).toBe(expected);
  });

  it('trả ImportResult khi buffer hỏng thay vì throw', () => {
    const result = importWorkbook(new Uint8Array([1, 2, 3, 4]).buffer);
    expect(result.dataset).toBeUndefined();
    expect(result.errors).toContainEqual(expect.objectContaining({ sheet: 'workbook', column: 'A', code: 'invalid' }));
  });

  it('từ chối workbook vượt giới hạn trước khi parse', () => {
    const result = importWorkbook(new ArrayBuffer(MAX_IMPORT_BYTES + 1));
    expect(result.dataset).toBeUndefined();
    expect(result.errors[0]).toEqual(expect.objectContaining({ sheet: 'workbook', code: 'invalid' }));
  });

  it('flat summary không nuốt số/ngày sai', () => {
    const source = bufferOf({ 'Du lieu': [
      ['Tên nhiệm vụ', 'Cán bộ', '', '', '', '', '', '', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn'],
      ['Rà soát', 'Nguyễn An', '', '', '', '', '', '', 'sai', 4, 'sai-ngay'],
    ] });
    const result = importWorkbook(source);
    expect(result.dataset).toBeUndefined();
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ sheet: 'Du lieu', row: 2, column: 'I', code: 'invalid' }),
      expect.objectContaining({ sheet: 'Du lieu', row: 2, column: 'K', code: 'invalid' }),
    ]));
  });

  it('flat summary báo thiếu task/officer đúng cột header thực', () => {
    const source = bufferOf({ 'Du lieu': [
      ['STT', 'Tên nhiệm vụ', 'Cán bộ', '', '', '', '', '', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn'],
      [1, '', '', '', '', '', '', '', 5, 2, '2026-09-30'],
    ] });
    const result = importWorkbook(source);
    expect(result.dataset).toBeUndefined();
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ sheet: 'Du lieu', row: 2, column: 'B', code: 'missing' }),
      expect.objectContaining({ sheet: 'Du lieu', row: 2, column: 'C', code: 'missing' }),
    ]));
  });

  it('không bỏ dòng thiếu task/officer nếu business cells có dữ liệu', () => {
    const source = bufferOf({ 'Du lieu': [
      ['STT', 'Tên nhiệm vụ', 'Cán bộ', '', '', '', '', '', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn'],
      ['', '', '', '', '', '', '', '', 3, 1, '2026-09-30'],
    ] });
    const result = importWorkbook(source);
    expect(result.dataset).toBeUndefined();
    expect(result.errors.filter((error) => error.row === 2 && error.code === 'missing')).toHaveLength(2);
  });
});

describe('exportErrors', () => {
  it('tạo workbook lỗi có sheet và tiêu đề ổn định', () => {
    const workbook = buildImportErrorsWorkbook([{ sheet: 'WorkItems', row: 2, column: 'D', value: '', code: 'missing', message: 'Thiếu mã cán bộ' }]);
    expect(IMPORT_ERRORS_FILENAME).toBe('loi-nhap-du-lieu-tcs23.xlsx');
    expect(workbook.SheetNames).toEqual(['Loi nhap du lieu']);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets['Loi nhap du lieu'], { header: 1 })).toEqual([
      ['Sheet', 'Dòng', 'Cột', 'Giá trị', 'Mã lỗi', 'Thông báo'],
      ['WorkItems', 2, 'D', '', 'missing', 'Thiếu mã cán bộ'],
    ]);
  });

  it('download wrapper ghi đúng workbook và tên file', () => {
    const calls: unknown[][] = [];
    downloadImportErrors([], (...args: unknown[]) => { calls.push(args); });
    expect(calls).toHaveLength(1);
    expect((calls[0][0] as XLSX.WorkBook).SheetNames).toEqual(['Loi nhap du lieu']);
    expect(calls[0][1]).toBe(IMPORT_ERRORS_FILENAME);
  });
});

describe('Thematic imports and mergeThematicDataset', () => {
  it('đọc file chuyên đề nạp nhiều tổ và gán đúng tổ cho cán bộ', () => {
    const source = bufferOf({
      'Du lieu': [
        ['STT', 'Tên nhiệm vụ', 'Cán bộ', 'Tổ quản lý', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn'],
        [1, 'Thu ngân sách', 'Lê Tuấn Anh', 'Tổ Quản lý thuế HKD số 1', 50, 40, '2026-09-30'],
        [2, 'Thu ngân sách', 'Nguyễn Thị Hải Yến', 'Tổ Quản lý thuế HKD số 2', 60, 55, '2026-09-30'],
      ]
    });
    const result = importWorkbook(source, { mode: 'theme', themeId: 'CD_THU' });
    expect(result.scope).toBe('thematic');
    expect(result.themeId).toBe('CD_THU');
    expect(result.errors).toEqual([]);
    expect(result.validRowCount).toBe(2);
    expect(result.dataset?.workItems).toHaveLength(2);

    const item1 = result.dataset?.workItems.find((w) => w.assigned === 50);
    expect(item1?.teamId).toBe('HKD1');

    const item2 = result.dataset?.workItems.find((w) => w.assigned === 60);
    expect(item2?.teamId).toBe('HKD2');
  });

  it('mergeThematicDataset chỉ cập nhật các nhiệm vụ chuyên đề, giữ nguyên các nhiệm vụ khác', () => {
    const current = structuredClone(seedDataset);
    const baseCount = current.workItems.length;

    // Incoming has an update for a specific officer in HKD1 for task 'THU'
    const incoming = {
      schemaVersion: 1 as const,
      teams: current.teams,
      officers: current.officers,
      taskDefinitions: current.taskDefinitions,
      workItems: [
        {
          id: 'TEST-WORK-1',
          taskDefinitionId: 'THU',
          teamId: 'HKD1',
          officerId: current.officers[0].id,
          assigned: 999,
          completed: 888,
          deadline: '2026-10-31',
          status: 'in_progress' as const,
          updatedAt: '2026-09-16T00:00:00.000Z',
        }
      ],
      updatedAt: '2026-09-16',
    };

    const merged = mergeThematicDataset(current, incoming, ['THU', 'NVDTPC-BCNGAY']);
    expect(merged.workItems.length).toBeGreaterThanOrEqual(baseCount);

    const updated = merged.workItems.find(
      (w) => w.teamId === 'HKD1' && w.officerId === current.officers[0].id && w.taskDefinitionId === 'THU'
    );
    expect(updated?.assigned).toBe(999);
    expect(updated?.completed).toBe(888);

    // Other tasks of that officer or other officers should remain unchanged
    const otherTasks = merged.workItems.filter((w) => w.taskDefinitionId !== 'THU');
    expect(otherTasks.length).toBeGreaterThan(0);
  });
});

