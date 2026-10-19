import { CalendarDays, CheckCircle2, Clock3, Droplets, Filter, Plus, Search, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { formatCOP, formatDateShort } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ModuleHeader } from '../components/ui/ModuleHeader';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  advanceTankWashRequest,
  createTankWashRequest,
  deleteTankWashRequest,
  tankWashListRequest,
  updateTankWashRequest,
  type TankWash,
  type TankWashPayload
} from '../lib/api';

type StatusFilter = 'TODOS' | TankWash['status'];

const statusLabels: Record<TankWash['status'], string> = { PENDIENTE: 'Pendiente', EN_PROCESO: 'En proceso', COMPLETADO: 'Completado' };
const statusStyles: Record<TankWash['status'], string> = { PENDIENTE: 'bg-amber-50 text-amber-800', EN_PROCESO: 'bg-sky-50 text-sky-800', COMPLETADO: 'bg-emerald-50 text-emerald-800' };
const today = () => new Date().toISOString().slice(0, 10);

export function LavadoTanquePage(): ReactElement {
  const [orders, setOrders] = useState<TankWash[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('TODOS');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TankWash | null>(null);
  const [form, setForm] = useState<{ clientName: string; roomNumber: string; tankType: TankWash['tankType']; serviceDate: string; amount: string; notes: string }>({
    clientName: '',
    roomNumber: '',
    tankType: 'RESERVA',
    serviceDate: today(),
    amount: '',
    notes: ''
  });
  const [toDelete, setToDelete] = useState<TankWash | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await tankWashListRequest();
      setOrders(data);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => orders.filter((order) => {
    const matchesStatus = status === 'TODOS' || order.status === status;
    const text = `${order.clientName} ${order.roomNumber ?? ''} ${order.tankType}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase());
  }).sort((a, b) => b.serviceDate.localeCompare(a.serviceDate) || b.id - a.id), [orders, query, status]);

  function openCreate() {
    setEditing(null);
    setForm({ clientName: '', roomNumber: '', tankType: 'RESERVA', serviceDate: today(), amount: '', notes: '' });
    setFormOpen(true);
  }

  function openEdit(order: TankWash) {
    setEditing(order);
    setForm({
      clientName: order.clientName,
      roomNumber: order.roomNumber ?? '',
      tankType: order.tankType,
      serviceDate: order.serviceDate.slice(0, 10),
      amount: String(order.amount),
      notes: order.notes ?? ''
    });
    setFormOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.clientName.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    try {
      const payload: TankWashPayload = {
        clientName: form.clientName.trim(),
        roomNumber: form.roomNumber.trim() || undefined,
        tankType: form.tankType,
        serviceDate: form.serviceDate,
        amount,
        notes: form.notes.trim() || undefined
      };
      if (editing) {
        await updateTankWashRequest(editing.id, payload);
      } else {
        await createTankWashRequest(payload);
      }
      setFormOpen(false);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  async function advance(order: TankWash) {
    try {
      await advanceTankWashRequest(order.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error al avanzar estado');
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteTankWashRequest(toDelete.id);
      setToDelete(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error eliminando');
    }
  }

  const active = orders.filter((order) => order.status !== 'COMPLETADO').length;
  const completed = orders.filter((order) => order.status === 'COMPLETADO').length;

  return (
    <div className="module-page flex h-full flex-col overflow-y-auto">
      <ModuleHeader icon={Droplets} title="Lavado tanque" subtitle="Programa, controla y entrega los servicios de lavado de tanques." metrics={[
        { label: 'Servicios', value: orders.length, icon: Droplets },
        { label: 'Pendientes', value: active, icon: Clock3 },
        { label: 'Completados', value: completed, icon: CheckCircle2 }
      ]} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sapay-650" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente, habitación o tanque..." className="w-full rounded-xl border border-sapay-350 bg-white py-2.5 pl-9 pr-3 text-xs outline-none" />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-sapay-350 bg-white px-3 py-2">
          <Filter size={13} className="text-sapay-650" />
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="text-xs outline-none">
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completados</option>
          </select>
        </div>
        <Button onClick={openCreate} className="h-9 rounded-lg bg-sapay-900 px-3 text-xs text-white">
          <Plus size={14} /> Nuevo servicio
        </Button>
      </div>
      {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <section className="mt-3 rounded-[22px] border border-sapay-350 bg-white p-4 shadow-[0_14px_36px_rgba(52,39,28,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-sapay-950">Servicios de lavado</h2>
            <p className="text-[10px] text-sapay-750">Seguimiento de solicitudes y trabajos programados</p>
          </div>
          <span className="rounded-full bg-sapay-100 px-2.5 py-1 text-[10px] font-semibold text-sapay-800">{filtered.length} servicios</span>
        </div>
        {loading ? <div className="flex min-h-[220px] items-center justify-center text-xs text-sapay-650">Cargando...</div> : filtered.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-sapay-300 bg-sapay-50 text-center text-xs text-sapay-650">
            <Droplets size={24} className="mb-2 text-sapay-500" />
            No hay servicios de lavado registrados.<br />Crea uno para comenzar.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((order) => (
              <article key={order.id} className="rounded-2xl border border-sapay-300 bg-sapay-50/60 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
                    <Droplets size={19} />
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusStyles[order.status]}`}>{statusLabels[order.status]}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-sapay-950">{order.clientName}</h3>
                <p className="mt-1 text-[11px] text-sapay-700">
                  {order.tankType === 'RESERVA' ? 'Tanque de reserva' : order.tankType === 'ELEVADO' ? 'Tanque elevado' : order.tankType === 'SUBTERRANEO' ? 'Tanque subterráneo' : 'Otro'}
                  {order.roomNumber ? ` · Habitación ${order.roomNumber}` : ''}
                </p>
                <p className="mt-1 text-[10px] text-sapay-650">{formatDateShort(order.serviceDate)}{order.notes ? ` · ${order.notes}` : ''}</p>
                <div className="mt-3 flex items-center justify-between border-t border-sapay-200 pt-3 text-[10px] text-sapay-650">
                  <span>Servicio #{order.id}</span>
                  <strong className="text-xs text-sapay-900">{formatCOP(order.amount)}</strong>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button type="button" onClick={() => openEdit(order)} className="flex-1 rounded-lg border border-sapay-300 bg-white py-2 text-[10px] font-semibold text-sapay-800 hover:bg-sapay-100">Editar</button>
                  {order.status !== 'COMPLETADO' && (
                    <button type="button" onClick={() => advance(order)} className="flex-1 rounded-lg border border-sapay-300 bg-white py-2 text-[10px] font-semibold text-sapay-800 hover:bg-sapay-100">
                      <Wrench size={11} className="mr-1 inline" />{order.status === 'PENDIENTE' ? 'Iniciar' : 'Completar'}
                    </button>
                  )}
                  <button type="button" onClick={() => setToDelete(order)} className="flex-1 rounded-lg border border-rose-200 bg-white py-2 text-[10px] font-semibold text-rose-700 hover:bg-rose-50">Eliminar</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {formOpen && (
        <Modal title={editing ? 'Editar servicio de lavado' : 'Nuevo servicio de lavado'} onClose={() => setFormOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-[11px] font-medium">Cliente o responsable
              <input required value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-medium">Habitación
                <input value={form.roomNumber} onChange={(event) => setForm({ ...form, roomNumber: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs" />
              </label>
              <label className="text-[11px] font-medium">Tipo de tanque
                <select value={form.tankType} onChange={(event) => setForm({ ...form, tankType: event.target.value as TankWash['tankType'] })} className="mt-1 w-full rounded-lg border border-sapay-350 px-2 py-2 text-xs">
                  <option value="RESERVA">Tanque de reserva</option>
                  <option value="ELEVADO">Tanque elevado</option>
                  <option value="SUBTERRANEO">Tanque subterráneo</option>
                  <option value="OTRO">Otro</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-medium">Fecha
                <input type="date" value={form.serviceDate} onChange={(event) => setForm({ ...form, serviceDate: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs" />
              </label>
              <label className="text-[11px] font-medium">Valor
                <input required min="1" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs" />
              </label>
            </div>
            <label className="block text-[11px] font-medium">Notas
              <input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs" />
            </label>
            <Button type="submit" disabled={saving} className="w-full bg-sapay-900 text-white disabled:opacity-50">{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Registrar servicio'}</Button>
          </form>
        </Modal>
      )}
      {toDelete && (
        <ConfirmModal
          title="¿Eliminar este servicio?"
          message="Esta acción no se puede deshacer."
          confirmDanger
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
