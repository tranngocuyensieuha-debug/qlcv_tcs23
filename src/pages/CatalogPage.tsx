import { useState } from "react";
import type { AppDataset } from "../domain/models";
import EmptyState from "../components/EmptyState";
import { Filters } from "./pageUtils";
export default function CatalogPage({ data }: { data: AppDataset }) {
  const [q, setQ] = useState(""),
    [category, setCategory] = useState(""),
    [team, setTeam] = useState(""), [measurement, setMeasurement] = useState(""), [reportPeriod, setReportPeriod] = useState("");
  const rows = data.taskDefinitions.filter(
    (x) =>
      (!q || `${x.id} ${x.name}`.toLowerCase().includes(q.toLowerCase())) &&
      (!category || x.category === category) &&
      (!team || x.applicableTeamIds.includes(team)) && (!measurement || x.measurement === measurement) && (!reportPeriod || x.reportPeriod === reportPeriod),
  );
  return (
    <>
      <h1>Danh mục nhiệm vụ</h1>
      <Filters>
        <input
          aria-label="Tìm nhiệm vụ"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="Nhóm nhiệm vụ"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Tất cả nhóm</option>
          {[...new Set(data.taskDefinitions.map((x) => x.category))].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
        <select aria-label="Cách đo" value={measurement} onChange={(e) => setMeasurement(e.target.value)}>
          <option value="">Tất cả cách đo</option>
          {[...new Set(data.taskDefinitions.map((x) => x.measurement))].map((x) => <option key={x}>{x}</option>)}
        </select>
        <select aria-label="Kỳ báo cáo danh mục" value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
          <option value="">Tất cả kỳ</option>
          {[...new Set(data.taskDefinitions.map((x) => x.reportPeriod))].map((x) => <option key={x}>{x}</option>)}
        </select>
        <select
          aria-label="Tổ áp dụng"
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
      </Filters>
      <section className="demo-card">
        {rows.length ? (
          <div className="demo-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên nhiệm vụ</th>
                  <th>Nhóm</th>
                  <th>Kỳ</th>
                  <th>Đơn vị</th><th>Cách đo</th><th>Tổ áp dụng</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.id}>
                    <td>{x.id}</td>
                    <td>{x.name}</td>
                    <td>{x.category}</td>
                    <td>{x.reportPeriod}</td>
                    <td>{x.unit}</td><td>{x.measurement}</td><td>{x.applicableTeamIds.map((id) => data.teams.find((team) => team.id === id)?.name ?? id).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </>
  );
}
