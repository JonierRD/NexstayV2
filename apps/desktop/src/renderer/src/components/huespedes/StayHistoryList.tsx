import { type ReactElement } from 'react';
import { type Stay } from '../../lib/api';
import { formatCOP, formatDateTime } from '../../lib/format';

type Props = {
  stays: Stay[];
  emptyMessage: string;
};

export function StayHistoryList({ stays, emptyMessage }: Props): ReactElement {
  return (
    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-2xl border border-sapay-350 bg-white">
      {stays.length === 0 ? (
        <div className="border border-dashed border-[#d8c7bb] bg-white p-10 text-center text-xs text-sapay-650">
          {emptyMessage}
        </div>
      ) : (
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="sticky top-0 bg-[#fcf8f4] text-[10px] uppercase tracking-wider text-sapay-750">
            <tr>
              <th className="px-4 py-2.5">Cliente</th>
              <th className="px-4 py-2.5">Habitación</th>
              <th className="px-4 py-2.5">Ingreso</th>
              <th className="px-4 py-2.5">Salida</th>
              <th className="px-4 py-2.5 text-center">Noches</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-4 py-2.5 text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {stays.map((stay) => {
              const guest = stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre';
              const finished = stay.status === 'FINALIZADA';
              return (
                <tr key={stay.id} className="border-t border-[#f0e7e0] hover:bg-[#fffaf6]">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-sapay-950">{guest}</p>
                    <p className="text-[10px] text-sapay-650">CC: {stay.client?.cc ?? 'No disponible'}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-sapay-900">{stay.roomNumber}</span>{' '}
                    <span className="text-[10px] text-sapay-650">
                      ({stay.acTypeUsed === 'AIRE' ? 'Aire' : 'Vent.'})
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sapay-800">{formatDateTime(stay.checkIn)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-sapay-800">
                    {stay.checkOut ? formatDateTime(stay.checkOut) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center text-sapay-800">
                    {stay.nights} {stay.nights === 1 ? 'noche' : 'noches'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-sapay-950">
                    {formatCOP(Number(stay.total))}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`float-right rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        finished ? 'bg-[#e8f5ec] text-[#287344]' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {stay.status === 'FINALIZADA' ? 'Salida' : 'Cancelada'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}