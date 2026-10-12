import {
  Bike,
  CarFront,
  CheckCircle2,
  Clock3,
  History,
  LogOut,
  Settings2,
  Trash2,
  Truck,
  X
} from 'lucide-react';
import { type ReactElement, useState } from 'react';
import {
  deleteParkingSessionsRequest,
  type ParkingSession,
  type PublicUser,
} from '../lib/api';
import { ParkingConfigModal } from '../components/parqueadero/ParkingConfigModal';
import { useParqueadero } from '../components/parqueadero/useParqueadero';
import { Role } from '../routes/roles';
import { ModuleHeader } from '../components/ui/ModuleHeader';

const money = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
const date = (value: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

function VehicleIcon({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  const Icon = normalized.includes('moto')
    ? Bike
    : normalized.includes('camion') || normalized.includes('camión')
      ? Truck
      : CarFront;
  return <Icon size={18} />;
}

function HistoryModal({
  sessions,
  isAdmin,
  onClose,
  onDeleted
}: {
  sessions: ParkingSession[];
  isAdmin: boolean;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}): ReactElement {
  const [selected, setSelected] = useState<number[]>([]);
  const allSelected = sessions.length > 0 && selected.length === sessions.length;

  async function removeSelected(): Promise<void> {
    if (!selected.length) return;
    await deleteParkingSessionsRequest(selected);
    setSelected([]);
    await onDeleted();
  }

  function toggleAll(checked: boolean): void {
    setSelected(checked ? sessions.map((session) => session.id) : []);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sapay-950/40 p-4">
      <section className="flex max-h-[85vh] w-full max-w-6xl flex-col rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Historial del parqueadero</h2>
            <p className="text-[10px] text-sapay-700">Consulta todas las salidas registradas.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar historial">
            <X size={17} />
          </button>
        </div>
        <div className="mt-4 min-h-0 overflow-auto">
          <table className="w-full min-w-[820px] text-left text-[10px]">
            <thead className="sticky top-0 border-b border-sapay-200 bg-white text-sapay-700">
              <tr>
                {isAdmin && (
                  <th className="p-2">
                    <input type="checkbox" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} />
                  </th>
                )}
                <th className="p-2">Ingreso</th>
                <th>Salida</th>
                <th>Placa</th>
                <th>Vehículo</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-sapay-100">
                  {isAdmin && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(session.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, session.id]
                              : current.filter((id) => id !== session.id)
                          )
                        }
                      />
                    </td>
                  )}
                  <td className="p-2">{date(session.entryAt)}</td>
                  <td>{session.exitAt ? date(session.exitAt) : 'Activo'}</td>
                  <td className="font-semibold">{session.licensePlate}</td>
                  <td>{session.vehicleBrand} · {session.vehicleType.name}</td>
                  <td>{session.ownerName}</td>
                  <td>{session.phone}</td>
                  <td>{money(session.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sessions.length && <p className="p-8 text-center text-[11px] text-sapay-700">Aún no hay salidas registradas.</p>}
        </div>
        {isAdmin && selected.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => void removeSelected()} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-[11px] text-white">
              <Trash2 size={13} /> Eliminar seleccionados
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export function ParqueaderoPage({ user }: { user: PublicUser }): ReactElement {
  const p = useParqueadero();
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState({
    licensePlate: '',
    vehicleBrand: '',
    vehicleTypeId: '',
    billingType: 'DIARIO' as 'DIARIO' | 'MENSUAL',
    phone: '',
    clientFirstName: '',
    clientLastName: '',
    clientCc: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function setField(field: keyof typeof form, value: string | boolean): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(): Promise<void> {
    setSaving(true);
    setFormError('');
    try {
      if (!form.licensePlate.trim() || !form.vehicleBrand.trim() || !form.vehicleTypeId) {
        setFormError('Placa, marca y tipo de vehículo son obligatorios.');
        return;
      }
      if (!form.clientFirstName.trim() || !form.clientLastName.trim() || !form.clientCc.trim() || !form.phone.trim()) {
        setFormError('Nombre, apellido, cédula y teléfono son obligatorios.');
        return;
      }
      await p.register({
        licensePlate: form.licensePlate,
        vehicleBrand: form.vehicleBrand,
        vehicleTypeId: Number(form.vehicleTypeId),
        billingType: form.billingType,
        phone: form.phone,
        clientFirstName: form.clientFirstName,
        clientLastName: form.clientLastName,
        clientCc: form.clientCc,
        notes: form.notes || undefined
      });
      setForm({
        licensePlate: '',
        vehicleBrand: '',
        vehicleTypeId: '',
        billingType: 'DIARIO',
        phone: '',
        clientFirstName: '',
        clientLastName: '',
        clientCc: '',
        notes: ''
      });
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'No se pudo registrar el ingreso.');
    } finally {
      setSaving(false);
    }
  }

  const recentSessions = p.sessions.slice(0, 6);
  const historySessions = p.sessions.filter((session) => session.status === 'CERRADO');
  const todaySessions = p.sessions.filter((session) => session.entryAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="module-page flex min-h-0 flex-1 flex-col overflow-y-auto bg-sapay-250 text-sapay-950">
      <ModuleHeader
        icon={CarFront}
        title="Parqueadero"
        subtitle="Control de ingresos, salidas y tarifas del parqueadero."
        metrics={[
          { label: 'Vehículos activos', value: p.activeSessions.length, icon: CarFront },
          { label: 'Movimientos', value: p.sessions.length, icon: History },
          { label: 'Ingresos hoy', value: todaySessions, icon: Clock3 }
        ]}
      />
      <div className="mb-4 flex justify-end pt-1">
        <div className="flex gap-3">
          <button type="button" onClick={() => setShowHistory(true)} className="flex items-center gap-1.5 rounded-lg border border-sapay-300 bg-white px-3 py-2 text-xs hover:bg-sapay-100"><History size={15} /> Historial</button>
          {user.role === Role.ADMIN && <button type="button" onClick={() => setShowConfig(true)} className="flex items-center gap-1.5 rounded-lg border border-sapay-300 bg-white px-3 py-2 text-xs hover:bg-sapay-100"><Settings2 size={15} /> Configurar tarifas</button>}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-h-[480px] rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_12px_30px_rgba(67,42,27,0.08)]">
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Vehículos en el parqueadero</h2><p className="text-[10px] text-sapay-700">{p.activeSessions.length} espacios ocupados actualmente</p></div><div className="flex items-center gap-2 text-[10px]"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Libre / <span className="h-2 w-2 rounded-full bg-red-500" /> Ocupado</div></div>
          {p.error && <p className="mb-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{p.error}</p>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {p.activeSessions.map((session) => <article key={session.id} className="rounded-xl border border-red-200 bg-red-50 p-3"><div className="flex items-center justify-between"><span className="text-lg font-bold">{session.licensePlate}</span><span className="text-red-500"><VehicleIcon name={session.vehicleType.name} /></span></div><p className="mt-2 text-[11px] font-medium">{session.vehicleBrand} · {session.vehicleType.name}</p><p className="text-[10px] text-sapay-700">{session.ownerName} · {session.phone}</p>            <p className="mt-1 text-[10px] text-sapay-700">{`${session.billingType === 'DIARIO' ? 'Día' : 'Mensual'} · ${money(session.amount)}`}</p><button type="button" onClick={() => void p.close(session.id)} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg bg-white py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-100"><LogOut size={13} /> Registrar salida</button></article>)}
            <article className="flex min-h-[145px] items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50 text-center"><div><CheckCircle2 className="mx-auto text-emerald-600" size={24} /><p className="mt-1 text-xs font-semibold text-emerald-800">Espacio libre</p><p className="text-[10px] text-emerald-700">Listo para recibir</p></div></article>
          </div>
          <div className="mt-6 border-t border-sapay-200 pt-3"><h3 className="mb-2 text-xs font-semibold">Movimientos recientes</h3><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-[10px]"><thead className="border-b border-sapay-200 text-sapay-700"><tr><th className="p-2">Fecha</th><th>Placa</th><th>Vehículo</th><th>Cliente</th><th>Estado</th><th>Valor</th></tr></thead><tbody>{recentSessions.map((s) => <tr key={s.id} className="border-b border-sapay-100"><td className="p-2">{date(s.entryAt)}</td><td className="font-semibold">{s.licensePlate}</td><td><span className="inline-flex items-center gap-1"><VehicleIcon name={s.vehicleType.name} />{s.vehicleBrand}</span></td><td>{s.ownerName}</td><td><span className={s.status === 'ACTIVO' ? 'rounded-full bg-amber-100 px-2 py-1 text-amber-800' : 'rounded-full bg-emerald-100 px-2 py-1 text-emerald-800'}>{s.status === 'ACTIVO' ? 'Activo' : 'Salida'}</span></td><td>{money(s.amount)}</td></tr>)}</tbody></table></div></div>
        </section>
        <section className="h-fit rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_12px_30px_rgba(67,42,27,0.08)]"><div className="mb-4 flex items-center gap-2"><Clock3 size={18} className="text-blue-700" /><div><h2 className="text-sm font-semibold">Registrar ingreso</h2><p className="text-[10px] text-sapay-700">Registro para clientes externos.</p></div></div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2"><label className="block text-[11px]">Nombre *<input required value={form.clientFirstName} onChange={(e) => setField('clientFirstName', e.target.value)} className="mt-1 w-full rounded-lg border border-sapay-300 px-3 py-2 text-xs" /></label><label className="block text-[11px]">Apellido *<input required value={form.clientLastName} onChange={(e) => setField('clientLastName', e.target.value)} className="mt-1 w-full rounded-lg border border-sapay-300 px-3 py-2 text-xs" /></label></div>
            <label className="block text-[11px]">Cédula *<input required value={form.clientCc} onChange={(e) => setField('clientCc', e.target.value)} className="mt-1 w-full rounded-lg border border-sapay-300 px-3 py-2 text-xs" /></label>
            <label className="block text-[11px]">Teléfono *<input required value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="mt-1 w-full rounded-lg border border-sapay-300 px-3 py-2 text-xs" /></label>
            <div className="border-t border-sapay-200 pt-3"><p className="mb-2 text-[11px] font-semibold">Información del vehículo y pago</p>
              <label className="block text-[11px]">Placa *<input required value={form.licensePlate} onChange={(e) => setField('licensePlate', e.target.value.toUpperCase())} placeholder="ABC-123" className="mt-1 w-full rounded-lg border border-sapay-300 px-3 py-2 text-xs uppercase" /></label>
              <label className="mt-3 block text-[11px]">Marca del vehículo *<input required value={form.vehicleBrand} onChange={(e) => setField('vehicleBrand', e.target.value)} placeholder="Toyota, Yamaha..." className="mt-1 w-full rounded-lg border border-sapay-300 px-3 py-2 text-xs" /></label>
              <label className="mt-3 block text-[11px]">Tipo de vehículo<select value={form.vehicleTypeId} onChange={(e) => setField('vehicleTypeId', e.target.value)} className="mt-1 w-full rounded-lg border border-sapay-300 px-3 py-2 text-xs"><option value="">Seleccionar...</option>{p.types.filter((t) => t.isActive).map((t) => <option key={t.id} value={t.id}>{t.name} · {money(form.billingType === 'DIARIO' ? t.dailyRate : t.monthlyRate)}</option>)}</select></label>
              <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setField('billingType', 'DIARIO')} className={`rounded-lg border px-2 py-2 text-xs ${form.billingType === 'DIARIO' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-sapay-300'}`}>Pago por día</button><button type="button" onClick={() => setField('billingType', 'MENSUAL')} className={`rounded-lg border px-2 py-2 text-xs ${form.billingType === 'MENSUAL' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-sapay-300'}`}>Mensual</button></div>
            </div>
            {formError && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{formError}</p>}
            <button type="button" disabled={saving} onClick={() => void submit()} className="w-full rounded-lg bg-sapay-900 py-2.5 text-xs font-semibold text-white hover:bg-sapay-800 disabled:opacity-50">Registrar ingreso</button>
          </div>
        </section>
      </div>
      {showConfig && <ParkingConfigModal types={p.types} onClose={() => setShowConfig(false)} onSaved={() => { setShowConfig(false); void p.load(); }} />}
      {showHistory && <HistoryModal sessions={historySessions} isAdmin={user.role === Role.ADMIN} onClose={() => setShowHistory(false)} onDeleted={p.load} />}
    </div>
  );
}
