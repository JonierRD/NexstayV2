import { type ReactElement } from 'react';
import { type ParkingSession } from '../../lib/api';
import { billableHours, formatParkingDateTime, formatParkingMoney, parkingStatusLabels, sessionDuration, sessionTotal, statusTone, vehicleTypeLabels } from './types';

type Props = {
  records: ParkingSession[];
  selectedId: number | null;
  now: number;
  onSelect: (id: number) => void;
};

export function ParkingTable({ records, selectedId, now, onSelect }: Props): ReactElement {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-sapay-350 bg-white">
      <table className="w-full min-w-[820px] text-left text-xs">
        <thead className="sticky top-0 bg-[#fcf8f4] text-[10px] uppercase text-sapay-750">
          <tr>
            <th className="px-3 py-2">Vehículo</th>
            <th className="px-3 py-2">Titular externo</th>
            <th className="px-3 py-2">Entrada</th>
            <th className="px-3 py-2 text-right">Tiempo</th>
            <th className="px-3 py-2 text-right">Horas</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const selected = record.id === selectedId;
            return (
              <tr key={record.id} className={`border-t border-[#f0e7e0] ${selected ? 'bg-[#fff7ef]' : 'hover:bg-[#fffaf6]'}`}>
                <td className="px-3 py-2.5">
                  <button type="button" onClick={() => onSelect(record.id)} className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapay-700">
                    <span className="font-semibold text-sapay-950">{record.licensePlate}</span>
                    <span className="block text-[10px] text-sapay-650">{vehicleTypeLabels[record.vehicleType]} · {record.vehicleLine}</span>
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <button type="button" onClick={() => onSelect(record.id)} className="text-left">
                    <span className="font-medium">{record.ownerName}</span>
                    <span className="block text-[10px] text-sapay-650">C.C. {record.ownerCc || 'Pendiente'}</span>
                  </button>
                </td>
                <td className="px-3 py-2.5 text-[11px]">{formatParkingDateTime(record.entryAt)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{sessionDuration(record, now)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{billableHours(record, now)}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{record.isHosted ? 'Gratis' : formatParkingMoney(sessionTotal(record, now))}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full border px-2 py-1 text-[10px] ${statusTone(record.status)}`}>{record.isHosted ? 'Huésped · Gratis' : parkingStatusLabels[record.status]}</span>
                </td>
              </tr>
            );
          })}
          {records.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-sapay-650">No hay sesiones para esta búsqueda.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}