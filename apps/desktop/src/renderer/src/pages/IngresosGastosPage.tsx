import { DollarSign, Plus, Search, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react';
import { formatCOP, formatDateShort } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ModuleHeader } from '../components/ui/ModuleHeader';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  createFinanceRequest,
  deleteFinanceRequest,
  financeMovementsRequest,
  financeSummaryRequest,
  type FinanceMovement,
  type FinancePayload
} from '../lib/api';

type MovementType = FinanceMovement['type'];
type Filter = 'TODOS' | MovementType;

const categories = ['Hospedaje', 'Reservas', 'Parqueadero', 'Lavandería', 'Ventas', 'Servicios', 'Compras', 'Nómina', 'Otros'];
const today = () => new Date().toISOString().slice(0, 10);

export function IngresosGastosPage(): ReactElement {
  const [movements, setMovements] = useState<FinanceMovement[]>([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('TODOS');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<{ type: MovementType; category: string; description: string; amount: string; date: string }>({
    type: 'INGRESO',
    category: 'Hospedaje',
    description: '',
    amount: '',
    date: today()
  });
  const [toDelete, setToDelete] = useState<FinanceMovement | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [m, s] = await Promise.all([financeMovementsRequest(), financeSummaryRequest()]);
      setMovements(m);
      setSummary(s);
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

  const filtered = useMemo(() => movements.filter((item) => {
    const matchesType = filter === 'TODOS' || item.type === filter;
    const text = `${item.description} ${item.category}`.toLowerCase();
    return matchesType && text.includes(query.toLowerCase());
  }), [filter, movements, query]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.description.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    try {
      const payload: FinancePayload = {
        type: form.type,
        category: form.category,
        description: form.description.trim(),
        amount,
        date: form.date
      };
      await createFinanceRequest(payload);
      setForm({ ...form, description: '', amount: '' });
      setFormOpen(false);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteFinanceRequest(toDelete.id);
      setToDelete(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error eliminando');
    }
  }

  return (
    <div className="module-page flex h-full flex-col overflow-y-auto">
      <ModuleHeader icon={DollarSign} title="Ingresos y Gastos" subtitle="Controla los movimientos financieros y el balance del hotel." metrics={[
        { label: 'Ingresos', value: formatCOP(summary.income), icon: TrendingUp },
        { label: 'Gastos', value: formatCOP(summary.expense), icon: TrendingDown },
        { label: 'Balance', value: formatCOP(summary.balance), icon: Wallet }
      ]} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sapay-650" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar movimiento..." className="w-full rounded-xl border border-sapay-350 bg-white py-2.5 pl-9 pr-3 text-xs outline-none" />
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="rounded-xl border border-sapay-350 bg-white px-3 py-2.5 text-xs outline-none">
          <option value="TODOS">Todos los movimientos</option>
          <option value="INGRESO">Solo ingresos</option>
          <option value="GASTO">Solo gastos</option>
        </select>
        <Button onClick={() => setFormOpen(true)} className="h-9 rounded-lg bg-sapay-900 px-3 text-xs text-white">
          <Plus size={14} /> Registrar movimiento
        </Button>
      </div>
      {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <section className="mt-3 rounded-[22px] border border-sapay-350 bg-white p-4 shadow-[0_14px_36px_rgba(52,39,28,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-sapay-950">Movimientos recientes</h2>
            <p className="text-[10px] text-sapay-750">Registro de ingresos y egresos del negocio</p>
          </div>
          <span className="rounded-full bg-sapay-100 px-2.5 py-1 text-[10px] font-semibold text-sapay-800">{filtered.length} registros</span>
        </div>
        {loading ? <div className="flex min-h-[180px] items-center justify-center text-xs text-sapay-650">Cargando...</div> : filtered.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-sapay-300 bg-sapay-50 text-center text-xs text-sapay-650">
            No hay movimientos para mostrar.<br />Registra el primero con el botón superior.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-sapay-200 text-[10px] uppercase tracking-[0.07em] text-sapay-700">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Descripción</th>
                  <th className="px-3 py-2">Categoría</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sapay-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-sapay-50">
                    <td className="px-3 py-3 text-sapay-700">{formatDateShort(item.movementDate)}</td>
                    <td className="px-3 py-3 font-semibold text-sapay-950">{item.description}</td>
                    <td className="px-3 py-3 text-sapay-700">{item.category}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.type === 'INGRESO' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                        {item.type === 'INGRESO' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-right font-bold ${item.type === 'INGRESO' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {item.type === 'INGRESO' ? '+' : '-'}{formatCOP(item.amount)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" onClick={() => setToDelete(item)} className="rounded-lg p-1.5 text-sapay-600 hover:bg-rose-50 hover:text-rose-700" aria-label="Eliminar movimiento">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {formOpen && (
        <Modal title="Registrar movimiento" onClose={() => setFormOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm({ ...form, type: 'INGRESO' })} className={`rounded-lg border py-2 text-xs font-semibold ${form.type === 'INGRESO' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-sapay-300'}`}>Ingreso</button>
              <button type="button" onClick={() => setForm({ ...form, type: 'GASTO' })} className={`rounded-lg border py-2 text-xs font-semibold ${form.type === 'GASTO' ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-sapay-300'}`}>Gasto</button>
            </div>
            <label className="block text-[11px] font-medium">Descripción
              <input required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs outline-none" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-medium">Categoría
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs">
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-medium">Valor
                <input required min="1" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs" />
              </label>
            </div>
            <label className="block text-[11px] font-medium">Fecha
              <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="mt-1 w-full rounded-lg border border-sapay-350 px-3 py-2 text-xs" />
            </label>
            <Button type="submit" disabled={saving} className="w-full bg-sapay-900 text-white disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar movimiento'}</Button>
          </form>
        </Modal>
      )}
      {toDelete && (
        <ConfirmModal
          title="¿Eliminar este movimiento?"
          message="Esta acción no se puede deshacer."
          confirmDanger
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
