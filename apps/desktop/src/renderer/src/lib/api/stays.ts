import { apiRequest } from './client';
import { type Cliente } from './clientes';
import { type Habitacion } from './habitaciones';
import { type Laundry } from './laundry';

// Stays (Hospedajes)
export type StaySaleLine = {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  saleType?: string;
  date: string;
  product?: { id: number; name: string; price: number } | null;
};

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
  reservationId?: number | null;
  reservation?: { id: number; total: number; payments?: Array<{ type: 'PAGO' | 'DEVOLUCION'; amount: number }> } | null;
  createdAt: string;
  updatedAt: string;
  client?: Cliente;
  room?: Habitacion;
  sales?: StaySaleLine[];
  laundry?: Laundry[];
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
};

export async function staysActiveRequest(): Promise<Stay[]> {
  return apiRequest<Stay[]>('/stays/active', { method: 'GET' });
}

export async function staysHistoryRequest(limit = 50): Promise<Stay[]> {
  return apiRequest<Stay[]>(`/stays/history?limit=${limit}`, { method: 'GET' });
}

export async function staysByRoomRequest(roomNumber: string): Promise<Stay[]> {
  return apiRequest<Stay[]>(`/stays/room/${encodeURIComponent(roomNumber)}`, { method: 'GET' });
}

export async function checkinRequest(input: CheckinInput): Promise<Stay> {
  return apiRequest<Stay>('/stays/checkin', { method: 'POST', body: input });
}

export async function checkoutRequest(id: number, input: {
  nights?: number; paymentConfirmed?: boolean; paymentMethod?: string; paymentReference?: string;
} = {}): Promise<Stay> {
  return apiRequest<Stay>(`/stays/${id}/checkout`, {
    method: 'POST',
    body: input
  });
}
