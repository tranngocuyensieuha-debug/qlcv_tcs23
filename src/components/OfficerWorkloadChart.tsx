import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts';
import type { Task } from '../types';
import { USERS } from '../data/seed';

interface OfficerWorkloadChartProps {
  tasks: Task[];
}

export default function OfficerWorkloadChart({ tasks }: OfficerWorkloadChartProps) {
  const data = USERS.map((user) => {
    const assigned = tasks.reduce((total, task) => {
      const participant = task.participants.find((item) => item.userId === user.id);
      const taskAssigned = task.participants.reduce((sum, item) => sum + item.assigned, 0);
      return total + (taskAssigned > 0 ? ((participant?.assigned ?? 0) / taskAssigned) * 100 : 0);
    }, 0);
    const completed = tasks.reduce((total, task) => {
      const participant = task.participants.find((item) => item.userId === user.id);
      const taskAssigned = task.participants.reduce((sum, item) => sum + item.assigned, 0);
      return total + (taskAssigned > 0 ? ((participant?.completed ?? 0) / taskAssigned) * 100 : 0);
    }, 0);

    return {
      name: user.name,
      assigned: Number(assigned.toFixed(2)),
      completed: Number(completed.toFixed(2)),
      remaining: Number(Math.max(0, assigned - completed).toFixed(2)),
    };
  });

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            So sánh khối lượng công việc thực tế theo cán bộ
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            So sánh tổng chỉ tiêu hộ kinh doanh được giao (Cần thực hiện) và kết quả đã thực hiện của từng công chức.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <div className="min-w-[1000px] pr-2">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 24, right: 10, left: -10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, name) => [
                  Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 }),
                  name === 'completed' ? 'Đã rà soát' : 'Còn lại trong tổng phải thực hiện',
                ]}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, fontWeight: 700, fill: '#334155', paddingBottom: 16 }}
              />
              <Bar dataKey="completed" name="Đã rà soát" stackId="assigned" fill="#10b981" barSize={24}>
                <LabelList
                  dataKey="completed"
                  position="insideTop"
                  style={{ fill: '#ffffff', fontSize: 9, fontWeight: 700 }}
                  formatter={(v: unknown) => (Number(v) > 0 ? Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '')}
                />
              </Bar>
              <Bar
                dataKey="remaining"
                name="Tổng phải thực hiện"
                stackId="assigned"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={24}
              >
                <LabelList
                  dataKey="assigned"
                  position="top"
                  style={{ fill: '#1e293b', fontSize: 9, fontWeight: 700 }}
                  formatter={(v: unknown) => (Number(v) > 0 ? Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '')}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </article>
  );
}
