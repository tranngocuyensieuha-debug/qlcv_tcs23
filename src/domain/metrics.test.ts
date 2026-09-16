import { describe, expect, it } from 'vitest';
import type { AppDataset, WorkItem } from './models';
import {
  buildAlerts,
  buildDashboardMetrics,
  groupByOfficer,
  groupByReportPeriod,
  groupByTask,
  groupByTeam,
} from './metrics';

const item = (overrides: Partial<WorkItem> = {}): WorkItem => ({
  id: 'work-1',
  taskDefinitionId: 'task-1',
  teamId: 'team-1',
  officerId: 'officer-1',
  assigned: 10,
  completed: 4,
  deadline: '2026-08-30',
  status: 'in_progress',
  updatedAt: '2026-08-24T00:00:00.000Z',
  ...overrides,
});

const dataset: AppDataset = {
  schemaVersion: 1,
  teams: [
    { id: 'team-1', name: 'Tổ 1', shortName: 'T1' },
    { id: 'team-2', name: 'Tổ 2', shortName: 'T2' },
  ],
  officers: [
    { id: 'officer-1', name: 'An', title: 'Công chức', teamId: 'team-1', area: 'A' },
    { id: 'officer-2', name: 'Bình', title: 'Công chức', teamId: 'team-2', area: 'B' },
  ],
  taskDefinitions: [
    { id: 'task-1', name: 'Kê khai', category: 'NV', unit: 'Hồ sơ', measurement: 'Số lượng', reportPeriod: 'Tháng', applicableTeamIds: ['team-1', 'team-2'] },
    { id: 'task-2', name: 'Kiểm tra', category: 'NV', unit: 'Hồ sơ', measurement: 'Số lượng', reportPeriod: 'Quý', applicableTeamIds: ['team-2'] },
  ],
  workItems: [
    item(),
    item({ id: 'work-2', teamId: 'team-2', officerId: 'officer-2', assigned: 5, completed: 5, status: 'done' }),
    item({ id: 'work-3', taskDefinitionId: 'task-2', teamId: 'team-2', officerId: 'officer-2', assigned: 3, completed: 1 }),
  ],
  updatedAt: '2026-08-25T00:00:00.000Z',
};

describe('buildDashboardMetrics', () => {
  it('tính tổng, phần còn lại và tỷ lệ mà không mutate đầu vào', () => {
    const input = [item(), item({ id: 'work-2', assigned: 5, completed: 9 })];
    const snapshot = structuredClone(input);
    expect(buildDashboardMetrics(input)).toEqual({ assigned: 15, completed: 9, remaining: 6, rate: 60, count: 2 });
    expect(input).toEqual(snapshot);
  });

  it('trả tỷ lệ 0 khi không có chỉ tiêu và bỏ qua số không hợp lệ', () => {
    expect(buildDashboardMetrics([item({ assigned: Number.NaN, completed: -2 })])).toEqual({ assigned: 0, completed: 0, remaining: 0, rate: 0, count: 1 });
  });
});

describe('buildAlerts', () => {
  const now = new Date('2026-08-25T18:30:00.000Z');

  it('phân loại đúng biên deadline, loại công việc hoàn thành và cảnh báo cập nhật cũ', () => {
    const alerts = buildAlerts([
      item({ id: 'overdue', deadline: '2026-08-24', updatedAt: '2026-08-25' }),
      item({ id: 'today', deadline: '2026-08-25', updatedAt: '2026-08-25' }),
      item({ id: 'plus-3', deadline: '2026-08-28', updatedAt: '2026-08-25' }),
      item({ id: 'plus-4', deadline: '2026-08-29', updatedAt: '2026-08-25' }),
      item({ id: 'stale', deadline: '2026-09-10', updatedAt: '2026-08-17T23:59:59Z' }),
      item({ id: 'seven-days', deadline: '2026-09-11', updatedAt: '2026-08-18' }),
      item({ id: 'done', status: 'done', deadline: '2026-08-01', updatedAt: '2020-01-01' }),
    ], now);
    expect(alerts.map(({ itemId, type, days }) => ({ itemId, type, days }))).toEqual([
      { itemId: 'overdue', type: 'overdue', days: -1 },
      { itemId: 'today', type: 'due-soon', days: 0 },
      { itemId: 'plus-3', type: 'due-soon', days: 3 },
      { itemId: 'stale', type: 'missing-update', days: 8 },
    ]);
  });

  it('sắp xếp ổn định theo mức độ, deadline rồi id và xử lý ngày lỗi', () => {
    const alerts = buildAlerts([
      item({ id: 'b', deadline: '2026-08-20', updatedAt: '2026-08-25' }),
      item({ id: 'a', deadline: '2026-08-20', updatedAt: '2026-08-25' }),
      item({ id: 'invalid', deadline: 'not-a-date', updatedAt: '2026-08-25' }),
    ], now);
    expect(alerts.map((alert) => `${alert.type}:${alert.itemId}`)).toEqual([
      'overdue:a', 'overdue:b', 'invalid-deadline:invalid',
    ]);
  });

  it('phân loại updatedAt không hợp lệ mà không crash', () => {
    expect(buildAlerts([item({ updatedAt: 'not-a-date' })], now)).toContainEqual({
      itemId: 'work-1', type: 'invalid-update', deadline: '2026-08-30',
    });
  });

  it('chỉ trả một cảnh báo ưu tiên overdue khi công việc đồng thời quá hạn và stale', () => {
    const alerts = buildAlerts([
      item({ id: 'stale-overdue', deadline: '2026-08-20', updatedAt: '2026-08-01' }),
      item({ id: 'done', status: 'done' }),
    ], now);
    expect(alerts).toEqual([{
      itemId: 'stale-overdue', type: 'overdue', days: -5, deadline: '2026-08-20',
    }]);
  });

  it('cho phép consumer bỏ qua clock và vẫn loại công việc hoàn thành', () => {
    expect(buildAlerts([item({ status: 'done' })])).toEqual([]);
  });
});

describe('report groupings', () => {
  it('đối soát mọi nhóm với dashboard và giữ cả nhóm không có dữ liệu', () => {
    const dashboard = buildDashboardMetrics(dataset.workItems);
    for (const groups of [groupByTeam(dataset), groupByOfficer(dataset), groupByTask(dataset), groupByReportPeriod(dataset)]) {
      expect(groups.reduce((sum, group) => sum + group.assigned, 0)).toBe(dashboard.assigned);
      expect(groups.reduce((sum, group) => sum + group.completed, 0)).toBe(dashboard.completed);
      expect(groups.reduce((sum, group) => sum + group.remaining, 0)).toBe(dashboard.remaining);
      expect(groups.reduce((sum, group) => sum + group.count, 0)).toBe(dashboard.count);
    }
    expect(groupByTeam(dataset).map(({ id, name }) => ({ id, name }))).toEqual([
      { id: 'team-1', name: 'Tổ 1' }, { id: 'team-2', name: 'Tổ 2' },
    ]);
    expect(groupByReportPeriod(dataset).map(({ id, name }) => ({ id, name }))).toEqual([
      { id: 'Tháng', name: 'Tháng' }, { id: 'Quý', name: 'Quý' },
    ]);
  });

  it('gom tham chiếu không tồn tại vào nhóm dự phòng mà không mutate dataset', () => {
    const input = structuredClone(dataset);
    input.workItems.push(item({ id: 'orphan', teamId: 'missing', officerId: 'missing', taskDefinitionId: 'missing', assigned: 2, completed: 1 }));
    const snapshot = structuredClone(input);
    expect(groupByTeam(input).at(-1)).toMatchObject({ id: '__unmapped__', name: 'Không xác định', assigned: 2, completed: 1 });
    expect(groupByOfficer(input).at(-1)).toMatchObject({ id: '__unmapped__', name: 'Không xác định', assigned: 2, completed: 1 });
    expect(groupByTask(input).at(-1)).toMatchObject({ id: '__unmapped__', name: 'Không xác định', assigned: 2, completed: 1 });
    expect(groupByReportPeriod(input).at(-1)).toMatchObject({ id: '__unmapped__', name: 'Không xác định', assigned: 2, completed: 1 });
    expect(input).toEqual(snapshot);
  });

  it('không để ID fallback đụng ID hợp lệ của nguồn', () => {
    const input = structuredClone(dataset);
    input.teams.push({ id: '__unmapped__', name: 'Tổ tên đặc biệt', shortName: 'ĐB' });
    input.workItems.push(item({ id: 'orphan', teamId: 'missing', assigned: 2, completed: 1 }));
    const groups = groupByTeam(input);
    expect(groups.map((group) => group.id)).toEqual(['team-1', 'team-2', '__unmapped__', '__unmapped__:1']);
    expect(groups.at(-1)).toMatchObject({ name: 'Không xác định', assigned: 2, completed: 1 });
  });
});
