import * as XLSX from 'xlsx';
import { CANONICAL_TEAMS, seedDataset } from '../data/seedDataset';

export interface TeamTemplateInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  icon: string;
  taskCount: number;
  staffCount: number;
  leaderName: string;
  filename: string;
  badgeColor: string;
}

export interface ThematicTemplateInfo {
  id: string;
  code: string;
  name: string;
  shortName: string;
  sourceApp: string;
  icon: string;
  taskIds: string[];
  applicableTeamIds: string[];
  filename: string;
  description: string;
  badgeColor: string;
}

export const THEMATIC_TEMPLATE_LIST: readonly ThematicTemplateInfo[] = [
  {
    id: 'CD_THU',
    code: 'THU',
    name: 'Chuyên đề Số thu NSNN (Tiến độ thực thu, ước thu, dự toán)',
    shortName: 'CĐ Thu NSNN',
    sourceApp: 'Phần mềm TMS',
    icon: '💰',
    taskIds: ['THU'],
    applicableTeamIds: ['HKD1', 'HKD2', 'QLDN1', 'QLDN2', 'QLTK'],
    filename: 'CD01_Chuyen_De_Thu_NSNN_TMS.xlsx',
    description: 'Theo dõi tiến độ thực thu, ước thu tháng, tăng trưởng so cùng kỳ và so dự toán pháp lệnh theo từng cán bộ/tổ',
    badgeColor: '#16A34A',
  },
  {
    id: 'CD_NO',
    code: 'NO_CCN',
    name: 'Chuyên đề Quản lý nợ & Cưỡng chế nợ, Tạm hoãn xuất cảnh',
    shortName: 'CĐ Quản lý nợ & Cưỡng chế',
    sourceApp: 'Phân hệ QLN',
    icon: '📑',
    taskIds: ['NO', 'CCN', 'THXC', 'QLN-THANG', 'THXC-TRANGTHAI'],
    applicableTeamIds: ['HKD1', 'HKD2', 'QLDN1', 'QLDN2', 'QLTK'],
    filename: 'CD02_Chuyen_De_Quan_Ly_No_Va_Cuong_Che.xlsx',
    description: 'Bóc tách nợ đầu năm, nợ tháng trước, thông báo nợ, thông báo cưỡng chế tài khoản và văn bản tạm hoãn xuất cảnh',
    badgeColor: '#DC2626',
  },
  {
    id: 'CD_HOADON',
    code: 'HOADON_HSK',
    name: 'Chuyên đề Rủi ro Hóa đơn điện tử, Hệ số K & TPR',
    shortName: 'CĐ Hóa đơn & Hệ số K',
    sourceApp: 'HĐĐT / TPR',
    icon: '🔍',
    taskIds: ['HD', 'HSK', 'TPR'],
    applicableTeamIds: ['QLDN1', 'QLDN2', 'HKD1', 'HKD2'],
    filename: 'CD03_Chuyen_De_Hoa_Don_Va_He_So_K.xlsx',
    description: 'Rà soát danh sách NNT có dấu hiệu rủi ro cao về HĐĐT, chênh lệch hệ số K và rủi ro phân hệ TPR',
    badgeColor: '#7C3AED',
  },
  {
    id: 'CD_ETAX',
    code: 'ETAX_MTT',
    name: 'Chuyên đề eTax Mobile & HĐĐT Máy tính tiền',
    shortName: 'CĐ eTax & Máy tính tiền',
    sourceApp: 'eTax / HĐĐT',
    icon: '📱',
    taskIds: ['HKD-ETAX', 'ETAX-TNCN', 'HKD-HDDT-MTT', 'ETAX-PNN'],
    applicableTeamIds: ['HKD1', 'HKD2', 'QLDN1', 'QLDN2', 'QLTK'],
    filename: 'CD04_Chuyen_De_eTax_Va_May_Tinh_Tien.xlsx',
    description: 'Tiến độ cài đặt, liên kết ngân hàng eTax Mobile và phát hành hóa đơn khởi tạo từ máy tính tiền',
    badgeColor: '#2563EB',
  },
  {
    id: 'CD_MST',
    code: 'DKT_LAMSACH',
    name: 'Chiến dịch Làm sạch dữ liệu MST (Trạng thái 03, 06, giải thể)',
    shortName: 'CĐ Làm sạch MST',
    sourceApp: 'Đăng ký thuế (TMS)',
    icon: '🧹',
    taskIds: ['DKT', 'SACHMASOTHUE', 'HKD-SACHMASOTHUE', 'KIEMTRA-DONGMA'],
    applicableTeamIds: ['HKD1', 'HKD2', 'QLDN1', 'QLDN2', 'KIEMTRA', 'QLTK'],
    filename: 'CD05_Chuyen_De_Lam_Sach_MST.xlsx',
    description: 'Rà soát hồ sơ đóng mã số thuế, giải thể, xử lý MST trạng thái 03, 06 hoàn thành KPI năm 2026',
    badgeColor: '#D97706',
  },
];

export const TEAM_TEMPLATE_LIST: readonly TeamTemplateInfo[] = [
  {
    id: 'HKD1',
    code: 'HKD1',
    name: 'Tổ Quản lý, hỗ trợ cá nhân, hộ kinh doanh số 1',
    shortName: 'Tổ HKD 1',
    icon: '🏪',
    taskCount: 30,
    staffCount: 7,
    leaderName: 'Trần Thị Ngọc Uyên',
    filename: '01_Mau_Day_Du_Lieu_To_HKD1.xlsx',
    badgeColor: '#2563EB'
  },
  {
    id: 'HKD2',
    code: 'HKD2',
    name: 'Tổ Quản lý, hỗ trợ cá nhân, hộ kinh doanh số 2',
    shortName: 'Tổ HKD 2',
    icon: '🏬',
    taskCount: 30,
    staffCount: 8,
    leaderName: 'Nguyễn Đức Mạnh',
    filename: '02_Mau_Day_Du_Lieu_To_HKD2.xlsx',
    badgeColor: '#0284C7'
  },
  {
    id: 'QLDN1',
    code: 'QLDN1',
    name: 'Tổ Quản lý, hỗ trợ doanh nghiệp số 1',
    shortName: 'Tổ QLDN 1',
    icon: '🏭',
    taskCount: 40,
    staffCount: 8,
    leaderName: 'Trương Thị Hương',
    filename: '03_Mau_Day_Du_Lieu_To_QLDN1.xlsx',
    badgeColor: '#0D9488'
  },
  {
    id: 'QLDN2',
    code: 'QLDN2',
    name: 'Tổ Quản lý, hỗ trợ doanh nghiệp số 2',
    shortName: 'Tổ QLDN 2',
    icon: '🏢',
    taskCount: 40,
    staffCount: 8,
    leaderName: 'Trần Thị Minh Huệ',
    filename: '04_Mau_Day_Du_Lieu_To_QLDN2.xlsx',
    badgeColor: '#059669'
  },
  {
    id: 'KIEMTRA',
    code: 'KIEMTRA',
    name: 'Tổ Kiểm tra thuế',
    shortName: 'Tổ Kiểm tra',
    icon: '🔍',
    taskCount: 15,
    staffCount: 5,
    leaderName: 'Nguyễn Thị Yến Ngọc',
    filename: '05_Mau_Day_Du_Lieu_To_KIEMTRA.xlsx',
    badgeColor: '#DC2626'
  },
  {
    id: 'HCTH',
    code: 'HCTH',
    name: 'Tổ Hành chính tổng hợp',
    shortName: 'Tổ HCTH',
    icon: '📋',
    taskCount: 7,
    staffCount: 8,
    leaderName: 'Nguyễn Thị Hoa',
    filename: '06_Mau_Day_Du_Lieu_To_HCTH.xlsx',
    badgeColor: '#D97706'
  },
  {
    id: 'NVDTPC',
    code: 'NVDTPC',
    name: 'Tổ Nghiệp vụ, dự toán, pháp chế',
    shortName: 'Tổ NVDTPC',
    icon: '⚖️',
    taskCount: 19,
    staffCount: 7,
    leaderName: 'Phạm Thị Thùy Chinh',
    filename: '07_Mau_Day_Du_Lieu_To_NVDTPC.xlsx',
    badgeColor: '#7C3AED'
  },
  {
    id: 'QLTK',
    code: 'QLTK',
    name: 'Tổ Quản lý các khoản thu khác',
    shortName: 'Tổ QLTK',
    icon: '🌾',
    taskCount: 14,
    staffCount: 10,
    leaderName: 'Nguyễn Thị Nga',
    filename: '08_Mau_Day_Du_Lieu_To_QLTK.xlsx',
    badgeColor: '#4F46E5'
  }
];

// Mapping of tasks to teams
const TASK_TEAMS_MAP: Record<string, string[]> = {
  HKD1: ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "KK", "QLTK-PHANANH", "SACHMASOTHUE", "HKD-ETAX", "HKD-HDDT", "HKD-HOTRO", "HKD-KTTB", "HKD-QLDT", "HKD-TKNH", "HKD-TMDT", "HKD-SACHMASOTHUE", "HKD-QLRR", "ETAX-TNCN", "HKD-HDDT-MTT", "HKD-TMDT-GOI", "HKD-CHUYENDOI-DN", "HOAN-TNCN-TUDONG", "QLN-THANG", "THXC-TRANGTHAI"],
  HKD2: ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "KK", "QLTK-PHANANH", "SACHMASOTHUE", "HKD-ETAX", "HKD-HDDT", "HKD-HOTRO", "HKD-KTTB", "HKD-QLDT", "HKD-TKNH", "HKD-TMDT", "HKD-SACHMASOTHUE", "HKD-QLRR", "ETAX-TNCN", "HKD-HDDT-MTT", "HKD-TMDT-GOI", "HKD-CHUYENDOI-DN", "HOAN-TNCN-TUDONG", "QLN-THANG", "THXC-TRANGTHAI"],
  QLDN1: ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "KK", "QLTK-PHANANH", "QLDN-KIENTHI", "QLDN-KTTB", "QLDN-TRASOAT", "QLDN-KLCA", "QLDN-CLGTGT-HDDT", "QLDN-TKGTGT", "QLDN-TKTNDN", "QLDN-TKLOITRUC", "QLDN-XPVPHC", "QLDN-HOANGTGT", "QLDN-HOANTNCN", "QLDN-TMDT", "QLDN-GOINGUON2025", "QLDN-TIENTHUA", "QLDN-KT-VANGBAC", "QLDN-KT-XANGDAU", "QLDN-KT-MHRR", "QLDN-KT-GDLK", "QLDN2-QLDN", "QLDN-TKDUONG", "QLDN-CHUYENDE", "QLDN_GDL", "ETAX-TNCN", "HOAN-GTGT-CHUYENKT", "HOAN-TNCN-TUDONG", "QLN-THANG", "THXC-TRANGTHAI", "HCTH-DVCQG"],
  QLDN2: ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "KK", "QLTK-PHANANH", "QLDN-KIENTHI", "QLDN-KTTB", "QLDN-TRASOAT", "QLDN-KLCA", "QLDN-CLGTGT-HDDT", "QLDN-TKGTGT", "QLDN-TKTNDN", "QLDN-TKLOITRUC", "QLDN-XPVPHC", "QLDN-HOANGTGT", "QLDN-HOANTNCN", "QLDN-TMDT", "QLDN-GOINGUON2025", "QLDN-TIENTHUA", "QLDN-KT-VANGBAC", "QLDN-KT-XANGDAU", "QLDN-KT-MHRR", "QLDN-KT-GDLK", "QLDN2-QLDN", "QLDN-TKDUONG", "QLDN-CHUYENDE", "QLDN_GDL", "ETAX-TNCN", "HOAN-GTGT-CHUYENKT", "HOAN-TNCN-TUDONG", "QLN-THANG", "THXC-TRANGTHAI", "HCTH-DVCQG"],
  KIEMTRA: ["KIEMTRA-KHKT", "KIEMTRA-TRUYTHU", "KIEMTRA-BQT", "KIEMTRA-TMS_TTR", "KIEMTRA-DONGMA", "KIEMTRA-HOANKT", "KIEMTRA-CHUYENDEKT", "KIEMTRA-KLTT", "KIEMTRA-CHUYENDIADIEM", "KIEMTRA-BAOCAO", "KIEMTRA-NOIBO", "KIEMTRA-KNTC", "KIEMTRA-DICH-DANH", "KIEMTRA-KN-SAUKT", "HOAN-GTGT-CHUYENKT"],
  HCTH: ["HCTH-HAILONG", "HCTH-NVLD", "HCTH-BCGB", "HCTH-VANBAN", "HCTH-DVCQG", "HCTH-GIAINGAN", "HCTH-CANBO"],
  NVDTPC: ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "QLTK-PHANANH", "NVDTPC-BCNGAY", "NVDTPC-DOICHIEU", "NVDTPC-TUYENTRUYEN", "NVDTPC-PHAPCHE", "NVDTPC-BAOCAOTUAN", "QLN-THANG", "THXC-TRANGTHAI", "NVDTPC-QUYMO"],
  QLTK: ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "QLTK-PHANANH", "QLTK-DVC_DAT", "QLTK-LPTB", "QLTK-TNCN_BDS", "QLTK-PNN", "QLTK-CHUANHOA", "ETAX-PNN"]
};

// Column widths for neat appearance
const COLS_DU_LIEU = [
  { wch: 6 },
  { wch: 38 },
  { wch: 24 },
  { wch: 28 },
  { wch: 28 },
  { wch: 16 },
  { wch: 18 },
  { wch: 15 },
  { wch: 15 },
  { wch: 14 },
  { wch: 32 },
];

/**
 * Generate client-side Excel template for a specific team and trigger download
 */
export function generateAndDownloadTeamTemplate(teamCode: string) {
  const teamInfo = TEAM_TEMPLATE_LIST.find(t => t.code === teamCode) || TEAM_TEMPLATE_LIST[0];
  const teamCanonical = CANONICAL_TEAMS.find(t => t.id === teamCode);
  const teamFullName = teamCanonical?.name || teamInfo.name;

  const staffList = seedDataset.officers.filter(o => o.teamId === teamCode);
  const taskCodes = TASK_TEAMS_MAP[teamCode] || [];
  const teamTasks = seedDataset.taskDefinitions.filter(t => taskCodes.includes(t.id));

  const wb = XLSX.utils.book_new();

  // Sheet 1: Du lieu
  const duLieuRows: unknown[][] = [
    [
      'STT',
      'Tên nhiệm vụ',
      'Cán bộ',
      'Địa bàn',
      'Tổ quản lý',
      'Mã số thuế',
      'CCCD / Số hồ sơ',
      'Phải thực hiện',
      'Đã thực hiện',
      'Thời hạn',
      'Ghi chú'
    ]
  ];

  let stt = 1;

  if (teamCode === 'KIEMTRA') {
    staffList.forEach((officer, oIdx) => {
      teamTasks.forEach((taskDef, tIdx) => {
        if (tIdx % staffList.length === oIdx || tIdx < 6) {
          const assigned = 10 + (tIdx * 4) + (oIdx * 2);
          const completed = Math.round(assigned * (0.8 + (tIdx % 3) * 0.07));
          duLieuRows.push([
            stt++,
            taskDef.name,
            officer.name,
            officer.area || 'Theo kế hoạch kiểm tra',
            teamFullName,
            `010${1000000 + stt * 13}`,
            `00109${200000 + stt * 11}`,
            assigned,
            completed,
            '2026-10-31',
            `Kế hoạch kiểm tra tháng - ${taskDef.category}`
          ]);
        }
      });
    });
  } else if (teamCode === 'HCTH') {
    teamTasks.forEach((taskDef, tIdx) => {
      const officer = staffList[tIdx % staffList.length] || staffList[0];
      const assigned = 15 + tIdx * 5;
      const completed = Math.round(assigned * 0.88);
      duLieuRows.push([
        stt++,
        taskDef.name,
        officer ? officer.name : '',
        officer ? officer.area : 'Văn phòng',
        teamFullName,
        '',
        '',
        assigned,
        completed,
        '2026-10-31',
        `Chỉ tiêu hành chính tháng - ${taskDef.name}`
      ]);
    });
  } else {
    staffList.forEach((officer, oIdx) => {
      teamTasks.forEach((taskDef, tIdx) => {
        const isLeader = oIdx === 0;
        const isOfficerTask = (tIdx % (staffList.length - 1 || 1)) === (oIdx - 1) || (isLeader && tIdx < 5);
        if (isOfficerTask) {
          const assigned = 20 + ((tIdx * 3 + oIdx * 5) % 30);
          const completed = Math.max(1, Math.round(assigned * (0.75 + ((tIdx + oIdx) % 4) * 0.06)));
          duLieuRows.push([
            stt++,
            taskDef.name,
            officer.name,
            officer.area || 'Toàn TCS23',
            teamFullName,
            `010${1000000 + stt * 17}`,
            `00109${200000 + stt * 19}`,
            assigned,
            completed,
            '2026-10-31',
            `Chỉ tiêu giao tháng 10/2026`
          ]);
        }
      });
    });
  }

  // 50 blank rows
  for (let i = 0; i < 50; i++) {
    duLieuRows.push([stt++, '', '', '', teamFullName, '', '', '', '', '', '']);
  }

  const wsDuLieu = XLSX.utils.aoa_to_sheet(duLieuRows);
  wsDuLieu['!cols'] = COLS_DU_LIEU;
  XLSX.utils.book_append_sheet(wb, wsDuLieu, 'Du lieu');

  // Sheet 2: Danh muc nhiem vu
  const danhMucRows: unknown[][] = [
    ['STT', 'Mã nhiệm vụ', 'Tên nhiệm vụ', 'Lĩnh vực / Nhóm', 'Đơn vị tính', 'Cách đo', 'Kỳ báo cáo']
  ];
  teamTasks.forEach((t, idx) => {
    danhMucRows.push([idx + 1, t.id, t.name, t.category, t.unit, t.measurement, t.reportPeriod]);
  });
  const wsDanhMuc = XLSX.utils.aoa_to_sheet(danhMucRows);
  wsDanhMuc['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 38 }, { wch: 22 }, { wch: 16 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsDanhMuc, 'Danh muc nhiem vu');

  // Sheet 3: Danh sach can bo
  const canBoRows: unknown[][] = [
    ['STT', 'Mã cán bộ', 'Họ và tên', 'Chức vụ', 'Địa bàn phụ trách']
  ];
  staffList.forEach((s, idx) => {
    canBoRows.push([idx + 1, s.id, s.name, s.title, s.area]);
  });
  const wsCanBo = XLSX.utils.aoa_to_sheet(canBoRows);
  wsCanBo['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 24 }, { wch: 20 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsCanBo, 'Danh sach can bo');

  // Sheet 4: Huong dan su dung
  const huongDanRows: unknown[][] = [
    ['Mục', 'Nội dung hướng dẫn chi tiết'],
    ['1. Mục đích', `Biểu mẫu Excel chuẩn hóa cho ${teamFullName} để nhập liệu chỉ tiêu công việc và đẩy vào hệ thống.`],
    ['2. Cấu trúc', `Sheet 'Du lieu' chứa các dòng chỉ tiêu công việc tương ứng cán bộ và nhiệm vụ của tổ.`],
    ['3. Cách nhập số liệu', `Điền 'Phải thực hiện', 'Đã thực hiện' và 'Thời hạn' (YYYY-MM-DD, ví dụ 2026-10-31).`],
    ['4. Tải lên hệ thống', `Mở website TCS23 -> Bấm nút 'Tải lên' (màu xanh dương) -> Chọn file này để cập nhật tức thì.`],
    ['5. Lưu ý', `Không sửa tên các cột tại dòng 1 của sheet 'Du lieu'.`]
  ];
  const wsHuongDan = XLSX.utils.aoa_to_sheet(huongDanRows);
  wsHuongDan['!cols'] = [{ wch: 18 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsHuongDan, 'Huong dan su dung');

  // Download
  XLSX.writeFile(wb, teamInfo.filename);
}

/**
 * Generate Master Consolidated Template for all 8 teams
 */
export function generateAndDownloadMasterTemplate() {
  const wb = XLSX.utils.book_new();

  const masterRows: unknown[][] = [
    [
      'STT',
      'Tên nhiệm vụ',
      'Cán bộ',
      'Địa bàn',
      'Tổ quản lý',
      'Mã số thuế',
      'CCCD / Số hồ sơ',
      'Phải thực hiện',
      'Đã thực hiện',
      'Thời hạn',
      'Ghi chú'
    ]
  ];

  let stt = 1;

  CANONICAL_TEAMS.forEach(team => {
    const staffList = seedDataset.officers.filter(o => o.teamId === team.id);
    const taskCodes = TASK_TEAMS_MAP[team.id] || [];
    const leader = staffList[0];

    if (leader && taskCodes.length > 0) {
      taskCodes.slice(0, 3).forEach(taskId => {
        const taskDef = seedDataset.taskDefinitions.find(t => t.id === taskId);
        if (taskDef) {
          masterRows.push([
            stt++,
            taskDef.name,
            leader.name,
            leader.area || 'Toàn TCS23',
            team.name,
            `010${1000000 + stt * 19}`,
            `00109${200000 + stt * 23}`,
            30,
            26,
            '2026-10-31',
            `Chỉ tiêu tháng - ${team.shortName}`
          ]);
        }
      });
    }

    staffList.slice(1).forEach((officer, idx) => {
      const taskId = taskCodes[idx % taskCodes.length];
      const taskDef = seedDataset.taskDefinitions.find(t => t.id === taskId);
      if (taskDef) {
        masterRows.push([
          stt++,
          taskDef.name,
          officer.name,
          officer.area || 'Địa bàn quản lý',
          team.name,
          `010${1000000 + stt * 19}`,
          `00109${200000 + stt * 23}`,
          20,
          18,
          '2026-10-31',
          `Giao quản lý địa bàn - ${officer.area}`
        ]);
      }
    });
  });

  for (let i = 0; i < 100; i++) {
    masterRows.push([stt++, '', '', '', '', '', '', '', '', '', '']);
  }

  const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
  wsMaster['!cols'] = COLS_DU_LIEU;
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Du lieu tong hop');

  // Add sheet for each team
  CANONICAL_TEAMS.forEach(team => {
    const staffList = seedDataset.officers.filter(o => o.teamId === team.id);
    const taskCodes = TASK_TEAMS_MAP[team.id] || [];
    const teamTasks = seedDataset.taskDefinitions.filter(t => taskCodes.includes(t.id));

    const teamSheetRows: unknown[][] = [
      ['STT', 'Tên nhiệm vụ', 'Cán bộ', 'Địa bàn', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn', 'Ghi chú']
    ];

    let teamStt = 1;
    staffList.forEach((officer, oIdx) => {
      teamTasks.forEach((taskDef, tIdx) => {
        if (tIdx % (staffList.length || 1) === oIdx || (oIdx === 0 && tIdx < 3)) {
          teamSheetRows.push([
            teamStt++,
            taskDef.name,
            officer.name,
            officer.area,
            25,
            20,
            '2026-10-31',
            `Nhiệm vụ ${team.shortName}`
          ]);
        }
      });
    });

    for (let i = 0; i < 20; i++) {
      teamSheetRows.push([teamStt++, '', '', '', '', '', '', '']);
    }

    const wsTeam = XLSX.utils.aoa_to_sheet(teamSheetRows);
    wsTeam['!cols'] = [{ wch: 6 }, { wch: 38 }, { wch: 24 }, { wch: 28 }, { wch: 15 }, { wch: 15 }, { wch: 14 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsTeam, team.shortName.substring(0, 31));
  });

  // Sheet Danh mục
  const danhMucRows: unknown[][] = [
    ['STT', 'Mã nhiệm vụ', 'Tên nhiệm vụ', 'Lĩnh vực', 'Đơn vị tính', 'Cách đo', 'Kỳ báo cáo']
  ];
  seedDataset.taskDefinitions.forEach((t, idx) => {
    danhMucRows.push([idx + 1, t.id, t.name, t.category, t.unit, t.measurement, t.reportPeriod]);
  });
  const wsDanhMuc = XLSX.utils.aoa_to_sheet(danhMucRows);
  wsDanhMuc['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 38 }, { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsDanhMuc, 'Danh muc 86 nhiem vu');

  XLSX.writeFile(wb, '00_Mau_Tong_Hop_Tat_Ca_8_To.xlsx');
}

export function generateThematicTemplate(themeId: string): XLSX.WorkBook {
  const theme = THEMATIC_TEMPLATE_LIST.find((t) => t.id === themeId) || THEMATIC_TEMPLATE_LIST[0];
  const wb = XLSX.utils.book_new();

  const applicableOfficers = seedDataset.officers.filter((o) => theme.applicableTeamIds.includes(o.teamId));
  const applicableTasks = seedDataset.taskDefinitions.filter((t) => theme.taskIds.includes(t.id));

  // Sheet 1: Du lieu
  const duLieuRows: unknown[][] = [
    [
      'STT',
      'Tên nhiệm vụ',
      'Cán bộ',
      'Tổ quản lý',
      'Địa bàn / Đối tượng',
      'Mã số thuế',
      'CCCD / Số hồ sơ',
      'Phải thực hiện',
      'Đã thực hiện',
      'Thời hạn',
      'Ghi chú chuyên đề'
    ]
  ];

  let stt = 1;
  applicableOfficers.forEach((officer, oIdx) => {
    const teamObj = CANONICAL_TEAMS.find((t) => t.id === officer.teamId);
    applicableTasks.forEach((taskDef, tIdx) => {
      const shouldAssign = (tIdx % 2 === oIdx % 2) || applicableTasks.length <= 2;
      if (shouldAssign) {
        const assigned = 25 + ((oIdx * 7 + tIdx * 5) % 40);
        const completed = Math.round(assigned * (0.8 + (oIdx % 3) * 0.05));
        duLieuRows.push([
          stt++,
          taskDef.name,
          officer.name,
          teamObj ? teamObj.name : officer.teamId,
          officer.area || 'Địa bàn quản lý',
          `010${1000000 + stt * 23}`,
          `00109${200000 + stt * 29}`,
          assigned,
          completed,
          '2026-10-31',
          `${theme.name} - Nguồn dữ liệu: ${theme.sourceApp}`
        ]);
      }
    });
  });

  for (let i = 0; i < 40; i++) {
    duLieuRows.push([stt++, '', '', '', '', '', '', '', '', '', `Nguồn: ${theme.sourceApp}`]);
  }

  const wsDuLieu = XLSX.utils.aoa_to_sheet(duLieuRows);
  wsDuLieu['!cols'] = [
    { wch: 6 },
    { wch: 38 },
    { wch: 24 },
    { wch: 32 },
    { wch: 28 },
    { wch: 16 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
    { wch: 36 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDuLieu, 'Du lieu');

  // Sheet 2: Danh muc nhiem vu chuyen de
  const taskRows = [
    ['STT', 'Mã nhiệm vụ', 'Tên nhiệm vụ', 'Lĩnh vực', 'Đơn vị tính', 'Cách đo lường', 'Kỳ báo cáo'],
    ...applicableTasks.map((t, idx) => [
      idx + 1,
      t.id,
      t.name,
      t.category,
      t.unit,
      t.measurement,
      t.reportPeriod
    ])
  ];
  const wsTasks = XLSX.utils.aoa_to_sheet(taskRows);
  wsTasks['!cols'] = [{ wch: 6 }, { wch: 18 }, { wch: 38 }, { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsTasks, 'Danh muc nhiem vu');

  // Sheet 3: Danh sach can bo cac to
  const staffRows = [
    ['STT', 'Mã cán bộ', 'Họ và tên', 'Chức vụ', 'Tổ công tác', 'Địa bàn phụ trách'],
    ...applicableOfficers.map((o, idx) => {
      const teamObj = CANONICAL_TEAMS.find((t) => t.id === o.teamId);
      return [
        idx + 1,
        o.id,
        o.name,
        o.title,
        teamObj ? teamObj.name : o.teamId,
        o.area
      ];
    })
  ];
  const wsStaff = XLSX.utils.aoa_to_sheet(staffRows);
  wsStaff['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 24 }, { wch: 18 }, { wch: 32 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsStaff, 'Danh sach can bo');

  // Sheet 4: Huong dan
  const guideRows = [
    ['HƯỚNG DẪN ĐẨY DỮ LIỆU CHUYÊN ĐỀ - THUẾ CƠ SỞ 23 TP HÀ NỘI'],
    ['Chuyên đề: ' + theme.name],
    ['Nguồn dữ liệu gốc: ' + theme.sourceApp],
    [''],
    ['1. NGUYÊN TẮC: File chuyên đề được xuất từ hệ thống tập trung của ngành (' + theme.sourceApp + '), chứa số liệu của nhiều tổ cùng lúc.'],
    ['2. BÓC TÁCH TỰ ĐỘNG: Ứng dụng sẽ tự động căn cứ vào cột "Cán bộ" hoặc "Tổ quản lý" để phân bổ kết quả về đúng từng tổ.'],
    ['3. ĐỘC LẬP DỮ LIỆU: Việc nạp dữ liệu chuyên đề này sẽ chỉ cập nhật các nhiệm vụ thuộc chuyên đề, giữ nguyên 100% các nhiệm vụ khác của các tổ.'],
    ['4. CỘT BẮT BUỘC: Tên nhiệm vụ, Cán bộ, Phải thực hiện, Đã thực hiện, Thời hạn (định dạng YYYY-MM-DD).']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Huong dan');

  return wb;
}

export function generateAndDownloadThematicTemplate(themeId: string): void {
  const theme = THEMATIC_TEMPLATE_LIST.find((t) => t.id === themeId) || THEMATIC_TEMPLATE_LIST[0];
  const wb = generateThematicTemplate(themeId);
  XLSX.writeFile(wb, theme.filename);
}
