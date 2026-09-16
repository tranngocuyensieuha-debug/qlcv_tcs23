import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { seedDataset } from "../data/seedDataset";
import MonthlyKpiPage from "./MonthlyKpiPage";

describe("MonthlyKpiPage", () => {
  it("hiển thị đúng tiêu đề và các chỉ số tổng quan", () => {
    render(<MonthlyKpiPage data={seedDataset} />);
    expect(screen.getByText(/Tiêu chí KPI Tháng - Thuế cơ sở 23/i)).toBeInTheDocument();
    expect(screen.getByText(/34 Chỉ tiêu Định lượng/i)).toBeInTheDocument();
    expect(screen.getByText(/Bảng điểm Thi đua KPI Tháng/i)).toBeInTheDocument();
  });

  it("chuyển tab chi tiết chỉ tiêu và quy chế tính điểm mượt mà", async () => {
    const user = userEvent.setup();
    render(<MonthlyKpiPage data={seedDataset} />);

    // Switch to indicators tab
    const tabIndicators = screen.getByRole("button", { name: /Chi tiết 34 Tiêu chí/i });
    await user.click(tabIndicators);
    expect(screen.getByText("Tỷ lệ thực thu NSNN so với DTPL lũy kế")).toBeInTheDocument();

    // Switch to rules tab
    const tabRules = screen.getByRole("button", { name: /Khung Định mức & Quy chế/i });
    await user.click(tabRules);
    expect(screen.getByText(/Khung Định mức & Nguyên tắc Chấm điểm KPI Tháng/i)).toBeInTheDocument();
  });
});
