const FALLBACK_API_URL = 'http://localhost:3333';
const TOKEN_STORAGE_KEY = 'sapay-token';

declare global {
  interface Window {
    sapay?: {
      getConfig: () => Promise<{ apiUrl: string }>;
    };
  }
}

let cachedApiUrl: string | null = null;

export async function resolveApiBaseUrl(): Promise<string> {
  if (cachedApiUrl) {
    return cachedApiUrl;
  }

  if (typeof window !== 'undefined' && window.sapay?.getConfig) {
    try {
      const cfg = await window.sapay.getConfig();
      cachedApiUrl = cfg.apiUrl;
      return cachedApiUrl;
    } catch {
      // fall through
    }
  }

  cachedApiUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ?? FALLBACK_API_URL;
  return cachedApiUrl;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'POST', body, auth = true, signal } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const baseUrl = await resolveApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload: unknown = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      isJson && typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message?: unknown }).message ?? 'Error en la solicitud.')
        : typeof payload === 'string' && payload.length
          ? payload
          : `Error ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}