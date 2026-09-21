export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

export type Product = {
  stockId: number;
  id: number;
  nombre: string;
  precio: number;
  cantidadDisponible: number;
  categoria?: string;
};

export type CartItem = {
  stockId: number;
  productId: number;
  nombre: string;
  precio: number;
  cantidadDisponible: number;
  quantity: number;
};

export type SaleMode = 'guest' | 'external';

export type SaleRecord = {
  id: number;
  fecha: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  tipoVenta: 'Huésped' | 'Externa';
  habitacion?: string;
  huesped?: string;
  clienteExterno?: string;
};

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}