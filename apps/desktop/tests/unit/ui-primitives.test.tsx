import { describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { StatusPill } from '@/components/ui/StatusPill';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { DetailLine } from '@/components/ui/DetailLine';
import { StatCard } from '@/components/ui/StatCard';
import { render, screen, userEvent } from '../helpers/render';

// Responsable: Legarda
// Objetivo: primitivas de UI compartidas.
//   import { StatusPill } from '@/components/ui/StatusPill';
//   import { FilterSelect } from '@/components/ui/FilterSelect';
//   import { DetailLine } from '@/components/ui/DetailLine';
//   import { StatCard } from '@/components/ui/StatCard';
//   import { render, screen, userEvent } from '../helpers/render';

const FILTER_OPTIONS = ['TODOS', 'PENDIENTE', 'ENTREGADO'] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

// Icono falso: permite comprobar que StatCard lo renderiza y le pasa aria-hidden.
function FakeIcon(props: { className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }): ReactElement {
  return <svg data-testid="stat-icon" {...props} />;
}

describe('U9 - components/ui (primitivas)', () => {
  it('StatusPill renderiza el contenido y respeta className', () => {
    render(<StatusPill className="bg-emerald-50 text-emerald-800">Entregado</StatusPill>);

    const pill = screen.getByText('Entregado');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveClass('bg-emerald-50', 'text-emerald-800');
    // Conserva las clases base del componente.
    expect(pill).toHaveClass('rounded-full', 'border');
  });

  it('FilterSelect muestra la opcion "TODOS" con el label recibido', () => {
    render(
      <FilterSelect<FilterOption>
        label="Estado"
        value="TODOS"
        onChange={vi.fn()}
        options={FILTER_OPTIONS}
      />
    );

    const todos = screen.getByRole('option', { name: 'Estado' });
    expect(todos).toHaveAttribute('value', 'TODOS');
    expect(screen.getByRole('combobox')).toHaveValue('TODOS');
  });

  it('FilterSelect no duplica la opcion TODOS si viene en options', () => {
    render(
      <FilterSelect<FilterOption>
        label="Estado"
        value="TODOS"
        onChange={vi.fn()}
        options={FILTER_OPTIONS}
      />
    );

    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options.filter((option) => option.value === 'TODOS')).toHaveLength(1);
    expect(options.map((option) => option.value)).toEqual(['TODOS', 'PENDIENTE', 'ENTREGADO']);
  });

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

  it('DetailLine muestra etiqueta y valor', () => {
    render(
      <dl>
        <DetailLine label="Habitacion" value="101" />
      </dl>
    );

    const label = screen.getByText('Habitacion:');
    const value = screen.getByText('101');
    expect(label.tagName).toBe('DT');
    expect(value.tagName).toBe('DD');
  });

  it('StatCard muestra titulo, valor e icono', () => {
    render(
      <StatCard
        icon={FakeIcon}
        title="Ocupacion"
        value="85%"
        detail="17 de 20 habitaciones"
        tone="from-amber-100"
      />
    );

    expect(screen.getByText('Ocupacion')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('17 de 20 habitaciones')).toBeInTheDocument();

    const icon = screen.getByTestId('stat-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    // El contenedor del icono recibe la clase de tono.
    expect(icon.parentElement).toHaveClass('from-amber-100');
  });
});