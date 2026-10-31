import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError, firstRunRequest, loginRequest } from '@/lib/api';
import { App } from '@/App';
import { jsonResponse, stubFetch } from '../helpers/mocks';
import { makeSettings, makeUser } from '../helpers/fixtures';

// Responsable: Jonier
// I1: flujo real de autenticacion sobre <App />.
//
// Se mockea la capa API de auth (login/first-run/me) y se deja correr el resto
// del arbol real: useAuth, AuthProvider, DashboardLayout, Sidebar, usePermissions
// y RouteGuard. Las peticiones que hacen las paginas se responden con un fetch
// generico para que la prueba no dependa del backend.

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    loginRequest: vi.fn(),
    firstRunRequest: vi.fn(),
    meRequest: vi.fn(),
    registerRequest: vi.fn(),
    forgotPasswordRequest: vi.fn(),
    resetPasswordRequest: vi.fn()
  };
});

const ADMIN = makeUser({ id: 'user-admin', fullName: 'Ana Torres', role: 'ADMIN' });
const CLEANING = makeUser({
  id: 'user-cleaning',
  fullName: 'Carla Limpieza',
  cc: '1000000002',
  role: 'CLEANING'
});

function pathnameOf(input: RequestInfo | URL): string {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return new URL(raw, 'http://localhost').pathname;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();

  vi.mocked(firstRunRequest).mockReset();
  vi.mocked(loginRequest).mockReset();
  vi.mocked(firstRunRequest).mockResolvedValue({ pending: false });

  // Respuestas por defecto de las pantallas internas (dashboard, habitaciones...).
  stubFetch((input) => {
    if (pathnameOf(input) === '/settings') {
      return jsonResponse(makeSettings());
    }
    return jsonResponse([]);
  });

  render(<App />);
});

/** Recorre landing -> formulario de login y envia las credenciales. */
async function submitLogin(role: 'ADMIN' | 'RECEPTION' | 'CLEANING'): Promise<void> {
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

  await user.type(screen.getByPlaceholderText('Ingresa tu usuario'), '1000000001');
  await user.type(screen.getByPlaceholderText('Ingresa tu contraseña'), 'secreto');
  await user.selectOptions(screen.getByRole('combobox'), role);

  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));
}

describe('I1 - Flujo de autenticacion y permisos', () => {
  it('login exitoso lleva al dashboard con los modulos del rol', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      token: 'token-admin',
      expiresIn: 3600,
      user: ADMIN
    });

    await submitLogin('ADMIN');

    const sidebar = await screen.findByRole('complementary');
    expect(within(sidebar).getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'Auditoría' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'Configuración' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();

    // El token queda persistido para las siguientes peticiones.
    expect(localStorage.getItem('sapay-token')).toBe('token-admin');
  });

  it('un rol sin permiso no ve los modulos restringidos en el sidebar', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      token: 'token-cleaning',
      expiresIn: 3600,
      user: CLEANING
    });

    await submitLogin('CLEANING');

    const sidebar = await screen.findByRole('complementary');

    expect(within(sidebar).getByRole('button', { name: 'Habitaciones' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'Lavandería' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'Perfil' })).toBeInTheDocument();

    expect(within(sidebar).queryByRole('button', { name: 'Dashboard' })).toBeNull();
    expect(within(sidebar).queryByRole('button', { name: 'Clientes' })).toBeNull();
    expect(within(sidebar).queryByRole('button', { name: 'Auditoría' })).toBeNull();
    expect(within(sidebar).queryByRole('button', { name: 'Configuración' })).toBeNull();

    // Entra directo a Habitaciones (su primer modulo permitido).
    expect(within(screen.getByRole('banner')).getByText('Habitaciones')).toBeInTheDocument();
  });

  it('credenciales invalidas muestran error y no abren sesion', async () => {
    vi.mocked(loginRequest).mockRejectedValue(
      new ApiError(401, 'Credenciales inválidas.')
    );

    await submitLogin('ADMIN');

    expect(await screen.findByText('Credenciales inválidas.')).toBeInTheDocument();
    expect(localStorage.getItem('sapay-token')).toBeNull();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('cerrar sesion vuelve al login y limpia el token guardado', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      token: 'token-admin',
      expiresIn: 3600,
      user: ADMIN
    });

    await submitLogin('ADMIN');

    const sidebar = await screen.findByRole('complementary');
    await userEvent.setup().click(
      within(sidebar).getByRole('button', { name: 'Cerrar sesión' })
    );

    // handleLogout espera 600 ms antes de limpiar el estado.
    await waitFor(
      () => expect(localStorage.getItem('sapay-token')).toBeNull(),
      { timeout: 3000 }
    );
    expect(
      await screen.findByText('Bienvenido a SAPAY', undefined, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
