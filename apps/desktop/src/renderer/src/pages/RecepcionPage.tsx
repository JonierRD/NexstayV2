import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { useReception } from '../components/recepcion/useReception';
import { ClientDataStep } from '../components/recepcion/ClientDataStep';
import { SelectRoomStep } from '../components/recepcion/SelectRoomStep';
import { ConfirmStep } from '../components/recepcion/ConfirmStep';
import { AvailableRoomsPanel } from '../components/recepcion/AvailableRoomsPanel';
import { SuccessScreen } from '../components/recepcion/SuccessScreen';

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
    nights,
    setNights,
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
    <div className="flex h-full min-h-0 flex-1 flex-col p-3 sm:p-4 overflow-hidden">
      <div className="mb-3 shrink-0">
        <h1 className="text-base sm:text-lg font-semibold text-sapay-950">Recepción - Check-In</h1>
        <p className="text-xs text-sapay-700">Registro de huéspedes y asignación de habitaciones</p>
      </div>

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
                nights={nights}
                setNights={setNights}
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
                nights={nights}
                setNights={setNights}
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