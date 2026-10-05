import { Trash2 } from 'lucide-react';
import { useRef, useState, useEffect, type FormEvent, type ReactElement } from 'react';
import { type Habitacion, createHabitacionRequest, updateHabitacionRequest, habitacionesRequest } from '../../lib/api';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { type RoomStatus, type RoomType } from './types';

type RoomFormModalProps = {
  room?: Habitacion;
  onSave: (room: Habitacion) => void;
  onRequestDelete?: (number: string) => void;
  onClose: () => void;
};

type FormData = {
  number: string;
  type: RoomType;
  status: RoomStatus;
  hasAir: boolean;
  hasFan: boolean;
  priceWithAir: string;
  priceWithFan: string;
  image: string | null;
  notes: string;
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

function initialForm(room?: Habitacion): FormData {
  return {
    number: room?.number ?? '',
    type: room?.type ?? 'SENCILLA',
    status: room?.status ?? 'DISPONIBLE',
    hasAir: room?.hasAir ?? false,
    hasFan: room?.hasFan ?? true,
    priceWithAir: room?.priceWithAir ? String(Number(room.priceWithAir)) : '',
    priceWithFan: room?.priceWithFan ? String(Number(room.priceWithFan)) : '',
    image: room?.image ?? null,
    notes: room?.notes ?? ''
  };
}

/** Referencia de precios de otra habitación del mismo tipo. */
function findPriceReference(rooms: Habitacion[], type: RoomType): Habitacion | undefined {
  return rooms.find((r) => r.type === type && r.priceWithAir && r.priceWithFan);
}

/** null si todo ok; en el texto a mostrar si no se puede guardar. */
function validateRoomForm(form: FormData, isEdit: boolean): string | null {
  if (!isEdit && !form.number.trim()) {
    return 'El número de habitación es obligatorio.';
  }
  if (!/^\d{3,4}$/.test(form.number)) {
    return 'El número de habitación debe ser de 3 a 4 dígitos numéricos.';
  }

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

  return warnings.length > 0 ? warnings.join(' ') : null;
}

/** Campos comunes a creación y edición. */
function priceFields(form: FormData) {
  return {
    type: form.type,
    hasAir: form.hasAir,
    hasFan: form.hasFan,
    priceWithAir: form.priceWithAir ? Number(form.priceWithAir) : undefined,
    priceWithFan: form.priceWithFan ? Number(form.priceWithFan) : undefined,
    notes: form.notes || undefined
  };
}

export function RoomFormModal({ room, onSave, onRequestDelete, onClose }: RoomFormModalProps): ReactElement {
  const isEdit = !!room;
  const canDelete = isEdit && !!onRequestDelete;
  const [existingRooms, setExistingRooms] = useState<Habitacion[]>([]);

  const [form, setForm] = useState<FormData>(() => initialForm(room));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(room?.image ? 'Imagen cargada' : '');
  const [originalImage, setOriginalImage] = useState(room?.image ?? null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Cargar habitaciones existentes para obtener precios de referencia
  useEffect(() => {
    habitacionesRequest().then(setExistingRooms).catch(() => {});
  }, []);

  // Establecer precios iniciales basados en el tipo cuando es creación
  useEffect(() => {
    if (!isEdit && existingRooms.length > 0) {
      const roomWithSameType = findPriceReference(existingRooms, form.type);
      if (roomWithSameType && !form.priceWithAir && !form.priceWithFan) {
        setForm((prev) => ({
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
        const roomWithSameType = findPriceReference(existingRooms, value as RoomType);
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

    const validationError = validateRoomForm(form, isEdit);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && room) {
        const updated = await updateHabitacionRequest(room.number, {
          ...priceFields(form),
          status: form.status,
          image: form.image
        });
        onSave(updated);
      } else {
        const created = await createHabitacionRequest({
          ...priceFields(form),
          number: form.number.trim(),
          image: form.image ?? undefined
        });
        onSave(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la habitación.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={isEdit ? 'Editar Habitación' : 'Nueva Habitación'}
      maxWidthClass="max-w-[460px]"
      zIndexClass="z-50"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">{error}</div>
        )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Número">
              <input
                type="text"
                value={form.number}
                onChange={(e) => update('number', e.target.value)}
                className="w-full bg-transparent text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550"
                placeholder="Ej: 101"
                required={!isEdit}
              />
            </Field>

            <Field label="Tipo">
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className="w-full bg-transparent text-[12px] text-sapay-950 outline-none"
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
                  className="w-full bg-transparent text-[12px] text-sapay-950 outline-none"
                >
                  <option value="DISPONIBLE" disabled={room?.status === 'OCUPADA'}>
                    {room?.status === 'OCUPADA' ? 'Disponible (usar botón Liberar)' : 'Disponible'}
                  </option>
                  <option value="OCUPADA">Ocupada</option>
                  <option value="RESERVADA">Reservada</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                </select>
                {room?.status === 'OCUPADA' && (
                  <p className="mt-1 text-[10px] text-sapay-650">
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
                className="w-full bg-transparent text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550"
                placeholder="0"
              />
            </Field>

            <Field label="Precio con ventilador">
              <input
                type="number"
                min="0"
                value={form.priceWithFan}
                onChange={(e) => update('priceWithFan', e.target.value)}
                className="w-full bg-transparent text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550"
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
                  className="block w-full text-[11px] text-[#4e4037] file:mr-3 file:rounded-xl file:border-0 file:bg-sapay-900 file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-white hover:file:bg-sapay-850"
                />
                <p className="text-[10px] text-sapay-650">Máximo permitido: 2MB</p>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-[#e9ddd3] bg-sapay-100 px-3 py-2">
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
                      className="text-[11px] font-medium text-sapay-900 hover:text-sapay-800"
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
                className="h-4 w-4 rounded border-sapay-450 accent-sapay-900"
              />
              <span className="text-[11px] text-[#4e4037]">Tiene aire</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasFan}
                onChange={(e) => update('hasFan', e.target.checked)}
                className="h-4 w-4 rounded border-sapay-450 accent-sapay-900"
              />
              <span className="text-[11px] text-[#4e4037]">Tiene ventilador</span>
            </label>
          </div>

          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full bg-transparent text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550 resize-none"
              placeholder="Notas opcionales..."
              rows={2}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            {canDelete && (
              <Button
                type="button"
                onClick={() => room && onRequestDelete?.(room.number)}
                className="h-9 rounded-xl border border-[#efb7b7] bg-white px-2 text-[11px] font-medium text-[#d13d3d] hover:bg-[#fff5f5] disabled:opacity-70"
              >
                <Trash2 size={14} className="mr-1" />
                Eliminar
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-xl border border-sapay-450 bg-white text-[11px] font-medium text-sapay-900 hover:bg-sapay-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 h-9 rounded-xl bg-sapay-900 text-[11px] font-medium text-white hover:bg-sapay-850 disabled:opacity-70"
            >
              {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear habitación'}
            </Button>
          </div>
        </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-sapay-650">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-sapay-400 bg-sapay-100 px-3 py-2 transition focus-within:border-sapay-600 focus-within:bg-white">
        {children}
      </div>
    </label>
  );
}
