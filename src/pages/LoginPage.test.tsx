import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppStoreProvider } from '../app/AppStore';
import { SESSION_STORAGE_KEY } from '../app/session';
import { useAppStore } from '../app/useAppStore';
import type { AppDataset } from '../domain/models';
import { AuthorizationError, type DataRepository } from '../data/repository';
import { seedDataset } from '../data/seedDataset';
import LoginPage from './LoginPage';

function StoreView() {
  const store = useAppStore();
  if (store.loading) return <p>Đang tải dữ liệu…</p>;
  if (store.error) return <><p role="alert">{store.error}</p><button onClick={() => void store.retryLoad()}>Thử lại</button></>;
  if (!store.account) return <LoginPage />;
  return <><p>{store.account.label}</p><p data-testid="teams">{store.data?.teams.map((team) => team.id).join(',')}</p><button onClick={store.logout}>Đăng xuất</button></>;
}

function createRepository(data = seedDataset): DataRepository {
  let current = data;
  let backup = data;
  return {
    load: vi.fn(async () => current),
    save: vi.fn(async (next) => { current = next; return current; }),
    replace: vi.fn(async (next) => { backup = current; current = next; return current; }),
    restoreLastBackup: vi.fn(async () => { current = backup; return current; }),
    restoreFromLoadError: vi.fn(async () => { current = backup; return current; }),
    resetToSeedFromLoadError: vi.fn(async () => { current = seedDataset; return current; }),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

it('recovery API chặn blank/nonlead trước repository và cho lead', async () => {
  const repository = createRepository();
  const captured = captureStore(repository);
  await waitFor(() => expect(captured.store?.loading).toBe(false));
  await expect(captured.store?.restoreBackupFromLoadError('')).rejects.toBeInstanceOf(AuthorizationError);
  await expect(captured.store?.resetToSeedFromLoadError('totruong_hkd1')).rejects.toBeInstanceOf(AuthorizationError);
  expect(repository.restoreFromLoadError).not.toHaveBeenCalled();
  expect(repository.resetToSeedFromLoadError).not.toHaveBeenCalled();
  await expect(captured.store?.restoreBackupFromLoadError('lanhdao01')).resolves.toBe(true);
  expect(repository.restoreFromLoadError).toHaveBeenCalledOnce();
});

function captureStore(repository: DataRepository) {
  let captured: ReturnType<typeof useAppStore> | undefined;
  function Capture() {
    const store = useAppStore();
    useEffect(() => { captured = store; });
    return <StoreView />;
  }
  const view = render(<AppStoreProvider repository={repository}><Capture /></AppStoreProvider>);
  return { get store() { return captured; }, ...view };
}

async function renderStore(repository = createRepository()) {
  render(<AppStoreProvider repository={repository}><StoreView /></AppStoreProvider>);
  await screen.findByRole('heading', { name: 'Đăng nhập hệ thống' });
  return repository;
}

describe('đăng nhập theo vai trò', () => {
  beforeEach(() => localStorage.clear());

  it('đăng nhập tài khoản tổ và chỉ cung cấp dữ liệu đúng tổ', async () => {
    const user = userEvent.setup();
    await renderStore();
    await user.selectOptions(screen.getByLabelText('Tài khoản'), 'totruong_hkd1');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByText('Tổ Quản lý hộ kinh doanh số 1')).toBeInTheDocument();
    expect(screen.getByTestId('teams')).toHaveTextContent(/^HKD1$/);
  });

  it('tài khoản lãnh đạo xem đủ dữ liệu các tổ', async () => {
    const user = userEvent.setup();
    await renderStore();
    await user.selectOptions(screen.getByLabelText('Tài khoản'), 'lanhdao01');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByTestId('teams')).toHaveTextContent('HKD1,HKD2,QLDN1,QLDN2,KIEMTRA,HCTH,NVDTPC,QLTK');
  });

  it('khôi phục phiên hợp lệ khi tải lại provider', async () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accountId: 'totruong_qldn2' }));
    render(<AppStoreProvider repository={createRepository()}><StoreView /></AppStoreProvider>);
    expect(await screen.findByText('Tổ Quản lý doanh nghiệp số 2')).toBeInTheDocument();
    expect(screen.getByTestId('teams')).toHaveTextContent(/^QLDN2$/);
  });

  it('bỏ qua phiên lưu không còn khớp danh sách tài khoản', async () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accountId: 'admin' }));
    await renderStore();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('đăng xuất và xóa phiên đã lưu', async () => {
    const user = userEvent.setup();
    await renderStore();
    await user.selectOptions(screen.getByLabelText('Tài khoản'), 'lanhdao01');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    expect(screen.getByRole('heading', { name: 'Đăng nhập hệ thống' })).toBeInTheDocument();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});

describe('lỗi và thay thế dữ liệu', () => {
  beforeEach(() => localStorage.clear());

  it('hiển thị lỗi tải repository và cho phép thử lại', async () => {
    const repository = createRepository();
    vi.mocked(repository.load).mockRejectedValueOnce(new Error('ổ đĩa lỗi')).mockResolvedValueOnce(seedDataset);
    render(<AppStoreProvider repository={repository}><StoreView /></AppStoreProvider>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải dữ liệu');
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('heading', { name: 'Đăng nhập hệ thống' })).toBeInTheDocument();
  });

  it('chặn tài khoản tổ thay thế và khôi phục trước khi gọi repository', async () => {
    const repository = createRepository();
    const captured = captureStore(repository);
    await screen.findByRole('heading', { name: 'Đăng nhập hệ thống' });
    captured.store?.login('totruong_hkd1');
    await waitFor(() => expect(captured.store?.data?.teams).toHaveLength(1));
    const replacement: AppDataset = { ...seedDataset, updatedAt: '2026-08-26T00:00:00.000Z' };

    await expect(captured.store?.replaceData(replacement)).rejects.toBeInstanceOf(AuthorizationError);
    await expect(captured.store?.restoreBackup()).rejects.toThrow('Chỉ tài khoản lãnh đạo');
    expect(repository.replace).not.toHaveBeenCalled();
    expect(repository.restoreLastBackup).not.toHaveBeenCalled();
  });

  it('cho phép lãnh đạo thay thế và khôi phục full dataset', async () => {
    const repository = createRepository();
    const captured = captureStore(repository);
    await screen.findByRole('heading', { name: 'Đăng nhập hệ thống' });
    captured.store?.login('lanhdao01');
    await waitFor(() => expect(captured.store?.account?.role).toBe('lead'));
    const replacement: AppDataset = { ...seedDataset, updatedAt: '2026-08-26T00:00:00.000Z' };
    await expect(captured.store?.replaceData(replacement)).resolves.toBe(true);
    expect(repository.replace).toHaveBeenCalledWith(replacement);
    await expect(captured.store?.restoreBackup()).resolves.toBe(true);
    expect(captured.store?.data?.updatedAt).toBe(seedDataset.updatedAt);
  });

  it('không để load cũ ghi đè replace mới hoặc tắt loading của retry mới', async () => {
    const initialLoad = deferred<AppDataset>();
    const retryLoad = deferred<AppDataset>();
    const replacement: AppDataset = { ...seedDataset, updatedAt: '2026-08-26T00:00:00.000Z' };
    const repository = createRepository();
    vi.mocked(repository.load).mockReturnValueOnce(initialLoad.promise).mockReturnValueOnce(retryLoad.promise);
    vi.mocked(repository.replace).mockResolvedValueOnce(replacement);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accountId: 'lanhdao01' }));
    const captured = captureStore(repository);
    await waitFor(() => expect(repository.load).toHaveBeenCalledTimes(1));

    await expect(captured.store?.replaceData(replacement)).resolves.toBe(true);
    await waitFor(() => expect(captured.store?.data?.updatedAt).toBe(replacement.updatedAt));
    const retryPromise = captured.store!.retryLoad();
    await waitFor(() => expect(captured.store?.loading).toBe(true));
    initialLoad.resolve(seedDataset);
    await Promise.resolve();
    expect(captured.store?.loading).toBe(true);
    expect(captured.store?.data?.updatedAt).toBe(replacement.updatedAt);
    retryLoad.resolve(replacement);
    await retryPromise;
    await waitFor(() => expect(captured.store?.loading).toBe(false));
    expect(captured.store?.data?.updatedAt).toBe(replacement.updatedAt);
  });

  it('serialize replace và restore theo thứ tự gọi dù promise đầu chưa hoàn tất', async () => {
    const replaceResult = deferred<AppDataset>();
    const repository = createRepository();
    vi.mocked(repository.replace).mockReturnValueOnce(replaceResult.promise);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accountId: 'lanhdao01' }));
    const captured = captureStore(repository);
    await waitFor(() => expect(captured.store?.loading).toBe(false));
    const replacing = captured.store!.replaceData(seedDataset);
    const restoring = captured.store!.restoreBackup();
    expect(repository.restoreLastBackup).not.toHaveBeenCalled();
    replaceResult.resolve(seedDataset);
    await replacing;
    await restoring;
    expect(repository.restoreLastBackup).toHaveBeenCalledTimes(1);
  });

  it('không cập nhật state sau khi provider unmount trong lúc load', async () => {
    const load = deferred<AppDataset>();
    const repository = createRepository();
    vi.mocked(repository.load).mockReturnValueOnce(load.promise);
    const captured = captureStore(repository);
    await waitFor(() => expect(repository.load).toHaveBeenCalled());
    captured.unmount();
    load.resolve(seedDataset);
    await expect(load.promise).resolves.toBe(seedDataset);
  });
});
