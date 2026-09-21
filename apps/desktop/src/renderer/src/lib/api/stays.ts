import { apiRequest } from './client';
import { type Cliente } from './clientes';
import { type Habitacion } from './habitaciones';

// Stays (Hospedajes)
export type Stay = {
  id: number;
  clientId: number;
  roomNumber: string;
  checkIn: string;
  checkOut: string | null;
  nights: number;
  pricePerNight: number;
  total: number;
  acTypeUsed: 'AIRE' | 'VENTILADOR';
  status: 'ACTIVA' | 'FINALIZADA' | 'CANCELADA';
  createdAt: string;
  updatedAt: string;
  client?: Cliente;
  room?: Habitacion;
  sales?: any[];
};

export type CheckinInput = {
  cc: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  cityOrigin?: string;
  cityDestination?: string;
  profession?: string;
  notes?: string;
  roomNumber: string;
  acType: 'AIRE' | 'VENTILADOR';
  nights?: number;
  checkIn?: string;
  adminPassword?: string;
};

export type CheckoutInput = {
  adminPassword?: string;
};

export async function staysActiveRequest(): Promise<Stay[]> {
  return apiRequest<Stay[]>('/stays/active', { method: 'GET' });
}

export async function staysByRoomRequest(roomNumber: string): Promise<Stay[]> {
  return apiRequest<Stay[]>(`/stays/room/${encodeURIComponent(roomNumber)}`, { method: 'GET' });
}

export async function checkinRequest(input: CheckinInput): Promise<Stay> {
  return apiRequest<Stay>('/stays/checkin', { method: 'POST', body: input });
}

export async function checkoutRequest(id: number, input: CheckoutInput): Promise<Stay> {
  return apiRequest<Stay>(`/stays/${id}/checkout`, { method: 'POST', body: input });
}