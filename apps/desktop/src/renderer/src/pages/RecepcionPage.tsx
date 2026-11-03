import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { useReception } from '../components/recepcion/useReception';
import { ClientDataStep } from '../components/recepcion/ClientDataStep';
import { SelectRoomStep } from '../components/recepcion/SelectRoomStep';
import { ConfirmStep } from '../components/recepcion/ConfirmStep';
import { AvailableRoomsPanel } from '../components/recepcion/AvailableRoomsPanel';
import { SuccessScreen } from '../components/recepcion/SuccessScreen';
import { ReceptionHeader } from '../components/recepcion/ReceptionHeader';

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
    upcomingReservationsByRoom,
    handleSearchClient,
    handleContinueToRoom,
    handleSelectRoom,
    calculateEstimatedTotal,
    handleConfirmCheckin,
    resetForm,
    clearClientData
  } = useReception(user);

  return (
    <div className="module-page flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <ReceptionHeader totalRooms={rooms.length} availableRooms={rooms.filter((room) => room.status === 'DISPONIBLE').length} />

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
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
          <AvailableRoomsPanel loading={loading} rooms={rooms} availableRooms={availableRooms} selectedRoom={selectedRoom} handleSelectRoom={handleSelectRoom} />
          {/* Panel Izquierdo - Formulario */}
          <div className="order-first flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 border-sapay-500 bg-white p-4 shadow-md shadow-sapay-900/10 sm:p-5 lg:w-[48%] lg:p-5">
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
                upcomingByRoom={upcomingReservationsByRoom}
                selectedRoom={selectedRoom}
                handleSelectRoom={handleSelectRoom}
                acType={acType}
                setAcType={setAcType}
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
                upcomingReservation={selectedRoom ? upcomingReservationsByRoom.get(selectedRoom.number) : undefined}
                loading={loading}
                handleConfirmCheckin={handleConfirmCheckin}
                setStep={setStep}
              />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
