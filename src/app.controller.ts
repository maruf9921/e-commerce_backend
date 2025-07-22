import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('photo')
  getPhoto(): string {
    return this.appService.getPhoto();
  }

  @Get('photo/:id')
  getPhotoById(@Param('id')  photoid:number): string {
    return this.appService.getPhotoById(photoid);
  }

}
