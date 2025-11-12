import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TestAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Подменяем пользователя на тестового автора
    (req as any).user = {
      id: 'test-author',
      first_name: 'Test',
      last_name: 'User',
    };
    next();
  }
}
