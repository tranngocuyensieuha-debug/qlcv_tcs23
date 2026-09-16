import { useState } from 'react';
import type { Task } from '../types';
import { exportTaskReport, type ReportExportMode } from '../utils/reportExport';

interface ReportExportPanelProps {
  tasks: Task[];
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="m9 15 3 3 3-3" />
    </svg>
  );
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function getCurrentYear(): string {
  return String(new Date().getFullYear());
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportExportPanel({ tasks }: ReportExportPanelProps) {
  const [mode, setMode] = useState<ReportExportMode>('range');
  const [fromDate, setFromDate] = useState(getToday());
  const [toDate, setToDate] = useState(getToday());
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [message, setMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage('');

    try {
      const count = await exportTaskReport(tasks, { mode, fromDate, toDate, month, year });
      setMessage(`${count} dòng`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Lỗi xuất báo cáo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <ExportIcon />
          </span>
          <h2 className="text-base font-bold text-slate-950">Xuất báo cáo</h2>
        </div>
        {message && <span className="text-xs font-bold text-slate-500">{message}</span>}
      </div>

      <div className="space-y-4 p-5">
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          {[
            { value: 'range', label: 'Ngày' },
            { value: 'month', label: 'Tháng' },
            { value: 'year', label: 'Năm' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value as ReportExportMode)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                mode === item.value
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title={`Xuất theo ${item.label.toLowerCase()}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === 'range' && (
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              title="Từ ngày"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              title="Đến ngày"
            />
          </div>
        )}

        {mode === 'month' && (
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            title="Chọn tháng"
          />
        )}

        {mode === 'year' && (
          <input
            type="number"
            min="2020"
            max="2100"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
            title="Chọn năm"
          />
        )}

        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={isExporting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          title="Xuất báo cáo Excel"
        >
          <ExportIcon />
          {isExporting ? 'Đang xuất' : 'Excel'}
        </button>
      </div>
    </section>
  );
}
