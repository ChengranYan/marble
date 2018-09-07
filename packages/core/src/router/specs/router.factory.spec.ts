import { mapTo } from 'rxjs/operators';
import { EffectFactory } from '../../effects/effects.factory';
import { Effect, Middleware } from '../../effects/effects.interface';
import { RouteEffect, RouteEffectGroup, Routing } from '../router.interface';
import { factorizeRouting, combineRoutes } from '../router.factory';

describe('Router factory', () => {
  let effectsCombiner;

  beforeEach(() => {
    jest.unmock('../../effects/effects.combiner.ts');
    effectsCombiner = require('../../effects/effects.combiner');
  });

  test('#factorizeRouting factorizes routing with nested groups', () => {
    // given
    const m$: Middleware = req$ => req$;
    const e$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));

    const routeGroupNested: RouteEffectGroup = {
      path: '/nested',
      effects: [{ path: '/', method: 'GET', effect: e$ }],
      middlewares: [m$],
    };

    const routeGroup: RouteEffectGroup = {
      path: '/:id',
      effects: [
        { path: '/', method: 'GET', effect: e$ },
        { path: '/', method: 'POST', effect: e$ },
        routeGroupNested,
        { path: '*', method: '*', effect: e$ },
      ],
      middlewares: [m$],
    };

    const routing: (RouteEffect | RouteEffectGroup)[] = [
      { path: '/', method: 'GET', effect: e$ },
      routeGroup,
    ];

    // when
    effectsCombiner.combineMiddlewareEffects = jest.fn(() => m$);
    const factorizedRouting = factorizeRouting(routing);

    // then
    expect(factorizedRouting).toEqual([
      {
        regExp: /^\/?$/,
        methods: { GET: { effect: e$, middleware: undefined, parameters: undefined } },
      },
      {
        regExp: /^\/([^\/]+)\/?$/,
        methods: {
          GET: { middleware: m$, effect: e$, parameters: ['id'] },
          POST: { middleware: m$, effect: e$, parameters: ['id'] },
        },
      },
      {
        regExp: /^\/([^\/]+)\/nested\/?$/,
        methods: { GET: { middleware: m$, effect: e$, parameters: ['id'] } },
      },
      {
        regExp: /^\/([^\/]+)\/.*?$/,
        methods: { '*': { middleware: m$, effect: e$, parameters: ['id'] } },
      },
    ] as Routing);
  });

  test('#factorizeRouting throws error if route is redefined', () => {
    // given
    const e$: Effect = req$ => req$.pipe(mapTo({ body: 'test' }));

    const route1: RouteEffect = { path: '/test', method: 'GET', effect: e$ };
    const route2: RouteEffect = { path: '/test', method: 'GET', effect: e$ };
    const route3: RouteEffect = { path: '/test/foo', method: 'GET', effect: e$ };

    // when
    const error = () => factorizeRouting([
      route1,
      route2,
      route3,
    ]);

    // then
    expect(error).toThrowError('Redefinition of route at "GET: /test"');
  });

  describe('#combineRoutes', () => {
    test('factorizes combined routes for effects only', () => {
      // given
      const effect$ = req$ => req$.pipe(mapTo({}));
      const a$ = EffectFactory.matchPath('/a').matchType('GET').use(effect$);
      const b$ = EffectFactory.matchPath('/b').matchType('GET').use(effect$);

      // when
      const combiner = combineRoutes('/test', [a$, b$]);

      // then
      expect(combiner).toEqual({
        path: '/test',
        middlewares: [],
        effects: [a$, b$],
      });
    });

    test('factorizes combined routes for effects with middlewares', () => {
      // given
      const effect$ = req$ => req$.pipe(mapTo({}));
      const a$ = EffectFactory.matchPath('/a').matchType('GET').use(effect$);
      const b$ = EffectFactory.matchPath('/b').matchType('GET').use(effect$);

      const m1$: Middleware = req$ => req$;
      const m2$: Middleware = req$ => req$;

      // when
      const combiner = combineRoutes('/test', {
        middlewares: [m1$, m2$],
        effects: [a$, b$],
      });

      // then
      expect(combiner).toEqual({
        path: '/test',
        middlewares: [m1$, m2$],
        effects: [a$, b$],
      });
    });

    test('factorizes combined routes for effects with empty middlewares', () => {
      // given
      const effect$ = req$ => req$.pipe(mapTo({}));
      const a$ = EffectFactory.matchPath('/a').matchType('GET').use(effect$);
      const b$ = EffectFactory.matchPath('/b').matchType('GET').use(effect$);

      // when
      const combiner = combineRoutes('/test', {
        effects: [a$, b$],
      });

      // then
      expect(combiner).toEqual({
        path: '/test',
        middlewares: [],
        effects: [a$, b$],
      });
    });
  });

});
