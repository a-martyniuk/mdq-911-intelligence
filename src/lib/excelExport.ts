/**
 * Utility to export analytical data tables directly to Excel-compatible CSV files (UTF-8 BOM).
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    alert("No hay datos disponibles para exportar.");
    return;
  }

  // Extract column headers
  const headers = Object.keys(rows[0]);

  // Escape CSV fields properly (double quotes, newlines, semicolons)
  const formatCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\n/g, " ");
    return `"${str}"`;
  };

  const csvRows = [
    headers.map((h) => `"${h}"`).join(";"),
    ...rows.map((row) => headers.map((h) => formatCell(row[h])).join(";")),
  ];

  // \uFEFF is the UTF-8 BOM header that tells Excel to open the file with UTF-8 encoding (preserving accents like á, é, í, ó, ú, ñ)
  const csvString = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
