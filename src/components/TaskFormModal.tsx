import { useState } from 'react';
import { PRIORITY_LABELS } from '../types';
import type { Priority, Task, TaskStatus } from '../types';
import { TEAMS, USERS } from '../data/seed';

interface TaskFormModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (task: Task | Omit<Task, 'id' | 'createdAt'>) => void;
}

interface TaskFormState {
  title: string;
  description: string;
  teamId: string;
  assigneeId: string;
  deadline: string;
  status: TaskStatus;
  priority: Priority;
  progress: number;
}

function getDefaultDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function createInitialForm(task: Task | null): TaskFormState {
  if (task) {
    return {
      title: task.title,
      description: task.description,
      teamId: task.teamId,
      assigneeId: task.assigneeId,
      deadline: task.deadline,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
    };
  }

  return {
    title: '',
    description: '',
    teamId: 'team-01',
    assigneeId: '',
    deadline: getDefaultDeadline(),
    status: 'todo',
    priority: 'medium',
    progress: 0,
  };
}

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function TaskFormContent({ task, onClose, onSubmit }: Omit<TaskFormModalProps, 'isOpen'>) {
  const [form, setForm] = useState<TaskFormState>(() => createInitialForm(task));
  const filteredUsers = form.teamId ? USERS.filter((user) => user.teamId === form.teamId) : USERS;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setForm((current) => {
      const next = {
        ...current,
        [name]: name === 'progress' ? clampProgress(Number(value)) : value,
      };

      if (name === 'teamId') {
        const stillValid = USERS.some(
          (user) => user.id === current.assigneeId && user.teamId === value,
        );
        if (!stillValid) next.assigneeId = '';
      }

      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.teamId || !form.assigneeId || !form.deadline) {
      window.alert('Vui lòng nhập đầy đủ tên chuyên đề, tổ phụ trách, cán bộ phụ trách chính và thời hạn.');
      return;
    }

    const progress = clampProgress(form.progress);
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      progress,
      participants: task?.participants ?? [
        {
          userId: form.assigneeId,
          assigned: 100,
          completed: progress,
          progress,
          deadline: form.deadline,
        },
      ],
    };

    if (task) onSubmit({ ...task, ...payload });
    else onSubmit(payload);

    onClose();
  };

  return (
    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-900">
          {task ? 'Sửa chuyên đề nghiệp vụ' : 'Tạo chuyên đề nghiệp vụ mới'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Đóng
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-semibold text-slate-700">
            Tên chuyên đề nghiệp vụ
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ví dụ: Kiểm tra HKD, Rà soát TMĐT..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-semibold text-slate-700">
            Nội dung nghiệp vụ / Mục tiêu
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="teamId" className="mb-1 block text-sm font-semibold text-slate-700">
              Tổ quản lý phụ trách
            </label>
            <select
              id="teamId"
              name="teamId"
              value={form.teamId}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            >
              {TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="assigneeId" className="mb-1 block text-sm font-semibold text-slate-700">
              Cán bộ phụ trách chính
            </label>
            <select
              id="assigneeId"
              name="assigneeId"
              value={form.assigneeId}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            >
              <option value="">Chọn cán bộ phụ trách</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="progress" className="text-sm font-semibold text-slate-700">
              Tỷ lệ hoàn thành (%)
            </label>
            <span className="text-sm font-bold text-blue-700">{form.progress}%</span>
          </div>
          <div className="grid grid-cols-[1fr_88px] gap-3">
            <input
              id="progress"
              type="range"
              name="progress"
              min="0"
              max="100"
              step="5"
              value={form.progress}
              onChange={handleChange}
              className="w-full accent-blue-700"
            />
            <input
              type="number"
              name="progress"
              min="0"
              max="100"
              value={form.progress}
              onChange={handleChange}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="deadline" className="mb-1 block text-sm font-semibold text-slate-700">
              Thời hạn chuyên đề
            </label>
            <input
              id="deadline"
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-semibold text-slate-700">
              Độ ưu tiên chuyên đề
            </label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            {task ? 'Cập nhật' : 'Tạo chuyên đề'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TaskFormModal({ isOpen, task, onClose, onSubmit }: TaskFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <TaskFormContent
        key={task?.id ?? 'new-task'}
        task={task}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </div>
  );
}
