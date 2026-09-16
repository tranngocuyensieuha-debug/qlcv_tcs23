import { useState, type FormEvent } from 'react';

import { USER_ACCOUNTS, LEGACY_ACCOUNTS, findAccount } from '../accounts';
import { useAppStore } from '../app/useAppStore';
import TaxLogo from '../components/TaxLogo';
import { changeUserPassword, DEFAULT_PASSWORD, verifyPassword } from '../utils/auth';

export default function LoginPage() {
  const { login } = useAppStore();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [customUsername, setCustomUsername] = useState('');
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Change password modal state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changeUser, setChangeUser] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeStatus, setChangeStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Guide panel collapse state
  const [showDirectory, setShowDirectory] = useState(false);

  // Effective username
  const effectiveUsername = customUsername.trim() || selectedAccountId;

  function handleSelectAccount(val: string) {
    setSelectedAccountId(val);
    if (val) {
      setCustomUsername(val);
      setErrorMessage('');
    }
  }

  function handleQuickPick(username: string) {
    setCustomUsername(username);
    setSelectedAccountId(username);
    setPassword(DEFAULT_PASSWORD);
    setErrorMessage('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage('');

    const targetUser = effectiveUsername.trim();
    if (!targetUser) {
      setErrorMessage('Vui lòng chọn hoặc nhập tên đăng nhập.');
      return;
    }

    const account = findAccount(targetUser);
    if (!account) {
      setErrorMessage(`Tên đăng nhập "${targetUser}" không tồn tại trong hệ thống.`);
      return;
    }

    // Verify password
    if (!verifyPassword(account.id, password)) {
      setErrorMessage('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      return;
    }

    // Execute login
    const ok = login(account.id);
    if (!ok) {
      setErrorMessage('Không thể đăng nhập phiên làm việc.');
    }
  }

  function handleChangePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setChangeStatus(null);

    const user = changeUser.trim();
    if (!user) {
      setChangeStatus({ type: 'error', text: 'Vui lòng chọn hoặc nhập tên đăng nhập.' });
      return;
    }

    const account = findAccount(user);
    if (!account) {
      setChangeStatus({ type: 'error', text: `Tài khoản "${user}" không tồn tại.` });
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeStatus({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp.' });
      return;
    }

    const result = changeUserPassword(account.id, oldPassword, newPassword);
    if (result.success) {
      setChangeStatus({ type: 'success', text: result.message });
      setPassword(newPassword);
      setCustomUsername(account.id);
      setSelectedAccountId(account.id);
      setTimeout(() => {
        setIsChangingPassword(false);
        setChangeStatus(null);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } else {
      setChangeStatus({ type: 'error', text: result.message });
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      backgroundImage: 'radial-gradient(circle at 50% 20%, #1E293B 0%, #0F172A 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Top Banner Ribbon */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        color: '#FFFFFF'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 18px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(185, 28, 28, 0.35)',
          border: '1px solid rgba(220, 38, 38, 0.45)',
          color: '#FCA5A5',
          fontSize: '0.85rem',
          fontWeight: 700,
          letterSpacing: '1px',
          marginBottom: '8px',
          textTransform: 'uppercase'
        }}>
          ★ THUẾ THÀNH PHỐ HÀ NỘI ★
        </div>
        <h2 style={{
          margin: '4px 0',
          fontSize: '1.6rem',
          fontWeight: 900,
          letterSpacing: '0.5px',
          color: '#FEF08A',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          THUẾ CƠ SỞ 23 THÀNH PHỐ HÀ NỘI
        </h2>
        <div style={{ fontSize: '0.88rem', color: '#94A3B8', fontWeight: 500 }}>
          Hệ thống Quản lý công việc & Chỉ đạo điều hành nội bộ
        </div>
      </div>

      {/* Main Login Card */}
      <div style={{
        maxWidth: '460px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        padding: '32px 28px',
        position: 'relative'
      }}>
        {/* Header with State Tax Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-block', marginBottom: '10px' }}>
            <TaxLogo size={84} />
          </div>
          <h1 style={{
            margin: '0 0 4px 0',
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#0F172A'
          }}>
            Đăng nhập hệ thống
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
            Nhập tên đăng nhập và mật khẩu được cấp để truy cập
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div role="alert" style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#991B1B',
            fontSize: '0.85rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form login */}
        <form onSubmit={handleSubmit}>
          {/* Username Input / Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="account" style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '6px'
            }}>
              Tài khoản / Tên đăng nhập
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="accountInput"
                type="text"
                value={customUsername}
                onChange={(e) => {
                  setCustomUsername(e.target.value);
                  setSelectedAccountId(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Ví dụ: vtthang, nvanh, ttnuyen..."
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.95rem',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1D4ED8'}
                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
              />
            </div>

            {/* Quick dropdown for easy selection */}
            <div style={{ marginTop: '6px' }}>
              <select
                id="account"
                aria-label="Tài khoản"
                value={selectedAccountId}
                onChange={(e) => handleSelectAccount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px dashed #94A3B8',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.82rem',
                  color: '#475569',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">-- Hoặc chọn nhanh từ danh mục cán bộ --</option>
                <optgroup label="Ban Lãnh đạo (4 user)">
                  {USER_ACCOUNTS.filter((a) => a.role === 'lead').map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.username} - {account.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Tổ trưởng / Tổ phó phụ trách (8 user)">
                  {USER_ACCOUNTS.filter((a) => a.role === 'team').map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.username} - {account.label}
                    </option>
                  ))}
                </optgroup>
                {/* Legacy options to guarantee test compatibility */}
                <optgroup label="Tài khoản hệ thống (tương thích)">
                  {LEGACY_ACCOUNTS.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.id} - {account.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="passwordInput" style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#334155'
              }}>
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => {
                  setChangeUser(effectiveUsername);
                  setOldPassword(password);
                  setIsChangingPassword(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.8rem',
                  color: '#1D4ED8',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Đổi mật khẩu?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="passwordInput"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Nhập mật khẩu..."
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '0.95rem',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#64748B'
                }}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#B91C1C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(185, 28, 28, 0.3)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#991B1B')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
          >
            <span>🔓</span>
            <span>Đăng nhập</span>
          </button>
        </form>

        {/* Collapsible Directory Toggle */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '14px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowDirectory(!showDirectory)}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📖 Tra cứu danh bạ tài khoản (4 Lãnh đạo, 8 Tổ trưởng / Tổ phó)</span>
            <span>{showDirectory ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Directory details */}
        {showDirectory && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            fontSize: '0.8rem',
            maxHeight: '260px',
            overflowY: 'auto'
          }}>
            <div style={{ fontWeight: 700, color: '#991B1B', marginBottom: '6px' }}>
              👑 4 TÀI KHOẢN LÃNH ĐẠO:
            </div>
            {USER_ACCOUNTS.filter(a => a.role === 'lead').map(a => (
              <div
                key={a.id}
                onClick={() => handleQuickPick(a.username)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: customUsername === a.username ? '#FEF3C7' : 'transparent',
                  marginBottom: '2px'
                }}
              >
                <span><strong>{a.fullName}</strong></span>
                <span style={{ fontFamily: 'monospace', color: '#1D4ED8', fontWeight: 600 }}>{a.username}</span>
              </div>
            ))}

            <div style={{ fontWeight: 700, color: '#1E3A8A', marginTop: '10px', marginBottom: '6px' }}>
              🏢 8 TÀI KHOẢN TỔ TRƯỞNG / TỔ PHÓ:
            </div>
            {USER_ACCOUNTS.filter(a => a.role === 'team').map(a => (
              <div
                key={a.id}
                onClick={() => handleQuickPick(a.username)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: customUsername === a.username ? '#EFF6FF' : 'transparent',
                  marginBottom: '2px'
                }}
              >
                <span><strong>{a.fullName}</strong> <small style={{ color: '#64748B' }}>({a.unit.replace('Tổ Quản lý, hỗ trợ ', 'Tổ ')})</small></span>
                <span style={{ fontFamily: 'monospace', color: '#1D4ED8', fontWeight: 600 }}>{a.username}</span>
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: '8px', color: '#64748B', fontStyle: 'italic', fontSize: '0.75rem' }}>
              (Nhấp vào tên cán bộ bất kỳ để tự động điền)
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ĐỔI MẬT KHẨU */}
      {isChangingPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0F172A', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔐</span> Đổi mật khẩu
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setChangeStatus(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {changeStatus && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '14px',
                backgroundColor: changeStatus.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                color: changeStatus.type === 'success' ? '#065F46' : '#991B1B',
                border: changeStatus.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA'
              }}>
                {changeStatus.text}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={changeUser}
                  onChange={(e) => setChangeUser(e.target.value)}
                  placeholder="Nhập tên đăng nhập (vd: vtthang)..."
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Lưu mật khẩu mới
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  style={{
                    backgroundColor: '#E2E8F0',
                    color: '#334155',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
