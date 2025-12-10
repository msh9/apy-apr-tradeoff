/**
 * Provides helpers for estimating credit card rewards and interest accrual.
 * @module credit-card
 */

import { financialCalendar } from '../math/constants.js';
import { Amount } from '../math/mini-money.js';

/**
 * Represents a simplified credit card account for calculating rewards and periodic interest accrual.
 * @class Account
 */
class Account {
  #apr;
  #rewardsRate;
  /**
   * @param {object} [options]
   * @param {number} [options.apr=0] Nominal annual percentage rate expressed as a decimal
   * @param {number} [options.rewardsRate=0] Rewards rate expressed as a decimal (e.g., 0.015 = 1.5%)
   */
  constructor({ apr = 0, rewardsRate = 0 } = {}) {
    this.#apr = new Amount(apr);
    this.#rewardsRate = new Amount(rewardsRate);
    const zeroAmount = new Amount(0);

    if (this.#apr.lessThan(zeroAmount)) {
      throw new Error('APR must be zero or greater');
    }
    if (this.#rewardsRate.lessThan(zeroAmount)) {
      throw new Error('Rewards rate must be zero or greater');
    }

    this._dailyRate = this.#apr.divideBy(new Amount(financialCalendar.daysInYear));
  }

  /**
   * Calculates the rewards value earned on a purchase amount.
   * @param {number} purchaseAmount The purchase amount to apply the rewards rate to
   * @returns {Amount} Reward value for the purchase
   */
  calculateRewards(purchaseAmount) {
    if (purchaseAmount < 0) {
      throw new Error('Purchase amount must be zero or greater');
    }
    const amount = new Amount(purchaseAmount);

    return amount.multiplyBy(this.#rewardsRate, { roundingMode: 'bankers', decimalPlaces: 2 });
  }

  /**
   * Calculates the compounded interest accrued over a number of days on an unpaid balance.
   * @param {number} balance The outstanding balance subject to interest
   * @param {number} [days=financialCalendar.daysInMonth] Number of days to accrue interest for
   * @returns {Amount} The interest accrued over the provided period
   */
  interestForDays(balance, days = financialCalendar.daysInMonth) {
    if (!Number.isInteger(days) || days < 0) {
      throw new Error('Days must be a non-negative integer');
    }

    const startingBalance = new Amount(balance);
    const zeroAmount = new Amount(0);
    if (startingBalance.lessThan(zeroAmount)) {
      throw new Error('Balance must be zero or greater');
    }

    if (startingBalance.equals(zeroAmount) || days === 0 || this._dailyRate.equals(zeroAmount)) {
      return new Amount(0);
    }

    let accruedBalance = startingBalance;
    for (let i = 0; i < days; i += 1) {
      accruedBalance = accruedBalance.addTo(accruedBalance.multiplyBy(this._dailyRate));
    }

    const accruedInterest = accruedBalance.subtractFrom(startingBalance);

    return accruedInterest.addTo(new Amount(0), { roundingMode: 'bankers', decimalPlaces: 2 });
  }
}

export { Account };
