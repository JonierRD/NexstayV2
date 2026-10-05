import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class ReordenarRosterDto {
  /**
   * El roster completo ya ordenado. Se manda la lista entera y no un par de
   * posiciones porque así el frontend no tiene que inventar cómo renumerar el
   * resto y el backend no puede quedar con huecos.
   */
  @IsArray()
  @ArrayMinSize(1, { message: 'La rotación debe tener al menos una recepcionista.' })
  @ArrayMaxSize(50, { message: 'La rotación no puede tener más de 50 recepcionistas.' })
  @IsInt({ each: true, message: 'Cada posición debe ser el id de una recepcionista.' })
  ids!: number[];
}