import { Prisma, ReservationStatus, RoomStatus, StayStatus } from '@prisma/client';
import { dateOnlyToUtc, todayDateOnly } from './hotel-date';

/**
 * Regla de inventario: una reserva solo retiene la habitación el día en que
 * ocurre. Las reservas futuras quedan agendadas y no bloquean la habitación
 * para huéspedes actuales; la retención se aplica automáticamente cuando llega
 * la fecha de ingreso.
 */

type Db = Prisma.TransactionClient;

function todayUtc(): Date {
  return dateOnlyToUtc(todayDateOnly());
}

export async function hasReservationHoldToday(tx: Db, roomNumber: string): Promise<boolean> {
  const hold = await tx.reservation.findFirst({
    where: {
      roomNumber,
      status: ReservationStatus.CONFIRMADA,
      checkIn: { lte: todayUtc() },
      checkOut: { gt: todayUtc() }
    },
    select: { id: true }
  });
  return hold !== null;
}

export async function hasActiveStay(tx: Db, roomNumber: string): Promise<boolean> {
  const stay = await tx.stay.findFirst({
    where: { roomNumber, status: StayStatus.ACTIVA },
    select: { id: true }
  });
  return stay !== null;
}

/**
 * Deja la habitación en RESERVADA si hay una reserva confirmada que cubre hoy
 * y no hay un huésped dentro; en DISPONIBLE si no hay ninguna de las dos.
 * Nunca cambia OCUPADA ni MANTENIMIENTO (esas se resuelven al hacer check-out
 * o al terminar el mantenimiento).
 */
export async function syncRoomHold(tx: Db, roomNumber: string): Promise<void> {
  const room = await tx.room.findUnique({ where: { number: roomNumber }, select: { status: true } });
  if (!room || room.status === RoomStatus.OCUPADA || room.status === RoomStatus.MANTENIMIENTO) return;

  const [hold, activeStay] = await Promise.all([
    hasReservationHoldToday(tx, roomNumber),
    hasActiveStay(tx, roomNumber)
  ]);

  const next: RoomStatus | null = hold && !activeStay
    ? RoomStatus.RESERVADA
    : !hold && !activeStay && room.status === RoomStatus.RESERVADA
      ? RoomStatus.DISPONIBLE
      : null;
  if (next && next !== room.status) {
    await tx.room.update({ where: { number: roomNumber }, data: { status: next } });
  }
}

/**
 * Libera una habitación al terminar un hospedaje. Si hay una reserva para hoy
 * queda RESERVADA para el siguiente huésped; de lo contrario DISPONIBLE.
 */
export async function releaseRoomToAvailability(tx: Db, roomNumber: string): Promise<void> {
  const room = await tx.room.findUnique({ where: { number: roomNumber }, select: { status: true } });
  if (!room || room.status === RoomStatus.MANTENIMIENTO) return;
  const hold = await hasReservationHoldToday(tx, roomNumber);
  const next = hold ? RoomStatus.RESERVADA : RoomStatus.DISPONIBLE;
  if (next !== room.status) {
    await tx.room.update({ where: { number: roomNumber }, data: { status: next } });
  }
}

/**
 * Reconcilia todas las habitaciones de una sola vez. Se ejecuta al listar
 * habitaciones para que la retención de una reserva aparezca justo el día de
 * llegada, aunque la reserva se haya creado días antes.
 */
export async function reconcileRoomHolds(tx: Db): Promise<void> {
  const today = todayUtc();
  const [toHold, toRelease] = await Promise.all([
    tx.room.findMany({
      where: {
        status: RoomStatus.DISPONIBLE,
        stays: { none: { status: StayStatus.ACTIVA } },
        reservations: {
          some: {
            status: ReservationStatus.CONFIRMADA,
            checkIn: { lte: today },
            checkOut: { gt: today }
          }
        }
      },
      select: { number: true }
    }),
    tx.room.findMany({
      where: {
        status: RoomStatus.RESERVADA,
        stays: { none: { status: StayStatus.ACTIVA } },
        reservations: {
          none: {
            status: ReservationStatus.CONFIRMADA,
            checkIn: { lte: today },
            checkOut: { gt: today }
          }
        }
      },
      select: { number: true }
    })
  ]);

  if (toHold.length > 0) {
    await tx.room.updateMany({
      where: { number: { in: toHold.map((room) => room.number) }, status: RoomStatus.DISPONIBLE },
      data: { status: RoomStatus.RESERVADA }
    });
  }
  if (toRelease.length > 0) {
    await tx.room.updateMany({
      where: { number: { in: toRelease.map((room) => room.number) }, status: RoomStatus.RESERVADA },
      data: { status: RoomStatus.DISPONIBLE }
    });
  }
}
