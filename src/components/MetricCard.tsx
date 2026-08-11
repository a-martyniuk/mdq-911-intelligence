import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export default function MetricCard({ label, value, sub, icon, accentColor }: MetricCardProps) {
  return (
    <div className="metric-card" style={accentColor ? { borderLeftColor: accentColor } : undefined}>
      <div className="metric-header">
        <span>{label}</span>
        {icon && <span style={{ color: accentColor || "var(--accent-indigo)" }}>{icon}</span>}
      </div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}
