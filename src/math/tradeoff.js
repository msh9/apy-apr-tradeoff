/**
 * Provides helpers for comparing payoff strategies that mix loan financing with deposit account yields.
 * @module tradeoff
 */

import { financialCalendar } from './constants.js';
import { Account as DepositAccount } from './deposit.js';
import { Account as LoanAccount } from './loan.js';
import { Amount } from './mini-money.js';

/**
 * TradeoffComparison coordinates scenarios where a borrower keeps cash invested while paying a loan.
 * @class TradeoffComparison
 */
class TradeoffComparison {
  /**
   * Creates a comparison helper.
   * @param {object} [options]
   * @param {number} [options.periodDays=30] Number of days to simulate between loan payments
   */
  constructor({ periodDays = 30 } = {}) {
    this.periodDays = periodDays;
  }

  /**
   * Computes the value of pairing a zero interest (or low interest) loan with a deposit account.
   * @param {object} options
   * @param {number} options.principal Purchase amount that will be both borrowed and deposited
   * @param {number} options.periodCount Loan period count
   * @param {number} [options.loanRate=0] Nominal annual loan rate, defaults to zero for promo loans
   * @param {number} options.depositApy Deposit account APY as a decimal
   * @returns {import('./mini-money.js').Amount}
   */
  estimateSavingsWithDeposits(options) {
    const { depositAccount } = this.simulateScenario(options);
    return depositAccount.balance;
  }

  /**
   * Computes the reduced net cost of an interest-bearing loan after applying deposit yield earned during repayment.
   * @param {object} options
   * @param {number} options.principal Purchase amount that will be both borrowed and deposited
   * @param {number} options.periodCount Loan period count
   * @param {number} options.loanRate Nominal annual loan rate as a decimal
   * @param {number} options.depositApy Deposit account APY as a decimal
   * @returns {import('./mini-money.js').Amount}
   */
  estimateNetLoanCost(options) {
    const { loanAccount, depositAccount } = this.simulateScenario(options);
    const loanInterest = loanAccount.totalInterest();
    const depositSavings = depositAccount.balance;

    return loanInterest.subtractFrom(depositSavings);
  }

  simulateScenario({ principal, periodCount, loanRate = 0, depositApy }) {
    const loanAccount = new LoanAccount(periodCount, 'MONTH', loanRate, principal);
    const depositAccount = new DepositAccount(principal, depositApy);
    const paymentAmount = loanAccount.payment();
    const periods = periodCount;
    const monthlyRateDecimal =
      (loanRate instanceof Amount ? loanRate.toDecimal() : loanRate || 0) /
      financialCalendar.monthsInYear;
    const periodicRate = new Amount(monthlyRateDecimal);
    const zero = new Amount(0);
    let outstandingPrincipal = loanAccount.principal;

    for (let i = 0; i < periods; i += 1) {
      if (outstandingPrincipal.integerValue === 0) {
        break;
      }

      depositAccount.accrueForDays(this.periodDays);

      let interestPortion = zero;
      if (periodicRate.integerValue !== 0) {
        interestPortion = outstandingPrincipal.multiplyBy(periodicRate);
      }

      let principalPortion = paymentAmount.subtractFrom(interestPortion);

      const isFinalPeriod = i === periods - 1;
      if (
        principalPortion.integerValue <= 0 ||
        principalPortion.integerValue > outstandingPrincipal.integerValue
      ) {
        principalPortion = outstandingPrincipal;
      } else if (isFinalPeriod) {
        principalPortion = outstandingPrincipal;
      }

      depositAccount.withdraw(principalPortion.toDecimal());
      outstandingPrincipal = outstandingPrincipal.subtractFrom(principalPortion);
    }

    return { loanAccount, depositAccount };
  }
}

export { TradeoffComparison };
