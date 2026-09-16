import type { AppDataset, WorkItem } from './models';

const DAY_MS = 86_400_000;
const UNKNOWN_ID = '__unmapped__';
const UNKNOWN_NAME = 'Không xác định';

export interface DashboardMetrics {
  assigned: number;
  completed: number;
  remaining: number;
  rate: number;
  count: number;
}

export interface MetricGroup extends DashboardMetrics {
  id: string;
  name: string;
}

export type AlertType = 'overdue' | 'due-soon' | 'missing-update' | 'invalid-deadline' | 'invalid-update';

export interface WorkAlert {
  itemId: string;
  type: AlertType;
  /** Khoảng cách ngày UTC; âm với quá hạn, dương với số ngày chưa cập nhật. */
  days?: number;
  deadline: string;
}

function safeAmount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function normalizedAmounts(item: WorkItem): { assigned: number; completed: number } {
  const assigned = safeAmount(item.assigned);
  return { assigned, completed: Math.min(safeAmount(item.completed), assigned) };
}

function rate(completed: number, assigned: number): number {
  return assigned === 0 ? 0 : Math.round((completed / assigned) * 10_000) / 100;
}

export function buildDashboardMetrics(items: readonly WorkItem[]): DashboardMetrics {
  let assigned = 0;
  let completed = 0;
  for (const item of items) {
    const amounts = normalizedAmounts(item);
    assigned += amounts.assigned;
    completed += amounts.completed;
  }
  return { assigned, completed, remaining: assigned - completed, rate: rate(completed, assigned), count: items.length };
}

export function parseUtcDay(value: string | Date): number | undefined {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return undefined;
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, yearText, monthText, dayText] = dateOnly;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const timestamp = Date.UTC(year, month - 1, day);
    const parsed = new Date(timestamp);
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
      ? timestamp
      : undefined;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
    : undefined;
}

const ALERT_SEVERITY: Record<AlertType, number> = {
  overdue: 0,
  'due-soon': 1,
  'missing-update': 2,
  'invalid-deadline': 3,
  'invalid-update': 4,
};

export function buildAlerts(items: readonly WorkItem[], now = new Date()): WorkAlert[] {
  const today = parseUtcDay(now);
  if (today === undefined) return [];
  const alerts: WorkAlert[] = [];
  for (const item of items) {
    if (item.status === 'done') continue;
    const deadline = parseUtcDay(item.deadline);
    if (deadline === undefined) {
      alerts.push({ itemId: item.id, type: 'invalid-deadline', deadline: item.deadline });
      continue;
    }
    const days = Math.round((deadline - today) / DAY_MS);
    if (days < 0) {
      alerts.push({ itemId: item.id, type: 'overdue', days, deadline: item.deadline });
      continue;
    }
    if (days <= 3) {
      alerts.push({ itemId: item.id, type: 'due-soon', days, deadline: item.deadline });
      continue;
    }
    const updated = parseUtcDay(item.updatedAt);
    if (updated === undefined) {
      alerts.push({ itemId: item.id, type: 'invalid-update', deadline: item.deadline });
    } else {
      const staleDays = Math.round((today - updated) / DAY_MS);
      if (staleDays > 7) alerts.push({ itemId: item.id, type: 'missing-update', days: staleDays, deadline: item.deadline });
    }
  }
  return alerts.sort((left, right) => ALERT_SEVERITY[left.type] - ALERT_SEVERITY[right.type]
    || left.deadline.localeCompare(right.deadline)
    || left.itemId.localeCompare(right.itemId));
}

function groupMetrics(items: readonly WorkItem[], groups: readonly { id: string; name: string }[], keyOf: (item: WorkItem) => string | undefined): MetricGroup[] {
  const itemsByGroup = new Map<string, WorkItem[]>();
  for (const group of groups) itemsByGroup.set(group.id, []);
  const unknown: WorkItem[] = [];
  for (const item of items) {
    const bucket = itemsByGroup.get(keyOf(item) ?? '');
    (bucket ?? unknown).push(item);
  }
  const result = groups.map((group) => ({ ...group, ...buildDashboardMetrics(itemsByGroup.get(group.id) ?? []) }));
  if (unknown.length) {
    const occupiedIds = new Set(groups.map((group) => group.id));
    let fallbackId = UNKNOWN_ID;
    let suffix = 1;
    while (occupiedIds.has(fallbackId)) fallbackId = `${UNKNOWN_ID}:${suffix++}`;
    result.push({ id: fallbackId, name: UNKNOWN_NAME, ...buildDashboardMetrics(unknown) });
  }
  return result;
}

export function groupByTeam(dataset: AppDataset): MetricGroup[] {
  return groupMetrics(dataset.workItems, dataset.teams, (item) => item.teamId);
}

export function groupByOfficer(dataset: AppDataset): MetricGroup[] {
  return groupMetrics(dataset.workItems, dataset.officers, (item) => item.officerId);
}

export function groupByTask(dataset: AppDataset): MetricGroup[] {
  return groupMetrics(dataset.workItems, dataset.taskDefinitions, (item) => item.taskDefinitionId);
}

export function groupByReportPeriod(dataset: AppDataset): MetricGroup[] {
  const taskById = new Map(dataset.taskDefinitions.map((task) => [task.id, task]));
  const groups = Array.from(new Set(dataset.taskDefinitions.map((task) => task.reportPeriod)))
    .map((period) => ({ id: period, name: period }));
  return groupMetrics(dataset.workItems, groups, (item) => taskById.get(item.taskDefinitionId)?.reportPeriod);
}
