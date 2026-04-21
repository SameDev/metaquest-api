import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { recordThrottleViolation } from '../guards/ip-block.guard';

@Catch(ThrottlerException)
export class ThrottleExceptionFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    recordThrottleViolation(req.ip ?? '');

    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: 429,
      message: 'Muitas requisições. Aguarde antes de tentar novamente.',
      retryAfter: 60,
    });
  }
}
