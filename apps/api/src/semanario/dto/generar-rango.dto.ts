import { IsDateString, IsEnum, IsOptional } from 'class-validator';

/**
 * Qué hacer con las celdas del rango que ya tienen a alguien.
 *
 * Antes esto era un booleano `sobrescribir`, y el booleano escondía lo
 * importante: no es "rehacer el rango" sino "rehacer estas celdas". Un nombre
 * con dos valores hace imposible desactivar la opción equivocada.
 */
export enum ModoGeneracion {
  /** Solo rellena lo que está vacío. Es lo normal al ampliar el horario mes a mes. */
  COMPLETAR = 'completar',
  /** Recalcula todas las celdas del rango y descarta los ajustes manuales. */
  REHACER = 'rehacer'
}

export class GenerarRangoDto {
  @IsDateString({}, { message: 'La fecha de inicio no es válida.' })
  desde!: string;

  @IsDateString({}, { message: 'La fecha final no es válida.' })
  hasta!: string;

  /**
   * Por defecto (`completar`) se respetan los turnos que el administrador ya
   * editó a mano y solo se rellenan las celdas vacías del rango. Con `rehacer`
   * se recalcula toda la rotación de esas celdas.
   */
  @IsOptional()
  @IsEnum(ModoGeneracion, {
    message: `El modo debe ser "${ModoGeneracion.COMPLETAR}" o "${ModoGeneracion.REHACER}".`
  })
  modo?: ModoGeneracion;
}