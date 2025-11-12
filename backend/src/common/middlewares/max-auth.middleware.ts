import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

@Injectable()
export class MaxAuthMiddleware implements CanActivate {
  private readonly botToken = process.env.MAX_BOT_TOKEN!;
  private readonly ttlSeconds = 300; // 5 минут

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const raw = req.header('x-max-init-data');

    if (!raw) throw new UnauthorizedException('Missing init data');

    const data = this.parseInitData(raw);
    if (!this.checkTtl(data.auth_date)) {
      throw new ForbiddenException('Init data expired');
    }

    if (!this.verify(data)) {
      throw new UnauthorizedException('Invalid signature');
    }

    (req as any).user = data.user;
    return true;
  }

  private parseInitData(raw: string): any {
    const decoded = decodeURIComponent(raw);
    const parsed = querystring.parse(decoded);
    const data: any = {};
    for (const [key, value] of Object.entries(parsed)) {
      data[key] = key === 'user' ? JSON.parse(String(value)) : value;
    }
    return data;
  }

  private checkTtl(authDate: any): boolean {
    const ts = Number(authDate);
    if (!ts) return false;
    const now = Date.now();
    const delta = Math.abs(now - ts);
    return delta < this.ttlSeconds * 1000;
  }

  private verify(data: any): boolean {
    const { hash, ...rest } = data;
    const secretKey = crypto
      .createHmac('sha256', this.botToken)
      .update('WebAppData')
      .digest();
    const payload = Object.entries(rest)
      .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .sort()
      .join('\n');
    const check = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');
    return hash === check;
  }
}
