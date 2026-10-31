import type { PublicUser } from '@/lib/api/auth';
import type { Habitacion } from '@/lib/api/habitaciones';
import type { Cliente } from '@/lib/api/clientes';
import type { Stay } from '@/lib/api/stays';
import type { StaySale } from '@/lib/api/inventory';
import type { Laundry } from '@/lib/api/laundry';
import type { AppSettings } from '@/lib/api/settings';
import type { Reservation } from '@/lib/api/reservations';

// Datos de ejemplo compartidos por las pruebas. Cada factory acepta overrides
// para que cada integrante ajuste solo lo que necesita sin duplicar objetos.
// Las fechas son fijas a proposito: evitan pruebas que fallan segun el dia.

const ISO = '2026-10-19T12:00:00.000Z';

export function makeUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'user-1',
    fullName: 'Ana Torres',
    role: 'ADMIN',
    cc: '1000000001',
    email: 'ana@nexstay.test',
    phone: '3000000000',
    isActive: true,
    createdAt: ISO,
    ...overrides
  };
}

export function makeRoom(overrides: Partial<Habitacion> = {}): Habitacion {
  return {
    number: '101',
    type: 'SENCILLA',
    hasAir: true,
    hasFan: false,
    priceWithAir: 120000,
    priceWithFan: 90000,
    status: 'DISPONIBLE',
    image: null,
    notes: null,
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides
  };
}

export function makeClient(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: 1,
    firstName: 'Ana',
    lastName: 'Torres',
    cc: '1000000001',
    phone: '3000000000',
    cityOrigin: 'Bogota',
    cityDestination: 'Medellin',
    profession: 'Ingeniera',
    notes: null,
    createdAt: ISO,
    ...overrides
  };
}

export function makeSale(overrides: Partial<StaySale> = {}): StaySale {
  return {
    id: 1,
    productId: 1,
    stayId: null,
    quantity: 1,
    unitPrice: 5000,
    saleType: 'CONTADO',
    date: ISO,
    customerName: null,
    product: { name: 'Agua', price: 5000 },
    ...overrides
  };
}

export function makeLaundry(overrides: Partial<Laundry> = {}): Laundry {
  return {
    id: 1,
    item: 'Sabana',
    description: 'Lavado y planchado',
    quantity: 1,
    unitPrice: 10000,
    totalPrice: 10000,
    status: 'PENDIENTE',
    deliveryDate: null,
    clientName: 'Ana Torres',
    roomNumber: '101',
    notes: null,
    createdAt: ISO,
    updatedAt: ISO,
    ...overrides
  };
}

export function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 1,
    clientId: 1,
    roomNumber: '101',
    checkIn: ISO,
    checkOut: null,
    nights: 1,
    pricePerNight: 120000,
    total: 120000,
    acTypeUsed: 'AIRE',
    status: 'ACTIVA',
    createdAt: ISO,
    updatedAt: ISO,
    sales: [],
    laundry: [],
    payments: [],
    ...overrides
  };
}

export function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    clientId: 1,
    roomNumber: '101',
    checkIn: ISO,
    checkOut: '2026-10-21T12:00:00.000Z',
    nights: 2,
    pricePerNight: 120000,
    total: 240000,
    acTypeUsed: 'AIRE',
    status: 'CONFIRMADA',
    cancellationReason: null,
    forceWaiver: false,
    client: makeClient(),
    room: makeRoom(),
    payments: [],
    stay: null,
    ...overrides
  };
}

export function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    hotelName: 'NexStay Hotel',
    hotelNit: '900000000-1',
    hotelAddress: 'Calle 1 # 2-3',
    hotelPhone: '3000000000',
    hotelEmail: 'hotel@nexstay.test',
    logoDataUrl: 'data:image/png;base64,AAAA',
    themeColor: 'cafe',
    darkMode: false,
    checkinLimit: '15:00',
    checkoutLimit: '12:00',
    checkoutTolerance: 180,
    checkoutOvertimeRate: 10000,
    cancellationPolicy: 'Politica de prueba',
    aiEnabled: false,
    ...overrides
  };
}
