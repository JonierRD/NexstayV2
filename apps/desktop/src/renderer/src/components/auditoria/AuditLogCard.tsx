import { Calendar, User } from 'lucide-react';
import { type ReactElement } from 'react';
import { type AuditLog } from '../../lib/api';
import { actionColors, actionLabels, formatAuditDate } from './constants';

export function AuditLogCard({ log }: { log: AuditLog }): ReactElement {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-sapay-300 bg-sapay-100 p-3 transition hover:border-[#d4c8be]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0dfc9]">
            <User size={14} className="text-sapay-900" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-sapay-950">{log.user.fullName}</p>
            <p className="text-[10px] text-sapay-750">
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
          <div className="flex items-center gap-1 text-[10px] text-sapay-750">
            <Calendar size={12} />
            {formatAuditDate(log.createdAt)}
          </div>
        </div>
      </div>

      <div className="mt-1 rounded-lg border border-[#e9ddd3] bg-white px-3 py-2">
        <p className="text-[11px] text-sapay-950">{log.description}</p>
        {log.entity && (
          <p className="mt-1 text-[10px] text-sapay-650">
            Entidad: <span className="font-medium">{log.entity}</span>
            {log.entityId && <span className="ml-1">({log.entityId})</span>}
          </p>
        )}
      </div>
    </div>
  );
}