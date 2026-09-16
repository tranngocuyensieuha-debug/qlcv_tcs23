import type { AppDataset } from '../domain/models';
import type { DataRepository } from './repository';
import { RepositoryError } from './repository';
import { seedDataset } from './seedDataset';

export const DATASET_STORAGE_KEY = 'tcs23:dataset:v1';
export const BACKUP_STORAGE_KEY = 'tcs23:dataset:backup';
export const CORRUPT_BACKUP_STORAGE_KEY = 'tcs23:dataset:corrupt-backup';

type RepositoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasStrings(value: UnknownRecord, fields: string[]): boolean {
  return fields.every((field) => typeof value[field] === 'string');
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validateV1(value: UnknownRecord): AppDataset {
  if (typeof value.updatedAt !== 'string'
    || !Array.isArray(value.teams)
    || !Array.isArray(value.officers)
    || !Array.isArray(value.taskDefinitions)
    || !Array.isArray(value.workItems)) {
    throw new RepositoryError('Dữ liệu v1 thiếu field gốc hoặc sai kiểu.');
  }

  const teams = value.teams;
  const officers = value.officers;
  const taskDefinitions = value.taskDefinitions;
  const workItems = value.workItems;

  if (!teams.every((team) => isRecord(team) && hasStrings(team, ['id', 'name', 'shortName']))) {
    throw new RepositoryError('Team không hợp lệ.');
  }
  if (!officers.every((officer) => isRecord(officer)
    && hasStrings(officer, ['id', 'name', 'title', 'teamId', 'area'])
    && isOptionalString(officer.areaDetail)
    && isOptionalString(officer.dataStatus))) {
    throw new RepositoryError('Officer không hợp lệ.');
  }
  if (!taskDefinitions.every((definition) => isRecord(definition)
    && hasStrings(definition, ['id', 'name', 'category', 'unit', 'measurement', 'reportPeriod'])
    && Array.isArray(definition.applicableTeamIds)
    && definition.applicableTeamIds.every((teamId) => typeof teamId === 'string'))) {
    throw new RepositoryError('TaskDefinition không hợp lệ.');
  }
  const statuses = new Set(['todo', 'in_progress', 'waiting', 'done']);
  if (!workItems.every((item) => isRecord(item)
    && hasStrings(item, ['id', 'taskDefinitionId', 'teamId', 'officerId', 'deadline', 'status', 'updatedAt'])
    && isOptionalString(item.taxpayerCode)
    && isOptionalString(item.subjectName)
    && isNonNegativeFinite(item.assigned)
    && isNonNegativeFinite(item.completed)
    && statuses.has(item.status as string))) {
    throw new RepositoryError('WorkItem không hợp lệ.');
  }

  const teamIds = new Set(teams.map((team) => (team as UnknownRecord).id as string));
  const officerById = new Map(officers.map((officer) => {
    const record = officer as UnknownRecord;
    return [record.id as string, record];
  }));
  const definitionIds = new Set(taskDefinitions.map((definition) => (definition as UnknownRecord).id as string));

  if (teamIds.size !== teams.length
    || officerById.size !== officers.length
    || definitionIds.size !== taskDefinitions.length
    || new Set(workItems.map((item) => (item as UnknownRecord).id as string)).size !== workItems.length) {
    throw new RepositoryError('ID trong dataset phải duy nhất.');
  }

  if (officers.some((officer) => !teamIds.has((officer as UnknownRecord).teamId as string))
    || taskDefinitions.some((definition) => ((definition as UnknownRecord).applicableTeamIds as string[])
      .some((teamId) => !teamIds.has(teamId)))) {
    throw new RepositoryError('Quan hệ team không hợp lệ.');
  }
  if (workItems.some((item) => {
    const record = item as UnknownRecord;
    const teamId = record.teamId as string;
    const officer = officerById.get(record.officerId as string);
    const definition = taskDefinitions.find((candidate) =>
      (candidate as UnknownRecord).id === record.taskDefinitionId) as UnknownRecord | undefined;
    return !teamIds.has(teamId)
      || definition === undefined
      || officer === undefined
      || officer.teamId !== teamId
      || !(definition.applicableTeamIds as string[]).includes(teamId);
  })) {
    throw new RepositoryError('Quan hệ WorkItem không hợp lệ.');
  }

  return value as unknown as AppDataset;
}

export function migrateDataset(value: unknown): AppDataset {
  if (!isRecord(value)) {
    throw new RepositoryError('Dữ liệu lưu trữ không đúng cấu trúc AppDataset.');
  }
  if (value.schemaVersion === undefined || value.schemaVersion === 0) {
    return validateV1({ ...value, schemaVersion: 1 });
  }
  if (value.schemaVersion !== 1) {
    throw new RepositoryError(`Không hỗ trợ schemaVersion ${String(value.schemaVersion)}.`);
  }
  return validateV1(value);
}

function parseDataset(raw: string): AppDataset {
  try {
    return migrateDataset(JSON.parse(raw));
  } catch (error) {
    if (error instanceof RepositoryError) throw error;
    throw new RepositoryError('Không thể đọc JSON dữ liệu lưu trữ.', { cause: error });
  }
}

export class LocalStorageRepository implements DataRepository {
  private readonly storage: RepositoryStorage;

  constructor(storage: RepositoryStorage = window.localStorage) {
    this.storage = storage;
  }

  async load(): Promise<AppDataset> {
    const raw = this.getItem(DATASET_STORAGE_KEY);
    if (raw !== null) {
      try {
        const parsed = parseDataset(raw);
        
        // Tự động cập nhật: Nếu dữ liệu cũ có ít hơn 50 cán bộ, ít hơn số nhiệm vụ hiện tại, hoặc chứa cán bộ đã chuyển đi, xóa cache và nạp lại seedDataset mới nhất
        const hasOldStaff = parsed.officers.some(o => o.name === 'Nguyễn Thị Kim Anh' || o.name === 'Đỗ Thị Khuyên' || o.name === 'Dương Văn Quyết');
        const isMissingNewTasks = parsed.taskDefinitions.length < seedDataset.taskDefinitions.length;
        if (parsed.officers.length < 50 || isMissingNewTasks || hasOldStaff) {
          console.log("Phát hiện dữ liệu cũ hoặc chưa có tiêu chí KPI tháng mới, đang tự động làm mới bộ nhớ trình duyệt...");
          try {
            this.storage.removeItem(DATASET_STORAGE_KEY);
            this.storage.removeItem(BACKUP_STORAGE_KEY);
          } catch { /* ignore */ }
          return this.save(seedDataset);
        }

        const source = JSON.parse(raw) as UnknownRecord;
        if (source.schemaVersion === undefined || source.schemaVersion === 0) {
          this.atomicWrite([DATASET_STORAGE_KEY, BACKUP_STORAGE_KEY], () => {
            this.storage.setItem(BACKUP_STORAGE_KEY, raw);
            this.storage.setItem(DATASET_STORAGE_KEY, JSON.stringify(parsed));
          }, 'Không thể migrate dataset legacy.');
        }
        return parsed;
      } catch (err) {
        console.warn("Lỗi phân tích bộ nhớ cache cũ, tự động nạp lại seedDataset chuẩn...", err);
        try {
          this.storage.removeItem(DATASET_STORAGE_KEY);
          this.storage.removeItem(BACKUP_STORAGE_KEY);
        } catch { /* ignore */ }
        return this.save(seedDataset);
      }
    }
    return this.save(seedDataset);
  }

  async save(dataset: AppDataset): Promise<AppDataset> {
    const raw = this.serialize(dataset);
    try {
      this.storage.setItem(DATASET_STORAGE_KEY, raw);
      return parseDataset(raw);
    } catch (error) {
      throw new RepositoryError('Không thể lưu dataset.', { cause: error });
    }
  }

  async replace(dataset: AppDataset): Promise<AppDataset> {
    const nextRaw = this.serialize(dataset);
    const previousDatasetRaw = this.getItem(DATASET_STORAGE_KEY);
    const currentRaw = previousDatasetRaw === null
      ? this.serialize(seedDataset)
      : previousDatasetRaw;
    if (previousDatasetRaw !== null) parseDataset(previousDatasetRaw);
    const previousBackupRaw = this.getItem(BACKUP_STORAGE_KEY);
    try {
      this.storage.setItem(BACKUP_STORAGE_KEY, currentRaw);
      this.storage.setItem(DATASET_STORAGE_KEY, nextRaw);
      return parseDataset(nextRaw);
    } catch (error) {
      try {
        if (previousDatasetRaw === null) {
          this.storage.removeItem(DATASET_STORAGE_KEY);
        } else {
          this.storage.setItem(DATASET_STORAGE_KEY, previousDatasetRaw);
        }
        if (previousBackupRaw === null) {
          this.storage.removeItem(BACKUP_STORAGE_KEY);
        } else {
          this.storage.setItem(BACKUP_STORAGE_KEY, previousBackupRaw);
        }
      } catch (rollbackError) {
        throw new RepositoryError('Không thể thay thế dataset và rollback không hoàn tất.', {
          cause: new AggregateError([error, rollbackError]),
        });
      }
      throw new RepositoryError('Không thể thay thế dataset.', { cause: error });
    }
  }

  async restoreLastBackup(): Promise<AppDataset> {
    const raw = this.getItem(BACKUP_STORAGE_KEY);
    if (raw === null) throw new RepositoryError('Không có bản sao lưu để khôi phục.');
    return this.save(parseDataset(raw));
  }

  async restoreFromLoadError(): Promise<AppDataset> {
    const raw = this.getItem(BACKUP_STORAGE_KEY);
    if (raw === null) throw new RepositoryError('Không có bản sao lưu để khôi phục.');
    const dataset = parseDataset(raw);
    const corruptRaw = this.getItem(DATASET_STORAGE_KEY);
    this.atomicWrite([DATASET_STORAGE_KEY, CORRUPT_BACKUP_STORAGE_KEY], () => {
      if (corruptRaw !== null) this.storage.setItem(CORRUPT_BACKUP_STORAGE_KEY, corruptRaw);
      this.storage.setItem(DATASET_STORAGE_KEY, JSON.stringify(dataset));
    }, 'Không thể khôi phục dataset từ backup.');
    return dataset;
  }

  async resetToSeedFromLoadError(): Promise<AppDataset> {
    const corruptRaw = this.getItem(DATASET_STORAGE_KEY);
    const seedRaw = this.serialize(seedDataset);
    this.atomicWrite([DATASET_STORAGE_KEY, CORRUPT_BACKUP_STORAGE_KEY], () => {
      if (corruptRaw !== null) this.storage.setItem(CORRUPT_BACKUP_STORAGE_KEY, corruptRaw);
      this.storage.setItem(DATASET_STORAGE_KEY, seedRaw);
    }, 'Không thể đặt lại dataset mẫu.');
    return parseDataset(seedRaw);
  }

  private atomicWrite(keys: string[], operation: () => void, message: string): void {
    const snapshots = new Map(keys.map((key) => [key, this.getItem(key)]));
    try { operation(); } catch (error) {
      try {
        for (const [key, raw] of snapshots) {
          if (raw === null) this.storage.removeItem(key); else this.storage.setItem(key, raw);
        }
      } catch (rollbackError) { throw new RepositoryError(`${message} Rollback không hoàn tất.`, { cause: new AggregateError([error, rollbackError]) }); }
      throw new RepositoryError(message, { cause: error });
    }
  }

  private getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      throw new RepositoryError(`Không thể đọc khóa lưu trữ ${key}.`, { cause: error });
    }
  }

  private serialize(dataset: AppDataset): string {
    const validated = migrateDataset(dataset);
    try {
      return JSON.stringify(validated);
    } catch (error) {
      throw new RepositoryError('Không thể serialize dataset.', { cause: error });
    }
  }
}
