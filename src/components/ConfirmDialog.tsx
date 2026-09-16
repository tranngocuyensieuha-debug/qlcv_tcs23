import AccessibleModal from './AccessibleModal';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AccessibleModal title={title} description={message} closeLabel="Đóng xác nhận" closeDisabled={busy} onClose={onCancel}>
      <div className="demo-actions">
        <button type="button" onClick={onCancel} disabled={busy}>Hủy</button>
        <button type="button" className="demo-primary" onClick={onConfirm} disabled={busy}>
          {busy ? 'Đang xử lý…' : confirmLabel}
        </button>
      </div>
    </AccessibleModal>
  );
}
