import { CalendarDays, Download, RefreshCw, Trash2, UserRound } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type PublicUser } from '../lib/api';
import { CheckoutModal } from '../components/huespedes/CheckoutModal';
import { GuestCard } from '../components/huespedes/GuestCard';
import { PaymentModal } from '../components/huespedes/PaymentModal';
import { StayHistoryList } from '../components/huespedes/StayHistoryList';
import { StayDetailModal } from '../components/huespedes/StayDetailModal';
import { useHuespedes } from '../components/huespedes/useHuespedes';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { AdminPasswordModal } from '../components/ui/AdminPasswordModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ModuleHeader } from '../components/ui/ModuleHeader';

type Props = { user: PublicUser };
type Tab = 'activos' | 'salidos' | 'historial';

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'activos', label: 'Activos' },
  { id: 'salidos', label: 'Salidos hoy' },
  { id: 'historial', label: 'Historial' }
];

export function HuespedesPage({ user }: Props): ReactElement {
  const g = useHuespedes();
  const [tab, setTab] = useState<Tab>('activos');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const canDelete = user.role === 'ADMIN';

  const salidosHoy = g.filteredHistory.filter((stay) => stay.checkOut && isToday(stay.checkOut));
  const visibleHistory = tab === 'salidos' ? salidosHoy : g.filteredHistory;
  const activeGuests = g.stays.length;

  function exportStays(): void {
    const rows = visibleHistory.map((stay) => [
      stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : '',
      stay.client?.cc ?? '', stay.roomNumber, stay.checkIn, stay.checkOut ?? '',
      String(stay.nights), String(stay.total), stay.status
    ]);
    const csv = [['Cliente', 'Cédula', 'Habitación', 'Entrada', 'Salida', 'Noches', 'Total', 'Estado'], ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = `hospedajes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="module-page flex h-full flex-col overflow-auto">
      <ModuleHeader icon={UserRound} title="Huéspedes" subtitle="Personas alojadas, salidas del día e historial de hospedajes." metrics={[
        { label: 'Activos', value: activeGuests, icon: UserRound },
        { label: 'Salidas hoy', value: salidosHoy.length, icon: CalendarDays }
      ]} />
      <div className="flex flex-wrap items-center justify-end gap-2">
          {tab !== 'activos' && <Button onClick={exportStays} className="h-8 rounded-lg border border-sapay-450 bg-white px-3 text-xs text-sapay-900"><Download size={13} /> Exportar hospedajes</Button>}
          <Button onClick={() => void g.load()} className="h-8 rounded-lg border border-sapay-450 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-200"><RefreshCw size={13} /> Actualizar</Button>
          <div className="flex items-center gap-1 rounded-xl border border-sapay-350 bg-white p-1">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${tab === t.id ? 'bg-sapay-900 text-white shadow-sm' : 'text-sapay-750 hover:bg-sapay-150'}`}>{t.label}</button>
            ))}
          </div>
        </div>

      {/* Pestañas */}
      {/* Búsqueda para las vistas de salidas/historial */}
      {tab !== 'activos' && (
        <SearchInput
          value={g.historyQuery}
          onChange={g.setHistoryQuery}
          placeholder="Buscar por nombre, cédula o habitación"
        />
      )}

      {g.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-xs text-[#b33a3a]">
          {g.error}
        </div>
      )}

      {g.loading ? (
        <div className="rounded-lg border border-sapay-350 bg-white p-8 text-center text-xs text-sapay-650">
          Cargando huéspedes...
        </div>
      ) : tab === 'activos' ? (
        g.stays.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d8c7bb] bg-white p-10 text-center text-xs text-sapay-650">
            No hay huéspedes activos.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {g.stays.map((stay) => (
              <GuestCard
                key={stay.id}
                stay={stay}
                onCheckout={g.handleCheckoutClick}
                onPay={g.handlePaymentClick}
              />
            ))}
          </div>
        )
      ) : (
        <StayHistoryList
          stays={visibleHistory}
          onView={g.setDetailStay}
          canDelete={canDelete}
          selectedIds={g.selectedHistoryIds}
          onToggle={(id) => g.setSelectedHistoryIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })}
          onToggleAll={() => g.setSelectedHistoryIds((current) => visibleHistory.every((stay) => current.has(stay.id)) ? new Set() : new Set(visibleHistory.map((stay) => stay.id)))}
          onDelete={(stay) => { g.setSelectedHistoryIds(new Set([stay.id])); setConfirmDelete(true); }}
          emptyMessage={
            tab === 'salidos'
              ? 'No hubo salidas registradas hoy.'
              : 'Aún no hay hospedajes finalizados o cancelados.'
          }
        />
      )}

      {g.checkoutStay && (
        <CheckoutModal
          stay={g.checkoutStay}
          onClose={() => g.setCheckoutStay(null)}
          onConfirm={(nights, method, confirmed) => void g.confirmCheckout(nights, method, confirmed)}
          isProcessing={g.isCheckingOut}
        />
      )}

      {g.paymentStay && (
        <PaymentModal
          stay={g.paymentStay}
          onClose={() => g.setPaymentStay(null)}
          onConfirm={(amount, method, reference) => void g.confirmPayment(amount, method, reference)}
          isProcessing={g.isRegisteringPayment}
        />
      )}
      {g.detailStay && <StayDetailModal stay={g.detailStay} onClose={() => g.setDetailStay(null)} />}
      {canDelete && g.selectedHistoryIds.size > 0 && <Button onClick={() => setConfirmDelete(true)} className="fixed bottom-5 right-5 z-20 rounded-lg bg-danger px-3 py-2 text-xs text-white"><Trash2 size={13} /> Eliminar seleccionados ({g.selectedHistoryIds.size})</Button>}
      {confirmDelete && <ConfirmModal title="Eliminar hospedajes" message={`¿Seguro que deseas eliminar ${g.selectedHistoryIds.size} hospedaje(s) seleccionados? Esta acción también elimina sus pagos y consumos asociados.`} confirmDanger onClose={() => setConfirmDelete(false)} onConfirm={() => { setConfirmDelete(false); setShowPassword(true); }} />}
      {showPassword && <AdminPasswordModal onClose={() => setShowPassword(false)} onSuccess={(password) => { setShowPassword(false); void g.removeHistory([...g.selectedHistoryIds], password).catch((reason) => g.setError?.(reason instanceof Error ? reason.message : 'No se pudieron eliminar los hospedajes.')); }} />}
    </div>
  );
}