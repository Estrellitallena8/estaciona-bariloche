import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { usuario } = useAuth();

  return (
    <>
      <header className="app-header">
        <h1>
          <span className="app-brand-dot" />
          Estaciona Bariloche
        </h1>
        {usuario && <span className="muted" style={{ fontSize: 12 }}>{usuario.nombre.split(" ")[0]}</span>}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          <span className="icon">🏠</span>
          Inicio
        </NavLink>
        <NavLink to="/historial" className={({ isActive }) => (isActive ? "active" : "")}>
          <span className="icon">🧾</span>
          Historial
        </NavLink>
        <NavLink to="/vehiculos" className={({ isActive }) => (isActive ? "active" : "")}>
          <span className="icon">🚗</span>
          Vehículos
        </NavLink>
        {usuario?.esInspector && (
          <NavLink to="/inspector" className={({ isActive }) => (isActive ? "active" : "")}>
            <span className="icon">🛡️</span>
            Inspector
          </NavLink>
        )}
      </nav>
    </>
  );
}
