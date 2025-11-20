/**
 * Provides helpers for comparing payoff strategies that mix loan financing with deposit account yields.
 * @module tradeoff
 */

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
   * @param {number} [options.periodDays=31] Number of days to simulate between loan payments
   */
  constructor({ periodDays = 31 } = {}) {
    this.periodDays = periodDays;
  }

  /**
   * Computes the value of pairing a zero interest (or low interest) loan with a deposit account.
   * @param {object} options
   * @param {number} options.principal Purchase amount that will be both borrowed and deposited
   * @param {number} options.periodCount Loan period count
   * @param {number} [options.loanRate=0] Nominal annual loan rate, defaults to zero for promo loans
   * @param {number} options.depositApy Deposit account APY as a decimal
   * @returns {Amount}
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
   * @returns {Amount}
   */
  estimateNetLoanCost(options) {
    const { depositAccount } = this.simulateScenario(options);
    const netCost = depositAccount.balance.multiplyBy(new Amount(-1));

    return netCost;
  }

  simulateScenario({ principal, periodCount, loanRate = 0, depositApy }) {
    const loanAccount = new LoanAccount(periodCount, 'MONTH', loanRate, principal);
    const depositAccount = new DepositAccount(principal, depositApy);

    for (let i = 0; i < periodCount; i++) {
      depositAccount.accrueForDays(this.periodDays);
      depositAccount.withdraw(loanAccount.payment());
    }

    return { loanAccount, depositAccount };
  }
}

export { TradeoffComparison };
