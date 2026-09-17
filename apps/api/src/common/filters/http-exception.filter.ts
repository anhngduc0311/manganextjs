import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === "object" && (res as any).message ? (res as any).message : res;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception at ${request.method} ${request.url}: ${exception.stack}`);
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      error: Array.isArray(message) ? message : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
