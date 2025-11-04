import { describe, expect, it } from 'vitest';

import { Amount } from '../../src/math/mini-money.js';

const toDecimal = (amount) => {
  const scale = 10 ** amount.precision;
  return amount.integerValue / scale;
};

describe('mini-money Amount', () => {
  describe('constructor', () => {
    it('scales values into integer representation based on precision', () => {
      const amount = new Amount(18.43, 2);

      expect(amount.precision).toBe(2);
      expect(amount.integerValue).toBe(1843);
      expect(toDecimal(amount)).toBeCloseTo(18.43, 10);
    });

    it('rejects non-integer precisions', () => {
      expect(() => new Amount(1.23, 1.5)).toThrow(/precision/i);
    });
  });

  describe('addTo', () => {
    it('adds values that already share the same precision', () => {
      const lhs = new Amount(12.34, 2);
      const rhs = new Amount(0.66, 2);

      const result = lhs.addTo(rhs);

      expect(result).toBe(lhs);
      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(1300);
      expect(toDecimal(lhs)).toBeCloseTo(13.0, 10);
    });

    it('reduces more precise values before adding', () => {
      const lhs = new Amount(10.15, 2);
      const rhs = new Amount(0.12, 4);

      lhs.addTo(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(1027);
      expect(toDecimal(lhs)).toBeCloseTo(10.27, 10);
    });

    it('lowers this amount precision when adding less precise values', () => {
      const lhs = new Amount(12.34, 4);
      const rhs = new Amount(7.89, 2);

      lhs.addTo(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(2023);
      expect(toDecimal(lhs)).toBeCloseTo(20.23, 10);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(5, 2);

      expect(() => lhs.addTo(3)).toThrow(/Amount/);
    });
  });

  describe('subtractFrom', () => {
    it('subtracts when both amounts share precision', () => {
      const lhs = new Amount(20.5, 2);
      const rhs = new Amount(0.75, 2);

      lhs.subtractFrom(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(1975);
      expect(toDecimal(lhs)).toBeCloseTo(19.75, 10);
    });

    it('lowers precision when subtracting a less precise amount', () => {
      const lhs = new Amount(5.34, 4);
      const rhs = new Amount(1.23, 2);

      lhs.subtractFrom(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(411);
      expect(toDecimal(lhs)).toBeCloseTo(4.11, 10);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(1, 2);

      expect(() => lhs.subtractFrom(null)).toThrow(/Amount/);
    });
  });

  describe('multiplyBy', () => {
    it('multiplies values that share precision', () => {
      const lhs = new Amount(12.34, 2);
      const rhs = new Amount(2.0, 2);

      lhs.multiplyBy(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(2468);
      expect(toDecimal(lhs)).toBeCloseTo(24.68, 10);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(2, 2);

      expect(() => lhs.multiplyBy('2')).toThrow(/Amount/);
    });
  });

  describe('raiseBy', () => {
    it('raises to a power when the exponent shares precision', () => {
      const base = new Amount(2.0, 2);
      const exponent = new Amount(3.0, 2);

      base.raiseBy(exponent);

      expect(base.precision).toBe(2);
      expect(base.integerValue).toBe(800);
      expect(toDecimal(base)).toBeCloseTo(8, 10);
    });

    it('rejects non-Amount inputs', () => {
      const base = new Amount(2, 2);

      expect(() => base.raiseBy(undefined)).toThrow(/Amount/);
    });
  });
});
