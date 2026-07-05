import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { api, ApiError } from "../api/client";
import type { Spot, Zona } from "../types";

interface ResolverRespuesta {
  spot: Spot;
  zona: Zona;
  origen: "QR" | "NFC";
}

function extraerToken(texto: string, param: "qr" | "nfc"): string {
  try {
    const url = new URL(texto);
    return url.searchParams.get(param) ?? texto;
  } catch {
    return texto;
  }
}

// iOS no implementa la Web NFC API en ningún navegador (restricción de Apple, no de esta app).
// Pero el sistema operativo sí detecta tags NFC con un registro NDEF de tipo URL sin abrir
// ninguna app: alcanza con acercar el iPhone al cartel para que aparezca el aviso del sistema.
const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("NDEFReader" in window);

export function ScanPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [modo, setModo] = useState<"qr" | "nfc">(params.get("modo") === "nfc" ? "nfc" : "qr");
  const [nfcSoportado, setNfcSoportado] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const yaResueltoRef = useRef(false);

  const resolverSpot = useCallback(
    async (query: { qr?: string; nfc?: string }) => {
      if (yaResueltoRef.current) return;
      yaResueltoRef.current = true;
      setBuscando(true);
      setError("");
      try {
        const search = new URLSearchParams(query as Record<string, string>).toString();
        const data = await api.get<ResolverRespuesta>(`/spots/resolver?${search}`);
        navigate("/confirmar", { state: data });
      } catch (err) {
        yaResueltoRef.current = false;
        setError(err instanceof ApiError ? err.message : "No se pudo leer ese código");
      } finally {
        setBuscando(false);
      }
    },
    [navigate],
  );

  // Si llegamos por un link de un QR fisico (ej: escaneado con la camara nativa del celular)
  useEffect(() => {
    const qrParam = params.get("qr");
    const nfcParam = params.get("nfc");
    if (qrParam) resolverSpot({ qr: qrParam });
    else if (nfcParam) resolverSpot({ nfc: nfcParam });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escaneo QR con la camara del dispositivo
  useEffect(() => {
    if (modo !== "qr" || yaResueltoRef.current || params.get("qr")) return;

    const elementId = "qr-camera-view";
    const scanner = new Html5Qrcode(elementId, { verbose: false });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          const token = extraerToken(decodedText, "qr");
          scanner.stop().catch(() => {});
          resolverSpot({ qr: token });
        },
        () => {
          /* frame sin QR detectado, se ignora */
        },
      )
      .catch(() => setError("No se pudo acceder a la cámara. Revisá los permisos del navegador."));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [modo, resolverSpot, params]);

  // Lectura por Web NFC (disponible en Chrome para Android, requiere HTTPS o localhost)
  useEffect(() => {
    if (modo !== "nfc" || yaResueltoRef.current) return;
    if (!("NDEFReader" in window)) {
      setNfcSoportado(false);
      return;
    }
    let cancelado = false;
    const reader = new window.NDEFReader!();
    reader
      .scan()
      .then(() => {
        reader.onreading = (event) => {
          if (cancelado) return;
          for (const record of event.message.records) {
            if (record.recordType === "url" && record.data) {
              const texto = new TextDecoder().decode(record.data);
              resolverSpot({ nfc: extraerToken(texto, "nfc") });
              return;
            }
            if (record.recordType === "text" && record.data) {
              const texto = new TextDecoder().decode(record.data.buffer.slice(3));
              resolverSpot({ nfc: texto.trim() });
              return;
            }
          }
        };
        reader.onreadingerror = () => setError("No se pudo leer el tag NFC, acercá el celular e intentá de nuevo.");
      })
      .catch(() => setError("No se pudo activar el lector NFC. Revisá que esté encendido y los permisos otorgados."));

    return () => {
      cancelado = true;
    };
  }, [modo, resolverSpot]);

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <button
          className={`duration-chip ${modo === "qr" ? "selected" : ""}`}
          style={{ width: "100%" }}
          onClick={() => setModo("qr")}
        >
          📷 Cámara QR
        </button>
        <button
          className={`duration-chip ${modo === "nfc" ? "selected" : ""}`}
          style={{ width: "100%" }}
          onClick={() => setModo("nfc")}
        >
          📶 Tag NFC
        </button>
      </div>

      {buscando && (
        <div className="card center-text">
          <div className="spinner" style={{ marginBottom: 10 }} />
          <p className="muted">Identificando parquímetro...</p>
        </div>
      )}

      {!buscando && modo === "qr" && (
        <div className="qr-reader-box">
          <div id="qr-camera-view" style={{ width: "100%" }} />
        </div>
      )}

      {!buscando && modo === "nfc" && (
        <div className="card center-text" style={{ padding: 36 }}>
          {nfcSoportado ? (
            <>
              <div style={{ fontSize: 46, marginBottom: 12 }}>📶</div>
              <p>Acercá el celular al tag NFC del parquímetro</p>
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                Mantené el celular quieto a pocos centímetros del cartel
              </p>
            </>
          ) : esIOS ? (
            <>
              <div style={{ fontSize: 46, marginBottom: 12 }}>📱</div>
              <p>En iPhone no hace falta este botón</p>
              <p className="muted" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
                Apple no deja que ninguna app lea NFC desde el navegador, pero el sistema sí lo
                hace solo: acercá la parte de arriba del iPhone al cartel (sin abrir nada) y va a
                aparecer un aviso para entrar directo al pago.
              </p>
              <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                Si no aparece nada, activá NFC en Ajustes → General → NFC y volvé a intentar. Como
                alternativa, siempre podés escanear el QR del mismo cartel.
              </p>
            </>
          ) : (
            <>
              <p>Tu navegador no soporta lectura NFC (Web NFC solo está disponible en Chrome para Android).</p>
              <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Usá el escaneo por cámara QR como alternativa.</p>
            </>
          )}
        </div>
      )}

      {error && <p className="error-text" style={{ marginTop: 14 }}>{error}</p>}

      <p className="muted center-text" style={{ fontSize: 12, marginTop: 20 }}>
        ¿No tenés el cartel a mano? Pedile al inspector el código del parquímetro o probá con el link de demo desde el panel.
      </p>
    </div>
  );
}
