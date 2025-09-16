import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FinancialService } from './financial.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles.decorator/roles.decorator';
import { Role } from '../users/entities/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('financial')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  // ======= ADMIN ENDPOINTS =======

  // Get platform financial overview (Admin only)
  @Get('platform/overview')
  @Roles(Role.ADMIN)
  async getPlatformFinancialOverview() {
    return this.financialService.getPlatformFinancialOverview();
  }

  // Get revenue analytics (Admin only)
  @Get('platform/analytics')
  @Roles(Role.ADMIN)
  async getRevenueAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.financialService.getRevenueAnalytics(start, end);
  }

  // Get seller revenue comparison (Admin only)
  @Get('platform/seller-comparison')
  @Roles(Role.ADMIN)
  async getSellerRevenueComparison(
    @Query('period') period?: 'month' | 'quarter' | 'year'
  ) {
    return this.financialService.getSellerRevenueComparison(period);
  }

  // Process seller payout (Admin only)
  @Post('payout/process')
  @Roles(Role.ADMIN)
  @UsePipes(ValidationPipe)
  async processSellerPayout(
    @CurrentUser() admin: any,
    @Body() payoutData: {
      sellerId: number;
      recordIds: number[];
      payoutMethod: string;
      payoutReference?: string;
      notes?: string;
    }
  ) {
    return this.financialService.processSellerPayout(
      payoutData.sellerId,
      admin.id,
      payoutData
    );
  }

  // Get seller financial summary by ID (Admin only)
  @Get('seller/:sellerId/summary')
  @Roles(Role.ADMIN)
  async getSellerFinancialSummaryById(
    @Param('sellerId', ParseIntPipe) sellerId: number
  ) {
    return this.financialService.getSellerFinancialSummary(sellerId);
  }

  // Get seller payout history by ID (Admin only)
  @Get('seller/:sellerId/payouts')
  @Roles(Role.ADMIN)
  async getSellerPayoutHistoryById(
    @Param('sellerId', ParseIntPipe) sellerId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.financialService.getSellerPayoutHistory(
      sellerId,
      page || 1,
      limit || 20
    );
  }

  // ======= SELLER ENDPOINTS =======

  // Get own financial summary
  @Get('my-summary')
  @Roles(Role.SELLER)
  async getMyFinancialSummary(@CurrentUser() user: any) {
    return this.financialService.getSellerFinancialSummary(user.id);
  }

  // Get own payout history
  @Get('my-payouts')
  @Roles(Role.SELLER)
  async getMyPayoutHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.financialService.getSellerPayoutHistory(
      user.id,
      page || 1,
      limit || 20
    );
  }

  // ======= SHARED ENDPOINTS (Admin & Seller) =======

  // Get financial summary (Seller gets own, Admin can specify seller)
  @Get('summary')
  @Roles(Role.ADMIN, Role.SELLER)
  async getFinancialSummary(
    @CurrentUser() user: any,
    @Query('sellerId') sellerId?: number
  ) {
    if (user.role === Role.ADMIN && sellerId) {
      return this.financialService.getSellerFinancialSummary(sellerId);
    }
    return this.financialService.getSellerFinancialSummary(user.id);
  }

  // Get payout history (Seller gets own, Admin can specify seller)
  @Get('payouts')
  @Roles(Role.ADMIN, Role.SELLER)
  async getPayoutHistory(
    @CurrentUser() user: any,
    @Query('sellerId') sellerId?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const targetSellerId = user.role === Role.ADMIN && sellerId ? sellerId : user.id;
    return this.financialService.getSellerPayoutHistory(
      targetSellerId,
      page || 1,
      limit || 20
    );
  }
}