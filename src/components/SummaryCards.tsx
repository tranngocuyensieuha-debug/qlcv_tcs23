import type { Task } from '../types';
import { countDeadlineWarnings } from '../utils/statistics';

interface SummaryCardsProps {
  tasks: Task[];
}

export default function SummaryCards({ tasks }: SummaryCardsProps) {
  const stats = countDeadlineWarnings(tasks);

  const cards = [
    { label: 'Tổng công việc', value: stats.total, className: 'bg-blue-700 text-white', sub: 'Nhiệm vụ đang quản lý' },
    { label: 'Đang xử lý', value: stats.inProgress, className: 'bg-white text-slate-900', sub: 'Chưa đạt 100%' },
    { label: 'Quá hạn', value: stats.overdue, className: 'bg-white text-red-700', sub: 'Cần theo dõi' },
    { label: 'Hoàn thành', value: stats.done, className: 'bg-white text-emerald-700', sub: 'Đạt tiến độ' },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border border-slate-200 p-4 shadow-sm ${card.className}`}
        >
          <p className="text-sm font-bold opacity-80">{card.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-4xl font-bold leading-none">{card.value}</p>
            <span className="rounded-full bg-slate-100/80 px-2 py-1 text-[11px] font-bold text-slate-500">
              {card.sub}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
