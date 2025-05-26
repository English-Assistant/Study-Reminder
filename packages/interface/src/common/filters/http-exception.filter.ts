import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    console.log(exception);

    let responseMessage: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        responseMessage = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, unknown>;

        if (
          typeof resObj.message === 'string' ||
          Array.isArray(resObj.message)
        ) {
          responseMessage = resObj.message;
        } else if (typeof resObj.error === 'string') {
          responseMessage = resObj.error;
        } else {
          responseMessage = 'Error processing request';
        }
      }
    } else {
      // 非 HttpException 的 fallback
      responseMessage = 'Internal server error';
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      responseMessage = 'Internal server error';
    }

    const responseBody = {
      status: httpStatus,
      message: responseMessage,
      data: null,
      // timestamp: new Date().toISOString(),
      // path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(response, responseBody, httpStatus);
  }
}
