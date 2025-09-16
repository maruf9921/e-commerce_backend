import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { Product } from '../product/entities/product.entity';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async addToCart(userId: number, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    // Check if product exists and is active
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true }
    });

    if (!product) {
      throw new NotFoundException('Product not found or not available');
    }

    // Check if item already exists in cart
    const existingCartItem = await this.cartRepository.findOne({
      where: { userId, productId, isActive: true }
    });

    if (existingCartItem) {
      // Update quantity
      existingCartItem.quantity += quantity;
      return await this.cartRepository.save(existingCartItem);
    }

    // Create new cart item
    const cartItem = this.cartRepository.create({
      userId,
      productId,
      quantity,
      price: product.price,
    });

    return await this.cartRepository.save(cartItem);
  }

  async getCartItems(userId: number): Promise<Cart[]> {
    return await this.cartRepository.find({
      where: { userId, isActive: true },
      relations: ['product', 'product.images', 'product.seller'],
      select: {
        id: true,
        quantity: true,
        price: true,
        createdAt: true,
        product: {
          id: true,
          name: true,
          description: true,
          price: true,
          category: true,
          isActive: true,
          images: {
            id: true,
            imageUrl: true,
            altText: true,
            isActive: true,
            sortOrder: true
          },
          seller: {
            id: true,
            username: true,
            phone: true
          }
        }
      },
      order: {
        createdAt: 'DESC',
        product: {
          images: {
            sortOrder: 'ASC'
          }
        }
      }
    });
  }

  async updateCartItem(userId: number, cartId: number, updateCartDto: UpdateCartDto): Promise<Cart> {
    const cartItem = await this.cartRepository.findOne({
      where: { id: cartId, userId, isActive: true }
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    cartItem.quantity = updateCartDto.quantity;
    return await this.cartRepository.save(cartItem);
  }

  async removeFromCart(userId: number, cartId: number): Promise<void> {
    const cartItem = await this.cartRepository.findOne({
      where: { id: cartId, userId, isActive: true }
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Delete item instead of setting isActive to false to avoid unique constraint violation
    await this.cartRepository.delete(cartItem.id);
  }

  async clearCart(userId: number): Promise<void> {
    // Delete active cart items instead of updating to avoid unique constraint violation
    await this.cartRepository.delete({
      userId, 
      isActive: true
    });
  }

  async getCartTotal(userId: number): Promise<number> {
    const cartItems = await this.cartRepository.find({
      where: { userId, isActive: true }
    });

    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}