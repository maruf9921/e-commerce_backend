import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'you hit the API in the class AppServices';
  }

  getPhoto(): string {
    return 'All photos are here';
  }

  getPhotoById(photoid: number): string {
    return `You are looking for photo with id ${photoid}`;
  }
}
