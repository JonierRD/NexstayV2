import { type AuditAction } from '../../lib/api';

export const actionLabels: Record<AuditAction, string> = {
  CREATE: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
  LOGIN: 'Inició sesión',
  LOGOUT: 'Cerró sesión',
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  STATUS_CHANGE: 'Cambio de estado'
};

export const actionColors: Record<AuditAction, string> = {
  CREATE: 'bg-success-50 text-success border-success-100',
  UPDATE: 'bg-[#fff5df] text-gold border-[#f2dbab]',
  DELETE: 'bg-danger-50 text-danger border-danger-150',
  LOGIN: 'bg-success-50 text-success border-success-100',
  LOGOUT: 'bg-[#f5efe9] text-[#8f5e3d] border-[#dcc5b1]',
  CHECK_IN: 'bg-success-50 text-success border-success-100',
  CHECK_OUT: 'bg-[#f5efe9] text-[#8f5e3d] border-[#dcc5b1]',
  STATUS_CHANGE: 'bg-[#fff5df] text-gold border-[#f2dbab]'
};

export const actionOptions: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'CHECK_IN',
  'CHECK_OUT',
  'STATUS_CHANGE'
];

export function formatAuditDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}