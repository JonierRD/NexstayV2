import { describe, expect, it, vi } from 'vitest';
import { Modal } from '@/components/ui/Modal';
import { render, screen, userEvent } from '../helpers/render';

// Responsable: Legarda
// Objetivo: comportamiento del modal compartido y breakpoints.
//   import { Modal } from '@/components/ui/Modal';
//   import { render, screen, userEvent } from '../helpers/render';

describe('U10 - Modal y useBreakpoint', () => {
  it('Modal cierra con la tecla Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<Modal onClose={onClose}>Contenido</Modal>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});