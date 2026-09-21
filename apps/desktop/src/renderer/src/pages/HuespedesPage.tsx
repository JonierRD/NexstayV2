import { BedDouble, Clock3, LogOut, Package, RefreshCw, ShoppingBag, UserRound, X } from 'lucide-react';
import { type FormEvent, type ReactElement, useEffect, useState } from 'react';
import { checkoutRequest, createStaySaleRequest, staysActiveRequest, storeStockRequest, type PublicUser, type Stay, type StoreStock } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { Button } from '../components/ui/button';

type Props = { user: PublicUser };

function elapsed(checkIn: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(checkIn).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remaining = minutes % 60;
  return `${days ? `${days}d ` : ''}${hours}h ${remaining}m`;
}

export function HuespedesPage({ user }: Props): ReactElement {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutStay, setCheckoutStay] = useState<Stay | null>(null);
  const [consumptionStay, setConsumptionStay] = useState<Stay | null>(null);
  const [storeItems, setStoreItems] = useState<StoreStock[]>([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [savingSale, setSavingSale] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    try { setStays(await staysActiveRequest()); setError(''); }
    catch { setError('No se pudieron cargar los huéspedes activos.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => {
    if (!consumptionStay) return;
    void storeStockRequest().then(setStoreItems).catch(() => setError('No se pudo cargar el inventario de tienda.'));
  }, [consumptionStay]);

  async function checkout(password?: string, selectedStay = checkoutStay): Promise<void> {
    if (!selectedStay) return;
    try { await checkoutRequest(selectedStay.id, password ? { adminPassword: password } : {}); setCheckoutStay(null); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo realizar el check-out.'); setCheckoutStay(null); }
  }

  async function saveConsumption(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!consumptionStay || !selectedStock || Number(quantity) < 1) return;
    setSavingSale(true);
    try { await createStaySaleRequest({ stockId: Number(selectedStock), stayId: consumptionStay.id, quantity: Number(quantity) }); setConsumptionStay(null); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cargar el consumo.'); }
    finally { setSavingSale(false); }
  }

  return <div className="flex h-full flex-col gap-3 overflow-auto p-4">
    <div className="flex items-center justify-between"><div><h1 className="text-sm font-semibold">Huéspedes activos</h1><p className="text-[10px] text-[#7d6d61]">Personas alojadas actualmente en el hotel.</p></div><Button onClick={() => void load()} className="h-8 rounded-lg border border-[#dccfca] bg-white px-3 text-xs text-[#4b2b21] hover:bg-[#faf6f2]"><RefreshCw size={13} /> Actualizar</Button></div>
    {error && <div className="rounded-lg border border-[#f1c2c2] bg-[#fff0f0] px-3 py-2 text-xs text-[#b33a3a]">{error}</div>}
    {loading ? <div className="rounded-lg border border-[#eadfd6] bg-white p-8 text-center text-xs text-[#8d7b70]">Cargando huéspedes...</div> : stays.length === 0 ? <div className="rounded-lg border border-dashed border-[#d8c7bb] bg-white p-10 text-center text-xs text-[#8d7b70]">No hay huéspedes activos.</div> : <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">{stays.map((stay) => { const guest = stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre'; const sales = stay.sales ?? []; return <article key={stay.id} className="rounded-xl border border-[#eadfd6] bg-white p-4 shadow-[0_8px_20px_rgba(67,42,27,0.05)]"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8eee7] text-[#7a4a34]"><UserRound size={17} /></div><div><h2 className="text-sm font-semibold">{guest}</h2><p className="text-[10px] text-[#8d7b70]">CC: {stay.client?.cc ?? 'No disponible'}</p></div></div><span className="rounded-full bg-[#e8f5ec] px-2 py-1 text-[10px] font-medium text-[#287344]">Activo</span></div><div className="mt-4 grid grid-cols-2 gap-2 text-[11px]"><div className="rounded-lg bg-[#fcfaf8] p-2"><p className="text-[#8d7b70]"><BedDouble size={13} className="mr-1 inline" />Habitación</p><strong>{stay.roomNumber}</strong></div><div className="rounded-lg bg-[#fcfaf8] p-2"><p className="text-[#8d7b70]"><Clock3 size={13} className="mr-1 inline" />Ingreso</p><strong>{formatDateTime(stay.checkIn)}</strong></div><div className="rounded-lg bg-[#fcfaf8] p-2"><p className="text-[#8d7b70]">Noches transcurridas</p><strong>{elapsed(stay.checkIn)}</strong></div><div className="rounded-lg bg-[#fcfaf8] p-2"><p className="text-[#8d7b70]"><ShoppingBag size={13} className="mr-1 inline" />Consumos</p><strong>{sales.length ? `${sales.length} producto(s)` : 'Sin consumos'}</strong></div></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => setConsumptionStay(stay)} className="h-8 rounded-lg border border-[#dccfca] bg-white text-[11px] text-[#4b2b21] hover:bg-[#faf6f2]"><Package size={13} /> Cargar consumo</Button><Button onClick={() => user.role === 'ADMIN' ? void checkout(undefined, stay) : setCheckoutStay(stay)} className="h-8 rounded-lg bg-[#4b2b21] text-[11px] text-white hover:bg-[#5a3429]"><LogOut size={13} /> Check-out</Button></div></article>; })}</div>}
    {consumptionStay && <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"><form onSubmit={saveConsumption} className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"><button type="button" onClick={() => setConsumptionStay(null)} className="absolute right-3 top-3 text-[#8d7b70]"><X size={18} /></button><h2 className="text-sm font-semibold">Cargar consumo a habitación {consumptionStay.roomNumber}</h2><label className="mt-4 block text-[11px] text-[#7d6d61]">Producto<select value={selectedStock} onChange={(event) => setSelectedStock(event.target.value)} className="mt-1 w-full rounded-lg border border-[#e0d4ca] bg-[#fcfaf8] px-3 py-2 text-xs"><option value="">Selecciona un producto</option>{storeItems.filter((item) => item.quantity > 0).map((item) => <option key={item.id} value={item.id}>{item.product.name} · ${Number(item.product.price).toLocaleString('es-CO')} · Stock {item.quantity}</option>)}</select></label><label className="mt-3 block text-[11px] text-[#7d6d61]">Cantidad<input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-lg border border-[#e0d4ca] bg-[#fcfaf8] px-3 py-2 text-xs" /></label><Button disabled={savingSale || !selectedStock} className="mt-4 h-9 w-full rounded-lg bg-[#4b2b21] text-xs text-white">{savingSale ? 'Cargando...' : 'Cargar a habitación'}</Button></form></div>}
    {checkoutStay && <AdminPasswordModal onClose={() => setCheckoutStay(null)} onSuccess={checkout} />}
  </div>;
}