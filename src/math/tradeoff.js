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
