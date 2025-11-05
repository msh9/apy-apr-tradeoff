import { describe, expect, it } from 'vitest';

import { Amount } from '../../src/math/mini-money.js';

describe('mini-money Amount', () => {
  describe('constructor', () => {
    it('scales values into integer representation based on precision', () => {
      const amount = new Amount(18.43, 2);

      expect(amount.precision).toBe(2);
      expect(amount.integerValue).toBe(1843);
      expect(amount.toDecimal()).toBeCloseTo(18.43, 10);
    });

    it('rejects non-integer precisions', () => {
      expect(() => new Amount(1.23, 1.5)).toThrow(/precision/i);
    });
  });

  describe('toDecimal', () => {
    it('returns the decimal representation based on precision', () => {
      const amount = new Amount(123.456, 3);

      expect(amount.toDecimal()).toBeCloseTo(123.456, 10);
    });

    it('handles amounts with differing precision', () => {
      const amount = new Amount(0.000123, 6);

      expect(amount.toDecimal()).toBeCloseTo(0.000123, 10);
    });

    it('reflects updated integer values after operations', () => {
      const amount = new Amount(10, 2);
      amount.addTo(new Amount(0.25, 2));

      expect(amount.toDecimal()).toBeCloseTo(10.25, 10);
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
      expect(lhs.toDecimal()).toBeCloseTo(13.0, 10);
    });

    it('reduces more precise values before adding', () => {
      const lhs = new Amount(10.15, 2);
      const rhs = new Amount(0.12, 4);

      lhs.addTo(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(1027);
      expect(lhs.toDecimal()).toBeCloseTo(10.27, 10);
    });

    it('lowers this amount precision when adding less precise values', () => {
      const lhs = new Amount(12.34, 4);
      const rhs = new Amount(7.89, 2);

      lhs.addTo(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(2023);
      expect(lhs.toDecimal()).toBeCloseTo(20.23, 10);
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
      expect(lhs.toDecimal()).toBeCloseTo(19.75, 10);
    });

    it('lowers precision when subtracting a less precise amount', () => {
      const lhs = new Amount(5.34, 4);
      const rhs = new Amount(1.23, 2);

      lhs.subtractFrom(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.integerValue).toBe(411);
      expect(lhs.toDecimal()).toBeCloseTo(4.11, 10);
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
      expect(lhs.toDecimal()).toBeCloseTo(24.68, 10);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(2, 2);

      expect(() => lhs.multiplyBy('2')).toThrow(/Amount/);
    });
  });

  describe('divideBy', () => {
    it('divides values that already share the same precision', () => {
      const lhs = new Amount(25.0, 2);
      const rhs = new Amount(2.0, 2);

      lhs.divideBy(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.toDecimal()).toBeCloseTo(12.5, 10);
    });

    it('reduces more precise numerator before dividing', () => {
      const lhs = new Amount(10.432, 3);
      const rhs = new Amount(0.5, 1);

      lhs.divideBy(rhs);

      expect(lhs.precision).toBe(1);
      expect(lhs.toDecimal()).toBeCloseTo(20.8, 2);
    });

    it('divides with a zero numerator', () => {
      const lhs = new Amount(0, 4);
      const rhs = new Amount(4.355, 3);

      lhs.divideBy(rhs);

      expect(lhs.precision).toBe(3);
      expect(lhs.toDecimal()).toBeCloseTo(0, 3);
    });

    it('reduces more precise divisor before dividing', () => {
      const lhs = new Amount(10.0, 2);
      const rhs = new Amount(0.5, 4);

      lhs.divideBy(rhs);

      expect(lhs.precision).toBe(2);
      expect(lhs.toDecimal()).toBeCloseTo(20, 10);
    });

    it('rejects zero divisor', () => {
      const lhs = new Amount(5, 2);
      const rhs = new Amount(0, 2);

      expect(() => lhs.divideBy(rhs)).toThrow(/zero/);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(5, 2);

      expect(() => lhs.divideBy(2)).toThrow(/Amount/);
    });
  });

  describe('raiseBy', () => {
    it('raises to a power when the exponent shares precision', () => {
      const base = new Amount(2.0, 2);
      const exponent = new Amount(3.0, 2);

      base.raiseBy(exponent);

      expect(base.precision).toBe(2);
      expect(base.integerValue).toBe(800);
      expect(base.toDecimal()).toBeCloseTo(8, 10);
    });

    it('rejects non-Amount inputs', () => {
      const base = new Amount(2, 2);

      expect(() => base.raiseBy(undefined)).toThrow(/Amount/);
    });
  });
});
