/**
 * Provides helpers for comparing payoff strategies that mix loan financing with deposit account yields.
 * @module tradeoff
 */

import { Account as CreditCardAccount } from './accounts/credit-card.js';
import { Account as DepositAccount } from './accounts/deposit.js';
import { Account as LoanAccount } from './accounts/loan.js';
import { addMonthsPreserveDay, daysBetween, normalizeDate } from './math/calendar.js';
import { financialCalendar } from './math/constants.js';

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
  simulateScenario({
    principal,
    periodCount,
    loanRate = 0,
    depositApy,
    ccRewardsRate = 0,
    ccRate = 0,
    mode = 'idealized',
    startDate,
  }) {
    const normalizedMode = typeof mode === 'string' ? mode.toLowerCase() : 'idealized';
    const useRealMode = normalizedMode === 'real' || normalizedMode === 'real-world';

    const loanAccount = new LoanAccount(periodCount, 'MONTH', loanRate, principal);
    const depositAccount = new DepositAccount(principal, depositApy);
    const creditCardAccount = new CreditCardAccount({ apr: ccRate, rewardsRate: ccRewardsRate });
    const creditCardRewards = creditCardAccount.calculateRewards(principal);
    const periodDays = Number.isInteger(this.periodDays)
      ? this.periodDays
      : financialCalendar.daysInMonth;
    const creditCardInterest = creditCardAccount.interestForDays(principal, periodDays);

    const resultNet = useRealMode
      ? this.#simulateRealWorld({
          depositAccount,
          loanAccount,
          periodCount,
          startDate,
        })
      : this.#simulateIdealized({ depositAccount, loanAccount, periodCount });

    return {
      loanAccount,
      depositAccount,
      creditCardAccount,
      creditCardRewards,
      creditCardInterest,
      net: resultNet,
    };
  }

  #simulateIdealized({ depositAccount, loanAccount, periodCount }) {
    const daysPerPeriod = Number.isInteger(this.periodDays)
      ? this.periodDays
      : financialCalendar.daysInMonth;
    const paymentAmount = loanAccount.payment();
    for (let i = 0; i < periodCount; i += 1) {
      depositAccount.accrueForDays(daysPerPeriod);
      depositAccount.withdraw(paymentAmount);
    }

    return depositAccount.balance;
  }

  #simulateRealWorld({ depositAccount, loanAccount, periodCount, startDate }) {
    if (!startDate) {
      throw new Error('startDate is required for real world mode');
    }

    const anchorDate = normalizeDate(startDate);
    const paymentAmount = loanAccount.payment();
    const schedule = this.#buildPaymentSchedule(anchorDate, periodCount);

    let accrualStart = anchorDate;
    for (const dueDate of schedule) {
      const daysUntilDue = daysBetween(accrualStart, dueDate);
      if (daysUntilDue < 0) {
        throw new Error('Payment schedule produced an invalid date ordering');
      }
      depositAccount.accrueForDaysWithMonthlyPosting(daysUntilDue, accrualStart);
      depositAccount.withdraw(paymentAmount);
      accrualStart = dueDate;
    }

    return depositAccount.balance;
  }

  #buildPaymentSchedule(startDate, periodCount) {
    const schedule = [];
    for (let i = 1; i <= periodCount; i += 1) {
      schedule.push(addMonthsPreserveDay(startDate, i));
    }
    return schedule;
  }
}

export { TradeoffComparison };
