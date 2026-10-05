// Re-exportación para retrocompatibilidad desde la fuente única de verdad
export { currencyFormatter, formatDateShort as formatDate } from '../../lib/format';

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