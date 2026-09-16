import { useCallback, useEffect, useState } from 'react';
import { TEAMS, USERS } from '../data/seed';
import { loadTasks, resetData, saveTasks } from '../utils/storage';
import type { Task, TaskImportRow, TaskParticipant, TaskStatus } from '../types';

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeParticipant(participant: TaskParticipant): TaskParticipant {
  const assigned = Math.max(0, Number(participant.assigned));
  const completed = Math.min(Math.max(0, Number(participant.completed)), assigned || Number(participant.completed));
  const progress = assigned > 0 ? clampProgress((completed / assigned) * 100) : 0;
  return { ...participant, assigned, completed, progress };
}

function averageProgress(participants: TaskParticipant[]): number {
  if (participants.length === 0) return 0;
  const total = participants.reduce((sum, participant) => sum + participant.progress, 0);
  return clampProgress(total / participants.length);
}

function getTaskDeadline(participants: TaskParticipant[], fallback: string): string {
  if (participants.length === 0) return fallback;
  return participants.reduce(
    (latest, participant) => (participant.deadline > latest ? participant.deadline : latest),
    participants[0].deadline,
  );
}

function rebuildTaskProgress(task: Task, participants: TaskParticipant[]): Task {
  const normalized = participants.map(normalizeParticipant);
  const allParticipantsDone =
    normalized.length > 0 && normalized.every((participant) => participant.progress >= 100);

  return {
    ...task,
    participants: normalized,
    progress: averageProgress(normalized),
    deadline: getTaskDeadline(normalized, task.deadline),
    status: allParticipantsDone ? 'done' : task.status,
  };
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function findImportUser(officerName: string) {
  const normalized = normalizeText(officerName);
  return USERS.find((user) => normalizeText(user.name) === normalized);
}

function findImportTeam(teamName: string | undefined, userTeamId: string) {
  if (!teamName) return userTeamId;
  const normalized = normalizeText(teamName);
  return TEAMS.find((team) => normalizeText(team.name) === normalized)?.id ?? userTeamId;
}

function progressForStatus(status: TaskStatus, currentProgress: number): number {
  if (status === 'done') return 100;
  if (status === 'review') return Math.max(currentProgress, 80);
  if (status === 'in_progress') return Math.max(currentProgress, 25);
  return Math.min(currentProgress, 20);
}

function applyStatusProgress(task: Task, status: TaskStatus): Task {
  const participants = task.participants.map((participant) => {
    const progress = progressForStatus(status, participant.progress);
    const completed = Math.round((participant.assigned * progress) / 100);
    return { ...participant, completed, progress };
  });

  return { ...rebuildTaskProgress(task, participants), status };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const participants =
      task.participants.length > 0
        ? task.participants
        : [
            {
              userId: task.assigneeId,
              assigned: 100,
              completed: task.progress,
              progress: task.progress,
              deadline: task.deadline,
            },
          ];
    const newTask: Task = {
      ...task,
      participants,
      progress: averageProgress(participants),
      id: `task-${Date.now()}-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setTasks((current) => [newTask, ...current]);
  }, []);

  const updateTask = useCallback((updatedTask: Task) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === updatedTask.id ? rebuildTaskProgress(updatedTask, updatedTask.participants) : task,
      ),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  const changeStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? applyStatusProgress(task, status) : task)),
    );
  }, []);

  const moveParticipant = useCallback((sourceTaskId: string, targetTaskId: string, userId: string) => {
    if (sourceTaskId === targetTaskId) return;

    setTasks((current) => {
      const sourceTask = current.find((task) => task.id === sourceTaskId);
      const participant = sourceTask?.participants.find((item) => item.userId === userId);
      if (!sourceTask || !participant) return current;

      return current.map((task) => {
        if (task.id === sourceTaskId) {
          const participants = task.participants.filter((item) => item.userId !== userId);
          return rebuildTaskProgress(task, participants);
        }

        if (task.id === targetTaskId) {
          const hasParticipant = task.participants.some((item) => item.userId === userId);
          const participants = hasParticipant
            ? task.participants.map((item) => (item.userId === userId ? participant : item))
            : [...task.participants, participant];
          return rebuildTaskProgress(task, participants);
        }

        return task;
      });
    });
  }, []);

  const updateParticipantCompleted = useCallback((taskId: string, userId: string, completed: number) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;

        const participants = task.participants.map((participant) =>
          participant.userId === userId ? { ...participant, completed } : participant,
        );
        return rebuildTaskProgress(task, participants);
      }),
    );
  }, []);

  const updateParticipantAssigned = useCallback((taskId: string, userId: string, assigned: number) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;

        const participants = task.participants.map((participant) =>
          participant.userId === userId ? { ...participant, assigned } : participant,
        );
        return rebuildTaskProgress(task, participants);
      }),
    );
  }, []);

  const updateTaskDeadline = useCallback((taskId: string, deadline: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;

        const participants = task.participants.map((participant) => ({
          ...participant,
          deadline,
        }));
        return rebuildTaskProgress({ ...task, deadline }, participants);
      }),
    );
  }, []);

  const updateParticipantDeadline = useCallback((taskId: string, userId: string, deadline: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== taskId) return task;

        const participants = task.participants.map((participant) =>
          participant.userId === userId ? { ...participant, deadline } : participant,
        );
        return rebuildTaskProgress(task, participants);
      }),
    );
  }, []);

  const importTaskRows = useCallback((rows: TaskImportRow[]) => {
    setTasks((current) =>
      current.map((task) => {
        const matchingRows = rows.filter((row) => {
          const user = findImportUser(row.officerName);
          if (!user) return false;

          const teamId = findImportTeam(row.teamName, user.teamId);
          if (teamId !== user.teamId) return false;
          return normalizeText(row.taskTitle) === normalizeText(task.title);
        });

        if (matchingRows.length === 0) return task;

        const participants = task.participants.map((participant) => {
          const row = matchingRows.find((item) => findImportUser(item.officerName)?.id === participant.userId);
          if (!row) return participant;

          return {
            ...participant,
            assigned: row.assigned ?? participant.assigned,
            completed: row.completed ?? participant.completed,
            deadline: row.deadline ?? participant.deadline,
          };
        });
        const importedDeadline = matchingRows.find((row) => row.deadline)?.deadline ?? task.deadline;

        return rebuildTaskProgress({ ...task, deadline: importedDeadline }, participants);
      }),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/local-file-du-lieu', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((rows: TaskImportRow[] | null) => {
        if (!cancelled && Array.isArray(rows) && rows.length > 0) {
          importTaskRows(rows);
        }
      })
      .catch(() => {
        // Local Excel endpoint is optional outside the desktop/dev server.
      });

    return () => {
      cancelled = true;
    };
  }, [importTaskRows]);

  const reset = useCallback(() => {
    setTasks(resetData());
  }, []);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    changeStatus,
    moveParticipant,
    updateParticipantAssigned,
    updateParticipantCompleted,
    updateTaskDeadline,
    updateParticipantDeadline,
    importTaskRows,
    reset,
  };
}
