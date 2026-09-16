import { useState } from "react";
import type { AppDataset } from "../domain/models";
import { groupByOfficer } from "../domain/metrics";
import { fmt } from "./format";
export default function StaffPage({ data }: { data: AppDataset }) {
  const [team, setTeam] = useState("");
  const scoped = {
    ...data,
    officers: data.officers.filter((x) => !team || x.teamId === team),
    workItems: data.workItems.filter((x) => !team || x.teamId === team),
  };
  const groups = groupByOfficer(scoped),
    byId = new Map(data.officers.map((x) => [x.id, x]));
  return (
    <>
      <h1>Nhân sự &amp; địa bàn</h1>
      <div className="demo-filters">
        <select
          aria-label="Lọc tổ nhân sự"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          disabled={data.teams.length === 1}
        >
          <option value="">Tất cả tổ</option>
          {data.teams.map((x) => (
            <option value={x.id} key={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </div>
      <section className="demo-card">
        <div className="demo-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cán bộ</th>
                <th>Tổ</th>
                <th>Địa bàn</th>
                <th>Địa bàn quản lý chi tiết</th>
                <th>Phải làm</th>
                <th>Đã làm</th>
                <th>Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const o = byId.get(g.id);
                return (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td>
                      {data.teams.find((x) => x.id === o?.teamId)?.shortName}
                    </td>
                    <td>{o?.area}</td>
                    <td>{o?.areaDetail}</td>
                    <td>{fmt(g.assigned)}</td>
                    <td>{fmt(g.completed)}</td>
                    <td>{g.rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
