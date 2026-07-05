import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api, ApiError } from "../api/client";
import { formatearHora } from "../utils/formato";

interface ResultadoVerificacion {
  valido: boolean;
  mensaje: string;
  session?: {
    patente: string;
    zona: string;
    calle: string;
    inicio: string | null;
    fin: string | null;
    estado: string;
  };
}

export function InspectorPage() {
  const [patente, setPatente] = useState("");
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [error, setError] = useState("");
  const [escaneando, setEscaneando] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function buscar(query: { patente?: string; ticket?: string }) {
    setError("");
    setResultado(null);
    try {
      const search = new URLSearchParams(query as Record<string, string>).toString();
      const data = await api.get<ResultadoVerificacion>(`/inspector/verificar?${search}`);
      setResultado(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo verificar");
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (patente.trim()) buscar({ patente: patente.trim() });
  }

  useEffect(() => {
    if (!escaneando) return;
    const scanner = new Html5Qrcode("inspector-camera", { verbose: false });
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          setEscaneando(false);
          buscar({ ticket: decodedText });
        },
        () => {},
      )
      .catch(() => setError("No se pudo acceder a la cámara"));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [escaneando]);

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Verificación de estacionamiento</h2>

      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label>Buscar por patente</label>
          <input value={patente} onChange={(e) => setPatente(e.target.value.toUpperCase())} placeholder="Ej: AB123CD" />
        </div>
        <button className="btn btn-primary">Verificar</button>
      </form>

      <button className="btn btn-outline" onClick={() => setEscaneando((v) => !v)}>
        {escaneando ? "Cancelar escaneo" : "📷 Escanear QR del ticket"}
      </button>

      {escaneando && (
        <div className="qr-reader-box" style={{ marginTop: 14 }}>
          <div id="inspector-camera" style={{ width: "100%" }} />
        </div>
      )}

      {error && <p className="error-text" style={{ marginTop: 14 }}>{error}</p>}

      {resultado && (
        <div className="card" style={{ marginTop: 14, borderColor: resultado.valido ? "var(--color-accent)" : "var(--color-danger)" }}>
          <div className="row-between">
            <strong style={{ color: resultado.valido ? "var(--color-accent)" : "var(--color-danger)" }}>
              {resultado.valido ? "✅ VIGENTE" : "❌ NO VIGENTE"}
            </strong>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>{resultado.mensaje}</p>
          {resultado.session && (
            <div style={{ marginTop: 10 }}>
              <div className="list-item"><span className="muted">Patente</span><strong>{resultado.session.patente}</strong></div>
              <div className="list-item"><span className="muted">Zona</span><span>{resultado.session.zona}</span></div>
              <div className="list-item"><span className="muted">Calle</span><span>{resultado.session.calle}</span></div>
              <div className="list-item"><span className="muted">Vence</span><span>{formatearHora(resultado.session.fin)}</span></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
