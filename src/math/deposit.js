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

import { Amount } from './mini-money.js';

const toAmount = (value, precisionHint) => {
  if (value instanceof Amount) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Value must be a finite number');
    }

    return precisionHint !== undefined ? new Amount(value, precisionHint) : new Amount(value);
  }

  throw new Error('Value must be a number or Amount');
};

/**
 * Provides functions for interacting with a deposit account on a periodic basis.
 * @class Account
 */
class Account {
  /**
   * "Opens" an account with a opening balance and the percentage yield to be used for subsequent calculations.
   *  Values may be specified as numbers of as Amounts. Values provided as JS numbers will be converted to Amounts
   *  with a 10-digit precision.
   * @param {number|Amount} openingBalance The opening account balance, defaults to zero
   * @param {number|Amount} apy The annual percentage yield for the account, defaults to zero
   */
  constructor(openingBalance = 0, apy = 0) {
    this._balance = toAmount(openingBalance);
    this._apy = toAmount(apy);
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
   * Amount with a 10-digit precision.
   * @property balance
   * @param {number|Amount} newBalance The new balance
   */
  set balance(newBalance) {
    this._balance = toAmount(newBalance);
  }

  /**
   * Withdraw a specified amount of funds from the account. Withdrawal amounts specified as a JS number
   * will be converted to Amounts with a 10-digit precision.
   * @param {number|Amount} withdrawal The amount to withdraw from the account
   * @returns {Account} This account updated by the withdrawal
   */
  withdraw(withdrawal) {
    const withdrawalAmount = toAmount(withdrawal, this._balance.precision);

    if (withdrawalAmount.integerValue < 0) {
      throw new Error('Withdrawal must be zero or greater');
    }

    if (withdrawalAmount.integerValue > this._balance.integerValue) {
      throw new Error('Insufficient funds for withdrawal');
    }

    this._balance.subtractFrom(withdrawalAmount);

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

    const balanceDecimal = this._balance.toDecimal();
    const apyDecimal = this._apy.toDecimal();

    const dailyFactor = (1 + apyDecimal) ** (1 / 365);
    const accruedBalance = balanceDecimal * dailyFactor ** days;

    this._balance = new Amount(accruedBalance, this._balance.precision);

    return this;
  }
}

export { Account };
