/**
 * Loan represents very simple (with simple interest!) fixed term loans and related utility functions.
 * @module loan
 */

import { financialCalendar } from './constants.js';
import { Amount } from './mini-money.js';

const PERIODS_PER_YEAR = {
  MONTH: financialCalendar.monthsInYear,
  WEEK: financialCalendar.weeksInYear,
};

function roundDownToCents(value) {
  return Math.floor(value * 100) / 100;
}

/**
 * Loan account represents fixed term simple interest installment loans, complete with functions to introspect
 * the results of the loan over time. This class makes key assumptions to simplify this utility calculator,
 * 1) interest is simple and not compounding
 * 2) principal repayment is amortized across all payment periods, which the final payment being the largest if the
 * amount does not evenly divide
 * @class Account
 */
class Account {
  /**
   * Creates a immutable loan account. This class does not attempt to emulate a real banking system and therefore does
   * not
   * support payments over time. Instead it calculates a fixed payment schedule and total interest assuming that the
   * 'user' of the loan makes payments on the due date exactly as perscribed by the payment schedule.
   * @param {number} periodCount The number of periods in this loan
   * @param {string} periodType The type of period, either 'MONTH' or 'WEEK', to be used
   * @param {number|Amount} rate The simple, non-compound, nominal annual interest charge associated with this loan
   * @param {number|Amount} principal The amount of money being loaned
   */
  constructor(periodCount, periodType, rate, principal) {
    if (!Number.isInteger(periodCount) || periodCount <= 0) {
      throw new Error('Period count must be a positive integer');
    }

    const normalizedPeriodType = typeof periodType === 'string' ? periodType.toUpperCase() : '';
    const periodsPerYear = PERIODS_PER_YEAR[normalizedPeriodType];

    if (!periodsPerYear) {
      throw new Error('Unsupported period type');
    }

    const apr = rate instanceof Amount ? rate.toDecimal() : rate;
    if (typeof apr !== 'number' || Number.isNaN(apr) || !Number.isFinite(apr) || apr < 0) {
      throw new Error('Rate must be a non-negative finite number');
    }

    const principalAmount = principal instanceof Amount ? principal : new Amount(principal);
    if (principalAmount.integerValue < 0) {
      throw new Error('Principal must be zero or greater');
    }

    this.periodCount = periodCount;
    this.periodType = normalizedPeriodType;
    this.apr = apr;
    this.principal = principalAmount;
    this._periodsPerYear = periodsPerYear;
    this._periodicRate = periodsPerYear ? apr / periodsPerYear : 0;
    this._cachedPaymentDecimal = undefined;
  }

  /**
   * Returns the computed payment schedule for the loan using equal sized payments across all payment periods. In
   * certain cases where the loan amount does not divide equally the final payment may be larger.
   * @method paymentSchedule
   * @returns {Array[Amount]} Returns an array of Amount objects, one for each period.
   */
  paymentSchedule() {
    const payment = this._getPaymentDecimal();

    return Array.from({ length: this.periodCount }, () => new Amount(payment));
  }

  /**
   * Returns the total interest paid over the life of the account. Again, this is not a real banking system so the
   * calculation assumings that all payments are made on the exact due date and for the exact amount owed.
   * @method totalInterest
   * @returns {Amount} Returns an amount representing the interest charge
   */
  totalInterest() {
    if (this._periodicRate === 0) {
      return new Amount(0);
    }

    const payment = this._getPaymentDecimal();
    const totalPaid = payment * this.periodCount;
    const rawInterest = Math.max(0, totalPaid - this.principal.toDecimal());
    const flooredInterest = roundDownToCents(rawInterest);
    const fractionalPenny = rawInterest - flooredInterest;

    // Preserve "borrower-friendly" rounding unless nearly a full penny would be lost.
    const finalInterest = fractionalPenny >= 0.0095 ? rawInterest : flooredInterest;

    return new Amount(finalInterest);
  }

  _getPaymentDecimal() {
    if (this._cachedPaymentDecimal === undefined) {
      this._cachedPaymentDecimal = this._calculatePaymentDecimal();
    }

    return this._cachedPaymentDecimal;
  }

  _calculatePaymentDecimal() {
    const principalValue = this.principal.toDecimal();

    if (principalValue === 0) {
      return 0;
    }

    if (this._periodicRate === 0) {
      // Zero interest loans round down to the nearest cent for every payment, favoring the borrower.
      const basePayment = principalValue / this.periodCount;
      return roundDownToCents(basePayment);
    }

    const numerator = principalValue * this._periodicRate;
    const denominator = 1 - Math.pow(1 + this._periodicRate, -this.periodCount);

    return numerator / denominator;
  }
}

export { Account };
