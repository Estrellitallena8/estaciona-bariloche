import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export function RegisterPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [patente, setPatente] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await registrar({ nombre, telefono, email: email || undefined, password, patente });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Crear cuenta</h2>
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label>Nombre completo</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="field">
          <label>Teléfono</label>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} inputMode="tel" required />
        </div>
        <div className="field">
          <label>Email (opcional)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </div>
        <div className="field">
          <label>Patente de tu vehículo</label>
          <input
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            placeholder="Ej: AB123CD"
            required
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" disabled={cargando}>
          {cargando ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>
      <p className="center-text" style={{ marginTop: 18 }}>
        <Link to="/login" className="link-quiet">Ya tengo cuenta, iniciar sesión</Link>
      </p>
    </div>
  );
}
