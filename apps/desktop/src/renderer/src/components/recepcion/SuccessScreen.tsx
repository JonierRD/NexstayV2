import { CheckCircle } from 'lucide-react';
import { type Cliente, type Habitacion } from '../../lib/api';
import { type ClientFormData } from './useReception';

type Props = {
  foundClient: Cliente | null;
  clientData: ClientFormData;
  selectedRoom: Habitacion | null;
  resetForm: () => void;
};

export function SuccessScreen({ foundClient, clientData, selectedRoom, resetForm }: Props) {
  return (
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
  );
}