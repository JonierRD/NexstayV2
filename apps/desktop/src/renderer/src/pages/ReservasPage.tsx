import { CalendarDays, Check, CircleAlert, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react';
import { type FormEvent, type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, clienteByCcRequest, habitacionesRequest, type Cliente, type Habitacion } from '../lib/api';
import {
  cancelReservationRequest,
  checkinReservationRequest,
  createReservationRequest,
  reservationAvailabilityRequest,
  reservationsRequest,
  updateReservationRequest,
  type Reservation,
  type UpdateReservationInput
} from '../lib/api/reservations';
import { formatCOP } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

type ReservationForm = {
  cc: string; firstName: string; lastName: string; phone: string;
  cityOrigin: string; cityDestination: string; profession: string; notes: string;
  roomNumber: string; checkIn: string; checkOut: string; acTypeUsed: 'AIRE' | 'VENTILADOR';
  paymentMethod: string; paymentReference: string; paymentConfirmed: boolean;
  cancellationPolicyAccepted: boolean;
};

const EMPTY_FORM: ReservationForm = {
  cc: '', firstName: '', lastName: '', phone: '', cityOrigin: '', cityDestination: '',
  profession: '', notes: '', roomNumber: '', checkIn: '', checkOut: '', acTypeUsed: 'AIRE',
  paymentMethod: 'Efectivo', paymentReference: '', paymentConfirmed: false,
  cancellationPolicyAccepted: false
};
const inputClass = 'mt-1 w-full rounded-lg border border-sapay-350 bg-white px-3 py-2 text-xs text-sapay-950 outline-none focus:border-sapay-650';
const labelClass = 'text-[11px] font-medium text-sapay-750';

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
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
}
function isArrivalDay(value: string): boolean { return value === todayColombia(); }

export function ReservasPage(): ReactElement {
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
  const [unavailableRooms, setUnavailableRooms] = useState<string[] | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [settlementDraft, setSettlementDraft] = useState<{
    input: UpdateReservationInput; oldTotal: number; newTotal: number; delta: number;
    method: string; reference: string; confirmed: boolean;
  } | null>(null);
  const [cancellationDraft, setCancellationDraft] = useState<{
    reservation: Reservation; late: boolean; forceWaiver: boolean; forceReason: string;
    confirmationText: string; refundMethod: string; refundReference: string; refundConfirmed: boolean;
  } | null>(null);
  const [checkinTarget, setCheckinTarget] = useState<Reservation | null>(null);

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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

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
      .then((availability) => { if (active) setUnavailableRooms(availability.unavailableRoomNumbers); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'No se pudo consultar la disponibilidad.'); })
      .finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [editing?.id, form.checkIn, form.checkOut]);

  const selectedRoom = rooms.find((room) => room.number === form.roomNumber);
  const nights = nightsBetween(form.checkIn, form.checkOut);
  const nightlyPrice = selectedRoom
    ? Number(form.acTypeUsed === 'AIRE' ? selectedRoom.priceWithAir : selectedRoom.priceWithFan) || 0
    : 0;
  const total = Math.round(nightlyPrice * Math.max(0, nights));
  const selectedRoomUnavailable = !!form.roomNumber && (
    unavailableRooms?.includes(form.roomNumber) ??
    (selectedRoom?.status === 'MANTENIMIENTO' || selectedRoom?.status === 'RESERVADA')
  );

  const filteredReservations = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reservations.filter((reservation) => (showCancelled || reservation.status !== 'CANCELADA') && (!term ||
      `${reservation.client.firstName} ${reservation.client.lastName}`.toLowerCase().includes(term) ||
      reservation.client.cc.toLowerCase().includes(term) || reservation.roomNumber.toLowerCase().includes(term)));
  }, [query, reservations, showCancelled]);

  function resetForm() {
    setForm(EMPTY_FORM); setEditing(null); setClientFound(false); setFormOpen(false); setError(''); setSettlementDraft(null);
  }

  async function findClient() {
    if (!form.cc.trim()) { setError('Ingresa la cédula para buscar al cliente.'); return; }
    try {
      const client: Cliente = await clienteByCcRequest(form.cc.trim());
      setForm((current) => ({ ...current, firstName: client.firstName, lastName: client.lastName,
        phone: client.phone ?? '', cityOrigin: client.cityOrigin ?? '', cityDestination: client.cityDestination ?? '',
        profession: client.profession ?? '', notes: client.notes ?? '' }));
      setClientFound(true); setError('');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 404) {
        setClientFound(false);
        setForm((current) => ({ ...current, firstName: '', lastName: '', phone: '', cityOrigin: '', cityDestination: '', profession: '', notes: '' }));
        setError('No encontramos esa cédula. Completa los datos para registrar al cliente con la reserva.');
      } else setError(reason instanceof Error ? reason.message : 'No se pudo buscar el cliente.');
    }
  }

  function startEdit(reservation: Reservation) {
    setFormOpen(true);
    setEditing(reservation);
    setClientFound(true);
    setForm({
      cc: reservation.client.cc, firstName: reservation.client.firstName, lastName: reservation.client.lastName,
      phone: reservation.client.phone ?? '', cityOrigin: reservation.client.cityOrigin ?? '',
      cityDestination: reservation.client.cityDestination ?? '', profession: reservation.client.profession ?? '',
      notes: reservation.client.notes ?? '', roomNumber: reservation.roomNumber,
      checkIn: dateValue(reservation.checkIn), checkOut: dateValue(reservation.checkOut),
      acTypeUsed: reservation.acTypeUsed, paymentMethod: 'Efectivo', paymentReference: '',
      paymentConfirmed: true, cancellationPolicyAccepted: true
    });
    setError(''); setSuccess('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess('');
    if (nights < 1) { setError('La fecha de salida debe ser posterior a la de ingreso.'); return; }
    if (!selectedRoom || nightlyPrice <= 0) { setError('Selecciona una habitación y una tarifa válida.'); return; }
    if (selectedRoomUnavailable) { setError('La habitación no está disponible durante todo el intervalo elegido.'); return; }
    if (availabilityLoading) { setError('Espera a que termine la consulta de disponibilidad.'); return; }
    setSaving(true);
    try {
      if (!editing) {
        const created = await createReservationRequest({ ...form, cc: form.cc.trim(), roomNumber: form.roomNumber });
        setSuccess(`Reserva #${created.id} confirmada por ${formatCOP(Number(created.total))}.`);
      } else {
        const paid = editing.payments.reduce((sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)), 0);
        const delta = total - paid;
        const change: UpdateReservationInput = {
          firstName: form.firstName, lastName: form.lastName, phone: form.phone,
          cityOrigin: form.cityOrigin, cityDestination: form.cityDestination,
          profession: form.profession, notes: form.notes,
          roomNumber: form.roomNumber, checkIn: form.checkIn, checkOut: form.checkOut, acTypeUsed: form.acTypeUsed
        };
        if (delta !== 0) {
          setSettlementDraft({
            input: change, oldTotal: Number(editing.total), newTotal: total, delta,
            method: '', reference: '', confirmed: false
          });
          return;
        }
        await updateReservationRequest(editing.id, change);
        setSuccess(`Reserva #${editing.id} actualizada. Revisa el historial de pagos/devoluciones.`);
      }
      resetForm(); await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la reserva.');
    } finally { setSaving(false); }
  }

  function openCancellation(reservation: Reservation) {
    const late = Date.now() > new Date(reservation.checkIn).getTime() - 86_400_000;
    setCancellationDraft({
      reservation, late, forceWaiver: false, forceReason: '', confirmationText: '',
      refundMethod: '', refundReference: '', refundConfirmed: false
    });
  }

  async function confirmSettlement() {
    if (!settlementDraft || !editing) return;
    if (!settlementDraft.confirmed) { setError('Confirma que el pago o la devolución ya fue procesado.'); return; }
    if (!settlementDraft.method.trim()) { setError('Selecciona el método del pago o de la devolución.'); return; }
    const input: UpdateReservationInput = settlementDraft.delta > 0
      ? { ...settlementDraft.input, additionalPaymentConfirmed: true, additionalPaymentAmount: settlementDraft.delta, additionalPaymentMethod: settlementDraft.method.trim(), additionalPaymentReference: settlementDraft.reference.trim() }
      : { ...settlementDraft.input, refundConfirmed: true, refundMethod: settlementDraft.method.trim(), refundReference: settlementDraft.reference.trim() };
    setSaving(true); setError('');
    try {
      await updateReservationRequest(editing.id, input);
      setSettlementDraft(null);
      setSuccess(`Reserva #${editing.id} actualizada. Se registró ${settlementDraft.delta > 0 ? 'el pago adicional' : 'la devolución'}.`);
      resetForm(); await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el cambio de la reserva.');
    } finally { setSaving(false); }
  }

  async function confirmCancellation() {
    if (!cancellationDraft) return;
    const { reservation, late, forceWaiver, forceReason, confirmationText, refundMethod, refundReference, refundConfirmed } = cancellationDraft;
    if (forceWaiver && !forceReason.trim()) { setError('La exoneración necesita un motivo.'); return; }
    if (forceWaiver && confirmationText !== 'EXONERAR PENALIDAD') { setError('Escribe exactamente EXONERAR PENALIDAD para autorizar la excepción.'); return; }
    const paid = reservation.payments.reduce((sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)), 0);
    const penalty = late && !forceWaiver ? Math.round(Number(reservation.total) * 0.2) : 0;
    const refund = Math.max(0, paid - penalty);
    if (refund > 0 && !refundMethod.trim()) { setError('Indica el método usado para la devolución.'); return; }
    if (refund > 0 && !refundConfirmed) { setError('Confirma que la devolución ya fue procesada.'); return; }
    setSaving(true); setError('');
    try {
      const result = await cancelReservationRequest(reservation.id, {
        ...(forceWaiver && { forceWaiver, forceReason: forceReason.trim(), confirmationText }),
        refundConfirmed, refundMethod: refundMethod.trim(), refundReference: refundReference.trim()
      });
      setCancellationDraft(null);
      await load();
      setSuccess(`Reserva cancelada. Penalidad: ${formatCOP(result.penalty)}; devolución registrada: ${formatCOP(result.refund)}.`);
    } catch (reason) {
      const latest = await load();
      if (latest?.find((item) => item.id === reservation.id)?.status === 'CANCELADA') {
        setCancellationDraft(null);
        setSuccess('La reserva ya quedó cancelada; actualicé la lista con su estado confirmado.');
      } else {
        setError(reason instanceof Error ? reason.message : 'No se pudo cancelar la reserva. Actualicé la lista para reflejar su estado real.');
      }
    } finally { setSaving(false); }
  }

  async function confirmCheckin() {
    if (!checkinTarget) return;
    try {
      const stay = await checkinReservationRequest(checkinTarget.id);
      setSuccess(`Check-in completado. Se creó el hospedaje #${stay.id}.`);
      setCheckinTarget(null);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo completar el check-in.'); }
  }

  const cancellationPaid = cancellationDraft?.reservation.payments.reduce(
    (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)), 0
  ) ?? 0;
  const cancellationPenalty = cancellationDraft?.late && !cancellationDraft.forceWaiver
    ? Math.round(Number(cancellationDraft.reservation.total) * 0.2) : 0;
  const cancellationRefund = cancellationDraft ? Math.max(0, cancellationPaid - cancellationPenalty) : 0;

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-sm font-semibold text-sapay-950">Reservas</h1><p className="text-[10px] text-sapay-750">Confirma llegadas, anticipos y disponibilidad por fechas.</p></div>
        <div className="flex gap-2">
          <Button onClick={() => void load()} className="h-9 rounded-lg border border-sapay-350 bg-white px-3 text-xs text-sapay-900"><RefreshCw size={13} /> Actualizar</Button>
          <Button onClick={() => { resetForm(); setFormOpen(true); setSuccess(''); }} className="h-9 rounded-lg bg-sapay-900 px-3 text-xs text-white"><Plus size={14} /> Nueva reserva</Button>
        </div>
      </div>

      {(error || success) && <div className={`rounded-lg border px-3 py-2 text-xs ${error ? 'border-danger-200 bg-danger-100 text-[#a23b3b]' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || success}</div>}

      {formOpen && (
        <form onSubmit={(event) => void submit(event)} className="rounded-2xl border border-sapay-350 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-bold text-sapay-950">{editing ? `Editar reserva #${editing.id}` : 'Crear reserva'}</h2><button type="button" onClick={resetForm} aria-label="Cerrar formulario"><X size={16} /></button></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={labelClass}>Cédula *<div className="mt-1 flex gap-1"><input className="w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs" value={form.cc} disabled={!!editing} onChange={(e) => setForm({ ...form, cc: e.target.value })} required /><button type="button" disabled={!!editing} onClick={() => void findClient()} className="rounded-lg border border-sapay-350 px-2" title="Buscar cliente"><Search size={13} /></button></div></label>
            {([
              ['firstName', 'Nombre *', true], ['lastName', 'Apellido *', true], ['phone', 'Teléfono', false],
              ['cityOrigin', 'Ciudad de origen', false], ['cityDestination', 'Ciudad de destino', false], ['profession', 'Profesión', false]
            ] as const).map(([key, title, required]) => <label key={key} className={labelClass}>{title}<input className={inputClass} value={form[key]} required={required} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
            <label className={`${labelClass} sm:col-span-2`}>Notas del cliente<textarea className={inputClass} rows={1} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            {clientFound && <p className="self-end text-[10px] text-emerald-700">Cliente encontrado. Se actualizarán sus datos con lo confirmado en este formulario.</p>}
            <label className={labelClass}>Ingreso *<input className={inputClass} type="date" min={todayColombia()} value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value, ...(form.checkOut && form.checkOut <= e.target.value ? { checkOut: '' } : {}) })} required /></label>
            <label className={labelClass}>Salida *<input className={inputClass} type="date" min={form.checkIn ? new Date(Date.parse(`${form.checkIn}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10) : undefined} value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} required /></label>
            <label className={labelClass}>Habitación *<select className={inputClass} value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required><option value="">Seleccionar</option>{rooms.filter((room) => room.status !== 'MANTENIMIENTO' && room.status !== 'RESERVADA').map((room) => {
              const unavailable = unavailableRooms?.includes(room.number) ?? false;
              return <option key={room.number} value={room.number} disabled={unavailable}>{room.number} · {room.type} · {unavailable ? 'No disponible en estas fechas' : `estado actual ${room.status.toLowerCase()}`}</option>;
            })}</select>{availabilityLoading && <span className="mt-1 block text-[10px] text-sapay-650">Consultando habitaciones para estas fechas…</span>}{!availabilityLoading && unavailableRooms && <span className="mt-1 block text-[10px] text-sapay-650">Las habitaciones ocupadas o reservadas en este intervalo aparecen deshabilitadas.</span>}</label>
            <label className={labelClass}>Tarifa *<select className={inputClass} value={form.acTypeUsed} onChange={(e) => setForm({ ...form, acTypeUsed: e.target.value as 'AIRE' | 'VENTILADOR' })}><option value="AIRE" disabled={!selectedRoom?.hasAir}>Aire acondicionado</option><option value="VENTILADOR" disabled={!selectedRoom?.hasFan}>Ventilador</option></select></label>
            {!editing && <label className={labelClass}>Método del pago completo *<select className={inputClass} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>}
            {!editing && <label className={labelClass}>Referencia de pago<input className={inputClass} value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} /></label>}
          </div>

          <div className="mt-4 grid gap-3 rounded-xl bg-sapay-50 p-3 sm:grid-cols-3">
            <div><p className="text-[10px] text-sapay-650">Noches</p><p className="text-sm font-bold">{Math.max(0, nights)}</p></div>
            <div><p className="text-[10px] text-sapay-650">Total del alojamiento</p><p className="text-sm font-bold">{formatCOP(total)}</p></div>
            <div><p className="text-[10px] text-sapay-650">Pago requerido para confirmar</p><p className="text-sm font-bold">{formatCOP(total)}</p></div>
          </div>

          {!editing && <div className="mt-3 space-y-2 text-[11px]">
            <label className="flex items-start gap-2"><input type="checkbox" checked={form.paymentConfirmed} onChange={(e) => setForm({ ...form, paymentConfirmed: e.target.checked })} /><span>Confirmo que recibí el pago completo de <strong>{formatCOP(total)}</strong>.</span></label>
            <label className="flex items-start gap-2"><input type="checkbox" checked={form.cancellationPolicyAccepted} onChange={(e) => setForm({ ...form, cancellationPolicyAccepted: e.target.checked })} /><span>El cliente acepta: devolución completa al cancelar con más de 24 horas antes del check-in; dentro de las 24 horas se retiene el 20% del alojamiento y se devuelve el 80%. Una excepción puede exonerar la penalidad y quedará registrada.</span></label>
          </div>}
          {editing && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[10px] text-amber-900">El sistema calculará la diferencia. Un aumento requiere registrar el pago adicional; una disminución requiere confirmar que se procesó la devolución antes de guardar.</p>}
          <div className="mt-4 flex justify-end gap-2"><Button type="button" onClick={resetForm} className="h-9 border border-sapay-450 bg-white px-3 text-xs !text-sapay-900 hover:bg-sapay-100">Cerrar</Button><Button disabled={saving || !total || selectedRoomUnavailable || availabilityLoading} className="h-9 bg-sapay-900 px-4 text-xs !text-white">{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Confirmar reserva y pago'}</Button></div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sapay-350 bg-white px-3 py-2"><Search size={14} className="text-sapay-600" /><input className="min-w-40 flex-1 text-xs outline-none" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por cliente, cédula o habitación" /><label className="flex items-center gap-1.5 text-[10px] text-sapay-800"><input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />Mostrar canceladas ({reservations.filter((item) => item.status === 'CANCELADA').length})</label></div>

      <section className="min-h-0 flex-1 overflow-auto rounded-2xl border border-sapay-350 bg-white">
        {loading ? <p className="p-8 text-center text-xs text-sapay-650">Cargando reservas…</p> : filteredReservations.length === 0 ? <div className="p-10 text-center text-xs text-sapay-650"><CalendarDays size={18} className="mx-auto mb-2" />No hay reservas registradas.</div> :
          <div className="divide-y divide-sapay-200">{filteredReservations.map((reservation) => {
            const paid = reservation.payments.reduce((sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)), 0);
            const late = Date.now() > new Date(reservation.checkIn).getTime() - 86_400_000;
            return <article key={reservation.id} className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-sapay-950">#{reservation.id} · {reservation.client.firstName} {reservation.client.lastName}</strong><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${reservation.status === 'CONFIRMADA' ? 'bg-emerald-100 text-emerald-800' : reservation.status === 'CANCELADA' ? 'bg-slate-100 text-slate-600' : 'bg-sapay-150 text-sapay-800'}`}>{reservation.status.replace('_', ' ')}</span>{reservation.forceWaiver && <span className="text-[9px] text-amber-800">Exoneración forzada</span>}</div>
                <p className="mt-1 text-[10px] text-sapay-650">CC {reservation.client.cc} · Hab. {reservation.roomNumber} · {formatDateOnly(reservation.checkIn)} → {formatDateOnly(reservation.checkOut)} · {reservation.nights} noches</p>
                <p className="mt-1 text-[10px] text-sapay-750">Total {formatCOP(Number(reservation.total))} · Pagado neto {formatCOP(paid)} · {reservation.acTypeUsed === 'AIRE' ? 'Aire' : 'Ventilador'}</p>
                {reservation.cancellationReason && <p className="mt-1 text-[10px] text-sapay-650">Motivo/condición: {reservation.cancellationReason}</p>}
              </div>
              {reservation.status === 'CONFIRMADA' && <div className="flex flex-wrap gap-1.5">
                <Button onClick={() => startEdit(reservation)} className="h-8 border border-sapay-450 bg-white px-2.5 text-[10px] !text-sapay-900 hover:bg-sapay-100"><Pencil size={12} /> Editar</Button>
                <Button disabled={!isArrivalDay(dateValue(reservation.checkIn))} onClick={() => setCheckinTarget(reservation)} title={isArrivalDay(dateValue(reservation.checkIn)) ? 'Hacer check-in hoy' : `Disponible el ${formatDateOnly(reservation.checkIn)}`} className="h-8 bg-sapay-900 px-2.5 text-[10px] !text-white disabled:bg-sapay-200 disabled:!text-sapay-700"><Check size={12} /> Check-in</Button>
                <Button onClick={() => openCancellation(reservation)} className="h-8 border border-rose-300 bg-rose-50 px-2.5 text-[10px] !text-rose-900 hover:bg-rose-100"><X size={12} /> Cancelar</Button>
                {!isArrivalDay(dateValue(reservation.checkIn)) && <span className="flex items-center text-[10px] text-sapay-700">Disponible el {formatDateOnly(reservation.checkIn)}</span>}
                {late && <span title="La cancelación está dentro de las 24 horas previas" className="flex items-center text-amber-700"><CircleAlert size={13} /></span>}
              </div>}
            </article>;
          })}</div>}
      </section>

      {settlementDraft && <Modal onClose={() => !saving && setSettlementDraft(null)} title="Confirmar diferencia de la reserva" maxWidthClass="max-w-lg">
        <div className="space-y-3 text-xs text-sapay-900">
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-sapay-50 p-3 text-center">
            <div><p className="text-[10px] text-sapay-650">Valor anterior</p><strong>{formatCOP(settlementDraft.oldTotal)}</strong></div>
            <div><p className="text-[10px] text-sapay-650">Nuevo valor</p><strong>{formatCOP(settlementDraft.newTotal)}</strong></div>
            <div><p className="text-[10px] text-sapay-650">Cambio</p><strong>{settlementDraft.newTotal >= settlementDraft.oldTotal ? '+' : '−'}{formatCOP(Math.abs(settlementDraft.newTotal - settlementDraft.oldTotal))}</strong></div>
          </div>
          <p className="rounded-lg border border-sapay-200 p-3">Según lo pagado hasta ahora, se debe {settlementDraft.delta > 0 ? 'cobrar' : 'devolver'} <strong>{formatCOP(Math.abs(settlementDraft.delta))}</strong>.</p>
          <label className={labelClass}>Método *<select className={inputClass} value={settlementDraft.method} onChange={(event) => setSettlementDraft({ ...settlementDraft, method: event.target.value })}><option value="">Seleccionar</option><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
          <label className={labelClass}>Referencia<input className={inputClass} value={settlementDraft.reference} onChange={(event) => setSettlementDraft({ ...settlementDraft, reference: event.target.value })} /></label>
          <label className="flex items-start gap-2 text-[11px]"><input type="checkbox" checked={settlementDraft.confirmed} onChange={(event) => setSettlementDraft({ ...settlementDraft, confirmed: event.target.checked })} /><span>Confirmo que {settlementDraft.delta > 0 ? 'recibí el pago' : 'procesé la devolución'} por {formatCOP(Math.abs(settlementDraft.delta))}.</span></label>
          {error && <p className="rounded-lg bg-danger-100 p-2 text-[11px] text-[#a23b3b]" role="alert">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" disabled={saving} onClick={() => setSettlementDraft(null)} className="h-9 border border-sapay-450 bg-white px-3 text-xs !text-sapay-900 hover:bg-sapay-100">Volver</Button><Button type="button" disabled={saving} onClick={() => void confirmSettlement()} className="h-9 bg-sapay-900 px-3 text-xs !text-white">{saving ? 'Guardando…' : 'Confirmar y guardar'}</Button></div>
        </div>
      </Modal>}

      {cancellationDraft && <Modal onClose={() => !saving && setCancellationDraft(null)} title="Cancelar reserva" maxWidthClass="max-w-lg">
        <div className="space-y-3 text-xs text-sapay-900">
          <p>Reserva #{cancellationDraft.reservation.id} · {cancellationDraft.reservation.client.firstName} {cancellationDraft.reservation.client.lastName} · habitación {cancellationDraft.reservation.roomNumber}</p>
          <div className="rounded-xl bg-sapay-50 p-3"><p>Se retiene: <strong>{formatCOP(cancellationPenalty)}</strong>{cancellationDraft.late && !cancellationDraft.forceWaiver ? ' (20%)' : ''}</p><p>Devolución: <strong>{formatCOP(cancellationRefund)}</strong></p></div>
          {cancellationDraft.late && <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px]"><input type="checkbox" checked={cancellationDraft.forceWaiver} onChange={(event) => setCancellationDraft({ ...cancellationDraft, forceWaiver: event.target.checked, forceReason: '', confirmationText: '' })} /><span>Exonerar el 20% por una excepción. Se registrará como acción forzosa.</span></label>}
          {cancellationDraft.forceWaiver && <>
            <label className={labelClass}>Motivo obligatorio<textarea className={inputClass} rows={2} value={cancellationDraft.forceReason} onChange={(event) => setCancellationDraft({ ...cancellationDraft, forceReason: event.target.value })} placeholder="Describe la situación excepcional" /></label>
            <label className={labelClass}>Escribe EXONERAR PENALIDAD<input className={inputClass} value={cancellationDraft.confirmationText} onChange={(event) => setCancellationDraft({ ...cancellationDraft, confirmationText: event.target.value })} /></label>
          </>}
          {cancellationRefund > 0 && <>
            <label className={labelClass}>Método de devolución *<select className={inputClass} value={cancellationDraft.refundMethod} onChange={(event) => setCancellationDraft({ ...cancellationDraft, refundMethod: event.target.value })}><option value="">Seleccionar</option><option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option><option>Otro</option></select></label>
            <label className={labelClass}>Referencia de devolución<input className={inputClass} value={cancellationDraft.refundReference} onChange={(event) => setCancellationDraft({ ...cancellationDraft, refundReference: event.target.value })} /></label>
            <label className="flex items-start gap-2 text-[11px]"><input type="checkbox" checked={cancellationDraft.refundConfirmed} onChange={(event) => setCancellationDraft({ ...cancellationDraft, refundConfirmed: event.target.checked })} /><span>Confirmo que ya procesé la devolución indicada antes de cancelar.</span></label>
          </>}
          {error && <p className="rounded-lg bg-danger-100 p-2 text-[11px] text-[#a23b3b]" role="alert">{error}</p>}
          <div className="flex justify-end gap-2"><Button type="button" disabled={saving} onClick={() => setCancellationDraft(null)} className="h-9 border border-sapay-450 bg-white px-3 text-xs !text-sapay-900 hover:bg-sapay-100">Volver</Button><Button type="button" disabled={saving || (cancellationRefund > 0 && (!cancellationDraft.refundConfirmed || !cancellationDraft.refundMethod)) || (cancellationDraft.forceWaiver && (!cancellationDraft.forceReason.trim() || cancellationDraft.confirmationText !== 'EXONERAR PENALIDAD'))} onClick={() => void confirmCancellation()} className="h-9 bg-rose-700 px-3 text-xs !text-white hover:bg-rose-800">{saving ? 'Procesando…' : 'Confirmar devolución y cancelar'}</Button></div>
        </div>
      </Modal>}

      {checkinTarget && <Modal onClose={() => setCheckinTarget(null)} title="Confirmar check-in" maxWidthClass="max-w-md">
        <div className="space-y-3 text-xs text-sapay-900"><p>Se creará el hospedaje de <strong>{checkinTarget.client.firstName} {checkinTarget.client.lastName}</strong> en la habitación <strong>{checkinTarget.roomNumber}</strong>.</p><p>La habitación pasará a ocupada y la reserva quedará vinculada al hospedaje.</p><div className="flex justify-end gap-2"><Button type="button" onClick={() => setCheckinTarget(null)} className="h-9 border border-sapay-450 bg-white px-3 text-xs !text-sapay-900 hover:bg-sapay-100">Volver</Button><Button type="button" onClick={() => void confirmCheckin()} className="h-9 bg-sapay-900 px-3 text-xs !text-white">Confirmar check-in</Button></div></div>
      </Modal>}
    </div>
  );
}
