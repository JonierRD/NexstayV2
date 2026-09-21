import { apiRequest } from './client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CHECK_IN' | 'CHECK_OUT' | 'STATUS_CHANGE';

export type AuditLog = {
  id: number;
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    role: 'ADMIN' | 'RECEPTION';
    email: string;
  };
};

export type AuditLogsResponse = {
  logs: AuditLog[];
  total: number;
};

export async function auditoriaRequest(filters?: {
  userId?: string;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.entity) params.append('entity', filters.entity);
  if (filters?.entityId) params.append('entityId', filters.entityId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  return apiRequest<AuditLogsResponse>(`/auditoria?${params.toString()}`);
}