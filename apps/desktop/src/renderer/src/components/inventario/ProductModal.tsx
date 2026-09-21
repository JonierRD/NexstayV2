import { Package, X } from 'lucide-react';
import { type StockItem } from '../../lib/api';
import { Button } from '../ui/button';
import { type ProductFormData } from './types';

export function ProductModal({
  editingItem,
  formData,
  setFormData,
  onSubmit,
  onClose
}: {
  editingItem: StockItem | null;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-[480px] rounded-[24px] border border-sapay-350 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sapay-650 hover:text-sapay-900 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sapay-200 text-sapay-900 border border-sapay-350">
            <Package size={20} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-sapay-950">
              {editingItem ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
            </h3>
            <p className="text-[11px] text-sapay-750">
              {editingItem
                ? 'Actualiza los datos de venta y stock del artículo.'
                : 'Ingresa los detalles para registrar un nuevo producto en tienda.'}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
          {/* Nombre */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-sapay-900">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Agua Mineral 600ml, Papas Fritas..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none transition placeholder:text-sapay-550 focus:border-sapay-600 focus:bg-white"
              autoFocus
            />
          </div>

          {/* Categoría y Precio en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-sapay-900">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none transition focus:border-sapay-600 focus:bg-white"
              >
                <option value="BEBIDAS">Bebidas</option>
                <option value="SNACKS">Snacks & Mecato</option>
                <option value="ASEO">Aseo Personal</option>
                <option value="TIENDA">Tienda General</option>
                <option value="LENCERIA">Lencería</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-sapay-900">
                Precio Unitario ($) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                placeholder="Ej: 3000"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value === '' ? '' : Number(e.target.value)
                  })
                }
                className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none transition placeholder:text-sapay-550 focus:border-sapay-600 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Stock y Stock Mínimo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-sapay-900">
                {editingItem ? 'Cantidad Actual' : 'Stock Inicial'}
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: e.target.value === '' ? '' : Number(e.target.value)
                  })
                }
                className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none transition focus:border-sapay-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-sapay-900">
                Alerta Stock Mínimo
              </label>
              <input
                type="number"
                min="0"
                placeholder="Ej: 5"
                value={formData.minStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minStock: e.target.value === '' ? '' : Number(e.target.value)
                  })
                }
                className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none transition focus:border-sapay-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-sapay-900">
              Ubicación en Almacén / Vitrina (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Nevera 1, Estante B2, Recepción..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none transition placeholder:text-sapay-550 focus:border-sapay-600 focus:bg-white"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1 block text-[11px] font-bold text-sapay-900">
              Descripción o Notas (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre presentación, sabor o tamaño..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-sapay-400 bg-sapay-100 p-2.5 text-[12px] text-sapay-950 outline-none transition placeholder:text-sapay-550 focus:border-sapay-600 focus:bg-white resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex gap-2 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-xl border border-sapay-450 bg-white text-[12px] font-medium text-sapay-900 hover:bg-sapay-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 rounded-xl bg-sapay-900 text-[12px] font-medium text-white hover:bg-sapay-850"
            >
              {editingItem ? 'Guardar Cambios' : 'Registrar Producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}