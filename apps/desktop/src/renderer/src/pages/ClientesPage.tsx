import { CalendarDays, Download, Plus, ShieldCheck, Trash2, UserRound, Users } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { ClientFormModal } from '../components/clientes/ClientFormModal';
import { ClientHistoryModal } from '../components/clientes/ClientHistoryModal';
import { ClientsTable } from '../components/clientes/ClientsTable';
import { useClientes } from '../components/clientes/useClientes';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AdminPasswordModal } from '../components/ui/AdminPasswordModal';
import { ModuleHeader } from '../components/ui/ModuleHeader';

type Props = { user: PublicUser };

function formatExportDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function ClientesPage({ user }: Props): ReactElement {
  const c = useClientes(user);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const canDelete = user.role === 'ADMIN';
  const today = new Date().toDateString();
  const clientsWithStays = c.clients.filter((client) => (client.stays?.length ?? 0) > 0).length;
  const createdToday = c.clients.filter((client) => client.createdAt && new Date(client.createdAt).toDateString() === today).length;

  useEffect(() => {
    const visibleIds = new Set(c.clients.map((client) => client.id));
    setSelectedIds((current) => new Set([...current].filter((id) => visibleIds.has(id))));
  }, [c.clients]);

  function toggleClient(id: number): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllVisible(): void {
    const allSelected = c.filtered.length > 0 && c.filtered.every((client) => selectedIds.has(client.id));
    setSelectedIds((current) => {
      const next = new Set(current);
      c.filtered.forEach((client) => {
        if (allSelected) next.delete(client.id); else next.add(client.id);
      });
      return next;
    });
  }

  function exportClients(): void {
    const header = ['Nombre', 'Apellido', 'Cédula', 'Teléfono', 'Ciudad origen', 'Ciudad destino', 'Profesión', 'Habitación', 'Fecha de ingreso', 'Fecha de salida', 'Noches', 'Total hospedaje', 'Estado hospedaje'];
    const orderedClients = [...c.filtered].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, 'es')
    );
    const rows = orderedClients.flatMap((client) => {
      const stays = [...(client.stays ?? [])].sort((a, b) =>
        new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
      );
      const base = [client.firstName, client.lastName, client.cc, client.phone ?? '', client.cityOrigin ?? '', client.cityDestination ?? '', client.profession ?? ''];
      if (stays.length === 0) return [[...base, '', '', '', '', '', '']];
      return stays.map((stay) => [
        ...base,
        stay.room?.number ?? stay.roomNumber,
        formatExportDate(stay.checkIn),
        stay.checkOut ? formatExportDate(stay.checkOut) : 'Activo',
        String(stay.nights),
        String(stay.total),
        stay.status
      ]);
    });
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes-hospedajes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function requestSingleDelete(client: Parameters<typeof c.requestDelete>[0]): void {
    if (!canDelete) return;
    setSelectedIds(new Set([client.id]));
    setConfirmDelete(true);
  }

  function confirmSelectedDelete(): void {
    setConfirmDelete(false);
    setShowPassword(true);
  }

  function deleteWithPassword(password: string): void {
    setDeleting(true);
    void c.removeMany([...selectedIds], password)
      .then(() => {
        setSelectedIds(new Set());
        setShowPassword(false);
      })
      .catch(() => undefined)
      .finally(() => setDeleting(false));
  }

  return (
    <div className="module-page flex h-full flex-col">
      <ModuleHeader
        icon={Users}
        title="Clientes"
        subtitle="Directorio de clientes, historial y visitas anteriores."
        metrics={[
          { label: 'Total de clientes', value: c.clients.length, icon: UserRound },
          { label: 'Con hospedajes', value: clientsWithStays, icon: ShieldCheck },
          { label: 'Nuevos hoy', value: createdToday, icon: CalendarDays }
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput value={c.query} onChange={c.setQuery} placeholder="Buscar por cédula, nombre, teléfono o ciudad" />
        </div>
          <Button type="button" onClick={exportClients} className="h-9 rounded-lg border border-sapay-350 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-200">
            <Download size={14} /> Exportar clientes
          </Button>
          {canDelete && selectedIds.size > 0 && (
            <Button type="button" onClick={() => setConfirmDelete(true)} className="h-9 rounded-lg bg-danger px-3 text-xs text-white hover:bg-[#b83030]">
              <Trash2 size={14} /> Eliminar seleccionados ({selectedIds.size})
            </Button>
          )}
          <Button onClick={c.openCreate} className="h-9 rounded-lg bg-sapay-900 px-3 text-xs text-white hover:bg-sapay-850">
            <Plus size={14} /> Nuevo cliente
          </Button>
      </div>

      {c.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-xs text-[#b33a3a]">
          {c.error}
        </div>
      )}

      <ClientsTable
        clients={c.filtered}
        loading={c.loading}
        onView={c.setHistory}
        onEdit={c.openEdit}
        onDelete={requestSingleDelete}
        canDelete={canDelete}
        selectedIds={selectedIds}
        onToggleSelect={toggleClient}
        onToggleAll={toggleAllVisible}
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
      {confirmDelete && selectedIds.size > 0 && (
        <ConfirmModal
          title="Eliminar clientes"
          message={`¿Seguro que deseas eliminar los ${selectedIds.size} clientes seleccionados? Los clientes con historial de hospedajes no pueden eliminarse para proteger esos registros.`}
          confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
          confirmDanger
          onClose={() => { if (!deleting) setConfirmDelete(false); }}
          onConfirm={confirmSelectedDelete}
        />
      )}
      {showPassword && selectedIds.size > 0 && (
        <AdminPasswordModal
          onClose={() => { if (!deleting) setShowPassword(false); }}
          onSuccess={deleteWithPassword}
        />
      )}
    </div>
  );
}