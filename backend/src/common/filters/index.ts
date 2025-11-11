import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
  BadRequestException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseHttpException } from '../exceptions';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    if (exception instanceof BadRequestException) {
      const responseData = exception.getResponse();
      return response.status(status).json({
        success: false,
        message: Array.isArray(responseData['message']) ? responseData['message'].join('\n') : responseData['message'],
        data: null,
      });
    } else if (exception instanceof BaseHttpException) {
      let responseData = exception.getResponse();
      responseData = responseData['response'] || responseData;
      return response.status(400).json({
        success: false,
        message:
          (Array.isArray(responseData['message']) ? responseData['message'].join('\n') : responseData['message']) ||
          responseData,
        type: responseData['type'],
        data: exception?.cause,
      });
    } else if (exception instanceof UnauthorizedException) {
      return response.status(401).json({
        success: false,
        message: exception.message,
        data: null,
      });
    } else if (exception instanceof ForbiddenException) {
      return response.status(403).json({
        success: false,
        message: exception.message,
        data: null,
      });
    } else {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: exception.message,
        error: exception.name,
      });
    }
  }
}
