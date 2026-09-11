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
    <div className="metric-card" style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}>
      <div className="metric-header">
        <span>{label}</span>
        {icon && <span style={{ color: accentColor || "var(--accent-pba-cyan)", display: "flex", alignItems: "center" }}>{icon}</span>}
      </div>
      <div className="metric-value font-mono-tabular">{value}</div>
      {sub && <div className="metric-sub font-mono-tabular">{sub}</div>}
    </div>
  );
}

