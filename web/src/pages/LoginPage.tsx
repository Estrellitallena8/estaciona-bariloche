import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(telefono, password);
      const destino = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ paddingTop: 40 }}>
      <div className="center-text" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 40 }}>🏔️</div>
        <h2 style={{ fontSize: 22, marginTop: 8 }}>Estaciona Bariloche</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>Pagá tu estacionamiento medido con QR o NFC</p>
      </div>

      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label>Teléfono</label>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 2944123456"
            inputMode="tel"
            required
          />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="center-text" style={{ marginTop: 18 }}>
        <span className="muted" style={{ fontSize: 13 }}>¿No tenés cuenta? </span>
        <Link to="/registro" className="link-quiet">Creá una acá</Link>
      </p>

      <p className="center-text muted" style={{ fontSize: 11, marginTop: 28 }}>
        Inspector de demo: teléfono 0000000000 / contraseña inspector123
      </p>
    </div>
  );
}
