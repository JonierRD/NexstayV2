const FALLBACK_API_URL = 'http://localhost:3333';
const TOKEN_STORAGE_KEY = 'sapay-token';

declare global {
  interface Window {
    sapay?: {
      getConfig: () => Promise<{ apiUrl: string }>;
    };
  }
}

let cachedApiUrl: string | null = null;

export async function resolveApiBaseUrl(): Promise<string> {
  if (cachedApiUrl) {
    return cachedApiUrl;
  }

  if (typeof window !== 'undefined' && window.sapay?.getConfig) {
    try {
      const cfg = await window.sapay.getConfig();
      cachedApiUrl = cfg.apiUrl;
      return cachedApiUrl;
    } catch {
      // fall through
    }
  }

  cachedApiUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ?? FALLBACK_API_URL;
  return cachedApiUrl;
}

export type PublicUser = {
  id: string;
  fullName: string;
  role: 'ADMIN' | 'RECEPTION';
  cc: string;
  email: string;
  phone: string | null | undefined;
};

export type AuthResult = {
  token: string;
  expiresIn: number;
  user: PublicUser;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'POST', body, auth = true, signal } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const baseUrl = await resolveApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload: unknown = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      isJson && typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message?: unknown }).message ?? 'Error en la solicitud.')
        : typeof payload === 'string' && payload.length
          ? payload
          : `Error ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

export async function loginRequest(input: {
  identifier: string;
  password: string;
  role: 'ADMIN' | 'RECEPTION';
}): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', {
    method: 'POST',
    auth: false,
    body: input
  });
}

export async function registerRequest(input: {
  fullName: string;
  cc: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'ADMIN' | 'RECEPTION';
  adminPassword: string;
}): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    auth: false,
    body: input
  });
}

export async function forgotPasswordRequest(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email }
  });
}

export async function resetPasswordRequest(input: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: input
  });
}

export async function meRequest(): Promise<PublicUser> {
  return apiRequest<PublicUser>('/auth/me', { method: 'GET' });
}

export type FirstRunInfo = {
  pending: boolean;
  admin?: {
    fullName: string;
    email: string;
    cc: string;
    temporaryPassword: string;
  };
};

export async function firstRunRequest(): Promise<FirstRunInfo> {
  return apiRequest<FirstRunInfo>('/auth/first-run', { method: 'GET', auth: false });
}

export type Habitacion = {
  number: string;
  type: 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS';
  hasAir: boolean;
  hasFan: boolean;
  priceWithAir: number | null;
  priceWithFan: number | null;
  status: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
  image: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function habitacionesRequest(): Promise<Habitacion[]> {
  return apiRequest<Habitacion[]>('/habitaciones', { method: 'GET' });
}

export type CreateHabitacionInput = {
  number: string;
  type: 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS';
  hasAir?: boolean;
  hasFan?: boolean;
  priceWithAir?: number;
  priceWithFan?: number;
  image?: string | null;
  notes?: string;
  adminPassword?: string;
};

export async function createHabitacionRequest(input: CreateHabitacionInput): Promise<Habitacion> {
  return apiRequest<Habitacion>('/habitaciones', { method: 'POST', body: input });
}

export type UpdateHabitacionInput = {
  type?: 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS';
  hasAir?: boolean;
  hasFan?: boolean;
  priceWithAir?: number;
  priceWithFan?: number;
  status?: 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
  image?: string | null;
  notes?: string;
  adminPassword?: string;
};

export async function updateHabitacionRequest(number: string, input: UpdateHabitacionInput): Promise<Habitacion> {
  return apiRequest<Habitacion>(`/habitaciones/${encodeURIComponent(number)}`, { method: 'PATCH', body: input });
}

export async function verifyAdminPasswordRequest(password: string): Promise<{ valid: boolean }> {
  return apiRequest<{ valid: boolean }>('/auth/verify-admin', { method: 'POST', body: { password } });
}

export async function deleteHabitacionRequest(number: string, adminPassword?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/habitaciones/${encodeURIComponent(number)}/delete`, {
    method: 'POST',
    body: { ...(adminPassword ? { adminPassword } : {}) }
  });
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CHECK_IN' | 'CHECK_OUT' | 'STATUS_CHANGE';

export type AuditLog = {
  id: number;
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    role: 'ADMIN' | 'RECEPTION';
    email: string;
  };
};

export type AuditLogsResponse = {
  logs: AuditLog[];
  total: number;
};

export async function auditoriaRequest(filters?: {
  userId?: string;
  action?: AuditAction;
  entity?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.action) params.append('action', filters.action);
  if (filters?.entity) params.append('entity', filters.entity);
  if (filters?.entityId) params.append('entityId', filters.entityId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  return apiRequest<AuditLogsResponse>(`/auditoria?${params.toString()}`);
}

export type Laundry = {
  id: number;
  item: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  deliveryDate: string | null;
  clientName: string;
  roomNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function laundryRequest(): Promise<Laundry[]> {
  return apiRequest<Laundry[]>('/laundry');
}

export async function createLaundryRequest(data: {
  item: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryDate?: string;
  clientName: string;
  roomNumber?: string;
  notes?: string;
}): Promise<Laundry> {
  return apiRequest<Laundry>('/laundry', {
    method: 'POST',
    body: data
  });
}

export async function updateLaundryRequest(id: number, data: {
  item?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  status?: string;
  deliveryDate?: string;
  clientName?: string;
  roomNumber?: string;
  notes?: string;
}): Promise<Laundry> {
  return apiRequest<Laundry>(`/laundry/${id}`, {
    method: 'PUT',
    body: data
  });
}

export async function deleteLaundryRequest(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/laundry/${id}`, {
    method: 'DELETE'
  });
}

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

// Clientes
export type Cliente = {
  id: number;
  firstName: string;
  lastName: string;
  cc: string;
  phone: string | null;
  cityOrigin: string | null;
  cityDestination: string | null;
  profession: string | null;
  notes: string | null;
  createdAt: string;
  stays?: Stay[];
};

export type CreateClienteInput = {
  firstName: string;
  lastName: string;
  cc: string;
  phone?: string;
  cityOrigin?: string;
  cityDestination?: string;
  profession?: string;
  notes?: string;
  adminPassword?: string;
};

export type UpdateClienteInput = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  cityOrigin?: string;
  cityDestination?: string;
  profession?: string;
  notes?: string;
  adminPassword?: string;
};

export async function clientesRequest(): Promise<Cliente[]> {
  return apiRequest<Cliente[]>('/clientes', { method: 'GET' });
}

export async function clienteByCcRequest(cc: string): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/cc/${encodeURIComponent(cc)}`, { method: 'GET' });
}

export async function createClienteRequest(input: CreateClienteInput): Promise<Cliente> {
  return apiRequest<Cliente>('/clientes', { method: 'POST', body: input });
}

export async function updateClienteRequest(id: number, input: UpdateClienteInput): Promise<Cliente> {
  return apiRequest<Cliente>(`/clientes/${id}`, { method: 'PUT', body: input });
}

export async function deleteClienteRequest(id: number, adminPassword?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/clientes/${id}`, {
    method: 'DELETE',
    body: { ...(adminPassword ? { adminPassword } : {}) }
  });
}

// Stays (Hospedajes)
export type Stay = {
  id: number;
  clientId: number;
  roomNumber: string;
  checkIn: string;
  checkOut: string | null;
  nights: number;
  pricePerNight: number;
  total: number;
  acTypeUsed: 'AIRE' | 'VENTILADOR';
  status: 'ACTIVA' | 'FINALIZADA' | 'CANCELADA';
  createdAt: string;
  updatedAt: string;
  client?: Cliente;
  room?: Habitacion;
  sales?: any[];
};

export type CheckinInput = {
  cc: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  cityOrigin?: string;
  cityDestination?: string;
  profession?: string;
  notes?: string;
  roomNumber: string;
  acType: 'AIRE' | 'VENTILADOR';
  nights?: number;
  checkIn?: string;
  adminPassword?: string;
};

export type CheckoutInput = {
  adminPassword?: string;
};

export async function staysActiveRequest(): Promise<Stay[]> {
  return apiRequest<Stay[]>('/stays/active', { method: 'GET' });
}

export async function staysByRoomRequest(roomNumber: string): Promise<Stay[]> {
  return apiRequest<Stay[]>(`/stays/room/${encodeURIComponent(roomNumber)}`, { method: 'GET' });
}

export async function checkinRequest(input: CheckinInput): Promise<Stay> {
  return apiRequest<Stay>('/stays/checkin', { method: 'POST', body: input });
}

export async function checkoutRequest(id: number, input: CheckoutInput): Promise<Stay> {
  return apiRequest<Stay>(`/stays/${id}/checkout`, { method: 'POST', body: input });
}
