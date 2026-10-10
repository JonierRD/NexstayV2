import { CalendarDays, ChevronLeft, ChevronRight, FileText, Search, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { AuditFilters } from '../components/auditoria/AuditFilters';
import { AuditLogCard } from '../components/auditoria/AuditLogCard';
import { useAuditoria } from '../components/auditoria/useAuditoria';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export function AuditoriaPage({ user: _user }: { user?: PublicUser } = {}): ReactElement {
  const a = useAuditoria();
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const canDelete = _user?.role === 'ADMIN';
  const allSelected = a.logs.length > 0 && a.logs.every((log) => selectedIds.has(log.id));
  const selectedLogs = a.logs.filter((log) => selectedIds.has(log.id));

  useEffect(() => {
    const visibleIds = new Set(a.logs.map((log) => log.id));
    setSelectedIds((current) => new Set([...current].filter((id) => visibleIds.has(id))));
  }, [a.logs]);

  if (a.loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250">
        <div className="text-[11px] text-sapay-750">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="audit-page flex min-h-0 flex-1 flex-col overflow-hidden text-sapay-950">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
        <div className="audit-banner relative overflow-hidden rounded-xl px-5 py-4 text-white shadow-sm">
          <div className="relative z-10 flex flex-wrap items-center gap-4">
            <div className="audit-banner-icon flex h-12 w-12 items-center justify-center rounded-2xl"><ShieldCheck size={25} /></div>
            <div><h2 className="text-lg font-bold">Historial de Cambios</h2><p className="text-[11px] text-white">Registro de todas las acciones importantes en el sistema</p></div>
            <div className="ml-auto flex flex-wrap gap-2">
              <div className="audit-metric flex items-center gap-2 rounded-xl border px-4 py-2"><FileText size={18} /><span className="text-[10px]">Total de registros<strong className="block text-sm text-white">{a.total}</strong></span></div>
              <div className="audit-metric flex items-center gap-2 rounded-xl border px-4 py-2"><Users size={18} /><span className="text-[10px]">Usuarios<strong className="block text-sm text-white">{new Set(a.logs.map((log) => log.user.id)).size}</strong></span></div>
              <div className="audit-metric flex items-center gap-2 rounded-xl border px-4 py-2"><CalendarDays size={18} /><span className="text-[10px]">Hoy<strong className="block text-sm text-white">{a.todayCount}</strong></span></div>
            </div>
          </div>
        </div>

        <AuditFilters
          search={a.search}
          onSearchChange={a.setSearch}
          actionFilter={a.actionFilter}
          onActionChange={a.setActionFilter}
          entityFilter={a.entityFilter}
          onEntityChange={a.setEntityFilter}
          entities={a.uniqueEntities}
        />

        <div className="audit-surface flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            {canDelete && (
              <>
                <input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? new Set() : new Set(a.logs.map((log) => log.id)))} className="h-4 w-4 accent-sapay-900" aria-label="Seleccionar todos los registros de esta página" />
                <span className="text-[10px] text-sapay-750">Seleccionar todos</span>
              </>
            )}
          <p className="text-[10px] text-sapay-750">
            Mostrando {a.rangeLabel} registros
          </p>
          </div>
          <div className="flex items-center gap-1">
            {canDelete && selectedIds.size > 0 && (
              <button type="button" onClick={() => { setDeleteError(''); setConfirmBulkDelete(true); }} className="rounded-lg border border-danger-200 bg-danger px-2 py-1 text-[10px] font-medium text-white">
                Eliminar seleccionados ({selectedIds.size})
              </button>
            )}
            <button
              type="button"
              onClick={a.prevPage}
              disabled={!a.canPrev || a.loading}
              className="audit-button rounded-lg border px-2 py-1 text-[10px] font-medium disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-1 text-[10px] text-sapay-750">
              {a.page + 1} / {a.totalPages}
            </span>
            <button
              type="button"
              onClick={a.nextPage}
              disabled={!a.canNext || a.loading}
              className="audit-button rounded-lg border px-2 py-1 text-[10px] font-medium disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="audit-surface flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border p-3 shadow-sm">
            {a.logs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Search className="mx-auto mb-2 text-sapay-650" size={24} />
                  <p className="text-[11px] text-sapay-750">No se encontraron registros</p>
                </div>
              </div>
            ) : (
              a.logs.map((log) => (
                <AuditLogCard
                  key={log.id}
                  log={log}
                  canDelete={canDelete}
                  selected={selectedIds.has(log.id)}
                  onToggleSelect={(selectedLog) => setSelectedIds((current) => {
                    const next = new Set(current);
                    if (next.has(selectedLog.id)) next.delete(selectedLog.id); else next.add(selectedLog.id);
                    return next;
                  })}
                />
              ))
            )}
          </div>
        </div>
      </div>
      {confirmBulkDelete && selectedLogs.length > 0 ? (
        <ConfirmModal
          title="Eliminar registros de auditoría"
          message={`¿Seguro que deseas eliminar los ${selectedLogs.length} registros seleccionados? Esta acción no se puede deshacer.`}
          confirmLabel={deleting ? 'Eliminando...' : 'Eliminar'}
          confirmDanger
          onClose={() => {
            if (!deleting) { setConfirmBulkDelete(false); setSelectedIds(new Set()); }
          }}
          onConfirm={() => {
            const ids = selectedLogs.map((log) => log.id);
            setDeleting(true);
            void a.deleteLogs(ids)
              .then(() => { setConfirmBulkDelete(false); setSelectedIds(new Set()); })
              .catch((error: unknown) => {
                setDeleteError(error instanceof Error ? error.message : 'No se pudo eliminar el registro.');
              })
              .finally(() => setDeleting(false));
          }}
        />
      ) : null}
      {deleteError && (
        <div className="fixed bottom-4 right-4 z-[70] rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-danger shadow-lg">
          {deleteError}
        </div>
      )}
    </div>
  );
}