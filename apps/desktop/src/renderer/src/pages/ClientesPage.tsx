import { Plus } from 'lucide-react';
import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { ClientFormModal } from '../components/clientes/ClientFormModal';
import { ClientHistoryModal } from '../components/clientes/ClientHistoryModal';
import { ClientsTable } from '../components/clientes/ClientsTable';
import { useClientes } from '../components/clientes/useClientes';
import { Button } from '../components/ui/button';
import { SearchInput } from '../components/ui/search-input';

type Props = { user: PublicUser };

export function ClientesPage({ user }: Props): ReactElement {
  const c = useClientes(user);

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-semibold">Directorio de clientes</h1>
          <p className="text-[10px] text-sapay-750">Consulta datos, historial y visitas anteriores.</p>
        </div>
        <Button onClick={c.openCreate} className="h-9 rounded-lg bg-sapay-900 px-3 text-xs text-white hover:bg-sapay-850">
          <Plus size={14} /> Nuevo cliente
        </Button>
      </div>

      {c.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-xs text-[#b33a3a]">
          {c.error}
        </div>
      )}

      <SearchInput value={c.query} onChange={c.setQuery} placeholder="Buscar por cédula, nombre, teléfono o ciudad" />

      <ClientsTable
        clients={c.filtered}
        loading={c.loading}
        onView={c.setHistory}
        onEdit={c.openEdit}
        onDelete={c.requestDelete}
      />

      {c.showForm && (
        <ClientFormModal
          editing={c.editing}
          form={c.form}
          setForm={c.setForm}
          saving={c.saving}
          onSubmit={c.submit}
          onClose={c.closeForm}
        />
      )}

      {c.history && <ClientHistoryModal client={c.history} onClose={() => c.setHistory(null)} />}

      {c.deleting && user.role !== 'ADMIN' && (
        <AdminPasswordModal onClose={() => c.setDeleting(null)} onSuccess={c.remove} />
      )}
    </div>
  );
}