import { IsInt, Min, ValidationOptions } from 'class-validator';

/**
 * Los precios del hotel se manejan en pesos enteros, sin centavos.
 * Centraliza la regla para que producto, habitacion y lavanderia no se
 * desvien entre si. Los montos ya calculados (total de un hospedaje, valor de
 * una venta) si pueden traer decimales y por eso no usan este decorador.
 */
export function IsWholePesos(options?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    IsInt({ message: 'El monto debe ser un numero entero de pesos, sin centavos.', ...options })(
      object,
      propertyName
    );
    Min(0, { message: 'El monto no puede ser negativo.', ...options })(object, propertyName);
  };
}