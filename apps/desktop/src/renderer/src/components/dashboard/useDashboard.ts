import { useCallback, useEffect, useMemo, useState } from 'react';
import { type PublicUser } from '../../lib/api';
import { type Habitacion, habitacionesRequest } from '../../lib/api/habitaciones';
import {
  type StaySale,
  type StockItem,
  inventoryRequest,
  salesRequest
} from '../../lib/api/inventory';
import { type Laundry, laundryRequest } from '../../lib/api/laundry';
import { type Stay, staysActiveRequest } from '../../lib/api/stays';
import {
  computePendingReceivable,
  computeRoomMetrics,
  computeTodaySalesRevenue,
  isToday,
  selectActiveLaundry
} from './metrics';

export function useDashboard(user: PublicUser) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Habitacion[]>([]);
  const [activeStays, setActiveStays] = useState<Stay[]>([]);
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [laundryOrders, setLaundryOrders] = useState<Laundry[]>([]);
  const [sales, setSales] = useState<StaySale[]>([]);

  const isAdmin = user?.role === 'ADMIN';

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsData, staysData, invData, laundryData] = await Promise.all([
        habitacionesRequest().catch(() => [] as Habitacion[]),
        staysActiveRequest().catch(() => [] as Stay[]),
        inventoryRequest().catch(() => [] as StockItem[]),
        laundryRequest().catch(() => [] as Laundry[])
      ]);

      setRooms(roomsData);
      setActiveStays(staysData);
      setInventory(invData);
      setLaundryOrders(laundryData);

      if (isAdmin) {
        try {
          setSales(await salesRequest());
        } catch {
          setSales([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const roomMetrics = useMemo(() => computeRoomMetrics(rooms), [rooms]);
  const todayCheckIns = useMemo(
    () => activeStays.filter((stay) => isToday(stay.checkIn)).length,
    [activeStays]
  );
  const todaySalesRevenue = useMemo(() => computeTodaySalesRevenue(sales), [sales]);
  const pendingReceivable = useMemo(() => computePendingReceivable(activeStays), [activeStays]);
  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.quantity <= item.minStock),
    [inventory]
  );
  const activeLaundry = useMemo(() => selectActiveLaundry(laundryOrders), [laundryOrders]);

  const recentGuests = useMemo(
    () =>
      [...activeStays]
        .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
        .slice(0, 5),
    [activeStays]
  );

  return {
    isAdmin,
    loading,
    error,
    reload: loadDashboardData,
    activeStays,
    roomMetrics,
    guestsCount: activeStays.length,
    todayCheckIns,
    todaySalesRevenue,
    pendingReceivable,
    lowStockItems,
    activeLaundry,
    recentGuests
  };
}