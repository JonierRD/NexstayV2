import { BedDouble, CheckCircle, Clock3, Gavel, Plus } from 'lucide-react';
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { type Habitacion, type PublicUser, habitacionesRequest, updateHabitacionRequest, staysByRoomRequest, checkoutRequest, staysActiveRequest } from '../lib/api';
import { AdminPasswordModal } from './AdminPasswordModal';
import { ConfirmModal } from './ConfirmModal';
import { RoomFormModal } from './RoomFormModal';
import { RoomDetailCard } from './habitaciones/RoomDetailCard';
import { RoomsTable } from './habitaciones/RoomsTable';
import { mapApiRoom, type Room, type RoomStatus } from './habitaciones/types';
import { AccentButton } from './ui/accent-button';
import { FilterSelect } from './ui/filter-select';
import { SearchInput } from './ui/search-input';
import { StatCard } from './ui/stat-card';

export function HabitacionesPage({ user }: { user: PublicUser }): ReactElement {
  const [rooms, setRooms] = useState<Room[]>([]);      // habitaciones ya mapeadas para UI
  const [apiRooms, setApiRooms] = useState<Habitacion[]>([]); // copia original de la API para editar
  const [loading, setLoading] = useState(true);
  // Filtros y orden de la lista
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | RoomStatus>('TODOS');
  const [styleFilter, setStyleFilter] = useState<'TODOS' | 'SENCILLA' | 'MATRIMONIAL' | 'DOS CAMAS'>('TODOS');
  const [fanFilter, setFanFilter] = useState<'TODOS' | 'Ventilador' | 'Sin Ventilador'>('TODOS');
  const [sortBy, setSortBy] = useState<'Número' | 'Tipo' | 'Precio'>('Número');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  // Modal de crear/editar habitación
  const [editingRoom, setEditingRoom] = useState<Habitacion | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  // Autorización de admin para acciones sensibles
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'edit' | 'liberar' | 'image' | null>(null);
  const [pendingRoomNumber, setPendingRoomNumber] = useState<string | null>(null);
  const [adminAuthPassword, setAdminAuthPassword] = useState<string | null>(null);
  // Subida de imagen
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const imageFileRef = useRef<HTMLInputElement>(null);
  // Modal de confirmación (liberar, eliminar imagen)
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmLabel, setConfirmLabel] = useState('Confirmar');
  const [confirmDanger, setConfirmDanger] = useState(false);
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB límite de imagen

  const isAdmin = user.role === 'ADMIN';

  // GET /habitaciones + GET /stays/active → mestrar huésped en cada habitación ocupada
  const loadRooms = useCallback(() => {
    setLoading(true);
    Promise.all([
      habitacionesRequest(),
      staysActiveRequest()
    ])
      .then(([roomsData, staysData]) => {
        setApiRooms(roomsData);

        // Mapa para cruzar cada habitación con su stay activo
        const staysByRoom = new Map();
        staysData.forEach(stay => {
          staysByRoom.set(stay.roomNumber, stay);
        });

        const mapped = roomsData.map((r, i) => {
          const room = mapApiRoom(r, i);
          const activeStay = staysByRoom.get(r.number);

          if (activeStay && activeStay.client) {
            room.guest = `${activeStay.client.firstName} ${activeStay.client.lastName}`;
            room.nights = activeStay.nights;
            room.checkIn = activeStay.checkIn;
            room.checkOut = activeStay.checkOut;
            room.selectedAc = activeStay.acTypeUsed;
            room.stayId = activeStay.id;
          }

          return room;
        });

        setRooms(mapped);
        if (mapped.length > 0 && !mapped.find((r) => r.number === selectedRoomNumber)) {
          setSelectedRoomNumber(mapped[0].number);
        }
      })
      .catch((error) => console.error('Error loading rooms:', error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Aplica búsqueda + filtros (estado, estilo, ventilador) + orden
  const filteredRooms = rooms.filter((room) => {
    const normalizedSearch = search.trim().toLowerCase();
    const styleLabel = room.type === 'DOSCAMAS' ? 'DOS CAMAS' : room.type;
    const matchesSearch =
      !normalizedSearch ||
      room.number.includes(normalizedSearch) ||
      room.description.toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === 'TODOS' || room.status === statusFilter;
    const matchesStyle = styleFilter === 'TODOS' || styleLabel === styleFilter;

    // Arreglar filtro de ventilador
    let matchesFan = true;
    if (fanFilter === 'Ventilador') {
      matchesFan = room.hasFan;
    } else if (fanFilter === 'Sin Ventilador') {
      matchesFan = !room.hasFan;
    }

    return matchesSearch && matchesStatus && matchesStyle && matchesFan;
  }).sort((a, b) => {
    const direction = sortOrder === 'asc' ? 1 : -1;

    if (sortBy === 'Número') {
      return a.number.localeCompare(b.number) * direction;
    } else if (sortBy === 'Tipo') {
      return a.type.localeCompare(b.type) * direction;
    } else if (sortBy === 'Precio') {
      const priceA = Math.max(a.priceWithAir, a.priceWithFan);
      const priceB = Math.max(b.priceWithAir, b.priceWithFan);
      return (priceA - priceB) * direction;
    }
    return 0;
  });

  // Habitación seleccionada (panel derecho) o la primera como default
  const selectedRoom =
    filteredRooms.find((room) => room.number === selectedRoomNumber) ??
    filteredRooms[0];

  // Conteos para las tarjetas de estadísticas del top
  const stats = {
    total: rooms.length,
    ocupadas: rooms.filter((room) => room.status === 'OCUPADA').length,
    disponibles: rooms.filter((room) => room.status === 'DISPONIBLE').length,
    reservadas: rooms.filter((room) => room.status === 'RESERVADA').length,
    mantenimiento: rooms.filter((room) => room.status === 'MANTENIMIENTO').length
  };

  const pct = (n: number) => stats.total > 0 ? `${((n / stats.total) * 100).toFixed(1)}% del total` : '0% del total';

  // Si es admin ejecuta directo, si no pide contraseña de admin primero
  function requireAuth(action: 'create' | 'edit' | 'liberar' | 'image', roomNumber?: string) {
    if (isAdmin) {
      executeAction(action, roomNumber);
    } else {
      setAdminAuthPassword(null);
      setPendingAction(action);
      setPendingRoomNumber(roomNumber ?? null);
      setShowAdminAuth(true);
    }
  }

  // Solo admin: abre el diálogo para elegir imagen (pusa 2MB)
  function handleAddImage(roomNumber: string) {
    if (!isAdmin) {
      return;
    }
    setPendingRoomNumber(roomNumber);
    imageFileRef.current?.click();
  }

  // Solo admin: confirma y pone image=null (vuelve la imagen por defecto)
  function handleRemoveImage(roomNumber: string) {
    if (!isAdmin) {
      return;
    }
    showConfirm(
      `¿Eliminar la imagen de la habitación ${roomNumber}?`,
      'La habitación volverá a mostrarse con su imagen por defecto.',
      'Sí, eliminar',
      true,
      () => updateHabitacionRequest(roomNumber, { image: null }).then(() => loadRooms()).catch(() => {})
    );
  }

  // Ejecuta la acción: abre modal de crear/editar o confirma liberar
  function executeAction(action: 'create' | 'edit' | 'liberar' | 'image', roomNumber?: string) {
    if (action === 'create') {
      setEditingRoom(null);
      setShowRoomForm(true);
    } else if (action === 'edit') {
      const apiRoom = apiRooms.find((r) => r.number === roomNumber);
      if (apiRoom) {
        setEditingRoom(apiRoom);
        setShowRoomForm(true);
      }
    } else if (action === 'liberar' && roomNumber) {
      showConfirm(
        `¿Liberar habitación ${roomNumber}?`,
        'La habitación quedará disponible para nuevos huéspedes.',
        'Sí, liberar',
        true,
        () => handleLiberar(roomNumber)
      );
    }
  }

  function showConfirm(title: string, message: string, label: string, danger: boolean, onConfirm: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmLabel(label);
    setConfirmDanger(danger);
    setConfirmAction(() => onConfirm);
  }

  function onAdminAuthorized(password: string) {
    setAdminAuthPassword(password);
    setShowAdminAuth(false);
    if (pendingAction) {
      executeAction(pendingAction, pendingRoomNumber ?? undefined);
      setPendingAction(null);
      if (pendingAction !== 'image') {
        setPendingRoomNumber(null);
      }
    }
  }

  function onSaveRoom() {
    setShowRoomForm(false);
    setEditingRoom(null);
    setAdminAuthPassword(null);
    loadRooms();
  }

  function onDeleteRoom(_number: string) {
    setShowRoomForm(false);
    setEditingRoom(null);
    setAdminAuthPassword(null);
    loadRooms();
  }

  // GET /stays/room/:number → si hay stay activo hace checkout, si no solo cambia estado
  async function handleLiberar(number: string) {
    try {
      // Primero buscar si hay un stay activo en esta habitación
      const stays = await staysByRoomRequest(number);
      const activeStay = stays.find(stay => stay.status === 'ACTIVA');

      if (activeStay) {
        // Si hay stay activo, hacer checkout completo
        await checkoutRequest(activeStay.id, {
          adminPassword: adminAuthPassword || undefined
        });
      } else {
        // Si no hay stay activo, solo cambiar estado (caso borde)
        await updateHabitacionRequest(number, {
          status: 'DISPONIBLE',
          ...(adminAuthPassword ? { adminPassword: adminAuthPassword } : {})
        });
      }

      loadRooms();
    } catch (err) {
      // Si el error es por hospedaje activo, mostrar mensaje específico
      const errorMessage = err instanceof Error ? err.message : 'Error al liberar la habitación.';
      if (errorMessage.includes('hospedaje activo')) {
        showConfirm(
          'No se puede liberar la habitación',
          errorMessage,
          'Entendido',
          false,
          () => {}
        );
      }
      // error handled by the request
    }
  }

  // Lee la imagen como base64 y la envía en PATCH /habitaciones/:number
  async function handleImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reseteamos el input para permitir volver a elegir el mismo archivo.
    event.target.value = '';
    if (!file || !pendingRoomNumber) return;

    // Validar tamaño del archivo (2MB)
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setImageError(`La imagen es demasiado grande (${sizeMB}MB). El máximo permitido es 2MB.`);
      return;
    }

    setUploadingImage(true);
    setImageError('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(file);
      });
      await updateHabitacionRequest(pendingRoomNumber, {
        image: base64,
        ...(adminAuthPassword ? { adminPassword: adminAuthPassword } : {})
      });
      setAdminAuthPassword(null);
      setPendingRoomNumber(null);
      loadRooms();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Error al subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f6f1eb]">
        <div className="text-[11px] text-[#7d6d61]">Cargando habitaciones...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f6f1eb] text-[#2b1b14]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        <div className="grid gap-2 py-2 xl:grid-cols-5">
          <StatCard
            icon={BedDouble}
            title="Total Habitaciones"
            value={String(stats.total)}
            detail="Habitaciones registradas"
            tone="from-[#f0dfc9] to-[#f7efe4]"
          />
          <StatCard
            icon={BedDouble}
            title="Ocupadas"
            value={String(stats.ocupadas)}
            detail={pct(stats.ocupadas)}
            tone="from-[#efd7cb] to-[#f8efe6]"
          />
          <StatCard
            icon={CheckCircle}
            title="Disponibles"
            value={String(stats.disponibles)}
            detail={pct(stats.disponibles)}
            tone="from-[#f0e3c8] to-[#fbf3df]"
          />
          <StatCard
            icon={Clock3}
            title="Reservadas"
            value={String(stats.reservadas)}
            detail={pct(stats.reservadas)}
            tone="from-[#f3e2c8] to-[#fff5df]"
          />
          <StatCard
            icon={Gavel}
            title="Mantenimiento"
            value={String(stats.mantenimiento)}
            detail={pct(stats.mantenimiento)}
            tone="from-[#eed9cc] to-[#f9efe6]"
          />
        </div>

        {imageError && (
          <div className="mb-2 rounded-xl border border-[#f1c2c2] bg-[#fff0f0] px-3 py-2 text-[11px] text-[#b33a3a]">
            {imageError}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
          <section className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-[#eadfd6] bg-white p-3 shadow-[0_16px_40px_rgba(67,42,27,0.08)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between w-full">
              <div className="min-w-[200px]">
                <h2 className="text-[13px] font-semibold text-[#2b1b14]">Lista de Habitaciones</h2>
              </div>

              <div className="flex items-center gap-1.5 flex-1 justify-end overflow-x-auto">
                <SearchInput value={search} onChange={setSearch} placeholder="Buscar habitación..." />

                <FilterSelect label="Estado" value={statusFilter} onChange={setStatusFilter} options={['TODOS', 'DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO']} />
                <FilterSelect label="Estilo" value={styleFilter} onChange={setStyleFilter} options={['TODOS', 'SENCILLA', 'MATRIMONIAL', 'DOS CAMAS']} />
                <FilterSelect label="A/V" value={fanFilter} onChange={setFanFilter} options={['TODOS', 'Ventilador', 'Sin Ventilador']} />

                <AccentButton
                  onClick={() => requireAuth('create')}
                  className="gap-1.5 bg-[#4b2b21] text-white hover:bg-[#5b3428] h-8 text-[11px] shrink-0"
                >
                  <Plus size={14} aria-hidden="true" />
                  Nueva
                </AccentButton>
              </div>
            </div>

            <RoomsTable
              rooms={filteredRooms}
              selectedNumber={selectedRoom?.number}
              onSelect={setSelectedRoomNumber}
              onEdit={(number) => requireAuth('edit', number)}
            />
          </section>

          {selectedRoom && (
            <RoomDetailCard
              room={selectedRoom}
              canManageImage={isAdmin}
              onLiberar={() => requireAuth('liberar', selectedRoom.number)}
              onAddImage={() => handleAddImage(selectedRoom.number)}
              onRemoveImage={() => handleRemoveImage(selectedRoom.number)}
            />
          )}

          {!selectedRoom && (
            <section className="flex min-h-0 w-full flex-col rounded-[26px] border border-[#eadfd6] bg-white shadow-[0_20px_50px_rgba(67,42,27,0.08)] xl:w-[420px] items-center justify-center">
              <div className="text-center">
                <p className="text-[13px] font-medium text-[#8d7b70]">Selecciona una habitación</p>
                <p className="mt-1 text-[11px] text-[#a49486]">para ver los detalles</p>
              </div>
            </section>
          )}
        </div>
      </div>

      {showAdminAuth && (
        <AdminPasswordModal
          onSuccess={onAdminAuthorized}
          onClose={() => {
            setShowAdminAuth(false);
            setPendingAction(null);
            setPendingRoomNumber(null);
            setAdminAuthPassword(null);
            setImageError('');
          }}
        />
      )}

      {showRoomForm && (
        <RoomFormModal
          room={editingRoom ?? undefined}
          onSave={onSaveRoom}
          onDelete={onDeleteRoom}
          onClose={() => {
            setShowRoomForm(false);
            setEditingRoom(null);
            setAdminAuthPassword(null);
          }}
          adminPassword={adminAuthPassword ?? undefined}
        />
      )}

      <input
        ref={imageFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />

      {confirmAction && (
        <ConfirmModal
          title={confirmTitle}
          message={confirmMessage}
          confirmLabel={confirmLabel}
          confirmDanger={confirmDanger}
          onConfirm={() => {
            confirmAction();
            setConfirmAction(null);
          }}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}