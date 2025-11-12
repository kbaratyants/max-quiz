import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class MaxAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const initDataHeader = req.header('x-max-init-data');

    // Режим тестирования без авторизации
    const isDevMode = process.env.NODE_ENV !== 'production';
    const testUserId = 'test-user-id';
    const testFirstName = 'Test';

    if (!initDataHeader) {
      if (isDevMode) {
        // Подставляем тестового пользователя
        (req as any).user = { id: testUserId, first_name: testFirstName };
        return next();
      }
      throw new UnauthorizedException('Missing MAX init data');
    }

    let data: any;
    try {
      data = JSON.parse(initDataHeader);
    } catch {
      throw new UnauthorizedException('Invalid init data format');
    }

    if (!this.verifyMaxData(data)) {
      if (isDevMode) {
        (req as any).user = { id: testUserId, first_name: testFirstName };
        return next();
      }
      throw new UnauthorizedException('Invalid MAX signature');
    }

    (req as any).user = data.user;
    next();
  }

  private verifyMaxData(data: any): boolean {
    const token = process.env.MAX_DEV_TOKEN;
    const hash = data.hash;
    if (!token || !hash) return false;

    const secretKey = crypto.createHash('sha256').update(token).digest();

    const payload = Object.entries(data)
      .filter(([key]) => key !== 'hash' && key !== 'signature')
      .map(
        ([key, value]) =>
          `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`,
      )
      .sort()
      .join('\n');

    const hmac = crypto.createHmac('sha256', secretKey);
    const computedHash = hmac.update(payload).digest('hex');

    return computedHash === hash;
  }
}
