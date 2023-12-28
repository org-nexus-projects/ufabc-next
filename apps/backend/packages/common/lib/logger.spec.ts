import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { buildLogger } from './logger';

describe('common.lib.logger', () => {
  it('should create a logger in dev environment', () => {
    const devLogger = buildLogger('dev');
    const pinoStub = mock.fn(devLogger.info);

    devLogger.info = pinoStub;
    assert.strictEqual(pinoStub.mock.calls.length, 0);
    devLogger.info('call it');
    assert.deepEqual(pinoStub.mock.calls.length, 1);

    mock.reset();
  });

  it('should create a logger in prod environment', () => {
    const prodLogger = buildLogger('prod');
    const pinoStub = mock.fn(prodLogger.info);

    prodLogger.info = pinoStub;
    assert.deepEqual(pinoStub.mock.calls.length, 0);
    prodLogger.info('call it prod');
    assert.deepEqual(pinoStub.mock.calls.length, 1);

    mock.reset();
  });
});
