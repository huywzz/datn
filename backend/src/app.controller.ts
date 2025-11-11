import { BadRequestException, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    throw new BadRequestException('Hello World');
  }

  @Get('/error')
  getError(): string {
    throw new BadRequestException('Hello World');
  }
}
