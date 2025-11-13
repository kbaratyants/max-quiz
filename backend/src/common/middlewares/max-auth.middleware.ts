import { Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import * as querystring from 'querystring';

@Injectable()
export class MaxAuthMiddleware {
  private readonly botToken =
    process.env.MAX_DEV_TOKEN;

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

      // Логирование для отладки (только в development)
      if (process.env.NODE_ENV === 'development') {
        console.log('[MaxAuth] Parsed data:', {
          keys: Object.keys(data),
          hasHash: !!data.hash,
          hasUser: !!data.user,
          hash: data.hash?.substring(0, 20) + '...',
        });
      }

      const isValid = this.verify(data);
      if (!isValid) {
        if (process.env.NODE_ENV === 'development') {
          const debugInfo = this.getDebugInfo(data);
          console.error('[MaxAuth] Signature verification failed:');
          console.error('Raw initData:', raw);
          console.error('Parsed data:', JSON.stringify(data, null, 2));
          console.error('Debug info:', JSON.stringify(debugInfo, null, 2));
        }
        return res.status(401).json({ message: 'Invalid signature' });
      }

      (req as any).user = data.user;
      next();
    } catch (err: any) {
      console.error('[MaxAuth] Error:', err.message, err.stack);
      return res.status(400).json({ message: 'Invalid init data format' });
    }
  }

  private parseInitData(raw: string): any {
    let decoded = raw;
    try {
      if (raw.includes('%')) {
        decoded = decodeURIComponent(raw);
      }
    } catch {
      decoded = raw;
    }

    const parsed = querystring.parse(decoded);
    const data: any = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (key === 'user' && value) {
        try {
          data[key] = JSON.parse(String(value));
        } catch {
          data[key] = value;
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  private verify(data: any): boolean {
    const { hash, ...rest } = data;
    if (!hash) return false;

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest(); // ключ — байты, не hex

    const payload = Object.entries(rest)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) =>
        typeof v === 'object' && v !== null
          ? `${k}=${JSON.stringify(v)}`
          : `${k}=${v}`
      )
      .join('\n');

    const check = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');

    return hash === check;
  }

  private getDebugInfo(data: any): any {
    const { hash, ...rest } = data;

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();

    const entries = Object.entries(rest)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        const value =
          typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
        return { key: k, value, stringified: `${k}=${value}` };
      });

    const payload = entries.map((e) => e.stringified).join('\n');
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');

    return {
      receivedHash: data.hash,
      computedHash,
      match: data.hash === computedHash,
      payloadString: payload,
    };
  }
}
