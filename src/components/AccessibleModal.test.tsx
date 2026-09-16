import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { useState } from "react";
import AccessibleModal from "./AccessibleModal";
function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Mở</button>
      {open && (
        <AccessibleModal title="Chi tiết" onClose={() => setOpen(false)}>
          <button>Nút cuối</button>
        </AccessibleModal>
      )}
    </>
  );
}
function LockedHarness() {
  const [open, setOpen] = useState(true);
  return open ? (
    <AccessibleModal title="Đang lưu" description="Vui lòng chờ" closeLabel="Đóng xác nhận" closeDisabled onClose={() => setOpen(false)}>
      <button>Nút cuối</button>
    </AccessibleModal>
  ) : null;
}
it("modal focus, trap Tab/Escape và trả focus trigger", async () => {
  const u = userEvent.setup();
  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Mở" });
  await u.click(trigger);
  const close = screen.getByRole("button", { name: "Đóng chi tiết" });
  await waitFor(() => expect(close).toHaveFocus());
  await u.keyboard("{Shift>}{Tab}{/Shift}");
  expect(screen.getByRole("button", { name: "Nút cuối" })).toHaveFocus();
  await u.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await waitFor(() => expect(trigger).toHaveFocus());
});
it("modal khóa không đóng bằng Escape hoặc nút đóng và mô tả đúng", async () => {
  const u = userEvent.setup();
  render(<LockedHarness />);
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAccessibleDescription('Vui lòng chờ');
  const close = screen.getByRole('button', { name: 'Đóng xác nhận' });
  expect(close).toBeDisabled();
  await u.keyboard('{Escape}');
  expect(dialog).toBeInTheDocument();
});
