import { CalendarDays, CheckCircle, Clock3, PackageCheck } from 'lucide-react';
import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { useReception } from '../components/recepcion/useReception';
import { ClientDataStep } from '../components/recepcion/ClientDataStep';
import { SelectRoomStep } from '../components/recepcion/SelectRoomStep';
import { ConfirmStep } from '../components/recepcion/ConfirmStep';
import { AvailableRoomsPanel } from '../components/recepcion/AvailableRoomsPanel';
import { SuccessScreen } from '../components/recepcion/SuccessScreen';
import { ModuleHeader } from '../components/ui/ModuleHeader';

export function RecepcionPage({ user }: { user: PublicUser }): ReactElement {
  const {
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
    checkInDate,
    setCheckInDate,
    error,
    success,
    clientData,
    setClientData,
    hasSearched,
    ccHistory,
    availableRooms,
    handleSearchClient,
    handleContinueToRoom,
    handleSelectRoom,
    calculateEstimatedTotal,
    handleConfirmCheckin,
    resetForm,
    clearClientData
  } = useReception(user);

  return (
    <div className="module-page flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ModuleHeader icon={CalendarDays} title="Recepción - Check-In" subtitle="Registro de huéspedes y asignación de habitaciones." metrics={[
        { label: 'Habitaciones', value: rooms.length, icon: PackageCheck },
        { label: 'Disponibles', value: rooms.filter((room) => room.status === 'DISPONIBLE').length, icon: CheckCircle }
      ]} />

      {error && (
        <div className="mb-3 shrink-0 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && step === 'SUCCESS' && (
        <SuccessScreen
          foundClient={foundClient}
          clientData={clientData}
          selectedRoom={selectedRoom}
          resetForm={resetForm}
        />
      )}

      {!success && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4 overflow-hidden lg:flex-row">
          {/* Panel Izquierdo - Formulario */}
          <div className="flex min-h-0 flex-1 w-full lg:w-1/2 flex-col overflow-y-auto rounded-2xl border border-sapay-350 bg-white p-4 sm:p-5 lg:p-6">
            {step === 'CLIENT_DATA' && (
              <ClientDataStep
                ccSearch={ccSearch}
                setCcSearch={setCcSearch}
                ccHistory={ccHistory}
                handleSearchClient={handleSearchClient}
                loading={loading}
                hasSearched={hasSearched}
                foundClient={foundClient}
                clientData={clientData}
                setClientData={setClientData}
                checkInDate={checkInDate}
                setCheckInDate={setCheckInDate}
                handleContinueToRoom={handleContinueToRoom}
                onClear={clearClientData}
              />
            )}

            {step === 'SELECT_ROOM' && (
              <SelectRoomStep
                rooms={rooms}
                availableRooms={availableRooms}
                selectedRoom={selectedRoom}
                handleSelectRoom={handleSelectRoom}
                acType={acType}
                setAcType={setAcType}
                checkInDate={checkInDate}
                setCheckInDate={setCheckInDate}
                setStep={setStep}
              />
            )}

            {step === 'CONFIRM' && (
              <ConfirmStep
                clientData={clientData}
                ccSearch={ccSearch}
                selectedRoom={selectedRoom}
                acType={acType}
                setAcType={setAcType}
                checkInDate={checkInDate}
                setCheckInDate={setCheckInDate}
                calculateEstimatedTotal={calculateEstimatedTotal}
                loading={loading}
                handleConfirmCheckin={handleConfirmCheckin}
                setStep={setStep}
              />
            )}
          </div>

          {/* Panel Derecho - Habitaciones Disponibles */}
          <AvailableRoomsPanel
            loading={loading}
            rooms={rooms}
            availableRooms={availableRooms}
            selectedRoom={selectedRoom}
            handleSelectRoom={handleSelectRoom}
          />
        </div>
      )}
    </div>
  );
}