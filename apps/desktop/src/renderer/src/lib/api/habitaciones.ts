import { apiRequest } from './client';

export type Habitacion = {
  number: string;
  type: 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS';
  hasAir: boolean;
  hasFan: boolean;
  priceWithAir: number | null;
  priceWithFan: number | null;
  status: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
  image: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function habitacionesRequest(): Promise<Habitacion[]> {
  return apiRequest<Habitacion[]>('/habitaciones', { method: 'GET' });
}

export type CreateHabitacionInput = {
  number: string;
  type: 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS';
  hasAir?: boolean;
  hasFan?: boolean;
  priceWithAir?: number;
  priceWithFan?: number;
  image?: string | null;
  notes?: string;
  adminPassword?: string;
};

export async function createHabitacionRequest(input: CreateHabitacionInput): Promise<Habitacion> {
  return apiRequest<Habitacion>('/habitaciones', { method: 'POST', body: input });
}

export type UpdateHabitacionInput = {
  type?: 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS';
  hasAir?: boolean;
  hasFan?: boolean;
  priceWithAir?: number;
  priceWithFan?: number;
  status?: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
  image?: string | null;
  notes?: string;
  adminPassword?: string;
};

export async function updateHabitacionRequest(number: string, input: UpdateHabitacionInput): Promise<Habitacion> {
  return apiRequest<Habitacion>(`/habitaciones/${encodeURIComponent(number)}`, { method: 'PATCH', body: input });
}

export async function deleteHabitacionRequest(number: string, adminPassword?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/habitaciones/${encodeURIComponent(number)}/delete`, {
    method: 'POST',
    body: { ...(adminPassword ? { adminPassword } : {}) }
  });
}