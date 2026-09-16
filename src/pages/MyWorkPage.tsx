import { useMemo, useState } from "react";
import type { AppDataset, WorkItem } from "../domain/models";
import { buildDashboardMetrics } from "../domain/metrics";
import { useAppStore } from "../app/useAppStore";
import KpiCard from "../components/KpiCard";
import EmptyState from "../components/EmptyState";
import WorkItemEditModal from "../components/WorkItemEditModal";
import { Filters, WorkTable } from "./pageUtils";
import { fmt } from "./format";
import { DetailModal } from "./DashboardPage";

export default function MyWorkPage({ data }: { data: AppDataset }) {
  const { account, saveWorkItem, deleteWorkItem } = useAppStore();
  const [o, setO] = useState(""),
    [task, setTask] = useState(""),
    [status, setStatus] = useState("");
  const [detail, setDetail] = useState<WorkItem[] | null>(null);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const items = useMemo(
    () =>
      data.workItems.filter(
        (x) =>
          (!o || x.officerId === o) &&
          (!task || x.taskDefinitionId === task) &&
          (!status || x.status === status),
      ),
    [data, o, task, status],
  );
  const m = buildDashboardMetrics(items),
    remaining = items.filter((x) => x.completed < x.assigned);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Công việc cá nhân</h1>
          <p className="demo-subtitle">Theo dõi và cập nhật trực tiếp khối lượng công việc theo cán bộ.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          style={{
            backgroundColor: '#16A34A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)',
            marginTop: '4px'
          }}
        >
          <span>➕</span>
          <span>Nhập kết quả / Thêm công việc mới</span>
        </button>
      </div>
      <Filters>
        <select
          aria-label="Cán bộ"
          value={o}
          onChange={(e) => setO(e.target.value)}
        >
          <option value="">Tất cả cán bộ</option>
          {data.officers.map((x) => (
            <option value={x.id} key={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Nhiệm vụ"
          value={task}
          onChange={(e) => setTask(e.target.value)}
        >
          <option value="">Tất cả nhiệm vụ</option>
          {data.taskDefinitions.map((x) => (
            <option value={x.id} key={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="todo">Chưa thực hiện</option>
          <option value="in_progress">Đang thực hiện</option>
          <option value="waiting">Chờ xử lý</option>
          <option value="done">Hoàn thành</option>
        </select>
      </Filters>
      <div className="demo-kpis">
        <KpiCard label="Phải làm" value={fmt(m.assigned)} />
        <KpiCard label="Đã làm" value={fmt(m.completed)} />
        <KpiCard
          label="Còn lại"
          value={fmt(m.remaining)}
          onClick={() => setDetail(remaining)}
        />
        <KpiCard label="Tỷ lệ" value={`${m.rate}%`} />
      </div>
      <section className="demo-card">
        {items.length ? (
          <WorkTable
            data={data}
            items={items}
            onDetail={(x) => setDetail([x])}
            onEdit={(item) => {
              setEditingItem(item);
              setIsModalOpen(true);
            }}
            onDelete={async (item) => {
              await deleteWorkItem(item.id);
            }}
          />
        ) : (
          <EmptyState message={data.workItems.length ? undefined : "Chưa có dữ liệu nghiệp vụ được nhập cho tổ này"} />
        )}
      </section>
      {detail && (
        <DetailModal
          data={data}
          items={detail}
          onClose={() => setDetail(null)}
          onEdit={(item) => {
            setEditingItem(item);
            setIsModalOpen(true);
          }}
          onDelete={async (item) => {
            await deleteWorkItem(item.id);
            setDetail(null);
          }}
        />
      )}
      <WorkItemEditModal
        isOpen={isModalOpen}
        item={editingItem}
        data={data}
        currentAccount={account}
        onClose={() => {
          setIsModalOpen(false);
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
