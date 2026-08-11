import {
  BedDouble,
  CheckCircle,
  ChevronRight,
  Clock3,
  Eye,
  Gavel,
  PencilLine,
  Plus,
  Search,
  Wrench
} from 'lucide-react';
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { type Habitacion, type PublicUser, habitacionesRequest, updateHabitacionRequest, staysByRoomRequest, checkoutRequest, staysActiveRequest } from '../lib/api';
import sencillaImg from '../assets/habitaciones/sencilla.png';
import matrimonialImg from '../assets/habitaciones/matrimonial.png';
import dobleImg from '../assets/habitaciones/doblecama.jpeg';
import { cn } from '../lib/utils';
import { AdminPasswordModal } from './AdminPasswordModal';
import { ConfirmModal } from './ConfirmModal';
import { RoomFormModal } from './RoomFormModal';

type RoomStatus = 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
type RoomType = 'DOSCAMAS' | 'MATRIMONIAL' | 'SENCILLA';

type Room = {
  number: string;
  type: RoomType;
  status: RoomStatus;
  acType: string;
  description: string;
  image: string | null;
  guest?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  selectedAc?: string;
  priceDisplay: string;
  priceWithAir: number;
  priceWithFan: number;
  storeDebt: number;
  heroTone: string;
  accentTone: string;
  stayId?: number; // ID del hospedaje actual para editar
  hasAir: boolean;
  hasFan: boolean;
};

const heroTones = [
  'from-[#8f654c] via-[#caa27f] to-[#f4e5d5]',
  'from-[#9e8a74] via-[#d6c2aa] to-[#f8efe4]',
  'from-[#937252] via-[#ccb090] to-[#f4eadf]',
  'from-[#9f8163] via-[#dcc5aa] to-[#f7efe5]',
  'from-[#84614a] via-[#c8a27d] to-[#f0e1d0]',
  'from-[#8f7764] via-[#d7c2a9] to-[#f8f1e8]',
  'from-[#927255] via-[#d7b794] to-[#f6ebe0]',
  'from-[#8a6e58] via-[#d2baa1] to-[#f8f0e7]',
  'from-[#9a7a5c] via-[#d9c4ad] to-[#f7efe4]',
  'from-[#91765f] via-[#d3bda5] to-[#f7efe6]',
  'from-[#9a816d] via-[#e0cdb6] to-[#f8f2ea]',
  'from-[#8e7159] via-[#d6bfa6] to-[#f8f0e7]',
  'from-[#95755e] via-[#d6c1aa] to-[#f8f0e8]',
  'from-[#90705a] via-[#d2bca6] to-[#f8efe6]',
  'from-[#8c6f58] via-[#d0baa2] to-[#f6eee4]',
  'from-[#9a7c63] via-[#dcc8b2] to-[#f8efe6]',
  'from-[#8a6f58] via-[#d4c0a9] to-[#f7efe7]'
];

const accentTones = [
  'from-[#7a4a34] to-[#b97455]',
  'from-[#9b7250] to-[#d7b18d]',
  'from-[#7d4f31] to-[#b6805c]',
  'from-[#926645] to-[#c89d75]',
  'from-[#74462d] to-[#ad7854]',
  'from-[#7d5439] to-[#c39970]',
  'from-[#7e563c] to-[#c39573]',
  'from-[#73472f] to-[#b37e58]',
  'from-[#88583b] to-[#c29570]',
  'from-[#7a4e35] to-[#b98260]',
  'from-[#7d4f32] to-[#b58359]',
  'from-[#825237] to-[#c28f6c]',
  'from-[#7b4d34] to-[#be8e67]',
  'from-[#7a4b31] to-[#b58462]',
  'from-[#73482f] to-[#ad7e5a]',
  'from-[#84553a] to-[#c0946c]',
  'from-[#73472d] to-[#b8845d]'
];

const typeImages: Record<string, string> = {
  DOSCAMAS: dobleImg,
  MATRIMONIAL: matrimonialImg,
  SENCILLA: sencillaImg
};

function mapApiRoom(apiRoom: Habitacion, index: number): Room {
  const typeLabel: Record<string, string> = {
    DOSCAMAS: 'Dos Camas',
    MATRIMONIAL: 'Matrimonial',
    SENCILLA: 'Sencilla'
  };
  const fmtPrice = (v: number | null) => v !== null ? `$${Math.round(v).toLocaleString('es-CO')}` : null;
  const priceFanDsp = fmtPrice(apiRoom.priceWithFan);
  const priceAirDsp = fmtPrice(apiRoom.priceWithAir);
  const priceFanNum = apiRoom.priceWithFan ?? 0;
  const priceAirNum = apiRoom.priceWithAir ?? 0;
  const acLabel = apiRoom.hasAir && apiRoom.hasFan ? 'Aire / Ventilador' : apiRoom.hasAir ? 'Aire acondicionado' : apiRoom.hasFan ? 'Ventilador' : '---';
  return {
    number: apiRoom.number,
    type: apiRoom.type,
    status: apiRoom.status,
    image: apiRoom.image,
    acType: acLabel,
    description: `Habitación ${typeLabel[apiRoom.type]}`,
    selectedAc: apiRoom.hasAir ? 'Aire' : apiRoom.hasFan ? 'Ventilador' : '---',
    priceDisplay: priceAirDsp && priceFanDsp ? `${priceAirDsp} / ${priceFanDsp}` : (priceAirDsp || priceFanDsp || '---'),
    priceWithAir: priceAirNum,
    priceWithFan: priceFanNum,
    storeDebt: 0,
    heroTone: heroTones[index % heroTones.length],
    accentTone: accentTones[index % accentTones.length],
    hasAir: apiRoom.hasAir,
    hasFan: apiRoom.hasFan
  };
}

const statusStyles: Record<RoomStatus, string> = {
  DISPONIBLE: 'bg-[#e9f6eb] text-[#2f8f4e] border-[#c6e8cf]',
  OCUPADA: 'bg-[#fff0ee] text-[#c94a43] border-[#f0c8c4]',
  RESERVADA: 'bg-[#fff5df] text-[#c78b14] border-[#f2dbab]',
  MANTENIMIENTO: 'bg-[#f5efe9] text-[#8f5e3d] border-[#dcc5b1]'
};

function StatCard({
  icon: Icon,
  title,
  value,
  detail,
  tone
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  detail: string;
  tone: string;
}): ReactElement {
  return (
    <article className="rounded-[16px] border border-[#eadfd6] bg-white p-3 shadow-[0_12px_30px_rgba(67,42,27,0.06)]">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', tone)}>
          <Icon size={18} className="text-[#4b2b21]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-[#7d6e63]">{title}</p>
          <p className="text-[18px] leading-none font-semibold tracking-tight text-[#2b1b14]">{value}</p>
          <p className="text-[10px] text-[#8b7b70]">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: RoomStatus }): ReactElement {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide', statusStyles[status])}>
      {status}
    </span>
  );
}

function AccentButton({
  children,
  active,
  onClick,
  className
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-xl border px-3 text-[12px] font-medium transition',
        active
          ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-[0_10px_26px_rgba(75,43,33,0.28)]'
          : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d] hover:bg-[#faf6f2]',
        className
      )}
    >
      {children}
    </button>
  );
}

function RoomDetailCard({
  room,
  canManageImage,
  onLiberar,
  onAddImage,
  onRemoveImage
}: {
  room: Room;
  canManageImage: boolean;
  onLiberar: () => void;
  onAddImage: () => void;
  onRemoveImage: () => void;
}): ReactElement {
  const nights = room.nights ?? 1;
  const selectedPrice = room.selectedAc === 'Aire' && room.priceWithAir > 0 ? room.priceWithAir : room.priceWithFan > 0 ? room.priceWithFan : 0;
  const roomTotal = nights * selectedPrice;
  const grandTotal = roomTotal + room.storeDebt;
  const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

  return (
    <section className="flex min-h-0 w-full flex-col rounded-[26px] border border-[#eadfd6] bg-white shadow-[0_20px_50px_rgba(67,42,27,0.08)] xl:w-[420px]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px]">
        <div className="relative h-[240px] overflow-hidden group">
          {room.image ? (
            <>
              <img src={room.image} alt={room.type} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.35))]" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f6f1eb] text-center">
              <div>
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#8d7b70] shadow-sm">
                  <Wrench size={22} aria-hidden="true" />
                </div>
                <p className="text-[12px] font-medium text-[#6f6055]">Sin imagen</p>
                <p className="mt-1 text-[10px] text-[#8d7b70]">El administrador puede agregar o reemplazar una imagen</p>
              </div>
            </div>
          )}

          {canManageImage && (
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={onAddImage}
                className="flex items-center justify-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-black/60"
              >
                <PencilLine size={13} aria-hidden="true" />
                Reemplazar imagen
              </button>
              <button
                type="button"
                onClick={onRemoveImage}
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#a53b35]/85 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-[#8f2f2a]"
              >
                <Wrench size={13} aria-hidden="true" />
                Eliminar imagen
              </button>
            </div>
          )}

          <div className={cn('absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg', room.accentTone)}>
            {room.status}
          </div>
          <div className="absolute bottom-3 right-3 text-right">
            <p className="text-[13px] font-bold text-white drop-shadow-lg">{room.priceDisplay}</p>
            <p className="text-[10px] text-white/80 drop-shadow">por noche</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold tracking-tight text-[#2b1b14]">{room.number}</h3>
              <p className="text-[12px] text-[#6f6055]">{room.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-[#ece0d7] bg-[#fcf7f1] px-4 py-3 text-[12px]">
            <DetailLine label="Tipo" value={room.type === 'DOSCAMAS' ? 'Dos Camas' : room.type === 'MATRIMONIAL' ? 'Matrimonial' : 'Sencilla'} />
            <DetailLine label="A/C" value={room.acType} />
          </div>

          <div className="rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] px-4 py-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Precios</h4>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              {room.priceWithAir > 0 && <DetailLine label="Con aire" value={fmt(room.priceWithAir)} />}
              {room.priceWithFan > 0 && <DetailLine label="Con ventilador" value={fmt(room.priceWithFan)} />}
            </div>
          </div>

          <div className="rounded-xl border border-[#ece0d7] bg-[#fcf7f1] px-4 py-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Huésped Actual</h4>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              <DetailLine label="Nombre" value={room.guest ?? 'Sin huésped'} />
              <DetailLine label="Noches" value={room.nights?.toString() ?? '1'} />
              <DetailLine label="Seleccionó" value={room.selectedAc ?? '---'} />
            </div>
          </div>

          <div className="rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] px-4 py-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Total a Cobrar</h4>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              <DetailLine label="Habitación" value={`${fmt(selectedPrice)} × ${nights} ${nights === 1 ? 'noche' : 'noches'}`} />
              <DetailLine label="Subtotal hospedaje" value={fmt(roomTotal)} />
              <DetailLine label="Servicios Extra" value={fmt(room.storeDebt)} />
              <DetailLine label="Total" value={fmt(grandTotal)} />
            </div>
          </div>

          <div className="mt-auto flex gap-2 pt-1">
            <AccentButton onClick={onLiberar} className="flex-1 gap-1.5 h-8 text-[11px] border-[#efb7b7] bg-white text-[#d13d3d] hover:border-[#e5a0a0] hover:bg-[#fff5f5]">
              <Wrench size={13} aria-hidden="true" />
              Liberar
            </AccentButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailLine({
  label,
  value,
  compact = false
}: {
  label: string;
  value: string;
  compact?: boolean;
}): ReactElement {
  return (
    <div className={cn('flex items-start justify-between gap-3', compact && 'sm:block')}>
      <dt className="min-w-0 text-[#7d6d61]">{label}:</dt>
      <dd className={cn('min-w-0 text-right font-medium text-[#2b1b14]', compact && 'sm:text-left')}>{value}</dd>
    </div>
  );
}

export function HabitacionesPage({ user }: { user: PublicUser }): ReactElement {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [apiRooms, setApiRooms] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | RoomStatus>('TODOS');
  const [styleFilter, setStyleFilter] = useState<'TODOS' | 'SENCILLA' | 'MATRIMONIAL' | 'DOS CAMAS'>('TODOS');
  const [fanFilter, setFanFilter] = useState<'TODOS' | 'Ventilador' | 'Sin Ventilador'>('TODOS');
  const [sortBy, setSortBy] = useState<'Número' | 'Tipo' | 'Precio'>('Número');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState('');
  const [editingRoom, setEditingRoom] = useState<Habitacion | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'edit' | 'liberar' | 'image' | null>(null);
  const [pendingRoomNumber, setPendingRoomNumber] = useState<string | null>(null);
  const [adminAuthPassword, setAdminAuthPassword] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmLabel, setConfirmLabel] = useState('Confirmar');
  const [confirmDanger, setConfirmDanger] = useState(false);
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

  const isAdmin = user.role === 'ADMIN';

  const loadRooms = useCallback(() => {
    setLoading(true);
    Promise.all([
      habitacionesRequest(),
      staysActiveRequest()
    ])
      .then(([roomsData, staysData]) => {
        setApiRooms(roomsData);
        
        // Crear un mapa de stays activos por número de habitación
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

  const selectedRoom =
    filteredRooms.find((room) => room.number === selectedRoomNumber) ??
    filteredRooms[0];

  const stats = {
    total: rooms.length,
    ocupadas: rooms.filter((room) => room.status === 'OCUPADA').length,
    disponibles: rooms.filter((room) => room.status === 'DISPONIBLE').length,
    reservadas: rooms.filter((room) => room.status === 'RESERVADA').length,
    mantenimiento: rooms.filter((room) => room.status === 'MANTENIMIENTO').length
  };

  const pct = (n: number) => stats.total > 0 ? `${((n / stats.total) * 100).toFixed(1)}% del total` : '0% del total';

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

  function handleAddImage(roomNumber: string) {
    if (!isAdmin) {
      return;
    }
    setPendingRoomNumber(roomNumber);
    imageFileRef.current?.click();
  }

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

  async function handleImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reseteamos el input para permitir volver a elegir el mismo archivo.
    event.target.value = '';
    if (!file || !pendingRoomNumber) return;

    // Validar tamaño del archivo
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
                <label className="flex h-8 min-w-[160px] items-center gap-1.5 rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-2.5 text-[#8d7b70] transition focus-within:border-[#b08f7c] focus-within:bg-white">
                  <Search size={14} aria-hidden="true" />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar habitación..."
                    className="w-full bg-transparent text-[10px] text-[#2b1b14] outline-none placeholder:text-[#a49486]"
                  />
                </label>

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

            <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-[#ebe1d8]">
              <div className="grid grid-cols-[100px_60px_1fr_120px_1fr_100px] gap-2 border-b border-[#ece2d8] bg-[#fbf7f2] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8f7c70] min-w-[600px]">
                <div>Habitación</div>
                <div />
                <div>Descripción</div>
                <div className="text-center">Estado</div>
                <div className="text-center">A/V</div>
                <div className="text-center">Acción</div>
              </div>

              <div className="flex-1 overflow-auto min-w-[600px]">
                {filteredRooms.map((room) => {
                  const isSelected = room.number === selectedRoom?.number;
                  return (
                    <button
                      key={room.number}
                      type="button"
                      onClick={() => setSelectedRoomNumber(room.number)}
                      className={cn(
                        'grid w-full grid-cols-[100px_60px_1fr_120px_1fr_100px] items-center gap-2 border-b border-[#f1e7de] px-3 py-2 text-left transition last:border-b-0',
                        isSelected ? 'bg-[#fff7ef]' : 'bg-white hover:bg-[#fdfaf7]'
                      )}
                    >
                      <div className="flex h-[90px] items-center justify-center overflow-hidden rounded-[16px] bg-[#f6f1eb]">
                        {room.image ? (
                          <img src={room.image} alt={room.type} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-[#8d7b70]">Sin imagen</div>
                        )}
                      </div>

                      <div>
                        <p className="text-[14px] font-semibold text-[#2b1b14]">{room.number}</p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[11px] leading-4 text-[#4e4037]">{room.description}</p>
                      </div>

                      <div className="flex justify-center">
                        <StatusPill status={room.status} />
                      </div>

                      <div className="text-[10px] text-[#5d4d42] text-center">{room.acType}</div>

                      <div className="flex items-center justify-center gap-2">
                        <IconButton
                          label="Editar"
                          icon={PencilLine}
                          onClick={() => requireAuth('edit', room.number)}
                        />
                        <IconButton
                          label="Ver"
                          icon={Eye}
                          onClick={() => setSelectedRoomNumber(room.number)}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

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

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: T[];
}): ReactElement {
  return (
    <label className="flex h-8 min-w-[100px] shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-2.5 text-[#8d7b70] transition focus-within:border-[#b08f7c] focus-within:bg-white">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-w-0 flex-1 appearance-none bg-transparent text-[11px] text-[#2b1b14] outline-none"
      >
        <option value="TODOS">{label}</option>
        {options.filter((o) => o !== 'TODOS').map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronRight size={12} className="shrink-0 rotate-90 text-[#8d7b70] pointer-events-none" aria-hidden="true" />
    </label>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#ddd2c8] bg-white text-[#5a463a] shadow-sm hover:border-[#bfa89d] hover:bg-[#faf6f2] transition"
      title={label}
      aria-label={label}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
