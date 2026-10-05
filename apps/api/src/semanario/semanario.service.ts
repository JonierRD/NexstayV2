import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { type Prisma, type TurnoLabor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateRecepcionistaDto } from './dto/create-recepcionista.dto';
import { UpdateRecepcionistaDto } from './dto/update-recepcionista.dto';
import { GenerarRangoDto, ModoGeneracion } from './dto/generar-rango.dto';
import { GuardarSemanaDto } from './dto/guardar-semana.dto';
import { CeldaDto } from './dto/guardar-celda.dto';
import { RangoQueryDto } from './dto/rango-query.dto';
import {
  DIAS_POR_SEMANA,
  addDays,
  dateOnly,
  diffDays,
  endOfWeek,
  isoWeekNumber,
  rangoDeSemanas,
  toIsoDate
} from './semanario.date';

/** Orden fijo de los turnos. El índice es lo que usa la fórmula de rotación. */
const TURNOS: TurnoLabor[] = ['DIA', 'NOCHE'];
const INDICE_TURNO: Record<TurnoLabor, number> = { DIA: 0, NOCHE: 1 };

/** El hotel rota con 3 recepcionistas: 2 días de trabajo y 1 de descanso. */
const RECEPIONISTAS_PARA_ROTAR = 3;

/** Tope defensivo: evita que un rango mal escrito genere años de historial. */
const MAX_SEMANAS = 104;

/**
 * Un solo criterio de orden para todo el módulo. `orden` es lo que edita el
 * administrador y `id` desempata: sin ese desempate dos personas con el mismo
 * `orden` aparecerían en un orden arbitrario y la rotación cambiaría sola.
 */
const ORDEN_ROSTER = [{ orden: 'asc' as const }, { id: 'asc' as const }];

type SemanaConAsignaciones = Prisma.SemanaGetPayload<{
  include: { asignaciones: { include: { recepcionista: { select: { nombre: true } } } } };
}>;

export type CeldaView = {
  fecha: string;
  turno: TurnoLabor;
  recepcionistaId: number | null;
  nombre: string | null;
  destacado: boolean;
  nota: string | null;
};

export type SemanaView = {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  anio: number;
  numeroSemana: number;
  notas: string | null;
  celdas: CeldaView[];
};

/**
 * El roster que ve el frontend. `posicion` es el índice dentro de la rotación ya
 * normalizado (0, 1, 2...) aunque la columna `orden` tenga huecos o repeticiones
 * de cuando se agregaron y quitaron personas: el número que importa es este.
 */
export type RecepcionistaView = Prisma.RecepcionistaGetPayload<{}> & {
  posicion: number;
};

@Injectable()
export class SemanarioService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  /**
   * Reparte las recepcionistas en los 2 turnos de forma continua: quien abre
   * (DIA) un día es quien cierra (NOCHE) al siguiente. Con 3 activas cada una
   * trabaja 2 días seguidos y descansa 1, y el descanso es la consecuencia de
   * que sobren personas, no una regla aparte.
   *
   * El ciclo va anclado a una fecha absoluta (el primer día que el administrador
   * pidió), no a la semana: si se reiniciara en cada semana, la segunda arrancaría
   * otra vez con la primera recepcionista y la rotación quedaría rota. Anclarlo al
   * `desde` y no al domingo es lo que hace que la #1 abra el primer turno de la
   * primera semana, aunque esa semana empiece antes y esos días queden vacíos.
   */
  private personaDelTurno(orden: number[], ancla: Date, fecha: Date, turno: TurnoLabor): number {
    const total = orden.length;
    const dia = diffDays(ancla, fecha);
    const indice = (((INDICE_TURNO[turno] - dia) % total) + total) % total;
    return orden[indice];
  }

  // ---------- Lectura ----------

  async findAll(filtros: RangoQueryDto = {}) {
    const where: Prisma.SemanaWhereInput = {};

    if (filtros.desde || filtros.hasta) {
      where.fechaInicio = {
        ...(filtros.desde ? { gte: dateOnly(filtros.desde) } : {}),
        ...(filtros.hasta ? { lte: dateOnly(filtros.hasta) } : {})
      };
    }

    const [recepcionistas, semanas] = await Promise.all([
      this.prisma.recepcionista.findMany({ orderBy: ORDEN_ROSTER }),
      this.prisma.semana.findMany({
        where,
        include: {
          asignaciones: { include: { recepcionista: { select: { nombre: true } } } }
        },
        orderBy: { fechaInicio: 'asc' }
      })
    ]);

    const vista = semanas.map((semana) => this.construirSemana(semana));

    return {
      recepcionistas: recepcionistas.map((r, posicion) => ({ ...r, posicion })),
      rango: this.rangoReal(vista),
      semanas: vista
    };
  }

  /**
   * Rango del encabezado: los días que de verdad tienen turno, no el bloque de
   * semanas. Si el administrador pidió del 05/10 al 05/11, el rango dice
   * 5 OCT → 5 NOV aunque la primera semana empiece el domingo 04/10 y la última
   * termine el sábado 07/11, porque esos dos días se crean vacíos a propósito.
   */
  private rangoReal(vista: SemanaView[]): { desde: string; hasta: string } | null {
    const fechas = vista.flatMap((s) =>
      s.celdas.filter((c) => c.recepcionistaId !== null).map((c) => c.fecha)
    );

    if (!fechas.length) {
      return vista.length
        ? { desde: vista[0].fechaInicio, hasta: vista[vista.length - 1].fechaFin }
        : null;
    }

    const ordenadas = [...fechas].sort();
    return { desde: ordenadas[0], hasta: ordenadas[ordenadas.length - 1] };
  }

  /**
   * Cada semana devuelve siempre sus 7 días × 2 turnos, tenga o no Guardado
   * algo, para que el frontend no tenga que decidir qué celdas existen.
   */
  private construirSemana(semana: SemanaConAsignaciones): SemanaView {
    const porClave = new Map(
      semana.asignaciones.map((a) => [`${toIsoDate(a.fecha)}|${a.turno}`, a])
    );

    const celdas: CeldaView[] = [];
    for (let dia = 0; dia < DIAS_POR_SEMANA; dia++) {
      const fecha = addDays(semana.fechaInicio, dia);
      const iso = toIsoDate(fecha);

      for (const turno of TURNOS) {
        const asignacion = porClave.get(`${iso}|${turno}`);
        celdas.push({
          fecha: iso,
          turno,
          recepcionistaId: asignacion?.recepcionistaId ?? null,
          nombre: asignacion?.recepcionista?.nombre ?? null,
          destacado: asignacion?.destacado ?? false,
          nota: asignacion?.nota ?? null
        });
      }
    }

    return {
      id: semana.id,
      fechaInicio: toIsoDate(semana.fechaInicio),
      fechaFin: toIsoDate(endOfWeek(semana.fechaInicio)),
      anio: semana.anio,
      numeroSemana: semana.numeroSemana,
      notas: semana.notas,
      celdas
    };
  }

  // ---------- Roster ----------

  async crearRecepcionista(data: CreateRecepcionistaDto, user: JwtPayload) {
    const nombre = data.nombre.trim();

    const repetida = await this.prisma.recepcionista.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } }
    });
    if (repetida) {
      throw new ConflictException(`Ya existe una recepcionista llamada "${nombre}".`);
    }

    // Entra al final de la rotación para no correrle el turno a nadie.
    const ultima = await this.prisma.recepcionista.findFirst({
      orderBy: { orden: 'desc' },
      select: { orden: true }
    });

    const recepcionista = await this.prisma.recepcionista.create({
      data: {
        nombre,
        notas: data.notas?.trim() || null,
        orden: (ultima?.orden ?? -1) + 1
      }
    });

    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'RECEPCIONISTA',
      entityId: recepcionista.id.toString(),
      description: `Agrega recepcionista al semanario: ${recepcionista.nombre}`,
      newValue: recepcionista
    });

    return recepcionista;
  }

  async actualizarRecepcionista(id: number, data: UpdateRecepcionistaDto, user: JwtPayload) {
    const existente = await this.buscarRecepcionista(id);

    if (data.nombre) {
      const repetida = await this.prisma.recepcionista.findFirst({
        where: {
          id: { not: id },
          nombre: { equals: data.nombre.trim(), mode: 'insensitive' }
        }
      });
      if (repetida) {
        throw new ConflictException(
          `Ya existe otra recepcionista llamada "${data.nombre.trim()}".`
        );
      }
    }

    const recepcionista = await this.prisma.recepcionista.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
        ...(data.orden !== undefined ? { orden: data.orden } : {}),
        ...(data.activo !== undefined ? { activo: data.activo } : {}),
        ...(data.notas !== undefined ? { notas: data.notas.trim() || null } : {})
      }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'RECEPCIONISTA',
      entityId: id.toString(),
      description: `Actualiza recepcionista del semanario: ${recepcionista.nombre}`,
      oldValue: existente,
      newValue: recepcionista
    });

    return recepcionista;
  }

  /**
   * Se desactiva en vez de borrarse porque cada asignación guarda quién cubre
   * ese turno: borrar el roster rompería el histórico de semanas ya publicadas.
   */
  async desactivarRecepcionista(id: number, user: JwtPayload) {
    const existente = await this.buscarRecepcionista(id);

    const recepcionista = await this.prisma.recepcionista.update({
      where: { id },
      data: { activo: false }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'RECEPCIONISTA',
      entityId: id.toString(),
      description: `Desactiva recepcionista del semanario: ${recepcionista.nombre}`,
      oldValue: existente,
      newValue: recepcionista
    });

    return { message: 'Recepcionista desactivada. Su horario histórico se conserva.' };
  }

  /**
   * Elimina la recepcionista de verdad, no la deja inactiva.
   *
   * `asignacion.recepcionista_id` no tiene cascada, así que sus turnos se borran
   * antes: un turno sin persona asignada no se puede mostrar en el grid. El
   * conteo se devuelve para que la interfaz pueda advertir cuántos turnos
   * desaparecen antes de confirmar.
   */
  async eliminarRecepcionista(id: number, user: JwtPayload) {
    const existente = await this.buscarRecepcionista(id);

    const turnos = await this.prisma.asignacion.count({ where: { recepcionistaId: id } });

    await this.prisma.$transaction([
      this.prisma.asignacion.deleteMany({ where: { recepcionistaId: id } }),
      this.prisma.recepcionista.delete({ where: { id } })
    ]);

    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'RECEPCIONISTA',
      entityId: id.toString(),
      description: `Elimina recepcionista del semanario: ${existente.nombre} (${turnos} turnos)`,
      oldValue: existente
    });

    return {
      message:
        turnos > 0
          ? `Recepcionista eliminada y ${turnos} turnos suyos quedaron vacíos.`
          : 'Recepcionista eliminada.',
      turnosEliminados: turnos
    };
  }

  private async buscarRecepcionista(id: number) {
    const recepcionista = await this.prisma.recepcionista.findUnique({ where: { id } });
    if (!recepcionista) {
      throw new NotFoundException('La recepcionista no existe en el semanario.');
    }
    return recepcionista;
  }

  /**
   * Guarda el orden completo del roster. El frontend manda la lista ya ordenada
   * porque mover a alguien con flechas es mucho menos propenso a equivocarse que
   * escribir un número a mano.
   */
  async reordenarRoster(ids: number[], user: JwtPayload) {
    const actuales = await this.prisma.recepcionista.findMany({ select: { id: true } });
    const existentes = new Set(actuales.map((r) => r.id));

    if (ids.length !== actuales.length || new Set(ids).size !== ids.length) {
      throw new BadRequestException('El orden debe incluir a todas las recepcionistas, sin repetir.');
    }

    const desconocidas = ids.filter((id) => !existentes.has(id));
    if (desconocidas.length) {
      throw new NotFoundException(`No existe la recepcionista ${desconocidas.join(', ')}.`);
    }

    await this.prisma.$transaction(
      ids.map((id, indice) =>
        this.prisma.recepcionista.update({ where: { id }, data: { orden: indice } })
      )
    );

    const ordenadas = await this.prisma.recepcionista.findMany({
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
      select: { nombre: true }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'RECEPCIONISTA',
      description: `Reordena la rotación del semanario: ${ordenadas.map((r) => r.nombre).join(' → ')}`
    });

    return { message: 'Rotación reordenada.' };
  }

  // ---------- Vaciar y eliminar el horario ----------

  /** Vacía las 14 celdas de una semana pero conserva la semana en el grid. */
  async vaciarSemana(semanaId: number, user: JwtPayload) {
    const semana = await this.prisma.semana.findUnique({ where: { id: semanaId } });
    if (!semana) {
      throw new NotFoundException('La semana no existe en el semanario.');
    }

    const { count } = await this.prisma.asignacion.deleteMany({ where: { semanaId } });

    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'SEMANARIO',
      entityId: semanaId.toString(),
      description: `Vacía la semana del ${toIsoDate(semana.fechaInicio)} (${count} turnos)`
    });

    return { message: `Semana del ${toIsoDate(semana.fechaInicio)} vaciada.`, eliminadas: count };
  }

  /** Elimina la semana del grid. Las asignaciones caen por cascada. */
  async eliminarSemana(semanaId: number, user: JwtPayload) {
    const semana = await this.prisma.semana.findUnique({ where: { id: semanaId } });
    if (!semana) {
      throw new NotFoundException('La semana no existe en el semanario.');
    }

    const turnos = await this.prisma.asignacion.count({ where: { semanaId } });
    await this.prisma.semana.delete({ where: { id: semanaId } });

    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'SEMANARIO',
      entityId: semanaId.toString(),
      description: `Elimina la semana del ${toIsoDate(semana.fechaInicio)} (${turnos} turnos)`
    });

    return { message: `Semana del ${toIsoDate(semana.fechaInicio)} eliminada.` };
  }

  /** Deja el módulo como recién instalado: sin semanas ni turnos, roster intacto. */
  async vaciarTodo(user: JwtPayload) {
    const semanas = await this.prisma.semana.count();
    const turnos = await this.prisma.asignacion.count();

    // Las asignaciones primero: la FK de semana es restrictiva en algunas
    // versiones de Prisma y el borrado en cascada depende del motor.
    await this.prisma.$transaction([
      this.prisma.asignacion.deleteMany(),
      this.prisma.semana.deleteMany()
    ]);

    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'SEMANARIO',
      description: `Vacía todo el semanario (${semanas} semanas, ${turnos} turnos)`
    });

    return { message: 'Semanario vaciado.', semanas, turnos };
  }

  /**
   * Vacía los turnos del semanario SIN borrar las recepcionistas.
   *
   * El nombre de la acción es "vaciar recepcionistas" porque lo que el
   * administrador quiere quitar es a la gente del horario, pero las personas se
   * quedan en el roster: borrarlas sería destructivo y el roster es lo más
   * difícil de reconstruir a mano. Las semanas tampoco se tocan, así que el
   * grid sigue ahí listo para volver a llenarse.
   *
   * Es la contraparte de `vaciarTodo`: mismo roster de entrada, distinto
   * resultado.
   */
  async vaciarRoster(user: JwtPayload) {
    const turnos = await this.prisma.asignacion.count();
    const semanas = await this.prisma.semana.count();
    const roster = await this.prisma.recepcionista.count();

    await this.prisma.asignacion.deleteMany();

    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'SEMANARIO',
      description:
        `Vacía los turnos de las ${semanas} semanas (${turnos} turnos). ` +
        `Las ${roster} recepcionistas del roster se conservan.`
    });

    return { message: 'Turnos vaciados. Las recepcionistas se conservan.', turnos, roster, semanas };
  }

  // ---------- Generación del rango ----------

  /**
   * Crea las semanas domingo-sábado que cubren el periodo y las llena con la
   * rotación.
   *
   * En modo `completar` (el de siempre) no toca las celdas que ya tienen a
   * alguien: un ajuste manual del administrador vale más que la rotación
   * automática, y por eso se puede ampliar el horario mes a mes sin perder lo
   * hecho. En modo `rehacer` recalcula todas las celdas del rango.
   *
   * No se pueden crear dos seminarios superpuestos: `Semana.fechaInicio` es
   * único y el bucle hace upsert, así que un rango que se traslapa con otro
   * reutiliza las mismas semanas y solo agrega los días que faltaban.
   *
   * El rango no tiene que caer en días domingo/sábado: se crean las semanas
   * completas que contengan al rango, pero solo se asignan los días dentro de
   * [desde, hasta]. Pedir del lunes 05/10 al miércoles 18/11 genera 7 semanas y
   * deja sin cubrir el domingo 04/10 y del jueves 19/11 al sábado 21/11.
   */
  async generarRango(data: GenerarRangoDto, user: JwtPayload) {
    const desde = dateOnly(data.desde);
    const hasta = dateOnly(data.hasta);
    const rehacer = data.modo === ModoGeneracion.REHACER;

    if (diffDays(desde, hasta) < 0) {
      throw new BadRequestException('La fecha final debe ser igual o posterior a la de inicio.');
    }

    const { inicio, fin } = rangoDeSemanas(desde, hasta);

    if (diffDays(inicio, fin) / DIAS_POR_SEMANA > MAX_SEMANAS) {
      throw new BadRequestException(
        `El rango abarca más de ${MAX_SEMANAS} semanas (${toIsoDate(inicio)} a ${toIsoDate(fin)}). ` +
          'Acórtalo o genera varios rangos seguidos.'
      );
    }

    const orden = await this.ordenRotacion();
    if (orden.length !== RECEPIONISTAS_PARA_ROTAR) {
      throw new BadRequestException(
        `La rotación automática necesita exactamente ${RECEPIONISTAS_PARA_ROTAR} recepcionistas activas y hay ${orden.length}. ` +
          'Agrega o activa las que falten, o asigna el horario celda por celda.'
      );
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      let semanasCreadas = 0;
      let celdasNuevas = 0;
      let celdasRespetadas = 0;
      let celdasReemplazadas = 0;

      for (
        let cursor = inicio;
        diffDays(cursor, fin) >= 0;
        cursor = addDays(cursor, DIAS_POR_SEMANA)
      ) {
        // upsert y no create: el rango se puede regenerar y la semana debe
        // conservar su id y sus notas en vez de duplicarse. `Semana.fechaInicio`
        // es único, así que dos rangos que se traslapan se unen en las mismas
        // filas: nunca se crean dos seminarios superpuestos.
        const existente = await tx.semana.findUnique({
          where: { fechaInicio: cursor },
          select: { id: true }
        });

        const semana = await tx.semana.upsert({
          where: { fechaInicio: cursor },
          create: {
            fechaInicio: cursor,
            anio: cursor.getUTCFullYear(),
            numeroSemana: isoWeekNumber(cursor)
          },
          update: {}
        });

        if (!existente) {
          semanasCreadas += 1;
        }

        const fechas = Array.from({ length: DIAS_POR_SEMANA }, (_, i) => addDays(cursor, i));

        // Fuera del rango pedido la celda se deja vacía a propósito.
        const dentroDelRango = fechas.filter(
          (fecha) => diffDays(desde, fecha) >= 0 && diffDays(fecha, hasta) >= 0
        );

        if (rehacer) {
          // createMany con skipDuplicates no sirve aquí: las filas ya existen y
          // se saltarían en silencio. Se borran las del rango y se vuelven a
          // crear, que es justo lo que el administrador pidió al elegir rehacer.
          const { count } = await tx.asignacion.deleteMany({
            where: {
              semanaId: semana.id,
              ...(dentroDelRango.length
                ? { fecha: { in: dentroDelRango } }
                : { fecha: { in: fechas } })
            }
          });
          celdasReemplazadas += count;
        }

        const existentes = rehacer
          ? []
          : await tx.asignacion.findMany({
              where: { semanaId: semana.id, fecha: { in: dentroDelRango } },
              select: { fecha: true, turno: true }
            });

        const ocupadas = new Set(existentes.map((a) => `${toIsoDate(a.fecha)}|${a.turno}`));
        celdasRespetadas += ocupadas.size;

        const nuevas = [];
        for (const fecha of dentroDelRango) {
          for (const turno of TURNOS) {
            if (ocupadas.has(`${toIsoDate(fecha)}|${turno}`)) {
              continue;
            }
            nuevas.push({
              semanaId: semana.id,
              fecha,
              turno,
              recepcionistaId: this.personaDelTurno(orden, desde, fecha, turno)
            });
          }
        }

        if (nuevas.length) {
          await tx.asignacion.createMany({ data: nuevas, skipDuplicates: true });
          celdasNuevas += nuevas.length;
        }
      }

      return { semanasCreadas, celdasNuevas, celdasRespetadas, celdasReemplazadas };
    });

    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'SEMANARIO',
      description:
        `Genera el semanario del ${toIsoDate(desde)} al ${toIsoDate(hasta)}: ` +
        `${resultado.semanasCreadas} semanas nuevas, ${resultado.celdasNuevas} turnos agregados, ` +
        `${resultado.celdasRespetadas} ya asignados que se dejaron como estaban` +
        (resultado.celdasReemplazadas ? `, ${resultado.celdasReemplazadas} recalculados` : '')
    });

    return {
      // El rango que se pidió, no el del bloque de semanas: si el administrador
      // escribió del 05/10 al 05/11, eso es lo que devolvemos.
      rango: { desde: toIsoDate(desde), hasta: toIsoDate(hasta) },
      ...resultado
    };
  }

  /** Solo las activas y en el orden que define la rotación. */
  private async ordenRotacion(): Promise<number[]> {
    const activas = await this.prisma.recepcionista.findMany({
      where: { activo: true },
      orderBy: ORDEN_ROSTER,
      select: { id: true }
    });
    return activas.map((r) => r.id);
  }

  // ---------- Edición del horario ----------

  /** Reemplaza todas las asignaciones de la semana por las enviadas. */
  async guardarSemana(data: GuardarSemanaDto, user: JwtPayload) {
    const semana = await this.prisma.semana.findUnique({ where: { id: data.semanaId } });
    if (!semana) {
      throw new NotFoundException('La semana no existe en el semanario.');
    }

    this.validarFechasDeLaSemana(semana.fechaInicio, data.asignaciones);
    await this.validarRecepcionistas(data.asignaciones.map((a) => a.recepcionistaId));
    this.validarSinDuplicados(data.asignaciones);

    const anteriores = await this.prisma.asignacion.findMany({
      where: { semanaId: semana.id }
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.asignacion.deleteMany({ where: { semanaId: semana.id } });

      if (data.asignaciones.length) {
        await tx.asignacion.createMany({
          data: data.asignaciones.map((a) => ({
            semanaId: semana.id,
            fecha: dateOnly(a.fecha),
            turno: a.turno,
            recepcionistaId: a.recepcionistaId,
            destacado: a.destacado ?? false,
            nota: a.nota?.trim() || null
          }))
        });
      }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'SEMANARIO',
      entityId: semana.id.toString(),
      description:
        `Reemplaza el horario de la semana del ${toIsoDate(semana.fechaInicio)} ` +
        `(${anteriores.length} → ${data.asignaciones.length} asignaciones)`,
      oldValue: anteriores,
      newValue: data.asignaciones
    });

    return { message: 'Semana actualizada.' };
  }

  /** Upsert de una sola celda: es la edición directa desde el grid. */
  async guardarCelda(data: CeldaDto, user: JwtPayload) {
    const semana = await this.prisma.semana.findUnique({ where: { id: data.semanaId } });
    if (!semana) {
      throw new NotFoundException('La semana no existe en el semanario.');
    }

    this.validarFechasDeLaSemana(semana.fechaInicio, [data]);
    await this.validarRecepcionistas([data.recepcionistaId]);

    const fecha = dateOnly(data.fecha);

    const asignacion = await this.prisma.asignacion.upsert({
      where: { semanaId_fecha_turno: { semanaId: semana.id, fecha, turno: data.turno } },
      create: {
        semanaId: semana.id,
        fecha,
        turno: data.turno,
        recepcionistaId: data.recepcionistaId,
        destacado: data.destacado ?? false,
        nota: data.nota?.trim() || null
      },
      update: {
        recepcionistaId: data.recepcionistaId,
        destacado: data.destacado ?? false,
        nota: data.nota?.trim() || null
      }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'SEMANARIO',
      entityId: asignacion.id.toString(),
      description: `Asigna el turno ${data.turno} del ${data.fecha} en el semanario`,
      newValue: asignacion
    });

    return asignacion;
  }

  /** Vacía una celda y deja el turno sin cubrir. */
  async borrarCelda(semanaId: number, fechaIso: string, turno: TurnoLabor, user: JwtPayload) {
    const eliminada = await this.prisma.asignacion.delete({
      where: { semanaId_fecha_turno: { semanaId, fecha: dateOnly(fechaIso), turno } }
    });

    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'SEMANARIO',
      entityId: eliminada.id.toString(),
      description: `Deja sin cubrir el turno ${turno} del ${fechaIso}`,
      oldValue: eliminada
    });

    return { message: 'Celda vaciada.' };
  }

  // ---------- Validaciones compartidas ----------

  /**
   * Toda fecha debe caer dentro de la semana que dice pertenecer. Sin esto un
   * cliente podría colar una asignación en otra semana y el grid la mostraría
   * en dos lugares a la vez.
   */
  private validarFechasDeLaSemana(
    fechaInicio: Date,
    asignaciones: Array<{ fecha: string }>
  ): void {
    for (const asignacion of asignaciones) {
      const dia = diffDays(fechaInicio, dateOnly(asignacion.fecha));
      if (dia < 0 || dia >= DIAS_POR_SEMANA) {
        throw new BadRequestException(
          `La fecha ${asignacion.fecha} no pertenece a la semana del ${toIsoDate(fechaInicio)}.`
        );
      }
    }
  }

  private async validarRecepcionistas(ids: number[]): Promise<void> {
    const distintas = [...new Set(ids)];
    if (!distintas.length) {
      return;
    }

    const encontradas = await this.prisma.recepcionista.findMany({
      where: { id: { in: distintas } },
      select: { id: true }
    });

    if (encontradas.length !== distintas.length) {
      const existentes = new Set(encontradas.map((r) => r.id));
      const faltantes = distintas.filter((id) => !existentes.has(id));
      throw new BadRequestException(
        `Estas recepcionistas no existen en el semanario: ${faltantes.join(', ')}.`
      );
    }
  }

  /** El índice único rechazaría el duplicado con un 500; aquí se explica en claro. */
  private validarSinDuplicados(asignaciones: Array<{ fecha: string; turno: TurnoLabor }>): void {
    const vistas = new Set<string>();
    for (const asignacion of asignaciones) {
      const clave = `${asignacion.fecha}|${asignacion.turno}`;
      if (vistas.has(clave)) {
        throw new BadRequestException(
          `El turno ${asignacion.turno} del ${asignacion.fecha} está asignado dos veces.`
        );
      }
      vistas.add(clave);
    }
  }
}