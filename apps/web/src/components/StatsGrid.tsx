interface Stat {
  label: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down" | "neutral";
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon">{stat.icon || "📊"}</div>
          <div className="stat-content">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
          {stat.trend && <div className={`stat-trend ${stat.trend}`}>
            {stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "→"}
          </div>}
        </div>
      ))}
    </div>
  );
}
