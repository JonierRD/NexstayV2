import { Pencil, Trash2 } from 'lucide-react';
import { type ReactElement } from 'react';
import { type Cliente } from '../../lib/api';

type Props = {
  clients: Cliente[];
  loading: boolean;
  onView: (client: Cliente) => void;
  onEdit: (client: Cliente) => void;
  onDelete: (client: Cliente) => void;
};

export function ClientsTable({ clients, loading, onView, onEdit, onDelete }: Props): ReactElement {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-sapay-350 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-[#fcf8f4] text-[10px] uppercase text-sapay-750">
          <tr>
            <th className="px-3 py-2">Cliente</th>
            <th className="px-3 py-2">Cédula</th>
            <th className="px-3 py-2">Teléfono</th>
            <th className="px-3 py-2">Ciudad</th>
            <th className="px-3 py-2">Hospedajes</th>
            <th className="px-3 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-sapay-650">Cargando clientes...</td>
            </tr>
          ) : (
            clients.map((client) => (
              <tr key={client.id} className="border-t border-[#f0e7e0] hover:bg-[#fffaf6]">
                <td className="px-3 py-2 font-medium">
                  {client.firstName} {client.lastName}
                </td>
                <td className="px-3 py-2">{client.cc}</td>
                <td className="px-3 py-2">{client.phone || 'Sin teléfono'}</td>
                <td className="px-3 py-2">{client.cityOrigin || 'Sin ciudad'}</td>
                <td className="px-3 py-2">{client.stays?.length ?? 0}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button title="Ver historial" onClick={() => onView(client)} className="rounded p-1.5 text-[#7a4a34] hover:bg-[#f8eee7]">
                      Historial
                    </button>
                    <button title="Editar" onClick={() => onEdit(client)} className="rounded p-1.5 text-[#7a4a34] hover:bg-[#f8eee7]">
                      <Pencil size={14} />
                    </button>
                    <button title="Eliminar" onClick={() => onDelete(client)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          {!loading && clients.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-sapay-650">No hay clientes que coincidan.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}