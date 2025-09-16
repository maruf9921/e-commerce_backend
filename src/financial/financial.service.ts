import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, In } from 'typeorm';
import { FinancialRecord } from '../order/entities/financial-record.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { Payment } from '../order/entities/payment.entity';
import { User } from '../users/entities/unified-user.entity';
import { FinancialStatus, PaymentStatus, OrderStatus } from '../order/entities/order.enums';
import { Role } from '../users/entities/role.enum';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(FinancialRecord)
    private financialRecordRepository: Repository<FinancialRecord>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ======= PLATFORM FINANCIAL OVERVIEW =======

  // Get platform financial overview (Admin only)
  async getPlatformFinancialOverview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Total platform metrics
    const totalRevenue = await this.getTotalPlatformRevenue();
    const totalPlatformFees = await this.getTotalPlatformFees();
    const totalPayouts = await this.getTotalPayouts();
    const pendingPayouts = await this.getPendingPayouts();

    // Monthly metrics
    const monthlyRevenue = await this.getPlatformRevenueForPeriod(monthStart, now);
    const monthlyPlatformFees = await this.getPlatformFeesForPeriod(monthStart, now);
    const monthlyPayouts = await this.getPayoutsForPeriod(monthStart, now);

    // Yearly metrics
    const yearlyRevenue = await this.getPlatformRevenueForPeriod(yearStart, now);
    const yearlyPlatformFees = await this.getPlatformFeesForPeriod(yearStart, now);

    // Active sellers with earnings
    const activeSellersCount = await this.getActiveSellerCount();
    const topSellersByRevenue = await this.getTopSellersByRevenue(10);

    return {
      overview: {
        totalRevenue,
        totalPlatformFees,
        totalPayouts,
        pendingPayouts,
        netPlatformEarnings: totalPlatformFees,
        activeSellersCount
      },
      monthly: {
        revenue: monthlyRevenue,
        platformFees: monthlyPlatformFees,
        payouts: monthlyPayouts
      },
      yearly: {
        revenue: yearlyRevenue,
        platformFees: yearlyPlatformFees
      },
      topSellers: topSellersByRevenue
    };
  }

  // ======= SELLER FINANCIAL MANAGEMENT =======

  // Get seller financial summary
  async getSellerFinancialSummary(sellerId: number) {
    const seller = await this.userRepository.findOne({
      where: { id: sellerId, role: Role.SELLER }
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    const financialRecords = await this.financialRecordRepository.find({
      where: { sellerId },
      relations: ['orderItem']
    });

    const totalEarnings = financialRecords.reduce((sum, record) => sum + record.amount, 0);
    const pendingAmount = financialRecords
      .filter(r => r.status === FinancialStatus.PENDING)
      .reduce((sum, r) => sum + r.amount, 0);
    const clearedAmount = financialRecords
      .filter(r => r.status === FinancialStatus.CLEARED)
      .reduce((sum, r) => sum + r.amount, 0);
    const paidAmount = financialRecords
      .filter(r => r.status === FinancialStatus.PAID)
      .reduce((sum, r) => sum + r.amount, 0);

    const totalPlatformFees = financialRecords.reduce((sum, record) => sum + (record.platformFee || 0), 0);
    const totalProcessingFees = financialRecords.reduce((sum, record) => sum + (record.processingFee || 0), 0);
    const netEarnings = totalEarnings - totalPlatformFees - totalProcessingFees;

    // Get monthly breakdown for current year
    const monthlyBreakdown = await this.getSellerMonthlyBreakdown(sellerId);

    return {
      seller: {
        id: seller.id,
        username: seller.username,
        fullName: seller.fullName,
        isVerified: seller.isVerified
      },
      summary: {
        totalEarnings,
        pendingAmount,
        clearedAmount,
        paidAmount,
        totalPlatformFees,
        totalProcessingFees,
        netEarnings,
        totalTransactions: financialRecords.length
      },
      monthlyBreakdown
    };
  }

  // Process seller payout
  async processSellerPayout(sellerId: number, adminId: number, payoutData: {
    recordIds: number[];
    payoutMethod: string;
    payoutReference?: string;
    notes?: string;
  }) {
    const { recordIds, payoutMethod, payoutReference, notes } = payoutData;

    // Verify all records belong to seller and are in CLEARED status
    const records = await this.financialRecordRepository.find({
      where: { id: In(recordIds), sellerId, status: FinancialStatus.CLEARED }
    });

    if (records.length !== recordIds.length) {
      throw new ConflictException('Some records are not eligible for payout');
    }

    const totalPayoutAmount = records.reduce((sum, record) => sum + record.netAmount, 0);

    // Update records to PAID status
    await this.financialRecordRepository.update(
      { id: In(recordIds) },
      {
        status: FinancialStatus.PAID,
        payoutId: payoutReference,
        paidAt: new Date()
      }
    );

    return {
      message: 'Payout processed successfully',
      sellerId,
      totalAmount: totalPayoutAmount,
      recordsCount: records.length,
      payoutReference,
      processedBy: adminId
    };
  }

  // Get seller payout history
  async getSellerPayoutHistory(sellerId: number, page: number = 1, limit: number = 20) {
    const [records, total] = await this.financialRecordRepository.findAndCount({
      where: { 
        sellerId,
        status: FinancialStatus.PAID
      },
      relations: ['orderItem'],
      order: { paidAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ======= FINANCIAL ANALYTICS =======

  // Get revenue analytics for platform
  async getRevenueAnalytics(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const end = endDate || new Date();

    const payments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(start, end)
      },
      relations: ['order']
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const transactionCount = payments.length;
    const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // Daily breakdown
    const dailyBreakdown = this.getDailyBreakdown(payments, start, end);

    // Payment method breakdown
    const paymentMethodBreakdown = this.getPaymentMethodBreakdown(payments);

    return {
      period: { startDate: start, endDate: end },
      summary: {
        totalRevenue,
        transactionCount,
        averageTransactionValue
      },
      dailyBreakdown,
      paymentMethodBreakdown
    };
  }

  // Get seller revenue comparison
  async getSellerRevenueComparison(period: 'month' | 'quarter' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const sellerRevenues = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .leftJoin('fr.seller', 'seller')
      .select([
        'fr.sellerId as sellerId',
        'seller.username as username',
        'seller.fullName as fullName',
        'SUM(fr.amount) as totalRevenue',
        'SUM(fr.platformFee) as totalPlatformFees',
        'SUM(fr.netAmount) as netRevenue',
        'COUNT(fr.id) as transactionCount'
      ])
      .where('fr.createdAt >= :startDate', { startDate })
      .groupBy('fr.sellerId, seller.username, seller.fullName')
      .orderBy('totalRevenue', 'DESC')
      .getRawMany();

    return {
      period,
      startDate,
      endDate: now,
      sellerRevenues: sellerRevenues.map(seller => ({
        sellerId: seller.sellerId,
        username: seller.username,
        fullName: seller.fullName,
        totalRevenue: parseFloat(seller.totalRevenue) || 0,
        totalPlatformFees: parseFloat(seller.totalPlatformFees) || 0,
        netRevenue: parseFloat(seller.netRevenue) || 0,
        transactionCount: parseInt(seller.transactionCount) || 0
      }))
    };
  }

  // ======= PRIVATE HELPER METHODS =======

  private async getTotalPlatformRevenue(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getTotalPlatformFees(): Promise<number> {
    const result = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .select('SUM(fr.platformFee)', 'total')
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getTotalPayouts(): Promise<number> {
    const result = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .select('SUM(fr.netAmount)', 'total')
      .where('fr.status = :status', { status: FinancialStatus.PAID })
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getPendingPayouts(): Promise<number> {
    const result = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .select('SUM(fr.netAmount)', 'total')
      .where('fr.status = :status', { status: FinancialStatus.CLEARED })
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getPlatformRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('payment.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getPlatformFeesForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .select('SUM(fr.platformFee)', 'total')
      .where('fr.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getPayoutsForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .select('SUM(fr.netAmount)', 'total')
      .where('fr.status = :status', { status: FinancialStatus.PAID })
      .andWhere('fr.payoutDate BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();
    return parseFloat(result.total) || 0;
  }

  private async getActiveSellerCount(): Promise<number> {
    const result = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .select('COUNT(DISTINCT fr.sellerId)', 'count')
      .getRawOne();
    return parseInt(result.count) || 0;
  }

  private async getTopSellersByRevenue(limit: number = 10) {
    return await this.financialRecordRepository
      .createQueryBuilder('fr')
      .leftJoin('fr.seller', 'seller')
      .select([
        'fr.sellerId as sellerId',
        'seller.username as username',
        'seller.fullName as fullName',
        'SUM(fr.amount) as totalRevenue',
        'COUNT(fr.id) as transactionCount'
      ])
      .groupBy('fr.sellerId, seller.username, seller.fullName')
      .orderBy('totalRevenue', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  private async getSellerMonthlyBreakdown(sellerId: number) {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const monthlyData = await this.financialRecordRepository
      .createQueryBuilder('fr')
      .select([
        'EXTRACT(MONTH FROM fr.createdAt) as month',
        'SUM(fr.amount) as totalAmount',
        'SUM(fr.platformFee) as totalPlatformFees',
        'SUM(fr.netAmount) as netAmount',
        'COUNT(fr.id) as transactionCount'
      ])
      .where('fr.sellerId = :sellerId', { sellerId })
      .andWhere('fr.createdAt >= :yearStart', { yearStart })
      .groupBy('EXTRACT(MONTH FROM fr.createdAt)')
      .orderBy('month', 'ASC')
      .getRawMany();

    return monthlyData.map(data => ({
      month: parseInt(data.month),
      totalAmount: parseFloat(data.totalAmount) || 0,
      totalPlatformFees: parseFloat(data.totalPlatformFees) || 0,
      netAmount: parseFloat(data.netAmount) || 0,
      transactionCount: parseInt(data.transactionCount) || 0
    }));
  }

  private getDailyBreakdown(payments: Payment[], startDate: Date, endDate: Date) {
    const dailyData = new Map<string, { revenue: number, count: number }>();
    
    // Initialize all days in range with zero values
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyData.set(dateKey, { revenue: 0, count: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate with actual data
    payments.forEach(payment => {
      const dateKey = payment.createdAt.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { revenue: 0, count: 0 };
      dailyData.set(dateKey, {
        revenue: existing.revenue + payment.amount,
        count: existing.count + 1
      });
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactionCount: data.count
    }));
  }

  private getPaymentMethodBreakdown(payments: Payment[]) {
    const methodData = new Map<string, { revenue: number, count: number }>();

    payments.forEach(payment => {
      const method = payment.paymentMethod?.type || 'Unknown';
      const existing = methodData.get(method) || { revenue: 0, count: 0 };
      methodData.set(method, {
        revenue: existing.revenue + payment.amount,
        count: existing.count + 1
      });
    });

    return Array.from(methodData.entries()).map(([method, data]) => ({
      paymentMethod: method,
      revenue: data.revenue,
      transactionCount: data.count,
      percentage: (data.revenue / payments.reduce((sum, p) => sum + p.amount, 0)) * 100
    }));
  }
}