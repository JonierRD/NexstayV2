import { currencyFormatter, type Product, type SaleMode } from './types';

export function ProductCard({ product, onOpenModal }: { product: Product; onOpenModal: (product: Product, mode: SaleMode) => void }) {
  return (
    <div className="rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_12px_32px_rgba(52,39,28,0.04)] transition hover:-translate-y-0.5 hover:border-[#d9cabd] hover:shadow-[0_16px_40px_rgba(52,39,28,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-sapay-950">{product.nombre}</p>
          <p className="mt-1 text-[11px] text-sapay-750">{product.categoria ?? 'Inventario'}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
          Disponible
        </span>
      </div>

      <div className="mt-4 space-y-2 text-[12px] text-sapay-900">
        <div className="flex items-center justify-between">
          <span className="text-sapay-750">Precio</span>
          <span className="font-semibold text-sapay-950">{currencyFormatter.format(product.precio)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sapay-750">Disponibles</span>
          <span className="font-semibold text-sapay-950">{product.cantidadDisponible}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpenModal(product, 'guest')}
          className="rounded-xl bg-[#f3c34a] px-3 py-2 text-[11px] font-semibold text-sapay-950 transition hover:bg-[#edb92d]"
        >
          Vender a huésped
        </button>
        <button
          type="button"
          onClick={() => onOpenModal(product, 'external')}
          className="rounded-xl border border-[#d7c6bb] bg-sapay-50 px-3 py-2 text-[11px] font-semibold text-sapay-900 transition hover:border-[#cdb9ab] hover:bg-[#fff5ee]"
        >
          Venta externa
        </button>
      </div>
    </div>
  );
}