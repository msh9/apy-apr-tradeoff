/**
 * Loan represents very simple (with simple interest!) fixed term loans and related utility functions.
 * @module loan
 */

import { Amount } from './mini-money';

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
  constructor(periodCount, periodType, rate, principal) {}

  /**
   * Returns the computed payment schedule for the loan using equal sized payments across all payment periods. In
   * certain cases where the loan amount does not divide equally the final payment may be larger.
   * @method paymentSchedule
   * @returns {Array[Amount]} Returns an array of Amount objects, one for each period.
   */
  paymentSchedule() {}

  /**
   * Returns the total interest paid over the life of the account. Again, this is not a real banking system so the
   * calculation assumings that all payments are made on the exact due date and for the exact amount owed.
   * @method totalInterest
   * @returns {Amount} Returns an amount representing the interest charge
   */
  totalInterest() {}
}

export { Account };
