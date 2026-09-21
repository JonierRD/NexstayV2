import { Eye, PencilLine } from 'lucide-react';
import { type ReactElement } from 'react';
import { cn } from '../../lib/utils';
import { IconButton } from '../ui/icon-button';
import { StatusPill } from '../ui/status-pill';
import { statusStyles, type Room } from './types';

export function RoomsTable({
  rooms,
  selectedNumber,
  onSelect,
  onEdit
}: {
  rooms: Room[];
  selectedNumber?: string;
  onSelect: (number: string) => void;
  onEdit: (number: string) => void;
}): ReactElement {
  return (
    <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-[#ebe1d8]">
      <div className="grid grid-cols-[100px_60px_1fr_120px_1fr_100px] gap-2 border-b border-[#ece2d8] bg-[#fbf7f2] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8f7c70] min-w-[600px]">
        <div>Habitación</div>
        <div />
        <div>Descripción</div>
        <div className="text-center">Estado</div>
        <div className="text-center">A/V</div>
        <div className="text-center">Acción</div>
      </div>

      <div className="flex-1 overflow-auto min-w-[600px]">
        {rooms.map((room) => {
          const isSelected = room.number === selectedNumber;
          return (
            <button
              key={room.number}
              type="button"
              onClick={() => onSelect(room.number)}
              className={cn(
                'grid w-full grid-cols-[100px_60px_1fr_120px_1fr_100px] items-center gap-2 border-b border-[#f1e7de] px-3 py-2 text-left transition last:border-b-0',
                isSelected ? 'bg-[#fff7ef]' : 'bg-white hover:bg-[#fdfaf7]'
              )}
            >
              <div className="flex h-[90px] items-center justify-center overflow-hidden rounded-[16px] bg-sapay-250">
                {room.image ? (
                  <img src={room.image} alt={room.type} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-sapay-650">Sin imagen</div>
                )}
              </div>

              <div>
                <p className="text-[14px] font-semibold text-sapay-950">{room.number}</p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] leading-4 text-[#4e4037]">{room.description}</p>
              </div>

              <div className="flex justify-center">
                <StatusPill className={statusStyles[room.status]}>{room.status}</StatusPill>
              </div>

              <div className="text-[10px] text-[#5d4d42] text-center">{room.acType}</div>

              <div className="flex items-center justify-center gap-2">
                <IconButton
                  label="Editar"
                  icon={PencilLine}
                  onClick={() => onEdit(room.number)}
                />
                <IconButton
                  label="Ver"
                  icon={Eye}
                  onClick={() => onSelect(room.number)}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}