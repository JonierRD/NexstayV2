import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { type FormEvent, type ReactElement, useEffect, useMemo, useState } from 'react';
import {
  clientesRequest,
  createClienteRequest,
  deleteClienteRequest,
  updateClienteRequest,
  type Cliente,
  type CreateClienteInput,
  type PublicUser
} from '../lib/api';
import { AdminPasswordModal } from './AdminPasswordModal';
import { Button } from './ui/button';

type Props = { user: PublicUser };
type FormState = Omit<CreateClienteInput, 'adminPassword'>;

const emptyForm: FormState = { firstName: '', lastName: '', cc: '', phone: '', cityOrigin: '', cityDestination: '', profession: '', notes: '' };
const inputClass = 'w-full rounded-lg border border-[#e0d4ca] bg-[#fcfaf8] px-3 py-2 text-xs outline-none focus:border-[#b08f7c] focus:bg-white';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));
}

export function ClientesPage({ user }: Props): ReactElement {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [history, setHistory] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load(): Promise<void> {
    setLoading(true);
    try { setClients(await clientesRequest()); setError(''); }
    catch { setError('No se pudo cargar el directorio de clientes.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return clients;
    return clients.filter((client) => [client.cc, client.firstName, client.lastName, client.phone, client.cityOrigin, client.cityDestination].some((field) => field?.toLowerCase().includes(value)));
  }, [clients, query]);

  function openCreate(): void { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(client: Cliente): void {
    setEditing(client);
    setForm({ firstName: client.firstName, lastName: client.lastName, cc: client.cc, phone: client.phone ?? '', cityOrigin: client.cityOrigin ?? '', cityDestination: client.cityDestination ?? '', profession: client.profession ?? '', notes: client.notes ?? '' });
    setShowForm(true);
  }
  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.cc.trim()) { setError('Nombre, apellido y cédula son obligatorios.'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { cc: _cc, ...update } = form;
        await updateClienteRequest(editing.id, update);
      }
      else await createClienteRequest(form);
      setShowForm(false); setEditing(null); setForm(emptyForm); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el cliente.'); }
    finally { setSaving(false); }
  }
  async function remove(password?: string, client = deleting): Promise<void> {
    if (!client) return;
    try { await deleteClienteRequest(client.id, password); setDeleting(null); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo eliminar el cliente.'); }
  }

  function requestDelete(client: Cliente): void {
    setError('');
    setDeleting(client);
    if (user.role === 'ADMIN') void remove(undefined, client);
  }

  return <div className="flex h-full flex-col gap-3 p-4">
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-sm font-semibold">Directorio de clientes</h1><p className="text-[10px] text-[#7d6d61]">Consulta datos, historial y visitas anteriores.</p></div><Button onClick={openCreate} className="h-9 rounded-lg bg-[#4b2b21] px-3 text-xs text-white hover:bg-[#5a3429]"><Plus size={14} /> Nuevo cliente</Button></div>
    {error && <div className="rounded-lg border border-[#f1c2c2] bg-[#fff0f0] px-3 py-2 text-xs text-[#b33a3a]">{error}</div>}
    <div className="flex items-center gap-2 rounded-lg border border-[#eadfd6] bg-white px-3 py-2"><Search size={15} className="text-[#8d7b70]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por cédula, nombre, teléfono o ciudad" className="w-full bg-transparent text-xs outline-none" /></div>
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#eadfd6] bg-white"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#fcf8f4] text-[10px] uppercase text-[#7d6d61]"><tr><th className="px-3 py-2">Cliente</th><th className="px-3 py-2">Cédula</th><th className="px-3 py-2">Teléfono</th><th className="px-3 py-2">Ciudad</th><th className="px-3 py-2">Hospedajes</th><th className="px-3 py-2 text-right">Acciones</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-8 text-center text-[#8d7b70]">Cargando clientes...</td></tr> : filtered.map((client) => <tr key={client.id} className="border-t border-[#f0e7e0] hover:bg-[#fffaf6]"><td className="px-3 py-2 font-medium">{client.firstName} {client.lastName}</td><td className="px-3 py-2">{client.cc}</td><td className="px-3 py-2">{client.phone || 'Sin teléfono'}</td><td className="px-3 py-2">{client.cityOrigin || 'Sin ciudad'}</td><td className="px-3 py-2">{client.stays?.length ?? 0}</td><td className="px-3 py-2"><div className="flex justify-end gap-1"><button title="Ver historial" onClick={() => setHistory(client)} className="rounded p-1.5 text-[#7a4a34] hover:bg-[#f8eee7]">Historial</button><button title="Editar" onClick={() => openEdit(client)} className="rounded p-1.5 text-[#7a4a34] hover:bg-[#f8eee7]"><Pencil size={14} /></button><button title="Eliminar" onClick={() => requestDelete(client)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></div></td></tr>)}{!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-[#8d7b70]">No hay clientes que coincidan.</td></tr>}</tbody></table></div>
    {showForm && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"><form onSubmit={submit} className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><button type="button" onClick={() => setShowForm(false)} className="absolute right-3 top-3 text-[#8d7b70]"><X size={18} /></button><h2 className="text-base font-semibold">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2><div className="mt-4 grid grid-cols-2 gap-3">{([['firstName','Nombre *'],['lastName','Apellido *'],['cc','Cédula *'],['phone','Teléfono'],['cityOrigin','Ciudad de origen'],['cityDestination','Ciudad de destino'],['profession','Profesión']] as const).map(([key, label]) => <label key={key} className="text-[11px] text-[#7d6d61]">{label}<input value={form[key] ?? ''} disabled={key === 'cc' && !!editing} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className={`${inputClass} mt-1 disabled:opacity-60`} /></label>)}<label className="col-span-2 text-[11px] text-[#7d6d61]">Notas<textarea value={form.notes ?? ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={`${inputClass} mt-1`} rows={3} /></label></div><Button disabled={saving} className="mt-4 h-9 w-full rounded-lg bg-[#4b2b21] text-xs text-white">{saving ? 'Guardando...' : 'Guardar cliente'}</Button></form></div>}
    {history && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"><div className="relative max-h-[80vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-5"><button onClick={() => setHistory(null)} className="absolute right-3 top-3"><X size={18} /></button><h2 className="text-base font-semibold">Historial de {history.firstName} {history.lastName}</h2><div className="mt-4 space-y-2">{history.stays?.length ? history.stays.map((stay) => <div key={stay.id} className="rounded-lg border border-[#eadfd6] p-3 text-xs"><div className="flex justify-between font-medium"><span>Habitación {stay.roomNumber}</span><span>{stay.status}</span></div><p className="mt-1 text-[#7d6d61]">Ingreso: {formatDate(stay.checkIn)} · {stay.nights} noche(s)</p><p className="text-[#7d6d61]">Total: ${Number(stay.total).toLocaleString('es-CO')}</p></div>) : <p className="text-xs text-[#8d7b70]">Este cliente aún no tiene hospedajes.</p>}</div></div></div>}
    {deleting && user.role !== 'ADMIN' && <AdminPasswordModal onClose={() => setDeleting(null)} onSuccess={remove} />}
  </div>;
}