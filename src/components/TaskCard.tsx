import { PRIORITY_LABELS } from '../types';
import type { Priority, Task } from '../types';
import { TEAMS, USERS } from '../data/seed';
import { formatDate, getDaysRemaining, getDeadlineStatus } from '../utils/deadline';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMoveParticipant: (sourceTaskId: string, targetTaskId: string, userId: string) => void;
  onUpdateParticipantAssigned: (taskId: string, userId: string, assigned: number) => void;
  onUpdateParticipantCompleted: (taskId: string, userId: string, completed: number) => void;
  onUpdateTaskDeadline: (taskId: string, deadline: string) => void;
  onUpdateParticipantDeadline: (taskId: string, userId: string, deadline: string) => void;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
};

const PRIORITY_MARK: Record<Priority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-600',
};

function getProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-emerald-600';
  if (progress >= 80) return 'bg-blue-600';
  if (progress >= 40) return 'bg-amber-500';
  return 'bg-slate-400';
}

function participantDeadlineClass(deadline: string): string {
  const status = getDeadlineStatus(deadline);
  if (status === 'overdue') return 'text-red-700';
  if (status === 'warning') return 'text-amber-700';
  return 'text-slate-500';
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onMoveParticipant,
  onUpdateParticipantAssigned,
  onUpdateParticipantCompleted,
  onUpdateTaskDeadline,
  onUpdateParticipantDeadline,
}: TaskCardProps) {
  const taskTeams = TEAMS.filter((team) =>
    task.participants.some((participant) => USERS.find((user) => user.id === participant.userId)?.teamId === team.id),
  );
  const deadlineStatus = getDeadlineStatus(task.deadline);
  const daysRemaining = getDaysRemaining(task.deadline);
  const issueKey = task.id.replace('task-', 'THUE-').toUpperCase();
  const progress = Math.min(100, Math.max(0, task.progress));

  const deadlineLabel =
    task.status === 'done'
      ? `Hoàn thành, hạn ${formatDate(task.deadline)}`
      : deadlineStatus === 'overdue'
        ? `Quá hạn ${Math.abs(daysRemaining)} ngày`
        : deadlineStatus === 'warning'
          ? daysRemaining === 0
            ? 'Đến hạn hôm nay'
            : `Còn ${daysRemaining} ngày`
          : `Hạn chung ${formatDate(task.deadline)}`;

  const deadlineClass =
    task.status === 'done'
      ? 'bg-emerald-50 text-emerald-700'
      : deadlineStatus === 'overdue'
        ? 'bg-red-50 text-red-700'
        : deadlineStatus === 'warning'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-100 text-slate-600';

  return (
    <article
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('application/x-task-participant')) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={(event) => {
        const raw = event.dataTransfer.getData('application/x-task-participant');
        if (!raw) return;

        event.preventDefault();
        event.stopPropagation();

        try {
          const payload = JSON.parse(raw) as { sourceTaskId: string; userId: string };
          onMoveParticipant(payload.sourceTaskId, task.id, payload.userId);
        } catch {
          // Bỏ qua dữ liệu kéo thả không hợp lệ từ bên ngoài ứng dụng.
        }
      }}
      className="group rounded bg-white p-3 shadow-[0_1px_2px_rgba(9,30,66,0.25)] ring-1 ring-slate-200/70 transition hover:bg-slate-50 hover:shadow-[0_4px_10px_rgba(9,30,66,0.18)]"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{issueKey}</span>
        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold ${PRIORITY_STYLES[task.priority]}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_MARK[task.priority]}`} />
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      <h4 className="text-sm font-semibold leading-snug text-[#172b4d]">{task.title}</h4>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{task.description}</p>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span>Tiến độ chung</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full ${getProgressColor(progress)}`} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-3 rounded border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100/60">
          Phân công chỉ tiêu cán bộ
        </div>
        <div className="divide-y divide-slate-200">
          {task.participants.map((participant) => {
            const user = USERS.find((item) => item.id === participant.userId);
            const participantProgress = Math.min(100, Math.max(0, participant.progress));
            const rate =
              participant.assigned > 0
                ? Math.round((participant.completed / participant.assigned) * 100)
                : participantProgress;

            return (
              <div
                key={participant.userId}
                draggable
                onDragStart={(event) => {
                  event.stopPropagation();
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData(
                    'application/x-task-participant',
                    JSON.stringify({
                      sourceTaskId: task.id,
                      sourceTaskTitle: task.title,
                      userId: participant.userId,
                    }),
                  );
                }}
                className="cursor-grab px-2 py-2 transition hover:bg-white active:cursor-grabbing"
                title="Kéo cán bộ này sang chuyên đề khác"
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="min-w-0 truncate font-bold text-slate-800">
                    {user?.name ?? 'Chưa chọn'}
                  </span>
                  <label className={`flex shrink-0 items-center gap-1 font-bold ${participantDeadlineClass(participant.deadline)}`}>
                    Hạn xử lý
                    <input
                      type="date"
                      value={participant.deadline}
                      onMouseDown={(event) => event.stopPropagation()}
                      onDragStart={(event) => event.preventDefault()}
                      onChange={(event) =>
                        onUpdateParticipantDeadline(task.id, participant.userId, event.target.value)
                      }
                      className="w-[112px] rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                      aria-label={`Sửa thời hạn ${user?.name ?? 'cán bộ'}`}
                    />
                  </label>
                </div>

                <div className="mt-1 grid grid-cols-[1fr_1fr_72px] gap-1 text-[10px] text-slate-500">
                  <label>
                    Chỉ tiêu giao
                    <input
                      type="number"
                      min="0"
                      value={participant.assigned}
                      onMouseDown={(event) => event.stopPropagation()}
                      onDragStart={(event) => event.preventDefault()}
                      onChange={(event) =>
                        onUpdateParticipantAssigned(task.id, participant.userId, Number(event.target.value))
                      }
                      className="ml-1 w-12 rounded border border-slate-300 bg-white px-1 py-0.5 text-right text-[10px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                      aria-label={`Sửa số chỉ tiêu giao ${user?.name ?? 'cán bộ'}`}
                    />
                  </label>
                  <label>
                    Đã đạt
                    <input
                      type="number"
                      min="0"
                      max={participant.assigned}
                      value={participant.completed}
                      onMouseDown={(event) => event.stopPropagation()}
                      onDragStart={(event) => event.preventDefault()}
                      onChange={(event) =>
                        onUpdateParticipantCompleted(task.id, participant.userId, Number(event.target.value))
                      }
                      className="ml-1 w-12 rounded border border-slate-300 bg-white px-1 py-0.5 text-right text-[10px] font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                      aria-label={`Sửa số đã đạt ${user?.name ?? 'cán bộ'}`}
                    />
                  </label>
                  <span className="text-right">
                    Đạt <b className="text-slate-900">{rate}%</b>
                  </span>
                </div>

                <div className="mt-1 grid grid-cols-[1fr_38px] items-center gap-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${getProgressColor(participantProgress)}`}
                      style={{ width: `${participantProgress}%` }}
                    />
                  </div>
                  <span className="text-right text-[10px] font-bold text-slate-500">{participantProgress}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-16 shrink-0 font-semibold text-slate-400">Tổ quản lý</span>
          <span className="min-w-0 truncate font-semibold">{taskTeams.map((team) => team.name).join(', ') || 'Chưa chọn'}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`rounded px-2 py-1 text-[11px] font-bold ${deadlineClass}`}>{deadlineLabel}</span>
        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
          Thời hạn chung
          <input
            type="date"
            value={task.deadline}
            onChange={(event) => onUpdateTaskDeadline(task.id, event.target.value)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <div className="flex shrink-0 gap-1 opacity-100 lg:opacity-0 lg:transition lg:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-700"
          >
            Sửa chuyên đề
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Xóa chuyên đề nghiệp vụ này?')) onDelete(task.id);
            }}
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-700"
          >
            Xóa chuyên đề
          </button>
        </div>
      </div>
    </article>
  );
}
