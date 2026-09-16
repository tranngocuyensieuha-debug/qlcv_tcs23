import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as XLSX from 'xlsx';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import App from '../App';

function workbookFile(assigned = 27, valid = true): File {
  const sheets: Record<string, unknown[][]> = {
    Teams: [['Mã tổ', 'Tên tổ', 'Tên ngắn'], ['HKD1', 'Tổ HKD1', 'HKD1']],
    Officers: [['Mã cán bộ', 'Tên cán bộ', 'Chức danh', 'Mã tổ', 'Địa bàn'], ['CB1', 'Nguyễn An', 'Công chức', 'HKD1', 'Xã A']],
    TaskDefinitions: [['Mã nhiệm vụ', 'Tên nhiệm vụ', 'Nhóm', 'Đơn vị', 'Cách đo', 'Kỳ báo cáo', 'Mã tổ áp dụng'], ['NV1', 'Rà soát', 'Quản lý', 'Hồ sơ', 'Số hoàn thành', 'Tháng', 'HKD1']],
    WorkItems: [['Mã công việc', 'Mã nhiệm vụ', 'Mã tổ', 'Mã cán bộ', 'Phải thực hiện', 'Đã thực hiện', 'Thời hạn', 'Trạng thái'], ['CV1', 'NV1', 'HKD1', valid ? 'CB1' : '', assigned, 2, '2026-09-30', 'in_progress']],
  };
  const book = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), name));
  const bytes = XLSX.write(book, { type: 'array', bookType: 'xlsx' });
  return new File([bytes], valid ? 'valid.xlsx' : 'invalid.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

async function login(user: ReturnType<typeof userEvent.setup>, accountId: string) {
  await screen.findByRole('heading', { name: 'Đăng nhập hệ thống' });
  await user.selectOptions(screen.getByLabelText('Tài khoản'), accountId);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  await screen.findByRole('heading', { name: 'Tổng quan công việc' });
}

async function openImport(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /Nhập dữ liệu Excel/ }));
  await screen.findByRole('heading', { name: 'Nhập dữ liệu Excel' });
}

describe('App tích hợp với provider và LocalStorageRepository thật', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('lãnh đạo thấy 8 tổ; tổ HKD1 chỉ thấy phạm vi mình và không thấy màn hình import', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    await login(user, 'lanhdao01');
    expect(screen.getAllByTestId('team-row')).toHaveLength(8);
    expect(screen.getByRole('button', { name: /Nhập dữ liệu Excel/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    await login(user, 'totruong_hkd1');
    expect(screen.getAllByTestId('team-row')).toHaveLength(1);
    expect(screen.getAllByText('Tổ Quản lý hộ kinh doanh số 1').length).toBeGreaterThan(0);
    expect(screen.queryByText('Tổ Quản lý doanh nghiệp số 2')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nhập dữ liệu Excel/ })).not.toBeInTheDocument();
    view.unmount();
  });

  it('nhập workbook hợp lệ cập nhật KPI và lưu qua remount, đăng xuất/đăng nhập', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await login(user, 'lanhdao01');
    await openImport(user);
    await user.upload(screen.getByLabelText('Chọn tệp Excel'), workbookFile());
    const preview = await screen.findByRole('region', { name: 'Kết quả xem trước' });
    expect(within(preview).getByText(/1 dòng hợp lệ/)).toBeInTheDocument();
    await user.click(within(preview).getByRole('button', { name: 'Xác nhận thay thế dữ liệu' }));
    const dialog = await screen.findByRole('dialog', { name: 'Xác nhận thay thế dữ liệu' });
    await user.click(within(dialog).getByRole('button', { name: 'Thay thế toàn bộ dữ liệu' }));
    await screen.findByText('Nhập dữ liệu thành công.');
    await user.click(screen.getByRole('button', { name: /Tổng quan/ }));
    expect(screen.getByTestId('assigned-kpi')).toHaveTextContent('27');

    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }));
    first.unmount();
    render(<App />);
    await login(user, 'lanhdao01');
    expect(screen.getByTestId('assigned-kpi')).toHaveTextContent('27');
  });

  it('workbook lỗi không cho thay thế và dữ liệu trước đó giữ nguyên', async () => {
    const user = userEvent.setup();
    render(<App />);
    await login(user, 'lanhdao01');
    await openImport(user);
    await user.upload(screen.getByLabelText('Chọn tệp Excel'), workbookFile(99, false));
    const preview = await screen.findByRole('region', { name: 'Kết quả xem trước' });
    expect(within(preview).getByText(/1 lỗi/)).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: 'Xác nhận thay thế dữ liệu' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Tổng quan/ }));
    expect(screen.getByTestId('assigned-kpi')).toHaveTextContent('122.697.903.054');
  });

  it('khôi phục backup qua giao diện thật', async () => {
    const user = userEvent.setup();
    render(<App />);
    await login(user, 'lanhdao01');
    await openImport(user);
    await user.upload(screen.getByLabelText('Chọn tệp Excel'), workbookFile());
    await user.click(await screen.findByRole('button', { name: 'Xác nhận thay thế dữ liệu' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Thay thế toàn bộ dữ liệu' }));
    await screen.findByText('Nhập dữ liệu thành công.');
    await user.click(screen.getByRole('button', { name: 'Khôi phục bản sao lưu' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Khôi phục bản sao lưu ngay' }));
    await screen.findByText('Khôi phục dữ liệu thành công.');
    await user.click(screen.getByRole('button', { name: /Tổng quan/ }));
    await waitFor(() => expect(screen.getByTestId('assigned-kpi')).toHaveTextContent('122.697.903.054'));
  });
});
