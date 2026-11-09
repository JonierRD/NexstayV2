import { describe, expect, it, vi } from 'vitest';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { render, screen, userEvent } from '../helpers/render';

// Responsable: Legarda
// Objetivo: primitivas de UI compartidas.
//   import { FilterSelect } from '@/components/ui/FilterSelect';
//   import { render, screen, userEvent } from '../helpers/render';

const FILTER_OPTIONS = ['TODOS', 'PENDIENTE', 'ENTREGADO'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

describe('U9 - components/ui (primitivas)', () => {
  it('FilterSelect aplica labels personalizados y emite onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <FilterSelect<FilterOption>
        label="Estado"
        value="TODOS"
        onChange={onChange}
        options={FILTER_OPTIONS}
        labels={{ PENDIENTE: 'Pendiente', ENTREGADO: 'Entregado' }}
      />
    );

    expect(screen.getByRole('option', { name: 'Pendiente' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Entregado' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox'), 'ENTREGADO');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('ENTREGADO');
  });
});