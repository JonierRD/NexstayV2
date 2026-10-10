import { X } from 'lucide-react';
import { type ReactElement } from 'react';
import { type Cliente } from '../../lib/api';
import { formatCOP, formatDateTime } from '../../lib/format';

export function ClientHistoryModal({ client, onClose }: { client: Cliente; onClose: () => void }): ReactElement {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/20"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[80vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-5">
        <button onClick={onClose} className="absolute right-3 top-3">
          <X size={18} />
        </button>
        <h2 className="text-base font-semibold">
          Historial de {client.firstName} {client.lastName}
        </h2>
        <div className="mt-3 rounded-xl border border-sapay-350 bg-[#fcf8f4] p-4 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <p>
              <span className="text-sapay-750">Nombre: </span>
              <span className="font-medium">{client.firstName} {client.lastName}</span>
            </p>
            <p>
              <span className="text-sapay-750">Cédula: </span>
              <span className="font-medium">{client.cc}</span>
            </p>
            <p>
              <span className="text-sapay-750">Teléfono: </span>
              <span className="font-medium">{client.phone || 'Sin teléfono'}</span>
            </p>
            <p>
              <span className="text-sapay-750">Profesión: </span>
              <span className="font-medium">{client.profession || 'Sin profesión'}</span>
            </p>
            <p>
              <span className="text-sapay-750">Ciudad de origen: </span>
              <span className="font-medium">{client.cityOrigin || '-'}</span>
            </p>
            <p>
              <span className="text-sapay-750">Ciudad de destino: </span>
              <span className="font-medium">{client.cityDestination || '-'}</span>
            </p>
            {client.notes ? (
              <p className="col-span-2">
                <span className="text-sapay-750">Notas: </span>
                <span className="font-medium">{client.notes}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {client.stays?.length ? (
            client.stays.map((stay) => (
              <div key={stay.id} className="rounded-lg border border-sapay-350 p-3 text-xs">
                <div className="flex justify-between font-medium">
                  <span>Habitación {stay.roomNumber} · {stay.nights} {stay.nights === 1 ? 'noche' : 'noches'}</span>
                  <span className={stay.status === 'ACTIVA' ? 'text-success' : 'text-sapay-750'}>
                    {stay.status === 'ACTIVA' ? 'ACTIVA' : stay.checkOut ? 'FINALIZADA' : stay.status}
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-1 gap-0.5 text-sapay-750">
                  <p>
                    <span className="text-sapay-650">Ingreso: </span>
                    <span className="font-medium text-sapay-950">{formatDateTime(stay.checkIn)}</span>
                  </p>
                  <p>
                    <span className="text-sapay-650">Salida: </span>
                    <span className="font-medium text-sapay-950">
                      {stay.checkOut ? formatDateTime(stay.checkOut) : 'En curso'}
                    </span>
                  </p>
                </div>
                <p className="mt-1 text-sapay-750">
                  {stay.acTypeUsed === 'AIRE' ? 'Aire' : 'Ventilador'} · $
                  {formatCOP(Number(stay.pricePerNight))}/noche
                </p>
                <p className="text-sapay-750">
                  Total: <span className="font-medium text-sapay-950">{formatCOP(Number(stay.total))}</span>
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-sapay-650">Este cliente aún no tiene hospedajes.</p>
          )}
        </div>
      </div>
    </div>
  );
}