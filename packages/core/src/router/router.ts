import { EMPTY, Observable, of } from 'rxjs';
import { HttpMethod, HttpRequest, HttpResponse } from '../http.interface';
import { EffectResponse } from '../effects/effects.interface';
import { RouteMatched, Routing } from './router.interface';
import { queryParamsFactory } from '../router/queryParams.factory';

export const findRoute = (
  routing: Routing,
  url: string,
  method: HttpMethod
): RouteMatched | undefined => {
  for (let i = 0; i < routing.length; ++i) {
    const { regExp, methods } = routing[i];
    const match = url.match(regExp);

    if (!match) {
      continue;
    }

    const routingMethod = methods[method];

    if (!routingMethod) {
      return undefined;
    }

    const { parameters, effect, middleware } = routingMethod;
    const params = {};

    if (parameters) {
      for (let p = 0; p < parameters.length; p++) {
        params[parameters[p]] = decodeURIComponent(match[p + 1]);
      }
    }

    return { middleware, effect, params };
  }
  return undefined;
};

export const resolveRouting =
  (routing: Routing) =>
  (res: HttpResponse) =>
  (req: HttpRequest): Observable<EffectResponse> => {
    const [urlPath, urlQuery] = req.url.split('?');
    const routeMatched = findRoute(routing, urlPath, req.method);

    if (!routeMatched) {
      return EMPTY;
    }

    req.query = queryParamsFactory(urlQuery);
    req.params = routeMatched.params;

    const middleware = routeMatched.middleware;
    const req$ = of(req);

    return middleware
      ? routeMatched.effect(middleware(req$, res, null), res, null)
      : routeMatched.effect(req$, res, null);
  };
