import { describe, expect, it } from 'vitest';

import { scopeDataset } from './access';
import type { AppDataset, SessionAccount } from './models';

const dataset: AppDataset = {
  schemaVersion: 1,
  teams: [
    { id: 'hkd1', name: 'Hộ kinh doanh 1', shortName: 'HKD1' },
    { id: 'hkd2', name: 'Hộ kinh doanh 2', shortName: 'HKD2' },
  ],
  officers: [
    { id: 'o1', name: 'An', title: 'Công chức', teamId: 'hkd1', area: 'Phường 1' },
    { id: 'o2', name: 'Bình', title: 'Công chức', teamId: 'hkd2', area: 'Phường 2' },
  ],
  taskDefinitions: [
    {
      id: 'td-hkd1',
      name: 'Rà soát HKD1',
      category: 'Rà soát',
      unit: 'hồ sơ',
      measurement: 'số lượng',
      reportPeriod: 'tháng',
      applicableTeamIds: ['hkd1'],
    },
    {
      id: 'td-shared',
      name: 'Nhiệm vụ chung',
      category: 'Quản lý',
      unit: 'hồ sơ',
      measurement: 'số lượng',
      reportPeriod: 'quý',
      applicableTeamIds: ['hkd1', 'hkd2'],
    },
    {
      id: 'td-hkd2',
      name: 'Rà soát HKD2',
      category: 'Rà soát',
      unit: 'hồ sơ',
      measurement: 'số lượng',
      reportPeriod: 'tháng',
      applicableTeamIds: ['hkd2'],
    },
  ],
  workItems: [
    {
      id: 'w1', taskDefinitionId: 'td-hkd1', teamId: 'hkd1', officerId: 'o1',
      assigned: 10, completed: 4, deadline: '2026-09-01', status: 'in_progress', updatedAt: '2026-08-25',
    },
    {
      id: 'w2', taskDefinitionId: 'td-hkd2', teamId: 'hkd2', officerId: 'o2',
      assigned: 8, completed: 8, deadline: '2026-08-20', status: 'done', updatedAt: '2026-08-25',
    },
  ],
  updatedAt: '2026-08-25',
};

describe('scopeDataset', () => {
  it('bắt buộc tài khoản tổ phải có teamId ở cấp kiểu dữ liệu', () => {
    // @ts-expect-error Tài khoản tổ thiếu teamId phải bị TypeScript từ chối.
    const invalidAccount: SessionAccount = { id: 'leader', label: 'Tổ trưởng', role: 'team' };

    expect(invalidAccount.role).toBe('team');
  });

  it('cho lãnh đạo xem toàn bộ dữ liệu', () => {
    const account: SessionAccount = { id: 'lead', label: 'Lãnh đạo', role: 'lead' };

    expect(scopeDataset(dataset, account)).toEqual(dataset);
  });

  it('chỉ cho tổ trưởng HKD1 xem dữ liệu thuộc HKD1', () => {
    const account: SessionAccount = { id: 'leader-hkd1', label: 'Tổ trưởng HKD1', role: 'team', teamId: 'hkd1' };

    const scoped = scopeDataset(dataset, account);

    expect(scoped.teams.map(({ id }) => id)).toEqual(['hkd1']);
    expect(scoped.officers.map(({ id }) => id)).toEqual(['o1']);
    expect(scoped.workItems.map(({ id }) => id)).toEqual(['w1']);
    expect(scoped.taskDefinitions.map(({ id }) => id)).toEqual(['td-hkd1', 'td-shared']);
    expect(scoped.updatedAt).toBe(dataset.updatedAt);
    expect(scoped.schemaVersion).toBe(dataset.schemaVersion);
  });
});
