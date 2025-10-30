import { describe, it, expect } from 'vitest';
import { notImplemented } from '../../src/math/loan-math.js';

describe('loan-math placeholder', () => {
  it('signals missing implementation', () => {
    expect(() => notImplemented()).toThrow(/implement calculation helpers/i);
  });
});
