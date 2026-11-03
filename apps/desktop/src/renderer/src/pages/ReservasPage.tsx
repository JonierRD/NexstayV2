import {
  CalendarDays,
  CalendarRange,
  Check,
  CircleAlert,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { type FormEvent, type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, clienteByCcRequest, habitacionesRequest, type Cliente, type Habitacion, type PublicUser } from '../lib/api';
import {
  cancelReservationRequest,
  checkinReservationRequest,
  createReservationRequest,
  deleteCancelledReservationRequest,
  reservationAvailabilityRequest,
  reservationsRequest,
  updateReservationRequest,
  type Reservation,
  type UpdateReservationInput
} from '../lib/api/reservations';
import { formatCOP } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ReservasHeader } from '../components/reservas/ReservasHeader';
import { ReservasCalendar, isReservationIndefinite } from '../components/reservas/ReservasCalendar';
import { useAuthSession } from '../context/AuthContext';

type ReservationForm = {
  cc: string;
  firstName: string;
  lastName: string;
  phone: string;
  cityOrigin: string;
  cityDestination: string;
  profession: string;
  notes: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  isIndefinite: boolean;
  acTypeUsed: 'AIRE' | 'VENTILADOR';
  paymentMethod: string;
  paymentReference: string;
  paymentConfirmed: boolean;
  cancellationPolicyAccepted: boolean;
};

const EMPTY_FORM: ReservationForm = {
  cc: '',
  firstName: '',
  lastName: '',
  phone: '',
  cityOrigin: '',
  cityDestination: '',
  profession: '',
  notes: '',
  roomNumber: '',
  checkIn: '',
  checkOut: '',
  isIndefinite: false,
  acTypeUsed: 'AIRE',
  paymentMethod: 'Efectivo',
  paymentReference: '',
  paymentConfirmed: false,
  cancellationPolicyAccepted: false
};

const inputClass =
  'mt-1 w-full rounded-xl border border-sapay-300 bg-white px-3 py-2 text-xs text-sapay-950 outline-none transition focus:border-sapay-650 focus:ring-1 focus:ring-sapay-650';
const labelClass = 'text-[11px] font-semibold text-sapay-750';

function dateValue(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}

function todayColombia(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
}

function canCheckIn(value: string): boolean {
  return value <= todayColombia();
}

export function ReservasPage({ user: propUser }: { user?: PublicUser }): ReactElement {
  const { user: sessionUser } = useAuthSession();
  const currentUser = propUser ?? sessionUser;
  const isAdmin = currentUser?.role === 'ADMIN';

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Habitacion[]>([]);
  const [form, setForm] = useState<ReservationForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [clientFound, setClientFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [showCancelled, setShowCancelled] = useState(false);
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR');
  const [unavailableRooms, setUnavailableRooms] = useState<string[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [settlementDraft, setSettlementDraft] = useState<{
    input: UpdateReservationInput;
    oldTotal: number;
    newTotal: number;
    delta: number;
    refundOptional: boolean;
    refundEnabled: boolean;
    refundAmount: number | '';
    method: string;
    reference: string;
    confirmed: boolean;
  } | null>(null);
  const [cancellationDraft, setCancellationDraft] = useState<{
    reservation: Reservation;
    refundEnabled: boolean;
    refundAmount: number | '';
    refundMethod: string;
    refundReference: string;
    refundConfirmed: boolean;
  } | null>(null);
  const [checkinTarget, setCheckinTarget] = useState<Reservation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reservationsData, roomsData] = await Promise.all([reservationsRequest(), habitacionesRequest()]);
      setReservations(reservationsData);
      setRooms(roomsData);
      setError('');
      return reservationsData;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las reservas.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!form.checkIn || !form.checkOut || nightsBetween(form.checkIn, form.checkOut) < 1) {
      setUnavailableRooms(null);
      setAvailabilityLoading(false);
      return;
    }
    let active = true;
    setUnavailableRooms(null);
    setAvailabilityLoading(true);
    void reservationAvailabilityRequest(form.checkIn, form.checkOut, editing?.id)
      .then((availability) => {
        if (active) setUnavailableRooms(availability.unavailableRoomNumbers);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo consultar la disponibilidad.');
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [editing?.id, form.checkIn, form.checkOut]);

  const selectedRoom = rooms.find((room) => room.number === form.roomNumber);
  const nights = nightsBetween(form.checkIn, form.checkOut);
  const nightlyPrice = selectedRoom
    ? Number(form.acTypeUsed === 'AIRE' ? selectedRoom.priceWithAir : selectedRoom.priceWithFan) || 0
    : 0;
  const total = Math.round(nightlyPrice * Math.max(0, nights));
  const requiredAdvance = Math.round(total / 2);
  const selectedRoomUnavailable =
    !!form.roomNumber &&
    ((unavailableRooms?.includes(form.roomNumber) ?? false) || selectedRoom?.status === 'MANTENIMIENTO');

  const filteredReservations = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reservations.filter(
      (reservation) =>
        (showCancelled || reservation.status !== 'CANCELADA') &&
        (!term ||
          `${reservation.client.firstName} ${reservation.client.lastName}`.toLowerCase().includes(term) ||
          reservation.client.cc.toLowerCase().includes(term) ||
          reservation.roomNumber.toLowerCase().includes(term))
    );
  }, [query, reservations, showCancelled]);

  const activeReservations = reservations.filter((reservation) => reservation.status !== 'CANCELADA').length;
  const arrivalsToday = reservations.filter(
    (reservation) => reservation.checkIn.slice(0, 10) === todayColombia() && reservation.status !== 'CANCELADA'
  ).length;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setClientFound(false);
    setFormOpen(false);
    setError('');
    setSettlementDraft(null);
  }

  function handleOpenNew(roomNumber?: string, checkInDate?: string) {
    resetForm();
    const start = checkInDate && checkInDate >= todayColombia() ? checkInDate : todayColombia();
    const nextDay = new Date(Date.parse(`${start}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    setForm((prev) => ({
      ...prev,
      roomNumber: roomNumber || '',
      checkIn: start,
      checkOut: nextDay,
      isIndefinite: false
    }));
    setFormOpen(true);
    setSuccess('');
  }

  async function findClient() {
    if (!form.cc.trim()) {
      setError('Ingresa la cédula para buscar al cliente.');
      return;
    }
    try {
      const client: Cliente = await clienteByCcRequest(form.cc.trim());
      setForm((current) => ({
        ...current,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone ?? '',
        cityOrigin: client.cityOrigin ?? '',
        cityDestination: client.cityDestination ?? '',
        profession: client.profession ?? '',
        notes: (client.notes ?? '').replace('[SALIDA INDEFINIDA]', '').trim()
      }));
      setClientFound(true);
      setError('');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 404) {
        setClientFound(false);
        setForm((current) => ({
          ...current,
          firstName: '',
          lastName: '',
          phone: '',
          cityOrigin: '',
          cityDestination: '',
          profession: '',
          notes: ''
        }));
        setError('No encontramos esa cédula. Completa los datos para registrar al cliente con la reserva.');
      } else {
        setError(reason instanceof Error ? reason.message : 'No se pudo buscar el cliente.');
      }
    }
  }

  function startEdit(reservation: Reservation) {
    const isIndef = isReservationIndefinite(reservation);
    setFormOpen(true);
    setEditing(reservation);
    setClientFound(true);
    setForm({
      cc: reservation.client.cc,
      firstName: reservation.client.firstName,
      lastName: reservation.client.lastName,
      phone: reservation.client.phone ?? '',
      cityOrigin: reservation.client.cityOrigin ?? '',
      cityDestination: reservation.client.cityDestination ?? '',
      profession: reservation.client.profession ?? '',
      notes: (reservation.client.notes ?? '').replace('[SALIDA INDEFINIDA]', '').trim(),
      roomNumber: reservation.roomNumber,
      checkIn: dateValue(reservation.checkIn),
      checkOut: dateValue(reservation.checkOut),
      isIndefinite: isIndef,
      acTypeUsed: reservation.acTypeUsed,
      paymentMethod: 'Efectivo',
      paymentReference: '',
      paymentConfirmed: true,
      cancellationPolicyAccepted: true
    });
    setError('');
    setSuccess('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (nights < 1) {
      setError('La fecha de salida debe ser posterior a la de ingreso.');
      return;
    }
    if (!selectedRoom || nightlyPrice <= 0) {
      setError('Selecciona una habitación y una tarifa válida.');
      return;
    }
    if (selectedRoomUnavailable) {
      setError('La habitación no está disponible durante todo el intervalo elegido.');
      return;
    }
    if (availabilityLoading) {
      setError('Espera a que termine la consulta de disponibilidad.');
      return;
    }
    setSaving(true);
    try {
      const finalNotes = form.notes.trim();

      if (!editing) {
        const created = await createReservationRequest({
          ...form,
          isIndefinite: form.isIndefinite,
          cc: form.cc.trim(),
          roomNumber: form.roomNumber,
          notes: finalNotes
        });
        setSuccess(`Reserva #${created.id} confirmada. Anticipo recibido: ${formatCOP(requiredAdvance)}.`);
      } else {
        const paid = editing.payments.reduce(
          (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)),
          0
        );
        const advanceChanged = total !== Number(editing.total) || form.isIndefinite !== editing.isIndefinite;
        const delta = advanceChanged ? requiredAdvance - paid : 0;
        const refundOptional = delta < 0;
        const change: UpdateReservationInput = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          cityOrigin: form.cityOrigin,
          cityDestination: form.cityDestination,
          profession: form.profession,
          notes: finalNotes,
          roomNumber: form.roomNumber,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          isIndefinite: form.isIndefinite,
          acTypeUsed: form.acTypeUsed
        };
        if (delta !== 0) {
          setSettlementDraft({
            input: change,
            oldTotal: Number(editing.total),
            newTotal: total,
            delta,
            refundOptional,
            refundEnabled: false,
            refundAmount: Math.abs(delta),
            method: '',
            reference: '',
            confirmed: false
          });
          return;
        }
        await updateReservationRequest(editing.id, change);
        setSuccess(`Reserva #${editing.id} actualizada.`);
      }
      resetForm();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la reserva.');
    } finally {
      setSaving(false);
    }
  }

  function openCancellation(reservation: Reservation) {
    const paid = reservation.payments.reduce(
      (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)),
      0
    );
    setCancellationDraft({
      reservation,
      refundEnabled: false,
      refundAmount: '',
      refundMethod: '',
      refundReference: '',
      refundConfirmed: false
    });
  }

  async function confirmSettlement() {
    if (!settlementDraft || !editing) return;
    const shouldProcessRefund = settlementDraft.delta < 0 &&
      (!settlementDraft.refundOptional || (settlementDraft.refundEnabled && Number(settlementDraft.refundAmount) > 0));
    if ((settlementDraft.delta > 0 || shouldProcessRefund) && !settlementDraft.confirmed) {
      setError('Confirma que el pago o la devolución ya fue procesado.');
      return;
    }
    if (settlementDraft.refundOptional && settlementDraft.refundEnabled && (!Number.isInteger(Number(settlementDraft.refundAmount)) || Number(settlementDraft.refundAmount) < 1 || Number(settlementDraft.refundAmount) > Math.abs(settlementDraft.delta))) {
      setError('El valor a devolver debe ser un monto entero dentro del excedente disponible.');
      return;
    }
    if ((settlementDraft.delta > 0 || (shouldProcessRefund && Number(settlementDraft.refundAmount) > 0)) && !settlementDraft.method.trim()) {
      setError('Selecciona el método del pago o de la devolución.');
      return;
    }
    const input: UpdateReservationInput =
      settlementDraft.delta > 0
        ? {
            ...settlementDraft.input,
            additionalPaymentConfirmed: true,
            additionalPaymentAmount: settlementDraft.delta,
            additionalPaymentMethod: settlementDraft.method.trim(),
            additionalPaymentReference: settlementDraft.reference.trim()
          }
        : shouldProcessRefund && Number(settlementDraft.refundAmount) > 0 ? {
            ...settlementDraft.input,
            refundConfirmed: true,
            refundAmount: Number(settlementDraft.refundAmount),
            refundMethod: settlementDraft.method.trim(),
            refundReference: settlementDraft.reference.trim()
          } : settlementDraft.input;
    setSaving(true);
    setError('');
    try {
      await updateReservationRequest(editing.id, input);
      setSettlementDraft(null);
      setSuccess(`Reserva #${editing.id} actualizada.`);
      resetForm();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el cambio.');
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancellation() {
    if (!cancellationDraft) return;
    const { reservation, refundEnabled, refundAmount, refundMethod, refundReference, refundConfirmed } =
      cancellationDraft;
    const paid = reservation.payments.reduce(
      (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)),
      0
    );
    const refund = refundEnabled ? Number(refundAmount) || 0 : 0;
    if (!Number.isInteger(refund) || refund < 0 || refund > paid) {
      setError('El valor a devolver debe ser un monto entero dentro del anticipo pagado.');
      return;
    }
    if (refund > 0 && !refundMethod.trim()) {
      setError('Indica el método usado para la devolución.');
      return;
    }
    if (refund > 0 && !refundConfirmed) {
      setError('Confirma que la devolución ya fue procesada.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await cancelReservationRequest(reservation.id, {
        refundAmount: refund,
        refundConfirmed,
        refundMethod: refundMethod.trim(),
        refundReference: refundReference.trim()
      });
      setCancellationDraft(null);
      await load();
      setSuccess(
        `Reserva cancelada. Valor no devuelto: ${formatCOP(result.penalty)}; devolución registrada: ${formatCOP(result.refund)}.`
      );
    } catch (reason) {
      const latest = await load();
      if (latest?.find((item) => item.id === reservation.id)?.status === 'CANCELADA') {
        setCancellationDraft(null);
        setSuccess('La reserva ya quedó cancelada.');
      } else {
        setError(reason instanceof Error ? reason.message : 'No se pudo cancelar la reserva.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmCheckin() {
    if (!checkinTarget) return;
    try {
      const stay = await checkinReservationRequest(checkinTarget.id);
      setSuccess(`Check-in completado. Se creó el hospedaje #${stay.id}.`);
      setCheckinTarget(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo completar el check-in.');
    }
  }

  async function confirmDeleteCancelled() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await deleteCancelledReservationRequest(deleteTarget.id);
      setSuccess(`Reserva cancelada #${deleteTarget.id} eliminada permanentemente.`);
      setDeleteTarget(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la reserva cancelada.');
    } finally {
      setDeleting(false);
    }
  }

  const cancellationPaid =
    cancellationDraft?.reservation.payments.reduce(
      (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)),
      0
    ) ?? 0;
  const cancellationNotReturned =
    cancellationDraft ? Math.max(0, cancellationPaid - (cancellationDraft.refundEnabled ? Number(cancellationDraft.refundAmount) || 0 : 0)) : 0;
  const cancellationRefund = cancellationDraft?.refundEnabled ? Number(cancellationDraft.refundAmount) || 0 : 0;
  const cancellationRefundPercent = cancellationPaid > 0
    ? (cancellationRefund / cancellationPaid) * 100
    : 0;

  return (
    <div className="module-page flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4">
      {/* Header with cama3.png and same design/color as Recepcion */}
      <ReservasHeader
        totalReservas={reservations.length}
        activas={activeReservations}
        llegadasHoy={arrivalsToday}
      />

      {/* Main Bar: Tabs and Top Action Buttons - Clean without heavy borders */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5">
        {/* Navigation Tabs - Borderless pill container */}
        <div className="flex items-center gap-1 rounded-2xl bg-sapay-200/70 p-1">
          <button
            type="button"
            onClick={() => setViewMode('CALENDAR')}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
              viewMode === 'CALENDAR'
                ? 'bg-sapay-950 text-white shadow-xs'
                : 'text-sapay-800 hover:text-sapay-950 hover:bg-white/60'
            }`}
          >
            <CalendarRange size={15} />
            <span>Calendario de Fechas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('LIST')}
            className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold transition ${
              viewMode === 'LIST'
                ? 'bg-sapay-950 text-white shadow-xs'
                : 'text-sapay-800 hover:text-sapay-950 hover:bg-white/60'
            }`}
          >
            <List size={15} />
            <span>Lista de Reservas ({filteredReservations.length})</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => void load()}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-sapay-300 bg-white px-3 text-xs font-semibold text-sapay-800 shadow-2xs hover:bg-sapay-100"
          >
            <RefreshCw size={13} />
            <span>Actualizar</span>
          </Button>
          <Button
            type="button"
            onClick={() => handleOpenNew()}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-sapay-900 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-sapay-950"
          >
            <Plus size={15} />
            <span>Nueva reserva</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div
          className={`flex shrink-0 items-center justify-between rounded-xl border p-2.5 text-xs shadow-2xs ${
            error
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{error || success}</span>
          <button
            type="button"
            onClick={() => {
              setError('');
              setSuccess('');
            }}
            className="text-sapay-600 hover:text-sapay-950"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'CALENDAR' ? (
        <ReservasCalendar
          reservations={reservations}
          rooms={rooms}
          canCheckIn={canCheckIn}
          onEditReservation={startEdit}
          onCheckInReservation={(res) => setCheckinTarget(res)}
          onCancelReservation={(res) => openCancellation(res)}
          onNewReservation={handleOpenNew}
        />
      ) : (
        <div className="flex flex-1 min-h-0 flex-col gap-2.5 overflow-hidden">
          {/* Search and Filters - Clearly marked search border */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-sapay-300 bg-white p-2.5 shadow-xs">
            <div className="flex min-w-[280px] flex-1 items-center gap-2.5 rounded-xl border-2 border-sapay-400 bg-white px-3 py-1.5 shadow-2xs transition focus-within:border-sapay-700">
              <Search size={15} className="text-sapay-600" />
              <input
                className="min-w-0 flex-1 bg-transparent text-xs text-sapay-950 font-medium outline-none placeholder:text-sapay-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por cliente, cédula o habitación..."
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-sapay-500 hover:text-sapay-900"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-sapay-800 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-sapay-300 text-sapay-900 focus:ring-sapay-600"
              />
              <span>
                Mostrar canceladas (
                {reservations.filter((item) => item.status === 'CANCELADA').length})
              </span>
            </label>
          </div>

          {/* Reservations Cards List - Scrollable within its container */}
          <section className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-sapay-200 bg-white shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-xs text-sapay-650">
                <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-sapay-600" />
                Cargando reservas...
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="p-12 text-center text-xs text-sapay-650">
                <CalendarDays size={28} className="mx-auto mb-2 text-sapay-400" />
                No se encontraron reservas con los criterios seleccionados.
              </div>
            ) : (
              <div className="divide-y divide-sapay-200">
                {filteredReservations.map((reservation) => {
                  const paid = reservation.payments.reduce(
                    (sum, payment) =>
                      sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)),
                    0
                  );
                  const late = Date.now() > new Date(reservation.checkIn).getTime() - 86_400_000;
                  const isCheckedIn = reservation.status === 'CHECKED_IN';
                  const isConfirmed = reservation.status === 'CONFIRMADA';
                  const isCancelled = reservation.status === 'CANCELADA';
                  const isIndef = isReservationIndefinite(reservation);

                  return (
                    <article
                      key={reservation.id}
                      className="flex flex-col gap-3 p-3.5 transition hover:bg-sapay-50/70 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-sapay-900 text-white shadow-2xs">
                          <span className="text-[9px] uppercase text-white/70">Hab</span>
                          <span className="text-sm font-extrabold leading-none">
                            {reservation.roomNumber}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm font-bold text-sapay-950">
                              #{reservation.id} · {reservation.client.firstName}{' '}
                              {reservation.client.lastName}
                            </strong>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                isConfirmed
                                  ? isIndef
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : isCancelled
                                  ? 'bg-slate-100 text-slate-600'
                                  : isCheckedIn
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-sapay-150 text-sapay-800'
                              }`}
                            >
                              {isCancelled
                                ? 'CANCELADA'
                                : isIndef
                                ? 'CONFIRMADA (INDEFINIDA)'
                                : reservation.status.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-sapay-700">
                            CC {reservation.client.cc} · Ingreso: {formatDateOnly(reservation.checkIn)}{' '}
                            →{' '}
                            {isIndef ? (
                              <strong className="text-amber-800 font-bold">Salida indefinida (abierta)</strong>
                            ) : (
                              <span>Salida: {formatDateOnly(reservation.checkOut)} ({reservation.nights} noches)</span>
                            )}{' '}
                            · {reservation.acTypeUsed === 'AIRE' ? 'Aire' : 'Ventilador'}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-sapay-650">
                            <span>
                              Total alojamiento:{' '}
                              <strong className="text-sapay-950">
                                {formatCOP(Number(reservation.total))}
                              </strong>
                            </span>
                            <span>
                              Pagado neto:{' '}
                              <strong className="text-emerald-700 font-bold">
                                {formatCOP(paid)}
                              </strong>
                            </span>
                            {reservation.client.phone && (
                              <span>Tel: {reservation.client.phone}</span>
                            )}
                          </div>

                          {reservation.cancellationReason && (
                            <p className="mt-1 text-[11px] text-rose-700">
                              Motivo cancelación: {reservation.cancellationReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 lg:self-center">
                        {isConfirmed && (
                          <>
                            <Button
                              type="button"
                              onClick={() => startEdit(reservation)}
                              className="h-8 rounded-lg border border-sapay-300 bg-white px-2.5 text-xs text-sapay-900 hover:bg-sapay-100"
                            >
                              <Pencil size={12} className="mr-1" />
                              Editar
                            </Button>
                            <Button
                              type="button"
                              disabled={!canCheckIn(dateValue(reservation.checkIn))}
                              onClick={() => setCheckinTarget(reservation)}
                              title={
                                canCheckIn(dateValue(reservation.checkIn))
                                  ? 'Hacer check-in'
                                  : `Disponible el ${formatDateOnly(reservation.checkIn)}`
                              }
                              className="h-8 rounded-lg bg-sapay-900 px-3 text-xs font-bold text-white shadow-2xs hover:bg-sapay-950 disabled:bg-sapay-200 disabled:text-sapay-600"
                            >
                              <Check size={12} className="mr-1" />
                              Check-in
                            </Button>
                            <Button
                              type="button"
                              onClick={() => openCancellation(reservation)}
                              className="h-8 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs text-rose-800 hover:bg-rose-100"
                            >
                              <X size={12} className="mr-1" />
                              Cancelar
                            </Button>
                            {!canCheckIn(dateValue(reservation.checkIn)) && (
                              <span className="text-[10px] text-sapay-600">
                                Check-in: {formatDateOnly(reservation.checkIn)}
                              </span>
                            )}
                            {late && (
                              <span
                                title="Dentro de las 24 horas previas"
                                className="flex items-center text-amber-700"
                              >
                                <CircleAlert size={13} />
                              </span>
                            )}
                          </>
                        )}

                        {/* Cancelled reservations actions: ADMIN can permanently delete, receptionist can only view */}
                        {isCancelled && isAdmin && (
                          <Button
                            type="button"
                            onClick={() => setDeleteTarget(reservation)}
                            className="h-8 rounded-lg border border-rose-300 bg-rose-50 px-2.5 text-xs font-semibold !text-rose-700 hover:bg-rose-100 hover:!text-rose-900"
                            title="Eliminar permanentemente reserva cancelada"
                          >
                            <Trash2 size={12} className="mr-1" />
                            Eliminar
                          </Button>
                        )}
                        {isCancelled && !isAdmin && (
                          <span className="text-[10px] text-slate-500 italic">Solo lectura</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Form Modal (Create or Edit) */}
      <Modal
        isOpen={formOpen}
        onClose={resetForm}
        title={editing ? `Editar reserva #${editing.id}` : 'Crear Nueva Reserva'}
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>
              Cédula *
              <div className="mt-1 flex gap-1">
                <input
                  className="w-full rounded-xl border border-sapay-300 px-3 py-2 text-xs outline-none focus:border-sapay-650"
                  value={form.cc}
                  disabled={!!editing}
                  onChange={(e) => setForm({ ...form, cc: e.target.value })}
                  placeholder="Ej: 1085234900"
                  required
                />
                <button
                  type="button"
                  disabled={!!editing}
                  onClick={() => void findClient()}
                  className="rounded-xl border border-sapay-300 bg-sapay-100 px-3 text-sapay-800 hover:bg-sapay-200"
                  title="Buscar cliente"
                >
                  <Search size={14} />
                </button>
              </div>
            </label>

            {([
              ['firstName', 'Nombre *', true],
              ['lastName', 'Apellido *', true],
              ['phone', 'Teléfono', false],
              ['cityOrigin', 'Ciudad de origen', false],
              ['cityDestination', 'Ciudad de destino', false],
              ['profession', 'Profesión', false]
            ] as const).map(([key, title, required]) => (
              <label key={key} className={labelClass}>
                {title}
                <input
                  className={inputClass}
                  value={form[key]}
                  required={required}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}

            <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>
              Notas del cliente
              <textarea
                className={inputClass}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Peticiones especiales, motivo de viaje, etc."
              />
            </label>

            {clientFound && (
              <p className="sm:col-span-2 lg:col-span-3 text-[11px] font-semibold text-emerald-700">
                Cliente encontrado en la base de datos.
              </p>
            )}

            <label className={labelClass}>
              Fecha de ingreso *
              <input
                className={inputClass}
                type="date"
                min={todayColombia()}
                value={form.checkIn}
                onChange={(e) => {
                  const newCheckIn = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    checkIn: newCheckIn,
                    ...(prev.isIndefinite
                      ? {
                          checkOut: new Date(Date.parse(`${newCheckIn}T00:00:00Z`) + 86_400_000)
                            .toISOString()
                            .slice(0, 10)
                        }
                      : prev.checkOut && prev.checkOut <= newCheckIn
                      ? { checkOut: '' }
                      : {})
                  }));
                }}
                required
              />
            </label>

            {/* Fecha de Salida: Opción de elegir fecha o marcar Indefinido */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5">
                <label className={labelClass}>Fecha de salida *</label>
                <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isIndefinite}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        isIndefinite: checked,
                        checkOut: checked
                          ? new Date(
                              Date.parse(`${prev.checkIn || todayColombia()}T00:00:00Z`) + 86_400_000
                            )
                              .toISOString()
                              .slice(0, 10)
                          : prev.checkOut
                      }));
                    }}
                    className="h-3.5 w-3.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  />
                  <span>Salida indefinida</span>
                </label>
              </div>

              {form.isIndefinite ? (
                <div className="mt-1 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 font-semibold">
                  <span>Fecha abierta / por definir</span>
                  <span className="text-[10px] bg-amber-200/90 px-2 py-0.5 rounded text-amber-950 font-bold">
                    1 noche garantía
                  </span>
                </div>
              ) : (
                <input
                  className={inputClass}
                  type="date"
                  min={
                    form.checkIn
                      ? new Date(Date.parse(`${form.checkIn}T00:00:00Z`) + 86_400_000)
                          .toISOString()
                          .slice(0, 10)
                      : undefined
                  }
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                  required
                />
              )}
            </div>

            <label className={labelClass}>
              Habitación *
              <select
                className={inputClass}
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                required
              >
                <option value="">Seleccionar habitación</option>
                {rooms
                  .filter((room) => room.status !== 'MANTENIMIENTO')
                  .map((room) => {
                    const unavailable = unavailableRooms?.includes(room.number) ?? false;
                    return (
                      <option key={room.number} value={room.number} disabled={unavailable}>
                        {room.number} · {room.type} ·{' '}
                        {unavailable
                          ? 'No disponible en estas fechas'
                          : room.status === 'RESERVADA'
                          ? 'Retenida para hoy'
                          : `estado actual ${room.status.toLowerCase()}`}
                      </option>
                    );
                  })}
              </select>
              {availabilityLoading && (
                <span className="mt-1 block text-[10px] text-sapay-650">
                  Consultando disponibilidad para estas fechas...
                </span>
              )}
            </label>

            <label className={labelClass}>
              Tarifa *
              <select
                className={inputClass}
                value={form.acTypeUsed}
                onChange={(e) =>
                  setForm({ ...form, acTypeUsed: e.target.value as 'AIRE' | 'VENTILADOR' })
                }
              >
                <option value="AIRE" disabled={!selectedRoom?.hasAir}>
                  Aire acondicionado
                </option>
                <option value="VENTILADOR" disabled={!selectedRoom?.hasFan}>
                  Ventilador
                </option>
              </select>
            </label>

            {!editing && (
              <label className={labelClass}>
                Método de pago del anticipo *
                <select
                  className={inputClass}
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                >
                  <option>Efectivo</option>
                  <option>Transferencia</option>
                  <option>Tarjeta</option>
                  <option>Otro</option>
                </select>
              </label>
            )}

            {!editing && (
              <label className={labelClass}>
                Referencia de pago
                <input
                  className={inputClass}
                  value={form.paymentReference}
                  onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                  placeholder="Número de comprobante o banco"
                />
              </label>
            )}
          </div>

          {/* Pricing summary */}
          <div className="grid gap-3 rounded-2xl border border-sapay-300 bg-sapay-50 p-3.5 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold text-sapay-650 uppercase">
                {form.isIndefinite ? 'Noches iniciales' : 'Noches de estadía'}
              </p>
              <p className="text-lg font-bold text-sapay-950">{Math.max(0, nights)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-sapay-650 uppercase">
                {form.isIndefinite ? 'Tarifa noche' : 'Total alojamiento'}
              </p>
              <p className="text-lg font-bold text-sapay-950">{formatCOP(total)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-sapay-650 uppercase">
                Anticipo requerido (50%)
              </p>
              <p className="text-lg font-extrabold text-emerald-800">{formatCOP(requiredAdvance)}</p>
            </div>
          </div>

          {form.isIndefinite && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
              <strong>Estad?a abierta:</strong> Se cobra como anticipo el 50% de una noche. La reserva indefinida se marca en amarillo solo el d?a de llegada.
            </p>
          )}

          {!editing && (
            <div className="space-y-2 rounded-xl bg-sapay-100/50 p-3 text-xs text-sapay-800">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.paymentConfirmed}
                  onChange={(e) => setForm({ ...form, paymentConfirmed: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-sapay-300 text-sapay-900"
                />
                <span>
                  Confirmo que recibí el anticipo de <strong>{formatCOP(requiredAdvance)}</strong>.
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cancellationPolicyAccepted}
                  onChange={(e) => setForm({ ...form, cancellationPolicyAccepted: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-sapay-300 text-sapay-900"
                />
                <span>
                  El cliente acepta que el valor de la devolucion, si aplica, se definira al momento de cancelar.
                </span>
              </label>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 font-medium">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-sapay-200">
            <Button
              type="button"
              onClick={resetForm}
              className="h-9 rounded-xl border border-sapay-300 bg-white px-4 text-xs font-semibold text-sapay-900 hover:bg-sapay-100"
            >
              Cerrar
            </Button>
            <Button
              disabled={saving || !total || selectedRoomUnavailable || availabilityLoading}
              className="h-9 rounded-xl bg-sapay-900 px-5 text-xs font-bold text-white shadow-sm hover:bg-sapay-950 disabled:bg-sapay-200 disabled:text-sapay-500"
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Confirmar reserva y anticipo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Difference Settlement Modal */}
      {settlementDraft && (
        <Modal
          onClose={() => !saving && setSettlementDraft(null)}
          title="Confirmar diferencia de la reserva"
          maxWidthClass="max-w-lg"
        >
          <div className="space-y-3 text-xs text-sapay-900">
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-sapay-50 p-3 text-center">
              <div>
                <p className="text-[10px] text-sapay-650">Valor anterior</p>
                <strong>{formatCOP(settlementDraft.oldTotal)}</strong>
              </div>
              <div>
                <p className="text-[10px] text-sapay-650">Nuevo valor</p>
                <strong>{formatCOP(settlementDraft.newTotal)}</strong>
              </div>
              <div>
                <p className="text-[10px] text-sapay-650">Cambio</p>
                <strong>
                  {settlementDraft.newTotal >= settlementDraft.oldTotal ? '+' : '−'}
                  {formatCOP(Math.abs(settlementDraft.newTotal - settlementDraft.oldTotal))}
                </strong>
              </div>
            </div>
            {!settlementDraft.refundOptional && (
              <p className="rounded-lg border border-sapay-200 p-3">
                Segun lo pagado, se debe cobrar <strong>{formatCOP(Math.abs(settlementDraft.delta))}</strong> para completar el anticipo.
              </p>
            )}
            {settlementDraft.refundOptional && (
              <>
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  El cambio deja un excedente pagado. Puedes devolver hasta{' '}
                  <strong>{formatCOP(Math.abs(settlementDraft.delta))}</strong> o conservarlo como saldo.
                </p>
                <label className="flex items-start gap-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={settlementDraft.refundEnabled}
                    onChange={(event) => setSettlementDraft({
                      ...settlementDraft, refundEnabled: event.target.checked, confirmed: false
                    })}
                  />
                  <span>Registrar una devolucion</span>
                </label>
                {settlementDraft.refundEnabled && (
                  <label className={labelClass}>
                    Valor a devolver *
                    <input
                      className={inputClass}
                      type="number"
                      min={1}
                      max={Math.abs(settlementDraft.delta)}
                      step={1}
                      value={settlementDraft.refundAmount}
                      onChange={(event) => setSettlementDraft({
                        ...settlementDraft, refundAmount: event.target.value === '' ? '' : Number(event.target.value), confirmed: false
                      })}
                    />
                    <span className="mt-1 block font-normal text-sapay-600">
                      Maximo disponible: {formatCOP(Math.abs(settlementDraft.delta))} ·{' '}
                      {Math.round(settlementDraft.newTotal / 2) - settlementDraft.delta > 0
                        ? `${((Number(settlementDraft.refundAmount) / (Math.round(settlementDraft.newTotal / 2) - settlementDraft.delta)) * 100).toFixed(1)}% del anticipo pagado`
                        : '0% del anticipo pagado'}
                    </span>
                  </label>
                )}
              </>
            )}
            {(!settlementDraft.refundOptional || settlementDraft.refundEnabled) && (
              <>
            <label className={labelClass}>
              Método *
              <select
                className={inputClass}
                value={settlementDraft.method}
                onChange={(event) =>
                  setSettlementDraft({ ...settlementDraft, method: event.target.value })
                }
              >
                <option value="">Seleccionar</option>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
                <option>Otro</option>
              </select>
            </label>
            <label className={labelClass}>
              Referencia
              <input
                className={inputClass}
                value={settlementDraft.reference}
                onChange={(event) =>
                  setSettlementDraft({ ...settlementDraft, reference: event.target.value })
                }
              />
            </label>
            <label className="flex items-start gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={settlementDraft.confirmed}
                onChange={(event) =>
                  setSettlementDraft({ ...settlementDraft, confirmed: event.target.checked })
                }
              />
              <span>
                Confirmo que {settlementDraft.delta > 0 ? 'recibí el pago' : 'procesé la devolución'} por{' '}
                {formatCOP(settlementDraft.delta > 0 ? settlementDraft.delta : settlementDraft.refundOptional ? Number(settlementDraft.refundAmount) || 0 : Math.abs(settlementDraft.delta))}.
              </span>
            </label>
              </>
            )}
            {error && (
              <p className="rounded-lg bg-rose-100 p-2 text-[11px] text-rose-800" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() => setSettlementDraft(null)}
                className="h-9 rounded-xl border border-sapay-450 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-100"
              >
                Volver
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void confirmSettlement()}
                className="h-9 rounded-xl bg-sapay-900 px-3 text-xs text-white"
              >
                {saving ? 'Guardando...' : 'Confirmar y guardar'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancellation Modal */}
      {cancellationDraft && (
        <Modal
          onClose={() => !saving && setCancellationDraft(null)}
          title="Cancelar reserva"
          maxWidthClass="max-w-lg"
        >
          <div className="space-y-3 text-xs text-sapay-900">
            <p>
              Reserva #{cancellationDraft.reservation.id} ·{' '}
              {cancellationDraft.reservation.client.firstName}{' '}
              {cancellationDraft.reservation.client.lastName} · habitación{' '}
              {cancellationDraft.reservation.roomNumber}
            </p>
            <div className="rounded-xl bg-sapay-50 p-3">
              <p>
                No devuelto: <strong>{formatCOP(cancellationNotReturned)}</strong>
              </p>
              <p>
                Devolución: <strong>{formatCOP(cancellationRefund)}</strong>
              </p>
            </div>
            <label className="flex items-start gap-2 rounded-lg border border-sapay-200 p-3 text-[11px]">
              <input
                type="checkbox"
                checked={cancellationDraft.refundEnabled}
                onChange={(event) => setCancellationDraft({
                  ...cancellationDraft, refundEnabled: event.target.checked, refundConfirmed: false
                })}
              />
              <span>Registrar devolución (opcional)</span>
            </label>
            {cancellationDraft.refundEnabled && (
              <label className={labelClass}>
                Valor a devolver
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={cancellationPaid}
                  step={1}
                  value={cancellationDraft.refundAmount}
                  onChange={(event) => setCancellationDraft({
                    ...cancellationDraft,
                    refundAmount: event.target.value === '' ? '' : Number(event.target.value),
                    refundConfirmed: false
                  })}
                />
                <span className="mt-1 block font-normal text-sapay-600">
                  De {formatCOP(cancellationPaid)} pagados · {cancellationRefundPercent.toFixed(1)}% devuelto
                </span>
              </label>
            )}
            {cancellationRefund > 0 && (
              <>
                <label className={labelClass}>
                  Método de devolución *
                  <select
                    className={inputClass}
                    value={cancellationDraft.refundMethod}
                    onChange={(event) =>
                      setCancellationDraft({ ...cancellationDraft, refundMethod: event.target.value })
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option>Efectivo</option>
                    <option>Transferencia</option>
                    <option>Tarjeta</option>
                    <option>Otro</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Referencia de devolución
                  <input
                    className={inputClass}
                    value={cancellationDraft.refundReference}
                    onChange={(event) =>
                      setCancellationDraft({
                        ...cancellationDraft,
                        refundReference: event.target.value
                      })
                    }
                  />
                </label>
                <label className="flex items-start gap-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={cancellationDraft.refundConfirmed}
                    onChange={(event) =>
                      setCancellationDraft({
                        ...cancellationDraft,
                        refundConfirmed: event.target.checked
                      })
                    }
                  />
                  <span>Confirmo que ya procesé la devolución indicada antes de cancelar.</span>
                </label>
              </>
            )}
            {error && (
              <p className="rounded-lg bg-rose-100 p-2 text-[11px] text-rose-800" role="alert">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() => setCancellationDraft(null)}
                className="h-9 rounded-xl border border-sapay-300 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-100"
              >
                Volver
              </Button>
              <Button
                type="button"
                disabled={
                  saving ||
                  (cancellationRefund > 0 &&
                    (!cancellationDraft.refundConfirmed || !cancellationDraft.refundMethod))
                }
                onClick={() => void confirmCancellation()}
                className="h-9 rounded-xl bg-rose-700 px-3 text-xs text-white hover:bg-rose-800"
              >
                {saving ? 'Procesando...' : cancellationRefund > 0 ? 'Confirmar devolucion y cancelar' : 'Cancelar reserva'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Checkin Target Modal */}
      {checkinTarget && (
        <Modal
          onClose={() => setCheckinTarget(null)}
          title="Confirmar check-in"
          maxWidthClass="max-w-md"
        >
          <div className="space-y-3 text-xs text-sapay-900">
            <p>
              Se creará el hospedaje de{' '}
              <strong>
                {checkinTarget.client.firstName} {checkinTarget.client.lastName}
              </strong>{' '}
              en la habitación <strong>{checkinTarget.roomNumber}</strong>.
            </p>
            <p>La habitación pasará a ocupada y la reserva quedará vinculada al hospedaje.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setCheckinTarget(null)}
                className="h-9 rounded-xl border border-sapay-300 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-100"
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={() => void confirmCheckin()}
                className="h-9 rounded-xl bg-sapay-900 px-3 text-xs text-white font-bold"
              >
                Confirmar check-in
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Cancelled Reservation Modal (Admin only) */}
      {deleteTarget && (
        <Modal
          onClose={() => !deleting && setDeleteTarget(null)}
          title="Eliminar reserva cancelada"
          maxWidthClass="max-w-md"
        >
          <div className="space-y-3 text-xs text-sapay-900">
            <p>
              ¿Estás seguro de eliminar permanentemente la reserva cancelada{' '}
              <strong>#{deleteTarget.id}</strong> de{' '}
              <strong>
                {deleteTarget.client.firstName} {deleteTarget.client.lastName}
              </strong>{' '}
              en la habitación <strong>{deleteTarget.roomNumber}</strong>?
            </p>
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-800 font-semibold">
              Esta acción borrará el registro de la base de datos y no se podrá deshacer.
            </p>
            {error && (
              <p className="rounded-lg bg-rose-100 p-2 text-[11px] text-rose-800">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="h-9 rounded-xl border border-sapay-300 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-100"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDeleteCancelled()}
                className="h-9 rounded-xl bg-rose-700 px-4 text-xs font-bold text-white hover:bg-rose-800 disabled:bg-rose-300"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
