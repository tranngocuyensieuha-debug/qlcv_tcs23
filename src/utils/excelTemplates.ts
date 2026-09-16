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
