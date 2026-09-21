import { Edit2, MapPin, Trash2 } from 'lucide-react';
import { type StockItem } from '../../lib/api';
import { cn } from '../../lib/utils';

function getStockStatusBadge(quantity: number, minStock: number) {
  if (quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#f0c8c4] bg-[#fff0ee] px-2.5 py-0.5 text-[10px] font-semibold text-[#c94a43]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#c94a43] animate-pulse" />
        Agotado
      </span>
    );
  }
  if (quantity <= minStock) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#f2dbab] bg-[#fff5df] px-2.5 py-0.5 text-[10px] font-semibold text-[#c78b14]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#c78b14]" />
        Stock Bajo ({quantity} de mín. {minStock})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#c6e8cf] bg-[#e9f6eb] px-2.5 py-0.5 text-[10px] font-semibold text-[#2f8f4e]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2f8f4e]" />
      Disponible
    </span>
  );
}

export function InventoryTable({
  items,
  totalItems,
  onQuickAdjust,
  onEdit,
  onDelete
}: {
  items: StockItem[];
  totalItems: number;
  onQuickAdjust: (item: StockItem, delta: number) => void;
  onEdit: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#eadfd6] bg-white shadow-[0_10px_30px_rgba(67,42,27,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#eadfd6] bg-[#faf6f2] text-[11px] font-bold uppercase tracking-wider text-[#6e584a]">
              <th className="py-3 px-4">Producto</th>
              <th className="py-3 px-3">Categoría</th>
              <th className="py-3 px-3">Ubicación</th>
              <th className="py-3 px-3 text-right">Precio Venta</th>
              <th className="py-3 px-3 text-center">Stock / Mín</th>
              <th className="py-3 px-3 text-center">Estado</th>
              <th className="py-3 px-3 text-center">Ajuste Rápido</th>
              <th className="py-3 px-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e6de] text-[12px] text-[#2b1b14]">
            {items.map((item) => {
              const prod = item.product;
              const price = Number(prod.price || 0);
              const isOutOfStock = item.quantity === 0;

              return (
                <tr
                  key={item.id}
                  className={cn(
                    'transition-colors duration-150 hover:bg-[#fcfaf8]',
                    isOutOfStock && 'bg-[#fffafa]'
                  )}
                >
                  {/* Producto: Nombre y descripción */}
                  <td className="py-3 px-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#2b1b14]">{prod.name}</span>
                      {prod.description ? (
                        <span className="line-clamp-1 text-[11px] text-[#7d6d61]">{prod.description}</span>
                      ) : (
                        <span className="text-[10px] italic text-[#a49486]">Sin descripción</span>
                      )}
                    </div>
                  </td>

                  {/* Categoría */}
                  <td className="py-3 px-3 align-middle">
                    <span className="inline-block rounded-lg bg-[#faf6f2] border border-[#f0e6de] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6e584a]">
                      {prod.category || 'TIENDA'}
                    </span>
                  </td>

                  {/* Ubicación */}
                  <td className="py-3 px-3 align-middle text-[#7d6d61]">
                    {item.location ? (
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin size={12} className="text-[#a49486] shrink-0" />
                        <span>{item.location}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#b4a497]">-</span>
                    )}
                  </td>

                  {/* Precio Venta */}
                  <td className="py-3 px-3 align-middle text-right font-extrabold text-[#4b2b21]">
                    ${price.toLocaleString('es-CO')}
                  </td>

                  {/* Existencias / Mínimo */}
                  <td className="py-3 px-3 align-middle text-center">
                    <span className="font-bold text-[#2b1b14]">{item.quantity}</span>
                    <span className="text-[10px] text-[#8d7b70] ml-1">/ mín {item.minStock}</span>
                  </td>

                  {/* Estado Badge */}
                  <td className="py-3 px-3 align-middle text-center">
                    {getStockStatusBadge(item.quantity, item.minStock)}
                  </td>

                  {/* Ajuste Rápido */}
                  <td className="py-3 px-3 align-middle text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={item.quantity <= 0}
                        onClick={() => onQuickAdjust(item, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dccfca] bg-white text-[11px] font-bold text-[#4b2b21] transition hover:bg-[#fff0ee] hover:border-[#f0c8c4] hover:text-[#c94a43] disabled:opacity-30 disabled:pointer-events-none"
                        title="Restar 1 unidad"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickAdjust(item, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dccfca] bg-white text-[11px] font-bold text-[#4b2b21] transition hover:bg-[#e9f6eb] hover:border-[#c6e8cf] hover:text-[#2f8f4e]"
                        title="Sumar 1 unidad"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => onQuickAdjust(item, 5)}
                        className="flex h-7 px-2 items-center justify-center rounded-lg border border-[#dccfca] bg-[#faf6f2] text-[10px] font-bold text-[#4b2b21] transition hover:bg-[#e9f6eb] hover:border-[#c6e8cf] hover:text-[#2f8f4e]"
                        title="Sumar 5 unidades"
                      >
                        +5
                      </button>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-3 align-middle text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dccfca] bg-white text-[#7d6d61] hover:border-[#b08f7c] hover:text-[#4b2b21] hover:bg-[#faf6f2] transition"
                        title="Editar producto"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#f0c8c4] bg-white text-[#c94a43] hover:bg-[#fff0ee] transition"
                        title="Eliminar producto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Footer tipo hoja de cálculo con resumen de registros */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#eadfd6] bg-[#faf6f2] px-4 py-2 text-[11px] text-[#7d6d61] gap-1">
        <span>
          Mostrando <strong className="text-[#2b1b14]">{items.length}</strong> de <strong className="text-[#2b1b14]">{totalItems}</strong> productos
        </span>
        <span>
          Valor en stock filtrado: <strong className="text-[#4b2b21]">${items.reduce((acc, it) => acc + it.quantity * Number(it.product.price || 0), 0).toLocaleString('es-CO')}</strong>
        </span>
      </div>
    </div>
  );
}