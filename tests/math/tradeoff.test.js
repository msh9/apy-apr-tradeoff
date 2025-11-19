import { describe, expect, it } from 'vitest';

import { TradeoffComparison } from '../../src/math/tradeoff.js';

const DAYS_IN_MONTH = 30;
const DAYS_IN_YEAR = 365;

describe('TradeoffComparison', () => {
  describe('estimateSavingsWithDeposits', () => {
    it('returns the savings created by investing the principal during a zero-interest loan period', () => {
      const calculator = new TradeoffComparison({ periodDays: DAYS_IN_MONTH });

      const result = calculator.estimateSavingsWithDeposits({
        principal: 1200,
        periodCount: 1,
        loanRate: 0,
        depositApy: 0.12,
      });

      const expected = 1200 * (Math.pow(1 + 0.12, DAYS_IN_MONTH / DAYS_IN_YEAR) - 1);
      expect(result.toDecimal()).toBeCloseTo(expected, 4);
    });

    it('handles multiple payment periods by withdrawing the scheduled payment each cycle', () => {
      const calculator = new TradeoffComparison({ periodDays: 15 });

      const result = calculator.estimateSavingsWithDeposits({
        principal: 600,
        periodCount: 2,
        loanRate: 0,
        depositApy: 0.10,
      });

      const dailyRate = Math.pow(1 + 0.1, 1 / DAYS_IN_YEAR) - 1;
      let balance = 600;
      for (let i = 0; i < 2; i += 1) {
        for (let d = 0; d < 15; d += 1) {
          balance += balance * dailyRate;
        }
        balance -= 300;
      }
      const expected = balance;

      expect(result.toDecimal()).toBeCloseTo(expected, 4);
    });
  });

  describe('estimateNetLoanCost', () => {
    it('subtracts deposit earnings from loan finance charges', () => {
      const calculator = new TradeoffComparison({ periodDays: DAYS_IN_MONTH });

      const result = calculator.estimateNetLoanCost({
        principal: 1000,
        periodCount: 1,
        loanRate: 0.06,
        depositApy: 0.04,
      });

      const loanInterest = 1000 * (0.06 / 12);
      const depositInterest = 1000 * (Math.pow(1 + 0.04, DAYS_IN_MONTH / DAYS_IN_YEAR) - 1);
      const expectedNet = loanInterest - depositInterest;

      expect(result.toDecimal()).toBeCloseTo(expectedNet, 4);
    });
  });
});
