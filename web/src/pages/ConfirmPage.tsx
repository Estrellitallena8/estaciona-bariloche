import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Spot, Zona, SesionEstacionamiento } from "../types";
import { formatearMoneda } from "../utils/formato";

interface EstadoNavegacion {
  spot: Spot;
  zona: Zona;
  origen: "QR" | "NFC";
}

const DURACIONES = [30, 60, 120, 180, 240];

function calcularCostoLocal(tarifaPorHora: number, minutos: number) {
  const crudo = tarifaPorHora * (minutos / 60);
  return Math.ceil(crudo / 50) * 50;
}

export function ConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const state = location.state as EstadoNavegacion | null;

  const [vehicleId, setVehicleId] = useState(usuario?.vehiculos[0]?.id ?? "");
  const [duracion, setDuracion] = useState(60);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  if (!state) {
    return (
      <div className="card center-text">
        <p>No se encontró información del parquímetro. Volvé a escanear el código.</p>
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate("/escanear")}>
          Escanear de nuevo
        </button>
      </div>
    );
  }

  const { spot, zona, origen } = state;
  const maxMinutos = zona.maxHorasContinuas * 60;
  const opcionesDuracion = DURACIONES.filter((d) => d <= maxMinutos);
  const costo = calcularCostoLocal(zona.tarifaPorHora, duracion);

  async function confirmarPago() {
    if (!vehicleId) {
      setError("Elegí un vehículo para continuar");
      return;
    }
    setError("");
    setProcesando(true);
    try {
      const data = await api.post<{
        session: SesionEstacionamiento;
        modoDemo: boolean;
        checkoutUrl?: string;
      }>("/sesiones", { spotId: spot.id, vehicleId, duracionMinutos: duracion, origen });

      if (data.modoDemo) {
        navigate(`/ticket/${data.session.id}`, { replace: true });
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar el pago");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div>
      <div className="card" style={{ borderColor: zona.colorHex }}>
        <span className="zone-badge" style={{ background: `${zona.colorHex}22`, color: zona.colorHex }}>
          {zona.nombre}
        </span>
        <h2 style={{ fontSize: 18, margin: "10px 0 4px" }}>{spot.calle} {spot.altura}</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Tarifa {formatearMoneda(zona.tarifaPorHora)}/hora · Máximo {zona.maxHorasContinuas}hs continuas
        </p>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Identificado por {origen === "QR" ? "código QR" : "tag NFC"}</p>
      </div>

      <div className="card">
        <label style={{ fontSize: 13, color: "var(--color-text-dim)" }}>Vehículo</label>
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          style={{ marginTop: 8, width: "100%" }}
        >
          {usuario?.vehiculos.length ? (
            usuario.vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.patente} {v.alias ? `(${v.alias})` : ""}
              </option>
            ))
          ) : (
            <option value="">No tenés vehículos cargados</option>
          )}
        </select>
      </div>

      <div className="card">
        <label style={{ fontSize: 13, color: "var(--color-text-dim)" }}>Duración</label>
        <div className="duration-picker" style={{ marginTop: 10 }}>
          {opcionesDuracion.map((d) => (
            <button
              key={d}
              className={`duration-chip ${duracion === d ? "selected" : ""}`}
              onClick={() => setDuracion(d)}
            >
              {d < 60 ? `${d} min` : `${d / 60} h`}
            </button>
          ))}
        </div>
      </div>

      <div className="card row-between">
        <span className="muted">Total a pagar</span>
        <span style={{ fontSize: 24, fontWeight: 700 }}>{formatearMoneda(costo)}</span>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-accent" onClick={confirmarPago} disabled={procesando || !vehicleId}>
        {procesando ? "Procesando..." : `Pagar ${formatearMoneda(costo)}`}
      </button>
    </div>
  );
}
