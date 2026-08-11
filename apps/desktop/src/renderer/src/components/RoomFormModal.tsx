import { Trash2, X } from 'lucide-react';
import { useRef, useState, useEffect, type FormEvent, type ReactElement } from 'react';
import { type CreateHabitacionInput, type Habitacion, type UpdateHabitacionInput, createHabitacionRequest, deleteHabitacionRequest, updateHabitacionRequest, habitacionesRequest } from '../lib/api';
import { Button } from './ui/button';
import { ConfirmModal } from './ConfirmModal';

type RoomFormModalProps = {
  room?: Habitacion;
  onSave: (room: Habitacion) => void;
  onDelete?: (number: string) => void;
  onClose: () => void;
  adminPassword?: string;
};

type RoomStatus = 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';

type FormData = {
  number: string;
  type: 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS';
  status: RoomStatus;
  hasAir: boolean;
  hasFan: boolean;
  priceWithAir: string;
  priceWithFan: string;
  image: string | null;
  notes: string;
};

export function RoomFormModal({ room, onSave, onDelete, onClose, adminPassword }: RoomFormModalProps): ReactElement {
  const isEdit = !!room;
  const canDelete = isEdit && !!onDelete;
  const [existingRooms, setExistingRooms] = useState<Habitacion[]>([]);

  const [form, setForm] = useState<FormData>({
    number: room?.number ?? '',
    type: room?.type ?? 'SENCILLA',
    status: room?.status ?? 'DISPONIBLE',
    hasAir: room?.hasAir ?? false,
    hasFan: room?.hasFan ?? true,
    priceWithAir: room?.priceWithAir ? String(Number(room.priceWithAir)) : '',
    priceWithFan: room?.priceWithFan ? String(Number(room.priceWithFan)) : '',
    image: room?.image ?? null,
    notes: room?.notes ?? ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(room?.image ? 'Imagen cargada' : '');
  const [originalImage, setOriginalImage] = useState(room?.image ?? null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

  // Cargar habitaciones existentes para obtener precios de referencia
  useEffect(() => {
    habitacionesRequest().then(setExistingRooms).catch(() => {});
  }, []);

  // Establecer precios iniciales basados en el tipo cuando es creación
  useEffect(() => {
    if (!isEdit && existingRooms.length > 0) {
      const roomWithSameType = existingRooms.find(r => r.type === form.type && r.priceWithAir && r.priceWithFan);
      if (roomWithSameType && !form.priceWithAir && !form.priceWithFan) {
        setForm(prev => ({
          ...prev,
          priceWithAir: String(Number(roomWithSameType.priceWithAir)),
          priceWithFan: String(Number(roomWithSameType.priceWithFan))
        }));
      }
    }
  }, [isEdit, existingRooms, form.type, form.priceWithAir, form.priceWithFan]);

  function update(field: keyof FormData, value: string | boolean | null) {
    setForm((prev) => {
      const newForm = { ...prev, [field]: value };

      // Si cambia el tipo, actualizar precios automáticamente usando habitaciones existentes
      if (field === 'type') {
        const newType = value as 'SENCILLA' | 'MATRIMONIAL' | 'DOSCAMAS';
        // Buscar una habitación existente del mismo tipo para usar sus precios
        const roomWithSameType = existingRooms.find(r => r.type === newType && r.priceWithAir && r.priceWithFan);
        if (roomWithSameType) {
          newForm.priceWithAir = String(Number(roomWithSameType.priceWithAir));
          newForm.priceWithFan = String(Number(roomWithSameType.priceWithFan));
        }
      }

      return newForm;
    });
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño del archivo
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`La imagen es demasiado grande (${sizeMB}MB). El máximo permitido es 2MB.`);
      return;
    }

    setSelectedFileName(file.name);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(file);
      });
      update('image', base64);
      setError(''); // Limpiar error si la carga fue exitosa
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la imagen.');
    }
  }

  function clearImage(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    update('image', null);
    setSelectedFileName('');
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }

  function revertImage() {
    if (originalImage) {
      update('image', originalImage);
      setSelectedFileName('Imagen cargada');
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!isEdit && !form.number.trim()) {
      setError('El número de habitación es obligatorio.');
      return;
    }

    // Validación de formato de número
    if (!/^\d{3,4}$/.test(form.number)) {
      setError('El número de habitación debe ser de 3 a 4 dígitos numéricos.');
      return;
    }

    // Validación de lógica de precios (advertencias)
    const warnings: string[] = [];
    if (form.hasAir && !form.priceWithAir) {
      warnings.push('La habitación tiene aire pero no tiene precio con aire configurado.');
    }
    if (form.hasFan && !form.priceWithFan) {
      warnings.push('La habitación tiene ventilador pero no tiene precio con ventilador configurado.');
    }
    if (!form.hasAir && !form.hasFan && !form.priceWithAir && !form.priceWithFan) {
      warnings.push('La habitación no tiene precios configurados.');
    }

    if (warnings.length > 0) {
      setError(warnings.join(' '));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && room) {
        const payload: UpdateHabitacionInput = {
          type: form.type,
          status: form.status,
          hasAir: form.hasAir,
          hasFan: form.hasFan,
          priceWithAir: form.priceWithAir ? Number(form.priceWithAir) : undefined,
          priceWithFan: form.priceWithFan ? Number(form.priceWithFan) : undefined,
          image: form.image,
          notes: form.notes || undefined,
          ...(adminPassword ? { adminPassword } : {})
        };
        const updated = await updateHabitacionRequest(room.number, payload);
        onSave(updated);
      } else {
        const payload: CreateHabitacionInput = {
          number: form.number.trim(),
          type: form.type,
          hasAir: form.hasAir,
          hasFan: form.hasFan,
          priceWithAir: form.priceWithAir ? Number(form.priceWithAir) : undefined,
          priceWithFan: form.priceWithFan ? Number(form.priceWithFan) : undefined,
          image: form.image ?? undefined,
          notes: form.notes || undefined,
          ...(adminPassword ? { adminPassword } : {})
        };
        const created = await createHabitacionRequest(payload);
        onSave(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la habitación.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!room || !onDelete) return;
    setShowDeleteConfirm(false);
    setError('');
    setDeleting(true);
    try {
      await deleteHabitacionRequest(room.number, adminPassword);
      onDelete(room.number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la habitación.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-[460px] rounded-2xl border border-[#eadfd6] bg-white p-5 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-[#8d7b70] hover:text-[#4b2b21] transition"
        >
          <X size={18} />
        </button>

        <h3 className="text-[15px] font-semibold text-[#2b1b14]">
          {isEdit ? 'Editar Habitación' : 'Nueva Habitación'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {error && (
            <div className="rounded-lg border border-[#f1c2c2] bg-[#fff0f0] px-3 py-2 text-[11px] text-[#b33a3a]">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Número">
              <input
                type="text"
                value={form.number}
                onChange={(e) => update('number', e.target.value)}
                className="w-full bg-transparent text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486]"
                placeholder="Ej: 101"
                required={!isEdit}
              />
            </Field>

            <Field label="Tipo">
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className="w-full bg-transparent text-[12px] text-[#2b1b14] outline-none"
              >
                <option value="SENCILLA">Sencilla</option>
                <option value="MATRIMONIAL">Matrimonial</option>
                <option value="DOSCAMAS">Dos Camas</option>
              </select>
            </Field>

            {isEdit && (
              <Field label="Estado">
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className="w-full bg-transparent text-[12px] text-[#2b1b14] outline-none"
                >
                  <option value="DISPONIBLE" disabled={room?.status === 'OCUPADA'}>
                    {room?.status === 'OCUPADA' ? 'Disponible (usar botón Liberar)' : 'Disponible'}
                  </option>
                  <option value="OCUPADA">Ocupada</option>
                  <option value="RESERVADA">Reservada</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                </select>
                {room?.status === 'OCUPADA' && (
                  <p className="mt-1 text-[10px] text-[#8d7b70]">
                    La habitación está ocupada. Usa el botón "Liberar" en la vista principal para cambiar a disponible.
                  </p>
                )}
              </Field>
            )}

            <Field label="Precio con aire">
              <input
                type="number"
                min="0"
                value={form.priceWithAir}
                onChange={(e) => update('priceWithAir', e.target.value)}
                className="w-full bg-transparent text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486]"
                placeholder="0"
              />
            </Field>

            <Field label="Precio con ventilador">
              <input
                type="number"
                min="0"
                value={form.priceWithFan}
                onChange={(e) => update('priceWithFan', e.target.value)}
                className="w-full bg-transparent text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486]"
                placeholder="0"
              />
            </Field>
          </div>

            <Field label={isEdit ? 'Imagen de la habitación' : 'Imagen opcional'}>
              <div className="space-y-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-[11px] text-[#4e4037] file:mr-3 file:rounded-xl file:border-0 file:bg-[#4b2b21] file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-white hover:file:bg-[#5a3429]"
                />
                <p className="text-[10px] text-[#8d7b70]">Máximo permitido: 2MB</p>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[#e9ddd3] bg-[#fcfaf8] px-3 py-2">
                  <p className="truncate text-[11px] text-[#4e4037]">
                    {selectedFileName ? selectedFileName : form.image ? 'Imagen cargada' : 'Sin archivo seleccionado'}
                  </p>
                  {form.image ? (
                    <button
                      type="button"
                      onClick={(e) => clearImage(e)}
                      className="text-[11px] font-medium text-[#d13d3d] hover:text-[#b83131]"
                    >
                      Quitar
                    </button>
                  ) : originalImage ? (
                    <button
                      type="button"
                      onClick={revertImage}
                      className="text-[11px] font-medium text-[#4b2b21] hover:text-[#6b3a2d]"
                    >
                      Revertir
                    </button>
                  ) : null}
                </div>
              </div>
            </Field>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasAir}
                onChange={(e) => update('hasAir', e.target.checked)}
                className="h-4 w-4 rounded border-[#dccfca] accent-[#4b2b21]"
              />
              <span className="text-[11px] text-[#4e4037]">Tiene aire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasFan}
                onChange={(e) => update('hasFan', e.target.checked)}
                className="h-4 w-4 rounded border-[#dccfca] accent-[#4b2b21]"
              />
              <span className="text-[11px] text-[#4e4037]">Tiene ventilador</span>
            </label>
          </div>

          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full bg-transparent text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486] resize-none"
              placeholder="Notas opcionales..."
              rows={2}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            {canDelete && (
              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="h-9 rounded-xl border border-[#efb7b7] bg-white px-2 text-[11px] font-medium text-[#d13d3d] hover:bg-[#fff5f5] disabled:opacity-70"
              >
                <Trash2 size={14} className="mr-1" />
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-xl border border-[#dccfca] bg-white text-[11px] font-medium text-[#4b2b21] hover:bg-[#faf6f2]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-9 rounded-xl bg-[#4b2b21] text-[11px] font-medium text-white hover:bg-[#5a3429] disabled:opacity-70"
            >
              {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear habitación'}
            </Button>
          </div>
        </form>

        {showDeleteConfirm && room && (
          <ConfirmModal
            title={`¿Eliminar habitación ${room.number}?`}
            message="Esta acción no se puede deshacer. La habitación se eliminará permanentemente del sistema."
            confirmLabel="Sí, eliminar"
            confirmDanger
            onConfirm={handleDelete}
            onClose={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#8d7b70]">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 py-2 transition focus-within:border-[#b08f7c] focus-within:bg-white">
        {children}
      </div>
    </label>
  );
}
