import { HttpMethod } from '../http.interface';
import { Effect, Middleware } from '../effects/effects.interface';

// Route
export interface RouteEffect {
  path: string;
  method: HttpMethod;
  effect: Effect;
}

export interface RouteEffectGroup {
  path: string;
  middlewares: Middleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
}

// Combiner
export interface RouteCombinerConfig {
  middlewares?: Middleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
}

// Routing
export interface ParametricRegExp {
  regExp: RegExp;
  parameters?: string[] | undefined;
}

export interface RoutingMethod {
  parameters?: string[] | undefined;
  middleware?: Middleware | undefined;
  effect: Effect;
}

export interface RoutingItem {
  regExp: RegExp;
  methods: Partial<Record<HttpMethod, RoutingMethod>>;
}

export interface RouteMatched {
  middleware?: Middleware | undefined;
  effect: Effect;
  params: Record<string, string>;
}

export type Routing = RoutingItem[];
