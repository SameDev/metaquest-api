import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

const BLOCK_THRESHOLD = 10;   // violations before block
const BLOCK_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface ViolationRecord {
  count: number;
  blockedUntil: number | null;
}

const violations = new Map<string, ViolationRecord>();

export function recordThrottleViolation(ip: string) {
  const rec = violations.get(ip) ?? { count: 0, blockedUntil: null };
  rec.count += 1;
  if (rec.count >= BLOCK_THRESHOLD) {
    rec.blockedUntil = Date.now() + BLOCK_TTL_MS;
    rec.count = 0;
  }
  violations.set(ip, rec);
}

@Injectable()
export class IpBlockGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ ip: string }>();
    const ip = req.ip;

    const rec = violations.get(ip);
    if (rec?.blockedUntil && Date.now() < rec.blockedUntil) {
      const minutesLeft = Math.ceil((rec.blockedUntil - Date.now()) / 60000);
      throw new ForbiddenException(`IP bloqueado. Tente novamente em ${minutesLeft} min.`);
    }

    if (rec?.blockedUntil && Date.now() >= rec.blockedUntil) {
      violations.delete(ip);
    }

    return true;
  }
}
