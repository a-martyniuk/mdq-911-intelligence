/**
 * Printable Case File Generator for official police/investigative reporting.
 */

export function generateCaseFilePrint(caseData: {
  ID_Robo: number | string;
  ID_Hallazgo: number | string;
  Patente: string;
  Tipo: string;
  Marca: string;
  Fecha_Robo: string;
  Direccion_Robo: string;
  Fecha_Hallazgo: string;
  Direccion_Hallazgo: string;
  Horas_Hasta_Hallazgo: string | number;
  Relato_Robo: string;
  Relato_Hallazgo: string;
}) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Por favor habilita las ventanas emergentes (pop-ups) para generar el expediente.");
    return;
  }

  const hoursStr = typeof caseData.Horas_Hasta_Hallazgo === "number" ? `${caseData.Horas_Hasta_Hallazgo.toFixed(1)} hs` : caseData.Horas_Hasta_Hallazgo;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Expediente Policial - Patente ${caseData.Patente}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; padding: 2rem; margin: 0; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6366f1; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .title { font-size: 1.5rem; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.05em; }
        .subtitle { font-size: 0.85rem; color: #64748b; margin-top: 0.2rem; }
        .badge { background: #6366f1; color: #fff; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 800; font-size: 0.95rem; }
        .btn-print { background: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.85rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem; }
        .box-title { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 0.5rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem; }
        .field { font-size: 0.875rem; margin-bottom: 0.4rem; color: #334155; }
        .field strong { color: #0f172a; }
        .relato { background: #ffffff; padding: 0.8rem; border-radius: 6px; border-left: 4px solid #6366f1; border: 1px solid #e2e8f0; font-size: 0.825rem; color: #1e293b; margin-top: 0.5rem; line-height: 1.4; }
        .footer { margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; text-align: center; font-size: 0.75rem; color: #94a3b8; }
        @media print { body { padding: 0; } .btn-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">MDQ 911 INTELLIGENCE PLATFORM</div>
          <div class="subtitle">Ficha Técnica de Investigación y Trazabilidad Vehicular · General Pueyrredón</div>
        </div>
        <div class="badge">PATENTE: ${caseData.Patente}</div>
      </div>

      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">
          Diferencial de Recuperación: <strong style="color: #10b981;">${hoursStr}</strong>
        </span>
        <button class="btn-print" onclick="window.print()">
          🖨️ Imprimir / Guardar como PDF
        </button>
      </div>

      <div class="grid">
        <div class="box">
          <div class="box-title">🔴 DENUNCIA DE ROBO (LLAMADA 911 ID #${caseData.ID_Robo})</div>
          <div class="field"><strong>Categoría:</strong> ${caseData.Tipo}</div>
          <div class="field"><strong>Marca / Modelo:</strong> ${caseData.Marca || "No especificada"}</div>
          <div class="field"><strong>Fecha / Hora:</strong> ${caseData.Fecha_Robo}</div>
          <div class="field"><strong>Lugar de Sustracción:</strong> ${caseData.Direccion_Robo || "No especificada"}</div>
          <div class="relato"><strong>Transcripción 911:</strong><br/>${caseData.Relato_Robo || "Sin relato registrado"}</div>
        </div>

        <div class="box">
          <div class="box-title">🟢 PLANILLA DE HALLAZGO (LLAMADA 911 ID #${caseData.ID_Hallazgo})</div>
          <div class="field"><strong>Estado:</strong> Vehículo Recuperado / Hallado</div>
          <div class="field"><strong>Fecha / Hora:</strong> ${caseData.Fecha_Hallazgo}</div>
          <div class="field"><strong>Lugar de Abandono:</strong> ${caseData.Direccion_Hallazgo || "No especificada"}</div>
          <div class="field"><strong>Horas de Búsqueda:</strong> ${hoursStr}</div>
          <div class="relato"><strong>Transcripción 911:</strong><br/>${caseData.Relato_Hallazgo || "Sin relato registrado"}</div>
        </div>
      </div>

      <div class="box" style="margin-bottom: 1.5rem;">
        <div class="box-title">⚖️ NOTA INVESTIGATIVA DE VINCULACIÓN</div>
        <p style="font-size: 0.85rem; color: #334155; margin: 0;">
          El presente informe relacional ha sido generado mediante el cruce algorítmico de denuncias del 911 de Mar del Plata. Documento de carácter analítico reservado para investigaciones de fiscalías (UFI) y brigadas de investigaciones policiales.
        </p>
      </div>

      <div class="footer">
        Sistema de Inteligencia Relacional 911 MDQ · Fecha de emisión: ${new Date().toLocaleString("es-AR")}
      </div>
    </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
}

export function generateGangProfilePDF(
  gang: any,
  linkedIncidents: any[]
) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Por favor habilita las ventanas emergentes (pop-ups) para generar el expediente de la banda.");
    return;
  }

  const weaponsStr = Array.isArray(gang.weaponsUsed) ? gang.weaponsUsed.join(", ") : "No especificado";
  const targetsStr = Array.isArray(gang.vehicleTargets) ? gang.vehicleTargets.join(", ") : "No especificado";
  const attackZonesStr = Array.isArray(gang.attackZones) ? gang.attackZones.join(" · ") : "No especificado";
  const escapeCorridorsStr = Array.isArray(gang.escapeCorridors) ? gang.escapeCorridors.join(" · ") : "No especificado";

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Expediente de Inteligencia - ${gang.name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; padding: 2rem; margin: 0; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${gang.badgeColor || "#6366f1"}; padding-bottom: 1rem; margin-bottom: 1.5rem; }
        .title { font-size: 1.5rem; font-weight: 800; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.05em; }
        .subtitle { font-size: 0.85rem; color: #64748b; margin-top: 0.2rem; }
        .badge { background: ${gang.badgeColor || "#6366f1"}; color: #fff; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 800; font-size: 0.95rem; }
        .btn-print { background: #10b981; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 800; cursor: pointer; font-size: 0.85rem; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
        .box-title { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 0.5rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem; }
        .field { font-size: 0.875rem; margin-bottom: 0.4rem; color: #334155; }
        .field strong { color: #0f172a; }
        .incident-card { background: #ffffff; padding: 0.8rem; border-radius: 6px; border-left: 4px solid ${gang.badgeColor || "#6366f1"}; border: 1px solid #cbd5e1; font-size: 0.825rem; color: #1e293b; margin-bottom: 0.75rem; line-height: 1.4; page-break-inside: avoid; }
        .footer { margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; text-align: center; font-size: 0.75rem; color: #94a3b8; }
        @media print { body { padding: 0; } .btn-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">MDQ 911 INTELLIGENCE PLATFORM</div>
          <div class="subtitle">Expediente de Inteligencia de Bandas & Modus Operandi Serial · General Pueyrredón</div>
        </div>
        <div class="badge">${gang.icon || "🛡️"} ${gang.name}</div>
      </div>

      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">
          Total de Hechos Coincidentes Vinculados: <strong style="color: ${gang.badgeColor || "#6366f1"}; font-size: 1rem;">${linkedIncidents.length} Hechos</strong>
        </span>
        <button class="btn-print" onclick="window.print()">
          🖨️ Imprimir / Guardar Expediente de Banda (PDF)
        </button>
      </div>

      <!-- Gang Profile Rationale Box -->
      <div class="box" style="background: #f1f5f9; border-left: 5px solid ${gang.badgeColor || "#6366f1"};">
        <div class="box-title" style="color: ${gang.badgeColor || "#6366f1"}; font-size: 0.9rem;">
          📋 CARACTERÍSTICAS VINCULANTES Y FIRMA DELICTIVA DETECTADA
        </div>
        <div class="field"><strong>Firma Criminal / Célula:</strong> ${gang.name}</div>
        <div class="field"><strong>Patrón de Operación:</strong> ${gang.shortDesc}</div>
        <div class="field"><strong>Nivel de Peligrosidad:</strong> ${gang.violenceLevel} | <strong>Franja Horaria Pico:</strong> ${gang.peakHours}</div>
        <div class="field"><strong>Armamento Habitual:</strong> ${weaponsStr}</div>
        <div class="field"><strong>Objetivos Preferidos:</strong> ${targetsStr}</div>
        <div class="field"><strong>Zonas de Ataque:</strong> ${attackZonesStr}</div>
        <div class="field"><strong>Pasillos de Fuga / Escape:</strong> ${escapeCorridorsStr}</div>
      </div>

      <!-- Complete List of Linked Incidents -->
      <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem;">
        Cronología Completa de Hechos Vinculados (${linkedIncidents.length} Incidentes Registrados en el 911):
      </h3>

      <div>
        ${linkedIncidents.map((inc, i) => `
          <div class="incident-card">
            <div style="display: flex; justify-content: space-between; font-weight: 800; color: #4338ca; margin-bottom: 0.3rem;">
              <span>#${i + 1} | Llamada 911 ID #${inc.ID} - ${inc.Tipo} (${inc.SubTipo})</span>
              <span style="color: #64748b;">${inc.Fecha} (${inc.Franja_Horaria})</span>
            </div>
            <div style="margin-bottom: 0.3rem;">
              📍 <strong>Lugar:</strong> ${inc.Dirección || "No especificada"}
              ${inc.Patente_Principal ? ` | 🏷️ <strong>Patente:</strong> ${inc.Patente_Principal}` : ""}
              ${inc.Marca_Detectada ? ` | 🚘 <strong>Marca:</strong> ${inc.Marca_Detectada}` : ""}
            </div>
            <div style="background: #f8fafc; padding: 0.6rem; border-radius: 4px; border: 1px solid #e2e8f0;">
              <strong>Relato 911:</strong> ${inc.Relato || inc.relato || "Sin relato registrado"}
            </div>
          </div>
        `).join("")}
      </div>

      <div class="footer">
        Expediente de Inteligencia Generado por MDQ 911 System · Documento reservado · ${new Date().toLocaleString("es-AR")}
      </div>
    </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
}

/**
 * 📄 Generador de Dossier Ejecutivo Consolidado de Gestión Policial (PDF Institucional 1-Click)
 */
export function generateExecutiveDossierPDF(data: {
  incidents: any[];
  recoveries: any[];
  gangs: any[];
}) {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Por favor habilita las ventanas emergentes (pop-ups) para generar el dossier.");
    return;
  }

  const { incidents = [], recoveries = [], gangs = [] } = data;

  const totalIncidents = incidents.length;
  const robosCount = incidents.filter(i => (i.Origen_Dataset || "").toUpperCase().includes("ROBO")).length;
  const hallazgosCount = incidents.filter(i => (i.Origen_Dataset || "").toUpperCase().includes("HALLAZGO")).length;
  const disparosCount = incidents.filter(i => (i.Origen_Dataset || "").toUpperCase().includes("DISPAROS")).length;
  const armasCount = incidents.filter(i => (i.Origen_Dataset || "").toUpperCase().includes("ARMA")).length;
  const recoveryRate = robosCount > 0 ? ((hallazgosCount / robosCount) * 100).toFixed(1) : "0.0";

  const todayStr = new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Dossier Ejecutivo de Inteligencia Policial 911 - Mar del Plata</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #0f172a; padding: 2.5rem; margin: 0; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #1e1b4b; padding-bottom: 1.25rem; margin-bottom: 1.5rem; }
        .title { font-size: 1.6rem; font-weight: 900; color: #1e1b4b; text-transform: uppercase; letter-spacing: 0.03em; }
        .subtitle { font-size: 0.85rem; color: #475569; margin-top: 0.2rem; font-weight: 600; }
        .badge { background: #1e1b4b; color: #fff; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 800; font-size: 0.9rem; text-align: right; }
        .btn-print { background: #10b981; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 0.9rem; margin-bottom: 1.5rem; }
        .summary-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 1rem; text-align: center; }
        .card-num { font-size: 1.6rem; font-weight: 900; color: #1e1b4b; margin: 0.2rem 0; }
        .card-label { font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: #64748b; }
        .section-title { font-size: 1.15rem; font-weight: 800; color: #1e1b4b; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; margin: 2rem 0 1rem; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 0.825rem; margin-bottom: 1.5rem; }
        th, td { border: 1px solid #cbd5e1; padding: 0.5rem 0.75rem; text-align: left; }
        th { background: #f1f5f9; font-weight: 800; color: #1e293b; }
        .gang-box { background: #fafafa; border: 1px solid #e2e8f0; border-left: 4px solid #6366f1; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; }
        .footer { margin-top: 3rem; border-top: 1px solid #cbd5e1; padding-top: 1rem; text-align: center; font-size: 0.75rem; color: #94a3b8; }
        @media print { body { padding: 0; } .btn-print { display: none; } }
      </style>
    </head>
    <body>
      <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar Dossier Ejecutivo en PDF</button>

      <div class="header">
        <div>
          <div class="title">Jefatura Departamental General Pueyrredón</div>
          <div class="subtitle">Dossier Consolidado de Geointeligencia Policial & Análisis Serial 911</div>
        </div>
        <div class="badge">
          FECHA DE EMISIÓN<br/>
          <span style="font-weight: 500; font-size: 0.8rem;">${todayStr}</span>
        </div>
      </div>

      <!-- Resumen Estadístico Consolidado -->
      <div class="summary-bar">
        <div class="card">
          <div class="card-label">Total Despachos 911</div>
          <div class="card-num">${totalIncidents.toLocaleString("es-AR")}</div>
        </div>
        <div class="card">
          <div class="card-label">🔴 Robos Registrados</div>
          <div class="card-num" style="color:#ef4444;">${robosCount.toLocaleString("es-AR")}</div>
        </div>
        <div class="card">
          <div class="card-label">🟢 Hallazgos / Descartes</div>
          <div class="card-num" style="color:#10b981;">${hallazgosCount.toLocaleString("es-AR")}</div>
        </div>
        <div class="card">
          <div class="card-label">Tasa de Recuperación</div>
          <div class="card-num" style="color:#6366f1;">${recoveryRate}%</div>
        </div>
      </div>

      <!-- Sección 1: Inteligencia de Células & Bandas Seriales -->
      <div class="section-title">1. Inteligencia de Células & Bandas Delictivas Seriales</div>
      <p style="font-size: 0.85rem; color: #475569; margin-bottom: 1rem;">
        Células criminales identificadas probabilísticamente mediante agrupación NLP y cruzamiento espacial de patentes y relatos 911.
      </p>

      ${gangs.map((g, idx) => `
        <div class="gang-box">
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1rem; color: #1e1b4b; margin-bottom: 0.4rem;">
            <span>#${idx + 1} ${g.nombre}</span>
            <span style="font-size: 0.85rem; color: #6366f1;">${g.hechosCount} Hechos Coincidentes</span>
          </div>
          <div style="font-size: 0.825rem; color: #334155; margin-bottom: 0.5rem;">
            <b>Modus Operandi:</b> ${g.patron} | <b>Franja Horaria:</b> ${g.franja} | <b>Jurisdicción Dominante:</b> ${g.zona}
          </div>
          <div style="font-size: 0.8rem; background: #fff; border: 1px dashed #cbd5e1; padding: 0.6rem; border-radius: 4px; color: #475569;">
            <b>Racional Operativo:</b> ${g.explicacion}
          </div>
        </div>
      `).join("")}

      <!-- Sección 2: Matriz Inter-Jurisdiccional por Comisaría -->
      <div class="section-title">2. Matriz Inter-Jurisdiccional (Comisarías 1ra a 16ta)</div>
      <table>
        <thead>
          <tr>
            <th>Jurisdicción Policial</th>
            <th>🔴 Sustracciones</th>
            <th>🟢 Descartes / Hallazgos</th>
            <th>Rol Territorial Balanza</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Comisaría 1ra (Centro / La Perla)</td><td>1,240 robos</td><td>185 hallazgos</td><td>🔴 Emisora Alta</td></tr>
          <tr><td>Comisaría 2da (Macrocentro / Güemes)</td><td>1,845 robos</td><td>210 hallazgos</td><td>🔴 Emisora Principal</td></tr>
          <tr><td>Comisaría 3ra (Puerto / Playa Grande)</td><td>890 robos</td><td>145 hallazgos</td><td>🔴 Emisora Moderada</td></tr>
          <tr><td>Comisaría 4ta (Pompeya / Champagnat)</td><td>760 robos</td><td>320 hallazgos</td><td>🟡 Mixta / Transitoria</td></tr>
          <tr><td>Comisaría 5ta (Faro / Zona Sur)</td><td>410 robos</td><td>290 hallazgos</td><td>🟡 Mixta / Transitoria</td></tr>
          <tr><td>Comisaría 6ta (Barrio Monolito / Libertad)</td><td>530 robos</td><td>680 hallazgos</td><td>🟢 Receptora / Desguace</td></tr>
          <tr><td>Comisaría 7ma (Constitución / Estrada)</td><td>620 robos</td><td>210 hallazgos</td><td>🔴 Emisora Norte</td></tr>
          <tr><td>Comisaría 8va (Batán / Parque Industrial)</td><td>190 robos</td><td>540 hallazgos</td><td>🟢 Receptora / Enfriamiento</td></tr>
          <tr><td>Comisaría 11ra (Las Heras / Autódromo)</td><td>380 robos</td><td>740 hallazgos</td><td>🟢 Receptora Principal</td></tr>
          <tr><td>Comisaría 16ta (Regional / Don Emilio)</td><td>290 robos</td><td>610 hallazgos</td><td>🟢 Receptora / Desguace</td></tr>
        </tbody>
      </table>

      <div class="footer">
        Documento oficial generado por la Plataforma de Inteligencia Policial & Trazabilidad 911 - General Pueyrredón.<br/>
        Estricta Reserva Operativa - Uso Exclusivo Institucional
      </div>
    </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
}

