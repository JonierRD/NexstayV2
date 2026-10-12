import { apiRequest } from './client';

export type ParkingVehicleType = {
  id: number;
  name: string;
  dailyRate: number;
  monthlyRate: number;
  isActive: boolean;
};

export type ParkingSession = {
  id: number;
  licensePlate: string;
  vehicleBrand: string;
  billingType: 'DIARIO' | 'MENSUAL';
  status: 'ACTIVO' | 'CERRADO';
  entryAt: string;
  exitAt: string | null;
  ownerName: string;
  phone: string;
  clientId: number | null;
  isGuest: boolean;
  stayId: number | null;
  rateApplied: number;
  amount: number;
  paid: boolean;
  notes: string | null;
  vehicleType: ParkingVehicleType;
  stay?: { client?: { firstName: string; lastName: string }; roomNumber: string } | null;
};

export async function parkingVehicleTypesRequest(): Promise<ParkingVehicleType[]> {
  return apiRequest('/parking/vehicle-types');
}

export async function createParkingVehicleTypeRequest(input: Omit<ParkingVehicleType, 'id'>): Promise<ParkingVehicleType> {
  return apiRequest('/parking/vehicle-types', { method: 'POST', body: input });
}

export async function updateParkingVehicleTypeRequest(id: number, input: Partial<Omit<ParkingVehicleType, 'id'>>): Promise<ParkingVehicleType> {
  return apiRequest(`/parking/vehicle-types/${id}`, { method: 'PATCH', body: input });
}

export async function deleteParkingVehicleTypeRequest(id: number): Promise<{ message: string }> {
  return apiRequest(`/parking/vehicle-types/${id}`, { method: 'DELETE' });
}

export async function parkingSessionsRequest(): Promise<ParkingSession[]> {
  return apiRequest('/parking/sessions');
}

export async function createParkingSessionRequest(input: {
  licensePlate: string; vehicleBrand: string; vehicleTypeId: number; billingType: 'DIARIO' | 'MENSUAL';
  phone: string; notes?: string;
  clientFirstName: string; clientLastName: string; clientCc: string;
}): Promise<ParkingSession> {
  return apiRequest('/parking/sessions', { method: 'POST', body: input });
}

export async function closeParkingSessionRequest(id: number): Promise<ParkingSession> {
  return apiRequest(`/parking/sessions/${id}/exit`, { method: 'POST' });
}

export async function deleteParkingSessionsRequest(ids: number[]): Promise<{ message: string }> {
  return apiRequest('/parking/sessions', { method: 'DELETE', body: { ids } });
}
