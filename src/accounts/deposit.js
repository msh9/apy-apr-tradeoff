/**
 * Provides classes and functions for calculating yield on simple deposit accounts. Generally, the module assumes
 * consumer deposit accounts that accrue daily compounding interest on the full daily balance. It furthermore,
 * assumes that there are no account maintenance fees or transfer fees and that interest rates are constant.
 *
 * Finally, this deposit account **currently** deviates from real-world deposit accounts by immediately adding
 * accrued interest to the account's available value. Real world accounts often only 'deposit' the funds
 * making them available for withdrawal at the end of the statement period. The accrued money is the account
 * holder's funds, but may not be immediately accessible.
 * @module deposit
 */

import { addDays, isSameDay, lastDayOfMonth, normalizeDate } from '../math/calendar.js';
import { financialCalendar } from '../math/constants.js';
import { Amount } from '../math/mini-money.js';

/**
 * Provides functions for interacting with a deposit account on a periodic basis.
 * @class Account
 */
class Account {
  #apy;
  #balance;
  #dailyRate;
  #pendingInterest;
  #interestAccrued;
  /**
   * "Opens" an account with a opening balance and the percentage yield to be used for subsequent calculations.
   *  Values may be specified as numbers of as Amounts. Values provided as JS numbers will be converted to Amounts
   *  using the global Amount.precision.
   * @param {number} openingBalance The opening account balance, defaults to zero
   * @param {number} apy The annual percentage yield for the account, defaults to zero
   */
  constructor(openingBalance = 0, apy = 0) {
    this.#balance = new Amount(openingBalance);
    this.#apy = new Amount(apy);
    this.#pendingInterest = new Amount(0);
    this.#interestAccrued = new Amount(0);

    const one = new Amount(1);
    this.#dailyRate = one.addTo(this.#apy).nthRoot(financialCalendar.daysInYear).subtractFrom(one);
  }

  /**
   * Returns the account's configured apy as an Amount
   * @property {Amount} apy
   */
  get apy() {
    return this.#apy;
  }

  /**
   * Returns the deposit account's current balance as an Amount
   * @property {Amount} balance
   */
  get balance() {
    return this.#balance;
  }

  /**
   * Returns the total interest credited to the account as an Amount
   * @property {Amount} interestAccrued
   */
  get interestAccrued() {
    return this.#interestAccrued;
  }

  /**
   * Sets the deposit account's current balance. Values provided as a number will be converted to an
   * Amount using the global Amount.precision.
   * @property balance
   * @param {number|Amount} newBalance The new balance
   */
  set balance(newBalance) {
    this.#balance = newBalance instanceof Amount ? newBalance : new Amount(newBalance);
  }

  /**
   * Withdraw a specified amount of funds from the account. Withdrawal amounts specified as a JS number
   * will be converted to Amounts using the global Amount.precision.
   * @param {number} withdrawal The amount to withdraw from the account
   * @returns {Account} This account updated by the withdrawal
   */
  withdraw(withdrawal) {
    const withdrawalAmount = new Amount(withdrawal);

    const zeroAmount = new Amount(0);
    if (withdrawalAmount.lessThan(zeroAmount)) {
      throw new Error('Withdrawal must be zero or greater');
    }

    this.#balance = this.#balance.subtractFrom(withdrawalAmount);

    return this;
  }

  /**
   * Calculate and add to principal the accrued interest from a given number of days.
   * @param {integerValue} days A integer number of days to accrue daily compounded interest
   * @returns {Account} This account updated by the accrual
   */
  accrueForDays(days) {
    if (!Number.isInteger(days)) {
      throw new Error('Days must be an integer number');
    }

    if (days < 0) {
      throw new Error('Days must be zero or greater');
    }

    if (days === 0) {
      return this;
    }
    let accruingBalance = new Amount(0);
    for (let i = 0; i < days; i++) {
      accruingBalance = accruingBalance.addTo(
        this.#balance.addTo(accruingBalance).multiplyBy(this.#dailyRate),
      );
    }

    const updatedBalance = this.#balance.addTo(accruingBalance, {
      roundingMode: 'bankers',
      decimalPlaces: 2,
    });
    const postedInterest = updatedBalance.subtractFrom(this.#balance);
    this.#balance = updatedBalance;
    this.#interestAccrued = this.#interestAccrued.addTo(postedInterest);

    return this;
  }

  /**
   * Accrues interest over a span of days while only crediting interest at the end of each calendar month.
   * This mirrors common consumer deposit behavior where daily interest is not immediately available.
   * @param {number} days Number of days to accrue over
   * @param {Date|string|number} startDate Starting calendar date used to find month boundaries
   * @returns {Account} This account updated by the accrual
   */
  accrueForDaysWithMonthlyPosting(days, startDate) {
    if (!Number.isInteger(days)) {
      throw new Error('Days must be an integer number');
    }
    if (days < 0) {
      throw new Error('Days must be zero or greater');
    }
    if (days === 0) {
      return this;
    }
    let currentDate = normalizeDate(startDate);

    for (let i = 0; i < days; i += 1) {
      // Daily compounding: accrue interest on both the posted balance and any unposted (pending) interest.
      const effectiveBalance = this.#balance.addTo(this.#pendingInterest);
      const dailyInterest = effectiveBalance.multiplyBy(this.#dailyRate);
      this.#pendingInterest = this.#pendingInterest.addTo(dailyInterest);

      if (isSameDay(currentDate, lastDayOfMonth(currentDate))) {
        const postedInterest = this.#pendingInterest.addTo(new Amount(0), {
          roundingMode: 'bankers',
          decimalPlaces: 2,
        });
        this.#balance = this.#balance.addTo(postedInterest);
        this.#interestAccrued = this.#interestAccrued.addTo(postedInterest);
        // Drop fractional cents that were not posted; the next month starts fresh.
        this.#pendingInterest = new Amount(0);
      }

      currentDate = addDays(currentDate, 1);
    }

    return this;
  }
}

export { Account };
