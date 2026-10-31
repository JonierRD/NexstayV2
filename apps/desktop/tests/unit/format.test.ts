import { describe, it } from 'vitest';

// Responsable: Belladira
// Objetivo: funciones puras de formato. No requieren mocks.
// Importa lo que necesites, por ejemplo:
//   import { formatCOP, formatElapsed } from '@/lib/format';
// Recuerda: los textos de Intl pueden variar; usa toContain/regex en fechas.

describe('U1 - lib/format.ts', () => {
  it.todo('formatCOP redondea y agrega el simbolo de pesos');
  it.todo('formatCOP funciona con 0 y con valores negativos');
  it.todo('formatDate, formatDateShort y formatDateTime devuelven texto en es-CO');
  it.todo('formatDateRange muestra la salida o "En curso" cuando no hay check-out');
  it.todo('formatElapsed calcula dias, horas y minutos (usar vi.setSystemTime)');
  it.todo('formatDateTimeNumeric respeta el formato numerico de 24h/12h configurado');
});
