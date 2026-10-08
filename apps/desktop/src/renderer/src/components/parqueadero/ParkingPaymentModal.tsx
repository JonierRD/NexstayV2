import { type FormEvent, type ReactElement, useState } from 'react';
import { type ParkingSession } from '../../lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { billableHours, formatParkingMoney, sessionDuration, sessionTotal } from './types';

type Props = {
  session: ParkingSession;
  onSubmit: () => Promise<void>;
  onClose: () => void;
};

export function ParkingPaymentModal({ session, onSubmit, onClose }: Props): ReactElement {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const amount = sessionTotal(session);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo registrar el cobro.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={`${session.isHosted ? 'Exención de parqueadero' : 'Cobrar parqueadero'} · ${session.licensePlate}`} maxWidthClass="max-w-md">
      <form onSubmit={submit} className="space-y-3">
      {session.isHosted && <p className="rounded-lg border border-success-100 bg-success-50 px-3 py-2 text-[11px] text-success">El titular está hospedado. Se cerrará la sesión sin generar cobro.</p>}
        <div className="rounded-lg border border-sapay-300 bg-sapay-100 p-3 text-xs">
          <p className="flex justify-between"><span className="text-sapay-750">Tiempo estacionado</span><strong>{sessionDuration(session)}</strong></p>
          <p className="mt-1 flex justify-between"><span className="text-sapay-750">Horas cobradas</span><strong>{billableHours(session)}</strong></p>
          <p className="mt-1 flex justify-between"><span className="text-sapay-750">Tarifa por hora</span><strong>{formatParkingMoney(session.hourlyRate)}</strong></p>
          <p className="mt-2 flex justify-between border-t border-sapay-300 pt-2"><span className="font-medium text-sapay-900">Total recibido</span><strong className="text-sm text-sapay-950">{formatParkingMoney(amount)}</strong></p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">{error}</p>}
        <Button disabled={saving || amount <= 0} className="h-9 w-full rounded-lg bg-sapay-900 text-xs text-white">
          {saving ? 'Registrando...' : session.isHosted ? 'Confirmar exención' : 'Confirmar pago'}
        </Button>
      </form>
    </Modal>
  );
}