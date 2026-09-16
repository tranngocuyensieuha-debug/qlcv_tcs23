import type { ReactNode } from "react";
export default function KpiCard({
  label,
  value,
  note,
  tone = "blue",
  testId,
  onClick,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: string;
  testId?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      {note && <small>{note}</small>}
    </>
  );
  return onClick ? (
    <button className="demo-kpi" data-testid={testId} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className="demo-kpi" data-testid={testId}>
      {body}
    </div>
  );
}
