import {
  type ParkingRates,
  type ParkingSession,
  type ParkingSessionStatus,
  type VehicleType
} from '../../lib/api';
import { formatCOP, formatDateTime } from '../../lib/format';

export const vehicleTypes: VehicleType[] = ['MOTO', 'CARRO', 'CAMIONETA', 'CAMION_LIVIANO', 'PESADO'];

export const vehicleTypeLabels: Record<VehicleType, string> = {
  MOTO: 'Moto',
  CARRO: 'Carro',
  CAMIONETA: 'Camioneta',
  CAMION_LIVIANO: 'Camión liviano',
  PESADO: 'Vehículo pesado'
};

export const parkingStatusLabels: Record<ParkingSessionStatus, string> = {
  EN_CURSO: 'En parqueadero',
  PENDIENTE_PAGO: 'Pendiente de pago',
  PAGADO: 'Pagado',
  EXONERADO: 'Sin cobro · huésped'
};

export function formatParkingMoney(value: number | string | null): string {
  return formatCOP(Number(value) || 0);
}

export function formatParkingDateTime(value: string | null): string {
  return value ? formatDateTime(value) : '—';
}

export function hourlyRateForVehicle(rates: ParkingRates, vehicleType: VehicleType): number {
  return Number(vehicleType === 'MOTO' ? rates.motorcycleHourlyRate : rates.carHourlyRate) || 0;
}

export function billableHours(session: ParkingSession, now = Date.now()): number {
  if (session.status !== 'EN_CURSO') return session.billedHours ?? 0;
  const elapsedHours = Math.max(0, (now - new Date(session.entryAt).getTime()) / 3_600_000);
  return Math.max(1, Math.ceil(elapsedHours));
}

export function sessionTotal(session: ParkingSession, now = Date.now()): number {
  if (session.status === 'EXONERADO' || session.isHosted) return 0;
  if (session.totalPrice !== null) return Number(session.totalPrice) || 0;
  return billableHours(session, now) * (Number(session.hourlyRate) || 0);
}

export function sessionDuration(session: ParkingSession, now = Date.now()): string {
  const end = session.exitAt ? new Date(session.exitAt).getTime() : now;
  const elapsedMinutes = Math.max(0, Math.floor((end - new Date(session.entryAt).getTime()) / 60_000));
  const days = Math.floor(elapsedMinutes / 1440);
  const hours = Math.floor((elapsedMinutes % 1440) / 60);
  const minutes = elapsedMinutes % 60;
  return `${days ? `${days}d ` : ''}${hours}h ${minutes}m`;
}

export function isOpenSession(session: ParkingSession): boolean {
  return session.status === 'EN_CURSO';
}

export function statusTone(status: ParkingSessionStatus): string {
  if (status === 'PAGADO') return 'border-success-100 bg-success-50 text-success';
  if (status === 'EXONERADO') return 'border-sapay-300 bg-sapay-100 text-sapay-650';
  if (status === 'PENDIENTE_PAGO') return 'border-[#f2dbab] bg-[#fff5df] text-gold';
  return 'border-[#c6dcf0] bg-[#eaf1fb] text-[#2f6f9f]';
}
