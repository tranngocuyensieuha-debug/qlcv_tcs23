import type { AppDataset } from '../domain/models';

export interface DataRepository {
  load(): Promise<AppDataset>;
  save(dataset: AppDataset): Promise<AppDataset>;
  replace(dataset: AppDataset): Promise<AppDataset>;
  restoreLastBackup(): Promise<AppDataset>;
  restoreFromLoadError(): Promise<AppDataset>;
  resetToSeedFromLoadError(): Promise<AppDataset>;
}

export class RepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RepositoryError';
  }
}

export class AuthorizationError extends Error {
  constructor() {
    super('Chỉ tài khoản lãnh đạo được thay thế hoặc khôi phục toàn bộ dữ liệu.');
    this.name = 'AuthorizationError';
  }
}
