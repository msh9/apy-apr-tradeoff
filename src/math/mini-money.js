import DecimalImpl from 'decimal.js';

/**
 * @module mini-money
 */

const FIXED_PRECISION = 20;
const ROUNDING_MODES = {
  bankers: DecimalImpl.ROUND_HALF_EVEN,
  conventional: DecimalImpl.ROUND_HALF_UP,
  none: null,
};

DecimalImpl.set({ precision: 40 });

function assertAmount(candidate) {
  if (!(candidate instanceof Amount)) {
    throw new Error('other must be an Amount');
  }
}

function normalizeRoundingOptions(options = {}) {
  const { roundingMode = 'none', decimalPlaces } = options;

  if (!Object.prototype.hasOwnProperty.call(ROUNDING_MODES, roundingMode)) {
    throw new Error('roundingMode must be one of bankers, conventional, or none');
  }

  if (decimalPlaces !== undefined && (!Number.isInteger(decimalPlaces) || decimalPlaces < 0)) {
    throw new Error('decimalPlaces must be a non-negative integer when provided');
  }

  return {
    roundingMode,
    decimalPlaces: decimalPlaces ?? (roundingMode === 'none' ? undefined : 2),
  };
}

function applyOptionalRounding(decimalValue, options) {
  const { roundingMode, decimalPlaces } = normalizeRoundingOptions(options);
  if (roundingMode === 'none') {
    return decimalValue;
  }

  return decimalValue.toDecimalPlaces(decimalPlaces, ROUNDING_MODES[roundingMode]);
}

/**
 * Represents a specific monetary value, ie $18.43. Backed by decimal.js to provide higher precision
 * and optional rounding strategies for monetary values.
 * @class Amount
 */
class Amount {
  #decimalValue;

  /**
   * @param {number|string|Amount|DecimalImpl} value The monetary value to represent
   */
  constructor(value) {
    if (value instanceof Amount) {
      this.#decimalValue = value.#decimalValue;
      return;
    }

    if (value instanceof DecimalImpl) {
      this.#decimalValue = value;
      return;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      if (Number.isNaN(Number(value)) || !Number.isFinite(Number(value))) {
        throw new Error('Value must be a finite number');
      }

      this.#decimalValue = new DecimalImpl(value);
      return;
    }

    throw new Error('Value must be a number, string, Amount, or Decimal');
  }

  static #fromDecimal(decimalValue, roundingOptions) {
    const roundedValue = applyOptionalRounding(decimalValue, roundingOptions);
    const amount = new Amount(0);
    amount.#decimalValue = roundedValue;
    return amount;
  }

  /**
   * adds an amount to this amount
   * @method addTo
   * @param {Amount} augend The other amount to add to this amount, returning a new Amount
   * @param {object} [options]
   * @param {'bankers'|'conventional'|'none'} [options.roundingMode] Optional rounding strategy
   * @param {number} [options.decimalPlaces] Decimal places to round to when rounding is requested
   * @returns {Amount}
   */
  addTo(augend, options) {
    assertAmount(augend);

    const resultValue = this.#decimalValue.add(augend.#decimalValue);

    return Amount.#fromDecimal(resultValue, options);
  }

  /**
   * removes an amount from this amount
   * @method subtractFrom
   * @param {Amount} subtrahend The other amount to subtract from this amount, returning a new Amount
   * @param {object} [options]
   * @param {'bankers'|'conventional'|'none'} [options.roundingMode] Optional rounding strategy
   * @param {number} [options.decimalPlaces] Decimal places to round to when rounding is requested
   * @returns {Amount}
   */
  subtractFrom(subtrahend, options) {
    assertAmount(subtrahend);

    const resultValue = this.#decimalValue.sub(subtrahend.#decimalValue);

    return Amount.#fromDecimal(resultValue, options);
  }

  /**
   * multiplies this amount by the other amount
   * @method multiplyBy
   * @param {Amount} multiplicand The other amount to multiply by this amount, returning a new Amount
   * @param {object} [options]
   * @param {'bankers'|'conventional'|'none'} [options.roundingMode] Optional rounding strategy
   * @param {number} [options.decimalPlaces] Decimal places to round to when rounding is requested
   * @returns {Amount}
   */
  multiplyBy(multiplicand, options) {
    assertAmount(multiplicand);

    const product = this.#decimalValue.mul(multiplicand.#decimalValue);

    return Amount.#fromDecimal(product, options);
  }

  /**
   * divides this amount by the other amount
   * @method divideBy
   * @param {Amount} divisor The other amount to divide this amount by, returning a new Amount
   * @param {object} [options]
   * @param {'bankers'|'conventional'|'none'} [options.roundingMode] Optional rounding strategy
   * @param {number} [options.decimalPlaces] Decimal places to round to when rounding is requested
   * @returns {Amount}
   */
  divideBy(divisor, options) {
    assertAmount(divisor);

    if (divisor.#decimalValue.isZero()) {
      throw new Error('Cannot divide by zero');
    }

    const quotient = this.#decimalValue.div(divisor.#decimalValue);

    return Amount.#fromDecimal(quotient, options);
  }

  /**
   * Lossy conversion to a decimal number. Limited to JS number precision.
   * @returns {number}
   */
  toDecimal() {
    return this.#decimalValue.toNumber();
  }

  /**
   * Returns a string representation of this amount that is precise to 20 digits.
   * @returns {string}
   */
  toPreciseString() {
    return this.#decimalValue.toFixed(FIXED_PRECISION);
  }

  /**
   * Returns the nth root of this Amount using decimal arithmetic.
   * @param {number} exponent The root to take, must be a positive integer
   * @param {object} [options]
   * @param {'bankers'|'conventional'|'none'} [options.roundingMode] Optional rounding strategy
   * @param {number} [options.decimalPlaces] Decimal places to round to when rounding is requested
   * @returns {Amount}
   */
  nthRoot(exponent, options) {
    if (!Number.isInteger(exponent) || exponent <= 0) {
      throw new Error('Exponent must be a positive integer');
    }

    if (this.#decimalValue.isNegative()) {
      throw new Error('Cannot take nthRoot of a negative amount');
    }

    if (exponent === 1) {
      return this;
    }

    if (this.#decimalValue.isZero()) {
      return new Amount(0);
    }

    const exponentDecimal = new DecimalImpl(1).div(exponent);
    const root = this.#decimalValue.pow(exponentDecimal);

    return Amount.#fromDecimal(root, options);
  }

  /**
   * Raises this amount to a non-negative integer power.
   * @param {number} exponent The exponent to apply, must be a whole number >= 0
   * @param {object} [options]
   * @param {'bankers'|'conventional'|'none'} [options.roundingMode] Optional rounding strategy
   * @param {number} [options.decimalPlaces] Decimal places to round to when rounding is requested
   * @returns {Amount}
   */
  pow(exponent, options) {
    if (!Number.isInteger(exponent) || exponent < 0) {
      throw new Error('Exponent must be a non-negative integer');
    }

    if (exponent === 0) {
      return new Amount(1);
    }

    const result = this.#decimalValue.pow(exponent);

    return Amount.#fromDecimal(result, options);
  }

  /**
   * Checks for equality with another instance of Amount
   * @param {Amount} other Another instance of the Amount object to check for equality
   * @returns {boolean} True if the internal fixed precision representations are equal, false otherwise
   */
  equals(other) {
    assertAmount(other);

    return this.#decimalValue.equals(other.#decimalValue);
  }

  /**
   * lessThan compares this instance of amount against another instance of amount
   * @param {Amount} other Another instance of Amount to be compared
   * @returns {boolean} True if this instance of Amount is strictly less than the other instance of Amount
   */
  lessThan(other) {
    assertAmount(other);

    return this.#decimalValue.lessThan(other.#decimalValue);
  }
}

export { Amount, FIXED_PRECISION };
