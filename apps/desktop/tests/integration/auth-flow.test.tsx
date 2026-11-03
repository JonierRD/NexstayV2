import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { firstRunRequest, loginRequest } from '@/lib/api';
import { App } from '@/App';
import { jsonResponse, stubFetch } from '../helpers/mocks';
import { makeSettings, makeUser } from '../helpers/fixtures';

// Responsable: Jonier - I1: flujo de autenticacion a traves de la aplicacion.

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

  stubFetch((input) => {
    if (pathnameOf(input) === '/settings') return jsonResponse(makeSettings());
    return jsonResponse([]);
  });

  render(<App />);
});

describe('I1 - autenticacion', () => {
  it('login exitoso abre el dashboard y conserva el token de sesion', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      token: 'token-admin',
      expiresIn: 3600,
      user: ADMIN
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /iniciar sesi/i }));
    await user.type(screen.getByPlaceholderText('Ingresa tu usuario'), '1000000001');
    await user.type(screen.getByPlaceholderText('Ingresa tu contraseña'), 'secreto');
    await user.selectOptions(screen.getByRole('combobox'), 'ADMIN');
    await user.click(screen.getByRole('button', { name: /iniciar sesi/i }));

    const sidebar = await screen.findByRole('complementary');
    expect(within(sidebar).getByRole('button', { name: 'Dashboard' })).toBeInTheDocument();
    expect(within(sidebar).getByRole('button', { name: 'Auditoria' })).toBeInTheDocument();
    expect(localStorage.getItem('sapay-token')).toBe('token-admin');
  });
});
