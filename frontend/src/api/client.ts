import type {
  AuthResponse,
  EventItem,
  Registration,
  Stats,
  User,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'kampusevent.token';

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Permintaan gagal (HTTP ${response.status})`;
    throw new ApiError(response.status, message, (body as { details?: unknown })?.details);
  }

  return body as T;
}

export interface EventPayload {
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: string;
  capacity: number;
}

export const api = {
  register(name: string, email: string, password: string) {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async me(): Promise<User> {
    const response = await request<{ user: User }>('/api/auth/me');
    return response.user;
  },

  listEvents(params: { search?: string; category?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.category) query.set('category', params.category);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<{ events: EventItem[]; categories: string[] }>(`/api/events${suffix}`);
  },

  async getEvent(id: string): Promise<EventItem> {
    const response = await request<{ event: EventItem }>(`/api/events/${id}`);
    return response.event;
  },

  async createEvent(payload: EventPayload): Promise<EventItem> {
    const response = await request<{ event: EventItem }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.event;
  },

  async updateEvent(id: string, payload: EventPayload): Promise<EventItem> {
    const response = await request<{ event: EventItem }>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.event;
  },

  deleteEvent(id: string) {
    return request<void>(`/api/events/${id}`, { method: 'DELETE' });
  },

  async registerForEvent(id: string): Promise<Registration> {
    const response = await request<{ registration: Registration }>(
      `/api/events/${id}/registrations`,
      { method: 'POST' },
    );
    return response.registration;
  },

  async myRegistrations(): Promise<Registration[]> {
    const response = await request<{ registrations: Registration[] }>('/api/me/registrations');
    return response.registrations;
  },

  cancelRegistration(id: string) {
    return request<void>(`/api/registrations/${id}`, { method: 'DELETE' });
  },

  async eventParticipants(id: string): Promise<{ event: EventItem; participants: Registration[] }> {
    return request<{ event: EventItem; participants: Registration[] }>(
      `/api/events/${id}/participants`,
    );
  },

  async stats(): Promise<Stats> {
    const response = await request<{ stats: Stats }>('/api/stats');
    return response.stats;
  },
};
