import { Car, CircleDollarSign, Plus, SlidersHorizontal, Wallet } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';
import { type ParkingRatesInput, type ParkingSession, type ParkingSessionInput, type PublicUser } from '../lib/api';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SearchInput } from '../components/ui/SearchInput';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { ParkingDetailCard } from '../components/parqueadero/ParkingDetailCard';
import { ParkingFormModal } from '../components/parqueadero/ParkingFormModal';
import { ParkingPaymentModal } from '../components/parqueadero/ParkingPaymentModal';
import { ParkingRatesModal } from '../components/parqueadero/ParkingRatesModal';
import { ParkingTable } from '../components/parqueadero/ParkingTable';
import { useParqueadero } from '../components/parqueadero/useParqueadero';
import { formatParkingMoney, sessionTotal } from '../components/parqueadero/types';

export function ParqueaderoPage(_props: { user: PublicUser }): ReactElement {
  const parking = useParqueadero();
  const [showEntry, setShowEntry] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [closingSession, setClosingSession] = useState<ParkingSession | null>(null);
  const [payingSession, setPayingSession] = useState<ParkingSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const openSessions = parking.records.filter((session) => session.status === 'EN_CURSO');
  const pendingSessions = parking.records.filter((session) => session.status === 'PENDIENTE_PAGO');
  const pendingTotal = pendingSessions.reduce((total, session) => total + sessionTotal(session, now), 0);
  const todayKey = new Date(now).toLocaleDateString('en-CA');
  const collectedToday = parking.records
    .filter((session) => session.status === 'PAGADO' && session.paidAt && new Date(session.paidAt).toLocaleDateString('en-CA') === todayKey)
    .reduce((total, session) => total + sessionTotal(session, now), 0);

  async function startSession(input: ParkingSessionInput): Promise<void> {
    await parking.start(input);
    setShowEntry(false);
  }

  async function checkoutSession(): Promise<void> {
    if (!closingSession) return;
    setError('');
    try {
      await parking.checkout(closingSession.id);
      setClosingSession(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo registrar la salida.');
      setClosingSession(null);
    }
  }

  async function paySession(): Promise<void> {
    if (!payingSession) return;
    setError('');
    try {
      await parking.pay(payingSession.id);
      setPayingSession(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo registrar el pago.');
      setPayingSession(null);
    }
  }

  async function saveRates(input: ParkingRatesInput): Promise<void> {
    await parking.saveRates(input);
  }

  if (parking.loading && parking.records.length === 0) {
    return <div className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250 text-xs text-sapay-750">Cargando parqueadero...</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-sapay-250 p-4 text-sapay-950">
      <div className="grid shrink-0 gap-2 md:grid-cols-3">
        <StatCard icon={Car} title="Vehículos en parqueadero" value={String(openSessions.length)} detail="Sesiones en curso" tone="from-[#dbe8f5] to-[#eef5fc]" />
        <StatCard icon={Wallet} title="Por cobrar" value={formatParkingMoney(pendingTotal)} detail={`${pendingSessions.length} salida(s) pendientes`} tone="from-[#f3e2c8] to-[#fff5df]" />
        <StatCard icon={CircleDollarSign} title="Recaudado hoy" value={formatParkingMoney(collectedToday)} detail="Sesiones pagadas" tone="from-[#d9efdd] to-[#eefaf0]" />
      </div>

      {(error || parking.error) && <div role="alert" className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-xs text-[#b33a3a]">{error || parking.error}</div>}

      <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
        <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-sapay-350 bg-white p-3">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-sm font-semibold">Control de parqueadero</h1>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={parking.search} onChange={parking.setSearch} placeholder="Buscar nombre, cédula o placa" />
              <Button onClick={() => setShowRates(true)} className="h-8 gap-1.5 rounded-lg border border-sapay-400 bg-white px-3 text-xs text-sapay-900"><SlidersHorizontal size={14} />Tarifas</Button>
              <Button onClick={() => setShowEntry(true)} className="h-8 gap-1.5 rounded-lg bg-sapay-900 px-3 text-xs text-white"><Plus size={14} />Registrar entrada</Button>
            </div>
          </header>
          <ParkingTable records={parking.filteredRecords} selectedId={parking.selected?.id ?? null} now={now} onSelect={parking.setSelectedId} />
        </section>

        {parking.selected ? <ParkingDetailCard
          session={parking.selected}
          now={now}
          onCheckout={() => setClosingSession(parking.selected)}
          onPay={() => setPayingSession(parking.selected)}
        /> : <section className="flex min-h-[180px] items-center justify-center rounded-xl border border-sapay-350 bg-white p-6 text-center text-xs text-sapay-650 xl:w-[360px]">Registra una entrada para comenzar.</section>}
      </div>

      {showEntry && parking.rates && <ParkingFormModal rates={parking.rates} onSubmit={startSession} onClose={() => setShowEntry(false)} />}
      {showRates && parking.rates && <ParkingRatesModal rates={parking.rates} onSave={saveRates} onClose={() => setShowRates(false)} />}
      {payingSession && <ParkingPaymentModal session={payingSession} onSubmit={paySession} onClose={() => setPayingSession(null)} />}
      {closingSession && <ConfirmModal
        title="¿Registrar la salida del vehículo?"
        message="Se calculará el cobro con la tarifa horaria guardada al registrar la entrada."
        confirmLabel="Registrar salida"
        onConfirm={() => { void checkoutSession(); }}
        onClose={() => setClosingSession(null)}
      />}
    </div>
  );
}