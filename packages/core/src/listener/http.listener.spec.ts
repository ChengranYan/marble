import { IncomingMessage, OutgoingMessage } from 'http';
import { of, throwError } from 'rxjs';
import { mapTo, switchMap } from 'rxjs/operators';
import { httpListener } from './http.listener';
import { EffectFactory } from '../effects/effects.factory';
import { HttpMiddlewareEffect } from '../effects/http-effects.interface';
import { createContext } from '../context/context.factory';

describe('Http listener', () => {
  let effectsCombiner;
  let responseHandler;
  let routerFactory;
  let routerResolver;

  const effect$ = EffectFactory
    .matchPath('/')
    .matchType('GET')
    .use(req$ => req$.pipe(mapTo( {} )));

  const middleware$: HttpMiddlewareEffect = req$ => req$;

  beforeEach(() => {
    jest.unmock('../error/error.effect.ts');
    jest.unmock('../effects/effects.combiner.ts');
    jest.unmock('../response/response.handler.ts');
    jest.unmock('../router/router.factory.ts');
    jest.unmock('../router/router.resolver.ts');

    effectsCombiner = require('../effects/effects.combiner.ts');
    responseHandler = require('../response/response.handler.ts');
    routerFactory = require('../router/router.factory.ts');
    routerResolver = require('../router/router.resolver.ts');
  });

  test('#httpListener handles received HttpRequest', done => {
    // given
    const req = {} as IncomingMessage;
    const res = {} as OutgoingMessage;
    const context = createContext();

    // when
    effectsCombiner.combineMiddlewares = jest.fn(() => () => of(req));
    routerFactory.factorizeRouting = jest.fn(() => []);
    routerResolver.resolveRouting = jest.fn(() => () => () => of({ body: 'test' }));
    responseHandler.handleResponse = jest.fn(() => () => () => undefined);

    httpListener({
      middlewares: [middleware$],
      effects: [effect$],
    }).run(context)(req, res);

    // then
    setTimeout(() => {
      expect(effectsCombiner.combineMiddlewares).toHaveBeenCalledWith(middleware$);
      expect(routerFactory.factorizeRouting).toHaveBeenCalledWith([effect$]);
      expect(routerResolver.resolveRouting).toHaveBeenCalled();
      expect(responseHandler.handleResponse).toHaveBeenCalled();
      done();
    }, 0);
  });

  test('#httpListener allows empty middlewares', () => {
    // given
    const req = {} as IncomingMessage;
    const context = createContext();

    // when
    effectsCombiner.combineMiddlewares = jest.fn(() => () => of(req));
    routerFactory.factorizeRouting = jest.fn(() => []);

    httpListener({
      effects: [effect$],
    }).run(context);

    // then
    expect(effectsCombiner.combineMiddlewares).toHaveBeenCalledWith(...[]);
  });

  test('#httpListener catches error', done => {
    // given
    const error = new Error('test');
    const req = {} as IncomingMessage;
    const res = {} as OutgoingMessage;
    const context = createContext();
    const error$ = jest.fn(() => of({ body: 'error' }));

    // when
    effectsCombiner.combineMiddlewares = jest.fn(() => () => of(req));
    routerFactory.factorizeRouting = jest.fn(() => []);
    routerResolver.resolveRouting = jest.fn(() => () => () =>
      of({ body: 'test' }).pipe(switchMap(() => throwError(error)))
    );
    responseHandler.handleResponse = jest.fn(() => () => () => undefined);

    httpListener({
      middlewares: [middleware$],
      effects: [effect$],
      error$,
    }).run(context)(req, res);

    // then
    setTimeout(() => {
      expect(responseHandler.handleResponse).toHaveBeenCalledTimes(1);
      expect(error$).toHaveBeenCalled();
      done();
    }, 0);
  });

});
