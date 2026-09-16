import { createContext } from 'react';

import type { AppDataset, SessionAccount, WorkItem } from '../domain/models';
import type { AuditLogEntry } from '../utils/auditLogger';

export interface AppStoreValue {
  account: SessionAccount | null;
  data: AppDataset | null;
  loading: boolean;
  error: string | null;
  auditLogs: AuditLogEntry[];
  login(accountId: string): boolean;
  logout(): void;
  retryLoad(): Promise<void>;
  replaceData(dataset: AppDataset): Promise<boolean>;
  restoreBackup(): Promise<boolean>;
  restoreBackupFromLoadError(recoveryAccountId: string): Promise<boolean>;
  resetToSeedFromLoadError(recoveryAccountId: string): Promise<boolean>;
  saveWorkItem(item: WorkItem): Promise<boolean>;
  deleteWorkItem(itemId: string): Promise<boolean>;
  logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'badge'>): void;
  clearAuditLogs(): void;
}

export const AppStoreContext = createContext<AppStoreValue | null>(null);
