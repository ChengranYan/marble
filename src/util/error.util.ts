import { StatusCode } from './statusCode.util';

export class ExtendableError extends Error {
  constructor(
    public name: string,
    message: string
  ) {
    super(message);
  }
}

export class HttpError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly status: StatusCode,
  ) {
    super('HttpError', message);
  }
}

export class ServerError extends ExtendableError {
  constructor(
    public readonly message: string,
    public readonly error: any,
  ) {
    super('ServerError', message);
  }
}

export const isHttpError = (error: Error): error is HttpError =>
  error.name === 'HttpError';

export const isServerError = (error: Error): error is ServerError =>
  error.name === 'ServerError';
