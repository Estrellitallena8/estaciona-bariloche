import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { SesionEstacionamiento } from "../types";
import { EstadoTag } from "../components/EstadoTag";
import { formatearCuentaRegresiva, formatearHora } from "../utils/formato";

export function HomePage() {
  const navigate = useNavigate();
  const [activas, setActivas] = useState<SesionEstacionamiento[] | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    api.get<{ sesiones: SesionEstacionamiento[] }>("/sesiones/activas").then((data) => setActivas(data.sesiones));
  }, []);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      {activas && activas.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, color: "var(--color-text-dim)", marginBottom: 10 }}>Estacionamiento activo</h2>
          {activas.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{ cursor: "pointer", borderColor: s.zone.colorHex }}
              onClick={() => navigate(`/ticket/${s.id}`)}
            >
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span className="zone-badge" style={{ background: `${s.zone.colorHex}22`, color: s.zone.colorHex }}>
                  {s.zone.nombre}
                </span>
                <EstadoTag estado={s.estado} fin={s.fin} />
              </div>
              <div className="row-between">
                <div>
                  <div style={{ fontWeight: 600 }}>{s.vehicle.patente}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{s.spot.calle} {s.spot.altura}</div>
                </div>
                <div className="countdown" style={{ fontSize: 26 }}>{formatearCuentaRegresiva(s.fin)}</div>
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Vence a las {formatearHora(s.fin)}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 15, color: "var(--color-text-dim)", marginBottom: 10 }}>Pagar estacionamiento</h2>
      <div className="grid-2">
        <button className="big-action" onClick={() => navigate("/escanear")}>
          <span className="emoji">📷</span>
          <span>Escanear código QR</span>
        </button>
        <button className="big-action" onClick={() => navigate("/escanear?modo=nfc")}>
          <span className="emoji">📶</span>
          <span>Acercar el celular (NFC)</span>
        </button>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
          Buscá el cartel del parquímetro virtual en la vía pública. Escaneá su código QR con la
          cámara o acercá tu celular al tag NFC para identificar la zona y pagar en segundos.
        </p>
      </div>
    </div>
  );
}
