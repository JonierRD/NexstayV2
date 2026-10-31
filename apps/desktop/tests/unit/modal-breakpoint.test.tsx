import { describe, it } from 'vitest';

// Responsable: Legarda
// Objetivo: comportamiento del modal compartido y breakpoints.
//   import { Modal } from '@/components/ui/Modal';
//   import { useBreakpoint } from '@/lib/useBreakpoint';
//   import { render, screen, userEvent, act } from '../helpers/render';

describe('U10 - Modal y useBreakpoint', () => {
  it.todo('Modal no renderiza nada cuando isOpen = false');
  it.todo('Modal cierra con la tecla Escape');
  it.todo('Modal cierra al hacer clic en el overlay');
  it.todo('Modal NO cierra al hacer clic dentro del contenido');
  it.todo('Modal respeta closeOnEscape = false');
  it.todo('useBreakpoint devuelve compact/default/wide/ultrawide segun innerWidth');
  it.todo('useBreakpoint reacciona al evento resize');
});
