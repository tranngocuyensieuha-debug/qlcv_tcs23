import {
  useId,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export default function AccessibleModal({
  title,
  description,
  closeLabel = "Đóng chi tiết",
  closeDisabled = false,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  closeLabel?: string;
  closeDisabled?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const box = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const previous = useRef<HTMLElement | null>(
    document.activeElement as HTMLElement | null,
  );
  useLayoutEffect(() => {
    const target = previous.current;
    close.current?.focus();
    return () => {
      requestAnimationFrame(() => target?.focus());
    };
  }, []);
  function keys(e: KeyboardEvent) {
    if (e.key === "Escape" && !closeDisabled) {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !box.current) return;
    const nodes = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!nodes.length) return;
    const first = nodes[0],
      last = nodes.at(-1)!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  return (
    <div className="demo-modal-backdrop">
      <section
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="demo-modal"
        onKeyDown={keys}
      >
        <header>
          <h2 id={titleId}>{title}</h2>
          <button ref={close} aria-label={closeLabel} disabled={closeDisabled} onClick={onClose}>
            ×
          </button>
        </header>
        {description && <p id={descriptionId}>{description}</p>}
        {children}
      </section>
    </div>
  );
}
