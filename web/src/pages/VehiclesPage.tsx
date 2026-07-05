import { useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function VehiclesPage() {
  const { usuario, refrescarUsuario, logout } = useAuth();
  const [patente, setPatente] = useState("");
  const [alias, setAlias] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function agregar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await api.post("/vehiculos", { patente, alias: alias || undefined });
      setPatente("");
      setAlias("");
      await refrescarUsuario();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo agregar el vehículo");
    } finally {
      setCargando(false);
    }
  }

  async function eliminar(id: string) {
    await api.delete(`/vehiculos/${id}`);
    await refrescarUsuario();
  }

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Mis vehículos</h2>
      <div className="card">
        {usuario?.vehiculos.map((v) => (
          <div className="list-item" key={v.id}>
            <div>
              <strong>{v.patente}</strong>
              {v.alias && <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>{v.alias}</span>}
            </div>
            <button className="link-quiet" onClick={() => eliminar(v.id)}>Quitar</button>
          </div>
        ))}
        {!usuario?.vehiculos.length && <p className="muted">No tenés vehículos cargados.</p>}
      </div>

      <form className="card" onSubmit={agregar}>
        <div className="field">
          <label>Patente</label>
          <input value={patente} onChange={(e) => setPatente(e.target.value.toUpperCase())} placeholder="Ej: AB123CD" required />
        </div>
        <div className="field">
          <label>Alias (opcional)</label>
          <input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej: Auto de trabajo" />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" disabled={cargando}>{cargando ? "Agregando..." : "Agregar vehículo"}</button>
      </form>

      <button className="btn btn-danger" onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
