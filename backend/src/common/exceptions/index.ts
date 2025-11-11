import { HttpException, HttpExceptionOptions } from '@nestjs/common';

export abstract class BaseHttpException extends HttpException {
  errorCode: string = 'E0000';

  constructor(
    message: string | Record<string, unknown> | Array<Record<string, unknown>>,
    status?: number,
    options?: HttpExceptionOptions,
  ) {
    super(message, status || 400, options);
  }

  getErrorCode() {
    return this.errorCode;
  }

  setErrorCode(errorCode: string) {
    this.errorCode = errorCode;
  }
}

export class BaseException extends BaseHttpException {
  constructor(
    message: string | Record<string, unknown> | Array<Record<string, unknown>>,
    options?: HttpExceptionOptions,
    statusCode?: number,
  ) {
    let dataMessage = message;
    if (Array.isArray(message)) {
      const compress = dataMessage =>
        dataMessage.reduce(
          (acc, cur) => {
            acc.message = [...(acc.message ?? []), cur.message];
            acc.type = [...(acc.type ?? []), cur.type];
            return acc;
          },
          { message: dataMessage.message, type: dataMessage.type },
        );
      dataMessage = compress(dataMessage);
    }
    super(dataMessage, statusCode, options);
  }
}
