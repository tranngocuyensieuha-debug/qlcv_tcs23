import { useMemo } from "react";
import type { AppDataset } from "../domain/models";

interface Indicator {
  id: string;
  name: string;
  category: "NSNN" | "QLN" | "TTHC" | "QLHT" | "KT";
  bq: number;
  type: "std" | "rev" | "sat" | "debt" | "std_revenue";
  taskId: string;
}

const INDICATORS: Indicator[] = [
  { id: "1.0", name: "Tỷ lệ số thực thu NSNN", category: "NSNN", bq: 0.71, type: "std_revenue", taskId: "THU" },
  { id: "4.0", name: "Tỷ lệ nợ tăng/giảm so với đầu năm (biên độ chênh lệch 20%)", category: "QLN", bq: 0.17, type: "debt", taskId: "NO" },
  { id: "9.0", name: "Tỷ lệ số lượng NNT đã thực hiện cưỡng chế/Số lượng phải thực hiện cưỡng chế", category: "QLN", bq: 0.56, type: "std", taskId: "CCN" },
  { id: "10.0", name: "Tỷ lệ số tiền đã thực hiện cưỡng chế/Số tiền phải thực hiện cưỡng chế", category: "QLN", bq: 0.90, type: "std", taskId: "CCN" },
  { id: "12.0", name: "Tỷ lệ số tiền đã thực hiện tạm hoãn xuất cảnh/Số tiền phải thực hiện THXC", category: "QLN", bq: 0.837, type: "std", taskId: "THXC" },
  { id: "15.0", name: "Tỷ lệ tồn quá hạn thực hiện TTHC (Đã loại trừ hoàn GTGT và TNCN, đóng mã)", category: "TTHC", bq: 0.10558, type: "rev", taskId: "TTHC" },
  { id: "16.0", name: "Tỷ lệ đánh giá sự hài lòng (hệ thống Cục Thuế)", category: "TTHC", bq: 0.90, type: "sat", taskId: "HCTH-HAILONG" },
  { id: "17.0", name: "Rà soát TPR", category: "QLHT", bq: 0.994, type: "std", taskId: "TPR" },
  { id: "18.0", name: "Xác minh hóa đơn", category: "QLHT", bq: 0.9923, type: "std", taskId: "HD" },
  { id: "19.0", name: "Hệ số K", category: "QLHT", bq: 0.9916, type: "std", taskId: "HSK" },
  { id: "22.0", name: "Đóng mã giải thể phát sinh mới", category: "QLHT", bq: 0.50, type: "std", taskId: "DKT" },
  { id: "21.0", name: "Đóng mã giải thể theo gói của Phòng QLDN3", category: "QLHT", bq: 0.2909, type: "std", taskId: "QLDN-CHUYENDE" },
  { id: "25.0", name: "Tỷ lệ số tồn quá hạn thuế TNCN", category: "QLHT", bq: 0.0075, type: "rev", taskId: "QLDN-HOANTNCN" },
  { id: "23.0", name: "Tỷ lệ hoàn thành gói TNCN nhiều nguồn 2025", category: "QLHT", bq: 1.0, type: "std", taskId: "QLDN-GOINGUON2025" },
  { id: "34.0", name: "Tỷ lệ hoàn thành chỉ tiêu kiểm tra tại trụ sở NNT", category: "KT", bq: 0.62, type: "std", taskId: "QLDN-KTTB" },
  { id: "35.0", name: "Tỷ lệ đôn đốc nộp truy thu, xử phạt", category: "KT", bq: 0.92, type: "std", taskId: "QLDN-XPVPHC" },
];

function calculateScore(rate: number, bq: number, type: Indicator["type"]) {
  if (type === "std_revenue") {
    if (rate >= bq + 0.05) return 1.0;
    if (rate >= bq) return 0.5;
    if (rate >= bq - 0.05) return 0.0;
    if (rate >= bq - 0.1) return -0.5;
    return -1.0;
  }
  if (type === "debt") {
    if (rate >= 0.2) return -1.0;
    if (rate >= 0) return -0.5;
    if (rate >= -0.2) return 0.5;
    return 1.0;
  }
  if (type === "std") {
    if (rate >= bq + 0.05) return 1.0;
    if (rate >= bq) return 0.5;
    if (rate >= bq - 0.05) return -0.5;
    return -1.0;
  }
  if (type === "rev") {
    if (rate >= bq + 0.05) return -1.0;
    if (rate >= bq) return -0.5;
    if (rate >= bq - 0.05) return 0.5;
    return 1.0;
  }
  if (type === "sat") {
    if (rate >= 0.95) return 1.0;
    if (rate >= 0.9) return 0.5;
    if (rate >= 0.85) return -0.5;
    return -1.0;
  }
  return 0;
}

export default function KpiPage({ data }: { data: AppDataset }) {
  const tableData = useMemo(() => {
    // Calculate performance rates and scores for each team
    const teamScores = data.teams.map((t) => {
      const rowResults: Record<string, { rate: number; score: number }> = {};
      
      INDICATORS.forEach((ind) => {
        const items = data.workItems.filter(
          (w) => w.teamId === t.id && w.taskDefinitionId === ind.taskId
        );
        const assigned = items.reduce((sum, w) => sum + w.assigned, 0);
        const completed = items.reduce((sum, w) => sum + w.completed, 0);
        const rate = assigned > 0 ? completed / assigned : 0;
        const score = calculateScore(rate, ind.bq, ind.type);
        
        rowResults[ind.id] = { rate, score };
      });
      
      // Calculate category average scores
      const nsnn_avg = rowResults["1.0"]?.score ?? 0;
      
      const qln_scores = ["4.0", "9.0", "10.0", "12.0"].map((id) => rowResults[id]?.score ?? 0);
      const qln_avg = qln_scores.reduce((a, b) => a + b, 0) / qln_scores.length;
      
      const tthc_scores = ["15.0", "16.0"].map((id) => rowResults[id]?.score ?? 0);
      const tthc_avg = tthc_scores.reduce((a, b) => a + b, 0) / tthc_scores.length;
      
      const qlht_scores = ["17.0", "18.0", "19.0", "22.0", "21.0", "25.0", "23.0"].map((id) => rowResults[id]?.score ?? 0);
      const qlht_avg = qlht_scores.reduce((a, b) => a + b, 0) / qlht_scores.length;
      
      const kt_scores = ["34.0", "35.0"].map((id) => rowResults[id]?.score ?? 0);
      const kt_avg = kt_scores.reduce((a, b) => a + b, 0) / kt_scores.length;
      
      const total = nsnn_avg + qln_avg + tthc_avg + qlht_avg + kt_avg;
      
      return {
        teamId: t.id,
        teamName: t.name,
        rowResults,
        averages: {
          nsnn: nsnn_avg,
          qln: qln_avg,
          tthc: tthc_avg,
          qlht: qlht_avg,
          kt: kt_avg,
        },
        total,
      };
    });
    
    // Sort to assign rankings
    const sorted = [...teamScores].sort((a, b) => b.total - a.total);
    const ranked = teamScores.map((t) => {
      const rank = sorted.findIndex((s) => s.teamId === t.teamId) + 1;
      return { ...t, rank };
    });
    
    return ranked;
  }, [data]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1>Báo cáo KPI tuần</h1>
        <small className="text-muted">Tính toán tự động theo tiêu chí đánh giá của Văn phòng</small>
      </div>

      <section className="demo-card" style={{ padding: "1.5rem" }}>
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <table className="kpi-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "1800px", fontSize: "0.85rem" }}>
            <thead>
              {/* Row 1 Headers */}
              <tr style={{ backgroundColor: "#1D4ED8", color: "#FFFFFF", textAlign: "center" }}>
                <th rowSpan={2} style={{ border: "1px solid #CBD5E1", padding: "8px", verticalAlign: "middle", minWidth: "200px" }}>Đơn vị (Tổ)</th>
                
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Chỉ tiêu Tỷ lệ số thực thu NSNN</th>
                <th rowSpan={2} style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", color: "#065F46", verticalAlign: "middle" }}>Tổng điểm TB Thu NSNN</th>
                
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ nợ tăng/giảm so với đầu năm</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ số lượng NNT cưỡng chế</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ số tiền cưỡng chế</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ số tiền tạm hoãn xuất cảnh</th>
                <th rowSpan={2} style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", color: "#065F46", verticalAlign: "middle" }}>Tổng điểm TB QLN</th>
                
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ tồn quá hạn TTHC</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ hài lòng NNT</th>
                <th rowSpan={2} style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", color: "#065F46", verticalAlign: "middle" }}>Tổng điểm TB TTHC</th>
                
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Rà soát TPR</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Xác minh hóa đơn</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Hệ số K</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Đóng mã giải thể phát sinh mới</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Đóng mã giải thể theo gói</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ tồn quá hạn thuế TNCN</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ hoàn thành gói TNCN</th>
                <th rowSpan={2} style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", color: "#065F46", verticalAlign: "middle" }}>Tổng điểm TB Quản lý hỗ trợ</th>
                
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ kiểm tra tại trụ sở</th>
                <th colSpan={3} style={{ border: "1px solid #CBD5E1", padding: "8px" }}>Tỷ lệ đôn đốc nộp truy thu</th>
                <th rowSpan={2} style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", color: "#065F46", verticalAlign: "middle" }}>Tổng điểm TB Kiểm tra</th>
                
                <th rowSpan={2} style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", color: "#065F46", fontWeight: "bold", verticalAlign: "middle" }}>Tổng điểm</th>
                <th rowSpan={2} style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", color: "#065F46", fontWeight: "bold", verticalAlign: "middle" }}>Xếp hạng</th>
              </tr>
              {/* Row 2 Subheaders */}
              <tr style={{ backgroundColor: "#DBEAFE", color: "#1E3A8A", fontSize: "0.75rem" }}>
                {/* NSNN */}
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                
                {/* QLN */}
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                
                {/* TTHC */}
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Đối chiếu 90%</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                
                {/* QLHT */}
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                
                {/* KT */}
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px" }}>Tỷ lệ</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#F1F5F9" }}>Định mức</th>
                <th style={{ border: "1px solid #CBD5E1", padding: "4px", backgroundColor: "#FEF08A" }}>Điểm</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rIdx) => (
                <tr key={row.teamId} style={{ backgroundColor: rIdx % 2 === 0 ? "#F8FAFC" : "#FFFFFF", textAlign: "right" }}>
                  {/* Team Name */}
                  <td style={{ border: "1px solid #CBD5E1", padding: "8px", textAlign: "left", fontWeight: "bold" }}>{row.teamName}</td>
                  
                  {/* Loop through indicators */}
                  {INDICATORS.map((ind) => {
                    const result = row.rowResults[ind.id] || { rate: 0, score: 0 };
                    return (
                      <tr key={ind.id} style={{ display: "contents" }}>
                        <td style={{ border: "1px solid #CBD5E1", padding: "6px" }}>{(result.rate * 100).toFixed(1)}%</td>
                        <td style={{ border: "1px solid #CBD5E1", padding: "6px", backgroundColor: "#F1F5F9", color: "#64748B" }}>{(ind.bq * 100).toFixed(1)}%</td>
                        <td style={{ border: "1px solid #CBD5E1", padding: "6px", backgroundColor: "#FEF9C3", fontWeight: "bold", color: result.score >= 0.5 ? "#16A34A" : result.score < 0 ? "#DC2626" : "#475569" }}>{result.score > 0 ? `+${result.score.toFixed(1)}` : result.score.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                  
                  {/* Merged Category Averages */}
                  <td style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#DCFCE7", fontWeight: "bold", color: "#166534" }}>{row.averages.nsnn.toFixed(2)}</td>
                  <td style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#DCFCE7", fontWeight: "bold", color: "#166534" }}>{row.averages.qln.toFixed(2)}</td>
                  <td style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#DCFCE7", fontWeight: "bold", color: "#166534" }}>{row.averages.tthc.toFixed(2)}</td>
                  <td style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#DCFCE7", fontWeight: "bold", color: "#166534" }}>{row.averages.qlht.toFixed(2)}</td>
                  <td style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#DCFCE7", fontWeight: "bold", color: "#166534" }}>{row.averages.kt.toFixed(2)}</td>
                  
                  {/* Total and Rank */}
                  <td style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", fontWeight: "bold", color: "#166534", fontSize: "0.95rem" }}>{row.total.toFixed(2)}</td>
                  <td style={{ border: "1px solid #CBD5E1", padding: "8px", backgroundColor: "#BBF7D0", fontWeight: "bold", color: "#166534", textAlign: "center", fontSize: "0.95rem" }}>{row.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Evaluation rules reference summary */}
      <section className="demo-card" style={{ marginTop: "1.5rem", padding: "1.2rem" }}>
        <h3>Quy tắc tính điểm thi đua KPI (Văn phòng Cục):</h3>
        <ul style={{ paddingLeft: "20px", fontSize: "0.85rem", lineHeight: "1.6" }}>
          <li><strong>Thu NSNN:</strong> Vượt định mức ≥5%: +1.0 điểm; ≥0%: +0.5 điểm; dưới định mức từ 0-5%: 0 điểm; từ 5-10%: -0.5 điểm; &gt;10%: -1.0 điểm.</li>
          <li><strong>Quản lý nợ thuế:</strong> Nợ tăng ≥20%: -1.0 điểm; nợ tăng 0-20%: -0.5 điểm; nợ giảm 0-20%: +0.5 điểm; nợ giảm &gt;20%: +1.0 điểm.</li>
          <li><strong>Các chỉ tiêu thông thường khác:</strong> Vượt định mức ≥5%: +1.0 điểm; ≥0%: +0.5 điểm; kém định mức 0-5%: -0.5 điểm; &gt;5%: -1.0 điểm.</li>
          <li><strong>Các chỉ tiêu tồn đọng (Càng thấp càng tốt):</strong> Thấp hơn định mức ≥5%: +1.0 điểm; ≥0%: +0.5 điểm; cao hơn định mức 0-5%: -0.5 điểm; &gt;5%: -1.0 điểm.</li>
          <li><strong>Đánh giá sự hài lòng:</strong> Đạt ≥95%: +1.0 điểm; ≥90%: +0.5 điểm; từ 85-90%: -0.5 điểm; dưới 85%: -1.0 điểm.</li>
        </ul>
      </section>
    </>
  );
}
