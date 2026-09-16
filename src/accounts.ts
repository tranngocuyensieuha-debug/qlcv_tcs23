import type { SessionAccount } from './domain/models';

export type UserAccountInfo =
  | {
      id: string;
      username: string;
      fullName: string;
      position: string;
      unit: string;
      label: string;
      role: 'lead';
      teamId?: never;
    }
  | {
      id: string;
      username: string;
      fullName: string;
      position: string;
      unit: string;
      label: string;
      role: 'team';
      teamId: string;
    };

export const USER_ACCOUNTS: readonly UserAccountInfo[] = [
  // 4 User Lãnh đạo (Tên đăng nhập = chữ cái đầu họ, đệm + tên)
  {
    id: 'vtthang',
    username: 'vtthang',
    fullName: 'Vũ Tất Thắng',
    position: 'Lãnh đạo',
    unit: 'Ban Lãnh đạo Thuế cơ sở 23',
    label: 'Vũ Tất Thắng - Lãnh đạo',
    role: 'lead',
  },
  {
    id: 'nvanh',
    username: 'nvanh',
    fullName: 'Nguyễn Việt Anh',
    position: 'Lãnh đạo',
    unit: 'Ban Lãnh đạo Thuế cơ sở 23',
    label: 'Nguyễn Việt Anh - Lãnh đạo',
    role: 'lead',
  },
  {
    id: 'natruong',
    username: 'natruong',
    fullName: 'Nguyễn Anh Trường',
    position: 'Lãnh đạo',
    unit: 'Ban Lãnh đạo Thuế cơ sở 23',
    label: 'Nguyễn Anh Trường - Lãnh đạo',
    role: 'lead',
  },
  {
    id: 'ndduy',
    username: 'ndduy',
    fullName: 'Nguyễn Đức Duy',
    position: 'Lãnh đạo',
    unit: 'Ban Lãnh đạo Thuế cơ sở 23',
    label: 'Nguyễn Đức Duy - Lãnh đạo',
    role: 'lead',
  },

  // 8 User Tổ trưởng (Tên đăng nhập = chữ cái đầu họ, đệm + tên)
  {
    id: 'ttnuyen',
    username: 'ttnuyen',
    fullName: 'Trần Thị Ngọc Uyên',
    position: 'Tổ trưởng',
    unit: 'Tổ Quản lý, hỗ trợ cá nhân, HKD số 1',
    label: 'Trần Thị Ngọc Uyên - Tổ trưởng HKD1',
    role: 'team',
    teamId: 'HKD1',
  },
  {
    id: 'ndmanh',
    username: 'ndmanh',
    fullName: 'Nguyễn Đức Mạnh',
    position: 'Tổ trưởng',
    unit: 'Tổ Quản lý, hỗ trợ cá nhân, HKD số 2',
    label: 'Nguyễn Đức Mạnh - Tổ trưởng HKD2',
    role: 'team',
    teamId: 'HKD2',
  },
  {
    id: 'tthuong',
    username: 'tthuong',
    fullName: 'Trương Thị Hương',
    position: 'Tổ trưởng',
    unit: 'Tổ Quản lý, hỗ trợ doanh nghiệp số 1',
    label: 'Trương Thị Hương - Tổ trưởng QLDN1',
    role: 'team',
    teamId: 'QLDN1',
  },
  {
    id: 'ttmhue',
    username: 'ttmhue',
    fullName: 'Trần Thị Minh Huệ',
    position: 'Tổ trưởng',
    unit: 'Tổ Quản lý, hỗ trợ doanh nghiệp số 2',
    label: 'Trần Thị Minh Huệ - Tổ trưởng QLDN2',
    role: 'team',
    teamId: 'QLDN2',
  },
  {
    id: 'ntyngoc',
    username: 'ntyngoc',
    fullName: 'Nguyễn Thị Yến Ngọc',
    position: 'Tổ phó',
    unit: 'Tổ Kiểm tra',
    label: 'Nguyễn Thị Yến Ngọc - Tổ phó Kiểm tra',
    role: 'team',
    teamId: 'KIEMTRA',
  },
  {
    id: 'nthoa',
    username: 'nthoa',
    fullName: 'Nguyễn Thị Hoa',
    position: 'Tổ trưởng',
    unit: 'Tổ Hành chính tổng hợp',
    label: 'Nguyễn Thị Hoa - Tổ trưởng HCTH',
    role: 'team',
    teamId: 'HCTH',
  },
  {
    id: 'pttchinh',
    username: 'pttchinh',
    fullName: 'Phạm Thị Thùy Chinh',
    position: 'Tổ trưởng',
    unit: 'Tổ Nghiệp vụ, dự toán, pháp chế',
    label: 'Phạm Thị Thùy Chinh - Tổ trưởng NVDTPC',
    role: 'team',
    teamId: 'NVDTPC',
  },
  {
    id: 'ntnga',
    username: 'ntnga',
    fullName: 'Nguyễn Thị Nga',
    position: 'Tổ trưởng',
    unit: 'Tổ Quản lý các khoản thu khác',
    label: 'Nguyễn Thị Nga - Tổ trưởng QLTK',
    role: 'team',
    teamId: 'QLTK',
  },
];

export const LEGACY_ACCOUNTS: readonly SessionAccount[] = [
  { id: 'lanhdao01', label: 'Lãnh đạo 01', role: 'lead' },
  { id: 'lanhdao02', label: 'Lãnh đạo 02', role: 'lead' },
  { id: 'lanhdao03', label: 'Lãnh đạo 03', role: 'lead' },
  { id: 'lanhdao04', label: 'Lãnh đạo 04', role: 'lead' },
  { id: 'totruong_hkd1', label: 'Tổ trưởng HKD1', role: 'team', teamId: 'HKD1' },
  { id: 'totruong_hkd2', label: 'Tổ trưởng HKD2', role: 'team', teamId: 'HKD2' },
  { id: 'totruong_qldn1', label: 'Tổ trưởng QLDN1', role: 'team', teamId: 'QLDN1' },
  { id: 'totruong_qldn2', label: 'Tổ trưởng QLDN2', role: 'team', teamId: 'QLDN2' },
  { id: 'totruong_kiemtra', label: 'Tổ phó Kiểm tra', role: 'team', teamId: 'KIEMTRA' },
  { id: 'totruong_hcth', label: 'Tổ trưởng HCTH', role: 'team', teamId: 'HCTH' },
  { id: 'totruong_nvdtpc', label: 'Tổ trưởng NVDTPC', role: 'team', teamId: 'NVDTPC' },
  { id: 'totruong_qltk', label: 'Tổ trưởng QLTK', role: 'team', teamId: 'QLTK' },
];

export const ACCOUNTS: readonly SessionAccount[] = [...USER_ACCOUNTS, ...LEGACY_ACCOUNTS];

const LEGACY_ALIASES: Record<string, string> = {
  lanhdao01: 'vtthang',
  lanhdao02: 'nvanh',
  lanhdao03: 'natruong',
  lanhdao04: 'ndduy',
  totruong_hkd1: 'ttnuyen',
  totruong_hkd2: 'ndmanh',
  totruong_qldn1: 'tthuong',
  totruong_qldn2: 'ttmhue',
  totruong_kiemtra: 'ntyngoc',
  topho_kiemtra: 'ntyngoc',
  dtthuy: 'ntyngoc',
  totruong_hcth: 'nthoa',
  ntdung: 'nthoa',
  totruong_nvdtpc: 'pttchinh',
  totruong_qltk: 'ntnga',
  uyen_hkd1: 'ttnuyen',
  manh_hkd2: 'ndmanh',
  huong_qldn1: 'tthuong',
  hue_qldn2: 'ttmhue',
  ngoc_kt: 'ntyngoc',
  hoa_hcth: 'nthoa',
  chinh_nvdtpc: 'pttchinh',
  nga_qltk: 'ntnga',
};

export function findAccount(accountId: string): SessionAccount | undefined {
  if (!accountId) return undefined;
  const normalized = accountId.trim().toLowerCase();
  const direct = ACCOUNTS.find((account) => account.id.toLowerCase() === normalized);
  if (direct) return direct;
  const targetId = LEGACY_ALIASES[normalized];
  if (targetId) return ACCOUNTS.find((account) => account.id.toLowerCase() === targetId);
  return undefined;
}
