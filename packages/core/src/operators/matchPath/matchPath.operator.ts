import * as pathToRegexp from 'path-to-regexp';
import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { HttpRequest } from '../../http.interface';
import { matcherFactory, removeQueryParams } from './matcher.factory';
import { queryParamsFactory } from './queryParams.factory';
import { urlParamsFactory } from './urlParams.factory';

type MatcherOpts = {
  suffix?: string;
  combiner?: boolean;
};

export const matchPath = (path: string, opts: MatcherOpts = {}) => (
  source$: Observable<HttpRequest>
) =>
  source$.pipe(
    tap(req => (req.query = req.query || {})),
    tap(req => (req.params = req.params || {})),
    tap(req => (req.matchers = req.matchers || [])),
    filter(req => {
      const matcher = matcherFactory(req.matchers!, path, opts.suffix);
      const url = removeQueryParams(req.url!);
      return pathToRegexp(matcher).test(url);
    }),
    tap(req => (req.params = urlParamsFactory(req, path))),
    tap(req => (req.query = queryParamsFactory(req.url!))),
    tap(req => opts.combiner && req.matchers!.push(path))
  );
