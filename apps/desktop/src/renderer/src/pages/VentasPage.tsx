import { CalendarRange, History, Package, Search, ShoppingCart, Trash2, Users, X } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { ProductCard } from '../components/ventas/ProductCard';
import { SaleModal } from '../components/ventas/SaleModal';
import { SummaryCard } from '../components/ventas/SummaryCard';
import { currencyFormatter, formatDate } from '../components/ventas/types';
import { useVentas } from '../components/ventas/useVentas';
import { ModuleHeader } from '../components/ui/ModuleHeader';

export function VentasPage({ user }: { user: PublicUser }): ReactElement {
  const [showHistory, setShowHistory] = useState(false);
  const {
    activeStays,
    cart,
    closeSaleModal,
    error,
    externalName,
    filteredProducts,
    filteredSales,
    handleConfirmSale,
    historyDate,
    historySearch,
    historyType,
    isSubmitting,
    loading,
    modalMode,
    openSaleModal,
    products,
    search,
    selectedStayId,
    guestPaymentType,
    setGuestPaymentType,
    setCart,
    setExternalName,
    setHistoryDate,
    setHistorySearch,
    setHistoryType,
    setSearch,
    setSelectedStayId,
    summary,
    removeSale,
    deletingSale
  } = useVentas();

  return (
    <div className="module-page flex h-full flex-col overflow-y-auto">
      <ModuleHeader icon={ShoppingCart} title="Ventas" subtitle="Gestiona la venta de productos y consulta el historial de ventas." metrics={summary.map((card) => ({
        label: card.label,
        value: card.value,
        icon: card.icon
      }))} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sapay-750" />
          <input
            type="text"
            value={showHistory ? historySearch : search}
            onChange={(event) => showHistory ? setHistorySearch(event.target.value) : setSearch(event.target.value)}
            placeholder={showHistory ? 'Buscar por producto, cliente o huésped...' : 'Buscar producto...'}
            className="w-full rounded-xl border border-sapay-350 bg-white py-2.5 pl-9 pr-3 text-[12px] text-sapay-950 outline-none placeholder:text-[#9d8d85]"
          />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowHistory((visible) => !visible)} className="flex items-center gap-1.5 rounded-lg border border-sapay-350 bg-white px-3 py-2 text-xs text-sapay-900 hover:bg-sapay-100">
            {showHistory ? <X size={14} /> : <History size={14} />}
            {showHistory ? 'Cerrar historial' : 'Historial de ventas'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#a23b3b]">
          {error}
        </div>
      )}

      {!showHistory && <section className="rounded-[26px] border border-sapay-350 bg-white p-4 shadow-[0_14px_36px_rgba(52,39,28,0.04)]">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-sapay-950">Productos disponibles</h3>
            <p className="text-[11px] text-sapay-750">Solo se muestran artículos con stock disponible.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[#d8c7b8] bg-sapay-50 text-[12px] text-sapay-750">
            Cargando productos reales...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[#d8c7b8] bg-sapay-50 text-center text-[12px] text-sapay-750">
            No se encontraron productos.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.stockId} product={product} onOpenModal={openSaleModal} />
            ))}
          </div>
        )}
      </section>}

      {showHistory && <section className="rounded-[26px] border border-sapay-350 bg-white p-4 shadow-[0_14px_36px_rgba(52,39,28,0.04)]">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-sapay-950">Historial de ventas</h3>
            <p className="text-[11px] text-sapay-750">Consulta ventas anteriores y filtra el registro.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-sapay-350 bg-sapay-50 px-2.5 py-1.5 text-[10px] font-medium text-sapay-900">
            <CalendarRange size={13} />
            Ventas reales
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <select
            value={historyType}
            onChange={(event) => setHistoryType(event.target.value)}
            className="rounded-xl border border-sapay-350 bg-sapay-50 px-3 py-2 text-[12px] text-sapay-950 outline-none"
          >
            <option value="Todos">Todos</option>
            <option value="Huésped">Huésped</option>
            <option value="Externa">Externa</option>
          </select>

          <input
            type="date"
            value={historyDate}
            onChange={(event) => setHistoryDate(event.target.value)}
            className="rounded-xl border border-sapay-350 bg-sapay-50 px-3 py-2 text-[12px] text-sapay-950 outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.08em] text-sapay-750">
                <th className="px-3 py-2 font-semibold">Fecha</th>
                <th className="px-3 py-2 font-semibold">Producto</th>
                <th className="px-3 py-2 font-semibold">Cantidad</th>
                <th className="px-3 py-2 font-semibold">Precio unit.</th>
                <th className="px-3 py-2 font-semibold">Total</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">Destino</th>
                {user.role === 'ADMIN' && <th className="px-3 py-2 font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={user.role === 'ADMIN' ? 8 : 7} className="px-3 py-8 text-center text-[12px] text-sapay-750">
                    No hay ventas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="rounded-2xl bg-[#fdfaf7] text-[12px] text-sapay-950 shadow-sm ring-1 ring-[#f2e7e0]">
                    <td className="rounded-l-2xl px-3 py-3">{formatDate(sale.fecha)}</td>
                    <td className="px-3 py-3 font-medium">{sale.producto}</td>
                    <td className="px-3 py-3">{sale.cantidad}</td>
                    <td className="px-3 py-3">{currencyFormatter.format(sale.precioUnitario)}</td>
                    <td className="px-3 py-3 font-semibold">{currencyFormatter.format(sale.total)}</td>
                    <td className="px-3 py-3">{sale.tipoVenta}</td>
                    <td className="px-3 py-3">
                      {sale.tipoVenta === 'Huésped' ? sale.habitacion || sale.huesped || 'Sin datos' : sale.clienteExterno || 'Cliente externo'}
                    </td>
                    {user.role === 'ADMIN' && <td className="rounded-r-2xl px-3 py-3"><button disabled={deletingSale === sale.id} onClick={() => void removeSale(sale.id)} title="Eliminar venta y devolver unidades al inventario" className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={14} /></button></td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>}

      {modalMode && (
        <SaleModal
          mode={modalMode}
          cart={cart}
          setCart={setCart}
          availableProducts={products}
          activeStays={activeStays}
          selectedStayId={selectedStayId}
          setSelectedStayId={setSelectedStayId}
          guestPaymentType={guestPaymentType}
          setGuestPaymentType={setGuestPaymentType}
          externalName={externalName}
          setExternalName={setExternalName}
          onClose={closeSaleModal}
          onConfirm={handleConfirmSale}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}