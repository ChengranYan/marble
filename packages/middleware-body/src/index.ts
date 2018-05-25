import {
  ContentType,
  Effect,
  HttpError,
  HttpRequest,
  HttpStatus
} from '@marblejs/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap, toArray } from 'rxjs/operators';

const fromReadableStream = (stream: HttpRequest): Observable<any> => {
  stream.pause();
  return new Observable(observer => {
    const next = chunk => observer.next(chunk);
    const complete = () => observer.complete();
    const error = err => observer.error(err);

    stream
      .on('data', next)
      .on('error', error)
      .on('end', complete)
      .resume();

    return () => {
      stream.removeListener('data', next);
      stream.removeListener('error', error);
      stream.removeListener('end', complete);
    };
  });
};

const getBody = (req: HttpRequest) =>
  fromReadableStream(req).pipe(
    toArray(),
    map(chunks => Buffer.concat(chunks)),
    map(buffer => buffer.toString()),
    map(body => {
      switch (req.headers['content-type']) {
        case ContentType.APPLICATION_JSON:
          return JSON.parse(body);
        default:
          return body;
      }
    })
  );

export const bodyParser$: Effect<HttpRequest> = (request$, response) =>
  request$.pipe(
    switchMap(
      req =>
        req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
          ? of(req).pipe(
              switchMap(getBody),
              tap(body => (req.body = body)),
              map(() => req),
              catchError(error =>
                throwError(
                  new HttpError(
                    'Request body parse error',
                    HttpStatus.BAD_REQUEST
                  )
                )
              )
            )
          : of(req)
    )
  );
