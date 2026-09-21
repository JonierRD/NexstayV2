import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
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
    handleContinueToRoom,
    handleSelectRoom,
    calculateEstimatedTotal,
    handleConfirmCheckin,
    onAdminAuthorized,
    resetForm,
    clearClientData
  } = useReception(user);

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
        <SuccessScreen
          foundClient={foundClient}
          clientData={clientData}
          selectedRoom={selectedRoom}
          resetForm={resetForm}
        />
      )}

      {!success && (
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Panel Izquierdo - Formulario */}
          <div className="flex-1 overflow-y-auto rounded-2xl border border-[#eadfd6] bg-white p-6">
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

      {showAdminAuth && (
        <AdminPasswordModal
          onClose={() => setShowAdminAuth(false)}
          onSuccess={onAdminAuthorized}
        />
      )}
    </div>
  );
}