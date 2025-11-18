import { describe, expect, it } from 'vitest';

import { Account } from '../../src/math/loan.js';
import { Amount } from '../../src/math/mini-money.js';

describe('loan Account', () => {
  describe('constructor', () => {
    it('requires a positive integer period count', () => {
      expect(() => new Account(0, 'MONTH', 0.05, 500)).toThrow(/period/i);
      expect(() => new Account(12.5, 'MONTH', 0.05, 500)).toThrow(/period/i);
      expect(() => new Account(-3, 'MONTH', 0.05, 500)).toThrow(/period/i);
    });

    it('rejects unsupported period types', () => {
      expect(() => new Account(6, 'YEAR', 0.05, 500)).toThrow(/period/i);
    });
  });

  describe('totalInterest', () => {
    it('returns the simple interest amount for the entire loan for non-interest bearing loans', () => {
      const principal = 2000;
      const rate = 0;
      const account = new Account(12, 'MONTH', rate, principal);

      const interest = account.totalInterest();

      expect(interest).toBeInstanceOf(Amount);
      expect(interest.toDecimal()).toBe(0);
    });

    it('returns the simple interest amount for the entire loan for interest bearing loans', () => {
      const principal = 2000;
      const rate = 0.05;
      const account = new Account(12, 'MONTH', rate, principal);
      const interest = account.totalInterest();

      expect(interest).toBeInstanceOf(Amount);
      expect(interest.toDecimal()).toBeCloseTo(54.579562, 2);
    });
  });

  describe('paymentSchedule', () => {
    it('creates equal zero interest payments with principal that divides evenly', () => {
      const periods = 6;
      const principal = 1200;
      const rate = 0;

      const account = new Account(periods, 'MONTH', rate, principal);
      expect(account.totalInterest().toDecimal()).toBe(0);
      const paymentSchedule = account.paymentSchedule();
      expect(paymentSchedule).toHaveLength(6);
      for (let i = 0; i < periods; i++) {
        expect(paymentSchedule[i].toDecimal()).toBeCloseTo(principal / periods, 2);
      }
    });

    /**
     * NB: the following tests specify an approach to payment calculation that always rounds in
     * debtor's favor (ie the lender is giving away fractions of a penny)
     */
    it('creates payments with zero interest and principal that does not divide evenly (rounding down #1)', () => {
      const periods = 3;
      const principal = 602.5;
      const rate = 0;

      const account = new Account(periods, 'MONTH', rate, principal);
      const paymentSchedule = account.paymentSchedule();
      paymentSchedule.forEach((payment) => {
        expect(payment.toDecimal()).toBeCloseTo(200.83, 2);
      });
    });

    it('creates payments with zero interest and principal that does not divide evenly (rounding down #2)', () => {
      const periods = 3;
      const principal = 602.57;
      const rate = 0;

      const account = new Account(periods, 'MONTH', rate, principal);
      const paymentSchedule = account.paymentSchedule();
      paymentSchedule.forEach((payment) => {
        expect(payment.toDecimal()).toBeCloseTo(200.85, 2);
      });
    });

    it('creates multiple equal payments with interest', () => {
      const periodCount = 12;
      const principal = 1200;
      const rate = 0.1;
      const account = new Account(periodCount, 'MONTH', rate, principal);

      const schedule = account.paymentSchedule();

      expect(schedule).toHaveLength(periodCount);
      schedule.forEach((payment) => expect(payment).toBeInstanceOf(Amount));

      expect(account.totalInterest().toDecimal()).toBeCloseTo(65.98, 2);
      schedule.forEach((payment) => {
        expect(payment.toDecimal()).toBeCloseTo(105.5, 2);
      });
    });

    it('can create a single advance, single period, single payment schedule', () => {
      const periodCount = 1;
      const principal = 1200;
      const rate = 0.1;
      const account = new Account(periodCount, 'MONTH', rate, principal);

      const schedule = account.paymentSchedule();

      expect(schedule).toHaveLength(periodCount);

      expect(account.totalInterest().toDecimal()).toBeCloseTo(10, 2);
      expect(schedule).toHaveLength(1);
      expect(schedule[0].toDecimal()).toBeCloseTo(1210, 2);
    });
  });
});
