import { describe, expect, it } from 'vitest';
import { formatDate, getDaysRemaining, getDeadlineStatus } from './deadline';

describe('deadline UTC calendar math', () => {
  it('từ chối ngày rollover không hợp lệ', () => {
    expect(getDaysRemaining('2026-02-30', new Date('2026-02-28T23:30:00-05:00'))).toBeNaN();
    expect(getDeadlineStatus('2026-02-30', new Date('2026-02-28T23:30:00-05:00'))).toBe('normal');
    expect(formatDate('2026-02-30')).toBe('Ngày không hợp lệ');
  });

  it('chấp nhận ngày nhuận và tính theo biên ngày UTC', () => {
    expect(getDaysRemaining('2028-02-29', new Date('2028-02-28T23:30:00-05:00'))).toBe(0);
    expect(getDaysRemaining('2028-03-01', new Date('2028-02-29T23:30:00Z'))).toBe(1);
  });
});
