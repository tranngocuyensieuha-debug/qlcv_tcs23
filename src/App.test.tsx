import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import App from './App';
import { SESSION_STORAGE_KEY } from './app/session';
import { LocalStorageRepository } from './data/localStorageRepository';
import type { AppDataset } from './domain/models';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

it('công bố trạng thái đang tải cho phiên đã xác thực', () => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accountId: 'lanhdao01' }));
  const pending = new Promise<AppDataset>(() => undefined);
  vi.spyOn(LocalStorageRepository.prototype, 'load').mockReturnValueOnce(pending);

  render(<App />);

  expect(screen.getByRole('status')).toHaveTextContent('Đang tải dữ liệu');
});

it('recovery chỉ bật cho lựa chọn lãnh đạo và gọi repository sau xác nhận', async () => {
  const user = userEvent.setup();
  vi.spyOn(LocalStorageRepository.prototype, 'load').mockRejectedValue(new Error('bad'));
  const restore = vi.spyOn(LocalStorageRepository.prototype, 'restoreFromLoadError').mockResolvedValue({} as AppDataset);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<App />);
  const button = await screen.findByRole('button', { name: 'Khôi phục bản sao lưu' });
  expect(button).toBeDisabled();
  expect(screen.queryByRole('option', { name: /Tổ Quản lý/ })).not.toBeInTheDocument();
  expect(restore).not.toHaveBeenCalled();
  await user.selectOptions(screen.getByLabelText('Tài khoản lãnh đạo khôi phục'), 'lanhdao01');
  await user.click(button);
  expect(restore).toHaveBeenCalledOnce();
});
