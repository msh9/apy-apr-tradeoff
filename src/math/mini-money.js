/**
 * Provides a small library for processing currency values accurately and avoids use of floating point
 * mathematics for monetary values.
 * @module mini-money
 */
import { defaults } from './constants';

function assertAmount(candidate) {
  if (!(candidate instanceof Amount)) {
    throw new Error('other must be an Amount');
  }
}

function scaleIntegerValue(integerValue, currentPrecision, targetPrecision) {
  if (currentPrecision === targetPrecision) {
    return integerValue;
  }

  const precisionDiff = targetPrecision - currentPrecision;

  if (precisionDiff > 0) {
    return integerValue * 10 ** precisionDiff;
  }

  const divisor = 10 ** Math.abs(precisionDiff);
  return Math.trunc(integerValue / divisor);
}

/**
 * Represents a specific monetary value, ie $18.43
 * @class Amount
 */
class Amount {
  /**
   * @param {number} value The monetary value to represent
   * @param {integerValue} precision How many places after the decimal to retain and matain calculation accuracy
   */
  constructor(value, precision = defaults.ioPrecision) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      throw new Error('Value must be a finite number');
    }

    this.precision = precision;

    const scale = 10 ** this.precision;
    this.integerValue = Math.trunc(value * scale);
  }

  get precision() {
    return this._precision;
  }

  set precision(precision) {
    if (!Number.isInteger(precision)) {
      throw new Error('Precision must be an integer number');
    }

    if (precision < 0) {
      throw new Error('Precision must be zero or greater');
    }

    if (this._precision !== undefined) {
      throw new Error('Precision may not be changed');
    }

    this._precision = precision;
  }

  /**
   * adds an amount to this amount, adding an amount of greater precision with first reduce that amounts
   * precision, adding an amount of lower precision to this amount will lower **this** amount's precision.
   * @method addTo
   * @param {Amount} other The other amount to add to this amount, updating this amount
   * @returns {Amount}
   */
  addTo(other) {
    assertAmount(other);

    const targetPrecision = Math.min(this.precision, other.precision);

    if (this.precision !== targetPrecision) {
      this.integerValue = scaleIntegerValue(this.integerValue, this.precision, targetPrecision);
      this._precision = targetPrecision;
    }

    const otherValue = scaleIntegerValue(other.integerValue, other.precision, targetPrecision);

    this.integerValue += otherValue;

    return this;
  }

  /**
   * removes an amount from this amount, removing an amount of greater precision will first reduce that amounts
   * precision, removing an amount of lower precision from this amount will lower **this** amount's precision.
   * @method subtractFrom
   * @param {Amount} other The other amount to subtract from this amount, updating this amount
   * @returns {Amount}
   */
  subtractFrom(other) {
    assertAmount(other);

    const targetPrecision = Math.min(this.precision, other.precision);

    if (this.precision !== targetPrecision) {
      this.integerValue = scaleIntegerValue(this.integerValue, this.precision, targetPrecision);
      this._precision = targetPrecision;
    }

    const otherValue = scaleIntegerValue(other.integerValue, other.precision, targetPrecision);

    this.integerValue -= otherValue;

    return this;
  }

  /**
   * multiplies this amount by the other amount, an amount of greater precision will first be reduced to this amount's
   * precision, an amount of lower precision from this amount will lower **this** amount's precision.
   * @method multiplyBy
   * @param {Amount} other The other amount to multiply by this amount, updating this amount
   * @returns {Amount}
   */
  multiplyBy(other) {
    assertAmount(other);

    const targetPrecision = Math.min(this.precision, other.precision);

    if (this.precision !== targetPrecision) {
      this.integerValue = scaleIntegerValue(this.integerValue, this.precision, targetPrecision);
      this._precision = targetPrecision;
    }

    const otherValue = scaleIntegerValue(other.integerValue, other.precision, targetPrecision);

    const scale = 10 ** targetPrecision;
    const product = this.integerValue * otherValue;

    this.integerValue = Math.round(product / scale);

    return this;
  }

  /**
   * raises (exponent) this amount by the other amount, an amount of greater precision will first be
   * reduced to this amount's precision, an amount of lower precision from this amount will lower **this** amount's
   * precision.
   * @method raiseBy
   * @param {Amount} other The other amount to raise this amount, updating this amount
   * @returns {Amount}
   */
  raiseBy(other) {
    assertAmount(other);

    const targetPrecision = Math.min(this.precision, other.precision);

    if (this.precision !== targetPrecision) {
      this.integerValue = scaleIntegerValue(this.integerValue, this.precision, targetPrecision);
      this._precision = targetPrecision;
    }

    const alignedExponent = scaleIntegerValue(other.integerValue, other.precision, targetPrecision);

    const scale = 10 ** targetPrecision;
    const baseDecimal = this.integerValue / scale;
    const exponentDecimal = alignedExponent / scale;
    const resultDecimal = baseDecimal ** exponentDecimal;

    this.integerValue = Math.round(resultDecimal * scale);

    return this;
  }
}

export { Amount };
