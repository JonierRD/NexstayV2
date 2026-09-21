import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  type Habitacion,
  type PublicUser,
  checkoutRequest,
  habitacionesRequest,
  staysActiveRequest,
  staysByRoomRequest,
  updateHabitacionRequest
} from '../../lib/api';
import { mapApiRoom, type Room, type RoomStatus } from './types';

export type PendingRoomAction = 'create' | 'edit' | 'liberar' | 'image';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB límite de imagen

export function useHabitaciones({ user }: { user: PublicUser }) {
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
  const [pendingAction, setPendingAction] = useState<PendingRoomAction | null>(null);
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
  function requireAuth(action: PendingRoomAction, roomNumber?: string) {
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
  function executeAction(action: PendingRoomAction, roomNumber?: string) {
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

  function closeAdminAuth() {
    setShowAdminAuth(false);
    setPendingAction(null);
    setPendingRoomNumber(null);
    setAdminAuthPassword(null);
    setImageError('');
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

  function closeRoomForm() {
    setShowRoomForm(false);
    setEditingRoom(null);
    setAdminAuthPassword(null);
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
  async function handleImagePick(event: ChangeEvent<HTMLInputElement>) {
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

  function confirm() {
    if (confirmAction) {
      confirmAction();
      setConfirmAction(null);
    }
  }

  return {
    loading,
    filteredRooms,
    selectedRoom,
    stats,
    pct,
    isAdmin,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    styleFilter,
    setStyleFilter,
    fanFilter,
    setFanFilter,
    setSelectedRoomNumber,
    requireAuth,
    handleAddImage,
    handleRemoveImage,
    showAdminAuth,
    onAdminAuthorized,
    closeAdminAuth,
    showRoomForm,
    editingRoom,
    adminAuthPassword,
    onSaveRoom,
    onDeleteRoom,
    closeRoomForm,
    imageFileRef,
    handleImagePick,
    imageError,
    confirmAction,
    confirmTitle,
    confirmMessage,
    confirmLabel,
    confirmDanger,
    confirm,
    closeConfirm: () => setConfirmAction(null)
  };
}