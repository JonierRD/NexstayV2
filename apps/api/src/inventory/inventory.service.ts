import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  async findAll() {
    return this.prisma.stock.findMany({
      include: {
        product: true
      },
      orderBy: { product: { category: 'asc' } }
    });
  }

  async findByCategory(category: string) {
    return this.prisma.stock.findMany({
      where: { product: { category: category.toUpperCase() } },
      include: {
        product: true
      },
      orderBy: { product: { name: 'asc' } }
    });
  }

  async findOne(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('El identificador del inventario es inválido');
    }

    const stock = await this.prisma.stock.findUnique({
      where: { id },
      include: { product: true }
    });
    if (!stock) {
      throw new NotFoundException('Item de inventario no encontrado');
    }
    return stock;
  }

  async createProduct(data: {
    name: string;
    price: number;
    category?: string;
    description?: string;
  }, user: JwtPayload) {
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        category: data.category?.toUpperCase() || 'TIENDA',
        description: data.description
      }
    });

    // Crear stock inicial para el producto
    await this.prisma.stock.create({
      data: {
        productId: product.id,
        quantity: 0,
        minStock: 0,
        status: 'NUEVO'
      }
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'CREATE' as any,
      entity: 'INVENTARIO',
      entityId: product.id.toString(),
      description: `Creó producto: ${data.name} (${data.category || 'TIENDA'})`,
      newValue: JSON.stringify(product)
    });

    return product;
  }

  async findSales() {
    return this.prisma.sale.findMany({
      include: {
        product: true,
        stay: {
          include: {
            client: true,
            room: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  async createSale(data: { stockId: number; stayId: number; quantity: number }, user: JwtPayload) {
    return this.createSalesBatch({
      items: [{ stockId: data.stockId, quantity: data.quantity }],
      stayId: data.stayId
    }, user);
  }

  async createSalesBatch(data: { items: Array<{ stockId: number; quantity: number }>; stayId?: number | null; customerName?: string | null }, user: JwtPayload) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException('Debe indicar al menos un producto para la venta');
    }

    const normalizedItems = data.items.map((item) => ({
      stockId: Number(item.stockId),
      quantity: Number(item.quantity)
    }));

    for (const item of normalizedItems) {
      if (!Number.isInteger(item.stockId) || item.stockId <= 0) {
        throw new BadRequestException('El identificador del producto es inválido');
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new BadRequestException('La cantidad de cada producto debe ser mayor que cero');
      }
    }

    const stayId = data.stayId !== undefined && data.stayId !== null ? Number(data.stayId) : null;

    if (stayId) {
      const stay = await this.prisma.stay.findUnique({
        where: { id: stayId },
        include: { client: true, room: true }
      });
      if (!stay || stay.status !== 'ACTIVA') {
        throw new NotFoundException('La habitación seleccionada no tiene un huésped activo');
      }
    }

    const createdSales = await this.prisma.$transaction(async (tx) => {
      const result: any[] = [];

      for (const item of normalizedItems) {
        const stock = await tx.stock.findUnique({
          where: { id: item.stockId },
          include: { product: true }
        });

        if (!stock) {
          throw new NotFoundException(`No se encontró el producto con stock ID ${item.stockId}`);
        }

        if (stock.quantity < item.quantity) {
          throw new BadRequestException(`No hay suficientes existencias de ${stock.product.name}. Disponibles: ${stock.quantity}`);
        }

        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: item.quantity } }
        });

        const sale = await tx.sale.create({
          data: {
            productId: stock.productId,
            stayId: stayId,
            date: new Date(),
            quantity: item.quantity,
            unitPrice: stock.product.price,
            saleType: stayId ? 'FIADO' : 'CONTADO'
          },
          include: {
            product: true,
            stay: {
              include: {
                client: true,
                room: true
              }
            }
          }
        });

        result.push(sale);
      }

      return result;
    });

    const firstSale = createdSales[0];
    await this.auditoria.log(user, {
      action: 'CREATE' as any,
      entity: 'VENTA',
      entityId: firstSale?.id?.toString() ?? 'batch',
      description: stayId
        ? `Registró venta a huésped ${stayId} con ${createdSales.length} producto(s)`
        : `Registró venta externa con ${createdSales.length} producto(s)`,
      newValue: JSON.stringify(createdSales)
    });

    return createdSales;
  }

  async updateProduct(id: number, data: {
    name?: string;
    price?: number;
    category?: string;
    description?: string;
  }, user: JwtPayload) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.category && { category: data.category.toUpperCase() })
      }
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'UPDATE' as any,
      entity: 'INVENTARIO',
      entityId: id.toString(),
      description: `Actualizó producto ID ${id}`,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(product)
    });

    return product;
  }

  async updateStock(id: number, data: {
    quantity?: number;
    minStock?: number;
    location?: string;
    status?: string;
  }, user: JwtPayload) {
    const existing = await this.findOne(id);

    const stock = await this.prisma.stock.update({
      where: { id },
      data
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'UPDATE' as any,
      entity: 'INVENTARIO',
      entityId: id.toString(),
      description: `Actualizó stock del producto ID ${id}`,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(stock)
    });

    return stock;
  }

  async remove(id: number, user: JwtPayload) {
    const stock = await this.findOne(id);

    // Eliminar primero el stock
    await this.prisma.stock.delete({ where: { id } });

    // Luego eliminar el producto
    await this.prisma.product.delete({ where: { id: stock.productId } });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'DELETE' as any,
      entity: 'INVENTARIO',
      entityId: id.toString(),
      description: `Eliminó producto ${stock.product.name}`,
      oldValue: JSON.stringify(stock)
    });

    return { message: 'Producto eliminado' };
  }

  async adjustQuantity(id: number, quantity: number, operation: 'ADD' | 'SUBTRACT', user: JwtPayload) {
    const existing = await this.findOne(id);

    const newQuantity = operation === 'ADD'
      ? existing.quantity + quantity
      : existing.quantity - quantity;

    if (newQuantity < 0) {
      throw new Error('La cantidad no puede ser negativa');
    }

    const stock = await this.prisma.stock.update({
      where: { id },
      data: { quantity: newQuantity }
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'UPDATE' as any,
      entity: 'INVENTARIO',
      entityId: id.toString(),
      description: `${operation === 'ADD' ? 'Agregó' : 'Restó'} ${quantity} unidades a ${existing.product.name}`,
      oldValue: JSON.stringify({ quantity: existing.quantity }),
      newValue: JSON.stringify({ quantity: newQuantity })
    });

    return stock;
  }
}
