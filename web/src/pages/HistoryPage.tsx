import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { SesionEstacionamiento } from "../types";
import { EstadoTag } from "../components/EstadoTag";
import { formatearHora, formatearMoneda } from "../utils/formato";

export function HistoryPage() {
  const navigate = useNavigate();
  const [sesiones, setSesiones] = useState<SesionEstacionamiento[] | null>(null);

  useEffect(() => {
    api.get<{ sesiones: SesionEstacionamiento[] }>("/sesiones/historial").then((data) => setSesiones(data.sesiones));
  }, []);

  if (!sesiones) {
    return (
      <div className="center-text" style={{ paddingTop: 60 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (sesiones.length === 0) {
    return <p className="muted center-text" style={{ paddingTop: 40 }}>Todavía no pagaste ningún estacionamiento.</p>;
  }

  return (
    <div>
      {sesiones.map((s) => (
        <div
          key={s.id}
          className="card"
          style={{ cursor: s.estado === "ACTIVA" ? "pointer" : "default" }}
          onClick={() => s.estado === "ACTIVA" && navigate(`/ticket/${s.id}`)}
        >
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span className="zone-badge" style={{ background: `${s.zone.colorHex}22`, color: s.zone.colorHex }}>
              {s.zone.nombre}
            </span>
            <EstadoTag estado={s.estado} fin={s.fin} />
          </div>
          <div className="row-between">
            <div>
              <div style={{ fontWeight: 600 }}>{s.vehicle.patente}</div>
              <div className="muted" style={{ fontSize: 12 }}>{s.spot.calle} {s.spot.altura}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>{formatearMoneda(s.costo)}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {s.inicio ? `${formatearHora(s.inicio)} - ${formatearHora(s.fin)}` : "Sin confirmar"}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
