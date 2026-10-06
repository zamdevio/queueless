import { useCallback, useEffect, useState } from "react";
import { useTheme } from "../lib/theme";
import { usePwa } from "../lib/pwa";
import {
  IconHome,
  IconUser,
  IconBriefcase,
  IconBook,
  IconGear,
  IconInfo,
  IconDownload,
  IconCheck,
  IconSun,
  IconMoon,
  IconPanelLeftClose,
  IconPanelLeftOpen,
  IconMenu,
  IconX,
  IconQueue,
} from "./Icons";

type NavView = "landing" | "student" | "operator" | "docs" | "board";
type DocsPage = "guide" | "development" | "about";

interface SidebarProps {
  currentView: NavView;
  docsPage?: DocsPage;
  queueId: string;
  onNavigate: (view: NavView, queueId: string, docsPage?: DocsPage) => void;
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

const DOCS: { page: DocsPage; label: string; Icon: typeof IconBook }[] = [
  { page: "guide", label: "Guide", Icon: IconBook },
  { page: "development", label: "Development", Icon: IconGear },
  { page: "about", label: "About", Icon: IconInfo },
];

export function Sidebar({
  currentView,
  docsPage,
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
  const go = (view: NavView, docs: DocsPage = "guide") => {
    onNavigate(view, queueId, docs);
    setMobileOpen(false);
  };

  const addonButtons = (
    <>
      {isInstalled && (
        <div
          className={`nav-item nav-item-installed ${iconsOnly ? "nav-item-compact" : ""}`}
          title="App already installed — open from your home screen or taskbar"
        >
          <IconCheck size={16} />
          {!iconsOnly && <span className="nav-label">Installed</span>}
        </div>
      )}
      {!isInstalled && (
        <button
          type="button"
          className={`nav-item ${iconsOnly ? "nav-item-compact" : ""}`}
          onClick={() => install()}
          title={canInstall ? "Install app" : "Install not offered by this browser"}
          disabled={!canInstall}
        >
          <IconDownload size={16} />
          {!iconsOnly && (
            <span className="nav-label">
              {canInstall ? "Install app" : "Install unavailable"}
            </span>
          )}
        </button>
      )}
    </>
  );

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
          <IconHome size={16} />
          {!iconsOnly && <span className="nav-label">Home</span>}
        </button>

        <div className={`nav-divider ${iconsOnly ? "nav-divider-compact" : ""}`}>
          {iconsOnly ? "Q" : `Queue · ${queueId}`}
        </div>

        <button
          className={`nav-item ${currentView === "student" ? "active" : ""} ${
            iconsOnly ? "nav-item-compact" : ""
          }`}
          onClick={() => go("student")}
          title="Customer view"
        >
          <IconUser size={16} />
          {!iconsOnly && <span className="nav-label">Customer</span>}
        </button>

        <button
          className={`nav-item ${currentView === "operator" ? "active" : ""} ${
            iconsOnly ? "nav-item-compact" : ""
          }`}
          onClick={() => go("operator")}
          title="Operator dashboard"
        >
          <IconBriefcase size={16} />
          {!iconsOnly && <span className="nav-label">Operator</span>}
        </button>

        <button
          className={`nav-item ${currentView === "board" ? "active" : ""} ${
            iconsOnly ? "nav-item-compact" : ""
          }`}
          onClick={() => go("board")}
          title="Live board (monitor)"
        >
          <IconQueue size={16} />
          {!iconsOnly && <span className="nav-label">Board</span>}
        </button>

        <div className={`nav-divider ${iconsOnly ? "nav-divider-compact" : ""}`}>
          {iconsOnly ? "D" : "Docs"}
        </div>

        {DOCS.map(({ page, label, Icon }) => (
          <button
            key={page}
            className={`nav-item ${
              currentView === "docs" && docsPage === page ? "active" : ""
            } ${iconsOnly ? "nav-item-compact" : ""}`}
            onClick={() => go("docs", page)}
            title={label}
          >
            <Icon size={16} />
            {!iconsOnly && <span className="nav-label">{label}</span>}
          </button>
        ))}

        <div className={`nav-divider ${iconsOnly ? "nav-divider-compact" : ""}`}>
          {iconsOnly ? "A" : "Add-ons"}
        </div>
        {addonButtons}
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
            {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
            {!iconsOnly && <span>Theme</span>}
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            className="footer-btn"
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <IconPanelLeftOpen size={16} /> : <IconPanelLeftClose size={16} />}
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
          {mobileOpen ? <IconX size={18} /> : <IconMenu size={18} />}
        </button>
        <button type="button" className="logo logo-mobile" onClick={() => go("landing")}>
          <span className="logo-icon">Q</span>
          <span className="logo-text">QueueLess</span>
        </button>
        <button
          type="button"
          className="mobile-theme-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
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
