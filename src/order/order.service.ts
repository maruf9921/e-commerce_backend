import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { FinancialRecord } from './entities/financial-record.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../users/entities/unified-user.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrderStatus, PaymentStatus, FinancialStatus } from './entities/order.enums';
import { Role } from '../users/entities/role.enum';
import { NotificationService } from '../notification/notification.service';
import { MaillerService } from '../mailler/mailler.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    
    @InjectRepository(FinancialRecord)
    private financialRecordRepository: Repository<FinancialRecord>,
    
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    
    @InjectRepository(User)
    private userRepository: Repository<User>,
    
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    
    private dataSource: DataSource,
    
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
    
    private maillerService: MaillerService
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate user exists
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validate and prepare order items
      const orderItemsData = await this.validateAndPrepareOrderItems(
        createOrderDto.items, 
        queryRunner
      );

      // Calculate totals
      const subtotal = orderItemsData.reduce((sum, item) => sum + item.subtotal, 0);
      const shippingCost = this.calculateShippingCost(subtotal);
      const taxAmount = this.calculateTax(subtotal);
      const totalAmount = subtotal + shippingCost + taxAmount;

      // Create order
      const order = queryRunner.manager.create(Order, {
        userId,
        status: OrderStatus.PENDING,
        totalAmount,
        shippingCost,
        taxAmount,
        shippingAddress: createOrderDto.shippingAddress,
        notes: createOrderDto.notes
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items with financial records
      const orderItems: OrderItem[] = [];
      const financialRecords: FinancialRecord[] = [];

      for (const itemData of orderItemsData) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          ...itemData,
          orderId: savedOrder.id
        });
        
        const savedOrderItem = await queryRunner.manager.save(OrderItem, orderItem);
        orderItems.push(savedOrderItem);

        // Create financial record for seller
        const financialRecord = queryRunner.manager.create(FinancialRecord, 
          FinancialRecord.createFromOrderItem(savedOrderItem)
        );
        
        const savedFinancialRecord = await queryRunner.manager.save(FinancialRecord, financialRecord);
        financialRecords.push(savedFinancialRecord);

        // Update product stock
        await this.updateProductStock(itemData.productId, -itemData.quantity, queryRunner);
      }

      // Create payment record
      const payment = queryRunner.manager.create(Payment, {
        orderId: savedOrder.id,
        provider: createOrderDto.paymentMethod,
        amount: totalAmount,
        currency: 'BDT',
        status: createOrderDto.paymentMethod === 'cod' ? PaymentStatus.PENDING : PaymentStatus.PROCESSING,
        paymentMethod: {
          type: createOrderDto.paymentMethod
        }
      });

      await queryRunner.manager.save(Payment, payment);

      await queryRunner.commitTransaction();

      // Get the complete order with relations for notifications
      const completeOrder = await this.findOne(savedOrder.id);
      
      // Send order placed notifications
      try {
        await this.notificationService.notifyOrderPlaced(completeOrder);
      } catch (error) {
        console.warn('Failed to send order notification:', error);
        // Don't fail the order creation if notification fails
      }

      // Send email notifications
      try {
        await this.sendOrderEmails(completeOrder);
      } catch (error) {
        console.warn('Failed to send order emails:', error);
        // Don't fail the order creation if email fails
      }

      // Return order with relations
      return completeOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createOrderFromCart(userId: number): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get active cart items for the user
      const cartItems = await this.cartRepository.find({
        where: { userId, isActive: true },
        relations: ['product']
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Validate products and calculate total
      let totalAmount = 0;
      const orderItemsData = [];

      for (const cartItem of cartItems) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: cartItem.productId, isActive: true },
          relations: ['seller']
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${cartItem.productId} not found or unavailable`);
        }

        if (product.stockQuantity < cartItem.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}`);
        }

        const itemTotal = product.price * cartItem.quantity;
        totalAmount += itemTotal;

        orderItemsData.push({
          productId: product.id,
          quantity: cartItem.quantity,
          price: product.price,
          sellerId: product.userId
        });

        // Update product stock
        product.stockQuantity -= cartItem.quantity;
        await queryRunner.manager.save(Product, product);
      }

      // Create order
      const order = queryRunner.manager.create(Order, {
        userId,
        totalAmount,
        status: OrderStatus.PENDING
      });

      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items
      for (const itemData of orderItemsData) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: itemData.productId,
          quantity: itemData.quantity,
          price: itemData.price
        });

        const savedOrderItem = await queryRunner.manager.save(OrderItem, orderItem);

        // Create financial record for seller
        const financialRecord = queryRunner.manager.create(FinancialRecord, {
          orderItemId: savedOrderItem.id,
          sellerId: itemData.sellerId,
          amount: itemData.price * itemData.quantity,
          platformFee: (itemData.price * itemData.quantity) * 0.05, // 5% platform fee
          netAmount: (itemData.price * itemData.quantity) * 0.95,
          status: FinancialStatus.PENDING
        });

        await queryRunner.manager.save(FinancialRecord, financialRecord);
      }

      // Create payment record
      const payment = queryRunner.manager.create(Payment, {
        orderId: savedOrder.id,
        amount: totalAmount,
        status: PaymentStatus.PENDING,
        type: 'CART_ORDER'
      });

      await queryRunner.manager.save(Payment, payment);

      // Clear cart
      await queryRunner.manager.update(Cart, 
        { userId, isActive: true }, 
        { isActive: false }
      );

      await queryRunner.commitTransaction();

      // Get the complete order with relations
      const completeOrder = await this.findOne(savedOrder.id);
      
      // Send notifications
      try {
        await this.notificationService.notifyOrderPlaced(completeOrder);
      } catch (error) {
        console.warn('Failed to send order notification:', error);
      }

      try {
        await this.sendOrderEmails(completeOrder);
      } catch (error) {
        console.warn('Failed to send order emails:', error);
      }

      return completeOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(user: any, page = 1, limit = 10): Promise<{ orders: Order[]; total: number; totalPages: number }> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('orderItems.seller', 'seller')
      .leftJoinAndSelect('order.payment', 'payment')
      .orderBy('order.placedAt', 'DESC');

    // Role-based filtering
    if (user.role === Role.USER) {
      queryBuilder.where('order.userId = :userId', { userId: user.id });
    } else if (user.role === Role.SELLER) {
      queryBuilder.where('orderItems.sellerId = :sellerId', { sellerId: user.id });
    }
    // Admin can see all orders (no additional filter)

    const total = await queryBuilder.getCount();
    const orders = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      orders,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: number, user?: any): Promise<Order> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.buyer', 'buyer')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .leftJoinAndSelect('orderItems.seller', 'seller')
      .leftJoinAndSelect('orderItems.financialRecord', 'financialRecord')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('order.id = :id', { id });

    const order = await queryBuilder.getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Role-based access control
    if (user) {
      if (user.role === Role.USER && order.userId !== user.id) {
        throw new ForbiddenException('Access denied');
      } else if (user.role === Role.SELLER) {
        const hasSellerItems = order.orderItems.some(item => item.sellerId === user.id);
        if (!hasSellerItems) {
          throw new ForbiddenException('Access denied');
        }
      }
    }

    return order;
  }

  async updateStatus(id: number, updateDto: UpdateOrderStatusDto, user: any): Promise<Order> {
    const order = await this.findOne(id, user);
    const oldStatus = order.status;

    // Only sellers and admins can update order status
    if (user.role === Role.USER) {
      throw new ForbiddenException('Users cannot update order status');
    }

    // Sellers can only update orders that contain their items
    if (user.role === Role.SELLER) {
      const hasSellerItems = order.orderItems.some(item => item.sellerId === user.id);
      if (!hasSellerItems) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Update order status
    order.status = updateDto.status;
    if (updateDto.notes) {
      order.notes = updateDto.notes;
    }

    // Update financial records when order is delivered
    if (updateDto.status === OrderStatus.DELIVERED) {
      await this.clearFinancialRecords(order.id);
    }

    const updatedOrder = await this.orderRepository.save(order);

    // Send order status update notifications
    try {
      await this.notificationService.notifyOrderStatusUpdate(
        updatedOrder,
        oldStatus,
        updateDto.status
      );
    } catch (error) {
      console.warn('Failed to send order status update notification:', error);
      // Don't fail the update if notification fails
    }

    // Send email notification for status update
    try {
      await this.sendOrderStatusUpdateEmail(
        updatedOrder.id,
        updateDto.status,
        updateDto.trackingNumber
      );
    } catch (error) {
      console.warn('Failed to send order status update email:', error);
      // Don't fail the update if email fails
    }

    return updatedOrder;
  }

  async cancelOrder(id: number, user: any): Promise<Order> {
    const order = await this.findOne(id, user);

    // Only buyers can cancel their own orders
    if (user.role !== Role.USER || order.userId !== user.id) {
      throw new ForbiddenException('Only order owner can cancel the order');
    }

    // Can't cancel if already shipped or delivered
    if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.status)) {
      throw new BadRequestException('Cannot cancel order that has been shipped or delivered');
    }

    // Update order status
    order.status = OrderStatus.CANCELLED;

    // Restore product stock
    for (const item of order.orderItems) {
      await this.updateProductStock(item.productId, item.quantity);
    }

    // Cancel financial records
    await this.cancelFinancialRecords(order.id);

    return this.orderRepository.save(order);
  }

  async getSellerFinancials(sellerId: number): Promise<any> {
    const records = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .leftJoinAndSelect('fr.orderItem', 'orderItem')
      .leftJoinAndSelect('orderItem.order', 'order')
      .where('fr.sellerId = :sellerId', { sellerId })
      .getMany();

    const summary = {
      totalEarnings: 0,
      pendingAmount: 0,
      clearedAmount: 0,
      paidAmount: 0,
      totalOrders: 0,
      uniqueOrderIds: new Set(),
      records: records
    };

    records.forEach(record => {
      summary.totalEarnings += record.amount;
      summary.uniqueOrderIds.add(record.orderItem.orderId);

      switch (record.status) {
        case FinancialStatus.PENDING:
          summary.pendingAmount += record.netAmount;
          break;
        case FinancialStatus.CLEARED:
          summary.clearedAmount += record.netAmount;
          break;
        case FinancialStatus.PAID:
          summary.paidAmount += record.netAmount;
          break;
      }
    });

    summary.totalOrders = summary.uniqueOrderIds.size;
    delete summary.uniqueOrderIds; // Remove from final response

    return summary;
  }

  async getSellerOrders(sellerId: number, page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;
    
    const [orders, totalCount] = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('product.images', 'productImages')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.payment', 'payment')
      .where('product.userId = :sellerId', { sellerId })
      .select([
        'order.id',
        'order.totalAmount',
        'order.status',
        'order.createdAt',
        'order.updatedAt',
        'orderItem.id',
        'orderItem.quantity',
        'orderItem.price',
        'orderItem.productId',
        'product.id',
        'product.name',
        'product.price',
        'productImages.id',
        'productImages.imageUrl',
        'productImages.isActive',
        'productImages.sortOrder',
        'user.id',
        'user.username',
        'user.email',
        'user.phone',
        'payment.id',
        'payment.status',
        'payment.amount',
        'payment.paymentMethod'
      ])
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('productImages.sortOrder', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      orders,
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }

  // Private helper methods
  private async validateAndPrepareOrderItems(items: any[], queryRunner: QueryRunner): Promise<any[]> {
    const orderItemsData = [];

    for (const item of items) {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id: item.productId, isActive: true },
        relations: ['seller']
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      if (!product.seller?.isVerified) {
        throw new BadRequestException(`Product from unverified seller cannot be ordered`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      const orderItemData = OrderItem.createFromProduct(product, item.quantity);
      orderItemsData.push(orderItemData);
    }

    return orderItemsData;
  }

  private calculateShippingCost(subtotal: number): number {
    // Simple shipping cost calculation
    if (subtotal >= 1000) return 0; // Free shipping over 1000 BDT
    return 60; // Standard shipping cost
  }

  private calculateTax(subtotal: number): number {
    // Simple tax calculation (0% for now)
    return 0;
  }

  private async updateProductStock(productId: number, quantity: number, queryRunner?: QueryRunner): Promise<void> {
    const manager = queryRunner ? queryRunner.manager : this.productRepository.manager;
    
    await manager.increment(Product, { id: productId }, 'stockQuantity', quantity);
  }

  private async clearFinancialRecords(orderId: number): Promise<void> {
    await this.financialRecordRepository
      .createQueryBuilder()
      .update(FinancialRecord)
      .set({ 
        status: FinancialStatus.CLEARED,
        clearedAt: new Date()
      })
      .where('orderItemId IN (SELECT id FROM order_items WHERE orderId = :orderId)', { orderId })
      .execute();
  }

  private async cancelFinancialRecords(orderId: number): Promise<void> {
    await this.financialRecordRepository
      .createQueryBuilder()
      .update(FinancialRecord)
      .set({ status: FinancialStatus.CANCELLED })
      .where('orderItemId IN (SELECT id FROM order_items WHERE orderId = :orderId)', { orderId })
      .execute();
  }

  // Email notification methods
  private async sendOrderEmails(order: Order): Promise<void> {
    try {
      // Send order confirmation email to customer
      await this.sendOrderConfirmationEmail(order);
      
      // Send new order notifications to sellers
      await this.sendNewOrderEmailsToSellers(order);
    } catch (error) {
      console.error('Failed to send order emails:', error);
      throw error;
    }
  }

  private async sendOrderConfirmationEmail(order: Order): Promise<void> {
    try {
      const customer = order.buyer || await this.userRepository.findOne({ where: { id: order.userId } });
      if (!customer) return;

      // Format shipping address as string
      const shippingAddressStr = `${order.shippingAddress.fullName}, ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`;

      const orderData = {
        orderId: order.id.toString(),
        customerName: customer.username || customer.email,
        customerEmail: customer.email,
        items: order.orderItems.map(item => ({
          productName: item.product?.name || item.productNameSnapshot,
          quantity: item.quantity,
          price: item.unitPriceSnapshot,
          totalPrice: item.subtotal
        })),
        totalAmount: order.totalAmount,
        orderDate: order.placedAt.toLocaleDateString(),
        shippingAddress: shippingAddressStr
      };

      await this.maillerService.sendOrderConfirmationEmail(orderData);
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
    }
  }

  private async sendNewOrderEmailsToSellers(order: Order): Promise<void> {
    try {
      // Group order items by seller
      const sellerGroups = new Map<number, any[]>();
      
      for (const item of order.orderItems) {
        if (!item.sellerId) continue;
        
        if (!sellerGroups.has(item.sellerId)) {
          sellerGroups.set(item.sellerId, []);
        }
        sellerGroups.get(item.sellerId)!.push(item);
      }

      // Send email to each seller
      for (const [sellerId, items] of sellerGroups) {
        const seller = await this.userRepository.findOne({ where: { id: sellerId } });
        if (!seller) continue;

        const customer = order.buyer || await this.userRepository.findOne({ where: { id: order.userId } });
        if (!customer) continue;

        // Format shipping address as string
        const shippingAddressStr = `${order.shippingAddress.fullName}, ${order.shippingAddress.line1}${order.shippingAddress.line2 ? ', ' + order.shippingAddress.line2 : ''}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`;

        const sellerOrderData = {
          orderId: order.id.toString(),
          customerName: customer.username || customer.email,
          customerEmail: customer.email,
          sellerName: seller.username || seller.email,
          sellerEmail: seller.email,
          items: items.map(item => ({
            productName: item.product?.name || item.productNameSnapshot,
            quantity: item.quantity,
            price: item.unitPriceSnapshot,
            totalPrice: item.subtotal
          })),
          totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0),
          orderDate: order.placedAt.toLocaleDateString(),
          shippingAddress: shippingAddressStr
        };

        await this.maillerService.sendNewOrderNotificationToSeller(sellerOrderData);
      }
    } catch (error) {
      console.error('Failed to send seller notification emails:', error);
    }
  }

  // Method to send order status update emails
  async sendOrderStatusUpdateEmail(orderId: number, newStatus: OrderStatus, trackingNumber?: string): Promise<void> {
    try {
      const order = await this.findOne(orderId);
      if (!order) return;

      const customer = order.buyer || await this.userRepository.findOne({ where: { id: order.userId } });
      if (!customer) return;

      await this.maillerService.sendOrderStatusUpdateEmail(
        customer.email,
        customer.username || customer.email,
        order.id.toString(),
        newStatus,
        trackingNumber
      );
    } catch (error) {
      console.error('Failed to send order status update email:', error);
    }
  }
}