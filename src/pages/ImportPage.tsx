import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useAppStore } from '../app/useAppStore';
import ConfirmDialog from '../components/ConfirmDialog';
import type { AppDataset } from '../domain/models';
import { importWorkbook, MAX_IMPORT_BYTES, type ImportResult } from '../import/excelAdapter';
import { downloadImportErrors } from '../import/exportErrors';
import { mergeTeamDataset } from '../data/mergeTeamDataset';
import { generateAndDownloadTeamTemplate, generateAndDownloadMasterTemplate } from '../utils/excelTemplates';

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
  const { replaceData, restoreBackup } = useAppStore();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: 'status' | 'alert'; text: string } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [mutating, setMutating] = useState(false);
  const [defaultTeamId, setDefaultTeamId] = useState('HKD1');
  const generationRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; generationRef.current += 1; };
  }, []);

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
        if (mountedRef.current && generation === generationRef.current) setResult(importWorkbook(new ArrayBuffer(MAX_IMPORT_BYTES + 1)));
      } else {
        const parsed = importWorkbook(await readFile(file), { defaultTeamId, currentTeams: data.teams });
        if (mountedRef.current && generation === generationRef.current) setResult(parsed);
      }
    } catch {
      if (mountedRef.current && generation === generationRef.current) setMessage({ kind: 'alert', text: 'Không thể đọc tệp Excel.' });
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
      const replacement = pendingDataset && result?.scope === 'team' && result.teamId ? mergeTeamDataset(data, pendingDataset, result.teamId) : pendingDataset;
      const ok = action === 'replace' && replacement
        ? await replaceData(replacement)
        : action === 'restore'
          ? await restoreBackup()
          : false;
      if (!mountedRef.current || generation !== generationRef.current) return;
      setConfirmation(null);
      if (ok) {
        if (action === 'replace') setResult(null);
        setMessage({ kind: 'status', text: action === 'replace' ? 'Nhập dữ liệu thành công.' : 'Khôi phục dữ liệu thành công.' });
      } else {
        setMessage({ kind: 'alert', text: action === 'replace' ? 'Không thể thay thế dữ liệu.' : 'Không thể khôi phục bản sao lưu.' });
      }
    } catch {
      if (!mountedRef.current || generation !== generationRef.current) return;
      setConfirmation(null);
      setMessage({ kind: 'alert', text: action === 'replace' ? 'Không thể thay thế dữ liệu.' : 'Không thể khôi phục bản sao lưu.' });
    } finally {
      if (mountedRef.current && generation === generationRef.current) setMutating(false);
    }
  }

  return (
    <>
      <h1>Nhập dữ liệu Excel</h1>
      <p className="demo-subtitle">
        Cập nhật dữ liệu nghiệp vụ từ tệp Excel theo mẫu chuẩn.
      </p>
      <div className="demo-filters">
        <select aria-label="Tổ nhập dữ liệu" value={defaultTeamId} onChange={(event) => setDefaultTeamId(event.target.value)}>
          <option value="">Chọn tổ</option>
          {data.teams.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
        <select aria-label="Nhiệm vụ nhập dữ liệu">
          <option value="">Chọn nhiệm vụ</option>
          {data.taskDefinitions.map((x) => (
            <option key={x.id}>{x.name}</option>
          ))}
        </select>
        <select aria-label="Kỳ nhập dữ liệu">
          <option>Tuần</option>
          <option>Tháng</option>
          <option>Quý</option>
          <option>Năm</option>
        </select>
      </div>

      {/* Download Template Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
          📥 Tải file mẫu Excel:
        </span>
        <button
          type="button"
          onClick={() => generateAndDownloadTeamTemplate(defaultTeamId || 'HKD1')}
          style={{
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title={`Tải file Excel mẫu riêng cho ${data.teams.find(t => t.id === defaultTeamId)?.name || defaultTeamId}`}
        >
          ⬇️ Mẫu {data.teams.find(t => t.id === defaultTeamId)?.shortName || defaultTeamId}
        </button>
        <button
          type="button"
          onClick={() => generateAndDownloadMasterTemplate()}
          style={{
            backgroundColor: '#D97706',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          title="Tải file Excel mẫu tổng hợp bao gồm cả 8 tổ"
        >
          ⬇️ Mẫu Tổng Hợp (Cả 8 Tổ)
        </button>
      </div>

      <section className="demo-card demo-import">
        <div className="demo-upload-icon">⇧</div>
        <h2>Chọn tệp dữ liệu</h2>
        <p>
          Tối thiểu: mã tổ, mã nhiệm vụ, mã cán bộ, phải làm, đã làm, hạn và
          trạng thái.
        </p>
        <label className="demo-primary">
          Chọn tệp Excel
          <input type="file" accept=".xlsx,.xls" onChange={(event) => void selectFile(event)} disabled={loading || mutating} />
        </label>
        <p><small>Tối đa {MAX_IMPORT_BYTES / 1024 / 1024} MB.</small></p>
        {loading && <p role="status">Đang phân tích tệp…</p>}
        {message && <p role={message.kind}>{message.text}</p>}
        {result && (
          <section aria-label="Kết quả xem trước">
            <h3>Xem trước dữ liệu</h3>
            <p>{result.validRowCount} dòng hợp lệ · {result.errors.length} lỗi · {result.duplicateCount} dòng trùng</p>
            {result.dataset && (
              <>
                <p>{result.dataset.teams.length} tổ · {result.dataset.officers.length} cán bộ · {result.dataset.taskDefinitions.length} nhiệm vụ · {result.dataset.workItems.length} công việc</p>
                <div className="demo-table-wrap">
                  <table>
                    <thead><tr><th>Mã công việc</th><th>Mã nhiệm vụ</th><th>Mã tổ</th><th>Mã cán bộ</th><th>Phải làm</th><th>Đã làm</th><th>Hạn</th><th>Trạng thái</th></tr></thead>
                    <tbody>{result.dataset.workItems.slice(0, 10).map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.taskDefinitionId}</td><td>{item.teamId}</td><td>{item.officerId}</td><td>{item.assigned}</td><td>{item.completed}</td><td>{item.deadline}</td><td>{item.status}</td></tr>)}</tbody>
                  </table>
                </div>
              </>
            )}
            {result.errors.length > 0 && (
              <>
                {result.errors.length > MAX_VISIBLE_ERRORS && <p>Hiển thị {MAX_VISIBLE_ERRORS}/{result.errors.length} lỗi</p>}
                <div className="demo-table-wrap">
                  <table>
                    <thead><tr><th>Sheet</th><th>Dòng</th><th>Cột</th><th>Giá trị</th><th>Thông báo</th></tr></thead>
                    <tbody>{result.errors.slice(0, MAX_VISIBLE_ERRORS).map((issue, index) => <tr key={`${issue.sheet}-${issue.row}-${issue.column}-${index}`}><td>{issue.sheet}</td><td>{issue.row}</td><td>{issue.column}</td><td>{String(issue.value ?? '')}</td><td>{issue.message}</td></tr>)}</tbody>
                  </table>
                </div>
                <button type="button" onClick={() => downloadImportErrors(result.errors)}>Tải danh sách lỗi</button>
              </>
            )}
            <button type="button" className="demo-primary" disabled={!result.dataset || result.errors.length > 0 || mutating} onClick={() => setConfirmation('replace')}>Xác nhận thay thế dữ liệu</button>
          </section>
        )}
        <button type="button" onClick={() => setConfirmation('restore')} disabled={mutating}>Khôi phục bản sao lưu</button>
        <small>Dữ liệu hiện tại: {data.workItems.length} công việc</small>
      </section>
      {confirmation === 'replace' && <ConfirmDialog title="Xác nhận thay thế dữ liệu" message={result?.scope === 'team' ? `Thao tác này cập nhật dữ liệu tổ ${result.teamId}, giữ nguyên các tổ khác. Hệ thống sẽ tạo bản sao lưu trước khi cập nhật.` : 'Thao tác này sẽ thay thế toàn bộ dữ liệu hiện tại. Hệ thống sẽ tạo bản sao lưu trước khi thay thế.'} confirmLabel={result?.scope === 'team' ? 'Cập nhật dữ liệu tổ' : 'Thay thế toàn bộ dữ liệu'} busy={mutating} onCancel={() => setConfirmation(null)} onConfirm={() => void confirmMutation()} />}
      {confirmation === 'restore' && <ConfirmDialog title="Xác nhận khôi phục dữ liệu" message="Dữ liệu hiện tại sẽ được thay bằng bản sao lưu gần nhất." confirmLabel="Khôi phục bản sao lưu ngay" busy={mutating} onCancel={() => setConfirmation(null)} onConfirm={() => void confirmMutation()} />}
    </>
  );
}
