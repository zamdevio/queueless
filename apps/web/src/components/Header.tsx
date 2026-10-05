import { type ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div>
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="header-actions">{actions}</div>}
      </div>
    </header>
  );
}
