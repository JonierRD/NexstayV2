import { apiRequest } from './client';

export type TankWash = {
  id: number;
  clientName: string;
  roomNumber: string | null;
  tankType: 'RESERVA' | 'ELEVADO' | 'SUBTERRANEO' | 'OTRO';
  serviceDate: string;
  amount: number;
  status: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TankWashPayload = {
  clientName: string;
  roomNumber?: string;
  tankType: TankWash['tankType'];
  serviceDate?: string;
  amount: number;
  notes?: string;
  status?: TankWash['status'];
};

export async function tankWashListRequest(): Promise<TankWash[]> {
  return apiRequest<TankWash[]>('/tank-wash', { method: 'GET' });
}

export async function createTankWashRequest(data: TankWashPayload): Promise<TankWash> {
  return apiRequest<TankWash>('/tank-wash', { method: 'POST', body: data });
}

export async function updateTankWashRequest(id: number, data: Partial<TankWashPayload>): Promise<TankWash> {
  return apiRequest<TankWash>(`/tank-wash/${id}`, { method: 'PUT', body: data });
}

export async function advanceTankWashRequest(id: number): Promise<TankWash> {
  return apiRequest<TankWash>(`/tank-wash/${id}/advance`, { method: 'PATCH' });
}

export async function deleteTankWashRequest(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/tank-wash/${id}`, { method: 'DELETE' });
}
