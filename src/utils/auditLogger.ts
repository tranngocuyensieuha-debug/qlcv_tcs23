export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CHANGE_PASSWORD'
  | 'CREATE_WORK'
  | 'UPDATE_WORK'
  | 'DELETE_WORK'
  | 'IMPORT_EXCEL'
  | 'RESTORE_BACKUP'
  | 'RESET_SEED';

export interface AuditActionBadge {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  userId: string;
  userName: string;
  userRole: 'lead' | 'team';
  teamId?: string;
  teamName?: string;
  action: AuditActionType;
  target?: string;
  details: string;
  badge: AuditActionBadge;
}

export const AUDIT_STORAGE_KEY = 'tcs23_audit_logs';

export function getActionBadge(action: AuditActionType): AuditActionBadge {
  switch (action) {
    case 'LOGIN':
      return {
        label: 'Đăng nhập',
        color: '#1E40AF',
        bg: '#DBEAFE',
        border: '#93C5FD',
        icon: '🔑',
      };
    case 'LOGOUT':
      return {
        label: 'Đăng xuất',
        color: '#475569',
        bg: '#F1F5F9',
        border: '#CBD5E1',
        icon: '🚪',
      };
    case 'CHANGE_PASSWORD':
      return {
        label: 'Đổi mật khẩu',
        color: '#854D0E',
        bg: '#FEF9C3',
        border: '#FDE047',
        icon: '🔒',
      };
    case 'CREATE_WORK':
      return {
        label: 'Tạo công việc',
        color: '#065F46',
        bg: '#D1FAE5',
        border: '#6EE7B7',
        icon: '➕',
      };
    case 'UPDATE_WORK':
      return {
        label: 'Cập nhật kết quả',
        color: '#166534',
        bg: '#DCFCE7',
        border: '#86EFAC',
        icon: '✏️',
      };
    case 'DELETE_WORK':
      return {
        label: 'Xóa công việc',
        color: '#991B1B',
        bg: '#FEE2E2',
        border: '#FCA5A5',
        icon: '🗑️',
      };
    case 'IMPORT_EXCEL':
      return {
        label: 'Nhập file Excel',
        color: '#6B21A8',
        bg: '#F3E8FF',
        border: '#D8B4FE',
        icon: '📊',
      };
    case 'RESTORE_BACKUP':
      return {
        label: 'Khôi phục sao lưu',
        color: '#9A3412',
        bg: '#FFEDD5',
        border: '#FDBA74',
        icon: '🔄',
      };
    case 'RESET_SEED':
      return {
        label: 'Đặt lại dữ liệu',
        color: '#991B1B',
        bg: '#FEE2E2',
        border: '#FCA5A5',
        icon: '⚠️',
      };
    default:
      return {
        label: action,
        color: '#334155',
        bg: '#F8FAFC',
        border: '#E2E8F0',
        icon: 'ℹ️',
      };
  }
}

// Generate realistic initial logs to demonstrate the system
export function generateInitialAuditLogs(): AuditLogEntry[] {
  const now = Date.now();
  const formatIso = (offsetMinutes: number) => new Date(now - offsetMinutes * 60 * 1000).toISOString();

  return [
    {
      id: 'LOG-001',
      timestamp: formatIso(15),
      userId: 'vtthang',
      userName: 'Vũ Tất Thắng',
      userRole: 'lead',
      action: 'LOGIN',
      target: 'Hệ thống TCS23',
      details: 'Đăng nhập hệ thống quản trị Thuế cơ sở 23 TP Hà Nội thành công',
      badge: getActionBadge('LOGIN'),
    },
    {
      id: 'LOG-002',
      timestamp: formatIso(35),
      userId: 'ntyngoc',
      userName: 'Nguyễn Thị Yến Ngọc',
      userRole: 'team',
      teamId: 'KIEMTRA',
      teamName: 'Tổ Kiểm tra thuế',
      action: 'UPDATE_WORK',
      target: 'KIEMTRA-CV-01',
      details: 'Cập nhật tiến độ nhiệm vụ "Kiểm tra thuế tại trụ sở NNT": Đã làm tăng từ 8 lên 10 (100%), hoàn thành đúng hạn',
      badge: getActionBadge('UPDATE_WORK'),
    },
    {
      id: 'LOG-003',
      timestamp: formatIso(70),
      userId: 'ttnuyen',
      userName: 'Trần Thị Ngọc Uyên',
      userRole: 'team',
      teamId: 'HKD1',
      teamName: 'Tổ Cá nhân, hộ kinh doanh số 1',
      action: 'UPDATE_WORK',
      target: 'HKD1-CV-04',
      details: 'Cập nhật kết quả "Đôn đốc nộp thuế HKD quý 3": Phải làm 15, Đã làm 14, Trạng thái: Đang thực hiện',
      badge: getActionBadge('UPDATE_WORK'),
    },
    {
      id: 'LOG-004',
      timestamp: formatIso(120),
      userId: 'nthoa',
      userName: 'Nguyễn Thị Hoa',
      userRole: 'team',
      teamId: 'HCTH',
      teamName: 'Tổ Hành chính tổng hợp',
      action: 'CREATE_WORK',
      target: 'HCTH-CV-08',
      details: 'Tạo công việc mới "Báo cáo tổng hợp số liệu thu nộp NSNN tuần 37" giao cho đ/c Nguyễn Thị Hoa',
      badge: getActionBadge('CREATE_WORK'),
    },
    {
      id: 'LOG-005',
      timestamp: formatIso(180),
      userId: 'tthuong',
      userName: 'Trương Thị Hương',
      userRole: 'team',
      teamId: 'QLDN1',
      teamName: 'Tổ Quản lý Doanh nghiệp 1',
      action: 'IMPORT_EXCEL',
      target: '03_Mau_Day_Du_Lieu_To_QLDN1.xlsx',
      details: 'Nhập dữ liệu thành công từ file Excel chuyên đề Doanh nghiệp trọng điểm (24 bản ghi)',
      badge: getActionBadge('IMPORT_EXCEL'),
    },
    {
      id: 'LOG-006',
      timestamp: formatIso(240),
      userId: 'ndmanh',
      userName: 'Nguyễn Đức Mạnh',
      userRole: 'team',
      teamId: 'HKD2',
      teamName: 'Tổ Cá nhân, hộ kinh doanh số 2',
      action: 'LOGIN',
      target: 'Hệ thống TCS23',
      details: 'Đăng nhập vào hệ thống từ máy trạm Tổ HKD số 2',
      badge: getActionBadge('LOGIN'),
    },
    {
      id: 'LOG-007',
      timestamp: formatIso(310),
      userId: 'pttchinh',
      userName: 'Phạm Thị Thùy Chinh',
      userRole: 'team',
      teamId: 'NVDTPC',
      teamName: 'Tổ Nghiệp vụ, dự toán, pháp chế',
      action: 'UPDATE_WORK',
      target: 'NVDTPC-CV-02',
      details: 'Cập nhật tiến độ "Thẩm định hồ sơ miễn giảm tiền thuê đất": Đã làm 5/5 hồ sơ, chuyển trạng thái Hoàn thành',
      badge: getActionBadge('UPDATE_WORK'),
    },
    {
      id: 'LOG-008',
      timestamp: formatIso(420),
      userId: 'ntnga',
      userName: 'Nguyễn Thị Nga',
      userRole: 'team',
      teamId: 'QLTK',
      teamName: 'Tổ Quản lý các khoản thu khác',
      action: 'CHANGE_PASSWORD',
      target: 'Tài khoản ntnga',
      details: 'Đổi mật khẩu tài khoản thành công theo quy chế an toàn thông tin',
      badge: getActionBadge('CHANGE_PASSWORD'),
    },
    {
      id: 'LOG-009',
      timestamp: formatIso(540),
      userId: 'ttmhue',
      userName: 'Trần Thị Minh Huệ',
      userRole: 'team',
      teamId: 'QLDN2',
      teamName: 'Tổ Quản lý Doanh nghiệp 2',
      action: 'UPDATE_WORK',
      target: 'QLDN2-CV-11',
      details: 'Cập nhật kết quả rà soát hóa đơn điện tử máy tính tiền địa bàn Hoài Đức: 18/20 NNT',
      badge: getActionBadge('UPDATE_WORK'),
    },
    {
      id: 'LOG-010',
      timestamp: formatIso(720),
      userId: 'vtthang',
      userName: 'Vũ Tất Thắng',
      userRole: 'lead',
      action: 'IMPORT_EXCEL',
      target: '00_Mau_Tong_Hop_Tat_Ca_8_To.xlsx',
      details: 'Cập nhật và đồng bộ dữ liệu giao nhiệm vụ toàn diện 8 Tổ công tác',
      badge: getActionBadge('IMPORT_EXCEL'),
    },
  ];
}

export function loadAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialAuditLogs();
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const initial = generateInitialAuditLogs();
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch (err) {
    console.warn('Không thể đọc nhật ký thao tác từ localStorage:', err);
    return generateInitialAuditLogs();
  }
}

export function saveAuditLogs(logs: AuditLogEntry[]): void {
  try {
    // Keep up to 500 recent logs to avoid localStorage overflow
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Không thể lưu nhật ký thao tác:', err);
  }
}

export function createAuditEntry(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'badge'>
): AuditLogEntry {
  return {
    id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    ...entry,
    badge: getActionBadge(entry.action),
  };
}
