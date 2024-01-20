import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { currentQuad, findQuadFromDate, findQuarter } from './findQuad';

describe('common.lib.findQuad', () => {
  it('should return 1 for January, February, November, and December', () => {
    assert.deepEqual(findQuadFromDate(0), 1);
    assert.deepEqual(findQuadFromDate(1), 1);
    assert.deepEqual(findQuadFromDate(10), 1);
    assert.deepEqual(findQuadFromDate(11), 1);
  });

  it('should return 2 for March, April, and May', () => {
    assert.deepEqual(findQuadFromDate(2), 2);
    assert.deepEqual(findQuadFromDate(3), 2);
    assert.deepEqual(findQuadFromDate(4), 2);
  });

  it('should return 3 for June, July, August, September, and October', () => {
    assert.deepEqual(findQuadFromDate(5), 3);
    assert.deepEqual(findQuadFromDate(6), 3);
    assert.deepEqual(findQuadFromDate(7), 3);
    assert.deepEqual(findQuadFromDate(8), 3);
    assert.deepEqual(findQuadFromDate(9), 3);
  });

  it('should throw an error if quadKey is not found', () => {
    assert.throws(() => findQuarter(new Date('2000-23-34')));
  });

  it('should return the correct quarter and year for a given date', () => {
    assert.deepStrictEqual(findQuarter(new Date('2022-01-15')), {
      quad: 1,
      year: 2022,
    });
    assert.deepStrictEqual(findQuarter(new Date('2022-04-15')), {
      quad: 2,
      year: 2022,
    });
    assert.deepStrictEqual(findQuarter(new Date('2023-08-20')), {
      quad: 3,
      year: 2023,
    });
  });

  it('should return the correct string format', () => {
    assert.deepEqual(currentQuad(new Date('2022-01-15')), '2022:1');
    assert.deepEqual(currentQuad(new Date('2022-04-15')), '2022:2');
    assert.deepEqual(currentQuad(new Date('2023-08-20')), '2023:3');
  });
});
