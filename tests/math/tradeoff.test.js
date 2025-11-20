import { describe, expect, it } from 'vitest';

import { financialCalendar } from '../../src/math/constants.js';
import { Account as DepositAccount } from '../../src/math/deposit.js';
import { Account as LoanAccount } from '../../src/math/loan.js';
import { Amount } from '../../src/math/mini-money.js';
import { TradeoffComparison } from '../../src/math/tradeoff.js';

function calculateDepositEarnings({ principal, periodCount, loanRate, depositApy, periodDays }) {
  const loanAccount = new LoanAccount(periodCount, 'MONTH', loanRate, principal);
  const depositAccount = new DepositAccount(principal, depositApy);
  const paymentAmount = loanAccount.payment();
  const periodicRate = new Amount(loanRate / financialCalendar.monthsInYear);
  const zero = new Amount(0);
  let outstandingPrincipal = loanAccount.principal;

  for (let i = 0; i < periodCount; i += 1) {
    depositAccount.accrueForDays(periodDays);
    let interestPortion = zero;
    if (periodicRate.integerValue !== 0) {
      interestPortion = outstandingPrincipal.multiplyBy(periodicRate);
    }
    let principalPortion = paymentAmount.subtractFrom(interestPortion);
    const isFinalPeriod = i === periodCount - 1;

    if (
      principalPortion.integerValue <= 0 ||
      principalPortion.integerValue > outstandingPrincipal.integerValue ||
      isFinalPeriod
    ) {
      principalPortion = outstandingPrincipal;
    }

    depositAccount.withdraw(principalPortion.toDecimal());
    outstandingPrincipal = outstandingPrincipal.subtractFrom(principalPortion);
  }

  return depositAccount.balance.toDecimal();
}

describe('TradeoffComparison', () => {
  describe('estimateSavingsWithDeposits', () => {
    it('returns the savings created by investing the principal during a zero-interest loan period', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });

      const result = calculator.estimateSavingsWithDeposits({
        principal: 1200,
        periodCount: 1,
        loanRate: 0,
        depositApy: 0.12,
      });

      const expected =
        1200 *
        (Math.pow(1 + 0.12, financialCalendar.daysInMonth / financialCalendar.daysInYear) - 1);
      expect(result.toDecimal()).toBeCloseTo(expected, 4);
    });

    it('handles multiple payment periods by withdrawing the scheduled payment each cycle', () => {
      const calculator = new TradeoffComparison({ periodDays: 15 });

      const result = calculator.estimateSavingsWithDeposits({
        principal: 600,
        periodCount: 2,
        loanRate: 0,
        depositApy: 0.1,
      });

      const dailyRate = Math.pow(1 + 0.1, 1 / financialCalendar.daysInYear) - 1;
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
    it('subtracts deposit earnings from loan finance charges for single period loan', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });

      const result = calculator.estimateNetLoanCost({
        principal: 1000,
        periodCount: 1,
        loanRate: 0.06,
        depositApy: 0.04,
      });

      const loanInterest = 5;
      const depositInterest = calculateDepositEarnings({
        principal: 1000,
        periodCount: 1,
        loanRate: 0.06,
        depositApy: 0.04,
        periodDays: financialCalendar.daysInMonth,
      });
      const expectedNet = loanInterest - depositInterest;

      expect(result.toDecimal()).toBeCloseTo(expectedNet, 4);
    });

    it('subtracts deposit earnings from loan finance charges for a six month loan', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });
      const purchaseAmount = 5280.45;
      const result = calculator.estimateNetLoanCost({
        principal: purchaseAmount,
        periodCount: 6,
        loanRate: 0.06,
        depositApy: 0.042,
      });

      // testing against a directly computed value from a spreadsheet
      expect(result.toDecimal()).toBeCloseTo(28.1565, 4);
    });

    it('subtracts deposit earnings from loan finance charges for a 18 month loan', () => {
      const calculator = new TradeoffComparison({ periodDays: financialCalendar.daysInMonth });
      const purchaseAmount = 2034.4;
      const result = calculator.estimateNetLoanCost({
        principal: purchaseAmount,
        periodCount: 18,
        loanRate: 0.06,
        depositApy: 0.04,
      });

      expect(result.toDecimal()).toBeCloseTo(33.8545, 4);
    });
  });
});
