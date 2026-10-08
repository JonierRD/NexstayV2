import { Check, CreditCard, LogOut } from 'lucide-react';
import { type ReactElement } from 'react';
import { type ParkingSession } from '../../lib/api';
import { Button } from '../ui/Button';
import { DetailLine } from '../ui/DetailLine';
import { billableHours, formatParkingDateTime, formatParkingMoney, parkingStatusLabels, sessionDuration, sessionTotal, statusTone, vehicleTypeLabels } from './types';

type Props = {
  session: ParkingSession;
  now: number;
  onCheckout: () => void;
  onPay: () => void;
};

export function ParkingDetailCard({ session, now, onCheckout, onPay }: Props): ReactElement {
  const total = sessionTotal(session, now);

  return (
    <aside className="flex min-h-0 w-full flex-col rounded-xl border border-sapay-350 bg-white p-4 xl:w-[360px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-sapay-950">{session.licensePlate}</h2>
          <p className="text-xs text-sapay-650">{vehicleTypeLabels[session.vehicleType]} · {session.vehicleLine}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${statusTone(session.status)}`}>{session.isHosted ? 'Huésped · Gratis' : parkingStatusLabels[session.status]}</span>
      </div>

      <div className="mt-3 rounded-lg border border-sapay-300 bg-[#fcf8f4] p-3 text-xs">
        <DetailLine label="Titular" value={session.ownerName} />
        <DetailLine label="Cédula" value={session.ownerCc} />
        <DetailLine label="Teléfono" value={session.phone} />
        <DetailLine label="Entrada" value={formatParkingDateTime(session.entryAt)} />
        {session.exitAt && <DetailLine label="Salida" value={formatParkingDateTime(session.exitAt)} />}
      </div>

      <div className="mt-2 rounded-lg border border-sapay-300 bg-[#fcf8f4] p-3 text-xs">
        <DetailLine label="Tiempo" value={sessionDuration(session, now)} />
        <DetailLine label="Horas cobradas" value={String(billableHours(session, now))} />
        <DetailLine label="Tarifa aplicada" value={`${formatParkingMoney(session.hourlyRate)} / hora`} />
        <DetailLine label="Total" value={formatParkingMoney(total)} />
      </div>

      {session.isHosted && <p className="mt-2 rounded-lg border border-success-100 bg-success-50 p-3 text-xs text-success">Este vehículo pertenece a una persona hospedada. No se cobra parqueadero.</p>}
      {session.notes && <p className="mt-2 rounded-lg border border-sapay-300 bg-[#fcf8f4] p-3 text-xs text-sapay-750">{session.notes}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {session.status === 'EN_CURSO' && <Button onClick={onCheckout} className="h-9 w-full gap-1.5 rounded-lg bg-sapay-900 text-[11px] text-white"><LogOut size={14} />Registrar salida</Button>}
        {session.status === 'PENDIENTE_PAGO' && <Button onClick={onPay} className="h-9 w-full gap-1.5 rounded-lg bg-sapay-900 text-[11px] text-white">{session.isHosted ? <Check size={14} /> : <CreditCard size={14} />}{session.isHosted ? 'Confirmar exención' : `Cobrar ${formatParkingMoney(total)}`}</Button>}
        {session.status === 'PAGADO' && <p className="flex w-full items-center justify-center gap-1 rounded-lg bg-success-50 px-3 py-2 text-[11px] text-success"><Check size={14} />Pago registrado {session.paidAt ? `· ${formatParkingDateTime(session.paidAt)}` : ''}</p>}
        {session.status === 'EXONERADO' && <p className="w-full rounded-lg bg-sapay-100 px-3 py-2 text-center text-[11px] text-sapay-700">Sesión cerrada sin cobro.</p>}
      </div>
    </aside>
  );
}