import { BedDouble, CheckCircle, Clock3, Gavel, Plus } from 'lucide-react';
import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { RoomFormModal } from '../components/RoomFormModal';
import { RoomDetailCard } from '../components/habitaciones/RoomDetailCard';
import { RoomsTable } from '../components/habitaciones/RoomsTable';
import { useHabitaciones } from '../components/habitaciones/useHabitaciones';
import { AccentButton } from '../components/ui/accent-button';
import { FilterSelect } from '../components/ui/filter-select';
import { SearchInput } from '../components/ui/search-input';
import { StatCard } from '../components/ui/stat-card';

const statsConfig = [
  { key: 'total', icon: BedDouble, title: 'Total Habitaciones', detail: 'Habitaciones registradas', tone: 'from-[#f0dfc9] to-[#f7efe4]' },
  { key: 'ocupadas', icon: BedDouble, title: 'Ocupadas', detail: null as string | null, tone: 'from-[#efd7cb] to-[#f8efe6]' },
  { key: 'disponibles', icon: CheckCircle, title: 'Disponibles', detail: null as string | null, tone: 'from-[#f0e3c8] to-[#fbf3df]' },
  { key: 'reservadas', icon: Clock3, title: 'Reservadas', detail: null as string | null, tone: 'from-[#f3e2c8] to-[#fff5df]' },
  { key: 'mantenimiento', icon: Gavel, title: 'Mantenimiento', detail: null as string | null, tone: 'from-[#eed9cc] to-[#f9efe6]' }
] as const;

export function HabitacionesPage({ user }: { user: PublicUser }): ReactElement {
  const h = useHabitaciones({ user });

  if (h.loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250">
        <div className="text-[11px] text-sapay-750">Cargando habitaciones...</div>
      </div>
    );
  }

  const statDetail = (key: 'total' | 'ocupadas' | 'disponibles' | 'reservadas' | 'mantenimiento') =>
    key === 'total' ? 'Habitaciones registradas' : h.pct(h.stats[key]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-sapay-250 text-sapay-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        <div className="grid gap-2 py-2 xl:grid-cols-5">
          {statsConfig.map((cfg) => (
            <StatCard
              key={cfg.key}
              icon={cfg.icon}
              title={cfg.title}
              value={String(h.stats[cfg.key])}
              detail={cfg.detail ?? statDetail(cfg.key)}
              tone={cfg.tone}
            />
          ))}
        </div>

        {h.imageError && (
          <div className="mb-2 rounded-xl border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">
            {h.imageError}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
          <section className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-sapay-350 bg-white p-3 shadow-[0_16px_40px_rgba(67,42,27,0.08)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between w-full">
              <div className="min-w-[200px]">
                <h2 className="text-[13px] font-semibold text-sapay-950">Lista de Habitaciones</h2>
              </div>

              <div className="flex items-center gap-1.5 flex-1 justify-end overflow-x-auto">
                <SearchInput value={h.search} onChange={h.setSearch} placeholder="Buscar habitación..." />

                <FilterSelect label="Estado" value={h.statusFilter} onChange={h.setStatusFilter} options={['TODOS', 'DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO']} />
                <FilterSelect label="Estilo" value={h.styleFilter} onChange={h.setStyleFilter} options={['TODOS', 'SENCILLA', 'MATRIMONIAL', 'DOS CAMAS']} />
                <FilterSelect label="A/V" value={h.fanFilter} onChange={h.setFanFilter} options={['TODOS', 'Ventilador', 'Sin Ventilador']} />

                <AccentButton
                  onClick={() => h.requireAuth('create')}
                  className="gap-1.5 bg-sapay-900 text-white hover:bg-[#5b3428] h-8 text-[11px] shrink-0"
                >
                  <Plus size={14} aria-hidden="true" />
                  Nueva
                </AccentButton>
              </div>
            </div>

            <RoomsTable
              rooms={h.filteredRooms}
              selectedNumber={h.selectedRoom?.number}
              onSelect={h.setSelectedRoomNumber}
              onEdit={(number) => h.requireAuth('edit', number)}
            />
          </section>

          {h.selectedRoom && (
            <RoomDetailCard
              room={h.selectedRoom}
              canManageImage={h.isAdmin}
              onLiberar={() => h.requireAuth('liberar', h.selectedRoom!.number)}
              onAddImage={() => h.handleAddImage(h.selectedRoom!.number)}
              onRemoveImage={() => h.handleRemoveImage(h.selectedRoom!.number)}
            />
          )}

          {!h.selectedRoom && (
            <section className="flex min-h-0 w-full flex-col rounded-[26px] border border-sapay-350 bg-white shadow-[0_20px_50px_rgba(67,42,27,0.08)] xl:w-[420px] items-center justify-center">
              <div className="text-center">
                <p className="text-[13px] font-medium text-sapay-650">Selecciona una habitación</p>
                <p className="mt-1 text-[11px] text-sapay-550">para ver los detalles</p>
              </div>
            </section>
          )}
        </div>
      </div>

      {h.showAdminAuth && (
        <AdminPasswordModal
          onSuccess={h.onAdminAuthorized}
          onClose={h.closeAdminAuth}
        />
      )}

      {h.showRoomForm && (
        <RoomFormModal
          room={h.editingRoom ?? undefined}
          onSave={h.onSaveRoom}
          onDelete={h.onDeleteRoom}
          onClose={h.closeRoomForm}
          adminPassword={h.adminAuthPassword ?? undefined}
        />
      )}

      <input
        ref={h.imageFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={h.handleImagePick}
      />

      {h.confirmAction && (
        <ConfirmModal
          title={h.confirmTitle}
          message={h.confirmMessage}
          confirmLabel={h.confirmLabel}
          confirmDanger={h.confirmDanger}
          onConfirm={h.confirm}
          onClose={h.closeConfirm}
        />
      )}
    </div>
  );
}