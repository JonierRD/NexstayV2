import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  closeParkingSessionRequest,
  createParkingSessionRequest,
  parkingSessionsRequest,
  parkingVehicleTypesRequest,
  type ParkingSession,
  type ParkingVehicleType
} from '../../lib/api';

export function useParqueadero() {
  const [types, setTypes] = useState<ParkingVehicleType[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedTypes, loadedSessions] = await Promise.all([parkingVehicleTypesRequest(), parkingSessionsRequest()]);
      setTypes(loadedTypes);
      setSessions(loadedSessions);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el parqueadero.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeSessions = useMemo(() => sessions.filter((session) => session.status === 'ACTIVO'), [sessions]);
  const register = async (input: Parameters<typeof createParkingSessionRequest>[0]) => {
    await createParkingSessionRequest(input);
    await load();
  };
  const close = async (id: number) => {
    await closeParkingSessionRequest(id);
    await load();
  };

  return { types, sessions, activeSessions, loading, error, register, close, load };
}
