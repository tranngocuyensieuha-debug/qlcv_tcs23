import { useMemo, useState } from "react";
import type { AppDataset, WorkItem } from "../domain/models";
import { useAppStore } from "../app/useAppStore";
import WorkItemEditModal from "../components/WorkItemEditModal";
import { DetailModal } from "./DashboardPage";

export interface MonthlyIndicator {
  id: string;
  code: string;
  name: string;
  category: "NSNN" | "QLN" | "TTHC" | "QLDN" | "HKD" | "KT";
  categoryLabel: string;
  bq: number;
  type: "std_revenue" | "debt_growth" | "debt_ratio" | "diff_3pct" | "overdue" | "sat" | "std";
  unit: string;
  taskId: string;
  note?: string;
}

export const MONTHLY_INDICATORS: MonthlyIndicator[] = [
  // I. Thu NSNN
  {
    id: "M01",
    code: "THU-DTPL",
    name: "Tỷ lệ thực thu NSNN so với DTPL lũy kế",
    category: "NSNN",
    categoryLabel: "Thu NSNN",
    bq: 0.7964,
    type: "std_revenue",
    unit: "%",
    taskId: "THU",
    note: "Định mức BQ ngành 79.6%. Vượt ≥5%: +1.0đ; ≥0%: +0.5đ; <0%: 0đ; <-5%: -0.5đ; <-10%: -1.0đ",
  },
  {
    id: "M02",
    code: "THU-THUCTHU-UOC",
    name: "Tỷ lệ thực thu tháng so với ước thu tháng (chênh lệch 3%)",
    category: "NSNN",
    categoryLabel: "Thu NSNN",
    bq: 0.03,
    type: "diff_3pct",
    unit: "% lệch",
    taskId: "THU",
    note: "Chênh lệch tuyệt đối ≤3%: +1.0đ; ≤5%: +0.5đ; ≤10%: 0đ; ≤15%: -0.5đ; >15%: -1.0đ",
  },
  {
    id: "M03",
    code: "THU-CUNG-KY",
    name: "Tỷ lệ thu NSNN tăng/giảm so với cùng kỳ",
    category: "NSNN",
    categoryLabel: "Thu NSNN",
    bq: 1.0771,
    type: "std_revenue",
    unit: "%",
    taskId: "THU",
    note: "Định mức BQ ngành 107.7%. Vượt ≥5%: +1.0đ; ≥0%: +0.5đ; <0%: 0đ; <-5%: -0.5đ; <-10%: -1.0đ",
  },

  // II. Quản lý nợ
  {
    id: "M04",
    code: "QLN-DAU-NAM",
    name: "Tỷ lệ nợ tăng/giảm so với 31/12/2025 (đầu năm)",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: 0.0456,
    type: "debt_growth",
    unit: "%",
    taskId: "NO",
    note: "Nợ giảm >5%: +1.0đ; giảm 0-5%: +0.5đ; tăng 0-5%: -0.5đ; tăng >5%: -1.0đ",
  },
  {
    id: "M05",
    code: "QLN-THANG-TRUOC",
    name: "Tỷ lệ nợ tăng/giảm so với tháng trước liền kề",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: -0.0982,
    type: "debt_growth",
    unit: "%",
    taskId: "QLN-THANG",
    note: "Định mức BQ ngành giảm 9.8%. Tốt hơn BQ: +1.0đ/+0.5đ; xấu hơn BQ: -0.5đ/-1.0đ",
  },
  {
    id: "M06",
    code: "QLN-TONGNO-TONGTHU",
    name: "Tỷ lệ Tổng nợ / Tổng thu NSNN (Giao dưới 8%)",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: 0.08,
    type: "debt_ratio",
    unit: "%",
    taskId: "NO",
    note: "Chỉ tiêu Cục giao ≤8%. Thấp hơn ≥2%: +1.0đ; ≤8%: +0.5đ; cao hơn: -0.5đ/-1.0đ",
  },
  {
    id: "M07",
    code: "QLN-KNT-TONGTHU",
    name: "Tỷ lệ Nợ khả năng thu / Tổng thu NSNN (Giao dưới 5%)",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: 0.05,
    type: "debt_ratio",
    unit: "%",
    taskId: "NO",
    note: "Chỉ tiêu Cục giao ≤5%. Thấp hơn ≥2%: +1.0đ; ≤5%: +0.5đ; cao hơn: -0.5đ/-1.0đ",
  },
  {
    id: "M08",
    code: "QLN-THUEPHI-TONGTHU",
    name: "Tỷ lệ Nợ thuế, phí / Tổng thu NSNN (Giao dưới 5%)",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: 0.05,
    type: "debt_ratio",
    unit: "%",
    taskId: "NO",
    note: "Chỉ tiêu Cục giao ≤5%. Thấp hơn ≥2%: +1.0đ; ≤5%: +0.5đ; cao hơn: -0.5đ/-1.0đ",
  },
  {
    id: "M09",
    code: "QLN-CC-SL",
    name: "Tỷ lệ số lượng NNT đã cưỡng chế nợ / Phải cưỡng chế (≥1 triệu)",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: 0.56,
    type: "std",
    unit: "%",
    taskId: "CCN",
    note: "Định mức BQ ngành 56%. Vượt ≥5%: +1.0đ; ≥0%: +0.5đ; kém: -0.5đ/-1.0đ",
  },
  {
    id: "M10",
    code: "QLN-CC-TIEN",
    name: "Tỷ lệ số tiền đã thực hiện cưỡng chế / Phải cưỡng chế",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: 0.90,
    type: "std",
    unit: "%",
    taskId: "CCN",
    note: "Định mức BQ ngành 90%. Vượt ≥5%: +1.0đ; ≥0%: +0.5đ; kém: -0.5đ/-1.0đ",
  },
  {
    id: "M11",
    code: "QLN-THXC-SL",
    name: "Tỷ lệ số lượng NNT đã tạm hoãn xuất cảnh (TT 00, 03, 06)",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: 0.80,
    type: "std",
    unit: "%",
    taskId: "THXC-TRANGTHAI",
    note: "Định mức 80%. Vượt ≥5%: +1.0đ; ≥0%: +0.5đ; kém: -0.5đ/-1.0đ",
  },
  {
    id: "M12",
    code: "QLN-THXC-TIEN",
    name: "Tỷ lệ số tiền nợ đã tạm hoãn xuất cảnh (TT 00, 03, 06)",
    category: "QLN",
    categoryLabel: "Quản lý nợ",
    bq: 0.837,
    type: "std",
    unit: "%",
    taskId: "THXC",
    note: "Định mức BQ ngành 83.7%. Vượt ≥5%: +1.0đ; ≥0%: +0.5đ; kém: -0.5đ/-1.0đ",
  },

  // III. TTHC
  {
    id: "M13",
    code: "TTHC-QUA-HAN",
    name: "Tỷ lệ tồn quá hạn thực hiện TTHC theo tháng (đã trừ hoàn thuế)",
    category: "TTHC",
    categoryLabel: "Thủ tục hành chính",
    bq: 0.098,
    type: "overdue",
    unit: "%",
    taskId: "TTHC",
    note: "Càng thấp càng tốt. Thấp hơn BQ ngành 9.8% từ ≥5%: +1.0đ; 0-5%: +0.5đ; cao hơn: -0.5đ/-1.0đ",
  },
  {
    id: "M14",
    code: "TTHC-HAI-LONG",
    name: "Tỷ lệ đánh giá sự hài lòng NNT (Hệ thống Cục Thuế)",
    category: "TTHC",
    categoryLabel: "Thủ tục hành chính",
    bq: 0.90,
    type: "sat",
    unit: "%",
    taskId: "HCTH-HAILONG",
    note: "Mốc chuẩn 90%. Đạt ≥95%: +1.0đ; ≥90%: +0.5đ; 85-90%: -0.5đ; <85%: -1.0đ",
  },
  {
    id: "M15",
    code: "TTHC-DVCQG-BTC",
    name: "Xử lý phản ánh Cổng DVCQG và trả lời câu hỏi BTC đúng hạn",
    category: "TTHC",
    categoryLabel: "Thủ tục hành chính",
    bq: 1.0,
    type: "std",
    unit: "%",
    taskId: "HCTH-DVCQG",
    note: "Chuẩn giao 100% hồ sơ phản ánh và câu hỏi chính sách thuế được xử lý đúng hạn.",
  },

  // IV. Quản lý Doanh nghiệp
  {
    id: "M16",
    code: "QLDN-TPR",
    name: "Rà soát ứng dụng phân tích rủi ro TPR",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 0.9937,
    type: "std",
    unit: "%",
    taskId: "TPR",
    note: "Định mức BQ ngành 99.4%. Đạt cao hơn TB ngành được cộng điểm tối đa.",
  },
  {
    id: "M17",
    code: "QLDN-XAC-MINH-HD",
    name: "Xác minh hóa đơn rủi ro",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 0.9938,
    type: "std",
    unit: "%",
    taskId: "HD",
    note: "Định mức BQ ngành 99.4%. Hoàn thành đúng hạn và chất lượng.",
  },
  {
    id: "M18",
    code: "QLDN-HE-SO-K",
    name: "Xử lý cảnh báo Hệ số K",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 0.9943,
    type: "std",
    unit: "%",
    taskId: "HSK",
    note: "Định mức BQ ngành 99.4%. Rà soát và yêu cầu NNT giải trình kịp thời.",
  },
  {
    id: "M19",
    code: "QLDN-XPVPHC",
    name: "Xử phạt vi phạm hành chính thuế",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 0.7973,
    type: "std",
    unit: "%",
    taskId: "QLDN-XPVPHC",
    note: "Định mức BQ ngành 79.7%. Tỷ lệ đã xử phạt trên tổng số trường hợp vi phạm phải xử lý.",
  },
  {
    id: "M20",
    code: "QLDN-DONGMA-GOI3",
    name: "Đóng mã giải thể theo gói của Phòng QLDN3",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 0.4908,
    type: "std",
    unit: "%",
    taskId: "QLDN-CHUYENDE",
    note: "Định mức BQ ngành 49.1%. Tiến độ rà soát và đóng mã theo chuyên đề.",
  },
  {
    id: "M21",
    code: "QLDN-DONGMA-MOI",
    name: "Đóng mã giải thể phát sinh mới (đạt 35% KPI năm)",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 0.628,
    type: "std",
    unit: "%",
    taskId: "DKT",
    note: "Định mức BQ ngành 62.8%. Chiến dịch làm sạch MST trạng thái 03, 06.",
  },
  {
    id: "M22",
    code: "QLDN-GOI-NHIEUNGUON",
    name: "Xử lý gói TNCN nhiều nguồn năm 2025",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 1.0,
    type: "std",
    unit: "%",
    taskId: "QLDN-GOINGUON2025",
    note: "Kế hoạch hoàn thành 100% hồ sơ gói dữ liệu nhiều nguồn năm 2025.",
  },
  {
    id: "M23",
    code: "QLDN-KT-TAI-BAN",
    name: "Kiểm tra tại bàn đối với Doanh nghiệp",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 0.2075,
    type: "std",
    unit: "%",
    taskId: "QLDN-KTTB",
    note: "Định mức BQ ngành 20.7%. Hoàn thành theo kế hoạch giao hằng tháng.",
  },
  {
    id: "M24",
    code: "QLDN-HOAN-TUDONG",
    name: "Giải quyết Hoàn TNCN tự động & Hoàn GTGT điện tử",
    category: "QLDN",
    categoryLabel: "Quản lý doanh nghiệp",
    bq: 0.95,
    type: "std",
    unit: "%",
    taskId: "HOAN-TNCN-TUDONG",
    note: "Tỷ lệ ban hành Quyết định/Lệnh hoàn tự động và giải quyết hồ sơ trước hoàn đúng hạn.",
  },

  // V. Hộ kinh doanh & Cá nhân
  {
    id: "M25",
    code: "HKD-TONG-THU",
    name: "Tỷ lệ thực hiện nhiệm vụ thu HKD so với DTPL",
    category: "HKD",
    categoryLabel: "Cá nhân & Hộ kinh doanh",
    bq: 1.0,
    type: "std_revenue",
    unit: "%",
    taskId: "THU",
    note: "Căn cứ theo tiêu chí chấm điểm của Phòng CNTK. Hoàn thành dự toán giao.",
  },
  {
    id: "M26",
    code: "HKD-KE-KHAI",
    name: "Công tác quản lý kê khai thuế HKD đúng hạn",
    category: "HKD",
    categoryLabel: "Cá nhân & Hộ kinh doanh",
    bq: 0.973,
    type: "std",
    unit: "%",
    taskId: "KK",
    note: "Định mức BQ ngành 97.3%. Tỷ lệ HKD nộp tờ khai đúng thời hạn quy định.",
  },
  {
    id: "M27",
    code: "HKD-ETAX-MOBILE",
    name: "Đăng ký và sử dụng eTax Mobile của Hộ kinh doanh",
    category: "HKD",
    categoryLabel: "Cá nhân & Hộ kinh doanh",
    bq: 0.888,
    type: "std",
    unit: "%",
    taskId: "HKD-ETAX",
    note: "Định mức BQ ngành 88.8%. Đăng ký tài khoản, cài đặt và có giao dịch điện tử.",
  },
  {
    id: "M28",
    code: "HKD-HDDT-MTT",
    name: "Sử dụng HĐĐT khởi tạo từ máy tính tiền của HKD",
    category: "HKD",
    categoryLabel: "Cá nhân & Hộ kinh doanh",
    bq: 0.87,
    type: "std",
    unit: "%",
    taskId: "HKD-HDDT-MTT",
    note: "Định mức BQ ngành 87.0%. Tỷ lệ HKD đang hoạt động đã đăng ký và sử dụng HĐĐT máy tính tiền.",
  },
  {
    id: "M29",
    code: "HKD-TMDT-GOI",
    name: "Khai thác dữ liệu TMĐT các gói trọng điểm (GHTK, TikTok, CV 3049, Gói 3)",
    category: "HKD",
    categoryLabel: "Cá nhân & Hộ kinh doanh",
    bq: 0.85,
    type: "std",
    unit: "%",
    taskId: "HKD-TMDT-GOI",
    note: "Rà soát các tổ chức, cá nhân kinh doanh TMĐT doanh thu trên 1 tỷ và nội dung trực tuyến.",
  },
  {
    id: "M30",
    code: "HKD-CHUYEN-DOI-DN",
    name: "Công tác tuyên truyền, vận động HKD chuyển đổi lên Doanh nghiệp",
    category: "HKD",
    categoryLabel: "Cá nhân & Hộ kinh doanh",
    bq: 1.0,
    type: "std",
    unit: "%",
    taskId: "HKD-CHUYENDOI-DN",
    note: "Hoàn thành chỉ tiêu khảo sát và hướng dẫn HKD đủ điều kiện chuyển đổi mô hình DN.",
  },

  // VI. Kiểm tra thuế
  {
    id: "M31",
    code: "KT-HOAN-THANH-KH",
    name: "Tỷ lệ hoàn thành kế hoạch kiểm tra tại trụ sở NNT",
    category: "KT",
    categoryLabel: "Kiểm tra thuế",
    bq: 0.8307,
    type: "std",
    unit: "%",
    taskId: "KIEMTRA-KHKT",
    note: "Định mức BQ ngành 83.1%. Số cuộc đã hoàn thành trên tổng số cuộc kiểm tra được giao.",
  },
  {
    id: "M32",
    code: "KT-DICH-DANH",
    name: "Tỷ lệ hoàn thành kế hoạch kiểm tra đích danh năm 2026",
    category: "KT",
    categoryLabel: "Kiểm tra thuế",
    bq: 0.3975,
    type: "std",
    unit: "%",
    taskId: "KIEMTRA-DICH-DANH",
    note: "Định mức BQ ngành 39.8%. Đôn đốc đẩy nhanh tiến độ kiểm tra các chuyên đề trọng điểm.",
  },
  {
    id: "M33",
    code: "KT-DON-DOC-TRUYTHU",
    name: "Tỷ lệ đôn đốc nộp NS qua kiểm tra (truy thu, phạt, ấn định)",
    category: "KT",
    categoryLabel: "Kiểm tra thuế",
    bq: 0.9473,
    type: "std",
    unit: "%",
    taskId: "KIEMTRA-TRUYTHU",
    note: "Định mức BQ ngành 94.7%. Số tiền thuế và tiền phạt đã thực nộp vào NSNN sau kiểm tra.",
  },
  {
    id: "M34",
    code: "KT-DONGMA-GIAITHE",
    name: "Kiểm tra hồ sơ đóng mã số thuế, giải thể",
    category: "KT",
    categoryLabel: "Kiểm tra thuế",
    bq: 0.82,
    type: "std",
    unit: "%",
    taskId: "KIEMTRA-DONGMA",
    note: "Định mức BQ ngành 82.0%. Hoàn thành kiểm tra đúng thời hạn quy định.",
  },
  {
    id: "M35",
    code: "KT-SO-THU-BQ",
    name: "Số thu bình quân 01 cuộc kiểm tra tại trụ sở NNT",
    category: "KT",
    categoryLabel: "Kiểm tra thuế",
    bq: 0.85,
    type: "std",
    unit: "%",
    taskId: "KIEMTRA-BQT",
    note: "Định mức số thu, truy thu và phạt bình quân trên 01 cuộc kiểm tra đạt chỉ tiêu Cục giao.",
  },
  {
    id: "M36",
    code: "KT-KN-SAUKT",
    name: "Tỷ lệ giải quyết đơn khiếu nại phát sinh sau kiểm tra",
    category: "KT",
    categoryLabel: "Kiểm tra thuế",
    bq: 1.0,
    type: "std",
    unit: "%",
    taskId: "KIEMTRA-KN-SAUKT",
    note: "Giải quyết 100% đơn thư, khiếu nại phát sinh sau kiểm tra đúng thời hạn và quy định pháp luật.",
  },
];

function calcMonthlyScore(rate: number, bq: number, type: MonthlyIndicator["type"]): number {
  if (type === "std_revenue") {
    if (rate >= bq + 0.05) return 1.0;
    if (rate >= bq) return 0.5;
    if (rate >= bq - 0.05) return 0.0;
    if (rate >= bq - 0.1) return -0.5;
    return -1.0;
  }
  if (type === "diff_3pct") {
    if (rate <= 0.03) return 1.0;
    if (rate <= 0.05) return 0.5;
    if (rate <= 0.1) return 0.0;
    if (rate <= 0.15) return -0.5;
    return -1.0;
  }
  if (type === "debt_growth") {
    if (rate <= -0.05) return 1.0;
    if (rate <= 0) return 0.5;
    if (rate <= 0.05) return -0.5;
    return -1.0;
  }
  if (type === "debt_ratio") {
    if (rate <= bq - 0.02) return 1.0;
    if (rate <= bq) return 0.5;
    if (rate <= bq + 0.02) return -0.5;
    return -1.0;
  }
  if (type === "overdue") {
    if (rate <= bq - 0.05) return 1.0;
    if (rate <= bq) return 0.5;
    if (rate <= bq + 0.05) return -0.5;
    return -1.0;
  }
  if (type === "sat") {
    if (rate >= 0.95) return 1.0;
    if (rate >= 0.9) return 0.5;
    if (rate >= 0.85) return -0.5;
    return -1.0;
  }
  if (type === "std") {
    if (rate >= bq + 0.05) return 1.0;
    if (rate >= bq) return 0.5;
    if (rate >= bq - 0.05) return -0.5;
    return -1.0;
  }
  return 0;
}

export default function MonthlyKpiPage({ data }: { data: AppDataset }) {
  const { account, saveWorkItem, deleteWorkItem } = useAppStore();
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"summary" | "indicators" | "rules">("summary");
  const [detailItems, setDetailItems] = useState<WorkItem[] | null>(null);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditIndicator = (ind: MonthlyIndicator) => {
    const teamScope = selectedTeam !== "all"
      ? selectedTeam
      : (account?.role === "team" ? account.teamId : undefined);

    const matching = data.workItems.filter(
      (w) => (!teamScope || w.teamId === teamScope) && w.taskDefinitionId === ind.taskId
    );

    if (matching.length > 0) {
      setDetailItems(matching);
    } else {
      const targetTeam = teamScope || (account?.role === "lead" ? (data.teams[0]?.id || "HKD1") : (account?.teamId || "HKD1"));
      setEditingItem({
        id: "",
        taskDefinitionId: ind.taskId,
        teamId: targetTeam,
        officerId: "",
        assigned: 10,
        completed: 0,
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        status: "in_progress",
        updatedAt: new Date().toISOString(),
      });
      setIsEditModalOpen(true);
    }
  };

  // Calculate monthly scores for all teams
  const teamCalculations = useMemo(() => {
    const scores = data.teams.map((team) => {
      const results: Record<string, { rate: number; score: number }> = {};

      MONTHLY_INDICATORS.forEach((ind) => {
        const items = data.workItems.filter(
          (w) => w.teamId === team.id && w.taskDefinitionId === ind.taskId
        );
        const assigned = items.reduce((sum, w) => sum + w.assigned, 0);
        const completed = items.reduce((sum, w) => sum + w.completed, 0);

        let rate = assigned > 0 ? completed / assigned : 0;

        // Custom realistic variation for rate to reflect real tax performance
        if (ind.type === "diff_3pct") {
          rate = Math.abs(1 - (assigned > 0 ? completed / assigned : 1)) * 0.08;
        } else if (ind.type === "debt_growth") {
          rate = (assigned > 0 ? completed / assigned : 1) - 1.04;
        } else if (ind.type === "debt_ratio") {
          rate = (assigned > 0 ? completed / assigned : 0.05) * 0.07;
        }

        const score = calcMonthlyScore(rate, ind.bq, ind.type);
        results[ind.id] = { rate, score };
      });

      // Group averages
      const getAvg = (cat: string) => {
        const catInds = MONTHLY_INDICATORS.filter((i) => i.category === cat);
        if (catInds.length === 0) return 0;
        const total = catInds.reduce((sum, i) => sum + (results[i.id]?.score ?? 0), 0);
        return total / catInds.length;
      };

      const nsnn_avg = getAvg("NSNN");
      const qln_avg = getAvg("QLN");
      const tthc_avg = getAvg("TTHC");
      const qldn_avg = getAvg("QLDN");
      const hkd_avg = getAvg("HKD");
      const kt_avg = getAvg("KT");

      const totalScore = nsnn_avg + qln_avg + tthc_avg + qldn_avg + hkd_avg + kt_avg;

      return {
        teamId: team.id,
        teamName: team.name,
        shortName: team.shortName,
        results,
        averages: {
          nsnn: nsnn_avg,
          qln: qln_avg,
          tthc: tthc_avg,
          qldn: qldn_avg,
          hkd: hkd_avg,
          kt: kt_avg,
        },
        totalScore,
      };
    });

    // Sort descending for ranking
    const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);
    return scores.map((t) => {
      const rank = sorted.findIndex((s) => s.teamId === t.teamId) + 1;
      return { ...t, rank };
    });
  }, [data]);

  // Overall metrics
  const topTeam = useMemo(() => {
    return [...teamCalculations].sort((a, b) => a.rank - b.rank)[0];
  }, [teamCalculations]);

  const avgUnitScore = useMemo(() => {
    if (teamCalculations.length === 0) return 0;
    return teamCalculations.reduce((sum, t) => sum + t.totalScore, 0) / teamCalculations.length;
  }, [teamCalculations]);

  // Filtered indicators
  const filteredIndicators = useMemo(() => {
    return MONTHLY_INDICATORS.filter((ind) => {
      const matchCat = selectedCategory === "all" || ind.category === selectedCategory;
      const matchSearch =
        ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.3rem 0", color: "#1E3A8A", fontSize: "1.5rem" }}>
            Tiêu chí KPI Tháng - Thuế cơ sở 23
          </h1>
          <p style={{ margin: 0, color: "#64748B", fontSize: "0.9rem" }}>
            Đánh giá định lượng kết quả công tác quản lý thuế theo Quyết định Cục Thuế TP Hà Nội & Phụ lục phân công TCS23
          </p>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            backgroundColor: "#1D4ED8",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          ⎙ In / Xuất báo cáo
        </button>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="demo-card" style={{ padding: "1rem 1.2rem", borderLeft: "4px solid #10B981" }}>
          <small className="text-muted" style={{ fontWeight: 600 }}>🏆 Đơn vị Dẫn đầu Tháng</small>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#065F46", marginTop: "0.25rem" }}>
            {topTeam?.shortName ?? "N/A"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#059669", marginTop: "0.2rem" }}>
            Điểm thi đua: <strong>+{topTeam?.totalScore.toFixed(2)}</strong> (Hạng 1)
          </div>
        </div>

        <div className="demo-card" style={{ padding: "1rem 1.2rem", borderLeft: "4px solid #3B82F6" }}>
          <small className="text-muted" style={{ fontWeight: 600 }}>📊 Điểm TB Toàn TCS23</small>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1E40AF", marginTop: "0.25rem" }}>
            {avgUnitScore > 0 ? `+${avgUnitScore.toFixed(2)}` : avgUnitScore.toFixed(2)} điểm
          </div>
          <div style={{ fontSize: "0.8rem", color: "#3B82F6", marginTop: "0.2rem" }}>
            Đánh giá trên 8 Tổ chuyên môn
          </div>
        </div>

        <div className="demo-card" style={{ padding: "1rem 1.2rem", borderLeft: "4px solid #F59E0B" }}>
          <small className="text-muted" style={{ fontWeight: 600 }}>📋 Tổng số Chỉ tiêu Tháng</small>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#92400E", marginTop: "0.25rem" }}>
            36 Chỉ tiêu Định lượng
          </div>
          <div style={{ fontSize: "0.8rem", color: "#D97706", marginTop: "0.2rem" }}>
            Phân thành 6 nhóm lĩnh vực trọng tâm (Đủ 6 chỉ tiêu KT)
          </div>
        </div>

        <div className="demo-card" style={{ padding: "1rem 1.2rem", borderLeft: "4px solid #8B5CF6" }}>
          <small className="text-muted" style={{ fontWeight: 600 }}>⚖️ Cơ chế Đánh giá</small>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#5B21B6", marginTop: "0.25rem" }}>
            Thưởng / Phạt ±1.0đ
          </div>
          <div style={{ fontSize: "0.8rem", color: "#7C3AED", marginTop: "0.2rem" }}>
            So sánh trực tiếp Bình quân toàn ngành
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #E2E8F0", marginBottom: "1rem" }}>
        <button
          onClick={() => setActiveTab("summary")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom: activeTab === "summary" ? "3px solid #1D4ED8" : "3px solid transparent",
            backgroundColor: "transparent",
            fontWeight: activeTab === "summary" ? "bold" : "normal",
            color: activeTab === "summary" ? "#1D4ED8" : "#64748B",
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          📊 Bảng Tổng hợp Xếp hạng (8 Tổ)
        </button>
        <button
          onClick={() => setActiveTab("indicators")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom: activeTab === "indicators" ? "3px solid #1D4ED8" : "3px solid transparent",
            backgroundColor: "transparent",
            fontWeight: activeTab === "indicators" ? "bold" : "normal",
            color: activeTab === "indicators" ? "#1D4ED8" : "#64748B",
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          📑 Chi tiết 36 Tiêu chí Định lượng
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          style={{
            padding: "8px 16px",
            border: "none",
            borderBottom: activeTab === "rules" ? "3px solid #1D4ED8" : "3px solid transparent",
            backgroundColor: "transparent",
            fontWeight: activeTab === "rules" ? "bold" : "normal",
            color: activeTab === "rules" ? "#1D4ED8" : "#64748B",
            cursor: "pointer",
            fontSize: "0.95rem",
          }}
        >
          📜 Khung Định mức & Quy chế Cục Thuế
        </button>
      </div>

      {/* TAB 1: SUMMARY MATRIX */}
      {activeTab === "summary" && (
        <section className="demo-card" style={{ padding: "1.2rem", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, color: "#0F172A", fontSize: "1.1rem" }}>
              Bảng điểm Thi đua KPI Tháng các Tổ thuộc Thuế cơ sở 23
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#64748B" }}>
              Xếp hạng tự động theo tổng điểm trung bình 6 lĩnh vực
            </span>
          </div>

          <table className="kpi-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "right" }}>
            <thead>
              <tr style={{ backgroundColor: "#1D4ED8", color: "#FFFFFF", textAlign: "center" }}>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px", textAlign: "left", minWidth: "220px" }}>Đơn vị (Tổ công tác)</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px" }}>Thu NSNN<br/><small style={{ fontWeight: 400 }}>(3 chỉ tiêu)</small></th>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px" }}>Quản lý nợ<br/><small style={{ fontWeight: 400 }}>(9 chỉ tiêu)</small></th>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px" }}>TTHC & DVC<br/><small style={{ fontWeight: 400 }}>(3 chỉ tiêu)</small></th>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px" }}>Quản lý DN<br/><small style={{ fontWeight: 400 }}>(9 chỉ tiêu)</small></th>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px" }}>Cá nhân & HKD<br/><small style={{ fontWeight: 400 }}>(6 chỉ tiêu)</small></th>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px" }}>Kiểm tra thuế<br/><small style={{ fontWeight: 400 }}>(6 chỉ tiêu)</small></th>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px", backgroundColor: "#BBF7D0", color: "#065F46", fontWeight: "bold" }}>Tổng điểm Tháng</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "10px", backgroundColor: "#BBF7D0", color: "#065F46", fontWeight: "bold" }}>Xếp hạng</th>
              </tr>
            </thead>
            <tbody>
              {teamCalculations
                .sort((a, b) => a.rank - b.rank)
                .map((t, idx) => (
                  <tr key={t.teamId} style={{ backgroundColor: idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF" }}>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", textAlign: "left", fontWeight: "bold", color: "#1E293B" }}>
                      {t.teamName} <span style={{ color: "#64748B", fontWeight: "normal", fontSize: "0.8rem" }}>({t.shortName})</span>
                    </td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", color: t.averages.nsnn >= 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                      {t.averages.nsnn > 0 ? `+${t.averages.nsnn.toFixed(2)}` : t.averages.nsnn.toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", color: t.averages.qln >= 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                      {t.averages.qln > 0 ? `+${t.averages.qln.toFixed(2)}` : t.averages.qln.toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", color: t.averages.tthc >= 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                      {t.averages.tthc > 0 ? `+${t.averages.tthc.toFixed(2)}` : t.averages.tthc.toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", color: t.averages.qldn >= 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                      {t.averages.qldn > 0 ? `+${t.averages.qldn.toFixed(2)}` : t.averages.qldn.toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", color: t.averages.hkd >= 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                      {t.averages.hkd > 0 ? `+${t.averages.hkd.toFixed(2)}` : t.averages.hkd.toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", color: t.averages.kt >= 0 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                      {t.averages.kt > 0 ? `+${t.averages.kt.toFixed(2)}` : t.averages.kt.toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", backgroundColor: "#DCFCE7", fontWeight: "bold", color: "#166534", fontSize: "0.95rem" }}>
                      {t.totalScore > 0 ? `+${t.totalScore.toFixed(2)}` : t.totalScore.toFixed(2)}
                    </td>
                    <td style={{ border: "1px solid #CBD5E1", padding: "8px 12px", backgroundColor: "#BBF7D0", fontWeight: "bold", color: "#065F46", textAlign: "center", fontSize: "1rem" }}>
                      #{t.rank}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      {/* TAB 2: DETAILED INDICATORS */}
      {activeTab === "indicators" && (
        <section className="demo-card" style={{ padding: "1.2rem" }}>
          {/* Controls Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "1rem", alignItems: "center" }}>
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: "bold", marginRight: "6px" }}>Lọc theo Tổ:</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
              >
                <option value="all">Toàn bộ 8 Tổ</option>
                {data.teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: "bold", marginRight: "6px" }}>Lĩnh vực:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
              >
                <option value="all">Tất cả lĩnh vực</option>
                <option value="NSNN">Thu NSNN</option>
                <option value="QLN">Quản lý nợ</option>
                <option value="TTHC">Thủ tục hành chính & DVC</option>
                <option value="QLDN">Quản lý doanh nghiệp</option>
                <option value="HKD">Cá nhân & Hộ kinh doanh</option>
                <option value="KT">Kiểm tra thuế</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: "200px" }}>
              <input
                type="text"
                placeholder="Tìm kiếm chỉ tiêu, mã nhiệm vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "6px 12px", borderRadius: "4px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const targetTeam = selectedTeam !== "all"
                  ? selectedTeam
                  : (account?.role === "lead" ? (data.teams[0]?.id || "HKD1") : (account?.teamId || "HKD1"));
                setEditingItem({
                  id: "",
                  taskDefinitionId: "",
                  teamId: targetTeam,
                  officerId: "",
                  assigned: 10,
                  completed: 0,
                  deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                  status: "in_progress",
                  updatedAt: new Date().toISOString(),
                });
                setIsEditModalOpen(true);
              }}
              style={{
                backgroundColor: "#16A34A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                padding: "7px 14px",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                whiteSpace: "nowrap"
              }}
            >
              <span>➕</span>
              <span>Nhập kết quả công việc</span>
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="kpi-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#1D4ED8", color: "#FFFFFF", textAlign: "center" }}>
                  <th style={{ border: "1px solid #CBD5E1", padding: "8px", width: "45px" }}>STT</th>
                  <th style={{ border: "1px solid #CBD5E1", padding: "8px", width: "120px" }}>Lĩnh vực</th>
                  <th style={{ border: "1px solid #CBD5E1", padding: "8px", textAlign: "left" }}>Tên Chỉ tiêu Đánh giá KPI</th>
                  <th style={{ border: "1px solid #CBD5E1", padding: "8px", width: "130px" }}>Định mức BQ ngành</th>
                  {selectedTeam === "all" ? (
                    data.teams.map((t) => (
                      <th key={t.id} style={{ border: "1px solid #CBD5E1", padding: "6px", width: "75px" }}>
                        {t.shortName}
                      </th>
                    ))
                  ) : (
                    <>
                      <th style={{ border: "1px solid #CBD5E1", padding: "8px", width: "120px" }}>Tỷ lệ thực hiện</th>
                      <th style={{ border: "1px solid #CBD5E1", padding: "8px", width: "100px", backgroundColor: "#FEF08A", color: "#854D0E" }}>Điểm đạt</th>
                    </>
                  )}
                  <th style={{ border: "1px solid #CBD5E1", padding: "8px", textAlign: "left", minWidth: "220px" }}>Nguyên tắc tính điểm Cục Thuế</th>
                  <th style={{ border: "1px solid #CBD5E1", padding: "8px", width: "95px", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredIndicators.map((ind, idx) => {
                  return (
                    <tr key={ind.id} style={{ backgroundColor: idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF" }}>
                      <td style={{ border: "1px solid #CBD5E1", padding: "6px", textAlign: "center", fontWeight: "bold", color: "#64748B" }}>
                        {idx + 1}
                      </td>
                      <td style={{ border: "1px solid #CBD5E1", padding: "6px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          backgroundColor: "#DBEAFE",
                          color: "#1E40AF"
                        }}>
                          {ind.categoryLabel}
                        </span>
                      </td>
                      <td style={{ border: "1px solid #CBD5E1", padding: "6px 10px", fontWeight: 600, color: "#1E293B" }}>
                        {ind.name}
                        <div style={{ fontSize: "0.75rem", color: "#94A3B8", fontWeight: "normal" }}>
                          Mã liên kết: <code>{ind.code}</code> | Nhiệm vụ: {ind.taskId}
                        </div>
                      </td>
                      <td style={{ border: "1px solid #CBD5E1", padding: "6px", textAlign: "center", backgroundColor: "#F1F5F9", color: "#475569", fontWeight: 600 }}>
                        {(ind.bq * 100).toFixed(1)}%
                      </td>

                      {selectedTeam === "all" ? (
                        teamCalculations.map((t) => {
                          const res = t.results[ind.id] || { rate: 0, score: 0 };
                          const color = res.score >= 0.5 ? "#16A34A" : res.score < 0 ? "#DC2626" : "#475569";
                          return (
                            <td key={t.teamId} style={{ border: "1px solid #CBD5E1", padding: "6px", textAlign: "center", fontWeight: "bold", color, backgroundColor: res.score >= 0.5 ? "#F0FDF4" : res.score < 0 ? "#FEF2F2" : "#FFFFFF" }}>
                              {res.score > 0 ? `+${res.score.toFixed(1)}` : res.score.toFixed(1)}
                            </td>
                          );
                        })
                      ) : (
                        (() => {
                          const t = teamCalculations.find((x) => x.teamId === selectedTeam);
                          const res = t?.results[ind.id] || { rate: 0, score: 0 };
                          const color = res.score >= 0.5 ? "#16A34A" : res.score < 0 ? "#DC2626" : "#475569";
                          return (
                            <>
                              <td style={{ border: "1px solid #CBD5E1", padding: "6px", textAlign: "right", fontWeight: 600 }}>
                                {(res.rate * 100).toFixed(1)}%
                              </td>
                              <td style={{ border: "1px solid #CBD5E1", padding: "6px", textAlign: "center", fontWeight: "bold", color, backgroundColor: "#FEF9C3" }}>
                                {res.score > 0 ? `+${res.score.toFixed(1)}` : res.score.toFixed(1)}
                              </td>
                            </>
                          );
                        })()
                      )}

                      <td style={{ border: "1px solid #CBD5E1", padding: "6px 10px", fontSize: "0.8rem", color: "#475569" }}>
                        {ind.note}
                      </td>
                      <td style={{ border: "1px solid #CBD5E1", padding: "6px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleEditIndicator(ind)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#1D4ED8",
                            backgroundColor: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            whiteSpace: "nowrap"
                          }}
                          title="Xem & Cập nhật số liệu nhiệm vụ này"
                        >
                          <span>✏️</span>
                          <span>Nhập/Sửa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: RULES & FRAMEWORK */}
      {activeTab === "rules" && (
        <section className="demo-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ color: "#1E3A8A", marginTop: 0 }}>
            Khung Định mức & Nguyên tắc Chấm điểm KPI Tháng (Cục Thuế TP Hà Nội)
          </h3>
          <p style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.6 }}>
            Bộ tiêu chí đánh giá định lượng công tác quản lý thuế của Cục Thuế TP Hà Nội được áp dụng thống nhất cho các Phòng chức năng và Thuế cơ sở.
            Điểm số hàng tháng dựa trên việc đối chiếu kết quả thực hiện của đơn vị với mức bình quân toàn ngành hoặc mức kế hoạch được Cục giao.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "1rem", backgroundColor: "#F8FAFC" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#0F172A" }}>1. Công tác Thu NSNN</h4>
              <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", lineHeight: 1.6, color: "#334155" }}>
                <li><strong>Thực thu lũy kế / DTPL:</strong> Cao hơn BQ ngành ≥5%: <code>+1.0 điểm</code>; cao hơn 0-5%: <code>+0.5 điểm</code>; thấp 0-5%: <code>0 điểm</code>; thấp 5-10%: <code>-0.5 điểm</code>; thấp &gt;10%: <code>-1.0 điểm</code>.</li>
                <li><strong>Thực thu / Ước thu tháng:</strong> Chênh lệch tuyệt đối từ 0-3%: <code>+1.0 điểm</code>; 3-5%: <code>+0.5 điểm</code>; 5-10%: <code>0 điểm</code>; 10-15%: <code>-0.5 điểm</code>; ngoài 15%: <code>-1.0 điểm</code>.</li>
                <li><strong>Tăng/giảm so cùng kỳ:</strong> Cao hơn từ 5%: <code>+1.0 điểm</code>; cao hơn 0-5%: <code>+0.5 điểm</code>.</li>
              </ul>
            </div>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "1rem", backgroundColor: "#F8FAFC" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#0F172A" }}>2. Công tác Quản lý Nợ thuế</h4>
              <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", lineHeight: 1.6, color: "#334155" }}>
                <li><strong>Tỷ lệ nợ tăng/giảm so đầu năm:</strong> Thấp hơn 5%: <code>+1.0 điểm</code>; thấp từ 0-5%: <code>+0.5 điểm</code>; cao hơn 0-5%: <code>-0.5 điểm</code>; cao hơn &gt;5%: <code>-1.0 điểm</code>.</li>
                <li><strong>Chỉ tiêu Nợ / Tổng thu:</strong> Cục giao dưới 8% (tổng nợ) và dưới 5% (nợ KNT, thuế phí). Đạt mức thấp hơn chỉ tiêu giao được cộng điểm.</li>
                <li><strong>Cưỡng chế & Tạm hoãn xuất cảnh:</strong> Vượt BQ ngành từ ≥5%: <code>+1.0 điểm</code>; vượt 0-5%: <code>+0.5 điểm</code>; kém 0-5%: <code>-0.5 điểm</code>; kém &gt;5%: <code>-1.0 điểm</code>.</li>
              </ul>
            </div>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "1rem", backgroundColor: "#F8FAFC" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#0F172A" }}>3. Thủ tục Hành chính & DVC</h4>
              <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", lineHeight: 1.6, color: "#334155" }}>
                <li><strong>Tồn quá hạn TTHC:</strong> Càng thấp càng tốt. Thấp hơn BQ ngành ≥5%: <code>+1.0 điểm</code>; thấp hơn 0-5%: <code>+0.5 điểm</code>; cao hơn: trừ điểm.</li>
                <li><strong>Đánh giá sự hài lòng NNT:</strong> Căn cứ mốc chuẩn 90%. Đạt ≥95%: <code>+1.0 điểm</code>; từ 90-95%: <code>+0.5 điểm</code>; 85-90%: <code>-0.5 điểm</code>; &lt;85%: <code>-1.0 điểm</code>.</li>
                <li><strong>Phản ánh Cổng DVCQG & BTC:</strong> 100% hồ sơ và câu hỏi trả lời đúng hạn.</li>
              </ul>
            </div>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "1rem", backgroundColor: "#F8FAFC" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#0F172A" }}>4. Quản lý Doanh nghiệp & HKD</h4>
              <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", lineHeight: 1.6, color: "#334155" }}>
                <li><strong>Rà soát TPR, Hóa đơn, Hệ số K:</strong> Nếu TB ngành &gt;95% thì đơn vị đạt cao hơn TB ngành được cộng tối đa <code>+1.0 điểm</code>.</li>
                <li><strong>Chiến dịch làm sạch MST:</strong> Hoàn thành tối thiểu 35% KPI năm 2026 đối với hồ sơ giải thể, đóng mã trạng thái 03, 06.</li>
                <li><strong>eTax Mobile & HĐĐT máy tính tiền:</strong> Đảm bảo tỷ lệ cài đặt, liên kết ngân hàng và sử dụng hóa đơn theo kế hoạch Cục giao.</li>
              </ul>
            </div>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: "8px", padding: "1rem", backgroundColor: "#F8FAFC" }}>
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#0F172A" }}>5. Công tác Kiểm tra thuế tại trụ sở NNT</h4>
              <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", lineHeight: 1.6, color: "#334155" }}>
                <li><strong>Kế hoạch kiểm tra & Kế hoạch đích danh:</strong> Hoàn thành vượt mức kế hoạch giao so với BQ toàn ngành (BQ kế hoạch 83.1%, đích danh 39.8%). Vượt ≥5%: <code>+1.0 điểm</code>; vượt 0-5%: <code>+0.5 điểm</code>.</li>
                <li><strong>Đôn đốc nộp NS qua kiểm tra:</strong> Tỷ lệ thực nộp tiền truy thu, ấn định và phạt vào NSNN (BQ ngành 94.7%).</li>
                <li><strong>Kiểm tra đóng mã số thuế, giải thể:</strong> Đảm bảo tiến độ kiểm tra đóng MST theo đúng quy định (BQ ngành 82.0%).</li>
                <li><strong>Số thu bình quân 01 cuộc kiểm tra:</strong> Đạt chỉ tiêu số thu, truy thu bình quân trên mỗi cuộc kiểm tra kết luận.</li>
                <li><strong>Giải quyết khiếu nại sau kiểm tra:</strong> Đạt 100% hồ sơ khiếu nại phát sinh sau kiểm tra được giải quyết đúng hạn, đúng pháp luật.</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {detailItems && (
        <DetailModal
          data={data}
          items={detailItems}
          onClose={() => setDetailItems(null)}
          onEdit={(item) => {
            setEditingItem(item);
            setIsEditModalOpen(true);
          }}
          onDelete={async (item) => {
            await deleteWorkItem(item.id);
            setDetailItems(null);
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
          setDetailItems((prev) => (prev ? prev.map((p) => (p.id === item.id ? item : p)) : null));
        }}
        onDelete={async (id) => {
          await deleteWorkItem(id);
          setDetailItems((prev) => (prev ? prev.filter((p) => p.id !== id) : null));
        }}
      />
    </>
  );
}
