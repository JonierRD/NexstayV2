import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  type Cliente,
  type PublicUser,
  clientesRequest,
  createClienteRequest,
  deleteClienteRequest,
  updateClienteRequest
} from '../../lib/api';
import { emptyForm, type FormState } from './types';

export function useClientes(user: PublicUser) {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [history, setHistory] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState<Cliente | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // PROCESO: Cargar clientes desde la API (GET /clientes)
  async function load(): Promise<void> {
    setLoading(true);
    try {
      setClients(await clientesRequest());
      setError('');
    } catch {
      setError('No se pudo cargar el directorio de clientes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  // PROCESO: Búsqueda por cédula, nombre, teléfono o ciudad
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return clients;
    return clients.filter((client) =>
      [client.cc, client.firstName, client.lastName, client.phone, client.cityOrigin, client.cityDestination]
        .some((field) => field?.toLowerCase().includes(value))
    );
  }, [clients, query]);

  function openCreate(): void {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(client: Cliente): void {
    setEditing(client);
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      cc: client.cc,
      phone: client.phone ?? '',
      cityOrigin: client.cityOrigin ?? '',
      cityDestination: client.cityDestination ?? '',
      profession: client.profession ?? '',
      notes: client.notes ?? ''
    });
    setShowForm(true);
  }

  function closeForm(): void {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  }

  // PROCESO: Crear o actualizar cliente (POST /clientes o PUT /clientes/:id)
  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.cc.trim()) {
      setError('Nombre, apellido y cédula son obligatorios.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { cc: _cc, ...update } = form;
        await updateClienteRequest(editing.id, update);
      } else {
        await createClienteRequest(form);
      }
      closeForm();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el cliente.');
    } finally {
      setSaving(false);
    }
  }

  // PROCESO: Eliminar cliente (con contraseña de admin si aplica)
  async function remove(password?: string, client = deleting): Promise<void> {
    if (!client) return;
    try {
      await deleteClienteRequest(client.id, password);
      setDeleting(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar el cliente.');
    }
  }

  function requestDelete(client: Cliente): void {
    setError('');
    setDeleting(client);
    if (user.role === 'ADMIN') void remove(undefined, client);
  }

  return {
    clients,
    setClients,
    query,
    setQuery,
    form,
    setForm,
    editing,
    history,
    setHistory,
    deleting,
    setDeleting,
    showForm,
    loading,
    saving,
    error,
    filtered,
    openCreate,
    openEdit,
    closeForm,
    submit,
    remove,
    requestDelete
  };
}