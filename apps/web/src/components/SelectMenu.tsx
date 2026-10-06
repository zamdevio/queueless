import { useEffect, useRef, useState } from "react";

interface SelectMenuProps {
  value: number;
  options: number[];
  onChange: (n: number) => void;
  ariaLabel?: string;
}

/** Custom dropdown — no native <select>. */
export function SelectMenu({ value, options, onChange, ariaLabel }: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="select-menu" ref={ref}>
      <button
        type="button"
        className="select-menu-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span>{value} per page</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className="select-menu-list" role="listbox">
          {options.map((n) => (
            <li key={n}>
              <button
                type="button"
                role="option"
                aria-selected={n === value}
                className={`select-menu-item ${n === value ? "active" : ""}`}
                onClick={() => {
                  onChange(n);
                  setOpen(false);
                }}
              >
                {n} per page
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Copy-to-clipboard button — stops propagation so it never toggles a parent. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="copy-btn"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      aria-label={`${label} to clipboard`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

/**
 * Standard code-block: header bar (title + copy) with bg + divider,
 * then highlighted command content.
 */
export function CommandBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="command-block">
      <div className="command-block-header">
        <span className="command-block-title">{title || "Command"}</span>
        <CopyButton text={code} />
      </div>
      <pre className="command-block-pre">{code}</pre>
    </div>
  );
}

/**
 * Collapsible command — entire header row toggles open/closed.
 * Copy always visible and never toggles (stopPropagation).
 */
export function CollapsibleCommand({
  title,
  code,
  defaultOpen = false,
}: {
  title: string;
  code: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="command-block">
      <div
        className="command-block-header command-block-header-click"
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <span className="command-block-title">
          <span className="command-block-chev">{open ? "▾" : "▸"}</span>
          {title}
        </span>
        <CopyButton text={code} />
      </div>
      {open && <pre className="command-block-pre">{code}</pre>}
    </div>
  );
}
