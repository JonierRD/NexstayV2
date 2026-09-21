import { Filter } from 'lucide-react';
import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { AuditFilters } from '../components/auditoria/AuditFilters';
import { AuditLogCard } from '../components/auditoria/AuditLogCard';
import { useAuditoria } from '../components/auditoria/useAuditoria';

export function AuditoriaPage({ user }: { user: PublicUser }): ReactElement {
  const a = useAuditoria();

  if (a.loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250">
        <div className="text-[11px] text-sapay-750">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-sapay-250 text-sapay-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        <div className="mb-3">
          <h2 className="text-[13px] font-semibold text-sapay-950">Historial de Cambios</h2>
          <p className="text-[10px] text-sapay-750">Registro de todas las acciones importantes en el sistema</p>
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

        <div className="mb-2 rounded-xl border border-sapay-350 bg-white px-4 py-2">
          <p className="text-[10px] text-sapay-750">
            Mostrando {a.filteredLogs.length} de {a.total} registros
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[20px] border border-sapay-350 bg-white p-3 shadow-[0_16px_40px_rgba(67,42,27,0.08)]">
            {a.filteredLogs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Filter className="mx-auto mb-2 text-sapay-650" size={24} />
                  <p className="text-[11px] text-sapay-750">No se encontraron registros</p>
                </div>
              </div>
            ) : (
              a.filteredLogs.map((log) => <AuditLogCard key={log.id} log={log} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}