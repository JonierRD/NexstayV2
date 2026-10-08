export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

export type LoginStatus = {
  kind: 'success' | 'error';
  message: string;
};

export type LoginRole = 'ADMIN' | 'RECEPTION' | 'CLEANING' | '';