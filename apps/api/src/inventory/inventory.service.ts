import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateSalesBatchDto } from './dto/create-sales-batch.dto';

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

  async createProduct(data: CreateProductDto, user: JwtPayload) {
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
      action: 'CREATE',
      entity: 'INVENTARIO',
      entityId: product.id.toString(),
      description: `Creó producto: ${data.name} (${data.category || 'TIENDA'})`,
      newValue: product
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

  async createSale(data: CreateSaleDto, user: JwtPayload) {
    return this.createSalesBatch({
      items: [{ stockId: data.stockId, quantity: data.quantity }],
      stayId: data.stayId
    }, user);
  }

  async createSalesBatch(data: CreateSalesBatchDto, user: JwtPayload) {
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
    // El nombre del cliente solo aplica a ventas externas (sin hospedaje).
    const customerName =
      stayId === null && typeof data.customerName === 'string' && data.customerName.trim()
        ? data.customerName.trim()
        : null;

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
            saleType: (data.saleType as any) ?? (stayId ? 'FIADO' : 'CONTADO'),
            customerName
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
      action: 'CREATE',
      entity: 'VENTA',
      entityId: firstSale?.id?.toString() ?? 'batch',
      description: stayId
        ? `Registro venta a huesped ${stayId} con ${createdSales.length} producto(s)`
        : `Registro venta externa${customerName ? ` a ${customerName}` : ''} con ${createdSales.length} producto(s)`,
      newValue: createdSales
    });

    return createdSales;
  }

  async updateProduct(id: number, data: UpdateProductDto, user: JwtPayload) {
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
      action: 'UPDATE',
      entity: 'INVENTARIO',
      entityId: id.toString(),
      description: `Actualizó producto ID ${id}`,
      oldValue: existing,
      newValue: product
    });

    return product;
  }

  async updateStock(id: number, data: UpdateStockDto, user: JwtPayload) {
    const existing = await this.findOne(id);

    const stock = await this.prisma.stock.update({
      where: { id },
      data
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'INVENTARIO',
      entityId: id.toString(),
      description: `Actualizó stock del producto ID ${id}`,
      oldValue: existing,
      newValue: stock
    });

    return stock;
  }

  async remove(id: number, user: JwtPayload) {
    const stock = await this.findOne(id);

    // Un producto con ventas registradas no se puede borrar: la FK Sale.productId
    // lo impide. Se avisa antes de intentar, para no dejar stock a medias.
    const salesCount = await this.prisma.sale.count({
      where: { productId: stock.productId }
    });

    if (salesCount > 0) {
      throw new ConflictException(
        `No se puede eliminar "${stock.product.name}" porque tiene ${salesCount} venta(s) registrada(s).`
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.stock.delete({ where: { id } });
        await tx.product.delete({ where: { id: stock.productId } });
      });
    } catch {
      throw new ConflictException(
        'No se pudo eliminar el producto porque tiene registros relacionados.'
      );
    }

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'INVENTARIO',
      entityId: id.toString(),
      description: `Eliminó producto ${stock.product.name}`,
      oldValue: stock
    });

    return { message: 'Producto eliminado' };
  }

  async adjustQuantity(id: number, quantity: number, operation: 'ADD' | 'SUBTRACT', user: JwtPayload) {
    const existing = await this.findOne(id);

    const newQuantity = operation === 'ADD'
      ? existing.quantity + quantity
      : existing.quantity - quantity;

    if (newQuantity < 0) {
      throw new BadRequestException('La cantidad no puede ser negativa');
    }

    const stock = await this.prisma.stock.update({
      where: { id },
      data: { quantity: newQuantity }
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'INVENTARIO',
      entityId: id.toString(),
      description: `${operation === 'ADD' ? 'Agregó' : 'Restó'} ${quantity} unidades a ${existing.product.name}`,
      oldValue: { quantity: existing.quantity },
      newValue: { quantity: newQuantity }
    });

    return stock;
  }
}
