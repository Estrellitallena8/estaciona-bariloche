import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { api, setAuthToken, getAuthToken } from "../api/client";
import type { Usuario } from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  login: (telefono: string, password: string) => Promise<void>;
  registrar: (data: { nombre: string; telefono: string; email?: string; password: string; patente: string }) => Promise<void>;
  logout: () => void;
  refrescarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescarUsuario = useCallback(async () => {
    if (!getAuthToken()) {
      setUsuario(null);
      return;
    }
    try {
      const data = await api.get<{ user: Usuario }>("/auth/me");
      setUsuario(data.user);
    } catch {
      setAuthToken(null);
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    refrescarUsuario().finally(() => setCargando(false));
  }, [refrescarUsuario]);

  async function login(telefono: string, password: string) {
    const data = await api.post<{ token: string; user: Usuario }>("/auth/login", { telefono, password });
    setAuthToken(data.token);
    setUsuario(data.user);
  }

  async function registrar(payload: { nombre: string; telefono: string; email?: string; password: string; patente: string }) {
    const data = await api.post<{ token: string; user: Usuario }>("/auth/registro", payload);
    setAuthToken(data.token);
    setUsuario(data.user);
  }

  function logout() {
    setAuthToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registrar, logout, refrescarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
