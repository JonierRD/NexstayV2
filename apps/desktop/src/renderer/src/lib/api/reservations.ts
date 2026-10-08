import { apiRequest } from './client';
import type { Cliente, CreateClienteInput } from './clientes';
import type { Habitacion } from './habitaciones';

export type ReservationStatus = 'CONFIRMADA' | 'CANCELADA' | 'CHECKED_IN' | 'NO_SHOW';
export type ReservationPayment = {
  id: number;
  type: 'PAGO' | 'DEVOLUCION';
  amount: number;
  method: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
};
export type Reservation = {
  id: number;
  clientId: number;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: number;
  total: number;
  acTypeUsed: 'AIRE' | 'VENTILADOR';
  status: ReservationStatus;
  cancellationReason: string | null;
  forceWaiver: boolean;
  client: Cliente;
  room: Habitacion;
  payments: ReservationPayment[];
  stay?: { id: number } | null;
};

export type CreateReservationInput = Omit<CreateClienteInput, 'adminPassword'> & {
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  acTypeUsed: 'AIRE' | 'VENTILADOR';
  paymentConfirmed: boolean;
  cancellationPolicyAccepted: boolean;
  paymentMethod: string;
  paymentReference?: string;
};

export type UpdateReservationInput = Partial<Omit<CreateReservationInput,
  'cc' | 'paymentConfirmed' | 'paymentMethod' | 'paymentReference'>> & {
  additionalPaymentConfirmed?: boolean;
  additionalPaymentAmount?: number;
  additionalPaymentMethod?: string;
  additionalPaymentReference?: string;
  refundConfirmed?: boolean;
  refundMethod?: string;
  refundReference?: string;
};

export async function reservationsRequest(): Promise<Reservation[]> {
  return apiRequest<Reservation[]>('/reservations', { method: 'GET' });
}

export async function reservationAvailabilityRequest(checkIn: string, checkOut: string, excludeReservationId?: number): Promise<{ unavailableRoomNumbers: string[] }> {
  const params = new URLSearchParams({ checkIn, checkOut });
  if (excludeReservationId !== undefined) params.set('excludeReservationId', String(excludeReservationId));
  return apiRequest(`/reservations/availability?${params.toString()}`, { method: 'GET' });
}

export async function createReservationRequest(input: CreateReservationInput): Promise<Reservation> {
  return apiRequest<Reservation>('/reservations', { method: 'POST', body: input });
}

export async function updateReservationRequest(id: number, input: UpdateReservationInput): Promise<Reservation> {
  return apiRequest<Reservation>(`/reservations/${id}`, { method: 'PATCH', body: input });
}

export async function cancelReservationRequest(id: number, input: {
  forceWaiver?: boolean; forceReason?: string; confirmationText?: string;
  refundConfirmed?: boolean; refundMethod?: string; refundReference?: string;
}): Promise<{ reservation: Reservation; penalty: number; refund: number; forceWaiver: boolean }> {
  return apiRequest(`/reservations/${id}/cancel`, { method: 'POST', body: input });
}

export async function checkinReservationRequest(id: number): Promise<{ id: number }> {
  return apiRequest<{ id: number }>(`/reservations/${id}/checkin`, { method: 'POST' });
}
