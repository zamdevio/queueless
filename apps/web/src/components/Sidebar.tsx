import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../lib/theme";
import { usePwa } from "../lib/pwa";

interface SidebarProps {
  currentView: "landing" | "student" | "operator";
  queueId: string;
  onNavigate: (view: "landing" | "student" | "operator", queueId: string) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem("queueless_sidebar") === "collapsed";
  } catch {
    return false;
  }
}

export function Sidebar({
  currentView,
  queueId,
  onNavigate,
  onCollapsedChange,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { canInstall, isInstalled, install } = usePwa();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("queueless_sidebar", collapsed ? "collapsed" : "expanded");
    } catch {
      // ignore
    }
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
    setMobileOpen(false);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((!e.ctrlKey && !e.metaKey) || isEditableTarget(e.target)) return;
      if (e.key.toLowerCase() !== "b") return;
      e.preventDefault();
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (isDesktop) {
        setCollapsed((c) => !c);
      } else {
        setMobileOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const iconsOnly = collapsed;
  const go = (view: "landing" | "student" | "operator") => {
    onNavigate(view, queueId);
    setMobileOpen(false);
  };

  const panel = (
    <div className="sidebar-panel">
      <div className={`sidebar-header ${iconsOnly ? "sidebar-header-compact" : ""}`}>
        <button
          type="button"
          className={`logo ${iconsOnly ? "logo-compact" : ""}`}
          onClick={() => go("landing")}
          title="QueueLess"
        >
          <span className="logo-icon">Q</span>
          {!iconsOnly && <span className="logo-text">QueueLess</span>}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === "landing" ? "active" : ""} ${
            iconsOnly ? "nav-item-compact" : ""
          }`}
          onClick={() => go("landing")}
          title="Home"
        >
          <span className="nav-icon">🏠</span>
          {!iconsOnly && <span className="nav-label">Home</span>}
        </button>

        <div className={`nav-divider ${iconsOnly ? "nav-divider-compact" : ""}`}>
          {iconsOnly ? "Q" : `Queue: ${queueId}`}
        </div>

        <button
          className={`nav-item ${currentView === "student" ? "active" : ""} ${
            iconsOnly ? "nav-item-compact" : ""
          }`}
          onClick={() => go("student")}
          title="Student View"
        >
          <span className="nav-icon">👤</span>
          {!iconsOnly && <span className="nav-label">Student View</span>}
        </button>

        <button
          className={`nav-item ${currentView === "operator" ? "active" : ""} ${
            iconsOnly ? "nav-item-compact" : ""
          }`}
          onClick={() => go("operator")}
          title="Operator Dashboard"
        >
          <span className="nav-icon">‍💼</span>
          {!iconsOnly && <span className="nav-label">Operator</span>}
        </button>

        {!isInstalled && (
          <>
            <div className={`nav-divider ${iconsOnly ? "nav-divider-compact" : ""}`}>
              {iconsOnly ? "A" : "Add-ons"}
            </div>
            <button
              className={`nav-item ${iconsOnly ? "nav-item-compact" : ""}`}
              onClick={() => install()}
              title={canInstall ? "Install app" : "Install not offered by this browser"}
              disabled={!canInstall}
            >
              <span className="nav-icon">📥</span>
              {!iconsOnly && (
                <span className="nav-label">
                  {canInstall ? "Install app" : "Install unavailable"}
                </span>
              )}
            </button>
          </>
        )}
      </nav>

      <div className={`sidebar-footer ${iconsOnly ? "sidebar-footer-compact" : ""}`}>
        {!iconsOnly && (
          <div className="footer-meta">
            <div className="version">v0.1.0</div>
            <div className="status">
              <span className="status-dot" />
              <span>QueueLess</span>
            </div>
          </div>
        )}

        <div className={`footer-actions ${iconsOnly ? "footer-actions-col" : ""}`}>
          <button
            type="button"
            onClick={toggleTheme}
            className="footer-btn"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {!iconsOnly && <span>Theme</span>}
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            className="footer-btn"
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            )}
            {!iconsOnly && (
              <>
                <span>Collapse</span>
                <kbd className="footer-kbd">⌃B</kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
        <button type="button" className="logo logo-mobile" onClick={() => go("landing")}>
          <span className="logo-icon">Q</span>
          <span className="logo-text">QueueLess</span>
        </button>
      </header>

      <div
        className={`mobile-sheet-backdrop ${mobileOpen ? "open" : ""}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          tabIndex={mobileOpen ? 0 : -1}
          aria-label="Close menu"
          onClick={closeMobile}
          className="mobile-sheet-backdrop-btn"
        />
        <aside
          className={`sidebar mobile-sheet ${mobileOpen ? "open" : ""}`}
          role="dialog"
          aria-modal="true"
        >
          {panel}
        </aside>
      </div>

      <aside
        className={`sidebar sidebar-desktop ${collapsed ? "sidebar-collapsed" : ""}`}
        aria-label="Sidebar"
      >
        {panel}
      </aside>
    </>
  );
}
