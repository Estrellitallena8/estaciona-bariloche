import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { api, ApiError } from "../api/client";
import type { SesionEstacionamiento } from "../types";
import { EstadoTag } from "../components/EstadoTag";
import { formatearCuentaRegresiva, formatearHora, formatearMoneda, estaVencida } from "../utils/formato";

export function TicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sesion, setSesion] = useState<SesionEstacionamiento | null>(null);
  const [error, setError] = useState("");
  const [extendiendo, setExtendiendo] = useState(false);
  const [, forceTick] = useState(0);

  async function cargar() {
    if (!id) return;
    try {
      const data = await api.get<{ session: SesionEstacionamiento }>(`/sesiones/${id}`);
      setSesion(data.session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el ticket");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  async function extender(minutos: number) {
    if (!id) return;
    setExtendiendo(true);
    setError("");
    try {
      const data = await api.post<{ session: SesionEstacionamiento }>(`/sesiones/${id}/extender`, {
        minutosAdicionales: minutos,
      });
      setSesion(data.session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo extender el estacionamiento");
    } finally {
      setExtendiendo(false);
    }
  }

  if (!sesion) {
    return error ? (
      <p className="error-text">{error}</p>
    ) : (
      <div className="center-text" style={{ paddingTop: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  const vencida = sesion.estado === "ACTIVA" && estaVencida(sesion.fin);
  const maxMinutos = sesion.zone.maxHorasContinuas * 60;
  const puedeExtender = sesion.estado === "ACTIVA" && !vencida && sesion.duracionMinutos < maxMinutos;

  return (
    <div>
      <div className="card center-text" style={{ borderColor: sesion.zone.colorHex }}>
        <span className="zone-badge" style={{ background: `${sesion.zone.colorHex}22`, color: sesion.zone.colorHex }}>
          {sesion.zone.nombre}
        </span>
        <div style={{ margin: "14px 0 6px" }}>
          <EstadoTag estado={sesion.estado} fin={sesion.fin} />
        </div>
        <div className="countdown" style={{ color: vencida ? "var(--color-danger)" : "var(--color-text)" }}>
          {formatearCuentaRegresiva(sesion.fin)}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          {vencida ? "Venció" : "Vence"} a las {formatearHora(sesion.fin)}
        </p>
      </div>

      <div className="card">
        <div className="list-item">
          <span className="muted">Patente</span>
          <strong>{sesion.vehicle.patente}</strong>
        </div>
        <div className="list-item">
          <span className="muted">Ubicación</span>
          <span>{sesion.spot.calle} {sesion.spot.altura}</span>
        </div>
        <div className="list-item">
          <span className="muted">Duración pagada</span>
          <span>{sesion.duracionMinutos} min</span>
        </div>
        <div className="list-item">
          <span className="muted">Total pagado</span>
          <span>{formatearMoneda(sesion.costo)}</span>
        </div>
      </div>

      {sesion.estado === "ACTIVA" && !vencida && (
        <div className="card center-text">
          <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
            Mostrale este código al inspector para validar tu estacionamiento
          </p>
          <div style={{ background: "white", padding: 12, borderRadius: 12, display: "inline-block" }}>
            <QRCodeSVG value={sesion.ticketToken} size={160} />
          </div>
        </div>
      )}

      {puedeExtender && (
        <div className="card">
          <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Extender tiempo</p>
          <div className="duration-picker">
            {[30, 60, 120].map((m) => (
              <button
                key={m}
                className="duration-chip"
                disabled={extendiendo || sesion.duracionMinutos + m > maxMinutos}
                onClick={() => extender(m)}
              >
                +{m < 60 ? `${m} min` : `${m / 60}h`}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {vencida && (
        <button className="btn btn-primary" onClick={() => navigate("/escanear")}>
          Pagar un nuevo estacionamiento
        </button>
      )}
      {!vencida && sesion.estado === "ACTIVA" && (
        <button className="btn btn-ghost" onClick={() => navigate("/")}>
          Volver al inicio
        </button>
      )}
    </div>
  );
}
