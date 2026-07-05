const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

let authToken: string | null = localStorage.getItem("eb_token");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("eb_token", token);
  else localStorage.removeItem("eb_token");
}

export function getAuthToken() {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  detalle?: unknown;

  constructor(message: string, status: number, detalle?: unknown) {
    super(message);
    this.status = status;
    this.detalle = detalle;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? "Ocurrió un error inesperado", res.status, data.detalle);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
