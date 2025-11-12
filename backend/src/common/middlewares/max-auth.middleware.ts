import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

@Injectable()
export class MaxAuthMiddleware {
  private readonly botToken = process.env.MAX_BOT_TOKEN || process.env.BOT_TOKEN;
  private readonly ttlSeconds = 300; // 5 минут

  use(req: Request, res: Response, next: NextFunction) {
    const raw = req.header('x-max-init-data');
    if (!raw) {
      return res.status(401).json({ message: 'Missing init data' });
    }

    if (!this.botToken) {
      return res.status(500).json({ message: 'Bot token not configured' });
    }

    try {
      const data = this.parseInitData(raw);

      if (!this.checkTtl(data.auth_date)) {
        return res.status(403).json({ message: 'Init data expired' });
      }

      if (!this.verify(data)) {
        return res.status(401).json({ message: 'Invalid signature' });
      }

      // Сохраняем пользователя в req
      (req as any).user = data.user;

      next();
    } catch (err) {
      return res.status(400).json({ message: 'Invalid init data format' });
    }
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
