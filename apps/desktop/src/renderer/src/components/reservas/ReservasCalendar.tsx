import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid,
  Info,
  Plus
} from 'lucide-react';
import { type ReactElement, useMemo, useState } from 'react';
import type { Habitacion } from '../../lib/api';
import type { Reservation } from '../../lib/api/reservations';
import { formatCOP } from '../../lib/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function isReservationIndefinite(reservation: Reservation): boolean {
  const cancelReason = reservation.cancellationReason ?? '';
  return reservation.isIndefinite === true || cancelReason.includes('[SALIDA INDEFINIDA]');
}

function coversDate(reservation: Reservation, date: string): boolean {
  return date >= normalizeDateStr(reservation.checkIn) && date < normalizeDateStr(reservation.checkOut);
}

interface ReservasCalendarProps {
  reservations: Reservation[];
  rooms: Habitacion[];
  onSelectReservation?: (reservation: Reservation) => void;
  onEditReservation?: (reservation: Reservation) => void;
  onCheckInReservation?: (reservation: Reservation) => void;
  onCancelReservation?: (reservation: Reservation) => void;
  onNewReservation?: (roomNumber?: string, date?: string) => void;
  canCheckIn: (checkInDate: string) => boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const ROOM_TYPE_LABELS: Record<string, string> = {
  ALL: 'Todos los tipos',
  SENCILLA: 'Sencilla',
  MATRIMONIAL: 'Matrimonial',
  DOSCAMAS: 'Dos camas'
};

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeDateStr(dateStr: string): string {
  return dateStr.slice(0, 10);
}

export function ReservasCalendar({
  reservations,
  rooms,
  onEditReservation,
  onCheckInReservation,
  onCancelReservation,
  onNewReservation,
  canCheckIn
}: ReservasCalendarProps): ReactElement {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedRoomType, setSelectedRoomType] = useState<'ALL' | 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS'>('ALL');
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'RACK'>('CALENDAR');
  const [selectedDayDetails, setSelectedDayDetails] = useState<string | null>(null);
  const [activeReservationModal, setActiveReservationModal] = useState<Reservation | null>(null);

  const todayStr = useMemo(() => toIsoDate(today), [today]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Rooms matching selected type
  const matchingRooms = useMemo(() => {
    if (selectedRoomType === 'ALL') return rooms;
    return rooms.filter((r) => r.type === selectedRoomType);
  }, [rooms, selectedRoomType]);

  const matchingRoomNumbers = useMemo(() => {
    return new Set(matchingRooms.map((r) => r.number));
  }, [matchingRooms]);

  // Active reservations matching room type
  const activeReservations = useMemo(() => {
    return reservations.filter(
      (r) => r.status !== 'CANCELADA' && matchingRoomNumbers.has(r.roomNumber)
    );
  }, [reservations, matchingRoomNumbers]);

  // Month days calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDaysInMonth = lastDay.getDate();

    // Monday is 0, Sunday is 6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      reservations: Reservation[];
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const dateStr = toIsoDate(prevDate);
      days.push({
        dateStr,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        reservations: activeReservations.filter((r) => {
          return coversDate(r, dateStr);
        })
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const thisDate = new Date(currentYear, currentMonth, day);
      const dateStr = toIsoDate(thisDate);
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        reservations: activeReservations.filter((r) => {
          return coversDate(r, dateStr);
        })
      });
    }

    // Next month padding to fill out complete weeks (35 or 42 cells)
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const dateStr = toIsoDate(nextDate);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        reservations: activeReservations.filter((r) => {
          return coversDate(r, dateStr);
        })
      });
    }

    return days;
  }, [currentYear, currentMonth, activeReservations, todayStr]);

  // Days in current month for the Rack view
  const daysInCurrentMonth = useMemo(() => {
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const list: { day: number; dateStr: string; dayName: string; isWeekend: boolean; isToday: boolean }[] = [];
    for (let d = 1; d <= lastDay; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dateStr = toIsoDate(dateObj);
      const dayOfWeek = dateObj.getDay();
      let dayIndex = dayOfWeek - 1;
      if (dayIndex === -1) dayIndex = 6;
      list.push({
        day: d,
        dateStr,
        dayName: WEEKDAY_NAMES[dayIndex],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday: dateStr === todayStr
      });
    }
    return list;
  }, [currentYear, currentMonth, todayStr]);

  // Reservations for the day details modal
  const dayDetailsReservations = useMemo(() => {
    if (!selectedDayDetails) return [];
    return activeReservations.filter((r) => {
      return coversDate(r, selectedDayDetails);
    });
  }, [activeReservations, selectedDayDetails]);

  const numRows = Math.ceil(calendarDays.length / 7);

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-2 overflow-hidden w-full max-w-6xl mx-auto">
      {/* Controls Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-sapay-300 bg-white px-3.5 py-2 shadow-xs">
        {/* Month Navigation */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            onClick={goToPreviousMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sapay-300 bg-white p-0 text-sapay-800 hover:bg-sapay-100"
            title="Mes anterior"
          >
            <ChevronLeft size={16} />
          </Button>

          <div className="min-w-[150px] text-center">
            <h2 className="text-sm font-bold text-sapay-950">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
          </div>

          <Button
            type="button"
            onClick={goToNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sapay-300 bg-white p-0 text-sapay-800 hover:bg-sapay-100"
            title="Mes siguiente"
          >
            <ChevronRight size={16} />
          </Button>

          <Button
            type="button"
            onClick={goToToday}
            className="h-8 rounded-lg border border-sapay-300 bg-sapay-50 px-2.5 text-xs font-semibold text-sapay-800 hover:bg-sapay-150"
          >
            Hoy
          </Button>
        </div>

        {/* Room Type Filter (Desplegable) and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Desplegable de Tipo de Habitación */}
          <div className="flex items-center gap-1.5 rounded-xl border border-sapay-300 bg-white px-3 py-1 text-xs shadow-2xs">
            <Filter size={13} className="text-sapay-600" />
            <span className="text-[11px] font-medium text-sapay-650">Tipo:</span>
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-sapay-950 outline-none cursor-pointer"
            >
              <option value="ALL">Todos los tipos ({rooms.length})</option>
              <option value="SENCILLA">Sencilla ({rooms.filter((r) => r.type === 'SENCILLA').length})</option>
              <option value="MATRIMONIAL">Matrimonial ({rooms.filter((r) => r.type === 'MATRIMONIAL').length})</option>
              <option value="DOSCAMAS">Dos camas ({rooms.filter((r) => r.type === 'DOSCAMAS').length})</option>
            </select>
          </div>

          {/* Tab Selector: Mes vs Rack */}
          <div className="flex rounded-xl bg-sapay-150 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('CALENDAR')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 transition ${
                activeTab === 'CALENDAR'
                  ? 'bg-sapay-950 text-white shadow-xs'
                  : 'text-sapay-800 hover:text-sapay-950'
              }`}
            >
              <CalendarIcon size={13} />
              <span>Mes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RACK')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 transition ${
                activeTab === 'RACK'
                  ? 'bg-sapay-950 text-white shadow-xs'
                  : 'text-sapay-800 hover:text-sapay-950'
              }`}
            >
              <Grid size={13} />
              <span>Rack / Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Calendar Month Grid with clearly marked box borders ("cuadros") */}
      {activeTab === 'CALENDAR' && (
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl border-2 border-sapay-300 bg-white shadow-xs">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 shrink-0 border-b-2 border-sapay-300 bg-sapay-150/90 text-center text-xs font-bold text-sapay-900 py-1.5 divide-x-2 divide-sapay-300">
            {WEEKDAY_NAMES.map((name, i) => (
              <div
                key={name}
                className={i >= 5 ? 'text-sapay-950 bg-sapay-200/50' : 'text-sapay-800'}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid - Evenly fills 100% of available height with clearly framed squares */}
          <div
            className="grid grid-cols-7 flex-1 min-h-0 divide-x-2 divide-y-2 divide-sapay-300 bg-sapay-100/20 overflow-hidden"
            style={{ gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))` }}
          >
            {calendarDays.map((cell) => {
              return (
                <div
                  key={cell.dateStr}
                  className={`group relative flex min-h-0 flex-col p-1.5 overflow-hidden transition ${
                    !cell.isCurrentMonth
                      ? 'bg-sapay-50/70 text-sapay-400'
                      : 'bg-white hover:bg-sapay-50/80'
                  } ${cell.isToday ? 'ring-2 ring-inset ring-sapay-700 bg-sapay-50/40' : ''}`}
                >
                  {/* Day Number Header */}
                  <div className="flex shrink-0 items-center justify-between">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        cell.isToday
                          ? 'bg-sapay-900 text-white shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-sapay-950'
                          : 'text-sapay-450'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.reservations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDayDetails(cell.dateStr)}
                        className="rounded bg-sapay-200 px-1 text-[8.5px] font-bold text-sapay-800 hover:bg-sapay-300"
                      >
                        {cell.reservations.length} res.
                      </button>
                    )}
                  </div>

                  {/* Reservations pills in cell */}
                  <div className="mt-0.5 flex flex-1 flex-col gap-0.5 overflow-hidden">
                    {cell.reservations.slice(0, 2).map((res) => {
                      const isCheckInDay = normalizeDateStr(res.checkIn) === cell.dateStr;
                      const isIndefinite = isReservationIndefinite(res);

                      return (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => setActiveReservationModal(res)}
                          title={`Hab. ${res.roomNumber} - ${res.client.firstName} ${res.client.lastName} (${
                            isIndefinite ? 'Salida indefinida' : `${res.nights} noches`
                          })`}
                          className={`flex items-center justify-between rounded px-1 py-0.5 text-left text-[9px] font-bold leading-tight shadow-2xs transition truncate ${
                            isIndefinite
                              ? 'border border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200'
                              : 'border border-emerald-300 bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
                          }`}
                        >
                          <span className="truncate">
                            <strong className="mr-0.5">H.{res.roomNumber}</strong>
                            {res.client.firstName}
                          </span>
                          {isCheckInDay ? (
                            <span className="ml-1 shrink-0 rounded bg-sapay-900 px-1 text-[7.5px] font-black text-white">
                              In
                            </span>
                          ) : isIndefinite ? (
                            <span className="ml-0.5 shrink-0 text-[7.5px] font-bold text-amber-900">
                              ∞
                            </span>
                          ) : null}
                        </button>
                      );
                    })}

                    {cell.reservations.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDayDetails(cell.dateStr)}
                        className="text-left text-[8.5px] font-bold text-sapay-700 hover:underline"
                      >
                        +{cell.reservations.length - 2} más...
                      </button>
                    )}
                  </div>

                  {/* Hover create reservation on this day */}
                  {cell.isCurrentMonth && onNewReservation && (
                    <button
                      type="button"
                      onClick={() => onNewReservation(undefined, cell.dateStr)}
                      title={`Crear reserva para el ${cell.dateStr}`}
                      className="absolute bottom-0.5 right-0.5 hidden h-4 w-4 items-center justify-center rounded bg-sapay-900 text-white shadow group-hover:flex hover:bg-sapay-800"
                    >
                      <Plus size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rack / Timeline View */}
      {activeTab === 'RACK' && (
        <div className="flex flex-1 min-h-0 flex-col overflow-x-auto overflow-y-auto rounded-2xl border border-sapay-200 bg-white shadow-xs">
          <div className="min-w-[950px]">
            {/* Days Header */}
            <div className="flex sticky top-0 z-30 border-b border-sapay-300 bg-sapay-100/90 text-[11px] font-bold text-sapay-850">
              <div className="sticky left-0 z-40 w-36 shrink-0 border-r border-sapay-300 bg-sapay-150 p-2 text-sapay-950 shadow-xs">
                Habitación
              </div>
              <div className="flex flex-1">
                {daysInCurrentMonth.map((d) => (
                  <div
                    key={d.day}
                    className={`flex flex-1 flex-col items-center justify-center border-r border-sapay-200 py-1 ${
                      d.isToday
                        ? 'bg-sapay-900 text-white font-extrabold'
                        : d.isWeekend
                        ? 'bg-sapay-200/60 text-sapay-900'
                        : 'text-sapay-800'
                    }`}
                  >
                    <span className="text-[8.5px] uppercase">{d.dayName}</span>
                    <span className="text-[11px] leading-tight">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Rows */}
            <div className="divide-y divide-sapay-200">
              {matchingRooms.map((room) => {
                return (
                  <div
                    key={room.number}
                    className="flex items-stretch hover:bg-sapay-50/50"
                  >
                    {/* Room Label Cell */}
                    <div className="sticky left-0 z-10 flex w-36 shrink-0 flex-col justify-center border-r border-sapay-300 bg-white px-2.5 py-1.5 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-sapay-900 text-[10px] font-bold text-white">
                          {room.number}
                        </span>
                        <span className="truncate text-xs font-bold text-sapay-950">
                          {room.type}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-sapay-600">
                        {room.hasAir ? 'Aire' : 'Ventilador'}
                      </span>
                    </div>

                    {/* Days Grid for this Room */}
                    <div className="flex flex-1 items-center">
                      {daysInCurrentMonth.map((d) => {
                        const res = activeReservations.find(
                          (r) =>
                            r.roomNumber === room.number &&
                            coversDate(r, d.dateStr)
                        );

                        const isCheckIn = res && normalizeDateStr(res.checkIn) === d.dateStr;
                        const isIndefinite = res ? isReservationIndefinite(res) : false;

                        return (
                          <div
                            key={d.day}
                            className={`relative flex h-9 flex-1 items-center justify-center border-r border-sapay-200 transition ${
                              d.isToday ? 'bg-sapay-100/50' : d.isWeekend ? 'bg-sapay-50/50' : ''
                            }`}
                          >
                            {res ? (
                              <button
                                type="button"
                                onClick={() => setActiveReservationModal(res)}
                                title={`Reserva #${res.id}: ${res.client.firstName} ${res.client.lastName} (${
                                  isIndefinite ? 'Salida indefinida' : `${res.nights} noches`
                                })`}
                                className={`mx-0.5 flex h-7 w-full items-center justify-between overflow-hidden rounded px-1 text-[9px] shadow-2xs hover:brightness-95 ${
                                  isIndefinite
                                    ? 'bg-amber-100 text-amber-950 border border-amber-400 font-bold'
                                    : 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold'
                                }`}
                              >
                                <span className="truncate">
                                  {isCheckIn && (
                                    <span className="mr-0.5 text-[7.5px] uppercase font-black">
                                      [In]{' '}
                                    </span>
                                  )}
                                  {res.client.firstName}
                                </span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onNewReservation &&
                                  onNewReservation(room.number, d.dateStr)
                                }
                                title={`Hab. ${room.number} libre el ${d.dateStr}`}
                                className="h-full w-full opacity-0 hover:opacity-100 hover:bg-emerald-50 flex items-center justify-center text-emerald-700"
                              >
                                <Plus size={10} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend - Compact */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-1 text-[10.5px] text-sapay-700">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-emerald-900">Verde: Salida definida</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="font-semibold text-amber-900">Amarillo: Salida indefinida (abierta)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sapay-900" />
            <span>Check-in (Llegada)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-sapay-600" />
            <span>Hoy</span>
          </div>
        </div>
        <p className="text-[10px] text-sapay-600">
          Clic en cualquier reserva para detalles, check-in o cancelación.
        </p>
      </div>

      {/* Day Details Modal */}
      {selectedDayDetails && (
        <Modal
          onClose={() => setSelectedDayDetails(null)}
          title={`Reservas para el ${selectedDayDetails}`}
          maxWidthClass="max-w-lg"
        >
          <div className="space-y-3">
            {dayDetailsReservations.length === 0 ? (
              <div className="rounded-xl bg-sapay-50 p-6 text-center text-xs text-sapay-650">
                No hay habitaciones reservadas para esta fecha.
              </div>
            ) : (
              <div className="space-y-2">
                {dayDetailsReservations.map((r) => {
                  const isIndefinite = isReservationIndefinite(r);
                  return (
                    <article
                      key={r.id}
                      className={`flex items-center justify-between rounded-xl border p-3 shadow-2xs ${
                        isIndefinite
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-emerald-300 bg-emerald-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sapay-900 text-xs font-bold text-white">
                            {r.roomNumber}
                          </span>
                          <strong className="text-xs text-sapay-950">
                            {r.client.firstName} {r.client.lastName}
                          </strong>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              isIndefinite
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {isIndefinite ? 'Salida indefinida' : `${r.nights} noches`}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-sapay-650">
                          CC {r.client.cc} · Ingreso: {normalizeDateStr(r.checkIn)}
                          {!isIndefinite && ` → Salida: ${normalizeDateStr(r.checkOut)}`}
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedDayDetails(null);
                          setActiveReservationModal(r);
                        }}
                        className="h-8 rounded-lg bg-sapay-900 px-3 text-[11px] text-white"
                      >
                        Ver detalles
                      </Button>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setSelectedDayDetails(null)}
                className="h-8 rounded-lg bg-sapay-900 px-4 text-xs text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reservation Quick Info Modal */}
      {activeReservationModal && (
        <Modal
          onClose={() => setActiveReservationModal(null)}
          title={`Detalle de Reserva #${activeReservationModal.id}`}
          maxWidthClass="max-w-lg"
        >
          <div className="space-y-4 text-xs text-sapay-900">
            {/* Header info */}
            <div className="flex items-center justify-between rounded-xl bg-sapay-50 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sapay-900 font-bold text-white shadow-xs text-sm">
                  {activeReservationModal.roomNumber}
                </span>
                <div>
                  <h3 className="font-bold text-sapay-950 text-sm">
                    {activeReservationModal.client.firstName}{' '}
                    {activeReservationModal.client.lastName}
                  </h3>
                  <p className="text-[11px] text-sapay-650">
                    CC {activeReservationModal.client.cc} · Tel:{' '}
                    {activeReservationModal.client.phone || 'No registrado'}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  isReservationIndefinite(activeReservationModal)
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {isReservationIndefinite(activeReservationModal)
                  ? 'Salida Indefinida'
                  : activeReservationModal.status}
              </span>
            </div>

            {/* Dates & Room */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-sapay-200 p-2.5">
                <span className="block text-[10px] text-sapay-600">Fecha de ingreso</span>
                <strong className="text-xs text-sapay-950">
                  {normalizeDateStr(activeReservationModal.checkIn)}
                </strong>
              </div>
              <div className="rounded-xl border border-sapay-200 p-2.5">
                <span className="block text-[10px] text-sapay-600">Fecha de salida</span>
                <strong className="text-xs text-sapay-950">
                  {isReservationIndefinite(activeReservationModal)
                    ? 'Indefinida / Abierta'
                    : normalizeDateStr(activeReservationModal.checkOut)}
                </strong>
              </div>
              <div className="rounded-xl border border-sapay-200 p-2.5">
                <span className="block text-[10px] text-sapay-600">Estadía</span>
                <strong className="text-xs text-sapay-950">
                  {isReservationIndefinite(activeReservationModal)
                    ? 'Abierta'
                    : `${activeReservationModal.nights} noches`}
                </strong>
              </div>
              <div className="rounded-xl border border-sapay-200 p-2.5">
                <span className="block text-[10px] text-sapay-600">Habitación</span>
                <strong className="text-xs text-sapay-950">
                  {activeReservationModal.roomNumber} ({activeReservationModal.room?.type || 'Hotel'})
                </strong>
              </div>
              <div className="rounded-xl border border-sapay-200 p-2.5">
                <span className="block text-[10px] text-sapay-600">Tarifa aplicada</span>
                <strong className="text-xs text-sapay-950">
                  {activeReservationModal.acTypeUsed === 'AIRE' ? 'Aire' : 'Ventilador'}
                </strong>
              </div>
              <div className="rounded-xl border border-sapay-200 p-2.5">
                <span className="block text-[10px] text-sapay-600">Valor anticipo / total</span>
                <strong className="text-xs text-emerald-800 font-bold">
                  {formatCOP(Number(activeReservationModal.total))}
                </strong>
              </div>
            </div>

            {/* Notes */}
            {activeReservationModal.client.notes && (
              <div className="rounded-xl bg-sapay-100/60 p-2.5 text-[11px] text-sapay-800">
                <strong>Notas: </strong>
                {activeReservationModal.client.notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-sapay-200">
              <Button
                type="button"
                onClick={() => setActiveReservationModal(null)}
                className="h-8 rounded-xl border border-sapay-350 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-100"
              >
                Cerrar
              </Button>

              {onEditReservation && (
                <Button
                  type="button"
                  onClick={() => {
                    const r = activeReservationModal;
                    setActiveReservationModal(null);
                    onEditReservation(r);
                  }}
                  className="h-8 rounded-xl border border-sapay-450 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-100"
                >
                  Editar
                </Button>
              )}

              {onCancelReservation && activeReservationModal.status === 'CONFIRMADA' && (
                <Button
                  type="button"
                  onClick={() => {
                    const r = activeReservationModal;
                    setActiveReservationModal(null);
                    onCancelReservation(r);
                  }}
                  className="h-8 rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs text-rose-900 hover:bg-rose-100"
                >
                  Cancelar
                </Button>
              )}

              {onCheckInReservation &&
                activeReservationModal.status === 'CONFIRMADA' &&
                canCheckIn(normalizeDateStr(activeReservationModal.checkIn)) && (
                  <Button
                    type="button"
                    onClick={() => {
                      const r = activeReservationModal;
                      setActiveReservationModal(null);
                      onCheckInReservation(r);
                    }}
                    className="h-8 rounded-xl bg-sapay-900 px-4 text-xs text-white hover:bg-sapay-950 font-bold"
                  >
                    Hacer Check-in
                  </Button>
                )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
