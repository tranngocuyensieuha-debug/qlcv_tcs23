import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

import { TEAMS, STAFF, TASKS, TASK_APP } from './sync-excel-templates.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');
const projectRoot = join(appRoot, '..', '..');
const outputDir = join(projectRoot, 'BIEU_MAU_EXCEL_CAC_TO');
const publicTemplatesDir = join(appRoot, 'public', 'templates');
const distTemplatesDir = join(appRoot, 'dist', 'templates');

// Column width specifications
const COLS_DU_LIEU = [
  { wch: 6 },   // STT
  { wch: 38 },  // Tên nhiệm vụ
  { wch: 24 },  // Cán bộ
  { wch: 28 },  // Địa bàn
  { wch: 28 },  // Tổ quản lý
  { wch: 16 },  // Mã số thuế
  { wch: 18 },  // CCCD / Số hồ sơ
  { wch: 15 },  // Phải thực hiện
  { wch: 15 },  // Đã thực hiện
  { wch: 14 },  // Thời hạn
  { wch: 32 },  // Ghi chú
];

const COLS_DANH_MUC = [
  { wch: 6 },   // STT
  { wch: 18 },  // Mã nhiệm vụ
  { wch: 38 },  // Tên nhiệm vụ
  { wch: 22 },  // Lĩnh vực / Nhóm
  { wch: 16 },  // Đơn vị tính
  { wch: 20 },  // Cách đo
  { wch: 18 },  // Kỳ báo cáo
  { wch: 45 },  // Mô tả chi tiết
];

const COLS_CAN_BO = [
  { wch: 6 },   // STT
  { wch: 16 },  // Mã cán bộ
  { wch: 24 },  // Họ và tên
  { wch: 20 },  // Chức vụ
  { wch: 24 },  // Địa bàn phụ trách
  { wch: 38 },  // Chi tiết phân công
  { wch: 14 },  // Trạng thái
];

const COLS_HUONG_DAN = [
  { wch: 18 },  // Mục
  { wch: 80 },  // Nội dung hướng dẫn
];

/**
 * Generate workbook for a specific team
 */
export function buildTeamWorkbook(teamCode) {
  const teamObj = TEAMS.find(t => t.code === teamCode);
  if (!teamObj) throw new Error(`Không tìm thấy tổ: ${teamCode}`);

  const staffList = STAFF[teamCode] || [];
  const taskCodes = TASK_APP[teamCode] || [];
  const teamTasks = TASKS.filter(t => taskCodes.includes(t.code));

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Du lieu (Data entry sheet)
  // -------------------------------------------------------------
  const duLieuRows = [
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

  // Pre-populate tasks with realistic assignments to team staff
  if (teamCode === 'KIEMTRA') {
    // For KIEMTRA: 15 tasks mapped to 5 officers
    staffList.forEach((officer, oIdx) => {
      taskCodes.forEach((taskId, tIdx) => {
        const taskDef = TASKS.find(t => t.code === taskId);
        if (taskDef && (tIdx % staffList.length === oIdx || tIdx < 6)) {
          const assigned = 10 + (tIdx * 4) + (oIdx * 2);
          const completed = Math.round(assigned * (0.8 + (tIdx % 3) * 0.07));
          duLieuRows.push([
            stt++,
            taskDef.name,
            officer.name,
            officer.area || 'Theo kế hoạch kiểm tra',
            teamObj.name,
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
    // For HCTH: 7 specific administrative tasks
    teamTasks.forEach((taskDef, tIdx) => {
      const officer = staffList[tIdx % staffList.length] || staffList[0];
      const assigned = 15 + tIdx * 5;
      const completed = Math.round(assigned * 0.88);
      duLieuRows.push([
        stt++,
        taskDef.name,
        officer.name,
        officer.area || 'Văn phòng',
        teamObj.name,
        '',
        '',
        assigned,
        completed,
        '2026-10-31',
        `Chỉ tiêu công tác hành chính tháng - ${taskDef.name}`
      ]);
    });
  } else {
    // For other teams (HKD1, HKD2, QLDN1, QLDN2, NVDTPC, QLTK):
    // Map tasks across all staff officers
    staffList.forEach((officer, oIdx) => {
      // Each officer gets a set of tasks suitable to their area
      teamTasks.forEach((taskDef, tIdx) => {
        // Distribute: leader gets oversight tasks; field officers get core operational tasks
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
            teamObj.name,
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

  // Add 50 formatted blank rows for team entry
  for (let i = 0; i < 50; i++) {
    duLieuRows.push([stt++, '', '', '', teamObj.name, '', '', '', '', '', '']);
  }

  const wsDuLieu = XLSX.utils.aoa_to_sheet(duLieuRows);
  wsDuLieu['!cols'] = COLS_DU_LIEU;
  XLSX.utils.book_append_sheet(wb, wsDuLieu, 'Du lieu');

  // -------------------------------------------------------------
  // Sheet 2: Danh muc nhiem vu cua To
  // -------------------------------------------------------------
  const danhMucRows = [
    [
      'STT',
      'Mã nhiệm vụ',
      'Tên nhiệm vụ',
      'Lĩnh vực / Nhóm',
      'Đơn vị tính',
      'Cách đo / Tiêu chí',
      'Kỳ báo cáo',
      'Mô tả nhiệm vụ'
    ]
  ];

  teamTasks.forEach((t, idx) => {
    danhMucRows.push([
      idx + 1,
      t.code,
      t.name,
      t.category,
      t.unit,
      t.measure,
      t.period,
      t.desc
    ]);
  });

  const wsDanhMuc = XLSX.utils.aoa_to_sheet(danhMucRows);
  wsDanhMuc['!cols'] = COLS_DANH_MUC;
  XLSX.utils.book_append_sheet(wb, wsDanhMuc, 'Danh muc nhiem vu');

  // -------------------------------------------------------------
  // Sheet 3: Danh sach can bo cua To
  // -------------------------------------------------------------
  const canBoRows = [
    [
      'STT',
      'Mã cán bộ',
      'Họ và tên',
      'Chức vụ',
      'Địa bàn phân công',
      'Chi tiết phân công / Địa bàn',
      'Trạng thái'
    ]
  ];

  staffList.forEach((s, idx) => {
    canBoRows.push([
      idx + 1,
      `${teamCode}-CB${String(idx + 1).padStart(2, '0')}`,
      s.name,
      s.role,
      s.area,
      s.detail || '',
      s.status || 'Đang hoạt động'
    ]);
  });

  const wsCanBo = XLSX.utils.aoa_to_sheet(canBoRows);
  wsCanBo['!cols'] = COLS_CAN_BO;
  XLSX.utils.book_append_sheet(wb, wsCanBo, 'Danh sach can bo');

  // -------------------------------------------------------------
  // Sheet 4: Huong dan su dung
  // -------------------------------------------------------------
  const huongDanRows = [
    ['Mục', 'Nội dung hướng dẫn chi tiết'],
    [
      '1. Mục đích',
      `Biểu mẫu Excel chuẩn hóa dành riêng cho ${teamObj.name} (${teamObj.short}) để lập kế hoạch, đôn đốc tiến độ và đẩy dữ liệu công việc vào Ứng dụng Quản lý công việc TCS23.`
    ],
    [
      '2. Cấu trúc file',
      `- Sheet 'Du lieu': Bảng nhập liệu chính, đã tạo sẵn các dòng mẫu nhiệm vụ tương ứng với cán bộ của tổ.\n- Sheet 'Danh muc nhiem vu': Tổng hợp ${teamTasks.length} nhiệm vụ được phân công cho ${teamObj.short}.\n- Sheet 'Danh sach can bo': Danh sách ${staffList.length} cán bộ thuộc tổ.`
    ],
    [
      '3. Cách nhập số liệu',
      `Điền số lượng vào cột 'Phải thực hiện' (số chỉ tiêu giao) và 'Đã thực hiện' (số đã hoàn thành/đạt được).\nThời hạn điền theo định dạng YYYY-MM-DD (ví dụ: 2026-10-31).\nCó thể điền thêm Mã số thuế, CCCD và Ghi chú chi tiết nếu cần theo dõi từng NNT.`
    ],
    [
      '4. Thêm dòng mới',
      `Sử dụng các dòng trống sẵn bên dưới. Chọn Tên nhiệm vụ và Cán bộ đúng với danh mục tại Sheet 2 và Sheet 3 để hệ thống nhận diện và tính KPI chính xác.`
    ],
    [
      '5. Tải lên website',
      `Sau khi hoàn thiện số liệu, mở Website TCS23 -> Bấm nút 'Tải lên' (biểu tượng màu xanh dương) hoặc vào menu 'Nhập dữ liệu Excel' -> Chọn tệp này -> Hệ thống tự động đọc và đồng bộ kết quả.`
    ],
    [
      '6. Lưu ý quan trọng',
      `Không thay đổi tên hoặc xóa các cột tại Dòng 1 của sheet 'Du lieu' để đảm bảo tính tương thích của hệ thống đọc tự động.`
    ]
  ];

  const wsHuongDan = XLSX.utils.aoa_to_sheet(huongDanRows);
  wsHuongDan['!cols'] = COLS_HUONG_DAN;
  XLSX.utils.book_append_sheet(wb, wsHuongDan, 'Huong dan su dung');

  return wb;
}

/**
 * Generate Master Consolidated Workbook with all 8 teams
 */
export function buildMasterConsolidatedWorkbook() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Du lieu (Master combined data)
  const masterRows = [
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

  // Add representative sample rows for each team
  TEAMS.forEach(team => {
    const staffList = STAFF[team.code] || [];
    const taskCodes = TASK_APP[team.code] || [];
    const leader = staffList[0];

    // Add leader's primary tasks
    if (leader && taskCodes.length > 0) {
      taskCodes.slice(0, 3).forEach(taskId => {
        const taskDef = TASKS.find(t => t.code === taskId);
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
            `Chỉ tiêu tháng - ${team.short}`
          ]);
        }
      });
    }

    // Add 1 row for each other officer
    staffList.slice(1).forEach((officer, idx) => {
      const taskId = taskCodes[idx % taskCodes.length];
      const taskDef = TASKS.find(t => t.code === taskId);
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

  // Add 100 blank rows
  for (let i = 0; i < 100; i++) {
    masterRows.push([stt++, '', '', '', '', '', '', '', '', '', '']);
  }

  const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
  wsMaster['!cols'] = COLS_DU_LIEU;
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Du lieu tong hop');

  // Add separate sheets for each team inside the master workbook
  TEAMS.forEach(team => {
    const staffList = STAFF[team.code] || [];
    const taskCodes = TASK_APP[team.code] || [];
    const teamTasks = TASKS.filter(t => taskCodes.includes(t.code));

    const teamSheetRows = [
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
            `Nhiệm vụ ${team.short}`
          ]);
        }
      });
    });

    for (let i = 0; i < 20; i++) {
      teamSheetRows.push([teamStt++, '', '', '', '', '', '', '']);
    }

    const wsTeam = XLSX.utils.aoa_to_sheet(teamSheetRows);
    wsTeam['!cols'] = [
      { wch: 6 },
      { wch: 38 },
      { wch: 24 },
      { wch: 28 },
      { wch: 15 },
      { wch: 15 },
      { wch: 14 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTeam, team.short.substring(0, 31));
  });

  // Sheet: Danh muc 86 nhiem vu
  const danhMucRows = [
    ['STT', 'Mã nhiệm vụ', 'Tên nhiệm vụ', 'Lĩnh vực', 'Đơn vị tính', 'Cách đo', 'Kỳ báo cáo', 'Các tổ áp dụng', 'Mô tả chi tiết']
  ];
  TASKS.forEach((t, idx) => {
    const appTeams = [];
    Object.entries(TASK_APP).forEach(([tCode, taskList]) => {
      if (taskList.includes(t.code)) appTeams.push(tCode);
    });
    danhMucRows.push([
      idx + 1,
      t.code,
      t.name,
      t.category,
      t.unit,
      t.measure,
      t.period,
      appTeams.join(', '),
      t.desc
    ]);
  });
  const wsDanhMuc = XLSX.utils.aoa_to_sheet(danhMucRows);
  wsDanhMuc['!cols'] = [
    { wch: 6 }, { wch: 18 }, { wch: 38 }, { wch: 20 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 28 }, { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDanhMuc, 'Danh muc 86 nhiem vu');

  // Sheet: Danh sach 54 can bo
  const canBoRows = [
    ['STT', 'Mã cán bộ', 'Họ và tên', 'Chức vụ', 'Tổ công tác', 'Địa bàn', 'Chi tiết phân công', 'Trạng thái']
  ];
  let cbStt = 1;
  TEAMS.forEach(team => {
    const sList = STAFF[team.code] || [];
    sList.forEach((s, idx) => {
      canBoRows.push([
        cbStt++,
        `${team.code}-CB${String(idx + 1).padStart(2, '0')}`,
        s.name,
        s.role,
        team.name,
        s.area,
        s.detail || '',
        s.status || 'Đang hoạt động'
      ]);
    });
  });
  const wsCanBo = XLSX.utils.aoa_to_sheet(canBoRows);
  wsCanBo['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 24 }, { wch: 18 }, { wch: 32 }, { wch: 24 }, { wch: 38 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsCanBo, 'Danh sach 54 can bo');

  return wb;
}

/**
 * Generate all Excel files to disk
 */
export function generateAllTeamExcelTemplates() {
  console.log('===================================================================');
  console.log('[team-templates] BẮT ĐẦU TẠO CÁC FILE EXCEL MẪU CHO TỪNG TỔ');
  console.log('===================================================================');

  // Ensure directories exist
  [outputDir, publicTemplatesDir, distTemplatesDir].forEach(dir => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  });

  const filesMap = {
    'HKD1': '01_Mau_Day_Du_Lieu_To_HKD1.xlsx',
    'HKD2': '02_Mau_Day_Du_Lieu_To_HKD2.xlsx',
    'QLDN1': '03_Mau_Day_Du_Lieu_To_QLDN1.xlsx',
    'QLDN2': '04_Mau_Day_Du_Lieu_To_QLDN2.xlsx',
    'KIEMTRA': '05_Mau_Day_Du_Lieu_To_KIEMTRA.xlsx',
    'HCTH': '06_Mau_Day_Du_Lieu_To_HCTH.xlsx',
    'NVDTPC': '07_Mau_Day_Du_Lieu_To_NVDTPC.xlsx',
    'QLTK': '08_Mau_Day_Du_Lieu_To_QLTK.xlsx',
  };

  // 1. Generate 8 individual team templates
  Object.entries(filesMap).forEach(([teamCode, filename]) => {
    try {
      const wb = buildTeamWorkbook(teamCode);
      const outPath1 = join(outputDir, filename);
      const outPath2 = join(publicTemplatesDir, filename);
      
      XLSX.writeFile(wb, outPath1);
      XLSX.writeFile(wb, outPath2);

      if (existsSync(join(appRoot, 'dist'))) {
        const outPath3 = join(distTemplatesDir, filename);
        XLSX.writeFile(wb, outPath3);
      }

      console.log(`[team-templates] [OK] Đã tạo file mẫu cho ${teamCode.padEnd(8)}: ${filename}`);
    } catch (err) {
      console.error(`[team-templates] [LỖI] Tạo file cho ${teamCode}:`, err);
    }
  });

  // 2. Generate Master Consolidated Workbook
  try {
    const masterFilename = '00_Mau_Tong_Hop_Tat_Ca_8_To.xlsx';
    const masterWb = buildMasterConsolidatedWorkbook();
    
    const masterPath1 = join(outputDir, masterFilename);
    const masterPath2 = join(publicTemplatesDir, masterFilename);
    XLSX.writeFile(masterWb, masterPath1);
    XLSX.writeFile(masterWb, masterPath2);

    if (existsSync(join(appRoot, 'dist'))) {
      const masterPath3 = join(distTemplatesDir, masterFilename);
      XLSX.writeFile(masterWb, masterPath3);
    }

    console.log(`[team-templates] [OK] Đã tạo file tổng hợp 8 tổ : ${masterFilename}`);
  } catch (err) {
    console.error(`[team-templates] [LỖI] Tạo file tổng hợp:`, err);
  }

  console.log(`\n[team-templates] ĐÃ TẠO XONG TOÀN BỘ FILE MẪU TẠI THƯ MỤC:`);
  console.log(`📂 ${outputDir}`);
  console.log('===================================================================');
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAllTeamExcelTemplates();
}
