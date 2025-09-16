import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import { Cart } from './entities/cart.entity';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  @UsePipes(new ValidationPipe())
  async addToCart(
    @CurrentUser() user: any,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<Cart> {
    return await this.cartService.addToCart(user.id, addToCartDto);
  }

  @Get('items')
  async getCartItems(@CurrentUser() user: any): Promise<Cart[]> {
    return await this.cartService.getCartItems(user.id);
  }

  @Put('items/:id')
  @UsePipes(new ValidationPipe())
  async updateCartItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) cartId: number,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<Cart> {
    return await this.cartService.updateCartItem(user.id, cartId, updateCartDto);
  }

  @Delete('items/:id')
  async removeFromCart(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) cartId: number,
  ): Promise<{ message: string }> {
    await this.cartService.removeFromCart(user.id, cartId);
    return { message: 'Item removed from cart successfully' };
  }

  @Delete('clear')
  async clearCart(@CurrentUser() user: any): Promise<{ message: string }> {
    await this.cartService.clearCart(user.id);
    return { message: 'Cart cleared successfully' };
  }

  @Get('total')
  async getCartTotal(@CurrentUser() user: any): Promise<{ total: number }> {
    const total = await this.cartService.getCartTotal(user.id);
    return { total };
  }
}