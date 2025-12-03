import { describe, expect, it } from 'vitest';

import { financialCalendar } from '../../src/math/constants.js';
import { TradeoffComparison } from '../../src/math/tradeoff.js';

describe('TradeoffComparison', () => {
  describe('simulateScenario savings behavior', () => {
    it('returns positive net when deposit earnings exceed withdrawals', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });

      const { net } = calculator.simulateScenario({
        principal: 1200,
        periodCount: 1,
        loanRate: 0,
        depositApy: 0.12,
      });

      const expected =
        1200 *
        (Math.pow(1 + 0.12, financialCalendar.daysInMonth / financialCalendar.daysInYear) - 1);
      expect(net.toDecimal()).toBeCloseTo(expected, 4);
    });

    it('matches independent monthly simulation for multiple payments', () => {
      const calculator = new TradeoffComparison({ periodDays: 15 });

      const scenario = calculator.simulateScenario({
        principal: 600,
        periodCount: 2,
        loanRate: 0,
        depositApy: 0.1,
      });

      const dailyRate = Math.pow(1 + 0.1, 1 / financialCalendar.daysInYear) - 1;
      const payment = scenario.loanAccount.payment().toDecimal();
      let balance = 600;
      for (let i = 0; i < 2; i += 1) {
        for (let d = 0; d < 15; d += 1) {
          balance += balance * dailyRate;
        }
        balance -= payment;
      }

      expect(scenario.net.toDecimal()).toBeCloseTo(balance, 4);
    });
  });

  describe('simulateScenario neutral behavior', () => {
    it('returns net zero when finance charges and apy are zero', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });

      const scenario = calculator.simulateScenario({
        principal: 1000,
        periodCount: 6,
        loanRate: 0,
        depositApy: 0,
      });

      /**
       * Because we also round in favor of the debtor it is possible to end up with a few leftover pennies instead of
       * the loan and deposit account netting out to zero. We take the easy way out here because this is not actually
       * banking software and merely assert that result is within one decimal place of zero.
       */
      expect(scenario.net.toDecimal()).toBeCloseTo(0, 1);
    });
  });

  describe('simulateScenario net cost behavior', () => {
    it('returns negative net when finance charges exceed savings for a single period', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });

      const scenario = calculator.simulateScenario({
        principal: 1000,
        periodCount: 1,
        loanRate: 0.06,
        depositApy: 0.04,
      });

      expect(scenario.net.toDecimal()).toBeCloseTo(-1.66337, 4);
    });

    it('matches spreadsheet-derived results for a six month loan', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });
      const purchaseAmount = 5280.45;

      const scenario = calculator.simulateScenario({
        principal: purchaseAmount,
        periodCount: 6,
        loanRate: 0.06,
        depositApy: 0.042,
      });

      // computed in spreadsheet
      expect(scenario.net.toDecimal()).toBeCloseTo(-28.1568, 4);
    });

    it('matches spreadsheet-derived results for an 18 month loan', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });
      const purchaseAmount = 2034.4;

      const scenario = calculator.simulateScenario({
        principal: purchaseAmount,
        periodCount: 18,
        loanRate: 0.06,
        depositApy: 0.04,
      });

      // computed in spreadsheet
      expect(scenario.net.toDecimal()).toBeCloseTo(-33.8545, 4);
    });
  });

  describe('simulateScenario credit card comparisons', () => {
    it('returns credit card rewards and one-cycle interest alongside deposit net', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });
      const purchaseAmount = 500;
      const ccRewardsRate = 0.015;
      const ccRate = 0.2899;

      const scenario = calculator.simulateScenario({
        principal: purchaseAmount,
        periodCount: 1,
        loanRate: 0,
        depositApy: 0,
        ccRewardsRate,
        ccRate,
      });

      const expectedRewards = purchaseAmount * ccRewardsRate;
      const expectedInterest =
        purchaseAmount *
        (Math.pow(1 + ccRate / financialCalendar.daysInYear, financialCalendar.daysInMonth) - 1);

      expect(scenario.creditCardRewards.toDecimal()).toBeCloseTo(expectedRewards, 8);
      expect(scenario.creditCardInterest.toDecimal()).toBeCloseTo(expectedInterest, 8);
      expect(Math.abs(scenario.net.toDecimal())).toBeLessThan(0.02);
    });

    it('uses the configured period days when computing credit card interest', () => {
      const calculator = new TradeoffComparison({ periodDays: 15 });
      const ccRate = 0.25;

      const scenario = calculator.simulateScenario({
        principal: 200,
        periodCount: 1,
        loanRate: 0,
        depositApy: 0,
        ccRewardsRate: 0,
        ccRate,
      });

      const expectedInterest = 200 * (Math.pow(1 + ccRate / financialCalendar.daysInYear, 15) - 1);
      expect(scenario.creditCardInterest.toDecimal()).toBeCloseTo(expectedInterest, 8);
    });
  });
});
