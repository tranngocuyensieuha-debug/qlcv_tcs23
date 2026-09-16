import { expect, it } from 'vitest';
import { migrateDataset } from './localStorageRepository';
import { mergeTeamDataset } from './mergeTeamDataset';
import { seedDataset } from './seedDataset';

it('merge tổ giữ byte nội dung tổ khác và thay partition tổ được nhập', () => {
  const otherOfficer = { id: 'QLDN1-CB01', name: 'Cán bộ QLDN1', title: 'Công chức', teamId: 'QLDN1', area: '' };
  const otherTask = { id: 'SHARED', name: 'Nhiệm vụ chung', category: 'Demo', unit: 'Hồ sơ', measurement: 'Số', reportPeriod: 'Tháng', applicableTeamIds: ['HKD1','QLDN1'] };
  const otherWork = { ...seedDataset.workItems[0], id: 'QLDN1-CV01', teamId: 'QLDN1', officerId: otherOfficer.id, taskDefinitionId: otherTask.id };
  const current = { ...seedDataset, officers: [...seedDataset.officers, otherOfficer], taskDefinitions: [...seedDataset.taskDefinitions, otherTask], workItems: [...seedDataset.workItems, otherWork] };
  const incoming = { schemaVersion: 1, teams: current.teams, officers: [{ id: 'NEW', name: 'Mới', title: 'Công chức', teamId: 'HKD1', area: '' }], taskDefinitions: [{ ...otherTask, applicableTeamIds: ['HKD1'] }], workItems: [{ ...seedDataset.workItems[0], id: 'NEW-WORK', officerId: 'NEW', taskDefinitionId: 'SHARED' }], updatedAt: '2026-09-02' };
  const merged = mergeTeamDataset(current, incoming, 'HKD1');
  expect(merged.officers).toContainEqual(otherOfficer);
  expect(merged.workItems).toContainEqual(otherWork);
  expect(merged.workItems.some((x) => x.id === seedDataset.workItems[0].id)).toBe(false);
  expect(merged.taskDefinitions.find((x) => x.id === 'SHARED')?.applicableTeamIds).toEqual(['QLDN1','HKD1']);
  expect(migrateDataset(merged)).toEqual(merged);
});

it('không gộp nhiệm vụ cùng tên nhưng khác metadata ngữ nghĩa', () => {
  const current = structuredClone(seedDataset);
  const incoming = structuredClone(seedDataset);
  incoming.officers = [{ ...incoming.officers[0], id: 'HKD2-OFFICER', teamId: 'HKD2' }];
  incoming.taskDefinitions = [{ ...incoming.taskDefinitions[0], id: 'HKD2-TASK', name: current.taskDefinitions[0].name, unit: 'Hồ sơ', applicableTeamIds: ['HKD2'] }];
  incoming.workItems = [{ ...incoming.workItems[0], id: 'HKD2-WORK', teamId: 'HKD2', officerId: 'HKD2-OFFICER', taskDefinitionId: 'HKD2-TASK' }];
  const merged = mergeTeamDataset(current, incoming, 'HKD2');
  expect(merged.taskDefinitions.filter((x) => x.name === current.taskDefinitions[0].name)).toHaveLength(2);
  expect(new Set(merged.taskDefinitions.map((x) => x.id)).size).toBe(merged.taskDefinitions.length);
  expect(migrateDataset(merged)).toEqual(merged);
});
