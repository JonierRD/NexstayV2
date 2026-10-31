import { describe, it } from 'vitest';

// Responsable: Legarda
// Objetivo: flujo completo de check-in (integracion de UI).
//
// Estrategia recomendada: mockear la capa API y renderizar <RecepcionPage user={...} />.
//   vi.mock('@/lib/api', ...) // habitacionesRequest, clienteByCcRequest, clientesRequest, checkinRequest
//   vi.mock('@/lib/api/reservations', ...) // reservationsRequest
// Usa los fixtures: makeUser, makeRoom, makeClient.
//
// Flujo a recorrer:
//   1. Buscar cedula (encontrada o cliente nuevo).
//   2. Continuar a seleccion de habitacion.
//   3. Elegir una habitacion DISPONIBLE.
//   4. Confirmar y verificar la pantalla de exito.
//   5. Verificar que checkinRequest recibio roomNumber, acType y cc correctos.

describe('I2 - Flujo de check-in', () => {
  it.todo('un cliente existente completa el check-in y ve la pantalla de exito');
  it.todo('un cliente nuevo completa el check-in con los datos del formulario');
  it.todo('no permite continuar sin nombre y apellido');
  it.todo('no permite confirmar sin habitacion seleccionada');
  it.todo('si la API falla, muestra el error y no avanza al exito');
});
