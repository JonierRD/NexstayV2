import { useEffect, useState } from 'react';
import { type Stay, checkoutRequest, staysActiveRequest } from '../../lib/api';

export function useHuespedes() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutStay, setCheckoutStay] = useState<Stay | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // PROCESO: Cargar huéspedes activos desde la API (GET /stays/active con lavandería y ventas)
  async function load(): Promise<void> {
    setLoading(true);
    try {
      setStays(await staysActiveRequest());
      setError('');
    } catch {
      setError('No se pudieron cargar los huéspedes activos.');
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
  async function confirmCheckout(nights?: number): Promise<void> {
    if (!checkoutStay) return;
    setIsCheckingOut(true);
    try {
      await checkoutRequest(checkoutStay.id, nights);
      setCheckoutStay(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo realizar el check-out.');
    } finally {
      setIsCheckingOut(false);
    }
  }

  return {
    stays,
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
