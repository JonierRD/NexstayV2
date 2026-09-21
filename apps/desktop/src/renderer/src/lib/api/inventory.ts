import { apiRequest } from './client';

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StockItem = {
  id: number;
  productId: number;
  quantity: number;
  minStock: number;
  location: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
};

export async function inventoryRequest(): Promise<StockItem[]> {
  return apiRequest<StockItem[]>('/inventory', { method: 'GET' });
}

export type StoreStock = {
  id: number;
  quantity: number;
  product: { id: number; name: string; price: number };
};

export async function storeStockRequest(): Promise<StoreStock[]> {
  return apiRequest<StoreStock[]>('/inventory/category/TIENDA', { method: 'GET' });
}

export async function createProductRequest(data: {
  name: string;
  price: number;
  category?: string;
  description?: string;
}): Promise<Product> {
  return apiRequest<Product>('/inventory/product', {
    method: 'POST',
    body: data
  });
}

export async function updateProductRequest(
  id: number,
  data: {
    name?: string;
    price?: number;
    category?: string;
    description?: string;
  }
): Promise<Product> {
  return apiRequest<Product>(`/inventory/product/${id}`, {
    method: 'PUT',
    body: data
  });
}

export async function updateStockRequest(
  id: number,
  data: {
    quantity?: number;
    minStock?: number;
    location?: string;
    status?: string;
  }
): Promise<StockItem> {
  return apiRequest<StockItem>(`/inventory/stock/${id}`, {
    method: 'PUT',
    body: data
  });
}

export async function adjustInventoryQuantityRequest(
  stockId: number,
  quantity: number,
  operation: 'ADD' | 'SUBTRACT'
): Promise<StockItem> {
  return apiRequest<StockItem>(`/inventory/stock/${stockId}/adjust`, {
    method: 'POST',
    body: { quantity, operation }
  });
}

export async function deleteInventoryRequest(stockId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/inventory/${stockId}`, {
    method: 'DELETE'
  });
}

export type SaleItemInput = {
  stockId: number;
  quantity: number;
};

export type BatchSaleInput = {
  items: SaleItemInput[];
  stayId?: number | null;
  customerName?: string | null;
};

export type StaySale = {
  id: number;
  productId: number;
  stayId: number | null;
  quantity: number;
  unitPrice: number;
  saleType?: string;
  date: string;
  product?: { name: string; price: number };
  stay?: {
    id: number;
    roomNumber: string;
    client?: {
      firstName: string;
      lastName: string;
      cc: string;
    };
  };
};

export async function salesRequest(): Promise<StaySale[]> {
  return apiRequest<StaySale[]>('/inventory/sales', { method: 'GET' });
}

export async function createStaySaleRequest(input: { stockId: number; stayId: number; quantity: number }): Promise<StaySale> {
  return apiRequest<StaySale>('/inventory/sale', { method: 'POST', body: input });
}

export async function createSalesRequest(input: BatchSaleInput): Promise<StaySale[]> {
  return apiRequest<StaySale[]>('/inventory/sales', { method: 'POST', body: input });
}