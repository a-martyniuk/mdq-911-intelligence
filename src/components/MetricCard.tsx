import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export default function MetricCard({ label, value, sub, icon }: MetricCardProps) {
  const isNumeric = typeof value === "number" || /^[\d.,\s%+hs:\-]+$/.test(String(value).trim());

  return (
    <div className="metric-card">
      <div className="metric-header">
        <span>{label}</span>
        {icon && <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>{icon}</span>}
      </div>
      <div
        className={`metric-value ${isNumeric ? "font-mono-tabular" : ""}`}
        style={{
          fontFamily: isNumeric ? "var(--font-mono), var(--font-sans)" : "var(--font-sans)",
          color: "#ffffff"
        }}
      >
        {value}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

