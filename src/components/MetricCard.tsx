import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export default function MetricCard({ label, value, sub, icon, accentColor }: MetricCardProps) {
  const isNumeric = typeof value === "number" || /^[\d.,\s%+hs:\-]+$/.test(String(value).trim());

  // Softened, non-neon subtle top border
  const softBorderTop = accentColor
    ? accentColor.startsWith("#") && accentColor.length === 7
      ? `${accentColor}45`
      : "rgba(59, 130, 246, 0.25)"
    : "var(--border)";

  return (
    <div
      className="metric-card"
      style={{
        borderTop: `2px solid ${softBorderTop}`,
      }}
    >
      <div className="metric-header">
        <span>{label}</span>
        {icon && (
          <span
            style={{
              color: accentColor ? `${accentColor}bb` : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className={`metric-value ${isNumeric ? "font-mono-tabular" : ""}`}
        style={{
          fontFamily: isNumeric ? "var(--font-mono), monospace" : "var(--font-sans)",
          color: "#ffffff",
          fontSize: "31px",
        }}
      >
        {value}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

