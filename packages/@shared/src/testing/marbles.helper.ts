import { Observable, OperatorFunction, from } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { Effect, HttpRequest, HttpResponse } from '@marblejs/core';

type MarbleFlow = [string, object];
type MarbleDependencies = { response: HttpResponse; error?: Error };

export namespace Marbles {
  const deepEquals = (actual, expected) => expect(actual).toEqual(expected);

  const createTestScheduler = () => new TestScheduler(deepEquals);

  export const assert = <T>(
    operators: OperatorFunction<T, any>[],
    marbleflow: [MarbleFlow, MarbleFlow],
  ) => {
    const [initStream, initValues] = marbleflow[0];
    const [expectedStream, expectedValues] = marbleflow[1];

    const scheduler = createTestScheduler();
    const observable = scheduler.createColdObservable(initStream, initValues);
    const stream = from(observable) as Observable<T>;
    const pipedStream = stream.pipe(...operators);

    scheduler
      .expectObservable(pipedStream)
      .toBe(expectedStream, expectedValues);

    scheduler.flush();
  };

  export const assertEffect = <T>(
    effect: Effect<T>,
    marbleflow: [MarbleFlow, MarbleFlow],
    depts: MarbleDependencies = { response: {} as HttpResponse },
  ) => {
    const [initStream, initValues] = marbleflow[0];
    const [expectedStream, expectedValues] = marbleflow[1];

    const scheduler = createTestScheduler();
    const observable = scheduler.createColdObservable(initStream, initValues);
    const effectStream = from(observable) as Observable<HttpRequest>;

    scheduler
      .expectObservable(effect(effectStream, depts.response, depts.error))
      .toBe(expectedStream, expectedValues);

    scheduler.flush();
  };

  export const assertCombinedEffects = <T>(
    effects$: Observable<T>,
    marbleflow: MarbleFlow,
  ) => {
    const [expectedStream, expectedValues] = marbleflow;
    const scheduler = createTestScheduler();

    scheduler.expectObservable(effects$).toBe(expectedStream, expectedValues);

    scheduler.flush();
  };
}
