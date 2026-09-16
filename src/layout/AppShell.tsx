import { useCallback, useEffect, useRef, useState, type ComponentType, type FormEvent } from "react";
import { useAppStore } from "../app/useAppStore";
import DashboardPage from "../pages/DashboardPage";
import MyWorkPage from "../pages/MyWorkPage";
import StaffPage from "../pages/StaffPage";
import ReportsPage from "../pages/ReportsPage";
import KpiPage from "../pages/KpiPage";
import MonthlyKpiPage from "../pages/MonthlyKpiPage";
import AlertsPage from "../pages/AlertsPage";
import CatalogPage from "../pages/CatalogPage";
import ImportPage from "../pages/ImportPage";
import HistoryPage from "../pages/HistoryPage";
import TaxLogo from "../components/TaxLogo";
import { changeUserPassword } from "../utils/auth";
import type { AppDataset } from "../domain/models";
import "../styles/demo.css";
type PageKey =
  | "dashboard"
  | "mywork"
  | "staff"
  | "reports"
  | "kpi"
  | "kpi_month"
  | "alerts"
  | "catalog"
  | "import"
  | "history";
const NAV: {
  id: PageKey;
  label: string;
  icon: string;
  page: ComponentType<{ data: AppDataset }>;
  leadOnly?: boolean;
}[] = [
  { id: "dashboard", label: "Tổng quan", icon: "▦", page: DashboardPage },
  { id: "mywork", label: "Công việc cá nhân", icon: "✓", page: MyWorkPage },
  { id: "staff", label: "Nhân sự & địa bàn", icon: "♙", page: StaffPage },
  { id: "reports", label: "Báo cáo", icon: "▤", page: ReportsPage },
  { id: "kpi", label: "Báo cáo KPI tuần", icon: "★", page: KpiPage },
  { id: "kpi_month", label: "Tiêu chí KPI tháng", icon: "◈", page: MonthlyKpiPage },
  { id: "alerts", label: "Cảnh báo", icon: "!", page: AlertsPage },
  { id: "catalog", label: "Danh mục nhiệm vụ", icon: "☷", page: CatalogPage },
  {
    id: "import",
    label: "Nhập dữ liệu Excel",
    icon: "⇧",
    page: ImportPage,
    leadOnly: true,
  },
  {
    id: "history",
    label: "Lịch sử thao tác",
    icon: "⏱",
    page: HistoryPage,
  },
];
export default function AppShell() {
  const { account, data, loading, error, logout, retryLoad, logAction } = useAppStore();
  const [page, setPage] = useState<PageKey>("dashboard");
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia?.("(max-width: 800px)").matches ?? false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeStatus, setChangeStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangeStatus(null);
    if (!account) return;

    if (newPassword !== confirmPassword) {
      setChangeStatus({ type: "error", text: "Mật khẩu mới và xác nhận mật khẩu không khớp." });
      return;
    }

    const result = changeUserPassword(account.id, oldPassword, newPassword);
    if (result.success) {
      logAction({
        userId: account.id,
        userName: account.label,
        userRole: account.role,
        teamId: account.role === "team" ? account.teamId : undefined,
        teamName: account.role === "team" ? (data?.teams.find((t) => t.id === account.teamId)?.name || account.teamId) : "Ban Lãnh đạo Thuế cơ sở 23",
        action: "CHANGE_PASSWORD",
        target: `Tài khoản ${account.id}`,
        details: `Đổi mật khẩu tài khoản thành công cho cán bộ ${account.label}`,
      });
      setChangeStatus({ type: "success", text: result.message });
      setTimeout(() => {
        setIsChangePassOpen(false);
        setChangeStatus(null);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
    } else {
      setChangeStatus({ type: "error", text: result.message });
    }
  }

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeMenu = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);
  useEffect(() => {
    const media = window.matchMedia?.("(max-width: 800px)");
    if (!media) return;
    const change = () => setIsMobile(media.matches);
    media.addEventListener?.("change", change);
    return () => media.removeEventListener?.("change", change);
  }, []);
  useEffect(() => {
    if (!isMobile || !open) return;
    navRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keys = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
      if (e.key !== "Tab") return;
      const nodes = [menuButtonRef.current, document.querySelector<HTMLElement>(".demo-shell .menu-overlay"), ...Array.from(navRef.current?.querySelectorAll<HTMLElement>("button") ?? [])].filter((x): x is HTMLElement => Boolean(x));
      const first=nodes[0],last=nodes.at(-1)!;
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    };
    document.addEventListener("keydown", keys);
    return () => document.removeEventListener("keydown", keys);
  }, [closeMenu, isMobile, open]);
  if (!account) return null;
  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#1D4ED8', fontSize: '1.1rem' }}>⏳ Đang tải dữ liệu…</div>;
  if (error)
    return (
      <main style={{ padding: '3rem', textAlign: 'center' }}>
        <p role="alert" style={{ color: '#DC2626', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>
        <button onClick={() => void retryLoad()} style={{ padding: '8px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Thử lại</button>
      </main>
    );
  if (!data) return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Đang khởi tạo dữ liệu đơn vị…</div>;
  const visible = NAV.filter((x) => !x.leadOnly || account.role === "lead");
  const active = visible.find((x) => x.id === page) ?? visible[0];
  const Page = active.page;
  const team = account.role === "team" ? data.teams[0]?.name : "Toàn đơn vị";
  return (
    <div className={`demo-shell ${open ? "menu-open" : ""}`}>
      <button
        ref={menuButtonRef}
        className="menu-toggle"
        aria-label="Mở menu"
        aria-expanded={open}
        aria-controls="main-navigation"
        aria-hidden={!isMobile}
        tabIndex={isMobile ? 0 : -1}
        onClick={() => setOpen((x) => !x)}
      >
        ☰
      </button>
      {open && (
        <button
          className="menu-overlay"
          aria-label="Đóng menu"
          onClick={closeMenu}
        />
      )}
      <aside className="demo-sidebar" aria-hidden={isMobile && !open}>
        <div className="demo-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TaxLogo size={38} />
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px' }}>THUẾ THÀNH PHỐ HÀ NỘI</div>
            <b style={{ fontSize: '0.92rem' }}>THUẾ CƠ SỞ 23</b>
          </div>
        </div>
        <nav ref={navRef} id="main-navigation" aria-label="Điều hướng chính">
          {visible.map((x) => (
            <button
              key={x.id}
              className={active.id === x.id ? "active" : ""}
              aria-current={active.id === x.id ? "page" : undefined}
              tabIndex={isMobile && !open ? -1 : 0}
              onClick={() => {
                setPage(x.id);
                if (isMobile) closeMenu(); else setOpen(false);
              }}
            >
              <span>{x.icon}</span>
              {x.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <small>PHẠM VI DỮ LIỆU</small>
          <b>{team}</b>
        </div>
      </aside>
      <div className="demo-main">
        <header className="demo-header">
          <div>
            <span className="breadcrumb">
              {active.label} / {team}
            </span>
            <b>HỆ THỐNG QUẢN LÝ CÔNG VIỆC</b>
          </div>
          <div className="account">
            <span className="avatar">{account.label.slice(0, 1)}</span>
            <div>
              <b>{account.label}</b>
              <small>
                {account.role === "lead" ? "Lãnh đạo" : "Tổ trưởng"} ({account.id})
              </small>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setPage("history")}
                style={{
                  background: page === "history" ? "#1D4ED8" : "#F1F5F9",
                  color: page === "history" ? "#FFFFFF" : "#334155",
                  border: "1px solid #CBD5E1",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title="Xem lịch sử thao tác của các user trên hệ thống"
              >
                <span>⏱</span> Lịch sử thao tác
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangeStatus(null);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setIsChangePassOpen(true);
                }}
                style={{
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  border: "1px solid #BFDBFE",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                🔑 Đổi mật khẩu
              </button>
              <button onClick={logout}>Đăng xuất</button>
            </div>
          </div>
        </header>
        <main className="demo-content">
          <Page data={data} />
        </main>
      </div>

      {isChangePassOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px"
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            width: "100%",
            maxWidth: "420px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
            padding: "24px",
            boxSizing: "border-box"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🔑</span> Đổi mật khẩu tài khoản
              </h3>
              <button
                type="button"
                onClick={() => setIsChangePassOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "#64748B",
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 16px 0", fontSize: "0.86rem", color: "#475569" }}>
              Tài khoản đang đăng nhập: <b>{account.label}</b> (<code>{account.id}</code>)
            </p>

            {changeStatus && (
              <div style={{
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "14px",
                fontSize: "0.85rem",
                backgroundColor: changeStatus.type === "success" ? "#ECFDF5" : "#FEF2F2",
                color: changeStatus.type === "success" ? "#065F46" : "#991B1B",
                border: `1px solid ${changeStatus.type === "success" ? "#A7F3D0" : "#FECACA"}`
              }}>
                {changeStatus.type === "success" ? "✓ " : "⚠️ "}
                {changeStatus.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.9rem",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsChangePassOpen(false)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    background: "#F8FAFC",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#1D4ED8",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
