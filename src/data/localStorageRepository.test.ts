import { beforeEach, describe, expect, it } from 'vitest';

import type { AppDataset } from '../domain/models';
import { LocalStorageRepository, migrateDataset } from './localStorageRepository';
import { RepositoryError } from './repository';
import { seedDataset } from './seedDataset';

const DATASET_KEY = 'tcs23:dataset:v1';
const BACKUP_KEY = 'tcs23:dataset:backup';
const CORRUPT_KEY = 'tcs23:dataset:corrupt-backup';

function nextDataset(): AppDataset {
  return { ...seedDataset, updatedAt: '2026-09-01T00:00:00.000Z' };
}

class ControlledStorage implements Storage {
  private readonly values = new Map<string, string>();
  failGet = false;
  failDatasetWriteValue: string | undefined;
  failSetKey: string | undefined;
  readonly length = 0;
  clear(): void { this.values.clear(); }
  key(): string | null { return null; }
  getItem(key: string): string | null {
    if (this.failGet) throw new Error('get failed');
    return this.values.get(key) ?? null;
  }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void {
    if (key === this.failSetKey) { this.failSetKey = undefined; throw new Error('set key failed'); }
    if (key === DATASET_KEY && value === this.failDatasetWriteValue) {
      this.failDatasetWriteValue = undefined;
      throw new Error('set failed');
    }
    this.values.set(key, value);
  }
}

describe('LocalStorageRepository', () => {
  beforeEach(() => localStorage.clear());

  it('khởi tạo dataset v1 với đủ 8 tổ khi chưa có dữ liệu', async () => {
    const repository = new LocalStorageRepository(localStorage);

    const loaded = await repository.load();

    expect(loaded.schemaVersion).toBe(1);
    expect(loaded.teams.map((team) => team.id)).toEqual([
      'HKD1', 'HKD2', 'QLDN1', 'QLDN2', 'KIEMTRA', 'HCTH', 'NVDTPC', 'QLTK',
    ]);
    expect(JSON.parse(localStorage.getItem(DATASET_KEY) ?? '')).toEqual(seedDataset);
  });

  it('save rồi load lại dataset', async () => {
    const repository = new LocalStorageRepository(localStorage);
    const next = nextDataset();

    await repository.save(next);

    expect(await repository.load()).toEqual(next);
  });

  it('replace lưu dataset hiện tại vào backup', async () => {
    const repository = new LocalStorageRepository(localStorage);
    await repository.save(seedDataset);

    await repository.replace(nextDataset());

    expect(JSON.parse(localStorage.getItem(BACKUP_KEY) ?? '')).toEqual(seedDataset);
    expect(await repository.load()).toEqual(nextDataset());
  });

  it('restoreLastBackup khôi phục backup và trả dataset', async () => {
    const repository = new LocalStorageRepository(localStorage);
    await repository.save(seedDataset);
    await repository.replace(nextDataset());

    const restored = await repository.restoreLastBackup();

    expect(restored).toEqual(seedDataset);
    expect(await repository.load()).toEqual(seedDataset);
  });

  it('restoreLastBackup báo lỗi khi chưa có backup', async () => {
    const repository = new LocalStorageRepository(localStorage);

    await expect(repository.restoreLastBackup()).rejects.toBeInstanceOf(RepositoryError);
  });

  it('JSON hỏng báo lỗi và không ghi đè raw data', async () => {
    const raw = '{not-json';
    localStorage.setItem(DATASET_KEY, raw);
    const repository = new LocalStorageRepository(localStorage);

    await expect(repository.load()).rejects.toBeInstanceOf(RepositoryError);

    expect(localStorage.getItem(DATASET_KEY)).toBe(raw);
  });

  it('schema không hỗ trợ báo lỗi và không ghi đè raw data', async () => {
    const unsupported = { ...seedDataset, schemaVersion: 2 };
    const raw = JSON.stringify(unsupported);
    localStorage.setItem(DATASET_KEY, raw);
    const repository = new LocalStorageRepository(localStorage);

    expect(() => migrateDataset(unsupported)).toThrow(RepositoryError);
    await expect(repository.load()).rejects.toBeInstanceOf(RepositoryError);

    expect(localStorage.getItem(DATASET_KEY)).toBe(raw);
  });

  it('migration entry point trả dataset v1 hợp lệ', () => {
    expect(migrateDataset(seedDataset)).toBe(seedDataset);
  });

  it('migrate legacy không schema và backup raw trước khi ghi v1', async () => {
    const legacy = { ...seedDataset } as Record<string, unknown>;
    delete legacy.schemaVersion;
    const raw = JSON.stringify(legacy);
    localStorage.setItem(DATASET_KEY, raw);
    const loaded = await new LocalStorageRepository(localStorage).load();
    expect(loaded.schemaVersion).toBe(1);
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw);
  });

  it('khôi phục backup hợp lệ khi dataset hiện tại hỏng', async () => {
    localStorage.setItem(DATASET_KEY, '{broken');
    localStorage.setItem(BACKUP_KEY, JSON.stringify(seedDataset));
    const repository = new LocalStorageRepository(localStorage);
    expect(await repository.restoreFromLoadError()).toEqual(seedDataset);
    expect(localStorage.getItem(CORRUPT_KEY)).toBe('{broken');
  });

  it('reset seed backup raw hỏng trước khi ghi seed', async () => {
    const raw = '{broken';
    localStorage.setItem(DATASET_KEY, raw);
    const repository = new LocalStorageRepository(localStorage);
    expect(await repository.resetToSeedFromLoadError()).toEqual(seedDataset);
    expect(localStorage.getItem(CORRUPT_KEY)).toBe(raw);
  });

  it('reset lỗi giữ nguyên good backup và lưu raw hỏng riêng', async () => {
    const raw = '{broken', backup = JSON.stringify(nextDataset());
    localStorage.setItem(DATASET_KEY, raw); localStorage.setItem(BACKUP_KEY, backup);
    await new LocalStorageRepository(localStorage).resetToSeedFromLoadError();
    expect(localStorage.getItem(BACKUP_KEY)).toBe(backup);
    expect(localStorage.getItem(CORRUPT_KEY)).toBe(raw);
  });

  it('migration write lỗi rollback dataset và backup byte-for-byte', async () => {
    const storage = new ControlledStorage(); const legacy = { ...seedDataset } as Record<string, unknown>; delete legacy.schemaVersion;
    const datasetRaw = JSON.stringify(legacy, null, 2), backupRaw = JSON.stringify(nextDataset(), null, 4);
    storage.setItem(DATASET_KEY, datasetRaw); storage.setItem(BACKUP_KEY, backupRaw); storage.failSetKey = DATASET_KEY;
    await expect(new LocalStorageRepository(storage).load()).rejects.toBeInstanceOf(RepositoryError);
    expect(storage.getItem(DATASET_KEY)).toBe(datasetRaw); expect(storage.getItem(BACKUP_KEY)).toBe(backupRaw);
  });

  it('restore write lỗi rollback dataset hỏng byte-for-byte', async () => {
    const storage = new ControlledStorage(); const raw = '{broken', previousCorrupt = 'older', goodBackup = JSON.stringify(seedDataset);
    storage.setItem(DATASET_KEY, raw); storage.setItem(BACKUP_KEY, goodBackup); storage.setItem(CORRUPT_KEY, previousCorrupt); storage.failSetKey = DATASET_KEY;
    await expect(new LocalStorageRepository(storage).restoreFromLoadError()).rejects.toBeInstanceOf(RepositoryError);
    expect(storage.getItem(DATASET_KEY)).toBe(raw);
    expect(storage.getItem(CORRUPT_KEY)).toBe(previousCorrupt);
    expect(storage.getItem(BACKUP_KEY)).toBe(goodBackup);
  });

  it('reset write lỗi rollback dataset và corrupt-backup byte-for-byte', async () => {
    const storage = new ControlledStorage(); const raw = '{broken', previousCorrupt = 'older';
    storage.setItem(DATASET_KEY, raw); storage.setItem(CORRUPT_KEY, previousCorrupt); storage.failSetKey = DATASET_KEY;
    await expect(new LocalStorageRepository(storage).resetToSeedFromLoadError()).rejects.toBeInstanceOf(RepositoryError);
    expect(storage.getItem(DATASET_KEY)).toBe(raw); expect(storage.getItem(CORRUPT_KEY)).toBe(previousCorrupt);
  });

  it.each([
    ['updatedAt sai kiểu', { ...seedDataset, updatedAt: 123 }],
    ['team thiếu tên', { ...seedDataset, teams: [{ ...seedDataset.teams[0], name: undefined }, ...seedDataset.teams.slice(1)] }],
    ['work item có số âm', { ...seedDataset, workItems: [{ ...seedDataset.workItems[0], assigned: -1 }, ...seedDataset.workItems.slice(1)] }],
    ['work item có status sai', { ...seedDataset, workItems: [{ ...seedDataset.workItems[0], status: 'invalid' }, ...seedDataset.workItems.slice(1)] }],
  ])('%s báo RepositoryError và bảo toàn raw', async (_name, invalid) => {
    const raw = JSON.stringify(invalid);
    localStorage.setItem(DATASET_KEY, raw);
    const repository = new LocalStorageRepository(localStorage);

    await expect(repository.load()).rejects.toBeInstanceOf(RepositoryError);
    expect(localStorage.getItem(DATASET_KEY)).toBe(raw);
  });

  it.each([
    ['officer trỏ team không tồn tại', { ...seedDataset, officers: [{ ...seedDataset.officers[0], teamId: 'MISSING' }, ...seedDataset.officers.slice(1)] }],
    ['task definition trỏ team không tồn tại', { ...seedDataset, taskDefinitions: [{ ...seedDataset.taskDefinitions[0], applicableTeamIds: ['MISSING'] }] }],
    ['work item trỏ task definition không tồn tại', { ...seedDataset, workItems: [{ ...seedDataset.workItems[0], taskDefinitionId: 'MISSING' }, ...seedDataset.workItems.slice(1)] }],
    ['work item gán officer khác team', { ...seedDataset, officers: [...seedDataset.officers, { id: 'OTHER', name: 'Khác tổ', title: 'Công chức', teamId: 'HKD2', area: '' }], workItems: [{ ...seedDataset.workItems[0], officerId: 'OTHER' }, ...seedDataset.workItems.slice(1)] }],
  ])('%s báo RepositoryError', async (_name, invalid) => {
    localStorage.setItem(DATASET_KEY, JSON.stringify(invalid));

    await expect(new LocalStorageRepository(localStorage).load()).rejects.toBeInstanceOf(RepositoryError);
  });

  it('replace input invalid không thay đổi dataset hoặc backup', async () => {
    const repository = new LocalStorageRepository(localStorage);
    await repository.save(seedDataset);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(nextDataset()));
    const datasetRaw = localStorage.getItem(DATASET_KEY);
    const backupRaw = localStorage.getItem(BACKUP_KEY);

    await expect(repository.replace({ ...nextDataset(), updatedAt: 123 } as unknown as AppDataset))
      .rejects.toBeInstanceOf(RepositoryError);

    expect(localStorage.getItem(DATASET_KEY)).toBe(datasetRaw);
    expect(localStorage.getItem(BACKUP_KEY)).toBe(backupRaw);
  });

  it('replace rollback cả dataset và backup khi ghi dataset mới lỗi', async () => {
    const storage = new ControlledStorage();
    const repository = new LocalStorageRepository(storage);
    await repository.save(seedDataset);
    storage.setItem(BACKUP_KEY, JSON.stringify(nextDataset()));
    const datasetRaw = storage.getItem(DATASET_KEY);
    const backupRaw = storage.getItem(BACKUP_KEY);
    storage.failDatasetWriteValue = JSON.stringify(nextDataset());

    await expect(repository.replace(nextDataset())).rejects.toBeInstanceOf(RepositoryError);

    expect(storage.getItem(DATASET_KEY)).toBe(datasetRaw);
    expect(storage.getItem(BACKUP_KEY)).toBe(backupRaw);
  });

  it('replace lỗi giữ nguyên byte dataset pretty-print và backup trước đó', async () => {
    const storage = new ControlledStorage();
    const datasetRaw = JSON.stringify(seedDataset, null, 2);
    const backupRaw = JSON.stringify(nextDataset(), null, 4);
    storage.setItem(DATASET_KEY, datasetRaw);
    storage.setItem(BACKUP_KEY, backupRaw);
    storage.failDatasetWriteValue = JSON.stringify(nextDataset());

    await expect(new LocalStorageRepository(storage).replace(nextDataset()))
      .rejects.toBeInstanceOf(RepositoryError);

    expect(storage.getItem(DATASET_KEY)).toBe(datasetRaw);
    expect(storage.getItem(BACKUP_KEY)).toBe(backupRaw);
  });

  it('replace lỗi giữ backup null khi trước đó chưa có backup', async () => {
    const storage = new ControlledStorage();
    const datasetRaw = JSON.stringify(seedDataset);
    storage.setItem(DATASET_KEY, datasetRaw);
    storage.failDatasetWriteValue = JSON.stringify(nextDataset());

    await expect(new LocalStorageRepository(storage).replace(nextDataset()))
      .rejects.toBeInstanceOf(RepositoryError);

    expect(storage.getItem(DATASET_KEY)).toBe(datasetRaw);
    expect(storage.getItem(BACKUP_KEY)).toBeNull();
  });

  it('kết quả load seed không chia sẻ reference với singleton hoặc storage khác', async () => {
    const firstStorage = new ControlledStorage();
    const first = await new LocalStorageRepository(firstStorage).load();
    first.teams[0].name = 'Đã sửa';

    const second = await new LocalStorageRepository(new ControlledStorage()).load();

    expect(seedDataset.teams[0].name).not.toBe('Đã sửa');
    expect(second.teams[0].name).not.toBe('Đã sửa');
    expect((await new LocalStorageRepository(firstStorage).load()).teams[0].name).not.toBe('Đã sửa');
  });

  it('mutation sau save không làm thay persisted snapshot hoặc kết quả trả về', async () => {
    const repository = new LocalStorageRepository(localStorage);
    const input = nextDataset();
    const saved = await repository.save(input);
    input.teams[0].name = 'Đổi input';
    saved.teams[1].name = 'Đổi output';

    const loaded = await repository.load();
    expect(loaded.teams[0].name).not.toBe('Đổi input');
    expect(loaded.teams[1].name).not.toBe('Đổi output');
  });

  it.each([
    ['team ID trùng', { ...seedDataset, teams: [...seedDataset.teams, { ...seedDataset.teams[0] }] }],
    ['officer ID trùng', { ...seedDataset, officers: [...seedDataset.officers, { ...seedDataset.officers[0] }] }],
    ['task definition ID trùng', { ...seedDataset, taskDefinitions: [...seedDataset.taskDefinitions, { ...seedDataset.taskDefinitions[0] }] }],
    ['work item ID trùng', { ...seedDataset, workItems: [...seedDataset.workItems, { ...seedDataset.workItems[0] }] }],
    ['team ngoài phạm vi task', { ...seedDataset, taskDefinitions: [{ ...seedDataset.taskDefinitions[0], applicableTeamIds: [seedDataset.teams[1].id] }] }],
  ])('%s bị từ chối', (_name, invalid) => {
    expect(() => migrateDataset(invalid)).toThrow(RepositoryError);
  });

  it('wrap lỗi getItem thành RepositoryError', async () => {
    const storage = new ControlledStorage();
    storage.failGet = true;

    await expect(new LocalStorageRepository(storage).load()).rejects.toBeInstanceOf(RepositoryError);
  });
});
