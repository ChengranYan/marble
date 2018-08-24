import { map } from 'rxjs/operators';
import { Effect, EffectResponse } from '../effects/effects.interface';
import { HttpStatus } from '../http.interface';
import { HttpError, isHttpError } from './error.model';

export type ThrownError = HttpError & Error;

export const errorEffectProvider = (customError$?: Effect<EffectResponse, ThrownError>) => !!customError$
  ? customError$
  : error$;

const getStatusCode = (error: ThrownError): HttpStatus => isHttpError(error)
  ? error.status
  : HttpStatus.INTERNAL_SERVER_ERROR;

const errorFactory = (message: string, status: HttpStatus, data?: any) => ({
  error: { status, message, data }
});

export const error$: Effect<EffectResponse, ThrownError> = (request$, _, error) => request$
  .pipe(
    map(() => {
      const { message, data } = error;
      const status = getStatusCode(error);
      const body = errorFactory(message, status, data);

      return { status, body };
    }),
  );
