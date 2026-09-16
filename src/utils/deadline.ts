import type { DeadlineStatus } from '../types';
import { parseUtcDay } from '../domain/metrics';

export function getDaysRemaining(deadline: string, now = new Date()): number {
  const today = parseUtcDay(now);
  const deadlineDate = parseUtcDay(deadline);
  if (today === undefined || deadlineDate === undefined) return Number.NaN;
  const diffMs = deadlineDate - today;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getDeadlineStatus(deadline: string, now = new Date()): DeadlineStatus {
  const daysRemaining = getDaysRemaining(deadline, now);

  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 3) return 'warning';
  return 'normal';
}

export function formatDate(dateString: string): string {
  const timestamp = parseUtcDay(dateString);
  if (timestamp === undefined) return 'Ngày không hợp lệ';
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
