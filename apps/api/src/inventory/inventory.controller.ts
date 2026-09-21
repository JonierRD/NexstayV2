import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { InventoryService } from './inventory.service';
import type { CreateProductInput, UpdateProductInput, UpdateStockInput, SaleInput, SalesBatchInput } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    return this.service.findByCategory(category);
  }

  @Get('sales')
  async findSales() {
    return this.service.findSales();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id, 10));
  }

  @Post('product')
  async createProduct(@Body() data: CreateProductInput, @CurrentUser() user: JwtPayload) {
    return this.service.createProduct(data, user);
  }

  @Post('sale')
  async createSale(@Body() data: SaleInput, @CurrentUser() user: JwtPayload) {
    return this.service.createSale(data, user);
  }

  @Post('sales')
  async createSalesBatch(
    @Body() data: SalesBatchInput,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.createSalesBatch(data, user);
  }

  @Put('product/:id')
  async updateProduct(@Param('id') id: string, @Body() data: UpdateProductInput, @CurrentUser() user: JwtPayload) {
    return this.service.updateProduct(parseInt(id), data, user);
  }

  @Put('stock/:id')
  async updateStock(@Param('id') id: string, @Body() data: UpdateStockInput, @CurrentUser() user: JwtPayload) {
    return this.service.updateStock(parseInt(id), data, user);
  }

  @Post('stock/:id/adjust')
  async adjustQuantity(
    @Param('id') id: string,
    @Body() body: { quantity: number; operation: 'ADD' | 'SUBTRACT' },
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.adjustQuantity(parseInt(id), body.quantity, body.operation, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(parseInt(id), user);
  }
}
