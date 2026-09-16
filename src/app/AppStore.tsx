import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { findAccount, USER_ACCOUNTS } from '../accounts';
import { HybridRepository } from '../data/hybridRepository';
import { AuthorizationError, type DataRepository } from '../data/repository';
import { scopeDataset } from '../domain/access';
import type { AppDataset, SessionAccount, WorkItem } from '../domain/models';
import { AppStoreContext, type AppStoreValue } from './AppStoreContext';
import {
  type AuditLogEntry,
  createAuditEntry,
  loadAuditLogs,
  saveAuditLogs,
} from '../utils/auditLogger';

import { SESSION_STORAGE_KEY } from './session';

function readStoredAccount(): SessionAccount | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    const accountId = typeof value === 'object' && value !== null && 'accountId' in value
      ? (value as { accountId?: unknown }).accountId
      : undefined;
    const account = typeof accountId === 'string' ? findAccount(accountId) : undefined;
    if (account) return account;
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* storage unavailable */ }
  }
  return null;
}

export function AppStoreProvider({ children, repository }: { children: ReactNode; repository?: DataRepository }) {
  const repo = useMemo<DataRepository>(() => repository ?? new HybridRepository(), [repository]);
  const [account, setAccount] = useState<SessionAccount | null>(readStoredAccount);
  const [fullData, setFullData] = useState<AppDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadAuditLogs());
  const mountedRef = useRef(false);
  const operationRef = useRef(0);
  const loadRef = useRef(0);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const logAction = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'badge'>) => {
    const newLog = createAuditEntry(entry);
    setAuditLogs((prev) => {
      const next = [newLog, ...prev];
      saveAuditLogs(next);
      return next;
    });
  }, []);

  const clearAuditLogs = useCallback(() => {
    setAuditLogs([]);
    saveAuditLogs([]);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; operationRef.current += 1; loadRef.current += 1; };
  }, []);

  const retryLoad = useCallback(async () => {
    const operation = ++operationRef.current;
    const load = ++loadRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = await repo.load();
      if (mountedRef.current && operation === operationRef.current) setFullData(next);
    } catch {
      if (mountedRef.current && operation === operationRef.current) setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      if (mountedRef.current && load === loadRef.current) setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    const timer = window.setTimeout(() => void retryLoad(), 0);
    return () => window.clearTimeout(timer);
  }, [retryLoad]);

  const login = useCallback((accountId: string) => {
    const next = findAccount(accountId);
    if (!next) return false;
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accountId: next.id }));
      setAccount(next);
      setError(null);
      const userObj = USER_ACCOUNTS.find((u) => u.id === next.id);
      logAction({
        userId: next.id,
        userName: userObj?.fullName || next.label,
        userRole: next.role,
        teamId: next.role === 'team' ? next.teamId : undefined,
        teamName: next.role === 'team' ? (fullData?.teams.find((t) => t.id === next.teamId)?.name || next.teamId) : 'Ban Lãnh đạo Thuế cơ sở 23',
        action: 'LOGIN',
        target: 'Hệ thống TCS23',
        details: `Đăng nhập hệ thống thành công (Chức vụ: ${userObj?.position || next.label})`,
      });
      return true;
    } catch {
      setError('Không thể lưu phiên đăng nhập.');
      return false;
    }
  }, [fullData, logAction]);

  const logout = useCallback(() => {
    if (account) {
      const userObj = USER_ACCOUNTS.find((u) => u.id === account.id);
      logAction({
        userId: account.id,
        userName: userObj?.fullName || account.label,
        userRole: account.role,
        teamId: account.role === 'team' ? account.teamId : undefined,
        teamName: account.role === 'team' ? (fullData?.teams.find((t) => t.id === account.teamId)?.name || account.teamId) : 'Ban Lãnh đạo Thuế cơ sở 23',
        action: 'LOGOUT',
        target: 'Hệ thống TCS23',
        details: `Đăng xuất khỏi hệ thống phiên làm việc của ${userObj?.fullName || account.id}`,
      });
    }
    try { localStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* logout locally regardless */ }
    setAccount(null);
  }, [account, fullData, logAction]);

  const replaceData = useCallback(async (dataset: AppDataset) => {
    if (account?.role !== 'lead') throw new AuthorizationError();
    const operation = ++operationRef.current;
    setError(null);
    const execute = async () => {
      try {
        const next = await repo.replace(dataset);
        if (mountedRef.current && operation === operationRef.current) {
          setFullData(next);
          setLoading(false);
          const userObj = USER_ACCOUNTS.find((u) => u.id === account.id);
          logAction({
            userId: account.id,
            userName: userObj?.fullName || account.label,
            userRole: account.role,
            action: 'IMPORT_EXCEL',
            target: 'Dữ liệu toàn hệ thống',
            details: `Nhập dữ liệu thành công từ file Excel (${dataset.workItems.length} công việc, ${dataset.officers.length} cán bộ)`,
          });
        }
        return true;
      } catch {
        if (mountedRef.current && operation === operationRef.current) setError('Không thể thay thế dữ liệu.');
        return false;
      }
    };
    const result = mutationQueueRef.current.then(execute, execute);
    mutationQueueRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, [account, logAction, repo]);

  const restoreBackup = useCallback(async () => {
    if (account?.role !== 'lead') throw new AuthorizationError();
    const operation = ++operationRef.current;
    setError(null);
    const execute = async () => {
      try {
        const next = await repo.restoreLastBackup();
        if (mountedRef.current && operation === operationRef.current) {
          setFullData(next);
          setLoading(false);
        }
        return true;
      } catch {
        if (mountedRef.current && operation === operationRef.current) setError('Không thể khôi phục bản sao lưu.');
        return false;
      }
    };
    const result = mutationQueueRef.current.then(execute, execute);
    mutationQueueRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, [account, repo]);

  const saveWorkItem = useCallback(async (item: WorkItem) => {
    if (!account) return false;
    if (account.role !== 'lead' && item.teamId !== account.teamId) {
      throw new AuthorizationError();
    }
    const operation = ++operationRef.current;
    setError(null);
    const execute = async () => {
      try {
        const currentData = fullData ?? (await repo.load());
        const existingIndex = currentData.workItems.findIndex((x) => x.id === item.id);
        const itemToSave: WorkItem = {
          ...item,
          updatedAt: new Date().toISOString(),
        };

        let nextWorkItems: WorkItem[];
        if (existingIndex >= 0) {
          nextWorkItems = [...currentData.workItems];
          nextWorkItems[existingIndex] = itemToSave;
        } else {
          nextWorkItems = [itemToSave, ...currentData.workItems];
        }

        const nextDataset: AppDataset = {
          ...currentData,
          workItems: nextWorkItems,
          updatedAt: new Date().toISOString(),
        };

        const saved = await repo.save(nextDataset);
        if (mountedRef.current && operation === operationRef.current) {
          setFullData(saved);
          const taskName = currentData.taskDefinitions.find((t) => t.id === item.taskDefinitionId)?.name || item.taskDefinitionId;
          const officerName = currentData.officers.find((o) => o.id === item.officerId)?.name || item.officerId;
          const teamName = currentData.teams.find((t) => t.id === item.teamId)?.name || item.teamId;
          const userObj = USER_ACCOUNTS.find((u) => u.id === account.id);

          if (existingIndex >= 0) {
            const oldItem = currentData.workItems[existingIndex];
            const changes: string[] = [];
            if (oldItem.assigned !== item.assigned) changes.push(`Phải làm: ${oldItem.assigned} ➔ ${item.assigned}`);
            if (oldItem.completed !== item.completed) changes.push(`Đã làm: ${oldItem.completed} ➔ ${item.completed}`);
            if (oldItem.deadline !== item.deadline) changes.push(`Hạn: ${oldItem.deadline} ➔ ${item.deadline}`);
            if (oldItem.status !== item.status) changes.push(`Trạng thái: ${oldItem.status} ➔ ${item.status}`);

            logAction({
              userId: account.id,
              userName: userObj?.fullName || account.label,
              userRole: account.role,
              teamId: item.teamId,
              teamName,
              action: 'UPDATE_WORK',
              target: item.id,
              details: `Cập nhật kết quả "${taskName}" của cán bộ ${officerName} (${teamName}): ${changes.length ? changes.join(', ') : 'Lưu kết quả thành công'}`,
            });
          } else {
            logAction({
              userId: account.id,
              userName: userObj?.fullName || account.label,
              userRole: account.role,
              teamId: item.teamId,
              teamName,
              action: 'CREATE_WORK',
              target: item.id,
              details: `Tạo mới công việc "${taskName}" giao cho cán bộ ${officerName} (${teamName}): Phải làm ${item.assigned}, Đã làm ${item.completed}, Hạn ${item.deadline}`,
            });
          }
        }
        return true;
      } catch (err) {
        if (mountedRef.current && operation === operationRef.current) {
          setError(err instanceof Error ? err.message : 'Không thể lưu công việc.');
        }
        return false;
      }
    };
    const result = mutationQueueRef.current.then(execute, execute);
    mutationQueueRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, [account, fullData, logAction, repo]);

  const deleteWorkItem = useCallback(async (itemId: string) => {
    if (!account) return false;
    const operation = ++operationRef.current;
    setError(null);
    const execute = async () => {
      try {
        const currentData = fullData ?? (await repo.load());
        const target = currentData.workItems.find((x) => x.id === itemId);
        if (!target) return true;
        if (account.role !== 'lead' && target.teamId !== account.teamId) {
          throw new AuthorizationError();
        }

        const nextDataset: AppDataset = {
          ...currentData,
          workItems: currentData.workItems.filter((x) => x.id !== itemId),
          updatedAt: new Date().toISOString(),
        };

        const saved = await repo.save(nextDataset);
        if (mountedRef.current && operation === operationRef.current) {
          setFullData(saved);
          const taskName = currentData.taskDefinitions.find((t) => t.id === target.taskDefinitionId)?.name || target.taskDefinitionId;
          const officerName = currentData.officers.find((o) => o.id === target.officerId)?.name || target.officerId;
          const teamName = currentData.teams.find((t) => t.id === target.teamId)?.name || target.teamId;
          const userObj = USER_ACCOUNTS.find((u) => u.id === account.id);

          logAction({
            userId: account.id,
            userName: userObj?.fullName || account.label,
            userRole: account.role,
            teamId: target.teamId,
            teamName,
            action: 'DELETE_WORK',
            target: target.id,
            details: `Xóa công việc "${taskName}" của cán bộ ${officerName} (${teamName})`,
          });
        }
        return true;
      } catch (err) {
        if (mountedRef.current && operation === operationRef.current) {
          setError(err instanceof Error ? err.message : 'Không thể xóa công việc.');
        }
        return false;
      }
    };
    const result = mutationQueueRef.current.then(execute, execute);
    mutationQueueRef.current = result.then(() => undefined, () => undefined);
    return result;
  }, [account, fullData, logAction, repo]);

  const data = useMemo(() => fullData && account ? scopeDataset(fullData, account) : null, [fullData, account]);
  const recover = useCallback(async (kind: 'restore' | 'reset', recoveryAccountId: string) => {
    if (findAccount(recoveryAccountId)?.role !== 'lead') throw new AuthorizationError();
    try {
      const next = kind === 'restore' ? await repo.restoreFromLoadError() : await repo.resetToSeedFromLoadError();
      if (mountedRef.current) {
        setFullData(next);
        setError(null);
        setLoading(false);
        const userObj = USER_ACCOUNTS.find((u) => u.id === recoveryAccountId);
        logAction({
          userId: recoveryAccountId,
          userName: userObj?.fullName || recoveryAccountId,
          userRole: 'lead',
          action: kind === 'restore' ? 'RESTORE_BACKUP' : 'RESET_SEED',
          target: 'Hệ thống TCS23',
          details: kind === 'restore' ? 'Khôi phục bản sao lưu dữ liệu gần nhất' : 'Đặt lại dữ liệu hệ thống về mẫu ban đầu',
        });
      }
      return true;
    } catch { if (mountedRef.current) setError(kind === 'restore' ? 'Không thể khôi phục bản sao lưu.' : 'Không thể đặt lại dữ liệu mẫu.'); return false; }
  }, [logAction, repo]);
  const restoreBackupFromLoadError = useCallback((id: string) => recover('restore', id), [recover]);
  const resetToSeedFromLoadError = useCallback((id: string) => recover('reset', id), [recover]);
  const value = useMemo<AppStoreValue>(() => ({
    account, data, loading, error, auditLogs, login, logout, retryLoad, replaceData, restoreBackup, restoreBackupFromLoadError, resetToSeedFromLoadError, saveWorkItem, deleteWorkItem, logAction, clearAuditLogs,
  }), [account, data, loading, error, auditLogs, login, logout, retryLoad, replaceData, restoreBackup, restoreBackupFromLoadError, resetToSeedFromLoadError, saveWorkItem, deleteWorkItem, logAction, clearAuditLogs]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}
