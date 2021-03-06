import { WriteStream } from 'fs';
import { fromNullable } from 'fp-ts/lib/Option';
import { compose } from '@marblejs/core/dist/+internal';
import { LoggerOptions, LoggerCtx } from './logger.model';

export const isNotSilent = (opts: LoggerOptions) => (ctx: LoggerCtx) =>
  !opts.silent;

export const filterResponse = (opts: LoggerOptions) => (ctx: LoggerCtx) =>
  fromNullable(opts.filter)
    .map(filter => filter(ctx.res, ctx.req))
    .getOrElse(true);

export const writeToStream = (stream: WriteStream, chunk: string) =>
  stream.write(`${chunk}\n\n`);

export const formatTime = (timeInMms: number) =>
  timeInMms > 1000
    ? `${timeInMms / 1000}s`
    : `${timeInMms}ms`;

export const getTimeDifferenceInMs = (startTime: Date): number =>
  new Date().getTime() - startTime.getTime();

export const factorizeTime = (timestamp: number) =>
  compose(
    formatTime,
    getTimeDifferenceInMs
  )(new Date(timestamp));
