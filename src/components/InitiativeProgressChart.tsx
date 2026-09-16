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

interface InitiativeProgressChartProps {
  tasks: Task[];
}

export default function InitiativeProgressChart({ tasks }: InitiativeProgressChartProps) {
  const data = tasks.map((task) => {
    const rawAssigned = task.participants.reduce((sum, p) => sum + p.assigned, 0);
    const rawCompleted = task.participants.reduce((sum, p) => sum + p.completed, 0);
    const assigned = rawAssigned > 0 ? 100 : 0;
    const completed = rawAssigned > 0 ? Math.min(100, (rawCompleted / rawAssigned) * 100) : 0;

    return {
      name: task.title,
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
            Tiến độ thực hiện theo Chuyên đề nghiệp vụ toàn tổ
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            So sánh tổng chỉ tiêu hộ kinh doanh được phân công giao và kết quả đã hoàn thành theo từng chuyên đề.
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
                tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }}
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
              <Bar dataKey="completed" name="Đã rà soát" stackId="assigned" fill="#059669" barSize={22}>
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
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                barSize={22}
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
