import { Controller, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('generate')
  async generate() {
    const result = await this.seedService.generateTestData();
    return {
      status: 'ok',
      message: 'Test data generated',
      data: result,
    };
  }
}
