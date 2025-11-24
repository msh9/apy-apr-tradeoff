import { LitElement, css, html } from 'lit';

import { TradeoffComparison } from '../math/tradeoff.js';

const currencyFormatter = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

class TradeoffWidget extends LitElement {
  static properties = {
    loanRateInput: { state: true },
    apyInput: { state: true },
    principalInput: { state: true },
    termMonthsInput: { state: true },
    errorMessage: { state: true },
    resultText: { state: true },
    currency: { type: String },
    periodDays: { type: Number, attribute: 'period-days' },
  };

  constructor() {
    super();
    this.loanRateInput = '';
    this.apyInput = '';
    this.principalInput = '';
    this.termMonthsInput = '';
    this.errorMessage = '';
    this.resultText = 'dollars gained or lost';
    this._currency = 'USD';
    this.periodDays = undefined;
    this._calculator = new TradeoffComparison();
    this._lastNetValue = undefined;
  }

  updated(changed) {
    if (changed.has('periodDays')) {
      const days = Number.isFinite(this.periodDays) ? this.periodDays : undefined;
      this._calculator = new TradeoffComparison({ periodDays: days });
      this._calculateIfReady();
    }
  }

  get currency() {
    return this._currency;
  }

  set currency(value) {
    const normalized = value || 'USD';
    const previous = this._currency;
    this._currency = normalized;
    this.requestUpdate('currency', previous);

    if (Number.isFinite(this._lastNetValue)) {
      this._updateResult(this._lastNetValue);
    }
  }

  render() {
    return html`
      <section class="card">
        <div class="header">
          <div class="pill">Loan vs APY Widget</div>
        </div>
        <form @submit=${this._onSubmit} novalidate>
          <div class="field">
            <label for="loanRate"><span>Nominal Annual Loan Rate</span></label>
            <input
              id="loanRate"
              name="loanRate"
              type="number"
              step="0.01"
              inputmode="decimal"
              min="0"
              placeholder="Annual Loan Rate (defaults to 0%)"
              .value=${this.loanRateInput}
              @input=${this._onInput}
            />
          </div>

          <div class="field">
            <label for="apy"><span>APY</span></label>
            <input
              id="apy"
              name="apy"
              type="number"
              step="0.01"
              inputmode="decimal"
              min="0"
              placeholder="Deposit account APY"
              .value=${this.apyInput}
              @input=${this._onInput}
              required
            />
          </div>

          <div class="field">
            <label for="principal"><span>Amount</span></label>
            <input
              id="principal"
              name="principal"
              type="number"
              step="0.01"
              inputmode="decimal"
              min="0"
              placeholder="Purchase amount"
              .value=${this.principalInput}
              @input=${this._onInput}
              required
            />
          </div>

          <div class="field">
            <label for="termMonths"><span>Term</span></label>
            <input
              id="termMonths"
              name="termMonths"
              type="number"
              step="1"
              inputmode="numeric"
              min="1"
              placeholder="Number of months to pay"
              .value=${this.termMonthsInput}
              @input=${this._onInput}
              required
            />
          </div>
        </form>

        <div class="divider" aria-hidden="true">
          <span>•</span>
          <span>•</span>
          <span>•</span>
        </div>

        <div class="field result-block">
          <label for="result"><span>Net Benefit (Cost)</span></label>
          <output id="result" data-role="result" aria-live="polite">${this.resultText}</output>
        </div>

        <p class="error" data-role="error" role="alert">${this.errorMessage}</p>
      </section>
    `;
  }

  _onSubmit(event) {
    event.preventDefault();
  }

  _onInput(event) {
    const { name, value } = event.target;
    this[`${name}Input`] = value;
    this.errorMessage = '';
    if (value === '') {
      this._clearResult();
    }
    this._calculateIfReady();
  }

  _calculateIfReady() {
    const principal = this._parseMoney(this.principalInput);
    if (principal === null) {
      this._clearResult();
      return;
    }
    if (principal < 0) {
      this._setError('Enter a positive value for the amount.');
      return;
    }

    const termMonths = this._parseInteger(this.termMonthsInput);
    if (termMonths === null) {
      this._clearResult();
      return;
    }
    if (termMonths <= 0) {
      this._setError('Enter a positive value for the term.');
      return;
    }

    const apyPercent = this._parseMoney(this.apyInput);
    if (apyPercent === null) {
      this._clearResult();
      return;
    }
    if (apyPercent < 0) {
      this._setError('APY must be zero or greater.');
      return;
    }

    const ratePercent = this._parseMoney(this.loanRateInput);
    if (ratePercent !== null && ratePercent < 0) {
      this._setError('Rate must be zero or greater.');
      return;
    }

    const loanRate = ratePercent === null ? 0 : ratePercent / 100;
    const depositApy = apyPercent / 100;

    const scenario = this._calculator.simulateScenario({
      principal,
      periodCount: termMonths,
      loanRate,
      depositApy,
    });

    const netValue = scenario?.net?.toDecimal ? scenario.net.toDecimal() : Number.NaN;
    this._lastNetValue = Number.isFinite(netValue) ? netValue : undefined;
    this._updateResult(this._lastNetValue);
    this._emitChange({ principal, termMonths, loanRate, depositApy, netValue });
  }

  _emitChange(detail) {
    this.dispatchEvent(
      new CustomEvent('tradeoff-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  _updateResult(netValue) {
    if (!Number.isFinite(netValue)) {
      this.resultText = 'dollars gained or lost';
      return;
    }

    const isCost = netValue < 0;
    const formatted = this._formatCurrency(Math.abs(netValue));
    this.resultText = `${isCost ? 'Cost' : 'Benefit'}: ${formatted}`;
  }

  _setError(message) {
    this.errorMessage = message;
    this._clearResult();
  }

  _clearResult() {
    this._lastNetValue = undefined;
    this.resultText = 'dollars gained or lost';
  }

  _parseMoney(value) {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    const normalized = String(value).trim();
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
      this._setError('Enter a numeric value.');
      return null;
    }
    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed)) {
      this._setError('Enter a numeric value.');
      return null;
    }
    return parsed;
  }

  _parseInteger(value) {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    const normalized = String(value).trim();
    if (!/^-?\d+$/.test(normalized)) {
      this._setError('Enter a numeric value.');
      return null;
    }
    const parsed = Number.parseInt(normalized, 10);
    if (Number.isNaN(parsed)) {
      this._setError('Enter a numeric value.');
      return null;
    }
    return parsed;
  }

  _formatCurrency(amount) {
    try {
      return currencyFormatter(amount, this.currency);
    } catch {
      return currencyFormatter(amount, 'USD');
    }
  }

  static styles = css`
    :host {
      display: block;
    }

    .card {
      background: var(--tradeoff-bg, #0d0d0f);
      border: 1px solid var(--tradeoff-border, #5a5f66);
      border-radius: 14px;
      padding: 20px;
      color: var(--tradeoff-text, #e6f1ff);
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.35);
      gap: 14px;
      display: grid;
    }

    .header {
      display: flex;
      justify-content: flex-start;
    }

    .pill {
      background: var(--tradeoff-accent, #1e9afd);
      color: #0b1b2b;
      padding: 8px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.2px;
    }

    form {
      display: grid;
      gap: 12px;
    }

    .field {
      display: grid;
      gap: 6px;
    }

    label {
      font-weight: 700;
      font-size: 18px;
    }

    input,
    output {
      background: transparent;
      border: 1px solid var(--tradeoff-input-border, #7c858f);
      border-radius: 4px;
      padding: 10px;
      color: var(--tradeoff-text, #e6f1ff);
      font-size: 15px;
      font-family:
        'IBM Plex Sans',
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        sans-serif;
    }

    output {
      min-height: 40px;
      display: inline-flex;
      align-items: center;
    }

    input:focus {
      outline: 2px solid var(--tradeoff-accent, #1e9afd);
      box-shadow: 0 0 0 2px rgba(30, 154, 253, 0.2);
    }

    .divider {
      text-align: center;
      letter-spacing: 12px;
      color: var(--tradeoff-divider, #7c858f);
      padding: 6px 0;
    }

    .result-block label {
      font-size: 20px;
    }

    .error {
      color: var(--tradeoff-error, #f47676);
      min-height: 18px;
      margin: 0;
      font-size: 13px;
    }

    @media (prefers-color-scheme: light) {
      .card {
        background: var(--tradeoff-bg-light, #fafafa);
        color: var(--tradeoff-text-light, #0d1a26);
        border-color: var(--tradeoff-border-light, #cfd6dd);
      }

      input,
      output {
        color: var(--tradeoff-text-light, #0d1a26);
      }
    }
  `;
}

customElements.define('tradeoff-widget', TradeoffWidget);
export { TradeoffWidget };
