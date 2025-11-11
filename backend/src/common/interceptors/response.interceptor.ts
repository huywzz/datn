import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  message?: string;
  data?: T;
  success?: boolean;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        if (data?.success) {
          return data;
        } else {
          const message = data?.message || '';
          delete data?.message;
          return {
            success: true,
            data,
            message,
          };
        }
      }),
    );
  }
}
