import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as XLSX from 'xlsx';
import { beforeEach, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import { seedDataset } from '../data/seedDataset';
import ImportPage from './ImportPage';

const mocks = vi.hoisted(() => ({ replaceData: vi.fn(), restoreBackup: vi.fn(), downloadImportErrors: vi.fn() }));

vi.mock('../app/useAppStore', () => ({
  useAppStore: () => ({ replaceData: mocks.replaceData, restoreBackup: mocks.restoreBackup }),
}));
vi.mock('../import/exportErrors', () => ({ downloadImportErrors: mocks.downloadImportErrors }));

function workbookFile(valid = true) {
  const sheets: Record<string, unknown[][]> = {
    Teams: [['Mã tổ', 'Tên tổ', 'Tên ngắn'], ['T1', 'Tổ 1', 'T1']],
    Officers: [['Mã cán bộ', 'Tên cán bộ', 'Chức danh', 'Mã tổ', 'Địa bàn'], ['O1', 'An', 'Công chức', 'T1', 'A']],
    TaskDefinitions: [['Mã nhiệm vụ', 'Tên nhiệm vụ', 'Nhóm', 'Đơn vị', 'Cách đo', 'Kỳ báo cáo', 'Mã tổ áp dụng'], ['NV1', 'Nhiệm vụ 1', 'Nhóm', 'Hồ sơ', 'Đếm', 'Tháng', 'T1']],
    WorkItems: [['Mã công việc', 'Mã nhiệm vụ', 'Mã tổ', 'Mã cán bộ', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn', 'Trạng thái'], ['W1', 'NV1', 'T1', 'O1', 5, valid ? 2 : 8, '2026-09-01', 'in_progress']],
  };
  const book = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), name));
  const bytes = XLSX.write(book, { type: 'array', bookType: 'xlsx' });
  return new File([bytes], valid ? 'valid.xlsx' : 'invalid.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function workbookWithErrors(count: number) {
  const file = workbookFile();
  const sheets: Record<string, unknown[][]> = {
    Teams: [['Mã tổ', 'Tên tổ', 'Tên ngắn'], ['T1', 'Tổ 1', 'T1']],
    Officers: [['Mã cán bộ', 'Tên cán bộ', 'Chức danh', 'Mã tổ', 'Địa bàn'], ['O1', 'An', 'Công chức', 'T1', 'A']],
    TaskDefinitions: [['Mã nhiệm vụ', 'Tên nhiệm vụ', 'Nhóm', 'Đơn vị', 'Cách đo', 'Kỳ báo cáo', 'Mã tổ áp dụng'], ['NV1', 'Nhiệm vụ 1', 'Nhóm', 'Hồ sơ', 'Đếm', 'Tháng', 'T1']],
    WorkItems: [['Mã công việc', 'Mã nhiệm vụ', 'Mã tổ', 'Mã cán bộ', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn', 'Trạng thái'], ...Array.from({ length: count }, (_, index) => [`W${index}`, 'NV1', 'T1', 'O1', 1, 2, '2026-09-01', 'in_progress'])],
  };
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), name));
  return new File([XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })], file.name, { type: file.type });
}

beforeEach(() => {
  mocks.replaceData.mockReset().mockResolvedValue(true);
  mocks.restoreBackup.mockReset().mockResolvedValue(true);
  mocks.downloadImportErrors.mockReset();
});

it('hoạt động trong StrictMode và kết thúc trạng thái phân tích', async () => {
  const user = userEvent.setup();
  render(<StrictMode><ImportPage data={seedDataset} /></StrictMode>);
  await user.upload(screen.getByLabelText('Chọn tệp Excel'), workbookFile());
  expect(await screen.findByText(/1 dòng hợp lệ/)).toBeInTheDocument();
  expect(screen.queryByText('Đang phân tích tệp…')).not.toBeInTheDocument();
});

it('bỏ qua kết quả đọc tệp hoàn tất sau khi unmount', async () => {
  let resolveRead!: (value: ArrayBuffer) => void;
  const original = File.prototype.arrayBuffer;
  File.prototype.arrayBuffer = vi.fn(() => new Promise<ArrayBuffer>((resolve) => { resolveRead = resolve; }));
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const user = userEvent.setup();
  const view = render(<ImportPage data={seedDataset} />);
  await user.upload(screen.getByLabelText('Chọn tệp Excel'), workbookFile());
  view.unmount();
  resolveRead(new ArrayBuffer(0));
  await Promise.resolve();
  expect(error).not.toHaveBeenCalled();
  error.mockRestore();
  File.prototype.arrayBuffer = original;
});

it('xem trước workbook hợp lệ, hủy xác nhận không thay dữ liệu và xác nhận mới thay', async () => {
  const user = userEvent.setup();
  render(<ImportPage data={seedDataset} />);
  const input = screen.getByLabelText('Chọn tệp Excel');
  expect(input).toHaveAttribute('accept', '.xlsx,.xls');
  expect(input).toBeEnabled();
  await user.upload(input, workbookFile());
  expect(await screen.findByText(/1 dòng hợp lệ/)).toBeInTheDocument();
  expect(screen.getByText(/1 công việc/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Xác nhận thay thế dữ liệu' }));
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveTextContent('thay thế toàn bộ dữ liệu');
  expect(dialog).toHaveTextContent('sao lưu');
  await user.click(within(dialog).getByRole('button', { name: 'Hủy' }));
  expect(mocks.replaceData).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Xác nhận thay thế dữ liệu' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Thay thế toàn bộ dữ liệu' }));
  await waitFor(() => expect(mocks.replaceData).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole('status')).toHaveTextContent('Nhập dữ liệu thành công');
  expect(screen.queryByRole('button', { name: 'Xác nhận thay thế dữ liệu' })).not.toBeInTheDocument();
  expect(screen.queryByText('W1')).not.toBeInTheDocument();
});

it('khóa dialog khi đang thay thế và không thể gửi lặp', async () => {
  let settle!: (value: boolean) => void;
  mocks.replaceData.mockReturnValue(new Promise((resolve) => { settle = resolve; }));
  const user = userEvent.setup();
  render(<ImportPage data={seedDataset} />);
  const input = screen.getByLabelText('Chọn tệp Excel');
  const file = workbookFile();
  await user.upload(input, file);
  expect(input).toHaveValue('');
  await user.click(await screen.findByRole('button', { name: 'Xác nhận thay thế dữ liệu' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Thay thế toàn bộ dữ liệu' }));
  expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đóng xác nhận' })).toBeDisabled();
  await user.keyboard('{Escape}');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(mocks.replaceData).toHaveBeenCalledTimes(1);
  settle(true);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await user.upload(input, file);
  expect(await screen.findByText(/1 dòng hợp lệ/)).toBeInTheDocument();
});

it('chỉ render 100 lỗi nhưng tải toàn bộ danh sách', async () => {
  const user = userEvent.setup();
  render(<ImportPage data={seedDataset} />);
  await user.upload(screen.getByLabelText('Chọn tệp Excel'), workbookWithErrors(101));
  expect(await screen.findByText('Hiển thị 100/101 lỗi')).toBeInTheDocument();
  const preview = screen.getByRole('region', { name: 'Kết quả xem trước' });
  expect(within(preview).getAllByRole('row')).toHaveLength(101);
  await user.click(screen.getByRole('button', { name: 'Tải danh sách lỗi' }));
  expect(mocks.downloadImportErrors.mock.calls[0][0]).toHaveLength(101);
});

it('hiển thị lỗi chi tiết, khóa xác nhận và cho tải danh sách lỗi', async () => {
  const user = userEvent.setup();
  render(<ImportPage data={seedDataset} />);
  await user.upload(screen.getByLabelText('Chọn tệp Excel'), workbookFile(false));
  expect(await screen.findByText('Đã thực hiện không được lớn hơn phải thực hiện')).toBeInTheDocument();
  expect(screen.getByText('WorkItems')).toBeInTheDocument();
  expect(screen.getByText('F')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Xác nhận thay thế dữ liệu' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Tải danh sách lỗi' }));
  expect(mocks.downloadImportErrors).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ sheet: 'WorkItems', row: 2, column: 'F' })]));
  expect(mocks.replaceData).not.toHaveBeenCalled();
});

it('báo lỗi thay thế và khôi phục chỉ sau xác nhận', async () => {
  const user = userEvent.setup();
  mocks.replaceData.mockResolvedValue(false);
  mocks.restoreBackup.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  render(<ImportPage data={seedDataset} />);
  await user.upload(screen.getByLabelText('Chọn tệp Excel'), workbookFile());
  await user.click(await screen.findByRole('button', { name: 'Xác nhận thay thế dữ liệu' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Thay thế toàn bộ dữ liệu' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể thay thế dữ liệu');
  await user.click(screen.getByRole('button', { name: 'Khôi phục bản sao lưu' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Hủy' }));
  expect(mocks.restoreBackup).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Khôi phục bản sao lưu' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Khôi phục bản sao lưu ngay' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể khôi phục bản sao lưu');
  await user.click(screen.getByRole('button', { name: 'Khôi phục bản sao lưu' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Khôi phục bản sao lưu ngay' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Khôi phục dữ liệu thành công');
});
