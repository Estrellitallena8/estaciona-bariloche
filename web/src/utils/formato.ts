export function formatearMoneda(monto: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(monto);
}

export function formatearHora(iso: string | null) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function formatearCuentaRegresiva(finIso: string | null): string {
  if (!finIso) return "00:00:00";
  const restanteMs = new Date(finIso).getTime() - Date.now();
  if (restanteMs <= 0) return "00:00:00";
  const totalSeg = Math.floor(restanteMs / 1000);
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  const s = totalSeg % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function estaVencida(finIso: string | null): boolean {
  if (!finIso) return true;
  return new Date(finIso).getTime() <= Date.now();
}
