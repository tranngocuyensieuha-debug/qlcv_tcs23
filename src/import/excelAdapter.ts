import * as XLSX from 'xlsx';
import type { AppDataset, Officer, TaskDefinition, Team, WorkItem, WorkStatus } from '../domain/models';
import { CANONICAL_TEAMS, seedDataset } from '../data/seedDataset';

export type ImportIssueCode = 'missing' | 'invalid' | 'unknown-reference' | 'duplicate';
export interface ImportIssue { sheet: string; row: number; column: string; value: unknown; code: ImportIssueCode; message: string }
export interface ImportResult { dataset?: AppDataset; errors: ImportIssue[]; duplicateCount: number; validRowCount: number; scope: 'full' | 'team' | 'thematic'; teamId?: string; themeId?: string }
type RawRow = unknown[];
interface SourceRow { sheet: string; rowNumber: number; raw: RawRow }
interface Table { sheet: keyof typeof HEADERS; indexes: number[]; rows: SourceRow[] }
interface Candidate<T> { source: SourceRow; value: T; valid: boolean }

const HEADERS = {
  Teams: ['Mã tổ', 'Tên tổ', 'Tên ngắn'], Officers: ['Mã cán bộ', 'Tên cán bộ', 'Chức danh', 'Mã tổ', 'Địa bàn'],
  TaskDefinitions: ['Mã nhiệm vụ', 'Tên nhiệm vụ', 'Nhóm', 'Đơn vị', 'Cách đo', 'Kỳ báo cáo', 'Mã tổ áp dụng'],
  WorkItems: ['Mã công việc', 'Mã nhiệm vụ', 'Mã tổ', 'Mã cán bộ', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn', 'Trạng thái'],
} as const;
const STATUS: WorkStatus[] = ['todo', 'in_progress', 'waiting', 'done'];
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
const text = (value: unknown) => String(value ?? '').trim();
const normalize = (value: unknown) => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/\s+/g, ' ');
const exactNormalized = (value: string) => value.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
function shortHash(value: string, seed: number): string { let hash = seed; for (const char of exactNormalized(value)) { hash ^= char.codePointAt(0)!; hash = Math.imul(hash, 0x01000193); } return (hash >>> 0).toString(16).padStart(8, '0'); }
const stableId = (prefix: string, value: string) => `${prefix}-${normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown'}-${shortHash(value, 0x811c9dc5)}${shortHash(value, 0x9e3779b9)}`;
function uniqueCanonical(values: string[]): string[] { const seen = new Set<string>(); return values.filter((value) => { const key = exactNormalized(value); if (seen.has(key)) return false; seen.add(key); return true; }); }
const column = (index: number) => XLSX.utils.encode_col(Math.max(0, index));
function addIssue(errors: ImportIssue[], source: Pick<SourceRow, 'sheet' | 'rowNumber'>, columnIndex: number, value: unknown, code: ImportIssueCode, message: string) { errors.push({ sheet: source.sheet, row: source.rowNumber, column: column(columnIndex), value, code, message }); }
function rowsOf(workbook: XLSX.WorkBook, sheet: string): RawRow[] { return XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, defval: '', raw: true, blankrows: true }) as RawRow[]; }
function readTable(workbook: XLSX.WorkBook, sheet: keyof typeof HEADERS, errors: ImportIssue[]): Table {
  if (!workbook.SheetNames.includes(sheet)) { addIssue(errors, { sheet, rowNumber: 1 }, 0, '', 'missing', `Thiếu sheet ${sheet}`); return { sheet, indexes: HEADERS[sheet].map(() => -1), rows: [] }; }
  const all = rowsOf(workbook, sheet); const header = all[0] ?? [];
  const indexes = HEADERS[sheet].map((name) => header.findIndex((value) => normalize(value) === normalize(name)));
  indexes.forEach((index, position) => { if (index < 0) addIssue(errors, { sheet, rowNumber: 1 }, position, '', 'missing', `Thiếu cột ${HEADERS[sheet][position]}`); });
  return { sheet, indexes, rows: all.slice(1).map((raw, index) => ({ sheet, rowNumber: index + 2, raw })).filter(({ raw }) => raw.some((value) => text(value))) };
}
function baseCandidates<T>(table: Table, make: (values: string[]) => T, errors: ImportIssue[]): Candidate<T>[] {
  return table.rows.map((source) => { let valid = table.indexes.every((index) => index >= 0); const values = table.indexes.map((index, position) => { const value = index < 0 ? '' : text(source.raw[index]); if (index >= 0 && !value) { addIssue(errors, source, index, source.raw[index], 'missing', `Thiếu ${HEADERS[table.sheet][position]}`); valid = false; } return value; }); return { source, value: make(values), valid }; });
}
function markDuplicates<T extends { id: string }>(items: Candidate<T>[], table: Table, errors: ImportIssue[]): number {
  const seen = new Set<string>(); let count = 0; for (const item of items) { if (!item.value.id) continue; const identity = exactNormalized(item.value.id); if (seen.has(identity)) { addIssue(errors, item.source, table.indexes[0], item.value.id, 'duplicate', `${HEADERS[table.sheet][0]} bị trùng`); item.valid = false; count++; } else seen.add(identity); } return count;
}
function parseNonNegative(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : undefined;
  const raw = text(value); if (!raw) return undefined;
  let canonical = raw;
  if (/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) canonical = raw.replace(/\./g, '').replace(',', '.');
  else if (/^[-+]?\d+,\d+$/.test(raw)) canonical = raw.replace(',', '.');
  else if (!/^[-+]?\d+(\.\d+)?$/.test(raw)) return undefined;
  const parsed = Number(canonical); return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
function validDate(value: string): boolean { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if (!match) return false; const date = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value; }
function excelDate(value: unknown, date1904: boolean): string { if (typeof value !== 'number') return text(value); const parsed = XLSX.SSF.parse_date_code(value + (date1904 ? 1462 : 0)); return parsed ? `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}` : text(value); }
function workbookError(message: string): ImportResult { return { errors: [{ sheet: 'workbook', row: 1, column: 'A', value: '', code: 'invalid', message }], duplicateCount: 0, validRowCount: 0, scope: 'full' }; }

export interface ImportWorkbookOptions { defaultTeamId?: string; availableTeams?: Team[]; currentTeams?: Team[]; mode?: 'full' | 'team' | 'theme' | 'master'; themeId?: string; currentOfficers?: Officer[]; currentTaskDefinitions?: TaskDefinition[] }
export function importWorkbook(buffer: ArrayBuffer, options: ImportWorkbookOptions = {}): ImportResult {
  if (buffer.byteLength > MAX_IMPORT_BYTES) return workbookError(`Workbook vượt giới hạn ${MAX_IMPORT_BYTES} byte`);
  const signature = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
  const isZip = signature[0] === 0x50 && signature[1] === 0x4b; const isOle = signature[0] === 0xd0 && signature[1] === 0xcf && signature[2] === 0x11 && signature[3] === 0xe0;
  if (!isZip && !isOle) return workbookError('Workbook không phải tệp Excel hợp lệ');
  let workbook: XLSX.WorkBook;
  try { workbook = XLSX.read(buffer, { type: 'array' }); } catch (error) { return workbookError(`Không đọc được workbook: ${error instanceof Error ? error.message : String(error)}`); }
  if (!workbook.SheetNames.length) return workbookError('Workbook không có sheet');
  const date1904 = workbook.Workbook?.WBProps?.date1904 === true;
  if (!workbook.SheetNames.includes('Teams') && workbook.SheetNames.includes('Du lieu')) return importSummary(workbook, date1904, options);
  const errors: ImportIssue[] = []; const teamsTable = readTable(workbook, 'Teams', errors); const officersTable = readTable(workbook, 'Officers', errors); const tasksTable = readTable(workbook, 'TaskDefinitions', errors); const workTable = readTable(workbook, 'WorkItems', errors);
  const teams = baseCandidates<Team>(teamsTable, ([id, name, shortName]) => ({ id, name, shortName }), errors);
  const officers = baseCandidates<Officer>(officersTable, ([id, name, title, teamId, area]) => ({ id, name, title, teamId, area }), errors);
  const tasks = baseCandidates<TaskDefinition>(tasksTable, ([id, name, category, unit, measurement, reportPeriod, ids]) => ({ id, name, category, unit, measurement, reportPeriod, applicableTeamIds: ids.split(/[,;|]/).map((v) => v.trim()).filter(Boolean) }), errors);
  const works = baseCandidates<WorkItem>(workTable, ([id, taskDefinitionId, teamId, officerId, assigned, completed, deadline, status]) => ({ id, taskDefinitionId, teamId, officerId, assigned: Number(assigned), completed: Number(completed), deadline, status: status as WorkStatus, updatedAt: `${deadline}T00:00:00.000Z` }), errors);
  const duplicateCount = markDuplicates(teams, teamsTable, errors) + markDuplicates(officers, officersTable, errors) + markDuplicates(tasks, tasksTable, errors) + markDuplicates(works, workTable, errors);
  const teamIds = new Map(teams.filter((v) => v.valid).map((v) => [exactNormalized(v.value.id), v.value.id]));
  officers.forEach((item) => { const actualId = teamIds.get(exactNormalized(item.value.teamId)); if (item.valid && !actualId) { addIssue(errors, item.source, officersTable.indexes[3], item.value.teamId, 'unknown-reference', 'Mã tổ không tồn tại'); item.valid = false; } else if (actualId) item.value.teamId = actualId; });
  tasks.forEach((item) => { if (!item.valid) return; const actualIds: string[] = []; for (const id of item.value.applicableTeamIds) { const actualId = teamIds.get(exactNormalized(id)); if (!actualId) { addIssue(errors, item.source, tasksTable.indexes[6], id, 'unknown-reference', 'Mã tổ áp dụng không tồn tại'); item.valid = false; } else actualIds.push(actualId); } item.value.applicableTeamIds = actualIds; });
  const officerIds = new Map(officers.filter((v) => v.valid).map((v) => [exactNormalized(v.value.id), v.value.id])); const taskIds = new Map(tasks.filter((v) => v.valid).map((v) => [exactNormalized(v.value.id), v.value.id]));
  works.forEach((item) => {
    const rawAssigned = item.source.raw[workTable.indexes[4]]; const rawCompleted = item.source.raw[workTable.indexes[5]]; const assigned = parseNonNegative(rawAssigned); const completed = parseNonNegative(rawCompleted);
    if (assigned === undefined && text(rawAssigned)) { addIssue(errors, item.source, workTable.indexes[4], rawAssigned, 'invalid', 'Phải thực hiện phải là số hữu hạn không âm'); item.valid = false; }
    if (completed === undefined && text(rawCompleted)) { addIssue(errors, item.source, workTable.indexes[5], rawCompleted, 'invalid', 'Đã thực hiện phải là số hữu hạn không âm'); item.valid = false; }
    if (assigned !== undefined && completed !== undefined && completed > assigned) { addIssue(errors, item.source, workTable.indexes[5], rawCompleted, 'invalid', 'Đã thực hiện không được lớn hơn phải thực hiện'); item.valid = false; }
    item.value.deadline = excelDate(item.source.raw[workTable.indexes[6]], date1904); item.value.updatedAt = `${item.value.deadline}T00:00:00.000Z`;
    if (item.value.deadline && !validDate(item.value.deadline)) { addIssue(errors, item.source, workTable.indexes[6], item.source.raw[workTable.indexes[6]], 'invalid', 'Thời hạn phải là ngày ISO hợp lệ'); item.valid = false; }
    if (item.value.status && !STATUS.includes(item.value.status)) { addIssue(errors, item.source, workTable.indexes[7], item.value.status, 'invalid', 'Trạng thái không hợp lệ'); item.valid = false; }
    const refs: [keyof Pick<WorkItem, 'taskDefinitionId' | 'teamId' | 'officerId'>, Map<string, string>, number, string][] = [['taskDefinitionId', taskIds, 1, 'Mã nhiệm vụ'], ['teamId', teamIds, 2, 'Mã tổ'], ['officerId', officerIds, 3, 'Mã cán bộ']];
    refs.forEach(([field, map, position, label]) => { const id = item.value[field]; const actualId = map.get(exactNormalized(id)); if (id && !actualId) { addIssue(errors, item.source, workTable.indexes[position], id, 'unknown-reference', `${label} không tồn tại`); item.valid = false; } else if (actualId) item.value[field] = actualId; }); item.value.assigned = assigned ?? item.value.assigned; item.value.completed = completed ?? item.value.completed;
    const officer = officers.find((candidate) => candidate.valid && candidate.value.id === item.value.officerId)?.value;
    if (officer && officer.teamId !== item.value.teamId) { addIssue(errors, item.source, workTable.indexes[3], item.value.officerId, 'invalid', 'Cán bộ không thuộc tổ của công việc'); item.valid = false; }
    const definition = tasks.find((candidate) => candidate.valid && candidate.value.id === item.value.taskDefinitionId)?.value;
    if (definition && !definition.applicableTeamIds.includes(item.value.teamId)) { addIssue(errors, item.source, workTable.indexes[1], item.value.taskDefinitionId, 'invalid', 'Nhiệm vụ không áp dụng cho tổ của công việc'); item.valid = false; }
  });
  const validRowCount = works.filter((v) => v.valid).length;
  const dataset: AppDataset | undefined = errors.length ? undefined : { schemaVersion: 1, teams: teams.map((v) => v.value), officers: officers.map((v) => v.value), taskDefinitions: tasks.map((v) => v.value), workItems: works.map((v) => v.value), updatedAt: '1970-01-01T00:00:00.000Z' };
  return { dataset, errors, duplicateCount, validRowCount, scope: 'full' };
}
export const parseExcelDataset = (data: ArrayBuffer | Uint8Array): ImportResult => importWorkbook(data instanceof ArrayBuffer ? data : Uint8Array.from(data).buffer);

function importSummary(workbook: XLSX.WorkBook, date1904: boolean, options: ImportWorkbookOptions): ImportResult {
  const rows = rowsOf(workbook, 'Du lieu'); const header = rows[0] ?? []; const task = header.findIndex((v) => normalize(v).includes('ten nhiem vu')); const officer = header.findIndex((v) => normalize(v).includes('can bo'));
  if (task < 0 && officer >= 0) return importWide(rows, officer, date1904, options); if (task < 0 || officer < 0) return failedSummary('Không nhận diện được cột nhiệm vụ/cán bộ');
  const assigned = header.findIndex((v) => normalize(v).includes('phai thuc hien')); const completed = header.findIndex((v) => normalize(v).includes('da thuc hien')); const deadline = header.findIndex((v) => normalize(v).includes('thoi han'));
  const team = header.findIndex((v) => normalize(v).includes('to quan ly') || normalize(v) === 'to' || normalize(v) === 'ma to');
  const relevant = [task, officer, assigned, completed, deadline];
  return buildSummary(rows.slice(1).map((raw, i) => ({ sheet: 'Du lieu', rowNumber: i + 2, raw })).filter((r) => relevant.some((index) => index >= 0 && text(r.raw[index]))), { task, officer, assigned, completed, deadline, team }, date1904, options);
}
function importWide(rows: RawRow[], officer: number, date1904: boolean, options: ImportWorkbookOptions): ImportResult {
  const second = rows[1] ?? []; const groups: { taskName: string; assigned: number; completed: number; deadline: number }[] = []; let active = '';
  for (let i = officer + 1; i < Math.max(rows[0]?.length ?? 0, second.length); i++) { if (text(rows[0]?.[i])) active = text(rows[0][i]); if (normalize(second[i]).includes('so phai thuc hien') && normalize(second[i + 1]).includes('so da thuc hien') && normalize(second[i + 2]).includes('thoi han')) groups.push({ taskName: active, assigned: i, completed: i + 1, deadline: i + 2 }); }
  if (!groups.length) return failedSummary('Không nhận diện được nhóm cột chỉ tiêu');
  const source = rows.slice(2).map((raw, i) => ({ sheet: 'Du lieu', rowNumber: i + 3, raw })).filter((r) => text(r.raw[officer]) && normalize(r.raw[officer]) !== 'tong');
  return finalizeSummary(source.flatMap((row) => groups.map((g) => ({ source: row, taskName: g.taskName, officerName: text(row.raw[officer]), assigned: row.raw[g.assigned], completed: row.raw[g.completed], deadline: row.raw[g.deadline], columns: { ...g, task: g.assigned, officer } }))), date1904, options);
}
function buildSummary(rows: SourceRow[], indexes: { task: number; officer: number; assigned: number; completed: number; deadline: number; team?: number }, date1904: boolean, options: ImportWorkbookOptions): ImportResult {
  const errors: ImportIssue[] = []; for (const [name, index] of Object.entries(indexes)) if (index < 0 && name !== 'team') addIssue(errors, { sheet: 'Du lieu', rowNumber: 1 }, 0, '', 'missing', `Thiếu cột ${name}`); if (errors.length) return { errors, duplicateCount: 0, validRowCount: 0, scope: options.mode === 'theme' || options.themeId ? 'thematic' : 'team', teamId: options.defaultTeamId ?? 'HKD1', themeId: options.themeId };
  return finalizeSummary(rows.map((source) => ({ source, taskName: text(source.raw[indexes.task]), officerName: text(source.raw[indexes.officer]), teamName: indexes.team !== undefined && indexes.team >= 0 ? text(source.raw[indexes.team]) : undefined, assigned: source.raw[indexes.assigned], completed: source.raw[indexes.completed], deadline: source.raw[indexes.deadline], columns: indexes })), date1904, options);
}
function finalizeSummary(items: { source: SourceRow; taskName: string; officerName: string; teamName?: string; assigned: unknown; completed: unknown; deadline: unknown; columns: { task: number; officer: number; assigned: number; completed: number; deadline: number; team?: number } }[], date1904: boolean, options: ImportWorkbookOptions): ImportResult {
  const errors: ImportIssue[] = []; const valid: typeof items = [];
  for (const item of items) { let ok = true; const assigned = parseNonNegative(item.assigned); const completed = parseNonNegative(item.completed); const deadline = excelDate(item.deadline, date1904);
    if (!item.taskName) { addIssue(errors, item.source, item.columns.task, '', 'missing', 'Thiếu tên nhiệm vụ'); ok = false; } if (!item.officerName) { addIssue(errors, item.source, item.columns.officer, '', 'missing', 'Thiếu cán bộ'); ok = false; }
    if (assigned === undefined) { addIssue(errors, item.source, item.columns.assigned, item.assigned, text(item.assigned) ? 'invalid' : 'missing', 'Phải thực hiện không hợp lệ'); ok = false; }
    if (completed === undefined || (assigned !== undefined && completed > assigned)) { addIssue(errors, item.source, item.columns.completed, item.completed, text(item.completed) ? 'invalid' : 'missing', 'Đã thực hiện không hợp lệ'); ok = false; }
    if (!deadline || !validDate(deadline)) { addIssue(errors, item.source, item.columns.deadline, item.deadline, deadline ? 'invalid' : 'missing', 'Thời hạn không hợp lệ'); ok = false; } if (ok) valid.push(item); }
  const isTheme = options.mode === 'theme' || Boolean(options.themeId);
  if (errors.length) return { errors, duplicateCount: 0, validRowCount: valid.length, scope: isTheme ? 'thematic' : 'team', teamId: options.defaultTeamId ?? 'HKD1', themeId: options.themeId };
  const suppliedTeams = options.availableTeams ?? options.currentTeams; const outputTeams = suppliedTeams ?? CANONICAL_TEAMS;

  if (isTheme) {
    const allOfficers = options.currentOfficers ?? seedDataset.officers;
    const allTasks = options.currentTaskDefinitions ?? seedDataset.taskDefinitions;
    const teamLookup = new Map(outputTeams.map((t) => [exactNormalized(t.id), t.id]));
    outputTeams.forEach((t) => {
      teamLookup.set(exactNormalized(t.name), t.id);
      teamLookup.set(exactNormalized(t.shortName), t.id);
    });

    const officersMap = new Map<string, Officer>();
    const tasksMap = new Map<string, TaskDefinition>();
    const workItems: WorkItem[] = [];

    valid.forEach((item) => {
      const deadline = excelDate(item.deadline, date1904);
      const parsedTeamId = item.teamName ? teamLookup.get(exactNormalized(item.teamName)) : undefined;

      const matchedOfficer = allOfficers.find((o) => {
        const nameOk = exactNormalized(o.name) === exactNormalized(item.officerName);
        if (!nameOk) return false;
        if (parsedTeamId) return o.teamId === parsedTeamId;
        return true;
      });

      const officerTeamId = matchedOfficer?.teamId || parsedTeamId || options.defaultTeamId || 'HKD1';
      const officerId = matchedOfficer?.id || stableId('officer', `${officerTeamId}:${exactNormalized(item.officerName)}`);

      if (!officersMap.has(officerId)) {
        officersMap.set(officerId, matchedOfficer || { id: officerId, name: item.officerName, title: 'Công chức', teamId: officerTeamId, area: 'Theo file nhập' });
      }

      const matchedTask = allTasks.find((t) => exactNormalized(t.name) === exactNormalized(item.taskName) || exactNormalized(t.id) === exactNormalized(item.taskName));
      const taskDefId = matchedTask?.id || stableId('task', `${officerTeamId}:${exactNormalized(item.taskName)}:Chỉ tiêu:Số đã thực hiện:Theo file nhập`);

      if (!tasksMap.has(taskDefId)) {
        tasksMap.set(taskDefId, matchedTask || { id: taskDefId, name: item.taskName, category: 'Chuyên đề', unit: 'Chỉ tiêu', measurement: 'Số đã thực hiện', reportPeriod: 'Theo file nhập', applicableTeamIds: [officerTeamId] });
      }

      workItems.push({
        id: stableId('work', `${officerTeamId}:${taskDefId}:${officerId}:${item.source.sheet}:${item.source.rowNumber}`),
        taskDefinitionId: taskDefId,
        teamId: officerTeamId,
        officerId,
        assigned: parseNonNegative(item.assigned)!,
        completed: parseNonNegative(item.completed)!,
        deadline,
        status: 'in_progress',
        updatedAt: `${deadline}T00:00:00.000Z`
      });
    });

    return {
      dataset: { schemaVersion: 1, teams: structuredClone(outputTeams), officers: Array.from(officersMap.values()), taskDefinitions: Array.from(tasksMap.values()), workItems, updatedAt: '1970-01-01T00:00:00.000Z' },
      errors: [],
      duplicateCount: 0,
      validRowCount: valid.length,
      scope: 'thematic',
      themeId: options.themeId
    };
  }

  const teamId = options.defaultTeamId ?? 'HKD1';
  if (!outputTeams.some((team) => team.id === teamId)) return { errors: [{ sheet: 'Du lieu', row: 1, column: 'A', value: teamId, code: 'unknown-reference', message: 'Tổ mặc định không tồn tại trong danh sách tổ hiện tại' }], duplicateCount: 0, validRowCount: 0, scope: 'team', teamId };
  const names = uniqueCanonical(valid.map((v) => v.officerName)); const taskNames = uniqueCanonical(valid.map((v) => v.taskName));
  const knownOfficers = new Map(seedDataset.officers.map((officer) => [exactNormalized(officer.name), officer]));
  const officers: Officer[] = names.map((name) => { const known = knownOfficers.get(exactNormalized(name)); return known && known.teamId === teamId ? known : { id: stableId('officer', `${teamId}:${exactNormalized(name)}`), name, title: 'Công chức', teamId, area: 'Theo file nhập' }; });
  const officerIds = new Map(officers.map((officer) => [exactNormalized(officer.name), officer.id]));
  const taskIdentity = (name: string) => `${teamId}:${exactNormalized(name)}:Chỉ tiêu:Số đã thực hiện:Theo file nhập`;
  const taskDefinitions: TaskDefinition[] = taskNames.map((name) => ({ id: stableId('task', taskIdentity(name)), name, category: 'Tổng hợp', unit: 'Chỉ tiêu', measurement: 'Số đã thực hiện', reportPeriod: 'Theo file nhập', applicableTeamIds: [teamId] }));
  const workItems: WorkItem[] = valid.map((item) => { const deadline = excelDate(item.deadline, date1904); const taskDefinitionId = stableId('task', taskIdentity(item.taskName)); const officerId = officerIds.get(exactNormalized(item.officerName))!; return { id: stableId('work', `${teamId}:${taskDefinitionId}:${officerId}:${item.source.sheet}:${item.source.rowNumber}`), taskDefinitionId, teamId, officerId, assigned: parseNonNegative(item.assigned)!, completed: parseNonNegative(item.completed)!, deadline, status: 'in_progress', updatedAt: `${deadline}T00:00:00.000Z` }; });
  return { dataset: { schemaVersion: 1, teams: structuredClone(outputTeams), officers, taskDefinitions, workItems, updatedAt: '1970-01-01T00:00:00.000Z' }, errors: [], duplicateCount: 0, validRowCount: valid.length, scope: 'team', teamId };
}
function failedSummary(message: string): ImportResult { return { errors: [{ sheet: 'Du lieu', row: 1, column: 'A', value: '', code: 'missing', message }], duplicateCount: 0, validRowCount: 0, scope: 'team', teamId: 'HKD1' }; }
