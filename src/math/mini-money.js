/**
 * Provides a small library for processing currency values accurately and avoids use of floating point
 * mathematics for monetary values.
 * @module mini-money
 */

const FIXED_PRECISION = 20;
const SCALE = 10 ** FIXED_PRECISION;

function assertAmount(candidate) {
  if (!(candidate instanceof Amount)) {
    throw new Error('other must be an Amount');
  }
}

function createAmount(integerValue) {
  const amount = Object.create(Amount.prototype);
  amount.integerValue = integerValue;
  return amount;
}

/**
 * Represents a specific monetary value, ie $18.43
 * @class Amount
 */
class Amount {
  /**
   * @param {number} value The monetary value to represent
   */
  constructor(value) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      throw new Error('Value must be a finite number');
    }

    this.integerValue = Math.trunc(value * SCALE);
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

    const resultValue = this.integerValue + augend.integerValue;

    return createAmount(resultValue);
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

    const resultValue = this.integerValue - subtrahend.integerValue;

    return createAmount(resultValue);
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

    const product = this.integerValue * multiplicand.integerValue;
    const resultValue = Math.trunc(product / SCALE);

    return createAmount(resultValue);
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

    if (divisor.integerValue === 0) {
      throw new Error('Cannot divide by zero');
    }

    const numerator = this.integerValue * SCALE;
    const resultValue = Math.trunc(numerator / divisor.integerValue);

    return createAmount(resultValue);
  }

  /**
   * Converts the internal integer representation to a decimal number.
   * @returns {number}
   */
  toDecimal() {
    return this.integerValue / SCALE;
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
}

export { Amount, FIXED_PRECISION };
