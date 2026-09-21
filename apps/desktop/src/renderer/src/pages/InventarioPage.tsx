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
import { Button } from '../components/ui/button';
import { ConfirmModal } from '../components/ConfirmModal';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { InventoryFilters } from '../components/inventario/InventoryFilters';
import { InventoryStats } from '../components/inventario/InventoryStats';
import { InventoryTable } from '../components/inventario/InventoryTable';
import { ProductModal } from '../components/inventario/ProductModal';
import { useInventario } from '../components/inventario/useInventario';

export function InventarioPage({ user }: { user: PublicUser }): ReactElement {
  const inv = useInventario(user.role === 'ADMIN');

  const filterActive =
    inv.search !== '' || inv.selectedCategory !== 'TODAS' || inv.stockFilter !== 'ALL';

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#fbf8f4] p-5">
      {inv.actionLoading && <LoadingOverlay message={inv.actionLoading} />}

      {/* Header Principal */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#2b1b14]">Inventario</h1>
            <span className="rounded-full bg-[#eadfd6] px-2.5 py-0.5 text-[11px] font-semibold text-[#4b2b21]">
              {inv.items.length} {inv.items.length === 1 ? 'artículo' : 'artículos'}
            </span>
          </div>
          <p className="text-[12px] text-[#7d6d61]">
            Control de existencias, suministros, mecato y bebidas para huéspedes y recepción.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={inv.fetchInventory}
            disabled={inv.loading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#dccfca] bg-white px-3 text-[12px] font-medium text-[#4b2b21] hover:bg-[#faf6f2] shadow-sm"
          >
            <RefreshCw size={14} className={cn(inv.loading && 'animate-spin')} />
            Actualizar
          </Button>

          <Button
            onClick={inv.openCreateModal}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#4b2b21] px-4 text-[12px] font-medium text-white hover:bg-[#5a3429] shadow-sm transition"
          >
            <Plus size={16} />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Mensajes de Alerta / Éxito */}
      {inv.error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#f0c8c4] bg-[#fff0ee] px-4 py-3 text-[12px] text-[#c94a43]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{inv.error}</span>
          </div>
          <button onClick={() => inv.setError(null)} className="text-[#c94a43] hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {inv.successMsg && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#c6e8cf] bg-[#e9f6eb] px-4 py-3 text-[12px] text-[#2f8f4e]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{inv.successMsg}</span>
          </div>
          <button onClick={() => inv.setSuccessMsg(null)} className="text-[#2f8f4e] hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Ejecutivas Compactas */}
      <InventoryStats
        metrics={inv.metrics}
        stockFilter={inv.stockFilter}
        onToggleFilter={(filter) =>
          inv.setStockFilter(inv.stockFilter === filter ? 'ALL' : filter)
        }
      />

      {/* Barra de Filtros y Búsqueda */}
      <InventoryFilters
        search={inv.search}
        onSearchChange={inv.setSearch}
        selectedCategory={inv.selectedCategory}
        onCategoryChange={inv.setSelectedCategory}
      />

      {/* Lista / Tabla de Productos estilo Excel */}
      {inv.loading ? (
        <div className="flex h-64 items-center justify-center rounded-[20px] border border-dashed border-[#eadfd6] bg-white">
          <div className="flex flex-col items-center gap-2 text-[#7d6d61]">
            <RefreshCw size={24} className="animate-spin text-[#4b2b21]" />
            <p className="text-[12px] font-medium">Cargando inventario...</p>
          </div>
        </div>
      ) : inv.filteredItems.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-[20px] border border-dashed border-[#eadfd6] bg-white p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#faf6f2] text-[#4b2b21]">
            <Package size={22} />
          </div>
          <h3 className="mt-3 text-[14px] font-semibold text-[#2b1b14]">No se encontraron artículos</h3>
          <p className="mt-1 max-w-sm text-[11px] text-[#7d6d61]">
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
              className="mt-4 h-8 rounded-xl border border-[#dccfca] bg-white px-3 text-[11px] text-[#4b2b21] hover:bg-[#faf6f2]"
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
      {inv.itemToDelete && !inv.showAdminAuthModal && (
        <ConfirmModal
          title="¿Eliminar producto de inventario?"
          message={`¿Estás seguro de que deseas eliminar permanentemente "${inv.itemToDelete.product.name}"? Esta acción borrará el registro de stock y del catálogo.`}
          confirmLabel="Eliminar producto"
          confirmDanger
          onConfirm={inv.confirmDelete}
          onClose={() => inv.setItemToDelete(null)}
        />
      )}

      {/* Modal de Autorización de Administrador si no es Admin */}
      {inv.showAdminAuthModal && (
        <AdminPasswordModal
          onSuccess={() => {
            inv.setShowAdminAuthModal(false);
            inv.confirmDelete();
          }}
          onClose={() => {
            inv.setShowAdminAuthModal(false);
            inv.setItemToDelete(null);
          }}
        />
      )}
    </div>
  );
}