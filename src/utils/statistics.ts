import type { Task, TaskStatus, Team, User } from '../types';
import { USERS } from '../data/seed';
import { getDeadlineStatus } from './deadline';

export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };

  for (const task of tasks) {
    counts[task.status] += 1;
  }

  return counts;
}

export function countByAssignee(tasks: Task[], users: User[]): { name: string; count: number }[] {
  return users.map((user) => ({
    name: user.name,
    count: tasks.filter((task) =>
      task.participants?.some((participant) => participant.userId === user.id),
    ).length,
  }));
}

export function sumAssignedByAssignee(tasks: Task[], users: User[]): { name: string; assigned: number }[] {
  return users.map((user) => ({
    name: user.name,
    assigned: tasks.reduce((sum, task) => {
      const participant = task.participants?.find((item) => item.userId === user.id);
      return sum + (participant?.assigned ?? 0);
    }, 0),
  }));
}

export function countByTeam(tasks: Task[], teams: Team[]): { name: string; count: number }[] {
  return teams.map((team) => ({
    name: team.name,
    count: tasks.filter((task) =>
      task.participants.some((participant) =>
        usersBelongToTeam(participant.userId, team.id),
      ),
    ).length,
  }));
}

function usersBelongToTeam(userId: string, teamId: string): boolean {
  return USERS.some((user) => user.id === userId && user.teamId === teamId);
}

export function countDeadlineWarnings(tasks: Task[]) {
  return tasks.reduce(
    (stats, task) => {
      stats.total += 1;

      if (task.status === 'done') {
        stats.done += 1;
        return stats;
      }

      stats.inProgress += 1;
      const deadlineStatus = getDeadlineStatus(task.deadline);
      if (deadlineStatus === 'overdue') stats.overdue += 1;
      if (deadlineStatus === 'warning') stats.warning += 1;

      return stats;
    },
    { total: 0, inProgress: 0, overdue: 0, warning: 0, done: 0 },
  );
}
