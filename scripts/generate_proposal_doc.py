#!/usr/bin/env python3
import base64
import os
import shutil
from pathlib import Path

# Paths
APP_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = APP_DIR.parent
OUTPUT_DOC = ROOT_DIR / "To_trinh_phe_duyet_trang_web_noi_bo_QLRR.doc"

# Find image path
USER_UPLOADED_DIR = Path(r"D:\Users\HKD1\.gemini\antigravity\brain\07a08571-3fbe-48a4-b13d-84d5fd14b466\.user_uploaded")
DASHBOARD_IMG = USER_UPLOADED_DIR / "media_1787751119294.png"
KPI_IMG = USER_UPLOADED_DIR / "media_1787750044208.png"

# Target local image paths
LOCAL_DASHBOARD = ROOT_DIR / "hinh1_tong_quan_he_thong.png"
LOCAL_KPI = ROOT_DIR / "hinh2_bang_kpi_tuan.png"

# Copy local images if they exist
dashboard_b64 = ""
kpi_b64 = ""

if DASHBOARD_IMG.exists():
    shutil.copyfile(DASHBOARD_IMG, LOCAL_DASHBOARD)
    with open(DASHBOARD_IMG, "rb") as f:
        dashboard_b64 = base64.b64encode(f.read()).decode("utf-8")

if KPI_IMG.exists():
    shutil.copyfile(KPI_IMG, LOCAL_KPI)
    with open(KPI_IMG, "rb") as f:
        kpi_b64 = base64.b64encode(f.read()).decode("utf-8")

img_dashboard_src = f"data:image/png;base64,{dashboard_b64}" if dashboard_b64 else LOCAL_DASHBOARD.name
img_kpi_src = f"data:image/png;base64,{kpi_b64}" if kpi_b64 else LOCAL_KPI.name

doc_content = f"""<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>Tờ trình phê duyệt phương án triển khai Web quản lý công việc TCS23</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {{
    size: 21.0cm 29.7cm;
    margin: 2.0cm 2.0cm 2.0cm 2.5cm;
    mso-page-orientation: portrait;
  }}
  body {{
    font-family: "Times New Roman", Times, serif;
    font-size: 14pt;
    line-height: 1.35;
    color: #000000;
    text-align: justify;
  }}
  .header-table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18pt;
  }}
  .header-table td {{
    vertical-align: top;
    text-align: center;
    padding: 0;
    font-family: "Times New Roman", Times, serif;
  }}
  .org-name {{
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
  }}
  .unit-name {{
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
  }}
  .doc-num {{
    font-size: 13pt;
    margin-top: 4pt;
  }}
  .country-name {{
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
  }}
  .motto {{
    font-size: 13pt;
    font-weight: bold;
  }}
  .divider {{
    width: 40%;
    margin: 3pt auto;
    border-top: 1px solid #000;
  }}
  .divider-motto {{
    width: 60%;
    margin: 3pt auto;
    border-top: 1px solid #000;
  }}
  .doc-date {{
    font-size: 13pt;
    font-style: italic;
    margin-top: 4pt;
    text-align: right;
  }}
  .title-block {{
    text-align: center;
    margin: 20pt 0 15pt 0;
  }}
  .doc-title {{
    font-size: 15pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 6pt;
  }}
  .doc-subtitle {{
    font-size: 13pt;
    font-weight: bold;
    font-style: italic;
    padding: 0 20pt;
  }}
  .recipient-block {{
    text-align: center;
    margin-bottom: 16pt;
    font-size: 14pt;
  }}
  .recipient-name {{
    font-weight: bold;
  }}
  h2 {{
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 14pt;
    margin-bottom: 4pt;
  }}
  h3 {{
    font-size: 14pt;
    font-weight: bold;
    margin-top: 10pt;
    margin-bottom: 3pt;
  }}
  p {{
    margin-top: 0;
    margin-bottom: 6pt;
    text-indent: 1.27cm;
  }}
  ul, ol {{
    margin-top: 0;
    margin-bottom: 6pt;
    padding-left: 2.5cm;
  }}
  li {{
    margin-bottom: 4pt;
  }}
  .image-container {{
    text-align: center;
    margin: 14pt 0;
    page-break-inside: avoid;
  }}
  .image-container img {{
    max-width: 100%;
    width: 620px;
    height: auto;
    border: 1px solid #94A3B8;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.15);
  }}
  .image-caption {{
    font-size: 12pt;
    font-style: italic;
    margin-top: 5pt;
    text-align: center;
    color: #334155;
  }}
  .sign-table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 25pt;
    page-break-inside: avoid;
  }}
  .sign-table td {{
    vertical-align: top;
    font-family: "Times New Roman", Times, serif;
    padding: 0;
  }}
  .recipients-col {{
    width: 55%;
    font-size: 12pt;
  }}
  .recipients-title {{
    font-weight: bold;
    font-style: italic;
  }}
  .recipients-list {{
    margin: 0;
    padding-left: 15pt;
    font-size: 11pt;
  }}
  .sign-col {{
    width: 45%;
    text-align: center;
    font-size: 13pt;
  }}
  .sign-role {{
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 45pt;
  }}
  .sign-name {{
    font-weight: bold;
  }}
</style>
</head>
<body>

<table class="header-table">
  <tr>
    <td style="width: 45%;">
      <div class="org-name">CỤC THUẾ TP HÀ NỘI</div>
      <div class="unit-name">THUẾ CƠ SỞ 23</div>
      <div class="divider"></div>
      <div class="doc-num">Số: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /TTr-TCS23</div>
    </td>
    <td style="width: 55%;">
      <div class="country-name">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
      <div class="motto">Độc lập - Tự do - Hạnh phúc</div>
      <div class="divider-motto"></div>
      <div class="doc-date">Hà Nội, ngày &nbsp;&nbsp;&nbsp;&nbsp; tháng &nbsp;&nbsp;&nbsp;&nbsp; năm 2026</div>
    </td>
  </tr>
</table>

<div class="title-block">
  <div class="doc-title">TỜ TRÌNH</div>
  <div class="doc-subtitle">Về việc phê duyệt phương án triển khai Ứng dụng Web quản lý, kiểm đếm công việc nội bộ và đề xuất phối hợp sử dụng tài nguyên không gian trang web nội bộ của Phòng Quản lý rủi ro - Cục Thuế TP Hà Nội</div>
</div>

<div class="recipient-block">
  Kính gửi: <span class="recipient-name">Ban Lãnh đạo Thuế cơ sở 23</span>
</div>

<p>Căn cứ Chương trình chuyển đổi số và hiện đại hóa công tác quản lý thuế của Cục Thuế thành phố Hà Nội;</p>
<p>Căn cứ Bộ tiêu chí đánh giá các chỉ tiêu thi đua, tiến độ công việc hằng tuần của Khối Thuế cơ sở do Văn phòng Cục Thuế TP Hà Nội ban hành;</p>
<p>Xuất phát từ yêu cầu thực tiễn trong công tác chỉ đạo, kiểm đếm và quản lý tiến độ thực hiện nhiệm vụ của các Tổ nghiệp vụ và từng cán bộ tại Thuế cơ sở 23, Bộ phận công nghệ và nghiệp vụ xin kính trình Ban Lãnh đạo Thuế cơ sở 23 nội dung phương án như sau:</p>

<h2>I. SỰ CẦN THIẾT VÀ BỐI CẢNH THỰC TẾ</h2>
<p>Hiện nay, Thuế cơ sở 23 đang thực hiện quản lý khối lượng lớn người nộp thuế (bao gồm doanh nghiệp, hộ kinh doanh và cá nhân) trải dài trên nhiều địa bàn xã, thị trấn. Số lượng đầu việc nghiệp vụ được giao theo tuần, tháng và quý là rất đa dạng và phức tạp (với hơn 70 nhóm nhiệm vụ trọng tâm: Theo dõi số thu NSNN, xử lý nợ thuế, cưỡng chế tài khoản, tạm hoãn xuất cảnh, thủ tục hành chính, rà soát TPR, cảnh báo hệ số K, hóa đơn rủi ro, hoàn thuế, kiểm tra thuế, thương mại điện tử...).</p>
<p>Tuy nhiên, công tác theo dõi và quản lý công việc hiện tại vẫn bộc lộ những hạn chế, bất cập lớn:</p>
<ul>
  <li><b>Phụ thuộc vào dữ liệu Excel rời rạc:</b> Việc phân giao và báo cáo tiến độ giữa các Tổ (HKD1, HKD2, QLDN1, QLDN2, Kiểm tra, Quản lý thu khác, NVDTPC, Hành chính) chủ yếu lập trên các tệp Excel phân tán, khó quản lý phiên bản thống nhất, dễ xảy ra sai lệch số liệu và thất lạc thông tin.</li>
  <li><b>Khó kiểm đếm chi tiết đến từng người nộp thuế:</b> Cán bộ quản lý gặp khó khăn khi theo dõi danh sách NNT cần xử lý (thiếu liên kết tự động giữa Mã số thuế, CCCD, hạn giải quyết và tiến độ thực tế).</li>
  <li><b>Tốn kém nhân lực tổng hợp báo cáo KPI:</b> Mỗi tuần, đơn vị mất nhiều thời gian tổng hợp thủ công để đối chiếu với Bộ tiêu chí đánh giá của Văn phòng Cục, dẫn đến tính kịp thời trong công tác tham mưu cho Ban Lãnh đạo chưa cao.</li>
</ul>
<p>Vì vậy, việc thiết kế và đưa vào vận hành một hệ thống phần mềm nội bộ dạng Web để tự động hóa công tác giao việc, kiểm đếm và xuất báo cáo KPI theo thời gian thực là yêu cầu hết sức cấp thiết và cấp bách.</p>

<h2>II. KẾT QUẢ XÂY DỰNG MÔ HÌNH THỬ NGHIỆM (BẢN DEMO)</h2>
<p>Thời gian qua, bộ phận kỹ thuật đã chủ động nghiên cứu và xây dựng thành công phiên bản phần mềm thử nghiệm <b>"Hệ thống Quản lý công việc Thuế cơ sở 23"</b> với các tính năng chuyên biệt:</p>
<ul>
  <li><b>Tổng quan điều hành (Dashboard):</b> Trực quan hóa tiến độ giao việc, số việc đã hoàn thành, số việc còn tồn đọng và tỷ lệ thực hiện của toàn đơn vị cũng như từng Tổ công tác bằng các biểu đồ tương tác hiện đại.</li>
  <li><b>Theo dõi chi tiết công việc cá nhân:</b> Cho phép từng cán bộ và lãnh đạo tra cứu danh sách chi tiết người nộp thuế (MST, CCCD, tên NNT, nghĩa vụ thuế, hạn xử lý).</li>
  <li><b>Tích hợp Báo cáo KPI tuần chuẩn mẫu Cục Thuế:</b> Tự động tổng hợp 16 chỉ tiêu cốt lõi của khối Thuế cơ sở theo đúng thiết kế của Văn phòng Cục (tính điểm thưởng, điểm phạt, tính điểm trung bình nhóm Thu NSNN, Quản lý nợ, TTHC, Quản lý hỗ trợ, Kiểm tra và tự động xếp hạng thi đua 8 tổ).</li>
  <li><b>Bộ mẫu biểu Excel đồng bộ:</b> Thiết lập bảng Excel tổng hợp đa liên kết (formula links) giúp các tổ chỉ cần nhập liệu một lần là tự động đẩy lên Web và tính toán báo cáo tuần.</li>
</ul>

<div class="image-container">
  <img src="{img_dashboard_src}" alt="Giao diện Tổng quan công việc TCS23" />
  <div class="image-caption"><b>Hình 1:</b> Giao diện Bảng điều hành tổng quan (Dashboard) Hệ thống Quản lý công việc Thuế cơ sở 23<br><i>(Trực quan hóa tiến độ hoàn thành, cảnh báo tồn đọng và biểu đồ tiến độ của 8 Tổ công tác)</i></div>
</div>

<div class="image-container">
  <img src="{img_kpi_src}" alt="Giao diện Bảng Báo cáo KPI tuần" />
  <div class="image-caption"><b>Hình 2:</b> Bảng Báo cáo KPI tuần chuẩn hóa theo 16 tiêu chí đánh giá của Văn phòng Cục Thuế TP Hà Nội<br><i>(Tự động tính điểm thưởng/phạt, điểm trung bình nhóm và xếp hạng thi đua 8 tổ công tác)</i></div>
</div>

<h2>III. PHƯƠNG ÁN ĐỀ XUẤT XIN TÀI NGUYÊN TRANG WEB NỘI BỘ TỪ PHÒNG QUẢN LÝ RỦI RO</h2>

<h3>1. Yêu cầu về an toàn thông tin và tính đặc thù ngành</h3>
<p>Dữ liệu công việc của Thuế cơ sở 23 gắn liền với thông tin định danh, số thuế và nghĩa vụ tài chính của Người nộp thuế. Do đó, theo quy định về an toàn an ninh thông tin của ngành Thuế, hệ thống phần mềm <b>tuyệt đối không được triển khai trên các nền tảng trang web công cộng (Public Internet/Cloud thương mại)</b> mà bắt buộc phải vận hành trên nền tảng trang web nội bộ trong mạng diện rộng của ngành Thuế (Intranet Cục Thuế TP Hà Nội).</p>

<h3>2. Đề xuất xin tài nguyên không gian trang web nội bộ để vận hành ứng dụng</h3>
<p>Hiện nay, <b>Phòng Quản lý rủi ro - Cục Thuế TP Hà Nội</b> là đơn vị chuyên môn đầu mối của Cục đang quản lý và vận hành hệ thống trang web nội bộ phục vụ việc theo dõi, phân tích dữ liệu rủi ro ngành Thuế. Hệ thống này đã có sẵn nền tảng web nội bộ chuẩn hóa, an toàn và kết nối thông suốt đến toàn bộ các máy trạm trong mạng ngành Thuế Thủ đô.</p>
<p>Đặc biệt, các bài toán kiểm đếm trọng tâm của Thuế cơ sở 23 (Rà soát TPR, Cảnh báo hệ số K, Hóa đơn rủi ro, Hoàn thuế, Đôn đốc nợ...) đều là những nội dung nghiệp vụ có tính liên thông cao với các chỉ tiêu rủi ro mà Phòng Quản lý rủi ro đang quản trị.</p>

<p>Do đó, Thuế cơ sở 23 xin đề xuất phương án phối hợp và kính đề nghị Phòng Quản lý rủi ro hỗ trợ <b>bố trí không gian trên hệ thống trang web nội bộ</b> để vận hành ứng dụng, cụ thể như sau:</p>
<ol>
  <li><b>Cấp phát không gian phân hệ và đường dẫn trang web nội bộ:</b>
    <ul>
      <li>Bố trí một chuyên trang / phân hệ web nội bộ (Web Service / Web Portal) trên nền tảng trang web sẵn có của Phòng Quản lý rủi ro để đưa giao diện và chương trình điều hành của Thuế cơ sở 23 vào hoạt động.</li>
      <li>Cung cấp địa chỉ liên kết / đường dẫn truy cập nội bộ (URL mạng nội bộ ngành Thuế, ví dụ: phân hệ trên Cổng thông tin của Phòng QLRR) để cán bộ Thuế cơ sở 23 truy cập làm việc hằng ngày.</li>
      <li><b>Khẳng định tính chất tài nguyên:</b> Đơn vị <u>hoàn toàn không xin cấp mới máy tính, máy trạm hay thiết bị phần cứng</u>. Toàn bộ cán bộ tại Thuế cơ sở 23 sẽ sử dụng trực tiếp các máy tính làm việc hiện có để truy cập trang web thông qua trình duyệt (Chrome, Edge) trong mạng nội bộ.</li>
    </ul>
  </li>
  <li><b>Bố trí không gian lưu trữ cơ sở dữ liệu nội bộ và cơ chế sao lưu:</b>
    <ul>
      <li>Cấp phát không gian lưu trữ dữ liệu gọn nhẹ trên hệ thống web của Phòng Quản lý rủi ro để lưu trữ bảng phân công công việc, nhật ký xử lý của cán bộ và kết quả tính điểm KPI hằng tuần.</li>
      <li>Tận dụng cơ chế sao lưu tự động định kỳ (Backup) sẵn có trên hệ thống web của Phòng Quản lý rủi ro để bảo đảm dữ liệu luôn được an toàn, không bị thất lạc.</li>
    </ul>
  </li>
  <li><b>Phân quyền và bảo mật truy cập:</b>
    <ul>
      <li>Thiết lập phân quyền tài khoản chặt chẽ: Chỉ các cán bộ được cấp tài khoản của Thuế cơ sở 23 mới có quyền truy cập vào phân hệ dữ liệu của đơn vị.</li>
      <li>Phòng Quản lý rủi ro hỗ trợ duy trì kết nối mạng ổn định cho trang web; Thuế cơ sở 23 chủ động hoàn toàn về mặt quản trị tài khoản, cập nhật số liệu và nội dung công việc nội bộ.</li>
    </ul>
  </li>
</ol>

<h2>IV. HIỆU QUẢ VÀ TÍNH KHẢ THI CỦA PHƯƠNG ÁN</h2>
<ul>
  <li><b>Về mặt quản lý, điều hành:</b> Giúp Ban Lãnh đạo nắm bắt tiến độ thực tế theo thời gian thực, chủ động chỉ đạo đôn đốc các chỉ tiêu chậm muộn, từ đó nâng cao thứ hạng thi đua KPI tuần của Thuế cơ sở 23 trong toàn ngành.</li>
  <li><b>Về mặt thời gian và nhân lực:</b> Tiết kiệm 60% - 70% thời gian tổng hợp, rà soát số liệu thủ công của các Tổ trưởng và cán bộ tổng hợp; hạn chế tối đa sai lệch số liệu.</li>
  <li><b>Tiết kiệm triệt để ngân sách:</b> Phương án đạt hiệu quả kinh tế tối ưu do đơn vị tự phát triển ứng dụng và tận dụng không gian trang web nội bộ sẵn có của Phòng Quản lý rủi ro, <b>hoàn toàn không phát sinh chi phí mua sắm máy tính, thiết bị hay phần mềm</b>.</li>
</ul>

<h2>V. LỘ TRÌNH TRIỂN KHAI DỰ KIẾN</h2>
<ul>
  <li><b>Giai đoạn 1 (Tháng 9/2026):</b> Báo cáo Ban Lãnh đạo phê duyệt chủ trương; gửi văn bản phối hợp tới Phòng Quản lý rủi ro xin cấp không gian trang web nội bộ.</li>
  <li><b>Giai đoạn 2 (Đầu tháng 10/2026):</b> Tiếp nhận địa chỉ web nội bộ, triển khai cấu hình mã nguồn, kiểm thử trên mạng nội bộ ngành và chạy thử nghiệm tại 02 Tổ công tác (Tổ HKD1 và Tổ QLDN1).</li>
  <li><b>Giai đoạn 3 (Từ giữa tháng 10/2026):</b> Hoàn thiện theo đóng góp ý kiến thực tế, hướng dẫn cán bộ truy cập qua trình duyệt máy tính sẵn có và đưa vào vận hành chính thức trên toàn bộ 8 Tổ công tác của Thuế cơ sở 23.</li>
</ul>

<h2>VI. ĐỀ XUẤT VÀ KIẾN NGHỊ</h2>
<p>Để phương án sớm đi vào thực tiễn, nâng cao hiệu lực, hiệu quả công tác quản lý của đơn vị, kính trình Ban Lãnh đạo Thuế cơ sở 23 xem xét và chỉ đạo:</p>
<ol>
  <li><b>Phê duyệt chủ trương</b> triển khai Hệ thống Web quản lý, kiểm đếm công việc nội bộ và báo cáo KPI tuần của Thuế cơ sở 23.</li>
  <li><b>Ký duyệt và ban hành Văn bản</b> của Thuế cơ sở 23 gửi Phòng Quản lý rủi ro - Cục Thuế TP Hà Nội đề nghị hỗ trợ bố trí không gian và đường dẫn trên hệ thống trang web nội bộ để vận hành ứng dụng.</li>
  <li><b>Giao nhiệm vụ</b> cho Tổ Nghiệp vụ - Dự toán - Pháp chế (NVDTPC) phối hợp với các Tổ trưởng chủ động làm việc với bộ phận quản trị trang web của Phòng Quản lý rủi ro để tiếp nhận không gian web và đưa vào vận hành theo đúng quy định.</li>
</ol>

<p>Kính trình Ban Lãnh đạo Thuế cơ sở 23 xem xét, phê duyệt./.</p>

<table class="sign-table">
  <tr>
    <td class="recipients-col">
      <div class="recipients-title">Nơi nhận:</div>
      <div class="recipients-list">
        - Ban Lãnh đạo TCS23 (để báo cáo);<br>
        - Phòng Quản lý rủi ro - CT HN (để phối hợp);<br>
        - Các Tổ công tác thuộc TCS23 (để thực hiện);<br>
        - Lưu: VT, Bộ phận TH.
      </div>
    </td>
    <td class="sign-col">
      <div class="sign-role">NGƯỜI LẬP TỜ TRÌNH</div>
      <div class="sign-name">(Ký và ghi rõ họ tên)</div>
    </td>
  </tr>
</table>

</body>
</html>
"""

with open(OUTPUT_DOC, "w", encoding="utf-8") as f:
    f.write(doc_content)

print(f"ĐÃ CẬP NHẬT THÀNH CÔNG TỆP TỜ TRÌNH WORD: {OUTPUT_DOC}")
