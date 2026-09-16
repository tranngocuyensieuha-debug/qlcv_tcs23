import { useState } from "react";
import type { AppDataset, WorkItem } from "../domain/models";
import { buildDashboardMetrics, groupByTeam } from "../domain/metrics";
import KpiCard from "../components/KpiCard";
import { fmt } from "./format";
import { DetailModal } from "./DashboardPage";
import { downloadWorkReport } from "../utils/reportExport";
export default function ReportsPage({ data }: { data: AppDataset }) {
  const [period, setPeriod] = useState(""),
    [team, setTeam] = useState(""), [officer, setOfficer] = useState(""), [task, setTask] = useState("");
  const [detail, setDetail] = useState<WorkItem[] | null>(null);
  const tasks = new Map(data.taskDefinitions.map((x) => [x.id, x]));
  const availableOfficers = data.officers.filter((x) => !team || x.teamId === team);
  const availableTasks = data.taskDefinitions.filter((x) => (!team || x.applicableTeamIds.includes(team)) && (!period || x.reportPeriod === period));
  const items = data.workItems.filter(
    (x) =>
      (!period || tasks.get(x.taskDefinitionId)?.reportPeriod === period) &&
      (!team || x.teamId === team) && (!officer || x.officerId === officer) && (!task || x.taskDefinitionId === task),
  );
  const m = buildDashboardMetrics(items);
  const groups = groupByTeam({
    ...data,
    teams: team ? data.teams.filter((x) => x.id === team) : data.teams,
    workItems: items,
  });
  return (
    <>
      <h1>Báo cáo kết quả</h1>
      <div className="demo-filters">
        <select
          aria-label="Kỳ báo cáo"
          value={period}
          onChange={(e) => { const next = e.target.value; setPeriod(next); if (task && next && tasks.get(task)?.reportPeriod !== next) setTask(''); }}
        >
          <option value="">Tất cả kỳ</option>
          {[...new Set(data.taskDefinitions.map((x) => x.reportPeriod))].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
        <select
          aria-label="Tổ báo cáo"
          value={team}
          onChange={(e) => { const next = e.target.value; setTeam(next); if (officer && next && !data.officers.some((x) => x.id === officer && x.teamId === next)) setOfficer(''); if (task && next && !tasks.get(task)?.applicableTeamIds.includes(next)) setTask(''); }}
        >
          <option value="">Tất cả tổ</option>
          {data.teams.map((x) => (
            <option value={x.id} key={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <select aria-label="Cán bộ báo cáo" value={officer} onChange={(e) => setOfficer(e.target.value)}><option value="">Tất cả cán bộ</option>{availableOfficers.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}</select>
        <select aria-label="Nhiệm vụ báo cáo" value={task} onChange={(e) => setTask(e.target.value)}><option value="">Tất cả nhiệm vụ</option>{availableTasks.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}</select>
        <button disabled={!items.length} title={!items.length ? "Không có dữ liệu để xuất" : undefined} onClick={() => downloadWorkReport(data, items)}>Xuất báo cáo</button>
      </div>
      <div className="demo-kpis">
        <KpiCard label="Phải thực hiện" value={fmt(m.assigned)} />
        <KpiCard label="Đã thực hiện" value={fmt(m.completed)} />
        <KpiCard label="Còn lại" value={fmt(m.remaining)} />
        <KpiCard label="Tỷ lệ" value={`${m.rate}%`} />
      </div>
      <section className="demo-card">
        <h2>Chi tiết theo tổ</h2>
        {groups.map((g) => (
          <button
            className="report-row"
            aria-label={g.name}
            key={g.id}
            onClick={() => setDetail(items.filter((x) => x.teamId === g.id))}
          >
            <b>{g.name}</b>
            <span>
              {fmt(g.completed)} / {fmt(g.assigned)}
            </span>
            <strong>{g.rate}%</strong>
          </button>
        ))}
      </section>
      {detail && (
        <DetailModal
          data={data}
          items={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
