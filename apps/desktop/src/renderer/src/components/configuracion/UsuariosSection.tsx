import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import { type ReactElement } from 'react';
import { type AdminUser } from '../../lib/api';
import { StatusPill } from '../ui/StatusPill';
import { UserFormModal } from './UserFormModal';
import {
  ROLE_LABEL,
  useUsuarios,
  type UserRole
} from './useUsuarios';

const ROLE_PILL: Record<UserRole, string> = {
  ADMIN: 'bg-[#f3e2c8] text-[#8a6410]',
  RECEPTION: 'bg-[#e8f5ec] text-[#235a44]',
  CLEANING: 'bg-[#eef5fc] text-[#2f6f9f]'
};

function UsersTable({
  users,
  loading,
  onEdit,
  onToggle,
  isSelf
}: {
  users: AdminUser[];
  loading: boolean;
  onEdit: (user: AdminUser) => void;
  onToggle: (user: AdminUser) => void;
  isSelf: (user: AdminUser) => boolean;
}): ReactElement {
  return (
    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border border-sapay-350 bg-white">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="sticky top-0 bg-[#fcf8f4] text-[10px] uppercase text-sapay-750">
          <tr>
            <th className="px-3 py-2">Usuario</th>
            <th className="px-3 py-2">Cédula</th>
            <th className="px-3 py-2">Contacto</th>
            <th className="px-3 py-2">Rol</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="p-8 text-center text-sapay-650">Cargando usuarios...</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="border-t border-[#f0e7e0] hover:bg-[#fffaf6]">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sapay-900 text-[10px] font-semibold text-white">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                    <div className="leading-tight">
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-[10px] text-sapay-650">{isSelf(user) ? 'Tú' : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">{user.cc}</td>
                <td className="px-3 py-2">
                  <p className="leading-tight">{user.email}</p>
                  <p className="text-[10px] text-sapay-650">{user.phone || 'Sin teléfono'}</p>
                </td>
                <td className="px-3 py-2">
                  <StatusPill className={ROLE_PILL[user.role as UserRole] ?? ROLE_PILL.RECEPTION}>
                    {ROLE_LABEL[user.role as UserRole] ?? user.role}
                  </StatusPill>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${user.isActive ? 'text-[#2f8f4e]' : 'text-[#b94646]'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-[#2f8f4e]' : 'bg-[#b94646]'}`} />
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <button
                      title="Editar"
                      onClick={() => onEdit(user)}
                      className="rounded p-1.5 text-[#7a4a34] hover:bg-[#f8eee7]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      title={user.isActive ? 'Desactivar' : 'Activar'}
                      disabled={user.isActive && isSelf(user)}
                      onClick={() => onToggle(user)}
                      className="rounded p-1.5 text-sapay-650 hover:bg-[#f8eee7] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
          {!loading && users.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-sapay-650">No hay usuarios registrados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function UsuariosSection(): ReactElement {
  const u = useUsuarios();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Usuarios y roles</h2>
          <p className="text-[10px] text-sapay-750">
            Crea cuentas del personal y define su acceso al sistema.
          </p>
        </div>
        <button
          onClick={u.openCreate}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sapay-900 bg-sapay-900 px-3 text-xs font-medium text-white shadow-[0_10px_26px_rgba(75,43,33,0.28)] transition hover:bg-sapay-850"
        >
          <Plus size={14} /> Nuevo usuario
        </button>
      </div>

      {u.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-xs text-[#b33a3a]">
          {u.error}
        </div>
      )}

      {u.status && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            u.status.kind === 'success'
              ? 'border-success-100 bg-success-50 text-[#2f8f4e]'
              : 'border-danger-200 bg-danger-100 text-[#b33a3a]'
          }`}
        >
          {u.status.message}
        </div>
      )}

      <UsersTable
        users={u.users}
        loading={u.loading}
        onEdit={u.openEdit}
        onToggle={u.toggleActive}
        isSelf={u.isSelf}
      />

      {u.showForm && (
        <UserFormModal
          editing={Boolean(u.editing)}
          form={u.form}
          setForm={u.setForm}
          saving={u.saving}
          onSubmit={u.submit}
          onClose={u.closeForm}
        />
      )}
    </div>
  );
}