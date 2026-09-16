import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { seedDataset } from "../data/seedDataset";
import DashboardPage from "./DashboardPage";
import MyWorkPage from "./MyWorkPage";
import ReportsPage from "./ReportsPage";
import AlertsPage from "./AlertsPage";
import CatalogPage from "./CatalogPage";
import StaffPage from "./StaffPage";
import type { AppDataset } from "../domain/models";

const data: AppDataset = {
  ...seedDataset,
  taskDefinitions: [
    ...seedDataset.taskDefinitions,
    {
      ...seedDataset.taskDefinitions[0],
      id: "task-week",
      name: "Kiểm tra tuần",
      category: "Kiểm tra",
      reportPeriod: "Tuần",
      applicableTeamIds: ["HKD1"],
    },
  ],
  workItems: [
    ...seedDataset.workItems,
    {
      ...seedDataset.workItems[0],
      id: "urgent-real",
      taskDefinitionId: "task-week",
      assigned: 5,
      completed: 1,
      deadline: "2026-08-20",
      updatedAt: "2026-08-01",
    },
  ],
};
it("dashboard lọc kỳ và tổ rồi cảnh báo mở đúng item", async () => {
  const u = userEvent.setup();
  render(<DashboardPage data={data} />);
  await u.selectOptions(screen.getByLabelText("Kỳ báo cáo"), "Tuần");
  expect(screen.getByTestId("assigned-kpi")).toHaveTextContent("5");
  await u.click(screen.getByRole("button", { name: /urgent-real/ }));
  const d = screen.getByRole("dialog");
  expect(d).toHaveTextContent("urgent-real");
  expect(d).not.toHaveTextContent("work-item-1");
});
it("KPI còn lại mở mọi item chưa xong", async () => {
  const u = userEvent.setup();
  render(<MyWorkPage data={data} />);
  await u.click(screen.getByRole("button", { name: /Còn lại/ }));
  const d = screen.getByRole("dialog");
  expect(d).toHaveTextContent("HKD1-CV01-01");
  expect(d).toHaveTextContent("urgent-real");
});
it("remaining reconcile item done chưa đủ và status filter đủ trạng thái", async () => {
  const u = userEvent.setup();
  const inconsistent: AppDataset = { ...data, workItems: [...data.workItems, { ...data.workItems[0], id: "done-incomplete", status: "done", assigned: 10, completed: 2 }] };
  render(<MyWorkPage data={inconsistent} />);
  expect(within(screen.getByLabelText("Trạng thái")).getAllByRole("option").map(x => x.textContent)).toEqual(["Tất cả trạng thái", "Chưa thực hiện", "Đang thực hiện", "Chờ xử lý", "Hoàn thành"]);
  await u.click(screen.getByRole("button", { name: /Còn lại/ }));
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveTextContent("done-incomplete");
  const expected = inconsistent.workItems.reduce((sum, item) => sum + Math.max(0, item.assigned - item.completed), 0);
  const detailSum = within(dialog).getAllByRole("row").slice(1).reduce((sum, row) => sum + Number(within(row).getAllByRole("cell")[5].textContent?.replaceAll('.', '')), 0);
  expect(detailSum).toBe(expected);
});
it("báo cáo lọc, drilldown và tải dữ liệu thật", async () => {
  const u = userEvent.setup();
  render(<ReportsPage data={data} />);
  await u.selectOptions(screen.getByLabelText("Kỳ báo cáo"), "Tuần");
  expect(screen.getByText("1 / 5")).toBeInTheDocument();
  await u.click(
    screen.getByRole("button", { name: /Tổ Quản lý hộ kinh doanh số 1/ }),
  );
  expect(screen.getByRole("dialog")).toHaveTextContent("urgent-real");
  await u.click(screen.getByRole("button", { name: "Xuất báo cáo" }));
  expect(screen.getByRole("button", { name: "Xuất báo cáo" })).toBeEnabled();
});
it("cảnh báo mở chi tiết đúng item", async () => {
  const u = userEvent.setup();
  render(<AlertsPage data={data} now={new Date("2026-08-25")} />);
  await u.click(screen.getByRole("button", { name: /urgent-real/ }));
  expect(screen.getByRole("dialog")).toHaveTextContent("urgent-real");
});
it("catalog lọc mã, nhóm và tổ; staff lọc tổ", async () => {
  const u = userEvent.setup();
  render(<CatalogPage data={data} />);
  await u.type(screen.getByLabelText("Tìm nhiệm vụ"), "task-week");
  expect(screen.getByText("Kiểm tra tuần")).toBeInTheDocument();
  render(<StaffPage data={data} />);
  await u.selectOptions(screen.getByLabelText("Lọc tổ nhân sự"), "HKD1");
  const tables = screen.getAllByRole("table");
  expect(within(tables.at(-1)!).getAllByRole("row")).toHaveLength(seedDataset.officers.filter((x) => x.teamId === 'HKD1').length + 1);
});

it("catalog lọc cách đo và hiển thị đủ metadata", async () => {
  const u = userEvent.setup();
  render(<CatalogPage data={data} />);
  await u.selectOptions(screen.getByLabelText("Cách đo"), data.taskDefinitions[0].measurement);
  expect(screen.getByRole('table')).toHaveTextContent(data.taskDefinitions[0].unit);
  expect(screen.getByRole('table')).toHaveTextContent(data.teams[0].name);
});

it("dashboard có biểu đồ tổng hợp truy cập được từ dữ liệu thật", () => {
  render(<DashboardPage data={data} />);
  expect(screen.getByRole('img', { name: /Biểu đồ tổng hợp theo tổ/ })).toBeInTheDocument();
});

it('báo cáo reset cán bộ không còn hợp lệ khi đổi tổ', async () => {
  const u = userEvent.setup();
  render(<ReportsPage data={data} />);
  await u.selectOptions(screen.getByLabelText('Cán bộ báo cáo'), seedDataset.officers[0].id);
  await u.selectOptions(screen.getByLabelText('Tổ báo cáo'), 'QLDN1');
  expect(screen.getByLabelText('Cán bộ báo cáo')).toHaveValue('');
});

it('tổ chưa nhập nghiệp vụ nhận thông báo rõ nghĩa', () => {
  const qldn = { ...seedDataset, teams: seedDataset.teams.filter((x) => x.id === 'QLDN1'), officers: seedDataset.officers.filter((x) => x.teamId === 'QLDN1'), taskDefinitions: [], workItems: [] };
  render(<DashboardPage data={qldn} />);
  expect(screen.getByText('Chưa có dữ liệu nghiệp vụ được nhập cho tổ này')).toBeInTheDocument();
});
