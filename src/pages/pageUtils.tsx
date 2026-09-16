import type { AppDataset, WorkItem } from "../domain/models";
import type { WorkAlert } from "../domain/metrics";
import StatusBadge from "../components/StatusBadge";
import { fmt } from "./format";

export function Filters({ children }: { children: React.ReactNode }) {
  return <div className="demo-filters">{children}</div>;
}

export function getAlertBadge(alert: WorkAlert): {
  tag: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
} {
  switch (alert.type) {
    case 'overdue': {
      const days = alert.days !== undefined && alert.days < 0 ? Math.abs(alert.days) : 0;
      return {
        tag: days > 0 ? `Quá hạn ${days} ngày` : 'Đã quá hạn',
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA',
        icon: '⚠️',
      };
    }
    case 'due-soon': {
      const days = alert.days ?? 0;
      return {
        tag: days === 0 ? 'Hôm nay đến hạn' : `Sắp đến hạn (${days} ngày)`,
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A',
        icon: '⏳',
      };
    }
    case 'missing-update': {
      const days = alert.days ?? 0;
      return {
        tag: days > 0 ? `Chậm cập nhật (${days} ngày)` : 'Chưa cập nhật tiến độ',
        color: '#EA580C',
        bg: '#FFF7ED',
        border: '#FED7AA',
        icon: '⏱️',
      };
    }
    case 'invalid-deadline':
      return {
        tag: 'Hạn không hợp lệ',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        icon: '❓',
      };
    case 'invalid-update':
      return {
        tag: 'Ngày cập nhật lỗi',
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        icon: '❓',
      };
    default:
      return {
        tag: alert.type,
        color: '#475569',
        bg: '#F8FAFC',
        border: '#E2E8F0',
        icon: 'ℹ️',
      };
  }
}

export function WorkTable({
  data,
  items,
  onDetail,
  alertMap,
  onEdit,
  onDelete,
}: {
  data: AppDataset;
  items: WorkItem[];
  onDetail?: (item: WorkItem) => void;
  alertMap?: Map<string, WorkAlert>;
  onEdit?: (item: WorkItem) => void;
  onDelete?: (item: WorkItem) => void;
}) {
  const officers = new Map(data.officers.map((x) => [x.id, x]));
  const tasks = new Map(data.taskDefinitions.map((x) => [x.id, x]));
  return (
    <div className="demo-table-wrap">
      <table>
        <thead>
          <tr>
            {alertMap && <th>Mức cảnh báo</th>}
            <th>Mã</th>
            <th>Nhiệm vụ</th>
            <th>Cán bộ</th>
            <th>Phải làm</th>
            <th>Đã làm</th>
            <th>Còn lại</th>
            <th>Hạn</th>
            <th>Trạng thái</th>
            {(onEdit || onDelete) && <th style={{ textAlign: 'center' }}>Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const alert = alertMap?.get(item.id);
            const badge = alert ? getAlertBadge(alert) : null;
            return (
              <tr key={item.id}>
                {alertMap && (
                  <td>
                    {badge ? (
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
                        whiteSpace: 'nowrap'
                      }}>
                        <span>{badge.icon}</span>
                        <span>{badge.tag}</span>
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>-</span>
                    )}
                  </td>
                )}
                <td>
                  {onDetail ? (
                    <button className="demo-link" onClick={() => onDetail(item)}>
                      {item.id}
                    </button>
                  ) : (
                    item.id
                  )}
                </td>
                <td>{tasks.get(item.taskDefinitionId)?.name}</td>
                <td>{officers.get(item.officerId)?.name}</td>
                <td>{fmt(item.assigned)}</td>
                <td>{fmt(item.completed)}</td>
                <td>{fmt(Math.max(0, item.assigned - item.completed))}</td>
                <td>{item.deadline}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                {(onEdit || onDelete) && (
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #93C5FD',
                            backgroundColor: '#EFF6FF',
                            color: '#1D4ED8',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Chỉnh sửa hoặc cập nhật kết quả công việc này"
                        >
                          <span>✏️</span>
                          <span>Sửa</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #FCA5A5',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Xóa công việc này"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
