import { useCallback, useEffect, useState } from 'react';
import type { TaskImportRow } from '../types';
import { parseExcelFile, parseExcelFromUrl } from '../utils/importData';
import {
  TEAM_TEMPLATE_LIST,
  THEMATIC_TEMPLATE_LIST,
  generateAndDownloadThematicTemplate,
  generateAndDownloadTeamTemplate,
  generateAndDownloadMasterTemplate
} from '../utils/excelTemplates';

interface DataImportPanelProps {
  onImportRows: (rows: TaskImportRow[]) => void;
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m4 16 5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V5" />
      <path d="m7 10 5-5 5 5" />
      <path d="M5 19h14" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.5 18H18a4 4 0 0 0 .4-8 6 6 0 0 0-11.2-2A5 5 0 0 0 7 18h1" />
      <path d="M12 13v7" />
      <path d="m9 17 3 3 3-3" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export default function DataImportPanel({ onImportRows }: DataImportPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [modalTab, setModalTab] = useState<'theme' | 'team'>('theme');

  const applyRows = useCallback((rows: TaskImportRow[], source = 'dữ liệu') => {
    if (rows.length === 0) {
      setMessage('Không có dòng hợp lệ.');
      return;
    }

    onImportRows(rows);
    setMessage(`${source}: ${rows.length} dòng`);
  }, [onImportRows]);

  const handleLocalFile = useCallback(async (silent = false) => {
    setIsLoading(true);
    if (!silent) setMessage('');

    try {
      const response = await fetch('/api/local-file-du-lieu', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không đọc được file cục bộ.');
      applyRows(data as TaskImportRow[], 'file du lieu.xlsx');
    } catch (error) {
      if (!silent) setMessage(error instanceof Error ? error.message : 'Không đọc được file cục bộ.');
    } finally {
      setIsLoading(false);
    }
  }, [applyRows]);

  useEffect(() => {
    const firstLoad = window.setTimeout(() => void handleLocalFile(true), 0);
    const timer = window.setInterval(() => void handleLocalFile(true), 30000);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(timer);
    };
  }, [handleLocalFile]);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setMessage('');
    try {
      applyRows(await parseExcelFile(file), 'Excel');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được Excel.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriveImport = async () => {
    if (!driveUrl.trim()) {
      setMessage('Chưa có link Drive.');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      applyRows(await parseExcelFromUrl(driveUrl), 'Drive');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không tải được Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
      className={`rounded-2xl border bg-white/95 p-5 shadow-sm transition ${
        isDragging ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            <TrendIcon />
            Báo cáo tiến độ
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Tổng Hợp</h2>
          {message && <p className="mt-1 truncate text-xs font-bold text-slate-500">{message}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-600 shadow-sm ring-1 ring-amber-100 transition hover:bg-amber-100 cursor-pointer"
            title="Tải file Excel mẫu theo từng tổ và từng nhiệm vụ"
            aria-label="Tải file Excel mẫu theo tổ"
          >
            <TemplateIcon />
          </button>

          <button
            type="button"
            onClick={() => void handleLocalFile()}
            disabled={isLoading}
            className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            title="Cập nhật từ D:\\quản lý công việc\\file du lieu.xlsx"
            aria-label="Cập nhật từ file cục bộ"
          >
            <FolderIcon />
          </button>

          <label
            className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-100"
            title="Import dữ liệu từ file Excel"
            aria-label="Import dữ liệu từ file Excel"
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.currentTarget.value = '';
              }}
            />
            <UploadIcon />
          </label>

          <button
            type="button"
            onClick={() => void handleDriveImport()}
            disabled={isLoading}
            className="grid h-12 w-12 place-items-center rounded-full bg-violet-50 text-violet-600 shadow-sm ring-1 ring-violet-100 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            title="Cập nhật từ Google Drive"
            aria-label="Cập nhật từ Google Drive"
          >
            <CloudIcon />
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={driveUrl}
          onChange={(event) => setDriveUrl(event.target.value)}
          placeholder="Google Drive / Sheets"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={() => void handleDriveImport()}
          disabled={isLoading}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Drive
        </button>
      </div>

      {/* MODAL: TẢI FILE EXCEL MẪU CHO TỪNG TỔ */}
      {showTemplateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📥</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Tải File Excel Mẫu Đẩy Dữ Liệu</h3>
                  <p className="text-xs text-slate-500 font-medium">Được tùy biến chuẩn hóa theo từng tổ và từng nhiệm vụ chuyên trách</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Master Template Button */}
            <div className="mt-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <span>📑</span>
                    <span>File Mẫu Tổng Hợp Toàn Đơn Vị (Tất cả 8 Tổ)</span>
                  </div>
                  <p className="mt-1 text-xs text-amber-800">
                    Bao gồm 8 sheet riêng biệt cho 8 tổ, đầy đủ 86 nhiệm vụ và danh sách 54 cán bộ toàn TCS23.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    generateAndDownloadMasterTemplate();
                    setShowTemplateModal(false);
                  }}
                  className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-700 cursor-pointer"
                >
                  Tải Mẫu Tổng Hợp (.xlsx)
                </button>
              </div>
            </div>

            {/* Tabs selection in modal */}
            <div className="mt-5 flex gap-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setModalTab('theme')}
                className={`flex-1 rounded-lg py-2 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'theme' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>📊</span>
                <span>Mẫu Chuyên Đề Chung (5 Chuyên đề đa tổ)</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('team')}
                className={`flex-1 rounded-lg py-2 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  modalTab === 'team' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🏢</span>
                <span>Mẫu Theo Tổ Chuyên Trách (8 Tổ riêng biệt)</span>
              </button>
            </div>

            {/* TAB 1: 5 THEMATIC TEMPLATES */}
            {modalTab === 'theme' && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 font-medium">
                  File mẫu chuyên đề bao gồm các nhiệm vụ chung của ngành (nguồn TMS, QLN, HĐĐT...) được điền sẵn danh sách cán bộ của tất cả các tổ liên quan:
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {THEMATIC_TEMPLATE_LIST.map((theme) => (
                    <div
                      key={theme.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-emerald-400 hover:bg-emerald-50/40"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{theme.icon}</span>
                          <span className="text-sm font-bold text-slate-900">{theme.shortName}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-600 font-medium" title={theme.name}>
                          {theme.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-semibold text-emerald-700">
                            📌 {theme.taskIds.length} nhiệm vụ
                          </span>
                          <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-semibold text-blue-700">
                            🏢 {theme.applicableTeamIds.length} tổ áp dụng
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 italic truncate" title={theme.sourceApp}>
                          Nguồn: <strong>{theme.sourceApp}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          generateAndDownloadThematicTemplate(theme.id);
                          setShowTemplateModal(false);
                        }}
                        className="mt-3 w-full rounded-lg py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: theme.badgeColor }}
                      >
                        <span>⬇️</span>
                        <span>Tải mẫu CĐ {theme.shortName}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: 8 TEAM TEMPLATES */}
            {modalTab === 'team' && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 font-medium">
                  File mẫu riêng cho từng tổ chỉ bao gồm các nhiệm vụ và cán bộ thuộc tổ đó:
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {TEAM_TEMPLATE_LIST.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-blue-400 hover:bg-blue-50/40"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{team.icon}</span>
                          <span className="text-sm font-bold text-slate-900">{team.shortName}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-slate-600 font-medium" title={team.name}>
                          {team.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-semibold">
                            📌 {team.taskCount} nhiệm vụ
                          </span>
                          <span className="rounded bg-white px-1.5 py-0.5 border border-slate-200 font-semibold">
                            👤 {team.staffCount} cán bộ
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 italic">
                          Phụ trách: <strong>{team.leaderName}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          generateAndDownloadTeamTemplate(team.code);
                          setShowTemplateModal(false);
                        }}
                        className="mt-3 w-full rounded-lg py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 cursor-pointer flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: team.badgeColor }}
                      >
                        <span>⬇️</span>
                        <span>Tải file mẫu {team.shortName}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
              <span>💡 Sau khi nhập số liệu, chỉ cần kéo thả file vào ô bên ngoài để cập nhật.</span>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="rounded-lg border border-slate-300 px-3 py-1 font-bold text-slate-700 hover:bg-slate-100"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
