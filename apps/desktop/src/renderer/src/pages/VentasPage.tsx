import { CalendarRange, Search, ShoppingCart, Sparkles } from 'lucide-react';
import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { ProductCard } from '../components/ventas/ProductCard';
import { SaleModal } from '../components/ventas/SaleModal';
import { SummaryCard } from '../components/ventas/SummaryCard';
import { currencyFormatter, formatDate } from '../components/ventas/types';
import { useVentas } from '../components/ventas/useVentas';

export function VentasPage({ user }: { user: PublicUser }): ReactElement {
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
    setCart,
    setExternalName,
    setHistoryDate,
    setHistorySearch,
    setHistoryType,
    setSearch,
    setSelectedStayId,
    summary
  } = useVentas();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadfd6] bg-white p-4 shadow-[0_12px_28px_rgba(52,39,28,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7efe8] text-[#2b1b14]">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#2b1b14]">Ventas</h2>
            <p className="text-[11px] text-[#7d6d61]">Gestiona la venta de productos y consulta el historial de ventas.</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[#eadfd6] bg-[#fffaf5] px-3 py-1.5 text-[11px] font-medium text-[#4b2b21] sm:flex">
          <Sparkles size={14} className="text-[#946f2d]" />
          Panel de comercio
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#f1c2c2] bg-[#fff0f0] px-3 py-2 text-[11px] text-[#a23b3b]">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} icon={card.icon} tint={card.tint} />
        ))}
      </div>

      <section className="rounded-[26px] border border-[#eadfd6] bg-white p-4 shadow-[0_14px_36px_rgba(52,39,28,0.04)]">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#2b1b14]">Productos disponibles</h3>
            <p className="text-[11px] text-[#7d6d61]">Solo se muestran artículos con stock disponible.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6d61]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-xl border border-[#eadfd6] bg-[#fffaf5] py-2.5 pl-9 pr-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#9d8d85] focus:border-[#d7b778]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[#d8c7b8] bg-[#fffaf5] text-[12px] text-[#7d6d61]">
            Cargando productos reales...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[#d8c7b8] bg-[#fffaf5] text-center text-[12px] text-[#7d6d61]">
            No se encontraron productos.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.stockId} product={product} onOpenModal={openSaleModal} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[26px] border border-[#eadfd6] bg-white p-4 shadow-[0_14px_36px_rgba(52,39,28,0.04)]">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#2b1b14]">Historial de ventas</h3>
            <p className="text-[11px] text-[#7d6d61]">Consulta ventas anteriores y filtra el registro.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#eadfd6] bg-[#fffaf5] px-2.5 py-1.5 text-[10px] font-medium text-[#4b2b21]">
            <CalendarRange size={13} />
            Ventas reales
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6d61]" />
            <input
              type="text"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Buscar"
              className="w-full rounded-xl border border-[#eadfd6] bg-[#fffaf5] py-2 pl-8 pr-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#9d8d85]"
            />
          </div>

          <select
            value={historyType}
            onChange={(event) => setHistoryType(event.target.value)}
            className="rounded-xl border border-[#eadfd6] bg-[#fffaf5] px-3 py-2 text-[12px] text-[#2b1b14] outline-none"
          >
            <option value="Todos">Todos</option>
            <option value="Huésped">Huésped</option>
            <option value="Externa">Externa</option>
          </select>

          <input
            type="date"
            value={historyDate}
            onChange={(event) => setHistoryDate(event.target.value)}
            className="rounded-xl border border-[#eadfd6] bg-[#fffaf5] px-3 py-2 text-[12px] text-[#2b1b14] outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.08em] text-[#7d6d61]">
                <th className="px-3 py-2 font-semibold">Fecha</th>
                <th className="px-3 py-2 font-semibold">Producto</th>
                <th className="px-3 py-2 font-semibold">Cantidad</th>
                <th className="px-3 py-2 font-semibold">Precio unit.</th>
                <th className="px-3 py-2 font-semibold">Total</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">Destino</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-[#7d6d61]">
                    No hay ventas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="rounded-2xl bg-[#fdfaf7] text-[12px] text-[#2b1b14] shadow-sm ring-1 ring-[#f2e7e0]">
                    <td className="rounded-l-2xl px-3 py-3">{formatDate(sale.fecha)}</td>
                    <td className="px-3 py-3 font-medium">{sale.producto}</td>
                    <td className="px-3 py-3">{sale.cantidad}</td>
                    <td className="px-3 py-3">{currencyFormatter.format(sale.precioUnitario)}</td>
                    <td className="px-3 py-3 font-semibold">{currencyFormatter.format(sale.total)}</td>
                    <td className="px-3 py-3">{sale.tipoVenta}</td>
                    <td className="rounded-r-2xl px-3 py-3">
                      {sale.tipoVenta === 'Huésped' ? sale.habitacion || sale.huesped || 'Sin datos' : sale.clienteExterno || 'Cliente externo'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalMode && (
        <SaleModal
          mode={modalMode}
          cart={cart}
          setCart={setCart}
          availableProducts={products}
          activeStays={activeStays}
          selectedStayId={selectedStayId}
          setSelectedStayId={setSelectedStayId}
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