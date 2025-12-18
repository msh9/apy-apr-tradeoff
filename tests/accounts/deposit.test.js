import { describe, expect, it } from 'vitest';

import { Account } from '../../src/accounts/deposit.js';
import { Amount } from '../../src/math/mini-money.js';

describe('deposit Account', () => {
  describe('constructor', () => {
    it('defaults to a zero balance and zero APY', () => {
      const account = new Account();

      expect(account.balance).toBeInstanceOf(Amount);
      expect(account.balance.toDecimal()).toBe(0);
      expect(account.apy).toBeInstanceOf(Amount);
      expect(account.apy.toDecimal()).toBe(0);
      expect(() => account.accrueForDays(0)).not.toThrow();
      expect(account.balance.toDecimal()).toBe(0);
    });

    it('accepts numeric inputs for both balance and APY', () => {
      const openingBalance = 18.43;
      const apy = 0.045;

      const account = new Account(openingBalance, apy);

      expect(account.balance).toBeInstanceOf(Amount);
      expect(account.balance.toDecimal()).toBeCloseTo(openingBalance, 10);
      expect(account.apy).toBeInstanceOf(Amount);
      expect(account.apy.toDecimal()).toBeCloseTo(apy, 10);
    });
  });

  describe('balance setter', () => {
    it('converts numeric values to Amounts with default precision', () => {
      const account = new Account();

      account.balance = 150.25;

      expect(account.balance).toBeInstanceOf(Amount);
      expect(account.balance.toDecimal()).toBeCloseTo(150.25, 10);
    });

    it('preserves Amount instances without altering precision', () => {
      const customAmount = new Amount(42.195);
      const account = new Account();

      account.balance = customAmount;

      expect(account.balance).toBe(customAmount);
      expect(account.balance.toDecimal()).toBeCloseTo(42.195, 6);
    });
  });

  describe('withdraw', () => {
    it('reduces the balance by the specified amount', () => {
      const account = new Account(500);

      account.withdraw(125.5);

      expect(account.balance.toDecimal()).toBeCloseTo(374.5, 10);
    });

    it('allows overdrafts so long as the withdrawal is finite and non-negative', () => {
      const account = new Account(50);

      account.withdraw(75);

      expect(account.balance.toDecimal()).toBeCloseTo(-25, 10);
    });
  });

  describe('accrueForDays', () => {
    it('accrues daily compounded interest onto the balance', () => {
      const account = new Account(1000, 0.05);

      account.accrueForDays(30);

      const expectedBalance = 1000 * (1 + 0.05) ** (30 / 365);
      expect(account.balance.toDecimal()).toBeCloseTo(expectedBalance, 2);
    });

    it('rejects non-integer day counts', () => {
      const account = new Account(1000, 0.05);

      expect(() => account.accrueForDays(1.5)).toThrow(/days/i);
    });

    it('rejects negative day counts', () => {
      const account = new Account(1000, 0.05);

      expect(() => account.accrueForDays(-3)).toThrow(/days/i);
    });
  });

  describe('accrueForDays', () => {
    it('tracks posted interest for idealized accruals', () => {
      const account = new Account(1000, 0.05);

      account.accrueForDays(30);

      const expectedBalance = 1000 * (1 + 0.05) ** (30 / 365);
      const expectedInterest = expectedBalance - 1000;
      expect(account.interestAccrued.toDecimal()).toBeCloseTo(expectedInterest, 2);
      expect(account.balance.toDecimal()).toBeCloseTo(expectedBalance, 2);
    });
  });

  describe('accrueForDaysWithMonthlyPosting', () => {
    it('defers interest until month end and leaves mid-month balances unchanged', () => {
      const account = new Account(1000, 0.1);

      account.accrueForDaysWithMonthlyPosting(10, '2024-01-05');
      expect(account.balance.toDecimal()).toBeCloseTo(1000, 10);
    });

    it('posts interest at month end', () => {
      const account = new Account(1000, 0.1);
      account.accrueForDaysWithMonthlyPosting(17, '2024-01-15');
      const expectedPosted = 1000 * ((1 + 0.1) ** (17 / 365) - 1);
      expect(account.interestAccrued.toDecimal()).toBeCloseTo(expectedPosted, 2);
      expect(account.balance.toDecimal()).toBeCloseTo(1000 + expectedPosted, 2);
    });

    it('accumulates across months while posting at month end', () => {
      const account = new Account(2349.99, 0.042);

      account.accrueForDaysWithMonthlyPosting(30, '2025-09-22');
      const expectedPosted = 2349.99 * ((1.042) ** (9 / 365) - 1);
      expect(account.interestAccrued.toDecimal()).toBeCloseTo(expectedPosted, 2);
      expect(account.balance.toDecimal()).toBeCloseTo(2349.99 + expectedPosted, 2);
    });

    it('throws on invalid start dates and negative spans', () => {
      const account = new Account(500, 0.02);

      expect(() => account.accrueForDaysWithMonthlyPosting(5, 'not-a-date')).toThrow(/date/i);
      expect(() => account.accrueForDaysWithMonthlyPosting(-1, '2024-01-01')).toThrow(
        /zero or greater/i,
      );
    });
  });
});
