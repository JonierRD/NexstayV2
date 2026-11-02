import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';
import { useBreakpoint } from '@/lib/useBreakpoint';
import { act, render, screen, userEvent } from '../helpers/render';

// Responsable: Legarda
// Objetivo: comportamiento del modal compartido y breakpoints.
//   import { Modal } from '@/components/ui/Modal';
//   import { useBreakpoint } from '@/lib/useBreakpoint';
//   import { render, screen, userEvent, act } from '../helpers/render';

// jsdom no tiene ventana real: se fija innerWidth a mano para simular el tamano.
const originalInnerWidth = window.innerWidth;

function setWindowWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
}

afterEach(() => {
  // Evita que el ancho de una prueba se filtre a la siguiente.
  setWindowWidth(originalInnerWidth);
});

describe('U10 - Modal y useBreakpoint', () => {
  it('Modal no renderiza nada cuando isOpen = false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Titulo">
        Contenido
      </Modal>
    );

    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
    expect(screen.queryByText('Titulo')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('Modal cierra con la tecla Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Modal onClose={onClose}>Contenido</Modal>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Modal cierra al hacer clic en el overlay', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(<Modal onClose={onClose}>Contenido</Modal>);
    // El overlay es el contenedor exterior que cubre toda la pantalla.
    const overlay = container.firstElementChild as HTMLElement;

    await user.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Modal NO cierra al hacer clic dentro del contenido', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Modal onClose={onClose}>Contenido</Modal>);

    await user.click(screen.getByText('Contenido'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('Modal respeta closeOnEscape = false', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal onClose={onClose} closeOnEscape={false}>
        Contenido
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('useBreakpoint devuelve compact/default/wide/ultrawide segun innerWidth', () => {
    // [ancho, breakpoint esperado]: incluye los valores justo en cada limite.
    const cases = [
      [960, 'compact'],
      [1023, 'compact'],
      [1024, 'default'],
      [1279, 'default'],
      [1280, 'wide'],
      [1535, 'wide'],
      [1536, 'ultrawide'],
      [1920, 'ultrawide']
    ] as const;

    cases.forEach(([width, expected]) => {
      setWindowWidth(width);
      const { result, unmount } = renderHook(() => useBreakpoint());
      expect(result.current, `${width}px`).toBe(expected);
      unmount();
    });
  });

  it('useBreakpoint reacciona al evento resize', () => {
    setWindowWidth(1000);
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe('compact');

    act(() => {
      setWindowWidth(1300);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe('wide');

    act(() => {
      setWindowWidth(1600);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe('ultrawide');

    act(() => {
      setWindowWidth(1100);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe('default');
  });
});