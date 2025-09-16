import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { UsersModule } from "../users/users.module";
import { OrderModule } from "../order/order.module";

@Module({  
    imports: [UsersModule, OrderModule],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}