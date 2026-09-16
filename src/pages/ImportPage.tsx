import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useAppStore } from '../app/useAppStore';
import ConfirmDialog from '../components/ConfirmDialog';
import type { AppDataset } from '../domain/models';
import { importWorkbook, MAX_IMPORT_BYTES, type ImportResult } from '../import/excelAdapter';
import { downloadImportErrors } from '../import/exportErrors';
import { mergeTeamDataset } from '../data/mergeTeamDataset';
import { mergeThematicDataset } from '../data/mergeThematicDataset';
import {
  THEMATIC_TEMPLATE_LIST,
  TEAM_TEMPLATE_LIST,
  generateAndDownloadThematicTemplate,
  generateAndDownloadTeamTemplate,
  generateAndDownloadMasterTemplate,
} from '../utils/excelTemplates';

type ImportMode = 'theme' | 'team' | 'master';
type Confirmation = 'replace' | 'restore' | null;
const MAX_VISIBLE_ERRORS = 100;

function readFile(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export default function ImportPage({ data }: { data: AppDataset }) {
  const { replaceData, restoreBackup, logAction, account } = useAppStore();
  const [importMode, setImportMode] = useState<ImportMode>('theme');
  const [selectedThemeId, setSelectedThemeId] = useState('CD_THU');
  const [selectedTeamId, setSelectedTeamId] = useState('HKD1');

  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [mutating, setMutating] = useState(false);

  const generationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
    };
  }, []);

  // Current active theme or team info
  const currentTheme = THEMATIC_TEMPLATE_LIST.find((t) => t.id === selectedThemeId) || THEMATIC_TEMPLATE_LIST[0];
  const currentTeam = TEAM_TEMPLATE_LIST.find((t) => t.code === selectedTeamId) || TEAM_TEMPLATE_LIST[0];

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const generation = ++generationRef.current;
    setLoading(true);
    setMessage(null);
    setResult(null);
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        if (mountedRef.current && generation === generationRef.current) {
          setResult(importWorkbook(new ArrayBuffer(MAX_IMPORT_BYTES + 1)));
        }
      } else {
        const buffer = await readFile(file);
        const parsed = importWorkbook(buffer, {
          mode: importMode === 'master' ? 'full' : importMode,
          themeId: importMode === 'theme' ? selectedThemeId : undefined,
          defaultTeamId: importMode === 'team' ? selectedTeamId : 'HKD1',
          currentTeams: data.teams,
          currentOfficers: data.officers,
          currentTaskDefinitions: data.taskDefinitions,
        });
        if (mountedRef.current && generation === generationRef.current) setResult(parsed);
      }
    } catch {
      if (mountedRef.current && generation === generationRef.current) {
        setMessage({ kind: 'alert', text: 'Không thể đọc tệp Excel.' });
      }
    } finally {
      if (mountedRef.current && generation === generationRef.current) setLoading(false);
    }
  }

  async function confirmMutation() {
    if (!confirmation || mutating) return;
    const generation = generationRef.current;
    const pendingDataset = result?.dataset;
    setMutating(true);
    setMessage(null);
    const action = confirmation;

    try {
      let replacement: AppDataset | undefined = pendingDataset;
      let logTarget = 'Toàn hệ thống';
      let logDetail = 'Thay thế toàn bộ dữ liệu';

      if (pendingDataset && action === 'replace') {
        if (result?.scope === 'thematic') {
          const themeTaskIds = currentTheme ? currentTheme.taskIds : [];
          replacement = mergeThematicDataset(data, pendingDataset, themeTaskIds);
          logTarget = `Chuyên đề: ${currentTheme.name}`;
          logDetail = `Nạp dữ liệu Chuyên đề "${currentTheme.name}" thành công (${result.validRowCount} dòng). Cập nhật số liệu các tổ tham gia, giữ nguyên 100% nhiệm vụ khác.`;
        } else if (result?.scope === 'team' && result.teamId) {
          replacement = mergeTeamDataset(data, pendingDataset, result.teamId);
          const teamName = data.teams.find((t) => t.id === result.teamId)?.name || result.teamId;
          logTarget = `Tổ: ${teamName}`;
          logDetail = `Nạp dữ liệu Tổ "${teamName}" thành công (${result.validRowCount} dòng). Giữ nguyên dữ liệu của 7 tổ còn lại.`;
        } else {
          logTarget = 'Toàn cơ quan (Tổng hợp)';
          logDetail = `Nạp dữ liệu Mẫu Tổng Hợp thành công (${result?.validRowCount || 0} dòng, 8 tổ).`;
        }
      }

      const ok =
        action === 'replace' && replacement
          ? await replaceData(replacement)
          : action === 'restore'
            ? await restoreBackup()
            : false;

      if (!mountedRef.current || generation !== generationRef.current) return;
      setConfirmation(null);

      if (ok) {
        if (action === 'replace') {
          setResult(null);
          logAction({
            userId: account?.id || 'lead',
            userName: account?.label || 'Chỉ huy đơn vị',
            userRole: account?.role || 'lead',
            teamId: result?.scope === 'team' ? result.teamId : undefined,
            teamName: result?.scope === 'team' ? data.teams.find((t) => t.id === result?.teamId)?.name : undefined,
            action: 'IMPORT_EXCEL',
            target: logTarget,
            details: logDetail,
          });
        }
        setMessage({
          kind: 'status',
          text: action === 'replace' ? 'Nhập dữ liệu thành công.' : 'Khôi phục dữ liệu thành công.',
        });
      } else {
        setMessage({
          kind: 'alert',
          text: action === 'replace' ? 'Không thể thay thế dữ liệu.' : 'Không thể khôi phục bản sao lưu.',
        });
      }
    } catch {
      if (!mountedRef.current || generation !== generationRef.current) return;
      setConfirmation(null);
      setMessage({
        kind: 'alert',
        text: action === 'replace' ? 'Không thể thay thế dữ liệu.' : 'Không thể khôi phục bản sao lưu.',
      });
    } finally {
      if (mountedRef.current && generation === generationRef.current) setMutating(false);
    }
  }

  const getConfirmMessage = () => {
    if (result?.scope === 'thematic') {
      return `Thao tác này sẽ nạp kết quả chuyên đề "${currentTheme.name}", cập nhật số liệu cho các cán bộ và tổ liên quan, và GIỮ NGUYÊN 100% tất cả các nhiệm vụ khác của các tổ. Hệ thống sẽ tự động tạo bản sao lưu trước khi cập nhật.`;
    }
    if (result?.scope === 'team') {
      const teamName = data.teams.find((t) => t.id === result.teamId)?.name || result.teamId;
      return `Thao tác này cập nhật dữ liệu của ${teamName}, GIỮ NGUYÊN dữ liệu của 7 tổ còn lại. Hệ thống sẽ tự động tạo bản sao lưu trước khi cập nhật.`;
    }
    return 'Thao tác này sẽ thay thế toàn bộ dữ liệu hiện tại của cả 8 tổ. Hệ thống sẽ tự động tạo bản sao lưu trước khi thay thế.';
  };

  const getConfirmLabel = () => {
    if (result?.scope === 'thematic') return `Cập nhật kết quả ${currentTheme.shortName}`;
    if (result?.scope === 'team') return 'Cập nhật dữ liệu tổ';
    return 'Thay thế toàn bộ dữ liệu';
  };

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>
          Nhập Dữ Liệu Excel
        </h1>
        <p className="demo-subtitle" style={{ margin: 0, color: '#64748B', fontSize: '0.95rem' }}>
          Hệ thống hỗ trợ 2 phương án đẩy dữ liệu linh hoạt: theo <strong>Chuyên đề chung</strong> (đa tổ) và theo <strong>Tổ chuyên trách</strong> (nhiệm vụ riêng).
        </p>
      </div>

      {/* DUAL-TRACK MODE SELECTOR TABS */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '20px',
          padding: '6px',
          backgroundColor: '#F1F5F9',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setImportMode('theme');
            setResult(null);
            setMessage(null);
          }}
          style={{
            flex: '1 1 200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: importMode === 'theme' ? 800 : 600,
            color: importMode === 'theme' ? '#1E293B' : '#64748B',
            backgroundColor: importMode === 'theme' ? '#FFFFFF' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            boxShadow: importMode === 'theme' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>📊</span>
          <span>Đẩy theo Chuyên đề chung</span>
          <span
            style={{
              fontSize: '0.72rem',
              backgroundColor: importMode === 'theme' ? '#DCFCE7' : '#E2E8F0',
              color: importMode === 'theme' ? '#166534' : '#64748B',
              padding: '2px 6px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            5 Chuyên đề
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setImportMode('team');
            setResult(null);
            setMessage(null);
          }}
          style={{
            flex: '1 1 200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: importMode === 'team' ? 800 : 600,
            color: importMode === 'team' ? '#1E293B' : '#64748B',
            backgroundColor: importMode === 'team' ? '#FFFFFF' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            boxShadow: importMode === 'team' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🏢</span>
          <span>Đẩy theo Tổ chuyên trách</span>
          <span
            style={{
              fontSize: '0.72rem',
              backgroundColor: importMode === 'team' ? '#DBEAFE' : '#E2E8F0',
              color: importMode === 'team' ? '#1E40AF' : '#64748B',
              padding: '2px 6px',
              borderRadius: '999px',
              fontWeight: 700,
            }}
          >
            8 Tổ
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setImportMode('master');
            setResult(null);
            setMessage(null);
          }}
          style={{
            flex: '1 1 180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '0.9rem',
            fontWeight: importMode === 'master' ? 800 : 600,
            color: importMode === 'master' ? '#1E293B' : '#64748B',
            backgroundColor: importMode === 'master' ? '#FFFFFF' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            boxShadow: importMode === 'master' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>📁</span>
          <span>Mẫu Tổng Hợp Toàn Đơn Vị</span>
        </button>
      </div>

      {/* MODE CONFIGURATION CARD */}
      {importMode === 'theme' && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="theme-select" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                Chọn Chuyên đề cần đẩy:
              </label>
              <select
                id="theme-select"
                value={selectedThemeId}
                onChange={(e) => {
                  setSelectedThemeId(e.target.value);
                  setResult(null);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #94A3B8',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {THEMATIC_TEMPLATE_LIST.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.icon} {theme.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => generateAndDownloadThematicTemplate(selectedThemeId)}
              style={{
                backgroundColor: currentTheme.badgeColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              title="Tải file Excel mẫu chuyên đề được điền sẵn danh sách cán bộ các tổ"
            >
              <span>⬇️</span>
              <span>Tải file mẫu: {currentTheme.shortName} (.xlsx)</span>
            </button>
          </div>

          {/* Theme details info banner */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              padding: '12px 16px',
              fontSize: '0.85rem',
              color: '#334155',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Nguồn dữ liệu ngành: </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{currentTheme.sourceApp}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Nhiệm vụ thuộc chuyên đề: </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{currentTheme.taskIds.length} nhiệm vụ</span>
              </div>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Các tổ tham gia: </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                  {currentTheme.applicableTeamIds.map((tid) => data.teams.find((t) => t.id === tid)?.shortName || tid).join(', ')}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.83rem' }}>
              💡 <em>{currentTheme.description}</em> Khi nạp file, hệ thống sẽ tự động đối soát cán bộ theo từng tổ và cập nhật đúng các nhiệm vụ chuyên đề, <strong>giữ nguyên 100% các nhiệm vụ khác ngoài chuyên đề</strong>.
            </p>
          </div>
        </div>
      )}

      {importMode === 'team' && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="team-select" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                Chọn Tổ chuyên trách cần đẩy:
              </label>
              <select
                id="team-select"
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setResult(null);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #94A3B8',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {data.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => generateAndDownloadTeamTemplate(selectedTeamId)}
              style={{
                backgroundColor: currentTeam.badgeColor,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              title={`Tải file Excel mẫu riêng cho ${currentTeam.name}`}
            >
              <span>⬇️</span>
              <span>Tải file mẫu: {currentTeam.shortName} (.xlsx)</span>
            </button>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              padding: '12px 16px',
              fontSize: '0.85rem',
              color: '#334155',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Tổ trưởng / Phụ trách: </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{currentTeam.leaderName}</span>
              </div>
              <div>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Quy mô: </span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                  {currentTeam.staffCount} cán bộ · {currentTeam.taskCount} nhiệm vụ chuyên môn
                </span>
              </div>
            </div>
            <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '0.83rem' }}>
              💡 File mẫu chỉ bao gồm các nhiệm vụ và cán bộ thuộc tổ {currentTeam.shortName}. Khi nạp file này, hệ thống sẽ chỉ cập nhật số liệu của tổ {currentTeam.shortName} và <strong>giữ nguyên 100% dữ liệu của 7 tổ còn lại</strong>.
            </p>
          </div>
        </div>
      )}

      {importMode === 'master' && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: '#92400E' }}>
                📁 Mẫu Tổng Hợp Toàn Đơn Vị (Tất cả 8 Tổ)
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#B45309' }}>
                Bao gồm 8 sheet dữ liệu riêng cho 8 tổ, đầy đủ 86 nhiệm vụ và danh sách 54 cán bộ toàn TCS23.
              </p>
            </div>
            <button
              type="button"
              onClick={() => generateAndDownloadMasterTemplate()}
              style={{
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
              title="Tải file Excel mẫu tổng hợp toàn bộ 8 tổ"
            >
              <span>⬇️</span>
              <span>Tải Mẫu Tổng Hợp Toàn Đơn Vị (.xlsx)</span>
            </button>
          </div>
        </div>
      )}

      {/* UPLOAD AND PREVIEW CARD */}
      <section className="demo-card demo-import">
        <div className="demo-upload-icon">⇧</div>
        <h2>
          {importMode === 'theme'
            ? `Tải lên file dữ liệu: ${currentTheme.name}`
            : importMode === 'team'
              ? `Tải lên file dữ liệu: ${currentTeam.name}`
              : 'Tải lên file Tổng hợp toàn đơn vị'}
        </h2>
        <p>
          {importMode === 'theme'
            ? 'Hệ thống tự động phân loại cán bộ về đúng từng tổ theo danh sách chuyên đề.'
            : importMode === 'team'
              ? `File sẽ được nạp và đối chiếu cho tổ ${currentTeam.shortName}, không ảnh hưởng tổ khác.`
              : 'File gồm 8 sheet của 8 tổ hoặc cấu trúc 4 bảng dữ liệu chuẩn.'}
        </p>

        <label className="demo-primary" style={{ cursor: 'pointer', display: 'inline-block', marginTop: '8px' }}>
          <span>📂 Chọn tệp Excel (.xlsx, .xls)</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => void selectFile(event)}
            disabled={loading || mutating}
          />
        </label>
        <p><small>Kích thước tệp tối đa {MAX_IMPORT_BYTES / 1024 / 1024} MB.</small></p>

        {loading && (
          <p role="status" style={{ color: '#2563EB', fontWeight: 700 }}>
            ⏳ Đang phân tích tệp Excel…
          </p>
        )}

        {message && (
          <div
            role={message.kind}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: message.kind === 'status' ? '#DCFCE7' : '#FEE2E2',
              color: message.kind === 'status' ? '#166534' : '#991B1B',
              fontWeight: 600,
              fontSize: '0.88rem',
              margin: '12px 0',
            }}
          >
            {message.kind === 'status' ? '✅ ' : '⚠️ '}
            {message.text}
          </div>
        )}

        {result && (
          <section aria-label="Kết quả xem trước" style={{ marginTop: '16px', textAlign: 'left' }}>
            <div
              style={{
                backgroundColor: result.errors.length > 0 ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${result.errors.length > 0 ? '#FECACA' : '#BBF7D0'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '14px',
              }}
            >
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: result.errors.length > 0 ? '#991B1B' : '#166534' }}>
                {result.errors.length > 0 ? 'Phát hiện lỗi trong tệp' : 'Xem trước dữ liệu hợp lệ'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: result.errors.length > 0 ? '#7F1D1D' : '#14532D' }}>
                {result.validRowCount} dòng hợp lệ · {result.errors.length} lỗi · {result.duplicateCount} dòng trùng · Phạm vi: <strong>{result.scope === 'thematic' ? 'Chuyên đề chung (Đa tổ)' : result.scope === 'team' ? `Tổ ${result.teamId}` : 'Toàn cơ quan'}</strong>
              </p>
            </div>

            {result.dataset && (
              <>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}>
                  Chi tiết nạp: {result.dataset.teams.length} tổ · {result.dataset.officers.length} cán bộ · {result.dataset.taskDefinitions.length} nhiệm vụ · {result.dataset.workItems.length} công việc
                </p>
                <div className="demo-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Mã nhiệm vụ</th>
                        <th>Mã tổ</th>
                        <th>Mã cán bộ</th>
                        <th>Phải làm</th>
                        <th>Đã làm</th>
                        <th>Hạn</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.dataset.workItems.slice(0, 10).map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: 600 }}>{item.taskDefinitionId}</td>
                          <td>
                            <span style={{ backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                              {item.teamId}
                            </span>
                          </td>
                          <td>{item.officerId}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.assigned}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>{item.completed}</td>
                          <td>{item.deadline}</td>
                          <td>
                            <span style={{ fontSize: '0.78rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#1E40AF' }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.dataset.workItems.length > 10 && (
                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                    <em>Hiển thị 10/{result.dataset.workItems.length} dòng công việc đầu tiên.</em>
                  </p>
                )}
              </>
            )}

            {result.errors.length > 0 && (
              <>
                {result.errors.length > MAX_VISIBLE_ERRORS && (
                  <p style={{ color: '#DC2626', fontSize: '0.85rem' }}>
                    Hiển thị {MAX_VISIBLE_ERRORS}/{result.errors.length} lỗi
                  </p>
                )}
                <div className="demo-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Sheet</th>
                        <th>Dòng</th>
                        <th>Cột</th>
                        <th>Giá trị</th>
                        <th>Thông báo lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.slice(0, MAX_VISIBLE_ERRORS).map((issue, index) => (
                        <tr key={`${issue.sheet}-${issue.row}-${issue.column}-${index}`}>
                          <td>{issue.sheet}</td>
                          <td>{issue.row}</td>
                          <td>{issue.column}</td>
                          <td>{String(issue.value ?? '')}</td>
                          <td style={{ color: '#DC2626', fontWeight: 600 }}>{issue.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={() => downloadImportErrors(result.errors)}
                  style={{
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                >
                  📥 Tải danh sách lỗi (.xlsx)
                </button>
              </>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="demo-primary"
                disabled={!result.dataset || result.errors.length > 0 || mutating}
                onClick={() => setConfirmation('replace')}
                style={{
                  backgroundColor: '#059669',
                  cursor: result.dataset && result.errors.length === 0 && !mutating ? 'pointer' : 'not-allowed',
                }}
              >
                {mutating ? 'Đang cập nhật…' : `Xác nhận cập nhật (${result.validRowCount} dòng)`}
              </button>
              <button
                type="button"
                onClick={() => setResult(null)}
                disabled={mutating}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy xem trước
              </button>
            </div>
          </section>
        )}

        <div style={{ marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setConfirmation('restore')}
            disabled={mutating}
            style={{
              backgroundColor: '#F8FAFC',
              color: '#64748B',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            ↺ Khôi phục bản sao lưu trước đó
          </button>
          <small style={{ color: '#64748B' }}>Dữ liệu hệ thống hiện có: <strong>{data.workItems.length}</strong> công việc</small>
        </div>
      </section>

      {/* CONFIRMATION DIALOGS */}
      {confirmation === 'replace' && (
        <ConfirmDialog
          title="Xác nhận cập nhật dữ liệu"
          message={getConfirmMessage()}
          confirmLabel={getConfirmLabel()}
          busy={mutating}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void confirmMutation()}
        />
      )}

      {confirmation === 'restore' && (
        <ConfirmDialog
          title="Xác nhận khôi phục dữ liệu"
          message="Dữ liệu hiện tại sẽ được thay bằng bản sao lưu gần nhất. Tất cả các thay đổi sau thời điểm sao lưu sẽ bị hủy."
          confirmLabel="Khôi phục bản sao lưu ngay"
          busy={mutating}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void confirmMutation()}
        />
      )}
    </>
  );
}
