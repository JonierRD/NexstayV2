import { useEffect, useMemo, useState } from 'react';
import {
  type Stay,
  checkoutRequest,
  registerStayPaymentRequest,
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
  const [paymentStay, setPaymentStay] = useState<Stay | null>(null);
  const [detailStay, setDetailStay] = useState<Stay | null>(null);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<number>>(new Set());
  const [isRegisteringPayment, setIsRegisteringPayment] = useState(false);

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

  useEffect(() => {
    const interval = window.setInterval(() => {
      void staysActiveRequest().then(setStays).catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  function handleCheckoutClick(stay: Stay): void {
    setCheckoutStay(stay);
  }

  function handlePaymentClick(stay: Stay): void {
    setPaymentStay(stay);
  }

  async function removeHistory(ids: number[], password: string): Promise<void> {
    const { deleteStayRequest } = await import('../../lib/api');
    for (const id of ids) await deleteStayRequest(id, password);
    setSelectedHistoryIds(new Set());
    await load();
  }

  // PROCESO: Registrar pago parcial (POST /stays/:id/payments)
  async function confirmPayment(amount: number, method: string, reference?: string): Promise<void> {
    if (!paymentStay) return;
    setIsRegisteringPayment(true);
    try {
      await registerStayPaymentRequest(paymentStay.id, { amount, method, reference });
      setPaymentStay(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo registrar el pago.');
    } finally {
      setIsRegisteringPayment(false);
    }
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
    setError,
    checkoutStay,
    setCheckoutStay,
    isCheckingOut,
    handleCheckoutClick,
    confirmCheckout,
    paymentStay,
    setPaymentStay,
    detailStay,
    setDetailStay,
    selectedHistoryIds,
    setSelectedHistoryIds,
    removeHistory,
    isRegisteringPayment,
    handlePaymentClick,
    confirmPayment,
    load
  };
}