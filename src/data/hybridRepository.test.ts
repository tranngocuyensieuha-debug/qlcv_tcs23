import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HybridRepository } from './hybridRepository';
import { seedDataset } from './seedDataset';
import type { AppDataset } from '../domain/models';

const nextDataset: AppDataset = {
  ...seedDataset,
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('HybridRepository (Dual-Mode)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('khi API hoạt động, load từ API và các thao tác sau cũng qua API', async () => {
    const fetchMock = vi.mocked(fetch);
    // Giả lập API load thành công
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => seedDataset,
    } as Response);

    const repo = new HybridRepository();
    const data = await repo.load();

    expect(data).toEqual(seedDataset);
    expect(fetchMock).toHaveBeenCalledWith('/api/dataset', expect.any(Object));

    // Thử lưu dataset qua API
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => nextDataset,
    } as Response);

    const saved = await repo.save(nextDataset);
    expect(saved).toEqual(nextDataset);
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/dataset',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(nextDataset),
      })
    );
  });

  it('khi API hỏng mạng, load fallback về localStorage và các thao tác sau dùng localStorage', async () => {
    const fetchMock = vi.mocked(fetch);
    // Giả lập lỗi kết nối API
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    // Ghi sẵn dữ liệu vào localStorage
    localStorage.setItem('tcs23:dataset:v1', JSON.stringify(nextDataset));

    const repo = new HybridRepository();
    const data = await repo.load();

    // Phải load thành công từ localStorage
    expect(data).toEqual(nextDataset);

    // Save phải lưu vào localStorage
    const saved = await repo.save(seedDataset);
    expect(saved).toEqual(seedDataset);
    expect(JSON.parse(localStorage.getItem('tcs23:dataset:v1') ?? '')).toEqual(seedDataset);

    // Không được gọi tiếp fetch cho API
    expect(fetchMock).toHaveBeenCalledTimes(1); // Chỉ gọi 1 lần load hỏng mạng ban đầu
  });
});
