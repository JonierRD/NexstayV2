import { useEffect, useState } from 'react';
import { type AuditAction, type AuditLog, auditoriaRequest } from '../../lib/api';

export function useAuditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'TODOS'>('TODOS');
  const [entityFilter, setEntityFilter] = useState('TODOS');
  const [total, setTotal] = useState(0);

  // PROCESO: Cargar el historial de auditoría desde la API (GET /auditoria)
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

  // PROCESO: Búsqueda y filtros por acción y entidad
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

  return {
    logs,
    loading,
    total,
    search,
    setSearch,
    actionFilter,
    setActionFilter,
    entityFilter,
    setEntityFilter,
    filteredLogs,
    uniqueEntities
  };
}