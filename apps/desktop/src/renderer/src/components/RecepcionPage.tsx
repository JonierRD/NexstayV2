import {
  Search,
  BedDouble,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { type ReactElement, useState, useEffect, useCallback } from 'react';
import { type PublicUser, habitacionesRequest, clienteByCcRequest, clientesRequest, checkinRequest, type Habitacion, type Cliente } from '../lib/api';
import { AdminPasswordModal } from './AdminPasswordModal';
import { cn } from '../lib/utils';
import sencillaImg from '../assets/habitaciones/sencilla.png';
import matrimonialImg from '../assets/habitaciones/matrimonial.png';
import dobleImg from '../assets/habitaciones/doblecama.jpeg';

// Paso actual del wizard de check-in
type CheckinStep = 'CLIENT_DATA' | 'SELECT_ROOM' | 'CONFIRM' | 'SUCCESS';

export function RecepcionPage({ user }: { user: PublicUser }): ReactElement {
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
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  });
  // Contraseña del admin (se pide si el usuario es RECEPTION)
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  // Acción pendiente mientras se valida la contraseña del admin
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Formulario de cliente (se llena si existe o se completa si es nuevo)
  const [clientData, setClientData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    cityOrigin: '',
    cityDestination: '',
    profession: '',
    notes: ''
  });

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
        setClientData({
          firstName: '',
          lastName: '',
          phone: '',
          cityOrigin: '',
          cityDestination: '',

          profession: '',
          notes: ''
        });
      })
      .finally(() => setLoading(false));
  };

  // Controla si ya se buscó (para mostrar "encontrado" o "nuevo cliente")
  const [hasSearched, setHasSearched] = useState(false);
  
  // Historial de cédulas (para el datalist del input)
  const [ccHistory, setCcHistory] = useState<string[]>([]);

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

  // Valida nombre/apellido y pasa al paso 2 (elegir habitación)
  const handleContinueToRoom = () => {
    if (!clientData.firstName || !clientData.lastName) {
      setError('Nombre y apellido son obligatorios');
      return;
    }
    setError('');
    setStep('SELECT_ROOM');
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
    setCheckInDate(() => {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${today.getFullYear()}-${month}-${day}`;
    });
    setClientData({
      firstName: '',
      lastName: '',
      phone: '',
      cityOrigin: '',
      cityDestination: '',
      profession: '',
      notes: ''
    });
    setHasSearched(false);
    setError('');
    setSuccess(false);
    setAdminPassword(null);
  };

  // Solo las disponibles se muestran/exigen para ocupar
  const availableRooms = rooms.filter(r => r.status === 'DISPONIBLE');

  // Imagen por tipo de habitación para el panel derecho
  const typeImages: Record<string, string> = {
    DOSCAMAS: dobleImg,
    MATRIMONIAL: matrimonialImg,
    SENCILLA: sencillaImg
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-[#2b1b14]">Recepción - Check-In</h1>
        <p className="text-xs text-[#7d6e63]">Registro de huéspedes y asignación de habitaciones</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && step === 'SUCCESS' && (
        <div className="flex flex-1 items-center justify-center">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle size={64} className="mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-bold text-green-800">¡Check-In Exitoso!</h2>
            <p className="mt-2 text-sm text-green-700">
              {foundClient
                ? `${foundClient.firstName} ${foundClient.lastName}`
                : `${clientData.firstName} ${clientData.lastName}`
              } ha sido registrado en la habitación {selectedRoom?.number}
            </p>
            <button
              onClick={resetForm}
              className="mt-6 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Nuevo Check-In
            </button>
          </div>
        </div>
      )}

      {!success && (
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Panel Izquierdo - Formulario */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-[#eadfd6] bg-white p-6">
            {step === 'CLIENT_DATA' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#4b2b21]">
                    Cédula del Cliente
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={ccSearch}
                        onChange={(e) => setCcSearch(e.target.value)}
                        placeholder="Ingresa cédula del cliente"
                        list="cc-history"
                        className="w-full rounded-lg border border-[#dccfca] px-4 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchClient()}
                      />
                      <datalist id="cc-history">
                        {ccHistory.map((cc) => (
                          <option key={cc} value={cc} />
                        ))}
                      </datalist>
                    </div>
                    <button

                      onClick={handleSearchClient}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-lg bg-[#4b2b21] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      Buscar
                    </button>
                  </div>
                </div>

                {hasSearched && foundClient && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-sm font-medium text-green-800">
                      ✅ Cliente encontrado: {foundClient.firstName} {foundClient.lastName}
                    </p>
                  </div>
                )}

                {hasSearched && !foundClient && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-800">
                      ℹ️ Nuevo cliente - Completa los datos
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={clientData.firstName}
                      onChange={(e) => setClientData({ ...clientData, firstName: e.target.value })}
                      className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={clientData.lastName}
                      onChange={(e) => setClientData({ ...clientData, lastName: e.target.value })}
                      className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
                    Teléfono
                </label>
                  <input
                    type="text"
                    value={clientData.phone}
                    onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                    className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
                      Ciudad Origen
                    </label>
                    <input
                      type="text"
                      value={clientData.cityOrigin}
                      onChange={(e) => setClientData({ ...clientData, cityOrigin: e.target.value })}
                      className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                    />

                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
                      Ciudad Destino
                    </label>
                    <input
                      type="text"
                      value={clientData.cityDestination}
                      onChange={(e) => setClientData({ ...clientData, cityDestination: e.target.value })}
                      className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
                    Profesión
                  </label>
                  <input
                    type="text"
                    value={clientData.profession}
                    onChange={(e) => setClientData({ ...clientData, profession: e.target.value })}
                    className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
                    Notas
                  </label>
                  <textarea
                    value={clientData.notes}
                    onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCcSearch('');
                      setFoundClient(null);
                      setClientData({
                        firstName: '',
                        lastName: '',
                        phone: '',
                        cityOrigin: '',
                        cityDestination: '',
                        profession: '',
                        notes: ''
                      });
                      setHasSearched(false);
                      setError('');
                    }}
                    className="flex-1 rounded-lg border border-[#dccfca] px-4 py-2 text-sm font-medium text-[#4b2b21] hover:bg-[#faf6f2]"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleContinueToRoom}
                    disabled={!ccSearch || !clientData.firstName || !clientData.lastName}
                    className="flex-1 rounded-lg bg-[#4b2b21] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {step === 'SELECT_ROOM' && (
              <div className="space-y-6">
                <div>


                  <label className="mb-3 block text-sm font-medium text-[#4b2b21]">
                    Asignar Habitación
                  </label>
                  
                  <div className="mb-4">
                    <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                      Habitación Disponible
                    </label>
                    <select
                      value={selectedRoom?.number || ''}
                      onChange={(e) => {
                        const room = rooms.find(r => r.number === e.target.value);
                        setSelectedRoom(room || null);
                        // Establecer automáticamente el tipo de A/C según lo que tiene la habitación
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
                      }}
                      className="w-full rounded-lg border border-[#dccfca] px-4 py-3 text-sm focus:border-[#bfa89d] focus:outline-none"
                    >
                      <option value="">Selecciona una habitación</option>
                      {availableRooms.map((room) => (
                        <option key={room.number} value={room.number}>
                          {room.number} - {room.type} - {room.hasAir ? 'Aire' : ''} {room.hasFan ? 'Ventilador' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedRoom && (
                    <div className="rounded-xl border border-[#ece0d7] bg-[#fcf7f1] p-5">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#4b2b21]">
                          <BedDouble size={28} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-bold text-[#2b1b14]">Habitación {selectedRoom.number}</p>
                          <p className="text-sm text-[#7d6e63]">{selectedRoom.type}</p>
                        </div>
                      </div>

                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {selectedRoom.hasAir && (
                          <div className="rounded-lg border border-[#dccfca] bg-white p-3">
                            <p className="text-xs text-[#7d6e63] mb-1">Precio Aire</p>
                            <p className="text-lg font-bold text-[#2b1b14]">
                              ${Math.round(selectedRoom.priceWithAir || 0).toLocaleString('es-CO')}
                            </p>
                          </div>
                        )}
                        {selectedRoom.hasFan && (
                          <div className="rounded-lg border border-[#dccfca] bg-white p-3">
                            <p className="text-xs text-[#7d6e63] mb-1">Precio Ventilador</p>
                            <p className="text-lg font-bold text-[#2b1b14]">
                              ${Math.round(selectedRoom.priceWithFan || 0).toLocaleString('es-CO')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                        Tipo de Aire Acondicionado
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedRoom?.hasAir && (
                          <button
                            type="button"
                            onClick={() => setAcType('AIRE')}
                            className={cn(
                              'flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition',
                              acType === 'AIRE'
                                ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-lg shadow-[#4b2b21]/20'
                                : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d]'
                            )}
                          >

                            ❄️ Aire
                          </button>
                        )}
                        {selectedRoom?.hasFan && (
                          <button
                            type="button"
                            onClick={() => setAcType('VENTILADOR')}
                            className={cn(
                              'flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition',
                              acType === 'VENTILADOR'
                                ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-lg shadow-[#4b2b21]/20'
                                : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d]'
                            )}
                          >
                            🌀 Ventilador
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                        Fecha de Ingreso
                      </label>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full rounded-lg border border-[#dccfca] px-4 py-3 text-sm focus:border-[#bfa89d] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                        Noches Estimadas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={nights}
                        onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-lg border border-[#dccfca] px-4 py-3 text-sm focus:border-[#bfa89d] focus:outline-none"
                      />
                    </div>
                  </div>


                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep('CLIENT_DATA')}
                      className="flex-1 rounded-lg border border-[#dccfca] px-4 py-3 text-sm font-medium text-[#4b2b21] hover:bg-[#faf6f2]"
                    >
                      ← Volver
                    </button>
                    <button
                      onClick={() => {
                        if (selectedRoom) {
                          setStep('CONFIRM');
                        }
                      }}
                      disabled={!selectedRoom}
                      className="flex-1 rounded-lg bg-[#4b2b21] px-4 py-3 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              </div>
            )}


            {step === 'CONFIRM' && (
              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-[#4b2b21]">
                    Confirmar Check-In
                  </label>

                  <div className="rounded-xl border border-[#ece0d7] bg-[#fcf7f1] p-5">
                    <h3 className="mb-4 font-medium text-[#2b1b14]">Datos del Cliente</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
                        <span className="text-[#7d6e63]">Nombre:</span>
                        <span className="font-medium text-[#2b1b14]">
                          {clientData.firstName} {clientData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
                        <span className="text-[#7d6e63]">Cédula:</span>
                        <span className="font-medium text-[#2b1b14]">{ccSearch}</span>
                      </div>
                      {clientData.phone && (
                        <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
                          <span className="text-[#7d6e63]">Teléfono:</span>
                          <span className="font-medium text-[#2b1b14]">{clientData.phone}</span>
                        </div>
                      )}
                      {clientData.profession && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-[#7d6e63]">Profesión:</span>
                          <span className="font-medium text-[#2b1b14]">{clientData.profession}</span>
                        </div>
                      )}
                    </div>
                  </div>


                  <div className="rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] p-5">
                    <h3 className="mb-4 font-medium text-[#2b1b14]">Datos del Hospedaje</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
                        <span className="text-[#7d6e63]">Habitación:</span>
                        <span className="font-medium text-[#2b1b14]">{selectedRoom?.number}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
                        <span className="text-[#7d6e63]">Tipo:</span>
                        <span className="font-medium text-[#2b1b14]">{selectedRoom?.type}</span>
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                          Aire Acondicionado
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedRoom?.hasAir && (
                            <button
                              type="button"
                              onClick={() => setAcType('AIRE')}
                              className={cn(
                                'flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
                                acType === 'AIRE'
                                  ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-lg shadow-[#4b2b21]/20'
                                  : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d]'
                              )}
                            >
                              ❄️ Aire
                            </button>
                          )}
                          {selectedRoom?.hasFan && (
                            <button
                              type="button"
                              onClick={() => setAcType('VENTILADOR')}
                              className={cn(
                                'flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
                                acType === 'VENTILADOR'
                                  ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-lg shadow-[#4b2b21]/20'
                                  : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d]'
                              )}
                            >
                              🌀 Ventilador
                            </button>
                          )}
                        </div>
                      </div>


                      <div>
                        <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                          Fecha de Ingreso
                        </label>
                        <input
                          type="date"
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          className="w-full rounded-lg border border-[#dccfca] px-4 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                          Noches Estimadas
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={nights}
                          onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full rounded-lg border border-[#dccfca] px-4 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
                        <span className="text-[#7d6e63]">Precio/noche:</span>
                        <span className="font-medium text-[#2b1b14]">
                          ${Math.round(
                            (acType === 'AIRE' ? selectedRoom?.priceWithAir : selectedRoom?.priceWithFan) || 0
                          ).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="mt-4 flex justify-between items-center py-3 bg-white rounded-lg px-4">
                        <span className="font-bold text-[#4b2b21]">Total Estimado:</span>
                        <span className="text-xl font-bold text-[#2b1b14]">
                          ${Math.round(calculateEstimatedTotal()).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep('SELECT_ROOM')}
                      className="flex-1 rounded-lg border border-[#dccfca] px-4 py-3 text-sm font-medium text-[#4b2b21] hover:bg-[#faf6f2]"
                    >
                      ← Volver
                    </button>
                    <button
                      onClick={handleConfirmCheckin}
                      disabled={loading}
                      className="flex-1 rounded-lg bg-[#4b2b21] px-4 py-3 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : '✅ Confirmar Check-In'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Panel Derecho - Habitaciones Disponibles */}
          <div className="w-96 overflow-y-auto rounded-2xl border border-[#eadfd6] bg-white p-4">
            <h3 className="mb-3 font-medium text-[#4b2b21]">Habitaciones Disponibles</h3>
            
            {loading && rooms.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-[#7d6e63]" />
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#7d6e63]">
                No hay habitaciones disponibles
              </div>
            ) : (
              <div className="space-y-3">
                {availableRooms.map((room) => (
                  <button
                    key={room.number}
                    onClick={() => {
                      setSelectedRoom(room);
                      // Establecer automáticamente el tipo de A/C según lo que tiene la habitación
                      if (room.hasAir && !room.hasFan) {
                        setAcType('AIRE');
                      } else if (!room.hasAir && room.hasFan) {
                        setAcType('VENTILADOR');
                      } else if (room.hasAir) {
                        setAcType('AIRE'); // Prioridad aire si tiene ambos
                      } else if (room.hasFan) {
                        setAcType('VENTILADOR');
                      }
                    }}
                    className={cn(
                      'w-full rounded-xl border-2 overflow-hidden transition-all',
                      selectedRoom?.number === room.number
                        ? 'border-[#4b2b21] ring-4 ring-[#4b2b21]/30 scale-[1.02]'
                        : 'border-[#dccfca] hover:border-[#bfa89d] hover:scale-[1.01]'
                    )}
                  >
                    <div className="relative h-32 overflow-hidden">
                      <img 
                        src={typeImages[room.type] || sencillaImg} 
                        alt={room.type}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-lg font-bold text-white">{room.number}</span>
                        <span className="text-xs font-medium text-white bg-black/30 px-2 py-1 rounded-full">
                          {room.type}
                        </span>
                      </div>
                      {selectedRoom?.number === room.number && (
                        <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#4b2b21]">
                          <CheckCircle size={16} className="text-white" />
                        </div>

                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#7d6e63]">
                          {room.hasAir && 'Aire'} {room.hasAir && room.hasFan && '/'} {room.hasFan && 'Ventilador'}
                        </span>
                        <span className="font-medium text-[#2b1b14]">
                          ${Math.round((room.priceWithAir || room.priceWithFan || 0)).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAdminAuth && (
        <AdminPasswordModal
          onClose={() => setShowAdminAuth(false)}
          onSuccess={onAdminAuthorized}
        />
      )}
    </div>
  );
}