/**
 * Provides helpers for comparing payoff strategies that mix loan financing with deposit account yields.
 * @module tradeoff
 */

import { Account as DepositAccount } from './deposit.js';
import { Account as LoanAccount } from './loan.js';

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
   * 
   * @param {object} scenario Settings for the comparison
   * @param {number} scenario.principal The purcahse amount that will also be used for loan principal
   * @param {number} scenario.periodCount The number of periods (usually months) to evaluate the loan and deposit
   *  account
   * @param {number} [scenario.loanRate=0] The nominal annual rate for the loan, defaulting to zero, as a decimal
   * @param {number} [scenario.depositApy] The apy used for deposit account interest accrual
   * @param {number} [scenario.ccRewardsRate] The decimal percentage rate for calculating comparative credit card
   *  rewards
   * @param {number} [scenario.ccRate] The decimal percentage APR for the credit card
   * @returns {object} The net comparison between loan cost and deposit accruals and the underlying account models
   */
  simulateScenario({ principal, periodCount, loanRate = 0, depositApy }) {
    const loanAccount = new LoanAccount(periodCount, 'MONTH', loanRate, principal);
    const depositAccount = new DepositAccount(principal, depositApy);
    const paymentValue = loanAccount.payment().toDecimal();

    for (let i = 0; i < periodCount; i++) {
      depositAccount.accrueForDays(this.periodDays);
      depositAccount.withdraw(paymentValue);
    }

    const net = depositAccount.balance;

    return { loanAccount, depositAccount, net };
  }
}

export { TradeoffComparison };
