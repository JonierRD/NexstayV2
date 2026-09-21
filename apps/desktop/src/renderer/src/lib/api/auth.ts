import { apiRequest } from './client';

export type PublicUser = {
  id: string;
  fullName: string;
  role: 'ADMIN' | 'RECEPTION';
  cc: string;
  email: string;
  phone: string | null | undefined;
};

export type AuthResult = {
  token: string;
  expiresIn: number;
  user: PublicUser;
};

export async function loginRequest(input: {
  identifier: string;
  password: string;
  role: 'ADMIN' | 'RECEPTION';
}): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    auth: false,
    body: input
  });
}

export async function registerRequest(input: {
  fullName: string;
  cc: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'ADMIN' | 'RECEPTION';
  adminPassword: string;
}): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    auth: false,
    body: input
  });
}

export async function forgotPasswordRequest(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email }
  });
}

export async function resetPasswordRequest(input: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: input
  });
}

export async function meRequest(): Promise<PublicUser> {
  return apiRequest<PublicUser>('/auth/me', { method: 'GET' });
}

export type FirstRunInfo = {
  pending: boolean;
  admin?: {
    fullName: string;
    email: string;
    cc: string;
    temporaryPassword: string;
  };
};

export async function firstRunRequest(): Promise<FirstRunInfo> {
  return apiRequest<FirstRunInfo>('/auth/first-run', { method: 'GET', auth: false });
}

export async function verifyAdminPasswordRequest(password: string): Promise<{ valid: boolean }> {
  return apiRequest<{ valid: boolean }>('/auth/verify-admin', { method: 'POST', body: { password } });
}