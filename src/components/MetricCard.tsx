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

  // Precision hairline top accent border (sober, non-fluorescent)
  const softBorderTop = accentColor
    ? accentColor.startsWith("#") && accentColor.length === 7
      ? `${accentColor}55`
      : "rgba(59, 130, 246, 0.35)"
    : "var(--border)";

  return (
    <div
      className="metric-card"
      style={{
        borderTop: `2px solid ${softBorderTop}`,
      }}
    >
      <div className="metric-header">
        <span style={{ fontWeight: 500, letterSpacing: "-0.01em" }}>{label}</span>
        {icon && (
          <span
            style={{
              color: accentColor ? `${accentColor}cc` : "var(--text-muted)",
              background: accentColor ? `${accentColor}14` : "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${accentColor ? `${accentColor}25` : "var(--border-subtle)"}`,
              padding: "4px",
              borderRadius: "var(--radius-xs)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
          color: "var(--text-primary)",
          fontSize: "30px",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

