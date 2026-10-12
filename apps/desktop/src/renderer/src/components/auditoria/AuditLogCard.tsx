import { Calendar, Clock3, FileText, Pencil, Plus, Settings, Trash2, User, Users } from 'lucide-react';
import { type ReactElement } from 'react';
import { type AuditLog } from '../../lib/api';
import { formatDateTimeNumeric } from '../../lib/format';
import { actionColors, actionLabels } from './constants';

export function AuditLogCard({ log, canDelete, selected, onToggleSelect }: { log: AuditLog; canDelete?: boolean; selected?: boolean; onToggleSelect?: (log: AuditLog) => void }): ReactElement {
  const actionIcon = log.action === 'CREATE' ? Plus : log.action === 'DELETE' ? Trash2 : Pencil;
  const EntityIcon = log.entity?.toLowerCase().includes('user') || log.entity?.toLowerCase().includes('usuario')
    ? Users
    : log.entity?.toLowerCase().includes('setting') || log.entity?.toLowerCase().includes('config')
      ? Settings
      : FileText;
  const ActionIcon = actionIcon;
  const [date, time] = formatDateTimeNumeric(log.createdAt).split(' ');

  return (
    <div className={`audit-row relative grid gap-3 rounded-xl border px-3 py-3 pl-4 transition md:grid-cols-[24px_1.2fr_0.8fr_1.2fr_2fr_1fr] md:items-center ${log.action === 'CREATE' ? 'before:bg-blue-600' : log.action === 'DELETE' ? 'before:bg-red-500' : log.action === 'LOGIN' ? 'before:bg-teal-500' : 'before:bg-emerald-500'} before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-xl`}>
      {canDelete && onToggleSelect && (
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(log)} className="h-4 w-4 accent-sapay-900" aria-label={`Seleccionar registro de ${log.user.fullName}`} />
      )}
      <div className="flex items-center gap-2">
        <div className="audit-user-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
          <User size={15} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-sapay-950">{log.user.fullName}</p>
          <p className="text-[10px] text-sapay-650">{log.user.role === 'ADMIN' ? 'Administrador' : log.user.role === 'CLEANING' ? 'Personal de limpieza' : 'Recepcionista'}</p>
        </div>
      </div>
      <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold ${actionColors[log.action]}`}><ActionIcon size={12} />{actionLabels[log.action]}</span>
      <div className="flex items-center gap-2">
        <div className="audit-entity-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full"><EntityIcon size={15} /></div>
        <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-sapay-900">{log.entity || 'Sistema'}</p><p className="truncate text-[10px] text-sapay-650">{log.entity ? `${log.entity}${log.entityId ? ` (${log.entityId})` : ''}` : 'Registro'}</p></div>
      </div>
      <div className="min-w-0"><p className="truncate text-[11px] text-sapay-900">{log.description}</p><p className="truncate text-[10px] text-sapay-650">Entidad: {log.entity || 'Sistema'}{log.entityId ? ` (${log.entityId})` : ''}</p></div>
      <div className="flex items-center gap-2 text-[10px] text-sapay-650 md:justify-end">
        <div><p className="flex items-center gap-1"><Calendar size={12} />{date}</p><p className="mt-0.5 flex items-center gap-1"><Clock3 size={12} />{time}</p></div>
      </div>
    </div>
  );
}