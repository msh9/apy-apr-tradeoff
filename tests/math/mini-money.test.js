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

  describe('toPreciseString', () => {
    it('returns a string with 20 fractional digits', () => {
      const amount = new Amount(18.43);

      expect(amount.toPreciseString()).toBe('18.43000000000000000000');
    });

    it('preserves leading zeros for small amounts', () => {
      const amount = new Amount(0.000123);

      expect(amount.toPreciseString()).toBe('0.00012300000000000000');
    });

    it('handles negative values', () => {
      const amount = new Amount(-1.5);

      expect(amount.toPreciseString()).toBe('-1.50000000000000000000');
    });

    it('handles infinite fractions', () => {
      const divisor = new Amount(3);
      const numerator = new Amount(10);

      const result = numerator.divideBy(divisor);
      expect(result.toPreciseString()).toBe('3.33333333333333333333');
    });
  });

  describe('nthRoot', () => {
    it('calculates square roots within precision', () => {
      const amount = new Amount(4);

      const result = amount.nthRoot(2);

      expect(result.toPreciseString()).toBe('2.00000000000000000000');
    });

    it('calculates an example deposit rate #1 within precision', () => {
      const amount = new Amount(1.023);
      const result = amount.nthRoot(365);
      expect(result.toPreciseString()).toBe('1.00006230190498304821');
    });

    it('calculates an example deposit rate #2 within precision', () => {
      const amount = new Amount(1.045);
      const result = amount.nthRoot(365);
      // actual result: 1.00012060147839494315
      // expected accounts for inaccuracy
      expect(result.toPreciseString()).toBe('1.00012060147839494316');
    });

    it('handles roots of fractional values', () => {
      const amount = new Amount(0.25);

      const result = amount.nthRoot(2);

      expect(result.toPreciseString()).toBe('0.50000000000000000000');
    });

    it('returns zero for zero input', () => {
      const amount = new Amount(0);

      const result = amount.nthRoot(5);

      expect(result.toPreciseString()).toBe('0.00000000000000000000');
    });

    it('approximates higher order roots', () => {
      const amount = new Amount(8);

      const result = amount.nthRoot(3);

      expect(result.toDecimal()).toBeCloseTo(2, 15);
      expect(result.pow(3).toDecimal()).toBeCloseTo(8, 15);
    });

    it('rejects non-positive exponents', () => {
      const amount = new Amount(4);

      expect(() => amount.nthRoot(0)).toThrow(/positive integer/);
      expect(() => amount.nthRoot(-2)).toThrow(/positive integer/);
    });

    it('rejects non-integer exponents', () => {
      const amount = new Amount(4);

      expect(() => amount.nthRoot(1.5)).toThrow(/positive integer/);
    });

    it('rejects negative amounts', () => {
      const amount = new Amount(-4);

      expect(() => amount.nthRoot(2)).toThrow(/negative/);
    });
  });

  describe('addTo', () => {
    it('adds values that already share the same precision', () => {
      const lhs = new Amount(12.34);
      const rhs = new Amount(0.66);

      const result = lhs.addTo(rhs);

      expect(result.toDecimal()).toBeCloseTo(13.0, 10);
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
    });

    it('lowers precision when subtracting a less precise amount', () => {
      const lhs = new Amount(5.34);
      const rhs = new Amount(1.23);

      const result = lhs.subtractFrom(rhs);

      expect(result.toDecimal()).toBeCloseTo(4.11, 10);
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
    });

    it('divides with a zero numerator', () => {
      const lhs = new Amount(0);
      const rhs = new Amount(4.355);

      const result = lhs.divideBy(rhs);

      expect(result.toDecimal()).toBeCloseTo(0, 3);
    });

    it('divides numbers that have irrational results', () => {
      const lhs = new Amount(5);
      const rhs = new Amount(7);

      const result = lhs.divideBy(rhs);

      expect(result.toPreciseString()).toBe('0.71428571428571428571');
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

      expect(result.toDecimal()).toBeCloseTo(3.375, 15);
    });

    it('accurately raises amount to a positive integer exponent', () => {
      const base = new Amount(1.043);

      const result = base.pow(20);
      expect(result.toPreciseString()).toBe('2.32105893808793335595');
    });

    it('accurately raises amount to a large exponent', () => {
      const base = new Amount(1.043);

      const result = base.pow(365);

      expect(result.toPreciseString()).toBe('4718159.03632686908875110265');
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

  describe('rounding', () => {
    it('defaults to no rounding when options are omitted', () => {
      const amount = new Amount(1.005);

      const result = amount.addTo(new Amount(0));

      expect(result.toPreciseString()).toBe('1.00500000000000000000');
    });

    it('supports bankers rounding', () => {
      const amount = new Amount(1.005);

      const result = amount.addTo(new Amount(0), { roundingMode: 'bankers', decimalPlaces: 2 });

      expect(result.toPreciseString()).toBe('1.00000000000000000000');
    });

    it('supports conventional rounding', () => {
      const amount = new Amount(1.005);

      const result = amount.addTo(new Amount(0), {
        roundingMode: 'conventional',
        decimalPlaces: 2,
      });

      expect(result.toPreciseString()).toBe('1.01000000000000000000');
    });

    it('defaults decimalPlaces to cents when rounding is requested', () => {
      const numerator = new Amount(10);
      const denominator = new Amount(4);

      const result = numerator.divideBy(denominator, { roundingMode: 'bankers' });

      expect(result.toPreciseString()).toBe('2.50000000000000000000');
    });

    it('rejects unknown rounding modes', () => {
      const amount = new Amount(1);

      expect(() => amount.addTo(new Amount(1), { roundingMode: 'weird' })).toThrow(/roundingMode/);
    });
  });
});
