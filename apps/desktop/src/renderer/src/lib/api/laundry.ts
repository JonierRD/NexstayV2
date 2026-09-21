import { apiRequest } from './client';

export type Laundry = {
  id: number;
  item: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  deliveryDate: string | null;
  clientName: string;
  roomNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function laundryRequest(): Promise<Laundry[]> {
  return apiRequest<Laundry[]>('/laundry');
}

export async function createLaundryRequest(data: {
  item: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryDate?: string;
  clientName: string;
  roomNumber?: string;
  notes?: string;
}): Promise<Laundry> {
  return apiRequest<Laundry>('/laundry', {
    method: 'POST',
    body: data
  });
}

export async function updateLaundryRequest(id: number, data: {
  item?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  status?: string;
  deliveryDate?: string;
  clientName?: string;
  roomNumber?: string;
  notes?: string;
}): Promise<Laundry> {
  return apiRequest<Laundry>(`/laundry/${id}`, {
    method: 'PUT',
    body: data
  });
}

export async function deleteLaundryRequest(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/laundry/${id}`, {
    method: 'DELETE'
  });
}