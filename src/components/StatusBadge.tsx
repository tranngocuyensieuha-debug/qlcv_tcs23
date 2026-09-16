import type { WorkStatus } from "../domain/models";
const labels: Record<WorkStatus, string> = {
  todo: "Chưa thực hiện",
  in_progress: "Đang thực hiện",
  waiting: "Chờ xử lý",
  done: "Hoàn thành",
};
export default function StatusBadge({ status }: { status: WorkStatus }) {
  return <span className={`demo-badge ${status}`}>{labels[status]}</span>;
}
