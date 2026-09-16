import { useMemo, useState } from "react";
import KpiCard from "../components/KpiCard";
import EmptyState from "../components/EmptyState";
import type { AppDataset, WorkItem } from "../domain/models";
import {
  buildAlerts,
  buildDashboardMetrics,
  groupByTeam,
  type WorkAlert,
} from "../domain/metrics";
import { fmt } from "./format";
import { WorkTable, getAlertBadge } from "./pageUtils";
import AccessibleModal from "../components/AccessibleModal";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppStore } from "../app/useAppStore";
import WorkItemEditModal from "../components/WorkItemEditModal";

export function DetailModal({
  data,
  items,
  onClose,
  alertMap,
  onEdit,
  onDelete,
}: {
  data: AppDataset;
  items: WorkItem[];
  onClose: () => void;
  alertMap?: Map<string, WorkAlert>;
  onEdit?: (item: WorkItem) => void;
  onDelete?: (item: WorkItem) => void;
}) {
  return (
    <AccessibleModal title="Chi tiết công việc còn lại" onClose={onClose}>
        {items.length ? (
          <WorkTable
            data={data}
            items={items}
            alertMap={alertMap}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : (
          <EmptyState />
        )}
    </AccessibleModal>
  );
}
export default function DashboardPage({ data, now = new Date() }: { data: AppDataset; now?: Date }) {
  const { account, saveWorkItem, deleteWorkItem } = useAppStore();
  const [period, setPeriod] = useState("");
  const [team, setTeam] = useState("");
  const [detail, setDetail] = useState<WorkItem[] | null>(null);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const tasks = useMemo(() => new Map(data.taskDefinitions.map((x) => [x.id, x])), [data.taskDefinitions]);
  const officers = useMemo(() => new Map(data.officers.map((x) => [x.id, x])), [data.officers]);
  const teams = useMemo(() => new Map(data.teams.map((x) => [x.id, x])), [data.teams]);
  const workItemsMap = useMemo(() => new Map(data.workItems.map((x) => [x.id, x])), [data.workItems]);
  const items = data.workItems.filter(
    (x) =>
      (!period || tasks.get(x.taskDefinitionId)?.reportPeriod === period) &&
      (!team || x.teamId === team),
  );
  const m = buildDashboardMetrics(items);
  const grouped = groupByTeam({
    ...data,
    teams: team ? data.teams.filter((x) => x.id === team) : data.teams,
    workItems: items,
  });
  const alerts = buildAlerts(items, now);
  const remaining = items.filter((x) => x.completed < x.assigned);
  const alertMap = useMemo(() => new Map(alerts.map((a) => [a.itemId, a])), [alerts]);
  return (
    <>
      <div className="demo-page-head">
        <div>
          <h1>Tổng quan công việc</h1>
          <p>Theo dõi kết quả dữ liệu thực tế.</p>
        </div>
        <div className="demo-filters">
          <select
            aria-label="Kỳ báo cáo"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="">Tất cả kỳ</option>
            {[...new Set(data.taskDefinitions.map((x) => x.reportPeriod))].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
          <select
            aria-label="Tổ dashboard"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
          >
            <option value="">Tất cả tổ</option>
            {data.teams.map((x) => (
              <option value={x.id} key={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="demo-kpis">
        <KpiCard
          label="Phải thực hiện"
          value={fmt(m.assigned)}
          testId="assigned-kpi"
        />
        <KpiCard
          label="Đã thực hiện"
          value={fmt(m.completed)}
          tone="green"
          testId="completed-kpi"
        />
        <KpiCard
          label="Còn lại"
          value={fmt(m.remaining)}
          tone="amber"
          testId="remaining-kpi"
          onClick={() => setDetail(remaining)}
        />
        <KpiCard label="Tỷ lệ hoàn thành" value={`${m.rate}%`} tone="red" />
      </div>
      {!items.length && <EmptyState message="Chưa có dữ liệu nghiệp vụ được nhập cho tổ này" />}
      <div className="demo-grid">
        <section className="demo-card">
          <h2>Tiến độ theo tổ</h2>
          <div role="img" aria-label="Biểu đồ tổng hợp theo tổ" style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={grouped}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shortName" />
                <YAxis tickFormatter={(val) => fmt(val)} />
                <Tooltip formatter={(value, name) => [fmt(Number(value)), name]} />
                <Legend />
                <Bar dataKey="assigned" name="Phải thực hiện" fill="#2563eb" />
                <Bar dataKey="completed" name="Đã thực hiện" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {grouped.map((g) => (
            <div data-testid="team-row" className="progress-row" key={g.id}>
              <span>{g.name}</span>
              <div>
                <i style={{ width: `${g.rate}%` }} />
              </div>
              <b>{g.rate}%</b>
            </div>
          ))}
        </section>
        <section className="demo-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span> Cảnh báo ưu tiên
              {alerts.length > 0 && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid #FECACA'
                }}>
                  {alerts.length} việc cần chú ý
                </span>
              )}
            </h2>
          </div>
          {alerts.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '430px', overflowY: 'auto', paddingRight: '4px' }}>
              {alerts.map((a) => {
                const item = workItemsMap.get(a.itemId);
                const task = item ? tasks.get(item.taskDefinitionId) : undefined;
                const officer = item ? officers.get(item.officerId) : undefined;
                const teamObj = item ? teams.get(item.teamId) : undefined;
                const badge = getAlertBadge(a);

                const taskName = task?.name || item?.taskDefinitionId || a.itemId;
                const officerName = officer?.name || (item?.officerId ? `CB: ${item.officerId}` : 'Chưa phân công');
                const teamName = teamObj?.shortName || teamObj?.name || item?.teamId || '';
                const deadlineFormatted = item?.deadline ? item.deadline.split('-').reverse().join('/') : '';

                return (
                  <button
                    aria-label={`${a.itemId} ${a.type}`}
                    className="alert-row"
                    key={`${a.itemId}-${a.type}`}
                    onClick={() =>
                      setDetail(items.filter((x) => x.id === a.itemId))
                    }
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: '5px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${badge.border}`,
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = badge.bg)}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                  >
                    {/* Header: Task name & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', lineHeight: 1.35 }}>
                        {taskName}
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        color: badge.color,
                        backgroundColor: badge.bg,
                        border: `1px solid ${badge.border}`,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        <span>{badge.icon}</span>
                        <span>{badge.tag}</span>
                      </span>
                    </div>

                    {/* Officer & Team & Deadline info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#475569', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#1E293B', fontWeight: 600 }}>
                        <span style={{ color: '#2563EB' }}>👤</span>
                        <span>Cán bộ: <b>{officerName}</b></span>
                        {teamName && (
                          <span style={{ color: '#64748B', fontWeight: 500 }}>
                            ({teamName})
                          </span>
                        )}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {deadlineFormatted && (
                          <span style={{ color: '#64748B' }}>
                            Hạn: <b style={{ color: a.type === 'overdue' ? '#DC2626' : '#334155' }}>{deadlineFormatted}</b>
                          </span>
                        )}
                        <code style={{ fontSize: '0.7rem', color: '#94A3B8', backgroundColor: '#F1F5F9', padding: '1px 5px', borderRadius: '4px' }}>
                          {a.itemId}
                        </code>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Không có công việc nào bị cảnh báo" />
          )}
        </section>
      </div>
      {detail && (
        <DetailModal
          data={data}
          items={detail}
          onClose={() => setDetail(null)}
          alertMap={alertMap}
          onEdit={(item) => {
            setEditingItem(item);
            setIsEditModalOpen(true);
          }}
          onDelete={async (item) => {
            await deleteWorkItem(item.id);
            setDetail(null);
          }}
        />
      )}
      <WorkItemEditModal
        isOpen={isEditModalOpen}
        item={editingItem}
        data={data}
        currentAccount={account}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={async (item) => {
          await saveWorkItem(item);
          setDetail((prev) => (prev ? prev.map((p) => (p.id === item.id ? item : p)) : null));
        }}
        onDelete={async (id) => {
          await deleteWorkItem(id);
          setDetail((prev) => (prev ? prev.filter((p) => p.id !== id) : null));
        }}
      />
    </>
  );
}
