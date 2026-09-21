import { useCallback, useEffect, useState } from 'react';
import {
  type PublicUser,
  type Habitacion,
  type Cliente,
  habitacionesRequest,
  clienteByCcRequest,
  clientesRequest,
  checkinRequest
} from '../../lib/api';

export type CheckinStep = 'CLIENT_DATA' | 'SELECT_ROOM' | 'CONFIRM' | 'SUCCESS';

export type ClientFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  cityOrigin: string;
  cityDestination: string;
  profession: string;
  notes: string;
};

export const EMPTY_CLIENT_FORM: ClientFormData = {
  firstName: '',
  lastName: '',
  phone: '',
  cityOrigin: '',
  cityDestination: '',
  profession: '',
  notes: ''
};

function todayInputValue(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

export function useReception(user: PublicUser) {
  // Wizard: CLIENT_DATA → SELECT_ROOM → CONFIRM → SUCCESS
  const [step, setStep] = useState<CheckinStep>('CLIENT_DATA');
  // Habitaciones disponibles traídas de la API
  const [rooms, setRooms] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(false);
  // Cédula que escribe el recepcionista para buscar cliente
  const [ccSearch, setCcSearch] = useState('');
  // Cliente encontrado en la API por cédula (null = nuevo)
  const [foundClient, setFoundClient] = useState<Cliente | null>(null);
  // Habitación que el recepcionista selecciona para el check-in
  const [selectedRoom, setSelectedRoom] = useState<Habitacion | null>(null);
  // Tipo de aire: AIRE o VENTILADOR (se auto-selecciona según la habitación)
  const [acType, setAcType] = useState<'AIRE' | 'VENTILADOR'>('AIRE');
  // Noches estimadas del hospedaje
  const [nights, setNights] = useState<number>(1);
  // Fecha de ingreso (por defecto hoy, editable)
  const [checkInDate, setCheckInDate] = useState<string>(todayInputValue);
  // Contraseña del admin (se pide si el usuario es RECEPTION)
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  // Acción pendiente mientras se valida la contraseña del admin
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Formulario de cliente (se llena si existe o se completa si es nuevo)
  const [clientData, setClientData] = useState<ClientFormData>(EMPTY_CLIENT_FORM);

  // Controla si ya se buscó (para mostrar "encontrado" o "nuevo cliente")
  const [hasSearched, setHasSearched] = useState(false);

  // Historial de cédulas (para el datalist del input)
  const [ccHistory, setCcHistory] = useState<string[]>([]);

  const isAdmin = user.role === 'ADMIN';

  // Trae todas las habitaciones de la API (GET /habitaciones)
  const loadRooms = useCallback(() => {
    setLoading(true);
    habitacionesRequest()
      .then((data) => {
        const available = data.filter(r => r.status === 'DISPONIBLE');
        setRooms(available);
      })
      .catch((err) => {
        console.error('Error loading rooms:', err);
        setError('Error al cargar habitaciones');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // GET /clientes/cc/:cc → si existe llena el form, si no limpia para nuevo cliente
  const handleSearchClient = () => {
    if (!ccSearch.trim()) {
      setError('Ingresa una cédula');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    clienteByCcRequest(ccSearch.trim())
      .then((client) => {
        setFoundClient(client);
        // Llenar formulario con datos existentes
        setClientData({
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone || '',
          cityOrigin: client.cityOrigin || '',
          cityDestination: client.cityDestination || '',
          profession: client.profession || '',
          notes: client.notes || ''
        });
      })
      .catch(() => {
        setFoundClient(null);
        // Limpiar formulario para nuevo cliente
        setClientData(EMPTY_CLIENT_FORM);
      })
      .finally(() => setLoading(false));
  };

  // Carga el historial guardado en localStorage y lo filtra contra los
  // clientes que siguen existiendo (descarta cédulas de clientes eliminados)
  useEffect(() => {
    const saved = localStorage.getItem('sapay-cc-history');
    if (!saved) {
      setCcHistory([]);
      return;
    }

    let loaded: string[] = [];
    try {
      loaded = JSON.parse(saved);
    } catch {
      setCcHistory([]);
      return;
    }

    clientesRequest()
      .then((clients) => {
        const validCcs = new Set(clients.map((client) => client.cc));
        const filtered = loaded.filter((cc) => validCcs.has(cc)).slice(0, 10);
        setCcHistory(filtered);
        localStorage.setItem('sapay-cc-history', JSON.stringify(filtered));
      })
      .catch(() => {
        // Si la API no responde, mantener el historial local tal cual
        setCcHistory(loaded);
      });
  }, []);

  // Guarda la cédula buscada en localStorage (máx 10)
  useEffect(() => {
    if (foundClient && ccSearch && !ccHistory.includes(ccSearch)) {
      const newHistory = [ccSearch, ...ccHistory].slice(0, 10); // Máximo 10 cédulas
      setCcHistory(newHistory);
      localStorage.setItem('sapay-cc-history', JSON.stringify(newHistory));
    }
  }, [foundClient, ccSearch]);

  // Al elegir una cédula del historial la busca directo
  const handleSelectCc = (cc: string) => {
    setCcSearch(cc);
    handleSearchClient();
  };

  // Limpia el buscador y el formulario de cliente (botón "Limpiar")
  const clearClientData = () => {
    setCcSearch('');
    setFoundClient(null);
    setClientData(EMPTY_CLIENT_FORM);
    setHasSearched(false);
    setError('');
  };

  // Valida nombre/apellido y pasa al paso 2 (elegir habitación)
  const handleContinueToRoom = () => {
    if (!clientData.firstName || !clientData.lastName) {
      setError('Nombre y apellido son obligatorios');
      return;
    }
    setError('');
    setStep('SELECT_ROOM');
  };

  // Selecciona la habitación y auto-ajusta el tipo de A/C según lo que tiene
  const handleSelectRoom = (room: Habitacion | null) => {
    setSelectedRoom(room);
    if (room) {
      if (room.hasAir && !room.hasFan) {
        setAcType('AIRE');
      } else if (!room.hasAir && room.hasFan) {
        setAcType('VENTILADOR');
      } else if (room.hasAir) {
        setAcType('AIRE'); // Prioridad aire si tiene ambos
      } else if (room.hasFan) {
        setAcType('VENTILADOR');
      }
    } else {
      // Si no hay habitación seleccionada, resetear acType
      setAcType('AIRE');
    }
  };

  // Total estimado = precio del A/C elegido × noches
  const calculateEstimatedTotal = () => {
    if (!selectedRoom) return 0;
    const price = acType === 'AIRE' ? selectedRoom.priceWithAir : selectedRoom.priceWithFan;
    return (price || 0) * nights;
  };

  // Si no es admin, pide contraseña de admin antes de confirmar
  const handleConfirmCheckin = () => {
    if (!selectedRoom) {
      setError('Selecciona una habitación');
      return;
    }

    if (!isAdmin) {
      setPendingAction(() => executeCheckin);
      setShowAdminAuth(true);
    } else {
      executeCheckin();
    }
  };

  // Construye el payload y hace POST /stays/checkin
  const executeCheckin = () => {
    if (!selectedRoom) {
      setError('Selecciona una habitación antes de continuar.');
      return;
    }

    setLoading(true);
    setError('');

    const checkinData = {
      cc: ccSearch.trim(),
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      phone: clientData.phone || undefined,
      cityOrigin: clientData.cityOrigin || undefined,
      cityDestination: clientData.cityDestination || undefined,
      profession: clientData.profession || undefined,
      notes: clientData.notes || undefined,
      roomNumber: selectedRoom.number,
      acType,
      nights: nights || undefined,
      checkIn: checkInDate ? new Date(checkInDate + 'T12:00:00').toISOString() : undefined,
      adminPassword: adminPassword || undefined
    };

    checkinRequest(checkinData)
      .then(() => {
        setSuccess(true);
        setStep('SUCCESS');
        loadRooms(); // Recargar habitaciones
      })
      .catch((err) => {
        setError(err.message || 'Error al realizar check-in');
      })
      .finally(() => setLoading(false));
  };

  // Guarda la contraseña de admin y ejecuta la acción que estaba pendiente
  const onAdminAuthorized = (password: string) => {
    setAdminPassword(password);
    setShowAdminAuth(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Reinicia el formulario después de un check-in exitoso
  const resetForm = () => {
    setStep('CLIENT_DATA');
    setCcSearch('');
    setFoundClient(null);
    setSelectedRoom(null);
    setAcType('AIRE');
    setNights(1);
    setCheckInDate(todayInputValue());
    setClientData(EMPTY_CLIENT_FORM);
    setHasSearched(false);
    setError('');
    setSuccess(false);
    setAdminPassword(null);
  };

  // Solo las disponibles se muestran/exigen para ocupar
  const availableRooms = rooms.filter(r => r.status === 'DISPONIBLE');

  return {
    step,
    setStep,
    rooms,
    loading,
    ccSearch,
    setCcSearch,
    foundClient,
    selectedRoom,
    acType,
    setAcType,
    nights,
    setNights,
    checkInDate,
    setCheckInDate,
    showAdminAuth,
    setShowAdminAuth,
    error,
    success,
    clientData,
    setClientData,
    hasSearched,
    ccHistory,
    availableRooms,
    handleSearchClient,
    handleSelectCc,
    clearClientData,
    handleContinueToRoom,
    handleSelectRoom,
    calculateEstimatedTotal,
    handleConfirmCheckin,
    onAdminAuthorized,
    resetForm
  };
}