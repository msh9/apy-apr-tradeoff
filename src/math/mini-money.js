/**
 * Provides a small library for processing currency values accurately and avoids use of floating point
 * mathematics for monetary values.
 * @module mini-money
 */

const FIXED_PRECISION = 20;
const SCALE = 10n ** BigInt(FIXED_PRECISION);

function assertAmount(candidate) {
  if (!(candidate instanceof Amount)) {
    throw new Error('other must be an Amount');
  }
}

/**
 * Represents a specific monetary value, ie $18.43
 * @class Amount
 */
class Amount {
  #integerValue;
  /**
   * @param {number|} value The monetary value to represent
   */
  constructor(value) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      throw new Error('Value must be a finite number');
    }
    //TODO: this needs to use bigint math and also update all of the below methods that return
    //new amounts to correctly pass through bigints instead of converting back and forth

    this.#integerValue = BigInt(Math.trunc(value * 10 ** FIXED_PRECISION));
  }

  static #_fromAmountInteger(integer) {
    const amount = new Amount(0);
    amount.#integerValue = integer;
    return amount;
  }

  /**
   * adds an amount to this amount, adding an amount of greater precision with first reduce that amounts
   * precision, adding an amount of lower precision to this amount will lower the resulting amount's precision.
   * @method addTo
   * @param {Amount} augend The other amount to add to this amount, returning a new Amount
   * @returns {Amount}
   */
  addTo(augend) {
    assertAmount(augend);

    const resultValue = this.#integerValue + augend.#integerValue;

    return Amount.#_fromAmountInteger(resultValue);
  }

  /**
   * removes an amount from this amount, removing an amount of greater precision will first reduce that amounts
   * precision, removing an amount of lower precision from this amount will lower the resulting amount's precision.
   * @method subtractFrom
   * @param {Amount} subtrahend The other amount to subtract from this amount, returning a new Amount
   * @returns {Amount}
   */
  subtractFrom(subtrahend) {
    assertAmount(subtrahend);

    const resultValue = this.#integerValue - subtrahend.#integerValue;

    return Amount.#_fromAmountInteger(resultValue);
  }

  /**
   * multiplies this amount by the other amount, an amount of greater precision will first be reduced to this amount's
   * precision, an amount of lower precision from this amount will lower the resulting amount's precision.
   * @method multiplyBy
   * @param {Amount} multiplicand The other amount to multiply by this amount, returning a new Amount
   * @returns {Amount}
   */
  multiplyBy(multiplicand) {
    assertAmount(multiplicand);

    const product = this.#integerValue * multiplicand.#integerValue;
    const resultValue = product / SCALE;

    return Amount.#_fromAmountInteger(resultValue);
  }

  /**
   * divides this amount by the other amount, an amount of greater precision will first be reduced to this amount's
   * precision, an amount of lower precision from this amount will lower the resulting amount's precision.
   * @method divideBy
   * @param {Amount} divisor The other amount to divide this amount by, returning a new Amount
   * @returns {Amount}
   */
  divideBy(divisor) {
    assertAmount(divisor);

    if (divisor.#integerValue === 0n) {
      throw new Error('Cannot divide by zero');
    }

    const numerator = this.#integerValue * SCALE;
    const resultValue = numerator / divisor.#integerValue;

    return Amount.#_fromAmountInteger(resultValue);
  }

  /**
   * Lossy conversion to a decimal number.
   * @returns {number}
   */
  toDecimal() {
    return Number(this.#integerValue) / Number(SCALE);
  }

  /**
   * Raises this amount to a non-negative integer power using repeated multiplication.
   * @param {number} exponent The exponent to apply, must be a whole number >= 0
   * @returns {Amount}
   */
  pow(exponent) {
    if (!Number.isInteger(exponent) || exponent < 0) {
      throw new Error('Exponent must be a non-negative integer');
    }

    if (exponent === 0) {
      return new Amount(1);
    }

    let result = new Amount(1);
    for (let i = 0; i < exponent; i += 1) {
      result = result.multiplyBy(this);
    }

    return result;
  }

  /**
   * Checks for equality with another instance of Amount
   * @param {Amount} other Another instance of the Amount object to check for equality
   * @returns {boolean} True if the internal fixed precision representations are equal, false otherwise
   */
  equals(other) {
    assertAmount(other);

    return this.#integerValue === other.#integerValue;
  }

  /**
   * lessThan compares this instance of amount against another instance of amount
   * @param {Amount} other Another instance of Amount to be compared
   * @returns {boolean} True if this instance of Amount is strictly less than the other instance of Amount
   */
  lessThan(other) {
    assertAmount(other);

    return this.#integerValue < other.#integerValue;
  }
}

export { Amount, FIXED_PRECISION };
