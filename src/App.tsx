import { BrowserRouter } from 'react-router-dom';
import { Component, useState, type ErrorInfo, type ReactNode } from 'react';

import { AppStoreProvider } from './app/AppStore';
import { useAppStore } from './app/useAppStore';
import AppShell from './layout/AppShell';
import LoginPage from './pages/LoginPage';
import { ACCOUNTS } from './accounts';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Lỗi ứng dụng chưa bắt:", error, errorInfo);
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          padding: '1.5rem',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold'
              }}>
                !
              </div>
              <h2 style={{ margin: 0, color: '#0F172A', fontSize: '1.25rem' }}>
                Hệ thống phát hiện lỗi hiển thị
              </h2>
            </div>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              Bộ nhớ cache của trình duyệt có thể chứa dữ liệu phiên bản cũ hoặc chưa khớp với danh mục tiêu chí KPI tháng mới.
            </p>
            <div style={{
              backgroundColor: '#F1F5F9',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#334155',
              overflowX: 'auto',
              marginBottom: '1.5rem',
              border: '1px solid #CBD5E1'
            }}>
              {this.state.error?.message || String(this.state.error)}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                style={{
                  flex: 1,
                  backgroundColor: '#1D4ED8',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Xóa cache & Khôi phục dữ liệu mẫu
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#E2E8F0',
                  color: '#1E293B',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Tải lại
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { account, loading, error, retryLoad, restoreBackupFromLoadError, resetToSeedFromLoadError } = useAppStore();
  const [recoveryAccountId, setRecoveryAccountId] = useState('');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#1D4ED8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
          <p role="status" style={{ fontSize: '1rem', fontWeight: 600, color: '#334155' }}>
            Đang tải dữ liệu ứng dụng Quản lý công việc TCS23…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: '1rem',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ color: '#DC2626', marginTop: 0 }}>Thông báo hệ thống</h2>
          <p role="alert" style={{ color: '#475569', marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
              Tài khoản lãnh đạo khôi phục:
              <select
                aria-label="Tài khoản lãnh đạo khôi phục"
                value={recoveryAccountId}
                onChange={(event) => setRecoveryAccountId(event.target.value)}
                style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '8px' }}
              >
                <option value="">Chọn tài khoản lãnh đạo</option>
                {ACCOUNTS.filter((candidate) => candidate.role === 'lead').map((candidate) => (
                  <option value={candidate.id} key={candidate.id}>{candidate.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void retryLoad()}
              style={{ padding: '8px 14px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Thử lại
            </button>
            <button
              type="button"
              disabled={!recoveryAccountId}
              onClick={() => window.confirm('Khôi phục bản sao lưu gần nhất?') && void restoreBackupFromLoadError(recoveryAccountId)}
              style={{ padding: '8px 14px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Khôi phục bản sao lưu
            </button>
            <button
              type="button"
              disabled={!recoveryAccountId}
              onClick={() => window.confirm('Đặt lại về dữ liệu mẫu? Dữ liệu lỗi sẽ được sao lưu riêng.') && void resetToSeedFromLoadError(recoveryAccountId)}
              style={{ padding: '8px 14px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Đặt lại dữ liệu mẫu
            </button>
          </div>
        </div>
      </main>
    );
  }

  return account ? <AppShell /> : <LoginPage />;
}

function App() {
  return (
    <RootErrorBoundary>
      <BrowserRouter>
        <AppStoreProvider>
          <AppContent />
        </AppStoreProvider>
      </BrowserRouter>
    </RootErrorBoundary>
  );
}

export default App;
