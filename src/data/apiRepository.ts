import type { AppDataset } from '../domain/models';
import type { DataRepository } from './repository';
import { RepositoryError } from './repository';

export class ApiRepository implements DataRepository {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async load(): Promise<AppDataset> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dataset`, { cache: 'no-store' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new RepositoryError('Không thể kết nối đến máy chủ để tải dữ liệu.', { cause: error });
    }
  }

  async save(dataset: AppDataset): Promise<AppDataset> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dataset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataset),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new RepositoryError('Không thể gửi dữ liệu đến máy chủ để lưu.', { cause: error });
    }
  }

  async replace(dataset: AppDataset): Promise<AppDataset> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dataset?replace=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataset),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new RepositoryError('Không thể thay thế dữ liệu trên máy chủ.', { cause: error });
    }
  }

  async restoreLastBackup(): Promise<AppDataset> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dataset/restore`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new RepositoryError('Không thể yêu cầu khôi phục bản sao lưu từ máy chủ.', { cause: error });
    }
  }

  async restoreFromLoadError(): Promise<AppDataset> {
    return this.restoreLastBackup();
  }

  async resetToSeedFromLoadError(): Promise<AppDataset> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dataset/reset`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new RepositoryError('Không thể yêu cầu đặt lại dữ liệu mẫu từ máy chủ.', { cause: error });
    }
  }
}
