export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type DeadlineStatus = 'overdue' | 'warning' | 'normal';

export interface User {
  id: string;
  name: string;
  role: 'Tổ trưởng' | 'Tổ phó' | 'Công chức';
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface TaskParticipant {
  userId: string;
  assigned: number;
  completed: number;
  progress: number;
  deadline: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string;
  teamId: string;
  deadline: string;
  createdAt: string;
  progress: number;
  participants: TaskParticipant[];
}

export interface RankingCriterion {
  criterion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  name: string;
  maxScore: number;
  score: number;
  rate: number;
}

export interface OfficerRanking {
  userId: string;
  userName: string;
  totalScore: number;
  rank: number;
  criteria: RankingCriterion[];
}

export interface TaskImportRow {
  taskTitle: string;
  officerName: string;
  teamName?: string;
  taxpayerCode?: string;
  citizenId?: string;
  assigned?: number;
  completed?: number;
  deadline?: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Tổng phải thực hiện',
  in_progress: 'Đã thực hiện',
  review: 'Chờ xác nhận',
  done: 'Hoàn thành',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn',
};

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];
