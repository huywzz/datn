import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import clicolor from 'cli-color';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const startAt = process.hrtime();

    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const contentLength = response.get('content-length');
        const diff = process.hrtime(startAt);
        const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
        const origin = `${method} ${originalUrl} ${statusCode}`;

        // Get request payload
        let payload = '{}';
        if (request.body && Object.keys(request.body).length > 0) {
          payload = JSON.stringify(request.body);
        } else if (request.query && Object.keys(request.query).length > 0) {
          payload = JSON.stringify(request.query);
        }

        if (
          [200, 201, 202, 203, 204, 205, 206, 207, 208, 226].includes(
            statusCode,
          )
        ) {
          this.logger.log(
            ` ⛩ ${origin} ${responseTime}ms ${contentLength} - ${userAgent} ${ip} - ${payload}`,
          );
        } else {
          this.logger.log(
            `⛩ ${clicolor.red(origin)} ${responseTime}ms ${contentLength} - ${userAgent} ${ip} - ${payload}`,
          );
        }
      }),
    );
  }
}
