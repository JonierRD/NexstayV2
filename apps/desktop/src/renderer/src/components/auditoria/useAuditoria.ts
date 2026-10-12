import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteAuditLogRequest, deleteAuditLogsRequest, type AuditAction, type AuditLog, auditoriaRequest } from '../../lib/api';

const PAGE_SIZE = 50;

export function useAuditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'TODOS'>('TODOS');
  const [entityFilter, setEntityFilter] = useState('TODOS');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [entities, setEntities] = useState<string[]>([]);

  // Los filtros se aplican en el servidor: filtrar solo la pagina cargada
  // escondia los registros mas viejos y hacia creer que no existian.
  const loadLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await auditoriaRequest({
        action: actionFilter === 'TODOS' ? undefined : actionFilter,
        entity: entityFilter === 'TODOS' ? undefined : entityFilter,
        search: search.trim() || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      });
      setLogs(response.logs);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, search, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Cualquier cambio de filtro vuelve a la primera pagina.
  const applySearch = useCallback((value: string) => {
    setPage(0);
    setSearch(value);
  }, []);

  const applyAction = useCallback((value: AuditAction | 'TODOS') => {
    setPage(0);
    setActionFilter(value);
  }, []);

  const applyEntity = useCallback((value: string) => {
    setPage(0);
    setEntityFilter(value);
  }, []);

  const deleteLogs = useCallback(async (ids: number[]) => {
    if (ids.length === 1) {
      await deleteAuditLogRequest(ids[0]);
    } else {
      await deleteAuditLogsRequest(ids);
    }
    setLogs((current) => current.filter((log) => !ids.includes(log.id)));
    setTotal((current) => Math.max(0, current - ids.length));
    await loadLogs(false);
  }, [loadLogs]);

  const deleteLog = useCallback(async (id: number) => {
    await deleteLogs([id]);
  }, [deleteLogs]);

  // Las entidades disponibles se consultan aparte, sin filtro de entidad, para
  // que el desplegable no se vacie al filtrar.
  useEffect(() => {
    let cancelled = false;

    auditoriaRequest({ limit: 500 })
      .then((response) => {
        if (cancelled) return;
        setEntities(Array.from(new Set(response.logs.map((log) => log.entity))).sort());
      })
      .catch(() => {
        if (!cancelled) setEntities([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page + 1 < totalPages;

  const rangeLabel = useMemo(() => {
    if (total === 0) return '0 de 0';
    const from = page * PAGE_SIZE + 1;
    const to = Math.min((page + 1) * PAGE_SIZE, total);
    return `${from}-${to} de ${total}`;
  }, [page, total]);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return logs.filter((log) => new Date(log.createdAt).toISOString().slice(0, 10) === today).length;
  }, [logs]);

  return {
    logs,
    loading,
    total,
    search,
    setSearch: applySearch,
    actionFilter,
    setActionFilter: applyAction,
    entityFilter,
    setEntityFilter: applyEntity,
    uniqueEntities: entities,
    page,
    totalPages,
    todayCount,
    rangeLabel,
    canPrev,
    canNext,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setPage((p) => Math.max(p - 1, 0)),
    deleteLog,
    deleteLogs
  };
}