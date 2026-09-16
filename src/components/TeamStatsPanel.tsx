import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { TEAMS, USERS } from '../data/seed';
import type { Task } from '../types';
import { getDeadlineStatus } from '../utils/deadline';

interface TeamStatsPanelProps {
  tasks: Task[];
}

const TEAM_COLORS = ['#2563eb', '#059669'];

function getTeamTaskProgress(task: Task, userIds: string[]): number {
  const participants = task.participants.filter((participant) => userIds.includes(participant.userId));
  if (participants.length === 0) return 0;
  const total = participants.reduce((sum, participant) => sum + participant.progress, 0);
  return Math.round(total / participants.length);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function TeamStatsPanel({ tasks }: TeamStatsPanelProps) {
  const stats = TEAMS.map((team) => {
    const teamUsers = USERS.filter((user) => user.teamId === team.id);
    const userIds = teamUsers.map((user) => user.id);
    const teamProgressByTask = tasks.map((task) => getTeamTaskProgress(task, userIds));
    const done = teamProgressByTask.filter((progress) => progress >= 100).length;
    const overdue = tasks.filter(
      (task, index) => teamProgressByTask[index] < 100 && getDeadlineStatus(task.deadline) === 'overdue',
    ).length;
    const assigned = tasks.reduce(
      (teamTotal, task) =>
        teamTotal +
        task.participants.reduce(
          (taskTotal, participant) =>
            userIds.includes(participant.userId) ? taskTotal + participant.assigned : taskTotal,
          0,
        ),
      0,
    );
    const completed = tasks.reduce(
      (teamTotal, task) =>
        teamTotal +
        task.participants.reduce(
          (taskTotal, participant) =>
            userIds.includes(participant.userId) ? taskTotal + participant.completed : taskTotal,
          0,
        ),
      0,
    );

    return {
      team,
      taskCount: tasks.length,
      userCount: teamUsers.length,
      done,
      overdue,
      assigned,
      completed,
      progress: average(teamProgressByTask),
    };
  });
  const totalAssigned = stats.reduce((sum, item) => sum + item.assigned, 0);

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">Đánh giá hiệu quả theo Tổ công tác</h2>
          <p className="text-xs text-slate-500">So sánh tiến độ thực hiện chỉ tiêu giữa các Tổ hỗ trợ.</p>
        </div>
        <span className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {TEAMS.length} tổ công tác
        </span>
      </div>

      <div className="grid min-w-0 gap-4">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">So sánh 2 tổ</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Tỷ trọng tổng phải thực hiện</p>
            </div>
            <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200">
              {totalAssigned.toLocaleString('vi-VN')}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={stats}
                dataKey="assigned"
                nameKey="team.name"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={86}
                paddingAngle={3}
                label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
              >
                {stats.map((item, index) => (
                  <Cell key={item.team.id} fill={TEAM_COLORS[index % TEAM_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {stats.map((item, index) => (
              <div key={item.team.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs">
                <span className="flex min-w-0 items-center gap-2 font-bold text-slate-700">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: TEAM_COLORS[index % TEAM_COLORS.length] }} />
                  <span className="truncate">{item.team.name}</span>
                </span>
                <span className="shrink-0 font-extrabold text-slate-950">{item.assigned.toLocaleString('vi-VN')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 gap-4">
          {stats.map((item) => (
            <div key={item.team.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{item.team.name}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {item.userCount} cán bộ phụ trách {item.taskCount} chuyên đề
                  </p>
                </div>
                <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-extrabold text-blue-700">
                  {item.progress}% đạt
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-white p-2 border border-slate-100">
                  <p className="font-extrabold text-slate-900">{item.taskCount}</p>
                  <p className="text-[10px] font-bold text-slate-500">Chuyên đề</p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-slate-100">
                  <p className="font-extrabold text-blue-700">{item.assigned.toLocaleString('vi-VN')}</p>
                  <p className="text-[10px] font-bold text-slate-500">Phải làm</p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-slate-100">
                  <p className="font-extrabold text-emerald-700">{item.completed.toLocaleString('vi-VN')}</p>
                  <p className="text-[10px] font-bold text-slate-500">Đã làm</p>
                </div>
                <div className="rounded-lg bg-white p-2 border border-slate-100">
                  <p className="font-extrabold text-red-600">{item.overdue}</p>
                  <p className="text-[10px] font-bold text-slate-500">Trễ hạn</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
