import { IsDateString, IsOptional } from 'class-validator';

/**
 * Filtro opcional del grid. Sin rango devuelve todo lo generado, que es lo que
 * necesita el frontend: el administrador define el periodo una vez y la
 * recepcionista lo consulta entero.
 */
export class RangoQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio del filtro no es válida.' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha final del filtro no es válida.' })
  hasta?: string;
}