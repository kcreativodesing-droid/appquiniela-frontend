// ─────────────────────────────────────────────────────────────────
// API Client — Quiniela Mundial 2026
// Wrapper de fetch con JWT automático y manejo de errores
// ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Almacenamiento del token
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('quinela_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('quinela_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('quinela_token');
  localStorage.removeItem('quinela_user');
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('quinela_user');
  return u ? JSON.parse(u) : null;
};

export const setUser = (user: object): void => {
  localStorage.setItem('quinela_user', JSON.stringify(user));
};

// ── Función base de fetch ─────────────────────────────────────────
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = '/';
    throw new Error('Sesión expirada');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data as T;
}

// ── Tipos ────────────────────────────────────────────────────────
export interface Usuario {
  id: string;
  cedula: string;
  nombre: string;
  telefono?: string;
  rol: 'ADMIN' | 'USER';
  puntosTotales: number;
}

export interface Partido {
  id: string;
  apiFixtureId?: string;
  equipoLocal: string;
  equipoVisitante: string;
  fechaHora: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  estado: 'Pendiente' | 'En Juego' | 'Finalizado';
  fase: string;
  grupo?: string;
  _count?: { predicciones: number };
}

export interface Prediccion {
  id: string;
  usuarioId: string;
  partidoId: string;
  predGolesLocal: number;
  predGolesVisitante: number;
  puntosObtenidos: number | null;
  partido?: Partido;
}

export interface LeaderboardEntry {
  posicion: number;
  id: string;
  nombre: string;
  cedula: string;
  puntosTotales: number;
  totalPredicciones: number;
  exactos: number;
  parciales: number;
  fallos: number;
}

// ── Endpoints Auth ────────────────────────────────────────────────
export const authApi = {
  login: (cedula: string, password: string) =>
    apiFetch<{ token: string; usuario: Usuario }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cedula, password }),
    }),

  register: (data: { cedula: string; nombre: string; telefono?: string; password: string }) =>
    apiFetch<{ token: string; usuario: Usuario }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => apiFetch<Usuario>('/api/auth/me'),
};

// ── Endpoints Partidos ────────────────────────────────────────────
export const partidosApi = {
  listar: (params?: { fase?: string; estado?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiFetch<Partido[]>(`/api/partidos${query}`);
  },

  proximo: () =>
    apiFetch<{ partido: Partido; tienePrediccion: boolean }>('/api/partidos/proximo'),
};

// ── Endpoints Predicciones ────────────────────────────────────────
export const prediccionesApi = {
  mis: () => apiFetch<Prediccion[]>('/api/predicciones/mis'),

  guardar: (partidoId: string, predGolesLocal: number, predGolesVisitante: number) =>
    apiFetch<Prediccion>('/api/predicciones', {
      method: 'POST',
      body: JSON.stringify({ partidoId, predGolesLocal, predGolesVisitante }),
    }),
};

// ── Endpoints Leaderboard ─────────────────────────────────────────
export const leaderboardApi = {
  ranking: () =>
    apiFetch<{ leaderboard: LeaderboardEntry[]; miPosicion: number | null }>('/api/leaderboard'),
};
