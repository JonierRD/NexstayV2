import { type FormEvent, useEffect, useState } from 'react';
import {
  type Stay,
  type StoreStock,
  checkoutRequest,
  createStaySaleRequest,
  staysActiveRequest,
  storeStockRequest
} from '../../lib/api';

export function useHuespedes() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consumptionStay, setConsumptionStay] = useState<Stay | null>(null);
  const [storeItems, setStoreItems] = useState<StoreStock[]>([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [savingSale, setSavingSale] = useState(false);

  // PROCESO: Cargar huéspedes activos desde la API (GET /stays/active)
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

  // PROCESO: Al abrir el modal de consumo, cargar el inventario de tienda
  useEffect(() => {
    if (!consumptionStay) return;
    void storeStockRequest()
      .then(setStoreItems)
      .catch(() => setError('No se pudo cargar el inventario de tienda.'));
  }, [consumptionStay]);

  // PROCESO: Realizar check-out (POST /stays/:id/checkout)
  // Liberar la habitacion es operacion normal de recepcion: no pide contrasena.
  async function checkout(selectedStay: Stay): Promise<void> {
    if (!selectedStay) return;
    try {
      await checkoutRequest(selectedStay.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo realizar el check-out.');
    }
  }

  function handleCheckout(stay: Stay): void {
    void checkout(stay);
  }

  // PROCESO: Registrar consumo a la habitación (POST /inventory/sales/stays)
  async function saveConsumption(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!consumptionStay || !selectedStock || Number(quantity) < 1) return;
    setSavingSale(true);
    try {
      await createStaySaleRequest({
        stockId: Number(selectedStock),
        stayId: consumptionStay.id,
        quantity: Number(quantity)
      });
      setConsumptionStay(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el consumo.');
    } finally {
      setSavingSale(false);
    }
  }

  return {
    stays,
    loading,
    error,
    consumptionStay,
    setConsumptionStay,
    storeItems,
    selectedStock,
    setSelectedStock,
    quantity,
    setQuantity,
    savingSale,
    load,
    checkout,
    handleCheckout,
    saveConsumption
  };
}
