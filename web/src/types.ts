export interface Vehiculo {
  id: string;
  patente: string;
  alias?: string | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  telefono: string;
  email?: string | null;
  esInspector: boolean;
  vehiculos: Vehiculo[];
}

export interface Zona {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tarifaPorHora: number;
  toleranciaMin: number;
  maxHorasContinuas: number;
  colorHex: string;
  horarioDesde: string;
  horarioHasta: string;
  diasServicio: string;
}

export interface Spot {
  id: string;
  codigo: string;
  calle: string;
  altura?: string | null;
  lat: number;
  lng: number;
}

export type EstadoSesion = "PENDIENTE_PAGO" | "ACTIVA" | "EXPIRADA" | "CANCELADA";
export type EstadoPago = "PENDIENTE" | "APROBADO" | "RECHAZADO";

export interface Pago {
  id: string;
  monto: number;
  metodo: string;
  estado: EstadoPago;
}

export interface SesionEstacionamiento {
  id: string;
  duracionMinutos: number;
  costo: number;
  estado: EstadoSesion;
  origen: "QR" | "NFC";
  ticketToken: string;
  inicio: string | null;
  fin: string | null;
  createdAt: string;
  zone: Zona;
  spot: Spot;
  vehicle: Vehiculo;
  pago: Pago | null;
}
