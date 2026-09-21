import { type ReactElement } from 'react';
import { type AuditAction } from '../../lib/api';
import { FilterSelect } from '../ui/filter-select';
import { SearchInput } from '../ui/search-input';
import { actionLabels, actionOptions } from './constants';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  actionFilter: AuditAction | 'TODOS';
  onActionChange: (value: AuditAction | 'TODOS') => void;
  entityFilter: string;
  onEntityChange: (value: string) => void;
  entities: string[];
};

export function AuditFilters({
  search,
  onSearchChange,
  actionFilter,
  onActionChange,
  entityFilter,
  onEntityChange,
  entities
}: Props): ReactElement {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput value={search} onChange={onSearchChange} placeholder="Buscar en historial..." />

      <div className="flex items-center gap-2">
        <FilterSelect
          label="Todas las acciones"
          value={actionFilter}
          onChange={onActionChange}
          options={actionOptions}
          labels={actionLabels}
        />

        <FilterSelect label="Todas las entidades" value={entityFilter} onChange={onEntityChange} options={entities} />
      </div>
    </div>
  );
}