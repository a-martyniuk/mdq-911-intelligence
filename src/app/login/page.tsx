"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, AlertCircle } from "lucide-react";
import { getApiUrl, getAppPath, getAssetPath } from "@/lib/apiUrl";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = getAppPath("/");
      } else {
        setError(data.error || "Credenciales incorrectas");
      }
    } catch {
      setError("Error de conexión al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "12px",
            padding: "8px 16px",
            marginBottom: "1rem"
          }}>
            <img
              src={getAssetPath("/images/institucional/logo_ministerio.svg")}
              alt="Ministerio de Seguridad PBA"
              style={{ height: "44px", width: "auto" }}
            />
            <div style={{ width: "1px", height: "34px", background: "rgba(255, 255, 255, 0.2)" }} />
            <img
              src={getAssetPath("/images/institucional/logo_superintendencia.png")}
              alt="Superintendencia de Investigaciones"
              style={{ height: "42px", width: "auto" }}
            />
          </div>

          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.25rem" }}>
            Superintendencia de Investigaciones de Delitos Complejos
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.25rem" }} className="gradient-text">
            Plataforma 911 & Geointeligencia Criminal
          </h1>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Ministerio de Seguridad · Provincia de Buenos Aires
          </p>
        </div>

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid var(--accent-red)",
            borderRadius: "var(--radius-sm)",
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            color: "#fca5a5",
            fontSize: "0.85rem"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <User size={14} /> Usuario
            </label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div style={{ marginBottom: "1.75rem" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Lock size={14} /> Contraseña
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Verificando..." : "Ingresar a la Plataforma"}
          </button>
        </form>

        <div style={{ marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
            <strong style={{ color: "var(--text-secondary)" }}>Superintendencia de Investigaciones de Delitos Complejos y Crimen Organizado</strong><br/>
            📍 Avenida 52 S/N entre 117 y 118 – Paseo del Bosque de La Plata (C.P. N° 1900)<br/>
            📞 Conmutador Oficial: (0221) 423-1867/186 · Documento Reservado (Ley 13.482)
          </div>
        </div>
      </div>
    </div>
  );
}
