import { describe, expect, it } from 'vitest';

import { Account } from '../../src/accounts/loan.js';
import { Amount } from '../../src/math/mini-money.js';

describe('loan Account', () => {
  describe('constructor', () => {
    it.each([
      { label: 'zero periods', periodCount: 0 },
      { label: 'non-integer periods', periodCount: 12.5 },
      { label: 'negative periods', periodCount: -3 },
    ])('requires a positive integer period count (%s)', ({ periodCount }) => {
      expect(() => new Account(periodCount, 'MONTH', 0.05, 500)).toThrow(/period/i);
    });

    it.each(['YEAR', 'WEEK'])('rejects unsupported period types (%s)', (periodType) => {
      expect(() => new Account(6, periodType, 0.05, 500)).toThrow(/period/i);
    });
  });

  describe('totalInterest', () => {
    it.each([
      { label: 'non-interest bearing loan', rate: 0, expected: 0 },
      { label: 'interest bearing loan', rate: 0.05, expected: 54.579562 },
    ])('returns the simple interest amount for the entire loan (%s)', ({ rate, expected }) => {
      const principal = 2000;
      const account = new Account(12, 'MONTH', rate, principal);

      const interest = account.totalInterest();

      expect(interest).toBeInstanceOf(Amount);
      expect(interest.toDecimal()).toBeCloseTo(expected, 2);
    });
  });

  describe('payment', () => {
    /**
     * NB: the following tests specify an approach to payment calculation that always rounds in
     * debtor's favor (ie the lender is giving away fractions of a penny)
     */
    it.each([
      {
        label: 'principal divides evenly',
        periods: 6,
        principal: 1200,
        expectedPayment: 200,
      },
      {
        label: 'rounding down scenario #1',
        periods: 3,
        principal: 602.5,
        expectedPayment: 200.83,
      },
      {
        label: 'rounding down scenario #2',
        periods: 3,
        principal: 602.57,
        expectedPayment: 200.85,
      },
    ])('computes zero interest payment amount (%s)', ({ periods, principal, expectedPayment }) => {
      const rate = 0;
      const account = new Account(periods, 'MONTH', rate, principal);

      expect(account.totalInterest().toDecimal()).toBeCloseTo(0, 2);
      expect(account.payment()).toBeInstanceOf(Amount);
      expect(account.payment().toDecimal()).toBeCloseTo(expectedPayment, 2);
    });

    it.each([
      {
        label: 'monthly 1 year',
        periodCount: 12,
        principal: 1200,
        rate: 0.1,
        totalInterest: 65.98,
        expectedPayment: 105.5,
      },
      {
        label: 'monthly 6 months',
        periodCount: 6,
        principal: 1150,
        rate: 0.05,
        totalInterest: 16.82,
        expectedPayment: 194.47,
      },
      {
        label: 'monthly 18 months',
        periodCount: 18,
        principal: 1029.19,
        rate: 0.2,
        totalInterest: 170.57,
        expectedPayment: 66.65,
      },
    ])(
      'computes installment payment with interest (%s)',
      ({ periodCount, principal, rate, totalInterest, expectedPayment }) => {
        const account = new Account(periodCount, 'MONTH', rate, principal);

        expect(account.totalInterest().toDecimal()).toBeCloseTo(totalInterest, 2);
        expect(account.payment()).toBeInstanceOf(Amount);
        expect(account.payment().toDecimal()).toBeCloseTo(expectedPayment, 2);
      },
    );

    it('can create a single advance, single period, single payment schedule', () => {
      const periodCount = 1;
      const principal = 1200;
      const rate = 0.1;
      const account = new Account(periodCount, 'MONTH', rate, principal);

      expect(account.totalInterest().toDecimal()).toBeCloseTo(10, 2);
      expect(account.payment().toDecimal()).toBeCloseTo(1210, 2);
    });
  });
});
