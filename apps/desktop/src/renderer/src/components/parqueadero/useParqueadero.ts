import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ParkingRates,
  type ParkingRatesInput,
  type ParkingSession,
  type ParkingSessionInput,
  checkoutParkingSessionRequest,
  parkingRatesRequest,
  parkingRequest,
  payParkingSessionRequest,
  startParkingSessionRequest,
  updateParkingRatesRequest
} from '../../lib/api';

export function useParqueadero() {
  const [records, setRecords] = useState<ParkingSession[]>([]);
  const [rates, setRates] = useState<ParkingRates | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, currentRates] = await Promise.all([parkingRequest(), parkingRatesRequest()]);
      setRecords(data);
      setRates(currentRates);
      setSelectedId((current) => data.some((item) => item.id === current) ? current : data[0]?.id ?? null);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las sesiones de parqueadero.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) => [record.ownerName, record.ownerCc, record.licensePlate, record.phone, record.vehicleLine]
      .some((field) => field?.toLowerCase().includes(query)));
  }, [records, search]);

  const selected = filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? null;

  async function start(input: ParkingSessionInput): Promise<void> {
    await startParkingSessionRequest(input);
    await load();
  }

  async function checkout(id: number): Promise<void> {
    await checkoutParkingSessionRequest(id);
    await load();
  }

  async function pay(id: number): Promise<void> {
    await payParkingSessionRequest(id);
    await load();
  }

  async function saveRates(input: ParkingRatesInput): Promise<void> {
    await updateParkingRatesRequest(input);
    await load();
  }

  return {
    records,
    filteredRecords,
    rates,
    selected,
    selectedId,
    setSelectedId,
    search,
    setSearch,
    loading,
    error,
    start,
    checkout,
    pay,
    saveRates,
    reload: load
  };
}