import { useEffect, useMemo, useState } from 'react';
import {
  type Stay,
  checkoutRequest,
  staysActiveRequest,
  staysHistoryRequest
} from '../../lib/api';

export function useHuespedes() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [history, setHistory] = useState<Stay[]>([]);
  const [historyQuery, setHistoryQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutStay, setCheckoutStay] = useState<Stay | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // PROCESO: Cargar huéspedes activos + historial reciente desde la API
  async function load(): Promise<void> {
    setLoading(true);
    try {
      const [active, past] = await Promise.all([staysActiveRequest(), staysHistoryRequest(100)]);
      setStays(active);
      setHistory(past);
      setError('');
    } catch {
      setError('No se pudieron cargar los huéspedes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function handleCheckoutClick(stay: Stay): void {
    setCheckoutStay(stay);
  }

  // PROCESO: Confirmar check-out (POST /stays/:id/checkout)
  async function confirmCheckout(nights: number, paymentMethod: string, paymentConfirmed: boolean): Promise<void> {
    if (!checkoutStay) return;
    setIsCheckingOut(true);
    try {
      await checkoutRequest(checkoutStay.id, { nights, paymentMethod, paymentConfirmed });
      setCheckoutStay(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo realizar el check-out.');
    } finally {
      setIsCheckingOut(false);
    }
  }

  // Filtro de historial por nombre, cédula o habitación
  const filteredHistory = useMemo(() => {
    const value = historyQuery.trim().toLowerCase();
    if (!value) return history;
    return history.filter((stay) =>
      [
        stay.client?.firstName,
        stay.client?.lastName,
        stay.client?.cc,
        stay.roomNumber
      ].some((field) => field?.toLowerCase().includes(value))
    );
  }, [history, historyQuery]);

  return {
    stays,
    history,
    historyQuery,
    setHistoryQuery,
    filteredHistory,
    loading,
    error,
    checkoutStay,
    setCheckoutStay,
    isCheckingOut,
    handleCheckoutClick,
    confirmCheckout,
    load
  };
}