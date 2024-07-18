import { Controller, Delete, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { TestingService } from './testing.service';

@Controller()
export class TestingController {
  constructor(private readonly appService: TestingService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Delete('testing/all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    await this.appService.deleteAll();
  }
}
