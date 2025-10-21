import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import clicolor from 'cli-color';

export const loggerMiddleware = (request: Request, response: Response, next: NextFunction): void => {
  const startAt = process.hrtime();
  const { ip, method, originalUrl } = request;
  const userAgent = request.get('user-agent') || '';
  const logger = new Logger();
  response.on('finish', () => {
    const { statusCode } = response;
    const contentLength = response.get('content-length');
    const diff = process.hrtime(startAt);
    const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
    const origin = `${method} ${originalUrl} ${statusCode}`;
    if ([200, 201, 202, 203, 204, 205, 206, 207, 208, 226].includes(statusCode)) {
      logger.log(
        ` ⛩ ${origin} ${responseTime}ms ${contentLength} - ${userAgent} ${ip} - ${JSON.stringify(request.body)}`,
      );
    } else {
      logger.log(
        `⛩ ${clicolor.red(origin)} ${responseTime}ms ${contentLength} - ${userAgent} ${ip} - ${JSON.stringify(
          request.body,
        )}`,
      );
    }
  });

  next();
};
