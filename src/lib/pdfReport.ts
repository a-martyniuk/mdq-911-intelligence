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
