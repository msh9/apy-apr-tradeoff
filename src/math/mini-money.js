/**
 * @module mini-money
 * Provides a small library for processing currency values accurately and avoids use of floating point
 * mathematics for monetary values.
 */
import { defaults } from './constants';

/**
 * @class Amount
 * Represents a specific monetary value, ie $18.43
 */
class Amount {
  /**
   *
   * @param {number} value The monetary value to represent
   * @param {integerValue} precision How many places after the decimal to retain and matain calculation accuracy
   */
  constructor(value, precision = defaults.ioPrecision) {
    if (!Number.isInteger(precision)) {
      throw new Error('Precision must be an integer number');
    }
    this.precision = precision;
    this.integerValue = Math.trunc((value * 10) ^ this.precision);
  }

  get precision() {
    return this.precision;
  }

  set precision(precision) {
    throw new Error('Precision may not be changed');
  }

  /**
   * @method addTo adds an amount to this amount, adding an amount of greater precision with first reduce that amounts precision, adding an amount of lower precision to this amount will lower **this** amount's precision.
   * @param {Amount} other The other amount to add to this amount, updating this amount
   * @returns {Amount}
   */
  addTo(other) {
    if ((!other) instanceof Amount) {
      throw new Error('other must be an Amount');
    }
  }

  /**
   * @method subtractFrom removes an amount from this amount, removing an amount of greater precision will first reduce that amounts precision, removing an amount of lower precision from this amount will lower **this** amount's precision.
   * @param {Amount} other The other amount to subtract from this amount, updating this amount
   * @returns {Amount}
   */
  subtractFrom(other) {
    if ((!other) instanceof Amount) {
      throw new Error('other must be an Amount');
    }
  }

  /**
   * @method multiplyBy multiplies this amount by the other amount, an amount of greater precision will first be reduced to this amount's precision, an amount of lower precision from this amount will lower **this** amount's precision.
   * @param {Amount} other The other amount to multiply by this amount, updating this amount
   * @returns {Amount}
   */
  multiplyBy(other) {
    if ((!other) instanceof Amount) {
      throw new Error('other must be an Amount');
    }
  }

  /**
   * @method raiseBy raises (exponent) this amount by the other amount, an amount of greater precision will first be reduced to this amount's precision, an amount of lower precision from this amount will lower **this** amount's precision.
   * @param {Amount} other The other amount to raise this amount, updating this amount
   * @returns {Amount}
   */
  raiseBy(other) {
    if ((!other) instanceof Amount) {
      throw new Error('other must be an Amount');
    }
  }
}

export { Amount };
