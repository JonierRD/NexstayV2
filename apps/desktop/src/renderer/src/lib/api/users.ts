import { apiRequest } from './client';
import type { PublicUser } from './auth';

export type AdminUser = PublicUser;

export async function listUsersRequest(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>('/users', { method: 'GET' });
}

export async function createUserRequest(input: {
  fullName: string;
  cc: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'RECEPTION' | 'CLEANING';
  initialPassword: string;
  confirmPassword: string;
}): Promise<AdminUser> {
  return apiRequest<AdminUser>('/users', { method: 'POST', body: input });
}

export async function updateUserRequest(
  id: string,
  input: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: 'ADMIN' | 'RECEPTION' | 'CLEANING';
    isActive?: boolean;
  }
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/users/${id}`, { method: 'PATCH', body: input });
}

export async function deleteUserRequest(id: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/users/${id}`, { method: 'DELETE' });
}