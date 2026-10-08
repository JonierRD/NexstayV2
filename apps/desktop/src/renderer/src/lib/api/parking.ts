import { apiRequest } from './client';

export type VehicleType = 'MOTO' | 'CARRO' | 'CAMIONETA' | 'CAMION_LIVIANO' | 'PESADO';









export type ParkingSessionStatus = 'EN_CURSO' | 'PENDIENTE_PAGO' | 'PAGADO' | 'EXONERADO';

export type ParkingRates = {
  id: number;
  motorcycleHourlyRate: number | string;
  carHourlyRate: number | string;
  updatedAt: string;
};

export type ParkingSession = {
  id: number;
  ownerName: string;
  ownerCc: string;
  licensePlate: string;
  phone: string;
  vehicleLine: string;
  vehicleType: VehicleType;
  entryAt: string;
  exitAt: string | null;
  hourlyRate: number | string;
  billedHours: number | null;
  totalPrice: number | string | null;
  status: ParkingSessionStatus;
  hostedAtEntry: boolean;
  isHosted: boolean;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ParkingSessionInput = {
  ownerName: string;
  ownerCc: string;
  licensePlate: string;
  phone: string;
  vehicleLine: string;
  vehicleType: VehicleType;
  notes?: string;
};

export type ParkingRatesInput = {
  motorcycleHourlyRate: number;
  carHourlyRate: number;
};

export async function parkingRequest(): Promise<ParkingSession[]> {
  return apiRequest<ParkingSession[]>('/parking', { method: 'GET' });
}

export async function parkingRatesRequest(): Promise<ParkingRates> {
  return apiRequest<ParkingRates>('/parking/rates', { method: 'GET' });
}

export async function updateParkingRatesRequest(input: ParkingRatesInput): Promise<ParkingRates> {
  return apiRequest<ParkingRates>('/parking/rates', { method: 'PUT', body: input });
}

export async function startParkingSessionRequest(input: ParkingSessionInput): Promise<ParkingSession> {
  return apiRequest<ParkingSession>('/parking', { method: 'POST', body: input });
}

export async function checkoutParkingSessionRequest(id: number): Promise<ParkingSession> {
  return apiRequest<ParkingSession>(`/parking/${id}/checkout`, { method: 'POST' });
}

export async function payParkingSessionRequest(id: number): Promise<ParkingSession> {
  return apiRequest<ParkingSession>(`/parking/${id}/pay`, { method: 'POST' });
}