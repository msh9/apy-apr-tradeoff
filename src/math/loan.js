/**
 * Loan represents very simple (with simple interest!) fixed term loans and related utility functions.
 * @module loan
 */

import { financialCalendar } from './constants.js';
import { Amount } from './mini-money.js';

const MONTHS_PER_YEAR = financialCalendar.monthsInYear;
const MONTHS_PER_YEAR_AMOUNT = new Amount(MONTHS_PER_YEAR);

function roundDownToCents(value) {
  const decimalValue = value instanceof Amount ? value.toDecimal() : value;
  const floored = Math.floor(decimalValue * 100) / 100;
  return new Amount(floored);
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
  #periodicRate;
  #cachedPaymentAmount = undefined;
  /**
   * Creates a immutable loan account. This class does not attempt to emulate a real banking system and therefore does
   * not
   * support payments over time. Instead it calculates a fixed payment schedule and total interest assuming that the
   * 'user' of the loan makes payments on the due date exactly as perscribed by the payment schedule.
   * @param {number} periodCount The number of periods in this loan
   * @param {string} periodType The type of period, only 'MONTH' is supported
   * @param {number|Amount} rate The simple, non-compound, nominal annual interest charge associated with this loan
   * @param {number|Amount} principal The amount of money being loaned
   */
  constructor(periodCount, periodType, rate, principal) {
    if (!Number.isInteger(periodCount) || periodCount <= 0) {
      throw new Error('Period count must be a positive integer');
    }
    if (principal < 0) {
      throw new Error('Principal must be zero or greater');
    }

    const normalizedPeriodType = typeof periodType === 'string' ? periodType.toUpperCase() : '';

    if (normalizedPeriodType !== 'MONTH') {
      throw new Error('Unsupported period type');
    }

    if (typeof rate !== 'number' || Number.isNaN(rate) || !Number.isFinite(rate) || rate < 0) {
      throw new Error('Rate must be a non-negative finite number');
    }
    this.nominalAnnualRate = rate instanceof Amount ? rate : new Amount(rate);

    this.periodCount = periodCount;
    this.periodType = normalizedPeriodType;
    this.principal = principal instanceof Amount ? principal : new Amount(principal);
    this.#periodicRate = this.nominalAnnualRate.divideBy(MONTHS_PER_YEAR_AMOUNT);
    this.#cachedPaymentAmount = undefined;
  }

  /**
   * Returns the computed payment amount for each period of the loan.
   * @method payment
   * @returns {Amount} payment amount per period
   */
  payment() {
    return this.#getPaymentAmount();
  }

  /**
   * Returns the total interest paid over the life of the account. Again, this is not a real banking system so the
   * calculation assumings that all payments are made on the exact due date and for the exact amount owed.
   * @method totalInterest
   * @returns {Amount} Returns an amount representing the interest charge
   */
  totalInterest() {
    const fixedZero = new Amount(0);
    if (this.#periodicRate.equals(fixedZero)) {
      return fixedZero;
    }

    const payment = this.#getPaymentAmount();
    const totalPaidAmount = payment.multiplyBy(new Amount(this.periodCount));
    const rawInterestAmount = totalPaidAmount.subtractFrom(this.principal);

    if (rawInterestAmount.lessThan(fixedZero) || rawInterestAmount.equals(fixedZero)) {
      return fixedZero;
    }

    const flooredInterest = roundDownToCents(rawInterestAmount);
    const fractionalPenny = rawInterestAmount.toDecimal() - flooredInterest.toDecimal();

    // Preserve "borrower-friendly" rounding unless nearly a full penny would be lost.
    if (fractionalPenny >= 0.0095) {
      return rawInterestAmount;
    }

    return flooredInterest;
  }

  #getPaymentAmount() {
    if (this.#cachedPaymentAmount === undefined) {
      this.#cachedPaymentAmount = this.#calculatePaymentAmount();
    }

    return this.#cachedPaymentAmount;
  }

  #calculatePaymentAmount() {
    const fixedZero = new Amount(0);
    if (this.principal.equals(fixedZero)) {
      return fixedZero;
    }

    if (this.#periodicRate.equals(fixedZero)) {
      // Zero interest loans round down to the nearest cent for every payment, favoring the borrower.
      const basePayment = this.principal.divideBy(new Amount(this.periodCount));
      return roundDownToCents(basePayment);
    }

    const ratePlusOne = this.#periodicRate.addTo(new Amount(1));
    const growthFactor = ratePlusOne.pow(this.periodCount);
    const numerator = this.principal.multiplyBy(this.#periodicRate).multiplyBy(growthFactor);
    const denominator = growthFactor.subtractFrom(new Amount(1));

    return numerator.divideBy(denominator);
  }
}

export { Account };
