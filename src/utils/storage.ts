import { SEED_TASKS } from '../data/seed';
import type { Task, TaskParticipant } from '../types';

const STORAGE_KEY = 'tax-office-task-board-hkd-file-du-lieu-2026-10-06-v1';

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeParticipants(task: Task): TaskParticipant[] {
  if (Array.isArray(task.participants) && task.participants.length > 0) {
    return task.participants.map((participant) => {
      const assigned = Math.max(0, Number(participant.assigned ?? 0));
      const completed = Math.max(0, Number(participant.completed ?? participant.progress ?? 0));
      const progress = assigned > 0 ? clampProgress((completed / assigned) * 100) : 0;

      return {
        ...participant,
        assigned,
        completed: Math.min(completed, assigned || completed),
        progress,
        deadline: participant.deadline || task.deadline,
      };
    });
  }

  return [
    {
      userId: task.assigneeId,
      assigned: 100,
      completed: clampProgress(task.progress),
      progress: clampProgress(task.progress),
      deadline: task.deadline,
    },
  ];
}

function normalizeTask(task: Task): Task {
  const participants = normalizeParticipants(task);
  const averageProgress =
    participants.length > 0
      ? Math.round(participants.reduce((sum, participant) => sum + participant.progress, 0) / participants.length)
      : 0;
  const allDone = participants.length > 0 && participants.every((participant) => participant.progress >= 100);

  return {
    ...task,
    participants,
    progress: averageProgress,
    status: allDone ? 'done' : task.status,
  };
}

export function loadTasks(): Task[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    saveTasks(SEED_TASKS);
    return [...SEED_TASKS];
  }

  try {
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed.map(normalizeTask) : [...SEED_TASKS];
  } catch {
    saveTasks(SEED_TASKS);
    return [...SEED_TASKS];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.map(normalizeTask)));
}

export function resetData(): Task[] {
  saveTasks(SEED_TASKS);
  return [...SEED_TASKS];
}
