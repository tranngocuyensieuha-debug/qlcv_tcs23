import { useMemo, useState } from "react";
import type { AppDataset, WorkItem } from "../domain/models";
import { buildAlerts } from "../domain/metrics";
import KpiCard from "../components/KpiCard";
import EmptyState from "../components/EmptyState";
import { Filters, WorkTable } from "./pageUtils";
import { DetailModal } from "./DashboardPage";
import { useAppStore } from "../app/useAppStore";
import WorkItemEditModal from "../components/WorkItemEditModal";

export default function AlertsPage({
  data,
  now = new Date(),
}: {
  data: AppDataset;
  now?: Date;
}) {
  const { account, saveWorkItem, deleteWorkItem } = useAppStore();
  const [type, setType] = useState("");
  const [detail, setDetail] = useState<WorkItem[] | null>(null);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const all = useMemo(() => buildAlerts(data.workItems, now), [data.workItems, now]);
  const alerts = useMemo(
    () => all.filter((x) => !type || x.type === type),
    [all, type],
  );
  const ids = new Set(alerts.map((x) => x.itemId));
  const items = data.workItems.filter((x) => ids.has(x.id));
  const alertMap = useMemo(() => new Map(all.map((a) => [a.itemId, a])), [all]);
  return (
    <>
      <h1>Cảnh báo tiến độ</h1>
      <Filters>
        <select
          aria-label="Loại cảnh báo"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Tất cả cảnh báo</option>
          <option value="overdue">Quá hạn</option>
          <option value="due-soon">Sắp đến hạn</option>
          <option value="missing-update">Thiếu cập nhật</option>
          <option value="invalid-deadline">Hạn không hợp lệ</option>
          <option value="invalid-update">Ngày cập nhật không hợp lệ</option>
        </select>
      </Filters>
      <div className="demo-kpis">
        <KpiCard
          label="Quá hạn"
          value={all.filter((x) => x.type === "overdue").length}
        />
        <KpiCard
          label="Sắp đến hạn"
          value={all.filter((x) => x.type === "due-soon").length}
        />
        <KpiCard
          label="Thiếu cập nhật"
          value={all.filter((x) => x.type === "missing-update").length}
        />
        <KpiCard label="Tổng cảnh báo" value={all.length} />
      </div>
      <section className="demo-card">
        {items.length ? (
          <WorkTable
            data={data}
            items={items}
            onDetail={(x) => setDetail([x])}
            alertMap={alertMap}
            onEdit={(item) => {
              setEditingItem(item);
              setIsEditModalOpen(true);
            }}
            onDelete={async (item) => {
              await deleteWorkItem(item.id);
            }}
          />
        ) : (
          <EmptyState />
        )}
      </section>
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
