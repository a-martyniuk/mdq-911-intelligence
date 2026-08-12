/**
 * Utility functions for clean formatting of time, dates, and metrics in MDQ 911 Platform
 */

export function formatTimeDifference(hours: number | string | undefined): string {
  const hoursNum = typeof hours === "number" ? hours : parseFloat(hours as any) || 0;

  if (isNaN(hoursNum) || hoursNum <= 0) {
    return "Inmediato (< 1 min)";
  }

  const totalMinutes = Math.round(hoursNum * 60);

  if (totalMinutes < 1) {
    return "Inmediato (< 1 min)";
  }
  if (totalMinutes === 1) {
    return "1 minuto";
  }
  if (totalMinutes < 60) {
    return `${totalMinutes} minutos`;
  }

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (m === 0) {
    return `${h} ${h === 1 ? 'hora' : 'horas'}`;
  }

  return `${h}h ${m}m (${hoursNum.toFixed(1)} hs)`;
}
