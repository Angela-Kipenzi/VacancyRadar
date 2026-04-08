export const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_STORAGE_KEY = 'vacancyradar_token';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export async function apiRequest<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const authToken = token ?? getAuthToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const rawText = await response.text();
  const data = rawText ? JSON.parse(rawText) : null;

  if (!response.ok) {
    const baseMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    const details = data?.details ? ` (${data.details})` : '';
    const message = `${baseMessage}${details}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}
