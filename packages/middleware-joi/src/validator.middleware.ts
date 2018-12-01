import * as Joi from 'joi';
import './joi.types';
import { HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { from, of, throwError, Observable } from 'rxjs';
import { mergeMap, flatMap, catchError, mapTo, switchMap, toArray, map } from 'rxjs/operators';
import { Schema, SchemaValidator } from './validator.schema';

const validateSource = (rules: Map<string, any>, options: Joi.ValidationOptions) => (req: HttpRequest) =>
  from(rules.keys()).pipe(
    mergeMap(rule => of(req[rule]).pipe(
      flatMap(item =>
        from(Joi.validate(item || {}, rules.get(rule), options)).pipe(
          catchError((err: Joi.ValidationError) => {
            const message = err.details[0].message;
            return throwError(new HttpError(message, HttpStatus.BAD_REQUEST));
          })
        )
      ),
      map(result => (req[rule] = result))
    )),
    toArray(),
    mapTo(req)
  );

export const validator$ = <TBody = any, TParams = any, TQuery = any>
  (schema: Partial<Schema<TBody, TParams, TQuery>>, options: Joi.ValidationOptions = {}) =>
  (req$: Observable<HttpRequest>) => {
    const result = Joi.validate(schema, SchemaValidator);
    const rules = Object.keys(schema).reduce(
      (acc, value) => acc.set(value, Joi.compile(schema[value])),
      new Map()
    );

    if (result && result.error) {
      return throwError(result.error);
    }

    type ExtractedSchema = {
      [K1 in keyof typeof schema]:
        typeof schema[K1] extends undefined
          ? any
          : { [K2 in keyof typeof schema[K1]]: Joi.ExtractType<typeof schema[K1][K2]> }
    };

    type ExtractedBody = ExtractedSchema['body'];
    type ExtractedParams = ExtractedSchema['params'];
    type ExtractedQuery = ExtractedSchema['query'];

    return req$.pipe(
      switchMap(validateSource(rules, options)),
      map(req => req as HttpRequest<ExtractedBody, ExtractedParams, ExtractedQuery>),
    );
  };
