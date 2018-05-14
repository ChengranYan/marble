import { bodyParser$, httpListener, logger$ } from '../packages/core/src';
import { api$ } from './controllers/api.controller';

const middlewares = [
  logger$,
  bodyParser$,
];

const effects = [
  api$,
];

export const app = httpListener({ middlewares, effects });
