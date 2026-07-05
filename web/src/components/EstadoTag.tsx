import type { EstadoSesion } from "../types";
import { estaVencida } from "../utils/formato";

const LABELS: Record<EstadoSesion, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  ACTIVA: "Activa",
  EXPIRADA: "Vencida",
  CANCELADA: "Cancelada",
};

const CLASSES: Record<EstadoSesion, string> = {
  PENDIENTE_PAGO: "tag-pendiente",
  ACTIVA: "tag-activa",
  EXPIRADA: "tag-vencida",
  CANCELADA: "tag-cancelada",
};

export function EstadoTag({ estado, fin }: { estado: EstadoSesion; fin: string | null }) {
  const vencida = estado === "ACTIVA" && estaVencida(fin);
  const estadoEfectivo = vencida ? "EXPIRADA" : estado;
  return <span className={`tag ${CLASSES[estadoEfectivo]}`}>{LABELS[estadoEfectivo]}</span>;
}
