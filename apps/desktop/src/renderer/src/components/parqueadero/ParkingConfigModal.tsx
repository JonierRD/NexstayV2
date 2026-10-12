import { Plus, Save, Trash2, X } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { createParkingVehicleTypeRequest, deleteParkingVehicleTypeRequest, updateParkingVehicleTypeRequest, type ParkingVehicleType } from '../../lib/api';
import { ConfirmModal } from '../ui/ConfirmModal';

export function ParkingConfigModal({ types, onClose, onSaved }: { types: ParkingVehicleType[]; onClose: () => void; onSaved: () => void }): ReactElement {
  const [rows, setRows] = useState(types);
  const [newRow, setNewRow] = useState({ name: '', dailyRate: '', monthlyRate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ParkingVehicleType | null>(null);
  const update = (id: number, field: 'name' | 'dailyRate' | 'monthlyRate' | 'isActive', value: string | boolean) =>
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  async function save() {
    setSaving(true); setError('');
    try {
      if (newRow.name.trim() && (!newRow.dailyRate.trim() || !newRow.monthlyRate.trim())) {
        throw new Error('Completa las tarifas del nuevo tipo de vehículo.');
      }
      await Promise.all(rows.map((row) => {
        if (!row.name.trim()) throw new Error('Todos los tipos existentes deben tener un nombre.');
        return updateParkingVehicleTypeRequest(row.id, { name: row.name.trim(), dailyRate: Number(row.dailyRate), monthlyRate: Number(row.monthlyRate), isActive: row.isActive });
      }));
      if (newRow.name.trim()) await createParkingVehicleTypeRequest({ name: newRow.name.trim(), dailyRate: Number(newRow.dailyRate), monthlyRate: Number(newRow.monthlyRate), isActive: true });
      onSaved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron guardar las tarifas.'); }
    finally { setSaving(false); }
  }
  async function removeType(): Promise<void> {
    if (!pendingDelete) return;
    try {
      await deleteParkingVehicleTypeRequest(pendingDelete.id);
      setRows((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      setError('');
    } catch (reason) {
      setPendingDelete(null);
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar el tipo de vehículo.');
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sapay-950/40 p-4">
      <section className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">Tipos y tarifas</h2><p className="text-[10px] text-sapay-700">Solo el administrador puede modificar estos valores.</p></div><button onClick={onClose}><X size={17} /></button></div>
        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[540px] grid-cols-[1.4fr_1fr_1fr_70px] gap-2 border-b border-sapay-200 pb-2 text-[10px] font-semibold text-sapay-700"><span>Tipo</span><span>Tarifa día</span><span>Tarifa mensual</span><span>Activo</span></div>
          {rows.map((row) => <div key={row.id} className="grid min-w-[620px] grid-cols-[1.4fr_1fr_1fr_70px_34px] items-center gap-2 border-b border-sapay-100 py-2"><input value={row.name} onChange={(e) => update(row.id, 'name', e.target.value)} className="rounded border border-sapay-300 px-2 py-1 text-xs" /><input type="number" min="0" value={row.dailyRate} onChange={(e) => update(row.id, 'dailyRate', e.target.value)} className="rounded border border-sapay-300 px-2 py-1 text-xs" /><input type="number" min="0" value={row.monthlyRate} onChange={(e) => update(row.id, 'monthlyRate', e.target.value)} className="rounded border border-sapay-300 px-2 py-1 text-xs" /><input type="checkbox" checked={row.isActive} onChange={(e) => update(row.id, 'isActive', e.target.checked)} /><button type="button" onClick={() => setPendingDelete(row)} className="text-red-600" title="Eliminar tipo"><Trash2 size={14} /></button></div>)}
          <div className="mt-3 grid min-w-[620px] grid-cols-[1.4fr_1fr_1fr_70px_34px] items-center gap-2"><input placeholder="Nuevo tipo..." value={newRow.name} onChange={(e) => setNewRow({ ...newRow, name: e.target.value })} className="rounded border border-sapay-300 px-2 py-1 text-xs" /><input type="number" min="0" placeholder="Día" value={newRow.dailyRate} onChange={(e) => setNewRow({ ...newRow, dailyRate: e.target.value })} className="rounded border border-sapay-300 px-2 py-1 text-xs" /><input type="number" min="0" placeholder="Mensual" value={newRow.monthlyRate} onChange={(e) => setNewRow({ ...newRow, monthlyRate: e.target.value })} className="rounded border border-sapay-300 px-2 py-1 text-xs" /><span /> <Plus size={16} className="text-sapay-700" /></div>
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-sapay-300 px-3 py-2 text-xs">Cancelar</button><button disabled={saving} onClick={() => void save()} className="flex items-center gap-1 rounded-lg bg-sapay-900 px-3 py-2 text-xs text-white disabled:opacity-50"><Save size={14} /> Guardar tarifas</button></div>
      </section>
      {pendingDelete && <ConfirmModal title="Eliminar tipo de vehículo" message={`¿Deseas eliminar el tipo “${pendingDelete.name}”? Si ya tiene movimientos registrados, el sistema conservará el histórico y te indicará que debes desactivarlo.`} confirmLabel="Eliminar" confirmDanger onClose={() => setPendingDelete(null)} onConfirm={() => void removeType()} />}
    </div>
  );
}
