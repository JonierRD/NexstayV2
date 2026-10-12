import {
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';
import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { LoadingOverlay } from '../components/ui/LoadingOverlay';
import { InventoryFilters } from '../components/inventario/InventoryFilters';
import { InventoryTable } from '../components/inventario/InventoryTable';
import { ProductModal } from '../components/inventario/ProductModal';
import { useInventario } from '../components/inventario/useInventario';
import { ModuleHeader } from '../components/ui/ModuleHeader';

export function InventarioPage({ user }: { user: PublicUser }): ReactElement {
  const inv = useInventario();

  const filterActive =
    inv.search !== '' || inv.selectedCategory !== 'TODAS' || inv.stockFilter !== 'ALL';

  return (
    <div className="module-page flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#fbf8f4]">
      {inv.actionLoading && <LoadingOverlay message={inv.actionLoading} />}

      <ModuleHeader icon={Package} title="Inventario" subtitle="Control de existencias, suministros, mecato y bebidas para huéspedes y recepción." metrics={[
        { label: 'Total productos', value: inv.metrics.totalItems, icon: Package },
        { label: 'Stock normal', value: inv.metrics.normalCount, icon: CheckCircle2 },
        { label: 'Stock crítico', value: inv.metrics.lowStockCount, icon: AlertTriangle },
        { label: 'Agotados', value: inv.metrics.outOfStockCount, icon: AlertTriangle }
      ]} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="min-w-[260px] flex-1">
          <InventoryFilters
            search={inv.search}
            onSearchChange={inv.setSearch}
            selectedCategory={inv.selectedCategory}
            onCategoryChange={inv.setSelectedCategory}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            onClick={inv.fetchInventory}
            disabled={inv.loading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-sapay-450 bg-white px-3 text-[12px] font-medium text-sapay-900 hover:bg-sapay-200 shadow-sm"
          >
            <RefreshCw size={14} className={cn(inv.loading && 'animate-spin')} />
            Actualizar
          </Button>

          <Button
            onClick={inv.openCreateModal}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-sapay-900 px-4 text-[12px] font-medium text-white hover:bg-sapay-850 shadow-sm transition"
          >
            <Plus size={16} />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Mensajes de Alerta / Éxito */}
      {inv.error && (
        <div className="mb-2 shrink-0 flex items-center justify-between rounded-xl border border-danger-150 bg-danger-50 px-4 py-2.5 text-[12px] text-danger">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{inv.error}</span>
          </div>
          <button onClick={() => inv.setError(null)} className="text-danger hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {inv.successMsg && (
        <div className="mb-2 shrink-0 flex items-center justify-between rounded-xl border border-success-100 bg-success-50 px-4 py-2.5 text-[12px] text-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{inv.successMsg}</span>
          </div>
          <button onClick={() => inv.setSuccessMsg(null)} className="text-success hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Lista / Tabla de Productos estilo Excel */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {inv.loading ? (
          <div className="flex h-64 items-center justify-center rounded-[20px] border border-dashed border-sapay-350 bg-white">
            <div className="flex flex-col items-center gap-2 text-sapay-750">
              <RefreshCw size={24} className="animate-spin text-sapay-900" />
              <p className="text-[12px] font-medium">Cargando inventario...</p>
            </div>
          </div>
        ) : inv.filteredItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-[20px] border border-dashed border-sapay-350 bg-white p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sapay-200 text-sapay-900">
              <Package size={22} />
            </div>
            <h3 className="mt-3 text-[14px] font-semibold text-sapay-950">No se encontraron artículos</h3>
            <p className="mt-1 max-w-sm text-[11px] text-sapay-750">
              {filterActive
                ? 'No hay productos que coincidan con los filtros aplicados. Intenta restablecer la búsqueda.'
                : 'El catálogo de inventario está vacío. Comienza registrando tu primer producto.'}
            </p>
            {filterActive && (
              <Button
                onClick={() => {
                  inv.setSearch('');
                  inv.setSelectedCategory('TODAS');
                  inv.setStockFilter('ALL');
                }}
                className="mt-4 h-8 rounded-xl border border-sapay-450 bg-white px-3 text-[11px] text-sapay-900 hover:bg-sapay-200"
              >
                Restablecer filtros
              </Button>
            )}
          </div>
        ) : (
          <InventoryTable
            items={inv.filteredItems}
            totalItems={inv.items.length}
            onQuickAdjust={inv.quickAdjust}
            onEdit={inv.openEditModal}
            onDelete={inv.requestDelete}
          />
        )}
      </div>

      {/* Modal Crear / Editar Producto */}
      {inv.isModalOpen && (
        <ProductModal
          editingItem={inv.editingItem}
          formData={inv.formData}
          setFormData={inv.setFormData}
          onSubmit={inv.saveProduct}
          onClose={inv.closeModal}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      {inv.itemToDelete && (
        <ConfirmModal
          title="¿Eliminar producto de inventario?"
          message={`¿Estás seguro de que deseas eliminar permanentemente "${inv.itemToDelete.product.name}"? Esta acción borrará el registro de stock y del catálogo.`}
          confirmLabel="Eliminar producto"
          confirmDanger
          onConfirm={inv.confirmDelete}
          onClose={() => inv.setItemToDelete(null)}
        />
      )}
    </div>
  );
}
