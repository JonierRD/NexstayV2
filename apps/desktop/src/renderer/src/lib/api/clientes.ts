import { apiRequest } from './client';
import { type Stay } from './stays';

// Clientes
export type Cliente = {
  id: number;
  firstName: string;
  lastName: string;
  cc: string;
  phone: string | null;
  cityOrigin: string | null;
  cityDestination: string | null;
  profession: string | null;
  notes: string | null;
  createdAt: string;
  stays?: Stay[];
};

export type CreateClienteInput = {
  firstName: string;
  lastName: string;
  cc: string;
  phone?: string;
  cityOrigin?: string;
  cityDestination?: string;
  profession?: string;
  notes?: string;
  adminPassword?: string;
};

export type UpdateClienteInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  cityOrigin?: string;
  cityDestination?: string;
  profession?: string;
  notes?: string;
  adminPassword?: string;
};

export async function clientesRequest(): Promise<Cliente[]> {
  return apiRequest<Cliente[]>('/clientes', { method: 'GET' });
}

export async function clienteByCcRequest(cc: string): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/cc/${encodeURIComponent(cc)}`, { method: 'GET' });
}

export async function createClienteRequest(input: CreateClienteInput): Promise<Cliente> {
  return apiRequest<Cliente>('/clientes', { method: 'POST', body: input });
}

export async function updateClienteRequest(id: number, input: UpdateClienteInput): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${id}`, { method: 'PUT', body: input });
}

export async function deleteClienteRequest(id: number, adminPassword?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/clientes/${id}`, {
    method: 'DELETE',
    body: { ...(adminPassword ? { adminPassword } : {}) }
  });
}