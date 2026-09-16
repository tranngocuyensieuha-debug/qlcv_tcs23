export default function EmptyState({
  message = "Không có dữ liệu phù hợp.",
}: {
  message?: string;
}) {
  return (
    <div className="demo-empty">
      <b>Không có dữ liệu</b>
      <span>{message}</span>
    </div>
  );
}
