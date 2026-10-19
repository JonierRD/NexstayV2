import { apiRequest } from './client';

export type FinanceMovement = {
  id: number;
  type: 'INGRESO' | 'GASTO';
  category: string;
  description: string;
  amount: number;
  movementDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSummary = {
  income: number;
  expense: number;
  balance: number;
};

export type FinancePayload = {
  type: FinanceMovement['type'];
  category: string;
  description: string;
  amount: number;
  date?: string;
  notes?: string;
};

export async function financeMovementsRequest(type?: FinanceMovement['type']): Promise<FinanceMovement[]> {
  const query = type ? `?type=${type}` : '';
  return apiRequest<FinanceMovement[]>(`/finance/movements${query}`, { method: 'GET' });
}

export async function financeSummaryRequest(): Promise<FinanceSummary> {
  return apiRequest<FinanceSummary>('/finance/summary', { method: 'GET' });
}

export async function createFinanceRequest(data: FinancePayload): Promise<FinanceMovement> {
  return apiRequest<FinanceMovement>('/finance/movements', { method: 'POST', body: data });
}

export async function updateFinanceRequest(id: number, data: Partial<FinancePayload>): Promise<FinanceMovement> {
  return apiRequest<FinanceMovement>(`/finance/movements/${id}`, { method: 'PUT', body: data });
}

export async function deleteFinanceRequest(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/finance/movements/${id}`, { method: 'DELETE' });
}
