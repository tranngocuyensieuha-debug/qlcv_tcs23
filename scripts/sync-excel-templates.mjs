import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');
const projectRoot = join(appRoot, '..', '..');
const workspaceRoot = join(projectRoot, '..');

// Define canonical teams
export const TEAMS = [
  { code: 'HKD1', name: 'Tổ Quản lý, hỗ trợ cá nhân, hộ kinh doanh số 1', short: 'HKD1' },
  { code: 'HKD2', name: 'Tổ Quản lý, hỗ trợ cá nhân, hộ kinh doanh số 2', short: 'HKD2' },
  { code: 'QLDN1', name: 'Tổ Quản lý, hỗ trợ doanh nghiệp số 1', short: 'QLDN1' },
  { code: 'QLDN2', name: 'Tổ Quản lý, hỗ trợ doanh nghiệp số 2', short: 'QLDN2' },
  { code: 'KIEMTRA', name: 'Tổ Kiểm tra', short: 'Kiểm tra' },
  { code: 'HCTH', name: 'Tổ Hành chính tổng hợp', short: 'Hành chính' },
  { code: 'NVDTPC', name: 'Tổ Nghiệp vụ, dự toán, pháp chế', short: 'NVDTPC' },
  { code: 'QLTK', name: 'Tổ Quản lý các khoản thu khác', short: 'QL khoản thu khác' }
];

export const STAFF = {
  "HKD1": [
    { name: "Trần Thị Ngọc Uyên", area: "Phụ trách chung", detail: "Chỉ đạo điều hành Tổ HKD1", status: "Đã xác định", role: "Tổ trưởng" },
    { name: "Nguyễn Thị Lệ", area: "xã Dương Hòa", detail: "Xã Đắc Sở; Xã Yên Sở; Xã Cát Quế", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Công Tiến Tùng", area: "xã Dương Hòa", detail: "xã Dương Liễu", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Tùng Dương", area: "xã Hoài Đức", detail: "Thị trấn Trạm Trôi; Xã Đức Giang", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Thị Hương Hà", area: "xã Hoài Đức", detail: "Xã Di Trạch; Xã Đức Thượng", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Ngô Mai Trang", area: "xã Hoài Đức", detail: "Xã Kim Chung", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Văn Tuấn", area: "xã Dương Hòa", detail: "Xã Minh Khai", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" }
  ],
  "HKD2": [
    { name: "Nguyễn Đức Mạnh", area: "Phụ trách chung", detail: "Phối hợp, phân luồng hỗ trợ chung", status: "Đã xác định", role: "Tổ trưởng" },
    { name: "Nguyễn Viết Toàn", area: "xã Sơn Đồng", detail: "xã Lại Yên; xã Sơn Đồng; xã Tiền Yên", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Thị Thu Hoài", area: "xã La Phù", detail: "Xã La Phù", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Kim Ngân", area: "xã Sơn Đồng; xã An Khánh", detail: "Khu Bắc An Khánh (SPLENDORA); xã Song Phương; xã Vân Côn", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Hoàng Thế Vương", area: "xã Sơn Đồng", detail: "xã Vân Canh", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Thị Thu Trà", area: "xã An Khánh", detail: "Các thôn Ngãi Cầu, Yên Lũng, An Bình, Trường An; KĐT Geleximco A và B", status: "Đã xác định từ nguồn", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Thùy Liên", area: "xã An Khánh", detail: "Các thôn Vân Lũng, Phú Vinh, An Thọ; khu Vinhomes", status: "Đã xác định từ nguồn", role: "Cán bộ quản lý địa bàn" },
    { name: "Trần Thanh Thư", area: "xã An Khánh", detail: "xã An Thượng; xã Đông La", status: "Đã xác định từ nguồn", role: "Cán bộ quản lý địa bàn" }
  ],
  "QLDN1": [
    { name: "Trương Thị Hương", area: "Phụ trách chung", detail: "Chỉ đạo điều hành Tổ QLDN1", status: "Đã xác định", role: "Tổ trưởng" },
    { name: "Nguyễn Thị Liên", area: "xã Hoài Đức", detail: "Kim Chung (trừ Đại Tự)", status: "Đã xác định", role: "Phó Tổ trưởng" },
    { name: "Phạm Thị Duyên", area: "xã Sơn Đồng", detail: "Vân Canh", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Phạm Thu Hằng", area: "xã Hoài Đức", detail: "Di Trạch, Đức Giang", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Thị Thúy", area: "xã Hoài Đức", detail: "Thị trấn Trạm Trôi, Đại Tự", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Phạm Tường Minh", area: "xã Sơn Đồng", detail: "Lại Yên, Song Phương, Vân Côn", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Quang Sáng", area: "xã Sơn Đồng", detail: "Sơn Đồng, Tiền Yên, An Khánh", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Nguyễn Thị Thanh Hiền", area: "xã Hoài Đức", detail: "Đức Thượng; Vàng bạc", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" }
  ],
  "QLDN2": [
    { name: "Trần Thị Minh Huệ", area: "Phụ trách chung", detail: "Chỉ đạo điều hành Tổ QLDN2", status: "Đã xác định", role: "Tổ trưởng" },
    { name: "Nguyễn Thị Vân Anh", area: "xã An Khánh", detail: "Xã La Phù", status: "Đã xác định", role: "Tổ phó" },
    { name: "Nguyễn Thị Tâm", area: "xã An Khánh", detail: "KĐT mới Lê Trọng Tấn, Geleximco, Bảo Sơn, Hoa Phượng, An Khánh...; Thôn An Hạ, Lại Dụ, Thanh Quang", status: "Đã xác định", role: "Tổ phó" },
    { name: "Nguyễn Thị Thoan", area: "xã An Khánh", detail: "KĐT Nam An Khánh, CCN Trường An, thôn Trường An, Thôn An Thọ, KĐT Vinhomes, Victory, Gemek...", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Lê Thu Trang", area: "xã An Khánh", detail: "xã Vân Côn, Thôn Ngãi Cầu", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Đỗ Thị Tân", area: "xã An Khánh", detail: "xã Đông La; thôn An Bình, Thôn Vân Lũng, Thôn Yên Lũng, TAGS, TTTNTV, M1, M2...", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Hoàng Ngọc Sơn", area: "xã Dương Hòa", detail: "Xã Cát Quế, xã Đắc Sở; Thôn Đào Nguyên, Thôn Ngự Câu", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" },
    { name: "Trần Kim Dung", area: "xã Dương Hòa", detail: "Xã Yên Sở, Minh Khai, Dương Liễu", status: "Đã xác định", role: "Cán bộ quản lý địa bàn" }
  ],
  "KIEMTRA": [
    { name: "Nguyễn Thị Yến Ngọc", area: "Theo kế hoạch kiểm tra", detail: "Tổ phó phụ trách Tổ Kiểm tra", status: "Đã xác định", role: "Phó Tổ trưởng" },
    { name: "Đinh Thị Thủy", area: "Theo kế hoạch kiểm tra", detail: "Đầu mối nghiệp vụ Tổ Chuyển đổi số", status: "Đã xác định", role: "Cán bộ kiểm tra" },
    { name: "Nguyễn Thị Bích", area: "Theo kế hoạch kiểm tra", detail: "Cán bộ kiểm tra doanh nghiệp", status: "Đã xác định", role: "Cán bộ kiểm tra" },
    { name: "Bùi Thị Oanh", area: "Theo kế hoạch kiểm tra", detail: "Cán bộ kiểm tra doanh nghiệp", status: "Đã xác định", role: "Cán bộ kiểm tra" },
    { name: "Hoàng Thị Bảo Lâm", area: "Theo kế hoạch kiểm tra", detail: "Cán bộ kiểm tra doanh nghiệp", status: "Đã xác định", role: "Cán bộ kiểm tra" }
  ],
  "HCTH": [
    { name: "Nguyễn Thị Hoa", area: "Văn phòng", detail: "Chỉ đạo điều hành Tổ Hành chính", status: "Đã xác định", role: "Tổ trưởng" },
    { name: "Nguyễn Tuấn Dũng", area: "Văn phòng", detail: "Hành chính tổng hợp", status: "Đã xác định", role: "Cán bộ hành chính" },
    { name: "Phạm Thị Thảo", area: "Văn phòng", detail: "Hành chính tổng hợp", status: "Đã xác định", role: "Cán bộ hành chính" },
    { name: "Phạm Thanh Hoa", area: "Văn phòng", detail: "Hành chính tổng hợp", status: "Đã xác định", role: "Cán bộ hành chính" },
    { name: "Vũ Thị Thiết", area: "Văn phòng", detail: "Hành chính tổng hợp", status: "Đã xác định", role: "Cán bộ hành chính" },
    { name: "Trần Thị Hân", area: "Văn phòng", detail: "Hành chính tổng hợp", status: "Đã xác định", role: "Cán bộ hành chính" },
    { name: "Văn thư", area: "Văn phòng", detail: "Công tác văn thư lưu trữ", status: "Đã xác định", role: "Văn thư" },
    { name: "Nguyễn Hữu Quân", area: "Văn phòng", detail: "Hành chính tổng hợp", status: "Đã xác định", role: "Cán bộ hành chính" }
  ],
  "NVDTPC": [
    { name: "Phạm Thị Thùy Chinh", area: "Toàn Thuế cơ sở 23", detail: "Chỉ đạo điều hành Nghiệp vụ", status: "Đã xác định", role: "Tổ trưởng" },
    { name: "Đỗ Thị Nga", area: "Toàn Thuế cơ sở 23", detail: "Đầu mối nghiệp vụ Tổ Chuyển đổi số", status: "Đã xác định", role: "Phó Tổ trưởng" },
    { name: "Nguyễn Thị Ngọc Hà", area: "Toàn Thuế cơ sở 23", detail: "Nghiệp vụ, dự toán, pháp chế", status: "Đã xác định", role: "Cán bộ nghiệp vụ" },
    { name: "Đặng Thị Thu Thảo", area: "Toàn Thuế cơ sở 23", detail: "Nghiệp vụ, dự toán, pháp chế", status: "Đã xác định", role: "Cán bộ nghiệp vụ" },
    { name: "Trần Thị Xuân", area: "Toàn Thuế cơ sở 23", detail: "Nghiệp vụ, dự toán, pháp chế", status: "Đã xác định", role: "Cán bộ nghiệp vụ" },
    { name: "Nguyễn Thị Thu", area: "Toàn Thuế cơ sở 23", detail: "Nghiệp vụ, dự toán, pháp chế", status: "Đã xác định", role: "Cán bộ nghiệp vụ" },
    { name: "IHTKK HDU ( DTTTHAO)", area: "Toàn Thuế cơ sở 23", detail: "Hỗ trợ hệ thống kê khai", status: "Đã xác định", role: "Hỗ trợ kỹ thuật" }
  ],
  "QLTK": [
    { name: "Nguyễn Thị Nga", area: "Toàn địa bàn TCS23", detail: "Chỉ đạo điều hành Tổ QLTK", status: "Đã xác định", role: "Tổ trưởng" },
    { name: "Lê Thị Hảo", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Phó Tổ trưởng" },
    { name: "Trần Đoan Trang", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Cán bộ quản lý" },
    { name: "Nguyễn Thị Huyền Trang", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Cán bộ quản lý" },
    { name: "Trần Diệu Linh", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Cán bộ quản lý" },
    { name: "Đào Thị Phượng", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Cán bộ quản lý" },
    { name: "Nguyễn Thị Lệ Tuyết", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Cán bộ quản lý" },
    { name: "Trần Bá Quân", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Cán bộ quản lý" },
    { name: "Nguyễn Viết Ninh", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Cán bộ quản lý" },
    { name: "Phùng Thị Lý", area: "Toàn địa bàn TCS23", detail: "Theo lĩnh vực đất, LPTB, TNCN BĐS, PNN, DVC", status: "Đã xác định", role: "Cán bộ quản lý" }
  ]
};

export const TASKS = [
  {"STT": 1, "code": "TTHC", "category": "Thủ tục hành chính", "name": "Giải quyết thủ tục hành chính", "desc": "Theo dõi từng hồ sơ tiếp nhận, cán bộ xử lý, hạn giải quyết, kết quả, trong hạn và quá hạn.", "measure": "Số lượng", "unit": "Hồ sơ", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 2, "code": "CCN", "category": "Cưỡng chế nợ", "name": "Cưỡng chế nợ thuế", "desc": "Theo dõi NNT thuộc diện cưỡng chế, biện pháp áp dụng, quyết định/thông báo, số tiền và kết quả thu.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 3, "code": "NO", "category": "Quản lý nợ", "name": "Quản lý nợ thuế", "desc": "Theo dõi từng NNT có nợ, số nợ, tuổi nợ, loại nợ, kết quả đôn đốc và số còn phải xử lý.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 4, "code": "PHOIHOP", "category": "Phối hợp", "name": "Phối hợp cơ quan ngoài ngành", "desc": "Theo dõi từng NNT/vụ việc gửi Công an, UBND, Hải quan, cơ quan tài nguyên hoặc đơn vị khác.", "measure": "Số lượng", "unit": "NNT/vụ việc", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 5, "code": "THU", "category": "Thu ngân sách", "name": "Theo dõi số thu ngân sách", "desc": "Theo dõi chỉ tiêu/dự toán, số thực hiện trong kỳ, lũy kế, số còn phải thu và tỷ lệ hoàn thành.", "measure": "Số tiền", "unit": "Đồng", "detail": "Không", "period": "Tuần, tháng, quý, năm"},
  {"STT": 6, "code": "DKT", "category": "Đăng ký thuế", "name": "Đăng ký thuế, trạng thái MST và đóng mã / Giải thể", "desc": "Theo dõi đăng ký lần đầu, chuyển đến, trạng thái 03/05/06/09, giải thể và đóng MST.", "measure": "Số lượng", "unit": "NNT/hồ sơ", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 7, "code": "THXC", "category": "Cưỡng chế/THXC", "name": "Tạm hoãn xuất cảnh", "desc": "Theo dõi NNT/người đại diện thuộc diện tạm hoãn xuất cảnh, tình trạng định danh, thông báo và kết quả thu nợ.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 8, "code": "HD", "category": "Hóa đơn", "name": "Rà soát, xác minh và xử lý hóa đơn / Xác minh hóa đơn", "desc": "Theo dõi NNT/hóa đơn rủi ro, chênh lệch hóa đơn - tờ khai, xác minh và kết quả xử lý.", "measure": "Số lượng + số tiền / Số lượng", "unit": "NNT/hóa đơn và đồng / NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 9, "code": "HSK", "category": "Quản lý rủi ro", "name": "Xử lý cảnh báo hệ số K", "desc": "Theo dõi từng NNT có cảnh báo hệ số K, kết quả đối chiếu, giải trình và xử lý.", "measure": "Số lượng + số tiền / Số lượng", "unit": "NNT và đồng / NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 10, "code": "TPR", "category": "Quản lý rủi ro", "name": "Rà soát TPR", "desc": "Theo dõi danh sách NNT rủi ro được giao, kết quả rà soát, yêu cầu giải trình và hướng xử lý.", "measure": "Số lượng + số tiền / Số lượng", "unit": "NNT và đồng / NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 11, "code": "HOAN", "category": "Hoàn thuế", "name": "Giải quyết hồ sơ hoàn thuế", "desc": "Theo dõi hoàn TNCN/GTGT, hình thức xử lý, thời hạn, số tiền và kết quả.", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 12, "code": "KK", "category": "Kê khai", "name": "Quản lý kê khai, tờ khai lỗi và xử phạt", "desc": "Theo dõi NNT phải nộp tờ khai, đã nộp/chưa nộp, lỗi tiếp nhận, nộp chậm và xử phạt.", "measure": "Số lượng + số tiền", "unit": "NNT/tờ khai và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 13, "code": "QLTK-PHANANH", "category": "Phản ảnh ", "name": "Phản ánh trên DVC_CBT", "desc": "Theo dõi phản ánh, cán bộ xử lý, hạn trả lời và kết quả.", "measure": "Số lượng", "unit": "Phản ánh", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 14, "code": "SACHMASOTHUE", "category": "Nhiệm vụ đặc thù", "name": "Làm sạch mã số thuế trạng thái 03,06", "desc": "Xử lý mã số thuế trạng thái 03, 06 về trạng thái 01,00 đối với Hộ kinh doanh và Doanh nghiệp trạng thái 03, 06 về trạng thái 00 hoặc 03 lý do 07", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 15, "code": "HKD-ETAX", "category": "Nhiệm vụ đặc thù", "name": "eTax Mobile", "desc": "Theo dõi HKD phải cài, đã cài, đã sử dụng và trường hợp cần hỗ trợ.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 16, "code": "HKD-HDDT", "category": "Nhiệm vụ đặc thù", "name": "Đăng ký và sử dụng hóa đơn điện tử", "desc": "Theo dõi HKD thuộc diện phải đăng ký, đã đăng ký, ngày chấp nhận, hình thức HĐĐT và tình trạng sử dụng.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 17, "code": "HKD-HOTRO", "category": "Nhiệm vụ đặc thù", "name": "Tuyên truyền và hỗ trợ HKD", "desc": "Theo dõi lượt hỗ trợ gắn với NNT; hồ sơ tồn; tin nhắn, cuộc gọi và kết quả phản hồi.", "measure": "Số lượng", "unit": "NNT/lượt hỗ trợ", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 18, "code": "HKD-KTTB", "category": "Nhiệm vụ đặc thù", "name": "Kiểm tra tại bàn HKD", "desc": "Theo dõi danh sách HKD phải kiểm tra tại bàn, kết quả và hướng xử lý.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 19, "code": "HKD-QLDT", "category": "Nhiệm vụ đặc thù", "name": "Quản lý đối tượng HKD", "desc": "Quản lý HKD theo trạng thái, loại hình, doanh thu, thời điểm thành lập và địa bàn.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 20, "code": "HKD-TKNH", "category": "Nhiệm vụ đặc thù", "name": "Thông báo tài khoản ngân hàng", "desc": "Theo dõi HKD phải thông báo, đã thông báo, tài khoản lỗi hoặc cần bổ sung.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 21, "code": "HKD-TMDT", "category": "Nhiệm vụ đặc thù", "name": "Rà soát thương mại điện tử", "desc": "Theo dõi NNT/nền tảng/tài khoản, doanh thu, kết quả định danh và cập nhật CSDL TMĐT.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 22, "code": "HKD-SACHMASOTHUE", "category": "Nhiệm vụ đặc thù", "name": "Làm sạch mã số thuế trạng thái 03,06", "desc": "Xử lý mã số thuế trạng thái 03, 06 về trạng thái 01,00.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 23, "code": "HKD-QLRR", "category": "Nhiệm vụ đặc thù", "name": "Quản lý rủi ro hộ kinh doanh sử dụng hóa đơn điện tử", "desc": "Rà soát NNT có dấu hiệu vi phạm các tiêu chí rủi ro khi sử dụng hóa đơn điện tử", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 24, "code": "QLDN-KIENTHI", "category": "Nhiệm vụ đặc thù", "name": "Thực hiện kiến nghị kiểm toán/thanh tra", "desc": "Theo dõi từng kiến nghị, NNT/vụ việc, thời hạn, kết quả và nội dung còn tồn.", "measure": "Số lượng + số tiền", "unit": "Vụ việc/NNT và đồng", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 25, "code": "QLDN-KTTB", "category": "Nhiệm vụ đặc thù", "name": "Kiểm tra tại trụ sở cơ quan thuế theo kế hoạch / Kiểm tra tại trụ sở cơ quan thuế", "desc": "Theo dõi NNT phải kiểm tra tại bàn, tiến độ, kết quả điều chỉnh và chuyển kiểm tra.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 26, "code": "QLDN-TRASOAT", "category": "Nhiệm vụ đặc thù", "name": "Tra soát chứng từ, xác nhận nghĩa vụ / Tra soát chứng từ, nghĩa vụ và tiền nộp thừa", "desc": "Theo dõi từng NNT cần tra soát, bù trừ, xác nhận nghĩa vụ và xử lý tiền nộp thừa.", "measure": "Số lượng / Số lượng + số tiền", "unit": "NNT/hồ sơ / NNT/hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 27, "code": "QLDN-KLCA", "category": "Quản lý rủi ro/Phối hợp", "name": "Rà soát gói kết luận CA", "desc": "Theo dõi danh sách NNT thuộc gói/kết luận của cơ quan Công an, kết quả rà soát và xử lý.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 28, "code": "QLDN-CLGTGT-HDDT", "category": "Kê khai/Hóa đơn", "name": "Chênh lệch tờ khai GTGT và HĐĐT", "desc": "Đối chiếu chênh lệch giữa tờ khai GTGT và dữ liệu HĐĐT đến từng NNT, xác định nguyên nhân và kết quả xử lý.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 29, "code": "QLDN-TKGTGT", "category": "Kê khai", "name": "Tờ khai GTGT", "desc": "Theo dõi tờ khai GTGT phải xử lý, số thuế phát sinh và kết quả thực hiện nghĩa vụ.", "measure": "Số lượng + số tiền", "unit": "Tờ khai/NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 30, "code": "QLDN-TKTNDN", "category": "Kê khai", "name": "Tờ khai TNDN", "desc": "Theo dõi nghĩa vụ/tờ khai TNDN, số thuế phát sinh và kết quả thực hiện.", "measure": "Số lượng + số tiền", "unit": "Tờ khai/NNT và đồng", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 31, "code": "QLDN-TKLOITRUC", "category": "Kê khai", "name": "Tờ khai lỗi trên trục tiếp nhận", "desc": "Theo dõi từng tờ khai lỗi trên trục tiếp nhận, nguyên nhân lỗi, xử lý và trạng thái tiếp nhận lại.", "measure": "Số lượng", "unit": "Tờ khai", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 32, "code": "QLDN-XPVPHC", "category": "Xử phạt VPHC", "name": "Xử phạt VPHC", "desc": "Theo dõi NNT thuộc diện xử phạt vi phạm hành chính, hồ sơ xử phạt, số tiền và kết quả nộp.", "measure": "Số lượng + số tiền", "unit": "Tờ khai/NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 33, "code": "QLDN-HOANGTGT", "category": "Hoàn thuế", "name": "Hoàn thuế GTGT", "desc": "Theo dõi hồ sơ hoàn thuế GTGT, tiến độ giải quyết, số tiền đề nghị và số tiền được hoàn.", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 34, "code": "QLDN-HOANTNCN", "category": "Hoàn thuế", "name": "Hoàn thuế TNCN", "desc": "Theo dõi hồ sơ hoàn thuế TNCN, hồ sơ tồn/quá hạn và kết quả giải quyết.", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 35, "code": "QLDN-TMDT", "category": "Thương mại điện tử", "name": "Thương mại điện tử", "desc": "Theo dõi doanh nghiệp có hoạt động thương mại điện tử, doanh thu/dữ liệu liên quan và kết quả rà soát.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 36, "code": "QLDN-GOINGUON2025", "category": "Quản lý rủi ro/Gói dữ liệu", "name": "Xử lý gói nhiều nguồn 2025", "desc": "Theo dõi danh sách NNT thuộc gói nhiều nguồn 2025 được giao và kết quả xử lý.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 37, "code": "QLDN-TIENTHUA", "category": "Tra soát nghĩa vụ", "name": "Xử lý tiền thừa", "desc": "Theo dõi NNT có tiền nộp thừa, số tiền, hướng xử lý bù trừ/hoàn và kết quả.", "measure": "Số lượng + số tiền", "unit": "NNT/hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 38, "code": "QLDN-KT-VANGBAC", "category": "Kiểm tra tại bàn/chuyên đề", "name": "Kiểm tra tại trụ sở cơ quan thuế theo chuyên đề Vàng bạc", "desc": "Theo dõi NNT thuộc chuyên đề kiểm tra tại trụ sở cơ quan thuế đối với lĩnh vực vàng bạc.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 39, "code": "QLDN-KT-XANGDAU", "category": "Kiểm tra tại bàn/chuyên đề", "name": "Kiểm tra tại trụ sở cơ quan thuế theo chuyên đề Xăng dầu", "desc": "Theo dõi NNT thuộc chuyên đề kiểm tra tại trụ sở cơ quan thuế đối với lĩnh vực xăng dầu.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 40, "code": "QLDN-KT-MHRR", "category": "Kiểm tra tại bàn/chuyên đề", "name": "Kiểm tra tại trụ sở cơ quan thuế theo chuyên đề DN kinh doanh mặt hàng rủi ro (Cát, đá, sỏi,…)", "desc": "Theo dõi NNT thuộc chuyên đề kiểm tra doanh nghiệp kinh doanh mặt hàng rủi ro như cát, đá, sỏi.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 41, "code": "QLDN-KT-GDLK", "category": "Kiểm tra tại bàn/chuyên đề", "name": "Kiểm tra tại trụ sở cơ quan thuế theo chuyên đề Giao dịch liên kết", "desc": "Theo dõi NNT thuộc chuyên đề kiểm tra giao dịch liên kết tại trụ sở cơ quan thuế.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 42, "code": "QLDN2-QLDN", "category": "Nhiệm vụ đặc thù", "name": "Quản lý doanh nghiệp", "desc": "Theo dõi DN đang hoạt động, mới thành lập, chuyển đến, trạng thái 05 và phân công quản lý.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 43, "code": "QLDN-TKDUONG", "category": "Nhiệm vụ đặc thù", "name": "Tờ khai phát sinh dương", "desc": "Theo dõi tờ khai GTGT, TNDN, TNCN, TTĐB phát sinh số phải nộp và kết quả nộp.", "measure": "Số lượng + số tiền", "unit": "Tờ khai/NNT và đồng", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 44, "code": "QLDN-CHUYENDE", "category": "Nhiệm vụ đặc thù", "name": "Chuyên đề và gói dữ liệu doanh nghiệp", "desc": "Theo dõi giao dịch liên kết, giáo dục công lập, cát đá sỏi, vốn điều lệ, BĐS/vãng lai, TMĐT và nhóm rủi ro khác.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Theo chiến dịch"},
  {"STT": 45, "code": "QLDN_GDL", "category": "Nhiệm vụ đặc thù", "name": "Gói dữ liệu ", "desc": "Theo dõi đơn vị mua bán hàng hóa của đơn vị TT03, tt05, TT06", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 46, "code": "HCTH-HAILONG", "category": "Nhiệm vụ đặc thù", "name": "Theo dõi sự hài lòng", "desc": "Theo dõi lượt đánh giá, mức đánh giá, tổ/cán bộ liên quan và kết quả xác minh phản ánh không hài lòng.", "measure": "Số lượng", "unit": "Lượt đánh giá", "detail": "Cần xác nhận", "period": "Tuần, tháng, quý, năm"},
  {"STT": 47, "code": "HCTH-NVLD", "category": "Nhiệm vụ đặc thù", "name": "Theo dõi nhiệm vụ Ban Lãnh đạo giao", "desc": "Theo dõi nhiệm vụ giao cho từng tổ, hạn xử lý, tiến độ, kết quả và tình trạng quá hạn.", "measure": "Số lượng", "unit": "Nhiệm vụ", "detail": "Không bắt buộc", "period": "Tuần, tháng, quý, năm"},
  {"STT": 48, "code": "HCTH-BCGB", "category": "Nhiệm vụ đặc thù", "name": "Tổng hợp báo cáo giao ban", "desc": "Theo dõi việc gửi báo cáo, trạng thái đủ/thiếu, thời hạn và tổng hợp báo cáo toàn đơn vị.", "measure": "Số lượng", "unit": "Báo cáo", "detail": "Không bắt buộc", "period": "Tuần, tháng"},
  {"STT": 49, "code": "HCTH-VANBAN", "category": "Nhiệm vụ đặc thù", "name": "Quản lý văn bản và công việc hành chính", "desc": "Theo dõi văn bản đến/đi, người xử lý, hạn và kết quả.", "measure": "Số lượng", "unit": "Văn bản", "detail": "Không bắt buộc", "period": "Tuần, tháng, quý, năm"},
  {"STT": 50, "code": "NVDTPC-BCNGAY", "category": "Nhiệm vụ đặc thù", "name": "Báo cáo thu, nợ hằng ngày", "desc": "Tổng hợp chỉ tiêu được giao, kết quả trong ngày, lũy kế và còn phải thực hiện theo tổ.", "measure": "Số lượng + số tiền", "unit": "Chỉ tiêu và đồng", "detail": "Có một phần", "period": "Ngày, tuần, tháng"},
  {"STT": 51, "code": "NVDTPC-DOICHIEU", "category": "Nhiệm vụ đặc thù", "name": "Đối chiếu số liệu giữa các tổ", "desc": "Theo dõi chênh lệch giữa số chi tiết và số tổng hợp, nguyên nhân và kết quả điều chỉnh.", "measure": "Số lượng + số tiền", "unit": "Chỉ tiêu/NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 52, "code": "NVDTPC-TUYENTRUYEN", "category": "Nhiệm vụ đặc thù", "name": "Tuyên truyền chính sách thuế", "desc": "Theo dõi sản phẩm truyền thanh, website, mạng xã hội, tài liệu và kết quả triển khai.", "measure": "Số lượng", "unit": "Sản phẩm/hoạt động", "detail": "Không bắt buộc", "period": "Tháng, quý, năm"},
  {"STT": 53, "code": "NVDTPC-PHAPCHE", "category": "Nhiệm vụ đặc thù", "name": "Theo dõi công tác pháp chế và vướng mắc nghiệp vụ", "desc": "Theo dõi văn bản/vướng mắc, đơn vị đề nghị, thời hạn trả lời và kết quả.", "measure": "Số lượng", "unit": "Vụ việc/văn bản", "detail": "Không bắt buộc", "period": "Tuần, tháng, quý, năm"},
  {"STT": 54, "code": "NVDTPC-BAOCAOTUAN", "category": "Nhiệm vụ đặc thù", "name": "Tổng hợp chỉ tiêu Văn phòng kiểm đếm", "desc": "Theo dõi dữ liệu các tổ gửi, kiểm tra đủ/thiếu và tổng hợp chỉ tiêu tuần/tháng toàn TCS23.", "measure": "Số lượng + số tiền", "unit": "Chỉ tiêu và đồng", "detail": "Có một phần", "period": "Tuần, tháng"},
  {"STT": 55, "code": "QLTK-DVC_DAT", "category": "Nhiệm vụ đặc thù", "name": "Hồ sơ DVC và nghĩa vụ tài chính đất", "desc": "Theo dõi hồ sơ tiếp nhận, hạn, cán bộ, kết quả, số tiền nghĩa vụ và quá hạn.", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 56, "code": "QLTK-LPTB", "category": "Nhiệm vụ đặc thù", "name": "Lệ phí trước bạ và hồ sơ phương tiện", "desc": "Theo dõi hồ sơ nhà đất/phương tiện, số tiền, chứng từ và kết quả xử lý.", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 57, "code": "QLTK-TNCN_BDS", "category": "Nhiệm vụ đặc thù", "name": "Thuế TNCN từ bất động sản", "desc": "Theo dõi từng hồ sơ chuyển nhượng, doanh thu, số thuế và kết quả nộp.", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 58, "code": "QLTK-PNN", "category": "Nhiệm vụ đặc thù", "name": "Thuế sử dụng đất phi nông nghiệp", "desc": "Theo dõi NNT/thửa đất, số phải nộp, đã nộp, nộp thừa và dữ liệu cần chuẩn hóa.", "measure": "Số lượng + số tiền", "unit": "NNT/thửa đất và đồng", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 59, "code": "QLTK-CHUANHOA", "category": "Nhiệm vụ đặc thù", "name": "Chuẩn hóa dữ liệu đất và nộp thừa", "desc": "Theo dõi từng trường hợp dữ liệu lỗi/biến động/nộp thừa và kết quả xử lý.", "measure": "Số lượng + số tiền", "unit": "NNT/thửa đất và đồng", "detail": "Có", "period": "Tháng, quý, năm"},
  
  // Tổ Kiểm tra: 15 nhiệm vụ toàn diện (gồm 6 chỉ tiêu KPI Cục giao + các nhiệm vụ chuyên môn)
  {"STT": 60, "code": "KIEMTRA-KHKT", "category": "Kiểm tra thuế", "name": "Thực hiện kế hoạch kiểm tra tại trụ sở NNT", "desc": "Theo dõi kế hoạch kiểm tra được giao đến từng công chức, quyết định, tiến độ và kết quả hoàn thành theo tuần, tháng, lũy kế.", "measure": "Số lượng", "unit": "Cuộc kiểm tra", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 61, "code": "KIEMTRA-TRUYTHU", "category": "Kiểm tra thuế", "name": "Đôn đốc nộp ngân sách qua kiểm tra", "desc": "Theo dõi số truy thu, truy hoàn, phạt, chậm nộp phải thu, đã nộp vào NSNN và còn phải đôn đốc.", "measure": "Số lượng + số tiền", "unit": "NNT/cuộc kiểm tra và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 62, "code": "KIEMTRA-BQT", "category": "Kiểm tra thuế", "name": "Số thu bình quân 01 cuộc kiểm tra", "desc": "Tính số thu, truy thu và phạt bình quân trên 01 cuộc kiểm tra theo từng công chức theo tuần, tháng và lũy kế.", "measure": "Số tiền", "unit": "Đồng/cuộc", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 63, "code": "KIEMTRA-TMS_TTR", "category": "Kiểm tra thuế", "name": "Nhập kết quả kiểm tra lên ứng dụng TMS/TTR", "desc": "Theo dõi từng cuộc kiểm tra phải nhập, đã nhập, lỗi và còn phải cập nhật lên hệ thống TMS/TTR.", "measure": "Số lượng", "unit": "Cuộc kiểm tra", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 64, "code": "KIEMTRA-DONGMA", "category": "Kiểm tra thuế", "name": "Kiểm tra hồ sơ đóng mã số thuế, giải thể", "desc": "Theo dõi hồ sơ kiểm tra đóng mã, giải thể được giao, đã hoàn thành và còn tồn đọng.", "measure": "Số lượng + số tiền", "unit": "NNT/hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 65, "code": "KIEMTRA-HOANKT", "category": "Kiểm tra thuế", "name": "Kiểm tra trước hoàn và sau hoàn thuế", "desc": "Theo dõi từng hồ sơ hoàn thuế phải kiểm tra, tiến độ, kết quả và số tiền xử lý qua kiểm tra.", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 66, "code": "KIEMTRA-CHUYENDEKT", "category": "Kiểm tra thuế", "name": "Kiểm tra chuyên đề và các gói rủi ro", "desc": "Theo dõi từng NNT thuộc chuyên đề rủi ro, kế hoạch, ban hành quyết định và kết quả kiểm tra.", "measure": "Số lượng + số tiền", "unit": "NNT/cuộc kiểm tra và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 67, "code": "KIEMTRA-KLTT", "category": "Kiểm tra thuế", "name": "Thực hiện kết luận thanh tra, kiểm toán", "desc": "Theo dõi nội dung kết luận thanh tra/kiểm toán, đơn vị, NNT liên quan, thời hạn và kết quả thực hiện.", "measure": "Số lượng + số tiền", "unit": "Nội dung/NNT và đồng", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 68, "code": "KIEMTRA-CHUYENDIADIEM", "category": "Kiểm tra thuế", "name": "Kiểm tra chuyển địa điểm kinh doanh", "desc": "Theo dõi NNT phát sinh yêu cầu hoặc điều kiện kiểm tra khi chuyển địa điểm kinh doanh.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 69, "code": "KIEMTRA-BAOCAO", "category": "Kiểm tra thuế", "name": "Báo cáo chuyên đề theo CV và phối hợp", "desc": "Theo dõi các gói công việc theo công văn chỉ đạo, báo cáo phối hợp định kỳ và đột xuất đến từng NNT.", "measure": "Số lượng", "unit": "NNT/Báo cáo", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 70, "code": "KIEMTRA-NOIBO", "category": "Kiểm tra nội bộ", "name": "Thực hiện kế hoạch kiểm tra nội bộ (KTNB)", "desc": "Theo dõi kế hoạch kiểm tra nội bộ được giao, số cuộc, chuyên đề và kết quả thực hiện trong năm.", "measure": "Số lượng", "unit": "Cuộc kiểm tra", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 71, "code": "KIEMTRA-KNTC", "category": "Khiếu nại tố cáo", "name": "Giải quyết đơn thư KNTC, phản ánh, đường dây nóng", "desc": "Theo dõi tiếp nhận, phân loại và giải quyết đơn thư khiếu nại, tố cáo, phản ánh, đường dây nóng đúng thời hạn.", "measure": "Số lượng", "unit": "Hồ sơ/Đơn thư", "detail": "Có", "period": "Tháng, quý, năm"},
  {"STT": 72, "code": "ETAX-PNN", "category": "eTax Mobile", "name": "eTax Mobile đối với người nộp thuế đất PNN", "desc": "Theo dõi người nộp thuế sử dụng đất phi nông nghiệp đăng ký tài khoản, cài đặt, liên kết ngân hàng và phát sinh giao dịch điện tử trên eTax Mobile.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 73, "code": "ETAX-TNCN", "category": "eTax Mobile", "name": "eTax Mobile đối với cá nhân có thu nhập tiền lương tiền công", "desc": "Theo dõi cá nhân có thu nhập từ tiền lương, tiền công đăng ký tài khoản, cài đặt, liên kết ngân hàng và có giao dịch điện tử trên eTax Mobile.", "measure": "Số lượng", "unit": "NNT", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 74, "code": "HKD-HDDT-MTT", "category": "Hóa đơn điện tử", "name": "Hóa đơn điện tử có mã từ máy tính tiền của HKD", "desc": "Theo dõi tỷ lệ hộ kinh doanh đã sử dụng HĐĐT khởi tạo từ máy tính tiền trên tổng số HKD đã đăng ký và đang hoạt động.", "measure": "Số lượng", "unit": "HKD", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 75, "code": "HKD-TMDT-GOI", "category": "Thương mại điện tử", "name": "Khai thác dữ liệu TMĐT các gói trọng điểm (GHTK, TikTok, CV 3049, Gói 3 1577)", "desc": "Theo dõi rà soát và xử lý các gói TMĐT: Gói GHTK trên 1 tỷ, Gói TikTok creators, Gói Công văn 3049/CT-TMĐT và Gói 3 1577.", "measure": "Số lượng + số tiền", "unit": "HKD và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 76, "code": "HKD-CHUYENDOI-DN", "category": "Hộ kinh doanh", "name": "Tuyên truyền vận động hộ kinh doanh chuyển đổi lên doanh nghiệp", "desc": "Theo dõi số hộ kinh doanh thuộc diện tiềm năng, công tác tuyên truyền, hướng dẫn và kết quả chuyển đổi lên doanh nghiệp.", "measure": "Số lượng", "unit": "HKD", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 77, "code": "KIEMTRA-DICH-DANH", "category": "Kiểm tra thuế", "name": "Kế hoạch kiểm tra đích danh năm 2026", "desc": "Theo dõi tiến độ và kết quả hoàn thành kế hoạch kiểm tra đích danh tại trụ sở NNT năm 2026.", "measure": "Số lượng", "unit": "Cuộc kiểm tra", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 78, "code": "KIEMTRA-KN-SAUKT", "category": "Kiểm tra thuế", "name": "Giải quyết khiếu nại phát sinh sau kiểm tra", "desc": "Theo dõi tỷ lệ và kết quả giải quyết các đơn thư, khiếu nại phát sinh sau khi ban hành quyết định xử lý kiểm tra thuế.", "measure": "Số lượng", "unit": "Hồ sơ", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 79, "code": "HOAN-GTGT-CHUYENKT", "category": "Kiểm tra thuế", "name": "Hồ sơ hoàn thuế GTGT chuyển kiểm tra trước hoàn", "desc": "Theo dõi hồ sơ đề nghị hoàn thuế GTGT điện tử chuyển kiểm tra trước hoàn (hồ sơ hoàn lần đầu, hồ sơ có rủi ro).", "measure": "Số lượng", "unit": "Hồ sơ", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 80, "code": "HOAN-TNCN-TUDONG", "category": "Hoàn thuế", "name": "Giải quyết hoàn thuế TNCN tự động", "desc": "Theo dõi tỷ lệ ban hành Quyết định, Lệnh hoàn trên số hồ sơ đủ điều kiện hoàn thuế TNCN tự động (số lượng và số tiền).", "measure": "Số lượng + số tiền", "unit": "Hồ sơ và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 81, "code": "QLN-THANG", "category": "Quản lý nợ", "name": "Tăng giảm nợ so với tháng trước và thu nợ theo kế hoạch", "desc": "Theo dõi tỷ lệ tăng giảm nợ thuế so với tháng trước liền kề, tỷ lệ nợ khả năng thu, nợ thuế phí/tổng thu (<5%) và thu nợ theo kế hoạch.", "measure": "Số tiền", "unit": "Đồng", "detail": "Có một phần", "period": "Tháng"},
  {"STT": 82, "code": "THXC-TRANGTHAI", "category": "Cưỡng chế/THXC", "name": "Tạm hoãn xuất cảnh theo trạng thái MST (TT00, 03, 06)", "desc": "Theo dõi số lượng và số tiền đã thực hiện tạm hoãn xuất cảnh phân tách theo Trạng thái 00, 03 và Trạng thái 06.", "measure": "Số lượng + số tiền", "unit": "NNT và đồng", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 83, "code": "HCTH-DVCQG", "category": "Thủ tục hành chính", "name": "Xử lý phản ánh Cổng DVCQG và hỏi đáp Cổng TTĐT BTC", "desc": "Theo dõi tỷ lệ phản ánh, kiến nghị trên Cổng DVCQG/Thuế điện tử và câu hỏi chính sách thuế trên Cổng TTĐT BTC được trả lời đúng hạn.", "measure": "Số lượng", "unit": "Phản ánh/Câu hỏi", "detail": "Có", "period": "Tuần, tháng, quý, năm"},
  {"STT": 84, "code": "HCTH-GIAINGAN", "category": "Hành chính tổng hợp", "name": "Tiến độ giải ngân kinh phí chi thường xuyên", "desc": "Theo dõi tỷ lệ giải ngân kinh phí dự toán chi thường xuyên được giao của Thuế cơ sở 23.", "measure": "Số tiền", "unit": "Đồng", "detail": "Không bắt buộc", "period": "Tuần, tháng, quý, năm"},
  {"STT": 85, "code": "HCTH-CANBO", "category": "Hành chính tổng hợp", "name": "Công tác cán bộ, đào tạo và kỷ luật công vụ", "desc": "Theo dõi tỷ lệ thực hiện kế hoạch đào tạo, bồi dưỡng; tỷ lệ luân chuyển, điều động, chuyển đổi vị trí công tác và chấp hành kỷ cương công vụ.", "measure": "Số lượng", "unit": "Cán bộ/Lượt", "detail": "Không bắt buộc", "period": "Tuần, tháng, quý, năm"},
  {"STT": 86, "code": "NVDTPC-QUYMO", "category": "Nghiệp vụ dự toán", "name": "Quy mô đối tượng quản lý (DN, HKD, cá nhân, mã PNN)", "desc": "Theo dõi số lượng DN, tổ chức, HKD, cá nhân kinh doanh và mã PNN có phát sinh nộp thuế đang quản lý phục vụ dữ liệu nền.", "measure": "Số lượng", "unit": "NNT", "detail": "Không bắt buộc", "period": "Tuần, tháng, quý, năm"}
];

export const TASK_APP = {
  "HKD1": ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "KK", "QLTK-PHANANH", "SACHMASOTHUE", "HKD-ETAX", "HKD-HDDT", "HKD-HOTRO", "HKD-KTTB", "HKD-QLDT", "HKD-TKNH", "HKD-TMDT", "HKD-SACHMASOTHUE", "HKD-QLRR", "ETAX-TNCN", "HKD-HDDT-MTT", "HKD-TMDT-GOI", "HKD-CHUYENDOI-DN", "HOAN-TNCN-TUDONG", "QLN-THANG", "THXC-TRANGTHAI"],
  "HKD2": ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "KK", "QLTK-PHANANH", "SACHMASOTHUE", "HKD-ETAX", "HKD-HDDT", "HKD-HOTRO", "HKD-KTTB", "HKD-QLDT", "HKD-TKNH", "HKD-TMDT", "HKD-SACHMASOTHUE", "HKD-QLRR", "ETAX-TNCN", "HKD-HDDT-MTT", "HKD-TMDT-GOI", "HKD-CHUYENDOI-DN", "HOAN-TNCN-TUDONG", "QLN-THANG", "THXC-TRANGTHAI"],
  "QLDN1": ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "KK", "QLTK-PHANANH", "QLDN-KIENTHI", "QLDN-KTTB", "QLDN-TRASOAT", "QLDN-KLCA", "QLDN-CLGTGT-HDDT", "QLDN-TKGTGT", "QLDN-TKTNDN", "QLDN-TKLOITRUC", "QLDN-XPVPHC", "QLDN-HOANGTGT", "QLDN-HOANTNCN", "QLDN-TMDT", "QLDN-GOINGUON2025", "QLDN-TIENTHUA", "QLDN-KT-VANGBAC", "QLDN-KT-XANGDAU", "QLDN-KT-MHRR", "QLDN-KT-GDLK", "QLDN2-QLDN", "QLDN-TKDUONG", "QLDN-CHUYENDE", "QLDN_GDL", "ETAX-TNCN", "HOAN-GTGT-CHUYENKT", "HOAN-TNCN-TUDONG", "QLN-THANG", "THXC-TRANGTHAI", "HCTH-DVCQG"],
  "QLDN2": ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "KK", "QLTK-PHANANH", "QLDN-KIENTHI", "QLDN-KTTB", "QLDN-TRASOAT", "QLDN-KLCA", "QLDN-CLGTGT-HDDT", "QLDN-TKGTGT", "QLDN-TKTNDN", "QLDN-TKLOITRUC", "QLDN-XPVPHC", "QLDN-HOANGTGT", "QLDN-HOANTNCN", "QLDN-TMDT", "QLDN-GOINGUON2025", "QLDN-TIENTHUA", "QLDN-KT-VANGBAC", "QLDN-KT-XANGDAU", "QLDN-KT-MHRR", "QLDN-KT-GDLK", "QLDN2-QLDN", "QLDN-TKDUONG", "QLDN-CHUYENDE", "QLDN_GDL", "ETAX-TNCN", "HOAN-GTGT-CHUYENKT", "HOAN-TNCN-TUDONG", "QLN-THANG", "THXC-TRANGTHAI", "HCTH-DVCQG"],
  "KIEMTRA": ["KIEMTRA-KHKT", "KIEMTRA-TRUYTHU", "KIEMTRA-BQT", "KIEMTRA-TMS_TTR", "KIEMTRA-DONGMA", "KIEMTRA-HOANKT", "KIEMTRA-CHUYENDEKT", "KIEMTRA-KLTT", "KIEMTRA-CHUYENDIADIEM", "KIEMTRA-BAOCAO", "KIEMTRA-NOIBO", "KIEMTRA-KNTC", "KIEMTRA-DICH-DANH", "KIEMTRA-KN-SAUKT", "HOAN-GTGT-CHUYENKT"],
  "HCTH": ["HCTH-HAILONG", "HCTH-NVLD", "HCTH-BCGB", "HCTH-VANBAN", "HCTH-DVCQG", "HCTH-GIAINGAN", "HCTH-CANBO"],
  "NVDTPC": ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "QLTK-PHANANH", "NVDTPC-BCNGAY", "NVDTPC-DOICHIEU", "NVDTPC-TUYENTRUYEN", "NVDTPC-PHAPCHE", "NVDTPC-BAOCAOTUAN", "QLN-THANG", "THXC-TRANGTHAI", "NVDTPC-QUYMO"],
  "QLTK": ["TTHC", "CCN", "NO", "PHOIHOP", "THU", "DKT", "THXC", "HD", "HSK", "TPR", "HOAN", "QLTK-PHANANH", "QLTK-DVC_DAT", "QLTK-LPTB", "QLTK-TNCN_BDS", "QLTK-PNN", "QLTK-CHUANHOA", "ETAX-PNN"]
};

export async function syncExcelTemplatesAndKpi() {
  console.log('===================================================================');
  console.log('[sync-excel] BẮT ĐẦU ĐỒNG BỘ DỮ LIỆU TỔ KIỂM TRA VÀ BIỂU MẪU EXCEL');
  console.log('===================================================================');

  // 1. Inspect Biểu chấm KPI Tổ kiểm tra gửi Uyên.xlsx
  const candidateKpiPaths = [
    join(workspaceRoot, 'Biểu chấm KPI Tổ kiểm tra gửi Uyên.xlsx'),
    join(projectRoot, 'TCS23_Quản lý công việc', 'quản lý công việc tcs23', 'KTRA', 'Tổ KTR.Kiểm tra tại trụ sở NNT.xlsx'),
    join(projectRoot, 'Bộ tiêu chí.xlsx'),
  ];

  let kpiSourcePath = candidateKpiPaths.find(p => existsSync(p));
  if (kpiSourcePath) {
    try {
      console.log(`[sync-excel] Tìm thấy file biểu kiểm tra: ${kpiSourcePath}`);
      const wb = XLSX.readFile(kpiSourcePath);
      console.log(`[sync-excel] Các sheet có trong file: ${wb.SheetNames.join(', ')}`);

      const dumpObj = {
        sourceFile: kpiSourcePath,
        inspectedAt: new Date().toISOString(),
        sheetNames: wb.SheetNames,
        sheets: {}
      };

      const logLines = [
        `================================================================================`,
        `INSPECT REPORT: ${kpiSourcePath}`,
        `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
        `Các sheet (${wb.SheetNames.length}): ${wb.SheetNames.join(', ')}`,
        `================================================================================`
      ];

      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
        dumpObj.sheets[sheetName] = rows;

        logLines.push(`\n--- SHEET: [${sheetName}] (Tổng số dòng: ${rows.length}) ---`);
        for (let r = 0; r < Math.min(rows.length, 50); r++) {
          const rowArr = rows[r];
          if (Array.isArray(rowArr) && rowArr.some(c => String(c).trim() !== '')) {
            logLines.push(`Dòng ${(r + 1).toString().padStart(3, '0')}: ` + rowArr.join(' | '));
          }
        }
      });

      // Save inspection log & JSON
      const outLogPath = join(__dirname, 'kpi_kiemtra_output.txt');
      writeFileSync(outLogPath, logLines.join('\n'), 'utf8');

      const dataDir = join(appRoot, 'src', 'data');
      if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
      writeFileSync(join(dataDir, 'kpi_kiemtra_dump.json'), JSON.stringify(dumpObj, null, 2), 'utf8');

      console.log(`[sync-excel] Đã ghi nhận toàn bộ dữ liệu kiểm tra vào: src/data/kpi_kiemtra_dump.json`);
    } catch (err) {
      console.warn(`[sync-excel] Cảnh báo khi đọc file biểu kiểm tra:`, err.message);
    }
  } else {
    console.log(`[sync-excel] Không tìm thấy file biểu chấm KPI kiểm tra tại đường dẫn tuyệt đối, tiếp tục sinh biểu mẫu chuẩn.`);
  }

  // 2. Generate updated Excel Template Workbook with all 86 tasks (including all 15 KT tasks)
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Du lieu
    const DU_LIEU_HEADERS = [
      'STT',
      'Tên nhiệm vụ',
      'Cán bộ',
      'Địa bàn xã cũ',
      'Địa bàn xã mới',
      'Tổ quản lý',
      'Mã số thuế',
      'CCCD',
      'Phải thực hiện',
      'Đã thực hiện',
      'Thời hạn',
      'Ghi chú'
    ];

    const duLieuRows = [DU_LIEU_HEADERS];

    // Pre-populate representative rows for all 15 KT tasks and 5 KT officers
    let stt = 1;
    const ktStaff = STAFF["KIEMTRA"] || [];
    const ktTaskCodes = TASK_APP["KIEMTRA"] || [];
    
    ktStaff.forEach((officer, oIdx) => {
      // Assign primary tasks to each officer
      ktTaskCodes.forEach((taskId, tIdx) => {
        const taskDef = TASKS.find(t => t.code === taskId);
        if (taskDef && (tIdx % ktStaff.length === oIdx || tIdx < 6)) {
          const assigned = 10 + (tIdx * 5) + (oIdx * 2);
          const completed = Math.round(assigned * (0.8 + (tIdx % 3) * 0.08));
          duLieuRows.push([
            stt++,
            taskDef.name,
            officer.name,
            "Theo kế hoạch kiểm tra",
            "Toàn TCS23",
            "Tổ Kiểm tra",
            `010${1000000 + stt}`,
            `00109${200000 + stt}`,
            assigned,
            completed,
            "2026-10-31",
            `Nhiệm vụ kiểm tra tháng - ${taskDef.category}`
          ]);
        }
      });
    });

    // Add representative rows for other teams
    Object.entries(STAFF).forEach(([teamCode, staffList]) => {
      if (teamCode === 'KIEMTRA') return;
      const teamObj = TEAMS.find(t => t.code === teamCode);
      const appTasks = TASK_APP[teamCode] || [];
      const leader = staffList[0];
      if (leader && appTasks.length > 0) {
        const firstTask = TASKS.find(t => t.code === appTasks[0]);
        if (firstTask) {
          duLieuRows.push([
            stt++,
            firstTask.name,
            leader.name,
            leader.area || "Toàn TCS23",
            "Toàn TCS23",
            teamObj?.name || teamCode,
            `010${1000000 + stt}`,
            `00109${200000 + stt}`,
            25,
            22,
            "2026-10-31",
            `Chỉ tiêu giao tháng`
          ]);
        }
      }
    });

    // Add blank template rows up to row 300 for data entry
    while (duLieuRows.length <= 300) {
      duLieuRows.push([stt++, "", "", "", "", "", "", "", "", "", "", ""]);
    }

    const wsDuLieu = XLSX.utils.aoa_to_sheet(duLieuRows);
    XLSX.utils.book_append_sheet(wb, wsDuLieu, "Du lieu");

    // Sheet 2: Danh muc
    const DANH_MUC_HEADERS = [
      'Tên nhiệm vụ',
      'Tổ thực hiện',
      'Cán bộ',
      'Địa bàn xã cũ',
      'Địa bàn xã mới',
      'Tổ quản lý'
    ];

    const allOfficers = [];
    Object.entries(STAFF).forEach(([tCode, sList]) => {
      sList.forEach(s => allOfficers.push(s.name));
    });

    const oldAreas = [
      "xã An Khánh (hết hiệu lực)",
      "xã Vân Côn (hết hiệu lực)",
      "xã Vân Canh (hết hiệu lực)",
      "xã Sơn Đồng (hết hiệu lực)",
      "xã Song Phương (hết hiệu lực)",
      "xã Tiền Yên (hết hiệu lực)",
      "xã Lại Yên (hết hiệu lực)",
      "xã La Phù (hết hiệu lực)",
      "xã Cát Quế (hết hiệu lực)",
      "xã Đắc Sở (hết hiệu lực)",
      "thị trấn Trạm Trôi (hết hiệu lực)",
      "xã Yên Sở (hết hiệu lực)",
      "xã Di Trạch (hết hiệu lực)",
      "xã Dương Liễu (hết hiệu lực)",
      "xã Đức Thượng (hết hiệu lực)",
      "xã Đức Giang (hết hiệu lực)",
      "xã Kim Chung (hết hiệu lực)",
      "xã Minh Khai (hết hiệu lực)",
      "xã An Thượng (hết hiệu lực)",
      "xã Đông La (hết hiệu lực)"
    ];

    const newAreas = ["xã Hoài Đức", "xã Sơn Đồng", "xã An Khánh", "xã Dương Hòa"];
    const teamNames = TEAMS.map(t => t.name);

    const danhMucRows = [DANH_MUC_HEADERS];
    const maxLen = Math.max(TASKS.length, allOfficers.length, oldAreas.length, newAreas.length, teamNames.length);

    for (let i = 0; i < maxLen; i++) {
      const taskObj = TASKS[i];
      let assignedTeamsStr = "";
      if (taskObj) {
        const assignedTeams = [];
        Object.entries(TASK_APP).forEach(([tCode, taskList]) => {
          if (taskList.includes(taskObj.code)) {
            assignedTeams.push(tCode);
          }
        });
        assignedTeamsStr = assignedTeams.join(', ');
      }

      danhMucRows.push([
        taskObj ? taskObj.name : "",
        assignedTeamsStr,
        allOfficers[i] || "",
        oldAreas[i] || "",
        newAreas[i] || "",
        teamNames[i] || ""
      ]);
    }

    const wsDanhMuc = XLSX.utils.aoa_to_sheet(danhMucRows);
    XLSX.utils.book_append_sheet(wb, wsDanhMuc, "Danh muc");

    // Sheet 3: Huong dan
    const huongDanRows = [
      ["Mục", "Hướng dẫn"],
      ["Cách dùng", "Nhập dữ liệu vào sheet 'Du lieu', sau đó import trực tiếp trên giao diện website hoặc qua chức năng cập nhật."],
      ["Tên nhiệm vụ", "Bắt buộc. Chọn trong danh mục để hệ thống nhận diện và tính KPI chính xác."],
      ["Cán bộ", "Bắt buộc. Chọn đúng họ tên cán bộ trong danh mục 54 cán bộ của TCS23."],
      ["Tổ quản lý", "Chọn đúng tổ phụ trách (ví dụ: Tổ Kiểm tra, Tổ QLDN1, Tổ QLDN2, Tổ HKD1, Tổ HKD2, Tổ HCTH, Tổ NVDTPC, Tổ QLTK)."],
      ["Phải thực hiện", "Nhập số chỉ tiêu giao, số nguyên không âm."],
      ["Đã thực hiện", "Nhập số đã giải quyết/đã kiểm tra/đã đạt được, số nguyên không âm."],
      ["Thời hạn", "Định dạng ngày yyyy-mm-dd (ví dụ 2026-10-31)."],
      ["Tổ Kiểm tra", "Đã tích hợp đầy đủ 15 nhiệm vụ kiểm tra và 6 chỉ tiêu KPI Cục giao (KHKT, Đích danh, Số thu BQ, Đóng mã giải thể, Đôn đốc nộp NS, Giải quyết khiếu nại sau KT)."],
      ["Lưu ý", "Không sửa đổi tên các cột chính tại hàng 1 của sheet 'Du lieu'."]
    ];
    const wsHuongDan = XLSX.utils.aoa_to_sheet(huongDanRows);
    XLSX.utils.book_append_sheet(wb, wsHuongDan, "Huong dan");

    // Sheet 4: TaskDefinitions (Relational sheet)
    const taskDefRows = [
      ['Mã nhiệm vụ', 'Tên nhiệm vụ', 'Nhóm', 'Đơn vị', 'Cách đo', 'Kỳ báo cáo', 'Mã tổ áp dụng']
    ];
    TASKS.forEach(t => {
      const appTeams = [];
      Object.entries(TASK_APP).forEach(([tCode, taskList]) => {
        if (taskList.includes(t.code)) appTeams.push(tCode);
      });
      taskDefRows.push([
        t.code,
        t.name,
        t.category,
        t.unit,
        t.measure,
        t.period,
        appTeams.join(',')
      ]);
    });
    const wsTaskDefs = XLSX.utils.aoa_to_sheet(taskDefRows);
    XLSX.utils.book_append_sheet(wb, wsTaskDefs, "TaskDefinitions");

    // Sheet 5: Officers (Relational sheet)
    const officerRows = [
      ['Mã cán bộ', 'Tên cán bộ', 'Chức danh', 'Mã tổ', 'Địa bàn']
    ];
    Object.entries(STAFF).forEach(([tCode, sList]) => {
      sList.forEach((s, idx) => {
        officerRows.push([
          `${tCode}-CB${String(idx + 1).padStart(2, '0')}`,
          s.name,
          s.role,
          tCode,
          s.area
        ]);
      });
    });
    const wsOfficers = XLSX.utils.aoa_to_sheet(officerRows);
    XLSX.utils.book_append_sheet(wb, wsOfficers, "Officers");

    // Sheet 6: Teams (Relational sheet)
    const teamRows = [
      ['Mã tổ', 'Tên tổ', 'Tên ngắn']
    ];
    TEAMS.forEach(t => {
      teamRows.push([t.code, t.name, t.short]);
    });
    const wsTeams = XLSX.utils.aoa_to_sheet(teamRows);
    XLSX.utils.book_append_sheet(wb, wsTeams, "Teams");

    // Write out files
    const publicPath = join(appRoot, 'public', 'mau-tong-hop.xlsx');
    const distPath = join(appRoot, 'dist', 'mau-tong-hop.xlsx');
    const rootTemplatePath = join(projectRoot, 'mau-du-lieu-day-len-web.xlsx');
    const rootConsolidatedPath = join(projectRoot, 'Bảng tổng hợp đẩy dữ liệu công việc.xlsx');

    XLSX.writeFile(wb, publicPath);
    console.log(`[sync-excel] Đã cập nhật file: ${publicPath}`);

    if (existsSync(join(appRoot, 'dist'))) {
      XLSX.writeFile(wb, distPath);
      console.log(`[sync-excel] Đã cập nhật file: ${distPath}`);
    }

    XLSX.writeFile(wb, rootTemplatePath);
    console.log(`[sync-excel] Đã cập nhật file: ${rootTemplatePath}`);

    XLSX.writeFile(wb, rootConsolidatedPath);
    console.log(`[sync-excel] Đã cập nhật file: ${rootConsolidatedPath}`);

    // Generate individual team templates
    try {
      const { generateAllTeamExcelTemplates } = await import('./generate-team-templates.mjs');
      generateAllTeamExcelTemplates();
    } catch (teamErr) {
      console.error('[sync-excel] Lỗi khi tạo file mẫu từng tổ:', teamErr);
    }

    console.log('[sync-excel] ĐÃ HOÀN TẤT ĐỒNG BỘ 86 NHIỆM VỤ & BIỂU MẪU ĐẨY VÀO ỨNG DỤNG!');
    console.log('===================================================================');
  } catch (err) {
    console.error('[sync-excel] Lỗi khi tạo file Excel:', err);
  }
}

// If executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncExcelTemplatesAndKpi();
}

