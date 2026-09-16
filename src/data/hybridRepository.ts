import type { AppDataset } from '../domain/models';
import { ApiRepository } from './apiRepository';
import { LocalStorageRepository } from './localStorageRepository';
import type { DataRepository } from './repository';

export class HybridRepository implements DataRepository {
  private readonly local = new LocalStorageRepository();
  private readonly api = new ApiRepository();
  private useLocal = false;

  async load(): Promise<AppDataset> {
    try {
      const data = await this.api.load();
      this.useLocal = false;
      return data;
    } catch (e) {
      console.warn('Backend API not available, falling back to LocalStorage.', e);
      this.useLocal = true;
      return this.local.load();
    }
  }

  async save(dataset: AppDataset): Promise<AppDataset> {
    if (this.useLocal) {
      return this.local.save(dataset);
    }
    try {
      return await this.api.save(dataset);
    } catch (e) {
      console.warn('Backend API save failed, trying local storage as backup.', e);
      return this.local.save(dataset);
    }
  }

  async replace(dataset: AppDataset): Promise<AppDataset> {
    if (this.useLocal) {
      return this.local.replace(dataset);
    }
    return this.api.replace(dataset);
  }

  async restoreLastBackup(): Promise<AppDataset> {
    if (this.useLocal) {
      return this.local.restoreLastBackup();
    }
    return this.api.restoreLastBackup();
  }

  async restoreFromLoadError(): Promise<AppDataset> {
    if (this.useLocal) {
      return this.local.restoreFromLoadError();
    }
    return this.api.restoreFromLoadError();
  }

  async resetToSeedFromLoadError(): Promise<AppDataset> {
    if (this.useLocal) {
      return this.local.resetToSeedFromLoadError();
    }
    return this.api.resetToSeedFromLoadError();
  }
}
