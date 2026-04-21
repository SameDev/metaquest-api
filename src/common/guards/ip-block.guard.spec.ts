import { ForbiddenException } from '@nestjs/common';
import { IpBlockGuard, recordThrottleViolation } from './ip-block.guard';
import { ExecutionContext } from '@nestjs/common';

function makeCtx(ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip }),
    }),
  } as unknown as ExecutionContext;
}

// reset module state between tests
beforeEach(() => {
  jest.resetModules();
});

describe('IpBlockGuard', () => {
  it('allows request from unknown IP', () => {
    const guard = new IpBlockGuard();
    expect(guard.canActivate(makeCtx('1.2.3.4'))).toBe(true);
  });

  it('blocks IP after 10 throttle violations', () => {
    const ip = '5.5.5.5';
    for (let i = 0; i < 10; i++) recordThrottleViolation(ip);

    const guard = new IpBlockGuard();
    expect(() => guard.canActivate(makeCtx(ip))).toThrow(ForbiddenException);
  });

  it('block message contains time remaining', () => {
    const ip = '6.6.6.6';
    for (let i = 0; i < 10; i++) recordThrottleViolation(ip);

    const guard = new IpBlockGuard();
    try {
      guard.canActivate(makeCtx(ip));
    } catch (e) {
      expect((e as ForbiddenException).message).toMatch(/min/);
    }
  });

  it('allows clean IP while another is blocked', () => {
    const badIp = '7.7.7.7';
    const goodIp = '8.8.8.8';
    for (let i = 0; i < 10; i++) recordThrottleViolation(badIp);

    const guard = new IpBlockGuard();
    expect(guard.canActivate(makeCtx(goodIp))).toBe(true);
  });
});
