import { Calendar, Filter, Search, User } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import { type AuditLog, type AuditAction, auditoriaRequest } from '../lib/api';
import { type PublicUser } from '../lib/api';

const actionLabels: Record<AuditAction, string> = {
  CREATE: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
  LOGIN: 'Inició sesión',
  LOGOUT: 'Cerró sesión',
  CHECK_IN: 'Check-in',
  CHECK_OUT: 'Check-out',
  STATUS_CHANGE: 'Cambio de estado'
};

const actionColors: Record<AuditAction, string> = {
  CREATE: 'bg-[#e9f6eb] text-[#2f8f4e] border-[#c6e8cf]',
  UPDATE: 'bg-[#fff5df] text-[#c78b14] border-[#f2dbab]',
  DELETE: 'bg-[#fff0ee] text-[#c94a43] border-[#f0c8c4]',
  LOGIN: 'bg-[#e9f6eb] text-[#2f8f4e] border-[#c6e8cf]',
  LOGOUT: 'bg-[#f5efe9] text-[#8f5e3d] border-[#dcc5b1]',
  CHECK_IN: 'bg-[#e9f6eb] text-[#2f8f4e] border-[#c6e8cf]',
  CHECK_OUT: 'bg-[#f5efe9] text-[#8f5e3d] border-[#dcc5b1]',
  STATUS_CHANGE: 'bg-[#fff5df] text-[#c78b14] border-[#f2dbab]'
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function AuditoriaPage({ user }: { user: PublicUser }): ReactElement {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'TODOS'>('TODOS');
  const [entityFilter, setEntityFilter] = useState('TODOS');
  const [total, setTotal] = useState(0);

  const isAdmin = user.role === 'ADMIN';

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await auditoriaRequest({
        limit: 100
      });
      setLogs(response.logs);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !search ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'TODOS' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'TODOS' || log.entity === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const uniqueEntities = Array.from(new Set(logs.map((log) => log.entity)));

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f6f1eb]">
        <div className="text-[11px] text-[#7d6d61]">Cargando historial...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f6f1eb] text-[#2b1b14]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        <div className="mb-3">
          <h2 className="text-[13px] font-semibold text-[#2b1b14]">Historial de Cambios</h2>
          <p className="text-[10px] text-[#7d6d61]">Registro de todas las acciones importantes en el sistema</p>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d7b70]" size={14} />
              <input
                type="text"
                placeholder="Buscar en historial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#e0d4ca] bg-white px-3 py-2 pl-9 text-[11px] outline-none focus:border-[#b08f7c] placeholder:text-[#a49486]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as AuditAction | 'TODOS')}
              className="rounded-xl border border-[#e0d4ca] bg-white px-3 py-2 text-[11px] outline-none focus:border-[#b08f7c]"
            >
              <option value="TODOS">Todas las acciones</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CHECK_IN">Check-in</option>
              <option value="CHECK_OUT">Check-out</option>
              <option value="STATUS_CHANGE">Cambio estado</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-xl border border-[#e0d4ca] bg-white px-3 py-2 text-[11px] outline-none focus:border-[#b08f7c]"
            >
              <option value="TODOS">Todas las entidades</option>
              {uniqueEntities.map((entity) => (
                <option key={entity} value={entity}>
                  {entity}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-2 rounded-xl border border-[#eadfd6] bg-white px-4 py-2">
          <p className="text-[10px] text-[#7d6d61]">
            Mostrando {filteredLogs.length} de {total} registros
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[20px] border border-[#eadfd6] bg-white p-3 shadow-[0_16px_40px_rgba(67,42,27,0.08)]">
            {filteredLogs.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Filter className="mx-auto mb-2 text-[#8d7b70]" size={24} />
                  <p className="text-[11px] text-[#7d6d61]">No se encontraron registros</p>
                </div>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 rounded-xl border border-[#ece0d7] bg-[#fcfaf8] p-3 transition hover:border-[#d4c8be]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0dfc9]">
                        <User size={14} className="text-[#4b2b21]" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-[#2b1b14]">{log.user.fullName}</p>
                        <p className="text-[10px] text-[#7d6d61]">
                          {log.user.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${actionColors[log.action]}`}
                      >
                        {actionLabels[log.action]}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-[#7d6d61]">
                        <Calendar size={12} />
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 rounded-lg border border-[#e9ddd3] bg-white px-3 py-2">
                    <p className="text-[11px] text-[#2b1b14]">{log.description}</p>
                    {log.entity && (
                      <p className="mt-1 text-[10px] text-[#8d7b70]">
                        Entidad: <span className="font-medium">{log.entity}</span>
                        {log.entityId && <span className="ml-1">({log.entityId})</span>}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
