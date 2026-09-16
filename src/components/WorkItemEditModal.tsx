import { useState, useMemo, useEffect } from 'react';
import type { AppDataset, SessionAccount, WorkItem, WorkStatus } from '../domain/models';

interface WorkItemEditModalProps {
  isOpen: boolean;
  item?: WorkItem | null;
  data: AppDataset;
  currentAccount: SessionAccount | null;
  onClose: () => void;
  onSave: (item: WorkItem) => Promise<boolean | void>;
  onDelete?: (itemId: string) => Promise<boolean | void>;
}

export default function WorkItemEditModal({
  isOpen,
  item,
  data,
  currentAccount,
  onClose,
  onSave,
  onDelete,
}: WorkItemEditModalProps) {
  const isEditing = Boolean(item && item.id);
  const isLead = currentAccount?.role === 'lead';
  const defaultTeam = isLead ? (item?.teamId || data.teams[0]?.id || 'HKD1') : (currentAccount?.teamId || 'HKD1');

  const [teamId, setTeamId] = useState<string>(defaultTeam);
  const [taskDefinitionId, setTaskDefinitionId] = useState<string>(item?.taskDefinitionId || '');
  const [officerId, setOfficerId] = useState<string>(item?.officerId || '');
  const [assigned, setAssigned] = useState<number>(item?.assigned ?? 10);
  const [completed, setCompleted] = useState<number>(item?.completed ?? 0);
  const [deadline, setDeadline] = useState<string>(item?.deadline || new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<WorkStatus>(item?.status || 'in_progress');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form when modal opens or item changes
  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    if (item) {
      const currentTeam = item.teamId || (isLead ? (data.teams[0]?.id || 'HKD1') : (currentAccount?.teamId || 'HKD1'));
      setTeamId(currentTeam);
      const teamTasks = data.taskDefinitions.filter(t => t.applicableTeamIds.includes(currentTeam));
      const teamOfficers = data.officers.filter(o => o.teamId === currentTeam);
      setTaskDefinitionId(item.taskDefinitionId || teamTasks[0]?.id || '');
      setOfficerId(item.officerId || teamOfficers[0]?.id || '');
      setAssigned(item.assigned ?? 10);
      setCompleted(item.completed ?? 0);
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      setDeadline(item.deadline || defaultDate.toISOString().slice(0, 10));
      setStatus(item.status || 'in_progress');
    } else {
      const initialTeam = isLead ? (data.teams[0]?.id || 'HKD1') : (currentAccount?.teamId || 'HKD1');
      setTeamId(initialTeam);
      const teamTasks = data.taskDefinitions.filter(t => t.applicableTeamIds.includes(initialTeam));
      const teamOfficers = data.officers.filter(o => o.teamId === initialTeam);
      setTaskDefinitionId(teamTasks[0]?.id || '');
      setOfficerId(teamOfficers[0]?.id || '');
      setAssigned(10);
      setCompleted(0);
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 14);
      setDeadline(nextMonth.toISOString().slice(0, 10));
      setStatus('in_progress');
    }
  }, [isOpen, item, isLead, data, currentAccount]);

  // Tasks applicable to selected team
  const availableTasks = useMemo(() => {
    const list = data.taskDefinitions.filter((t) => t.applicableTeamIds.includes(teamId));
    return list.length > 0 ? list : data.taskDefinitions;
  }, [data.taskDefinitions, teamId]);

  // Officers belonging to selected team
  const availableOfficers = useMemo(() => {
    const list = data.officers.filter((o) => o.teamId === teamId);
    return list.length > 0 ? list : data.officers;
  }, [data.officers, teamId]);

  // Handle team change (auto reset task & officer if invalid)
  const handleTeamChange = (newTeamId: string) => {
    setTeamId(newTeamId);
    const tasks = data.taskDefinitions.filter((t) => t.applicableTeamIds.includes(newTeamId));
    const officers = data.officers.filter((o) => o.teamId === newTeamId);
    if (!tasks.some((t) => t.id === taskDefinitionId)) {
      setTaskDefinitionId(tasks[0]?.id || '');
    }
    if (!officers.some((o) => o.id === officerId)) {
      setOfficerId(officers[0]?.id || '');
    }
  };

  // Auto-suggest status 'done' if completed >= assigned
  const handleCompletedChange = (val: number) => {
    setCompleted(val);
    if (assigned > 0 && val >= assigned && status !== 'done') {
      setStatus('done');
    } else if (assigned > 0 && val < assigned && status === 'done') {
      setStatus('in_progress');
    }
  };

  const progressRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!taskDefinitionId) {
      setErrorMessage('Vui lòng chọn nhiệm vụ.');
      return;
    }
    if (!officerId) {
      setErrorMessage('Vui lòng chọn cán bộ thực hiện.');
      return;
    }
    if (assigned < 0) {
      setErrorMessage('Chỉ tiêu phải thực hiện không được là số âm.');
      return;
    }
    if (completed < 0) {
      setErrorMessage('Số đã thực hiện không được là số âm.');
      return;
    }
    if (!deadline) {
      setErrorMessage('Vui lòng nhập thời hạn.');
      return;
    }

    setIsSaving(true);
    try {
      const id = item?.id || `${teamId}-CV-${officerId}-${taskDefinitionId}-${Date.now()}`;
      const itemToSave: WorkItem = {
        id,
        taskDefinitionId,
        teamId,
        officerId,
        assigned,
        completed,
        deadline,
        status,
        updatedAt: new Date().toISOString(),
      };

      await onSave(itemToSave);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi lưu kết quả.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;
    if (window.confirm('Đồng chí có chắc chắn muốn xóa công việc này không?')) {
      setIsSaving(true);
      try {
        await onDelete(item.id);
        onClose();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Có lỗi khi xóa công việc.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          padding: '24px',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              {isEditing ? '✏️ Cập Nhật Kết Quả Công Việc' : '➕ Nhập Công Việc / Kết Quả Mới'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
              {isEditing ? `Mã công việc: ${item?.id}` : 'Nhập chỉ tiêu và kết quả trực tiếp vào hệ thống (không cần file Excel)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '0.85rem', fontWeight: 600, marginBottom: '14px' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 1. Chọn Tổ */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              🏢 Tổ quản lý / thực hiện
            </label>
            {isLead ? (
              <select
                value={teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {data.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled
                value={data.teams.find((t) => t.id === teamId)?.name || teamId}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.9rem',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  boxSizing: 'border-box'
                }}
              />
            )}
          </div>

          {/* 2. Chọn Nhiệm vụ */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              📌 Tên nhiệm vụ / chỉ tiêu
            </label>
            <select
              value={taskDefinitionId}
              onChange={(e) => setTaskDefinitionId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.88rem',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Chọn nhiệm vụ --</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.id}] {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Chọn Cán bộ thực hiện */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              👤 Cán bộ phụ trách
            </label>
            <select
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.88rem',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Chọn cán bộ phụ trách --</option>
              {availableOfficers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} - {o.title} ({o.area})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Khối lượng: Phải thực hiện & Đã thực hiện */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                🎯 Phải thực hiện (Chỉ tiêu)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={assigned}
                onChange={(e) => setAssigned(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                ✅ Đã thực hiện (Kết quả)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={completed}
                onChange={(e) => handleCompletedChange(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #16A34A',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#15803D',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Thanh Tiến độ Trực quan Realtime */}
          <div style={{ marginBottom: '16px', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>Tiến độ thực hiện:</span>
              <span style={{ fontWeight: 800, color: progressRate >= 100 ? '#16A34A' : progressRate >= 70 ? '#2563EB' : '#D97706' }}>
                {progressRate}% ({completed} / {assigned})
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, progressRate))}%`,
                  backgroundColor: progressRate >= 100 ? '#16A34A' : progressRate >= 70 ? '#2563EB' : '#D97706',
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            </div>
          </div>

          {/* 5. Thời hạn & Trạng thái */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                📅 Thời hạn giải quyết
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                🏷️ Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkStatus)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.9rem',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="todo">⏳ Chưa thực hiện</option>
                <option value="in_progress">🔄 Đang thực hiện</option>
                <option value="waiting">⏸️ Chờ xử lý / đôn đốc</option>
                <option value="done">✅ Hoàn thành</option>
              </select>
            </div>
          </div>

          {/* Nút hành động */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '16px', gap: '10px' }}>
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                style={{
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🗑️ Xóa
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                  boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>💾</span>
                <span>{isSaving ? 'Đang lưu…' : 'Lưu kết quả'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
