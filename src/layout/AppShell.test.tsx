import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStoreProvider } from '../app/AppStore';
import { SESSION_STORAGE_KEY } from '../app/session';
import { seedDataset } from '../data/seedDataset';
import type { DataRepository } from '../data/repository';
import AppShell from './AppShell';

function repository(): DataRepository { return { load: vi.fn(async () => seedDataset), save: vi.fn(async (d) => d), replace: vi.fn(async (d) => d), restoreLastBackup: vi.fn(async () => seedDataset), restoreFromLoadError: vi.fn(async () => seedDataset), resetToSeedFromLoadError: vi.fn(async () => seedDataset) }; }
async function renderShell(accountId = 'lanhdao01') {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accountId }));
  render(<AppStoreProvider repository={repository()}><AppShell /></AppStoreProvider>);
  await screen.findByRole('heading', { name: 'Tổng quan công việc' });
  return userEvent.setup();
}

describe('AppShell', () => {
  beforeEach(() => localStorage.clear());
  it('mở đúng màn hình từ đủ 7 mục điều hướng của lãnh đạo', async () => {
    const user = await renderShell();
    const pages = [['Công việc cá nhân','Công việc cá nhân'],['Nhân sự & địa bàn','Nhân sự & địa bàn'],['Báo cáo','Báo cáo kết quả'],['Cảnh báo','Cảnh báo tiến độ'],['Danh mục nhiệm vụ','Danh mục nhiệm vụ'],['Nhập dữ liệu Excel','Nhập dữ liệu Excel'],['Tổng quan','Tổng quan công việc']];
    for (const [link, heading] of pages) { await user.click(screen.getByRole('button', { name: new RegExp(`${link}$`) })); expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument(); }
  });
  it('ẩn nhập dữ liệu với tài khoản tổ và chỉ hiện một tổ', async () => {
    await renderShell('totruong_hkd1');
    expect(screen.queryByRole('button', { name: /Nhập dữ liệu Excel$/ })).not.toBeInTheDocument();
    expect(screen.getAllByTestId('team-row')).toHaveLength(1);
  });
  it('dashboard lãnh đạo hiển thị đủ 8 tổ và KPI thật', async () => {
    await renderShell();
    expect(screen.getAllByTestId('team-row')).toHaveLength(8);
    expect(screen.getByTestId('assigned-kpi')).toHaveTextContent('122.697.903.054');
    expect(screen.getByTestId('completed-kpi')).toHaveTextContent('52.031.433.330');
    expect(screen.getByTestId('remaining-kpi')).toHaveTextContent('70.666.469.724');
  });
  it('mở chi tiết bằng đúng work item, không tạo dòng giả', async () => {
    const user = await renderShell('totruong_hkd1');
    await user.click(screen.getByTestId('remaining-kpi'));
    const dialog = screen.getByRole('dialog', { name: 'Chi tiết công việc còn lại' });
    expect(dialog).toHaveTextContent('HKD1-CV01-01'); expect(dialog).toHaveTextContent('Ngô Mai Trang'); expect(dialog).not.toHaveTextContent('QLDN1');
  });
  it('menu di động có aria, đóng bằng overlay và Escape', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const user = await renderShell(); const menu = screen.getByRole('button', { name: 'Mở menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: /Tổng quan$/ })).not.toBeInTheDocument();
    await user.click(menu); expect(menu).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(screen.getByRole('button', { name: /Tổng quan$/ })).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Đóng menu' })); expect(menu).toHaveAttribute('aria-expanded', 'false');
    await user.click(menu); await user.keyboard('{Escape}'); await waitFor(() => expect(menu).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(menu).toHaveFocus());
    vi.unstubAllGlobals();
  });
});
