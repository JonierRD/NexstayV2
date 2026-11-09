import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecepcionPage } from '@/pages/RecepcionPage';
import {
  checkinRequest,
  clienteByCcRequest,
  clientesRequest,
  habitacionesRequest
} from '@/lib/api';
import { reservationsRequest } from '@/lib/api/reservations';
import { installSapayBridge, jsonResponse, stubFetch } from '../helpers/mocks';
import { makeClient, makeRoom, makeSettings, makeStay, makeUser } from '../helpers/fixtures';
import { renderWithAuth, screen, userEvent } from '../helpers/render';

// Responsable: Legarda
// Objetivo: flujo completo de check-in (integracion de UI).
//
// Se mockea la capa API (habitaciones, clientes, check-in, reservas) y se deja
// correr de verdad <RecepcionPage />: useReception y los pasos del wizard
// (datos del cliente -> habitacion -> confirmar -> exito).

vi.setConfig({ testTimeout: 20000 });

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    habitacionesRequest: vi.fn(),
    clienteByCcRequest: vi.fn(),
    clientesRequest: vi.fn(),
    checkinRequest: vi.fn()
  };
});

vi.mock('@/lib/api/reservations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/reservations')>();
  return { ...actual, reservationsRequest: vi.fn() };
});

type User = ReturnType<typeof userEvent.setup>;

const RECEPTIONIST = makeUser({ id: 'user-reception', fullName: 'Rosa Recepcion', role: 'RECEPTION' });

// La habitacion 101 solo tiene aire: permite verificar el acType enviado.
const ROOMS = [makeRoom({ number: '101', hasAir: true, hasFan: false })];

function pathnameOf(input: RequestInfo | URL): string {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return new URL(raw, 'http://localhost').pathname;
}

beforeEach(() => {
  installSapayBridge();

  // Respuesta generica para lo que pida el resto de la pantalla (ej. /settings).
  stubFetch((input) =>
    pathnameOf(input) === '/settings' ? jsonResponse(makeSettings()) : jsonResponse([])
  );

  vi.mocked(habitacionesRequest).mockReset();
  vi.mocked(habitacionesRequest).mockResolvedValue(ROOMS);
  vi.mocked(reservationsRequest).mockReset();
  vi.mocked(reservationsRequest).mockResolvedValue([]);
  vi.mocked(clientesRequest).mockReset();
  vi.mocked(clientesRequest).mockResolvedValue([]);
  vi.mocked(clienteByCcRequest).mockReset();
  vi.mocked(clienteByCcRequest).mockRejectedValue(new Error('Cliente no encontrado'));
  vi.mocked(checkinRequest).mockReset();
  vi.mocked(checkinRequest).mockResolvedValue(makeStay());
});

function renderReception() {
  return renderWithAuth(<RecepcionPage user={RECEPTIONIST} />, { user: RECEPTIONIST });
}

async function searchCc(user: User, cc: string): Promise<void> {
  await user.type(screen.getByPlaceholderText(/ingresa c.dula del cliente/i), cc);
  await user.click(screen.getByRole('button', { name: /buscar/i }));
}

async function pickRoom(user: User, roomNumber: string): Promise<void> {
  const placeholder = await screen.findByRole('option', { name: /selecciona una habitaci.n/i });
  await screen.findByRole('option', { name: new RegExp(`^${roomNumber}`) });
  await user.selectOptions(placeholder.closest('select') as HTMLSelectElement, roomNumber);
}

describe('I2 - Flujo de check-in', () => {
  it('un cliente existente completa el check-in y ve la pantalla de exito', async () => {
    vi.mocked(clienteByCcRequest).mockResolvedValue(
      makeClient({ cc: '1000000001', firstName: 'Ana', lastName: 'Torres' })
    );
    const user = userEvent.setup();
    renderReception();

    await searchCc(user, '1000000001');
    expect(await screen.findByText(/Cliente encontrado: Ana Torres/)).toBeInTheDocument();
    expect(clienteByCcRequest).toHaveBeenCalledWith('1000000001');

    await user.click(screen.getByRole('button', { name: /^continuar$/i }));
    await pickRoom(user, '101');
    await user.click(screen.getByRole('button', { name: /continuar|siguiente/i }));
    await user.click(await screen.findByRole('button', { name: /confirmar/i }));

    expect(await screen.findByText(/Check-In Exitoso/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ana Torres ha sido registrado en la habitaci.n 101/)
    ).toBeInTheDocument();
    expect(checkinRequest).toHaveBeenCalledTimes(1);
    expect(checkinRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        cc: '1000000001',
        firstName: 'Ana',
        lastName: 'Torres',
        roomNumber: '101',
        acType: 'AIRE'
      })
    );
  });
});