import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatCOP,
  formatDate,
  formatDateRange,
  formatDateShort,
  formatDateTime,
  formatDateTimeNumeric,
  formatElapsed
} from '@/lib/format';

describe('U1 - lib/format.ts', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formatCOP redondea y agrega el simbolo de pesos', () => {
    expect(formatCOP(1234.6)).toMatch(/^\$1\.235$/);
  });

  it('formatCOP funciona con 0 y con valores negativos', () => {
    expect(formatCOP(0)).toBe('$0');
    expect(formatCOP(-1234.4)).toMatch(/^\-\$1\.234$|^\$-1\.234$/);
  });

  it('formatDate, formatDateShort y formatDateTime devuelven texto en es-CO', () => {
    const value = '2026-10-19T15:30:00.000Z';

    expect(formatDate(value)).toMatch(/19|18/);
    expect(formatDateShort(value)).toMatch(/19|18/);
    expect(formatDateTime(value)).toMatch(/19|18/);
    expect(formatDate(value)).toMatch(/2026/);
    expect(formatDateShort(value)).toMatch(/2026/);
    expect(formatDateTime(value)).toMatch(/2026/);
  });

  it('formatDateRange muestra la salida o "En curso" cuando no hay check-out', () => {
    expect(formatDateRange('2026-10-19T12:00:00.000Z', '2026-10-21T12:00:00.000Z')).toContain(
      '→'
    );
    expect(formatDateRange('2026-10-19T12:00:00.000Z')).toContain('En curso');
  });

  it('formatElapsed calcula dias, horas y minutos (usar vi.setSystemTime)', () => {
    vi.setSystemTime(new Date('2026-10-21T15:45:00.000Z'));

    expect(formatElapsed('2026-10-19T12:30:00.000Z')).toBe('2d 3h 15m');
  });

  it('formatDateTimeNumeric respeta el formato numerico de 24h/12h configurado', () => {
    const formatted = formatDateTimeNumeric('2026-10-19T15:30:00.000Z');

    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    expect(formatted).toMatch(/[ap]\.?\s*m\.?|[AP]\.?\s*M\.?|15:30/);
  });
});
