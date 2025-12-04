import { describe, expect, it } from 'vitest';

import { Amount } from '../../src/math/mini-money.js';

describe('mini-money Amount', () => {
  describe('constructor', () => {
    it('scales values into integer representation based on precision', () => {
      const amount = new Amount(18.43);
      const expectedAmount = new Amount(18.43);

      expect(amount.equals(expectedAmount)).toBe(true);
      expect(amount.toDecimal()).toBeCloseTo(18.43, 10);
    });
  });

  describe('toDecimal', () => {
    it('returns the decimal representation based on precision', () => {
      const amount = new Amount(123.456);

      expect(amount.toDecimal()).toBeCloseTo(123.456, 10);
    });

    it('handles amounts with differing precision', () => {
      const amount = new Amount(0.000123);

      expect(amount.toDecimal()).toBeCloseTo(0.000123, 10);
    });

    it('returns new instances without mutating originals', () => {
      const amount = new Amount(10);
      const result = amount.addTo(new Amount(0.25));

      expect(result.toDecimal()).toBeCloseTo(10.25, 10);
      expect(amount.toDecimal()).toBeCloseTo(10, 10);
    });
  });

  describe('addTo', () => {
    it('adds values that already share the same precision', () => {
      const lhs = new Amount(12.34);
      const rhs = new Amount(0.66);

      const result = lhs.addTo(rhs);

      expect(result).not.toBe(lhs);
      expect(result.toDecimal()).toBeCloseTo(13.0, 10);

      expect(lhs.toDecimal()).toBeCloseTo(12.34, 10);
    });

    it('reduces more precise values before adding', () => {
      const lhs = new Amount(10.15);
      const rhs = new Amount(0.12);

      const result = lhs.addTo(rhs);

      expect(result.toDecimal()).toBeCloseTo(10.27, 10);

      expect(lhs.toDecimal()).toBeCloseTo(10.15, 10);
    });

    it('lowers this amount precision when adding less precise values', () => {
      const lhs = new Amount(12.34);
      const rhs = new Amount(7.89);

      const result = lhs.addTo(rhs);

      expect(result.toDecimal()).toBeCloseTo(20.23, 10);

      expect(lhs.toDecimal()).toBeCloseTo(12.34, 10);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(5);

      expect(() => lhs.addTo(3)).toThrow(/Amount/);
    });
  });

  describe('subtractFrom', () => {
    it('subtracts when both amounts share precision', () => {
      const lhs = new Amount(20.5);
      const rhs = new Amount(0.75);

      const result = lhs.subtractFrom(rhs);

      expect(result.toDecimal()).toBeCloseTo(19.75, 10);

      expect(lhs.toDecimal()).toBeCloseTo(20.5, 10);
    });

    it('lowers precision when subtracting a less precise amount', () => {
      const lhs = new Amount(5.34);
      const rhs = new Amount(1.23);

      const result = lhs.subtractFrom(rhs);

      expect(result.toDecimal()).toBeCloseTo(4.11, 10);

      expect(lhs.toDecimal()).toBeCloseTo(5.34, 10);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(1);

      expect(() => lhs.subtractFrom(null)).toThrow(/Amount/);
    });
  });

  describe('multiplyBy', () => {
    it('multiplies values that share precision', () => {
      const lhs = new Amount(12.34);
      const rhs = new Amount(2.0);

      const result = lhs.multiplyBy(rhs);

      expect(result.toDecimal()).toBeCloseTo(24.68, 10);

      expect(lhs.toDecimal()).toBeCloseTo(12.34, 10);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(2);

      expect(() => lhs.multiplyBy('2')).toThrow(/Amount/);
    });
  });

  describe('divideBy', () => {
    it('divides values that already share the same precision', () => {
      const lhs = new Amount(25.0);
      const rhs = new Amount(2.0);

      const result = lhs.divideBy(rhs);

      expect(result.toDecimal()).toBeCloseTo(12.5, 10);

      expect(lhs.toDecimal()).toBeCloseTo(25, 10);
    });

    it('reduces more precise numerator before dividing', () => {
      const lhs = new Amount(10.432);
      const rhs = new Amount(0.5);

      const result = lhs.divideBy(rhs);

      expect(result.toDecimal()).toBeCloseTo(20.864, 3);

      expect(lhs.toDecimal()).toBeCloseTo(10.432, 3);
    });

    it('divides with a zero numerator', () => {
      const lhs = new Amount(0);
      const rhs = new Amount(4.355);

      const result = lhs.divideBy(rhs);

      expect(result.toDecimal()).toBeCloseTo(0, 3);

      expect(lhs.toDecimal()).toBeCloseTo(0, 3);
    });

    it('reduces more precise divisor before dividing', () => {
      const lhs = new Amount(10.0);
      const rhs = new Amount(0.5);

      const result = lhs.divideBy(rhs);

      expect(result.toDecimal()).toBeCloseTo(20, 10);

      expect(lhs.toDecimal()).toBeCloseTo(10, 10);
    });

    it('rejects zero divisor', () => {
      const lhs = new Amount(5);
      const rhs = new Amount(0);

      expect(() => lhs.divideBy(rhs)).toThrow(/zero/);
    });

    it('rejects non-Amount inputs', () => {
      const lhs = new Amount(5);

      expect(() => lhs.divideBy(2)).toThrow(/Amount/);
    });
  });

  describe('pow', () => {
    it('raises amount to a positive integer exponent', () => {
      const base = new Amount(1.5);

      const result = base.pow(3);

      expect(result.toDecimal()).toBeCloseTo(3.375, 10);
      expect(base.toDecimal()).toBeCloseTo(1.5, 10);
    });

    it('returns 1 for exponent zero', () => {
      const base = new Amount(12.34);

      const result = base.pow(0);

      expect(result.toDecimal()).toBeCloseTo(1, 10);
    });

    it('rejects negative exponents', () => {
      const base = new Amount(2);

      expect(() => base.pow(-1)).toThrow(/non-negative integer/i);
    });

    it('rejects non-integer exponents', () => {
      const base = new Amount(2);

      expect(() => base.pow(1.5)).toThrow(/non-negative integer/i);
    });
  });

  describe('equals', () => {
    it('returns true when amounts share the same value', () => {
      const lhs = new Amount(42.195);
      const rhs = new Amount(42.195);

      expect(lhs.equals(rhs)).toBe(true);
    });

    it('returns false when values differ', () => {
      const lhs = new Amount(10.5);
      const rhs = new Amount(10.75);

      expect(lhs.equals(rhs)).toBe(false);
    });

    it('rejects non-Amount comparisons', () => {
      const lhs = new Amount(1);

      expect(() => lhs.equals(1)).toThrow(/Amount/);
    });
  });

  describe('lessThan', () => {
    it('returns true when the amount is strictly less than another', () => {
      const lhs = new Amount(9.99);
      const rhs = new Amount(10.0);

      expect(lhs.lessThan(rhs)).toBe(true);
    });

    it('returns false when amounts are equal or greater', () => {
      const lhs = new Amount(5);
      const rhs = new Amount(5);
      const smaller = new Amount(4.99);

      expect(lhs.lessThan(rhs)).toBe(false);
      expect(lhs.lessThan(smaller)).toBe(false);
    });

    it('rejects non-Amount comparisons', () => {
      const lhs = new Amount(1);

      expect(() => lhs.lessThan(0)).toThrow(/Amount/);
    });
  });
});
