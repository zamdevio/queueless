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

/** Copy-to-clipboard button for command blocks. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="copy-btn"
      onClick={() => {
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
 * Highlighter-style commands — no boxed container.
 * Soft accent bar + highlighted command text, copy button on the side.
 */
export function CommandBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="command-hl">
      <div className="command-hl-head">
        {title && <span className="command-hl-title">{title}</span>}
        <CopyButton text={code} />
      </div>
      <pre className="command-hl-pre">{code}</pre>
    </div>
  );
}
