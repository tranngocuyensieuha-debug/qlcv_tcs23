import { useMemo, useState } from "react";
import type { AppDataset } from "../domain/models";
import { useAppStore } from "../app/useAppStore";
import { USER_ACCOUNTS } from "../accounts";
import type { AuditActionType, AuditLogEntry } from "../utils/auditLogger";
import KpiCard from "../components/KpiCard";
import EmptyState from "../components/EmptyState";
import { Filters } from "./pageUtils";

export default function HistoryPage({ data }: { data: AppDataset }) {
  const { account, auditLogs, clearAuditLogs } = useAppStore();

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const isLead = account?.role === "lead";

  // Scope logs based on user role
  const scopedLogs = useMemo(() => {
    if (isLead) return auditLogs;
    // Team users only see their own actions and actions within their team
    return auditLogs.filter(
      (log) => log.userId === account?.id || log.teamId === account?.teamId
    );
  }, [auditLogs, isLead, account]);

  // Filter scoped logs by search criteria
  const filteredLogs = useMemo(() => {
    return scopedLogs.filter((log) => {
      // Filter by User
      if (selectedUser && log.userId !== selectedUser) return false;

      // Filter by Team
      if (selectedTeam) {
        if (selectedTeam === "LEAD" && log.userRole !== "lead") return false;
        if (selectedTeam !== "LEAD" && log.teamId !== selectedTeam) return false;
      }

      // Filter by Action
      if (selectedAction && log.action !== selectedAction) return false;

      // Filter by Date range
      if (startDate) {
        const logDate = log.timestamp.slice(0, 10);
        if (logDate < startDate) return false;
      }
      if (endDate) {
        const logDate = log.timestamp.slice(0, 10);
        if (logDate > endDate) return false;
      }

      // Search keyword
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchUser = log.userName.toLowerCase().includes(term) || log.userId.toLowerCase().includes(term);
        const matchAction = log.badge.label.toLowerCase().includes(term);
        const matchTarget = (log.target || "").toLowerCase().includes(term);
        const matchDetails = log.details.toLowerCase().includes(term);
        const matchTeam = (log.teamName || "").toLowerCase().includes(term);
        if (!matchUser && !matchAction && !matchTarget && !matchDetails && !matchTeam) {
          return false;
        }
      }

      return true;
    });
  }, [scopedLogs, selectedUser, selectedTeam, selectedAction, startDate, endDate, searchTerm]);

  // Statistics
  const totalLogs = filteredLogs.length;
  const workUpdatesCount = filteredLogs.filter(
    (l) => l.action === "UPDATE_WORK" || l.action === "CREATE_WORK"
  ).length;
  const loginCount = filteredLogs.filter((l) => l.action === "LOGIN").length;
  const excelCount = filteredLogs.filter((l) => l.action === "IMPORT_EXCEL").length;

  // Format date-time for Vietnamese display
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch {
      return isoString;
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["STT", "Thời gian", "Tài khoản", "Họ và tên", "Đơn vị / Chức vụ", "Hành động", "Đối tượng", "Chi tiết thay đổi"];
    const rows = filteredLogs.map((log, index) => [
      index + 1,
      formatDateTime(log.timestamp),
      log.userId,
      `"${log.userName}"`,
      `"${log.teamName || 'Ban Lãnh đạo'}"`,
      `"${log.badge.label}"`,
      `"${log.target || ''}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Nhat_ky_thao_tac_TCS23_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Available users for dropdown
  const availableUsers = useMemo(() => {
    if (isLead) return USER_ACCOUNTS;
    return USER_ACCOUNTS.filter(
      (u) => u.id === account?.id || (u.role === "team" && u.teamId === account?.teamId)
    );
  }, [isLead, account]);

  const handleClear = () => {
    if (!isLead) return;
    if (window.confirm("Đồng chí có chắc chắn muốn xóa toàn bộ lịch sử thao tác hệ thống không?")) {
      clearAuditLogs();
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1>Lịch sử thao tác hệ thống</h1>
          <p className="demo-subtitle">
            Theo dõi chi tiết lịch sử đăng nhập, nhập liệu, cập nhật kết quả công việc và các thay đổi dữ liệu của từng cán bộ trên hệ thống.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              backgroundColor: "#1D4ED8",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "9px 16px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(29, 78, 216, 0.2)",
            }}
          >
            <span>📥</span>
            <span>Xuất file Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              backgroundColor: "#FFFFFF",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              padding: "9px 14px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⎙</span>
            <span>In nhật ký</span>
          </button>

          {isLead && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                padding: "9px 12px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
              title="Chỉ dành cho Lãnh đạo: Xóa toàn bộ nhật ký kiểm toán"
            >
              <span>🗑️</span>
              <span>Xóa nhật ký</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="demo-kpis">
        <KpiCard label="Tổng lượt thao tác" value={totalLogs} />
        <KpiCard label="Cập nhật kết quả" value={workUpdatesCount} />
        <KpiCard label="Lượt đăng nhập" value={loginCount} />
        <KpiCard label="Nạp file Excel" value={excelCount} />
      </div>

      {/* Filters Bar */}
      <Filters>
        {/* User filter */}
        <select
          aria-label="Người thực hiện"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Tất cả người thao tác ({availableUsers.length} tài khoản)</option>
          {availableUsers.map((u) => (
            <option value={u.id} key={u.id}>
              {u.fullName} ({u.username} - {u.position})
            </option>
          ))}
        </select>

        {/* Team filter (for leads) */}
        {isLead && (
          <select
            aria-label="Tổ / Đơn vị"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">Tất cả đơn vị (8 Tổ & Lãnh đạo)</option>
            <option value="LEAD">Ban Lãnh đạo</option>
            {data.teams.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        {/* Action filter */}
        <select
          aria-label="Loại hành động"
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
        >
          <option value="">Tất cả loại hành động</option>
          <option value="UPDATE_WORK">✏️ Cập nhật kết quả công việc</option>
          <option value="CREATE_WORK">➕ Tạo công việc mới</option>
          <option value="DELETE_WORK">🗑️ Xóa công việc</option>
          <option value="LOGIN">🔑 Đăng nhập hệ thống</option>
          <option value="LOGOUT">🚪 Đăng xuất</option>
          <option value="CHANGE_PASSWORD">🔒 Đổi mật khẩu</option>
          <option value="IMPORT_EXCEL">📊 Nhập file Excel</option>
          <option value="RESTORE_BACKUP">🔄 Khôi phục sao lưu</option>
          <option value="RESET_SEED">⚠️ Đặt lại dữ liệu</option>
        </select>

        {/* Search keyword */}
        <input
          type="text"
          placeholder="Tìm theo nội dung, mã công việc, cán bộ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: "220px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
        />

        {/* Date filter */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "#475569" }}>
          <span>Từ:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
          />
          <span>Đến:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
          />
          {(selectedUser || selectedTeam || selectedAction || searchTerm || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSelectedUser("");
                setSelectedTeam("");
                setSelectedAction("");
                setSearchTerm("");
                setStartDate("");
                setEndDate("");
              }}
              style={{
                backgroundColor: "#F1F5F9",
                border: "1px solid #CBD5E1",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "0.8rem",
                color: "#475569",
                cursor: "pointer",
              }}
            >
              ✕ Xóa lọc
            </button>
          )}
        </div>
      </Filters>

      {/* Audit History Table */}
      <section className="demo-card" style={{ padding: 0, overflow: "hidden" }}>
        {filteredLogs.length ? (
          <div className="demo-table-wrap">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", width: "150px" }}>Thời gian</th>
                  <th style={{ padding: "12px 14px", width: "190px" }}>Người thực hiện</th>
                  <th style={{ padding: "12px 14px", width: "160px" }}>Đơn vị / Chức vụ</th>
                  <th style={{ padding: "12px 14px", width: "160px" }}>Hành động</th>
                  <th style={{ padding: "12px 14px", width: "150px" }}>Đối tượng</th>
                  <th style={{ padding: "12px 14px" }}>Nội dung chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const badge = log.badge;
                  return (
                    <tr
                      key={log.id || idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FBFCFD",
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#FFFFFF" : "#FBFCFD")}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: "10px 14px", color: "#64748B", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {formatDateTime(log.timestamp)}
                      </td>

                      {/* User */}
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1E293B" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "1rem" }}>👤</span>
                          <div>
                            <div>{log.userName}</div>
                            <code style={{ fontSize: "0.72rem", color: "#64748B", backgroundColor: "#F1F5F9", padding: "1px 4px", borderRadius: "3px" }}>
                              {log.userId}
                            </code>
                          </div>
                        </div>
                      </td>

                      {/* Team / Role */}
                      <td style={{ padding: "10px 14px", color: "#475569", fontSize: "0.82rem" }}>
                        {log.teamName ? (
                          <span style={{ fontWeight: 600, color: "#2563EB" }}>
                            {log.teamName}
                          </span>
                        ) : (
                          <span style={{ fontWeight: 600, color: "#059669" }}>
                            Ban Lãnh đạo
                          </span>
                        )}
                      </td>

                      {/* Action Badge */}
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: badge.color,
                            backgroundColor: badge.bg,
                            border: `1px solid ${badge.border}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Target */}
                      <td style={{ padding: "10px 14px", color: "#334155" }}>
                        {log.target ? (
                          <code style={{ fontSize: "0.76rem", padding: "2px 6px", backgroundColor: "#F1F5F9", borderRadius: "4px", color: "#0F172A", border: "1px solid #E2E8F0" }}>
                            {log.target}
                          </code>
                        ) : (
                          <span style={{ color: "#94A3B8" }}>-</span>
                        )}
                      </td>

                      {/* Details */}
                      <td style={{ padding: "10px 14px", color: "#1E293B", lineHeight: 1.45 }}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "2rem" }}>
            <EmptyState message="Không tìm thấy lịch sử thao tác nào khớp với điều kiện lọc" />
          </div>
        )}
      </section>
    </>
  );
}
