import { describe, expect, it } from 'vitest';
import { migrateDataset } from './localStorageRepository';
import { seedDataset } from './seedDataset';

describe('seedDataset từ nguồn nghiệp vụ', () => {
  it('có 8 tổ và các cán bộ, nhiệm vụ được khởi tạo đầy đủ', () => {
    expect(seedDataset.teams).toHaveLength(8);
    expect(seedDataset.officers.length).toBeGreaterThan(0);
    expect(seedDataset.taskDefinitions.length).toBeGreaterThanOrEqual(13);
    expect(seedDataset.workItems.length).toBeGreaterThan(0);
    expect(seedDataset.officers.map((x) => x.name)).toContain('Ngô Mai Trang');
  });
  it('mọi tổ có cán bộ và có số liệu công việc', () => {
    for (const team of seedDataset.teams) {
      expect(seedDataset.officers.some((officer) => officer.teamId === team.id)).toBe(true);
      expect(seedDataset.workItems.some((item) => item.teamId === team.id)).toBe(true);
    }
  });
  it('hợp lệ với repository', () => {
    expect(migrateDataset(seedDataset)).toBe(seedDataset);
  });
});
