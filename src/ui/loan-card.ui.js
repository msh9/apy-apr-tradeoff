import { LitElement, html } from 'lit';

import { Account as LoanAccount } from '../accounts/loan.js';

import { tradeoffWidgetStyles } from './tradeoff-widget.styles.js';

const currencyFormatter = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

class LoanCard extends LitElement {
  static properties = {
    principal: { type: Number },
    mode: { type: String },
    startDate: { type: String, attribute: 'start-date' },
    currency: { type: String },
    loanRateInput: { state: true },
    termMonthsInput: { state: true },
    paymentValue: { state: true },
    interestValue: { state: true },
  };

  constructor() {
    super();
    this.principal = undefined;
    this.mode = 'idealized';
    this.startDate = '';
    this.currency = 'USD';
    this.loanRateInput = '';
    this.termMonthsInput = '';
    this.paymentValue = Number.NaN;
    this.interestValue = Number.NaN;
  }

  updated(changed) {
    if (changed.has('principal')) {
      this._calculate();
    }
  }

  render() {
    const paymentText = this._formatMaybeCurrency(this.paymentValue);
    const interestText = this._formatMaybeCurrency(this.interestValue);

    return html`
      <article class="option-card loan-card">
        <div class="pill-link">
          <span class="strategy-pill">Loan + Savings Strategy</span>
        </div>
        <div class="card-heading">
          <h2>Loan</h2>
          <p class="subtitle">Spread payments over time.</p>
        </div>

        <div class="field-group">
          <p class="group-label">Term Loan Information</p>
          <div class="field">
            <label for="loanRate">Loan Nominal Annual Rate</label>
            <p class="helper">Enter 0% for promotional offers.</p>
            <input
              id="loanRate"
              name="loanRate"
              type="number"
              step="0.01"
              inputmode="decimal"
              min="0"
              placeholder="e.g. 5.5"
              .value=${this.loanRateInput}
              @input=${this._onInput}
            />
          </div>

          <div class="field">
            <label for="termMonths">How long will you take to pay? (months)</label>
            <p class="helper">Used for loan payment calculations.</p>
            <input
              id="termMonths"
              name="termMonths"
              type="number"
              step="1"
              inputmode="numeric"
              min="1"
              placeholder="e.g. 12"
              .value=${this.termMonthsInput}
              @input=${this._onInput}
              required
            />
          </div>
        </div>

        <div class="mini-results">
          <p>
            <span class="label">Monthly payment:</span>
            <span data-role="loan-payment">${paymentText}</span>
          </p>
          <p>
            <span class="label">Total interest paid:</span>
            <span data-role="loan-interest">${interestText}</span>
          </p>
        </div>
      </article>
    `;
  }

  get loan() {
    const parsed = this._buildLoanAccount();
    return parsed?.loanAccount ?? null;
  }

  _onInput(event) {
    const { name, value } = event.target;
    const stateKey = `${name}Input`;
    if (stateKey in this) {
      this[stateKey] = value;
    }
    this._calculate();
  }

  _calculate() {
    const { loanAccount, monthlyPayment, totalInterest } = this._buildLoanAccount() || {};

    if (!loanAccount) {
      this.paymentValue = Number.NaN;
      this.interestValue = Number.NaN;
      this._emitChange({ valid: false });
      return;
    }

    this.paymentValue = monthlyPayment;
    this.interestValue = totalInterest;
    this._emitChange({
      valid: true,
      principal: this.principal,
      mode: this.mode,
      startDate: this.startDate,
      termMonths: loanAccount.periodCount,
      loanRate: loanAccount.nominalAnnualRate.toDecimal(),
      loanAccount,
      monthlyPayment,
      totalInterest,
    });
  }

  _buildLoanAccount() {
    if (!Number.isFinite(this.principal) || this.principal < 0) {
      return null;
    }

    const termMonths = this._parseInteger(this.termMonthsInput);
    const ratePercent = this._parseNumber(this.loanRateInput);
    if (termMonths === null || ratePercent === null) {
      return null;
    }
    if (termMonths <= 0 || ratePercent < 0) {
      return null;
    }

    const loanRate = ratePercent / 100;
    try {
      const loanAccount = new LoanAccount(termMonths, 'MONTH', loanRate, this.principal);
      const payment = loanAccount.payment().toDecimal();
      const totalInterest = loanAccount.totalInterest().toDecimal();
      return { loanAccount, monthlyPayment: payment, totalInterest };
    } catch {
      return null;
    }
  }

  _emitChange(detail) {
    this.dispatchEvent(
      new CustomEvent('loan-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  _parseNumber(value) {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    const parsed = Number.parseFloat(String(value).trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  _parseInteger(value) {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    const parsed = Number.parseInt(String(value).trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  _formatMaybeCurrency(value, { fallback = '—' } = {}) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    try {
      return currencyFormatter(Math.abs(value), this.currency);
    } catch {
      return currencyFormatter(Math.abs(value), 'USD');
    }
  }

  static styles = tradeoffWidgetStyles;
}

customElements.define('loan-card', LoanCard);
export { LoanCard };
