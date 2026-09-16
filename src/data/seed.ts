import type { Priority, Task, TaskParticipant, TaskStatus, Team, User } from '../types';

export const TEAMS: Team[] = [
  { id: 'team-01', name: 'Tổ Quản lý hỗ trợ cá nhân hộ kinh doanh số 1' },
  { id: 'team-02', name: 'Tổ Quản lý hỗ trợ cá nhân hộ kinh doanh số 2' },
];

export const USERS: User[] = [
  { id: 'user-01', name: 'Ngô Mai Trang', role: 'Công chức', teamId: 'team-01' },
  { id: 'user-02', name: 'Công Tiến Tùng', role: 'Công chức', teamId: 'team-01' },
  { id: 'user-03', name: 'Nguyễn Thị Lệ', role: 'Công chức', teamId: 'team-01' },
  { id: 'user-04', name: 'Nguyễn Văn Tuấn', role: 'Công chức', teamId: 'team-01' },
  { id: 'user-05', name: 'Nguyễn Tùng Dương', role: 'Công chức', teamId: 'team-01' },
  { id: 'user-06', name: 'Nguyễn Thị Hương Hà', role: 'Công chức', teamId: 'team-01' },
  { id: 'user-07', name: 'Nguyễn Đức Mạnh', role: 'Công chức', teamId: 'team-02' },
  { id: 'user-08', name: 'Nguyễn Thị Thu Trà', role: 'Công chức', teamId: 'team-02' },
  { id: 'user-09', name: 'Nguyễn Thị Thùy Liên', role: 'Công chức', teamId: 'team-02' },
  { id: 'user-10', name: 'Hoàng Thế Vương', role: 'Công chức', teamId: 'team-02' },
  { id: 'user-11', name: 'Nguyễn Thị Thu Hoài', role: 'Công chức', teamId: 'team-02' },
  { id: 'user-12', name: 'Trần Thanh Thư', role: 'Công chức', teamId: 'team-02' },
  { id: 'user-13', name: 'Nguyễn Viết Toàn', role: 'Công chức', teamId: 'team-02' },
  { id: 'user-14', name: 'Nguyễn Kim Ngân', role: 'Công chức', teamId: 'team-02' },
];

const TASK_TEMPLATES: {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assignedBase: number;
  completedBase: number;
  deadlineOffset: number;
}[] = [
  {
    title: 'Số thu',
    description: 'Theo dõi dự toán pháp lệnh, ước thực hiện, số thực hiện tháng/quý/lũy kế và tỷ lệ so sánh số thu.',
    priority: 'high',
    status: 'in_progress',
    assignedBase: 1200,
    completedBase: 720,
    deadlineOffset: 3,
  },
  {
    title: 'Kê khai thuế',
    description: 'Theo dõi số hộ kinh doanh đã khai thuế, số phải kê khai theo danh bạ chuẩn hóa và tỷ lệ đã kê khai.',
    priority: 'high',
    status: 'in_progress',
    assignedBase: 180,
    completedBase: 112,
    deadlineOffset: 5,
  },
  {
    title: 'Quản lý rủi ro HKD',
    description: 'Theo dõi số hộ kinh doanh giao kiểm tra rủi ro, số đã thực hiện và tỷ lệ triển khai.',
    priority: 'high',
    status: 'todo',
    assignedBase: 42,
    completedBase: 16,
    deadlineOffset: 7,
  },
  {
    title: 'Kiểm tra HKD',
    description: 'Theo dõi số hộ giao kiểm tra, số đã thực hiện, số thuế tăng thu và tỷ lệ triển khai kiểm tra.',
    priority: 'urgent',
    status: 'in_progress',
    assignedBase: 30,
    completedBase: 18,
    deadlineOffset: 4,
  },
  {
    title: 'Rà soát TMĐT',
    description: 'Theo dõi số hộ giao rà soát thương mại điện tử, số đã thực hiện, số thuế tăng thu và tỷ lệ triển khai.',
    priority: 'medium',
    status: 'todo',
    assignedBase: 36,
    completedBase: 14,
    deadlineOffset: 9,
  },
  {
    title: 'Hỗ trợ hóa đơn điện tử',
    description: 'Theo dõi số hộ giao triển khai, số đã hướng dẫn sử dụng hóa đơn điện tử và tỷ lệ triển khai.',
    priority: 'medium',
    status: 'in_progress',
    assignedBase: 70,
    completedBase: 48,
    deadlineOffset: 6,
  },
  {
    title: 'Chuyển đổi lên doanh nghiệp',
    description: 'Theo dõi số hộ giao triển khai, số đã chuyển đổi lên doanh nghiệp và tỷ lệ chuyển đổi.',
    priority: 'medium',
    status: 'todo',
    assignedBase: 12,
    completedBase: 4,
    deadlineOffset: 12,
  },
  {
    title: 'Nộp thuế điện tử',
    description: 'Theo dõi số thuế nộp bằng phương thức điện tử, số thu ngân sách và tỷ lệ nộp thuế điện tử.',
    priority: 'high',
    status: 'in_progress',
    assignedBase: 900,
    completedBase: 560,
    deadlineOffset: 8,
  },
  {
    title: 'Nợ thuế',
    description: 'Theo dõi tổng nợ, nợ có khả năng thu, nợ khó thu của tháng báo cáo và tháng trước.',
    priority: 'urgent',
    status: 'in_progress',
    assignedBase: 95,
    completedBase: 41,
    deadlineOffset: -1,
  },
  {
    title: 'Cưỡng chế xuất nhập cảnh',
    description: 'Theo dõi số người nộp thuế phải cưỡng chế, đã cưỡng chế, số thu nợ và tỷ lệ đã thực hiện.',
    priority: 'urgent',
    status: 'todo',
    assignedBase: 18,
    completedBase: 6,
    deadlineOffset: 10,
  },
  {
    title: 'Cưỡng chế tài khoản hóa đơn',
    description: 'Theo dõi tổng số phải rà soát, đã nộp tiền, đã cưỡng chế, còn phải cưỡng chế và tỷ lệ cưỡng chế.',
    priority: 'high',
    status: 'todo',
    assignedBase: 24,
    completedBase: 9,
    deadlineOffset: 11,
  },
  {
    title: 'Hệ số K',
    description: 'Theo dõi số dòng phải xử lý, số dòng đã xử lý và tỷ lệ xử lý hệ số K.',
    priority: 'medium',
    status: 'review',
    assignedBase: 150,
    completedBase: 128,
    deadlineOffset: 2,
  },
  {
    title: 'Thủ tục hành chính',
    description: 'Theo dõi tổng số hồ sơ, số đã giải quyết và tỷ lệ giải quyết thủ tục hành chính.',
    priority: 'medium',
    status: 'in_progress',
    assignedBase: 60,
    completedBase: 45,
    deadlineOffset: 5,
  },
];

function daysFromNow(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

const EXCEL_PARTICIPANT_DATA: Record<string, { assigned: number; completed: number; deadline: string }> = {
  'user-01': { assigned: 15, completed: 12, deadline: '2026-10-06' },
  'user-02': { assigned: 16, completed: 11, deadline: '2026-10-06' },
  'user-03': { assigned: 18, completed: 9, deadline: '2026-10-06' },
  'user-04': { assigned: 20, completed: 7, deadline: '2026-10-06' },
  'user-05': { assigned: 19, completed: 8, deadline: '2026-10-06' },
  'user-06': { assigned: 17, completed: 10, deadline: '2026-10-06' },
  'user-07': { assigned: 21, completed: 6, deadline: '2026-10-06' },
  'user-08': { assigned: 23, completed: 4, deadline: '2026-10-06' },
  'user-09': { assigned: 22, completed: 5, deadline: '2026-10-06' },
  'user-10': { assigned: 25, completed: 2, deadline: '2026-10-06' },
  'user-11': { assigned: 24, completed: 3, deadline: '2026-10-06' },
  'user-12': { assigned: 26, completed: 1, deadline: '2026-10-06' },
  'user-13': { assigned: 27, completed: 4, deadline: '2026-10-06' },
  'user-14': { assigned: 28, completed: 6, deadline: '2026-10-06' },
};

function buildParticipants(users: User[]): TaskParticipant[] {
  return users.map((user) => {
    const data = EXCEL_PARTICIPANT_DATA[user.id] ?? {
      assigned: 0,
      completed: 0,
      deadline: '2026-10-06',
    };
    const assigned = data.assigned;
    const completed = Math.min(data.completed, assigned);
    const progress = clampProgress((completed / assigned) * 100);

    return {
      userId: user.id,
      assigned,
      completed,
      progress,
      deadline: data.deadline,
    };
  });
}

function averageProgress(participants: TaskParticipant[]): number {
  const total = participants.reduce((sum, participant) => sum + participant.progress, 0);
  return Math.round(total / participants.length);
}

export const SEED_TASKS: Task[] = TASK_TEMPLATES.map((template, taskIndex) => {
  const participants = buildParticipants(USERS);
  const progress = averageProgress(participants);
  const deadline = '2026-10-06';

  return {
    id: `task-${String(taskIndex + 1).padStart(2, '0')}`,
    title: template.title,
    description: template.description,
    teamId: 'all-teams',
    assigneeId: USERS[0].id,
    participants,
    deadline,
    status: progress >= 100 ? 'done' : template.status,
    priority: template.priority,
    progress,
    createdAt: daysFromNow(-taskIndex - 1),
  };
});
