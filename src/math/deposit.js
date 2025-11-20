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

import { financialCalendar } from './constants.js';
import { Amount } from './mini-money.js';

/**
 * Provides functions for interacting with a deposit account on a periodic basis.
 * @class Account
 */
class Account {
  /**
   * "Opens" an account with a opening balance and the percentage yield to be used for subsequent calculations.
   *  Values may be specified as numbers of as Amounts. Values provided as JS numbers will be converted to Amounts
   *  using the global Amount.precision.
   * @param {number|Amount} openingBalance The opening account balance, defaults to zero
   * @param {number|Amount} apy The annual percentage yield for the account, defaults to zero
   */
  constructor(openingBalance = 0, apy = 0) {
    this._balance = new Amount(openingBalance);
    this._apy = new Amount(apy);
    // We do the following calculation once and acknowledge here that it is likely only accurate to ~15 places
    // because we're using JS' number representation to perform it. See MDN for more information,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#number_encoding
    // Ultimately, we have to determine the 365th root somehow in order to go from a APY to a daily rate (
    // assuming daily componding.)

    this._dailyRate = new Amount(Math.pow(1 + apy, 1 / financialCalendar.daysInYear) - 1);
  }

  /**
   * Returns the account's configured apy as an Amount
   * @property {Amount} apy
   */
  get apy() {
    return this._apy;
  }

  /**
   * Returns the deposit account's current balance as an Amount
   * @property {Amount} balance
   */
  get balance() {
    return this._balance;
  }

  /**
   * Sets the deposit account's current balance. Values provided as a number will be converted to an
   * Amount using the global Amount.precision.
   * @property balance
   * @param {number|Amount} newBalance The new balance
   */
  set balance(newBalance) {
    this._balance = newBalance instanceof Amount ? newBalance : new Amount(newBalance);
  }

  /**
   * Withdraw a specified amount of funds from the account. Withdrawal amounts specified as a JS number
   * will be converted to Amounts using the global Amount.precision.
   * @param {number|Amount} withdrawal The amount to withdraw from the account
   * @returns {Account} This account updated by the withdrawal
   */
  withdraw(withdrawal) {
    const withdrawalAmount = new Amount(withdrawal);

    if (withdrawalAmount.integerValue < 0) {
      throw new Error('Withdrawal must be zero or greater');
    }

    this._balance = this._balance.subtractFrom(withdrawalAmount);

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

    for (let i = 0; i < days; i++) {
      this._balance = this._balance.addTo(this._balance.multiplyBy(this._dailyRate));
    }

    return this;
  }
}

export { Account };
