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

// 101 solo tiene aire y 102 solo ventilador: permite verificar el acType enviado.
const ROOMS = [
  makeRoom({ number: '101', hasAir: true, hasFan: false }),
  makeRoom({ number: '102', hasAir: false, hasFan: true })
];

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
  // Por defecto la cedula no existe: el cliente es nuevo.
  vi.mocked(clienteByCcRequest).mockReset();
  vi.mocked(clienteByCcRequest).mockRejectedValue(new Error('Cliente no encontrado'));
  vi.mocked(checkinRequest).mockReset();
  vi.mocked(checkinRequest).mockResolvedValue(makeStay());
});

function renderReception() {
  return renderWithAuth(<RecepcionPage user={RECEPTIONIST} />, { user: RECEPTIONIST });
}

/** Los labels del formulario no estan asociados al input: se busca dentro de su contenedor. */
function field(label: string | RegExp): HTMLInputElement {
  const element = screen.getByText(label).parentElement?.querySelector('input, textarea');
  if (!element) throw new Error(`No se encontro el campo ${String(label)}`);
  return element as HTMLInputElement;
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

  it('un cliente nuevo completa el check-in con los datos del formulario', async () => {
    const user = userEvent.setup();
    renderReception();

    await searchCc(user, '2000000002');
    expect(await screen.findByText(/Nuevo cliente/)).toBeInTheDocument();

    await user.type(field('Nombre *'), 'Luis');
    await user.type(field('Apellido *'), 'Perez');
    await user.type(field(/^Tel.fono$/), '3001112233');

    await user.click(screen.getByRole('button', { name: /^continuar$/i }));
    await pickRoom(user, '102');
    await user.click(screen.getByRole('button', { name: /continuar|siguiente/i }));
    await user.click(await screen.findByRole('button', { name: /confirmar/i }));

    expect(await screen.findByText(/Check-In Exitoso/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Luis Perez ha sido registrado en la habitaci.n 102/)
    ).toBeInTheDocument();
    // La habitacion 102 solo tiene ventilador: el tipo se ajusta solo.
    expect(checkinRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        cc: '2000000002',
        firstName: 'Luis',
        lastName: 'Perez',
        phone: '3001112233',
        roomNumber: '102',
        acType: 'VENTILADOR'
      })
    );
  });

  it('no permite continuar sin nombre y apellido', async () => {
    const user = userEvent.setup();
    renderReception();

    await user.type(screen.getByPlaceholderText(/ingresa c.dula del cliente/i), '3000000003');
    const continuar = screen.getByRole('button', { name: /^continuar$/i });
    expect(continuar).toBeDisabled();

    await user.type(field('Nombre *'), 'Luis');
    expect(continuar).toBeDisabled();

    await user.type(field('Apellido *'), 'Perez');
    expect(continuar).toBeEnabled();

    // Mientras faltaba algun dato no se avanzo a elegir habitacion.
    expect(
      screen.queryByRole('option', { name: /selecciona una habitaci.n/i })
    ).not.toBeInTheDocument();
  });

  it('no permite confirmar sin habitacion seleccionada', async () => {
    vi.mocked(clienteByCcRequest).mockResolvedValue(
      makeClient({ cc: '1000000001', firstName: 'Ana', lastName: 'Torres' })
    );
    const user = userEvent.setup();
    renderReception();

    await searchCc(user, '1000000001');
    await screen.findByText(/Cliente encontrado/);
    await user.click(screen.getByRole('button', { name: /^continuar$/i }));

    // Paso de habitacion, sin elegir ninguna: no se puede avanzar a confirmar.
    await screen.findByRole('option', { name: /selecciona una habitaci.n/i });
    expect(screen.getByRole('button', { name: /continuar|siguiente/i })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument();
    expect(checkinRequest).not.toHaveBeenCalled();
  });

  it('si la API falla, muestra el error y no avanza al exito', async () => {
    vi.mocked(clienteByCcRequest).mockResolvedValue(
      makeClient({ cc: '1000000001', firstName: 'Ana', lastName: 'Torres' })
    );
    vi.mocked(checkinRequest).mockRejectedValue(new Error('La habitacion ya esta ocupada'));
    const user = userEvent.setup();
    renderReception();

    await searchCc(user, '1000000001');
    await screen.findByText(/Cliente encontrado/);
    await user.click(screen.getByRole('button', { name: /^continuar$/i }));
    await pickRoom(user, '101');
    await user.click(screen.getByRole('button', { name: /continuar|siguiente/i }));
    await user.click(await screen.findByRole('button', { name: /confirmar/i }));

    expect(await screen.findByText('La habitacion ya esta ocupada')).toBeInTheDocument();
    expect(screen.queryByText(/Check-In Exitoso/i)).not.toBeInTheDocument();
    expect(checkinRequest).toHaveBeenCalledTimes(1);
    // Sigue en el paso de confirmacion para poder reintentar.
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeEnabled();
  });
});