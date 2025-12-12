import { LitElement, html } from 'lit';

import './loan-savings-card.ui.js';
import './credit-card-card.ui.js';
import { formatMaybeCurrency } from './formatting.ui.js';
import { tradeoffWidgetStyles } from './tradeoff-widget.styles.js';

const EMPTY_METRICS = Object.freeze({
  loanPayment: Number.NaN,
  loanInterest: Number.NaN,
  depositInterest: Number.NaN,
  savingsEndBalance: Number.NaN,
  loanSavingsCost: Number.NaN,
  cardRewards: Number.NaN,
  cardInterest: Number.NaN,
  cardNetCost: Number.NaN,
});

class TradeoffWidget extends LitElement {
  static properties = {
    principalInput: { state: true },
    startDateInput: { state: true },
    modeInput: { state: true },
    errorMessage: { state: true },
    metrics: { state: true },
    currency: { type: String },
    periodDays: { type: Number, attribute: 'period-days' },
  };

  constructor() {
    super();
    this.principalInput = '';
    this.startDateInput = '';
    this.modeInput = 'idealized';
    this.errorMessage = '';
    this.metrics = null;
    this._currency = 'USD';
    this.periodDays = undefined;
    this._loanSavingsData = null;
    this._ccData = null;
  }

  get currency() {
    return this._currency;
  }

  set currency(value) {
    const normalized = value || 'USD';
    const previous = this._currency;
    this._currency = normalized;
    this.requestUpdate('currency', previous);
  }

  render() {
    const metrics = this.metrics || EMPTY_METRICS;

    return html`
      <article class="tradeoff-shell">
        ${this._renderIntro()} ${this._renderGlobalInputs()} ${this._renderCards()}
        ${this._renderSummary(metrics)}
        <p class="error" data-role="error" role="alert">${this.errorMessage}</p>
      </article>
    `;
  }

  _onSubmit(event) {
    event.preventDefault();
  }

  _onInput(event) {
    const { name, value } = event.target;
    const stateKey = `${name}Input`;
    if (stateKey in this) {
      this[stateKey] = value;
    }
    this.errorMessage = '';
    if (value === '') {
      this._clearResult();
    }
    if (name === 'principal') {
      const parsed = this._parseMoney(value);
      if (parsed === null) {
        return;
      }
      if (parsed < 0) {
        this._setError('Enter a positive value for the amount.');
        return;
      }
      this.errorMessage = '';
      return;
    }
    if (name === 'startDate' || name === 'mode') {
      if (this.modeInput === 'real' || this.modeInput === 'real-world') {
        const parsedDate = this._parseDate(this.startDateInput);
        if (parsedDate === null) {
          return;
        }
      }
      this.errorMessage = '';
    }
  }

  _onCcChange(event) {
    const detail = event.detail || {};
    if (!detail.valid) {
      this._ccData = null;
      this._updateMetrics();
      return;
    }
    this._ccData = detail;
    this._updateMetrics();
  }

  _onLoanSavingsChange(event) {
    const detail = event.detail || {};
    if (!detail.valid) {
      this._loanSavingsData = null;
      if (detail.errorMessage) {
        this._setError(detail.errorMessage);
      }
      this._updateMetrics();
      return;
    }
    this.errorMessage = '';
    this._loanSavingsData = detail;
    this._updateMetrics();
  }

  _updateMetrics() {
    const loanSavings = this._loanSavingsData?.valid ? this._loanSavingsData : null;
    const ccData = this._ccData?.valid ? this._ccData : null;
    const cardRewardsValue = ccData?.rewardsValue ?? Number.NaN;
    const cardInterestValue = ccData?.interestValue ?? Number.NaN;
    const cardNetCost =
      Number.isFinite(cardInterestValue) && Number.isFinite(cardRewardsValue)
        ? cardInterestValue - cardRewardsValue
        : Number.NaN;

    this.metrics = {
      loanPayment: loanSavings?.loanPayment ?? Number.NaN,
      loanInterest: loanSavings?.loanInterest ?? Number.NaN,
      depositInterest: loanSavings?.depositInterest ?? Number.NaN,
      savingsEndBalance: loanSavings?.savingsEndBalance ?? Number.NaN,
      loanSavingsCost: loanSavings?.loanSavingsCost ?? Number.NaN,
      cardRewards: cardRewardsValue,
      cardInterest: cardInterestValue,
      cardNetCost,
    };

    this._emitChange({
      principal: loanSavings?.principal ?? null,
      depositApy: loanSavings?.depositApy,
      mode: loanSavings?.mode ?? this.modeInput,
      startDate: loanSavings?.startDate,
      netValue: loanSavings?.netValue,
      creditCardRewards: cardRewardsValue,
      creditCardInterest: cardInterestValue,
    });
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

  _renderIntro() {
    return html`
      <header class="intro">
        <p class="eyebrow">Loan, savings, credit card</p>
        <h1>Comparing a loan, loan + savings account, and a credit card</h1>
      </header>
    `;
  }

  _renderGlobalInputs() {
    return html`
      <section class="solar-card global-card">
        <div class="field">
          <label for="principal">Purchase amount</label>
          <p class="helper">Total price</p>
          <input
            id="principal"
            name="principal"
            type="number"
            step="0.01"
            inputmode="decimal"
            min="0"
            placeholder="e.g. 1200"
            .value=${this.principalInput}
            @input=${this._onInput}
            required
          />
        </div>

        <div class="timing-row">
          <div class="field compact">
            <label for="mode">Calculation mode</label>
            <p class="helper">
              Real world is slightly more accurate when you know your loan start date.
            </p>
            <select id="mode" name="mode" .value=${this.modeInput} @input=${this._onInput}>
              <option value="idealized">Idealized (31-day months)</option>
              <option value="real">Real world calendar</option>
            </select>
          </div>

          ${this.modeInput === 'real'
            ? html`
                <div class="field compact">
                  <label for="startDate">Start date</label>
                  <p class="helper">Needed only for the real-world calendar option.</p>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    placeholder="Starting date for schedule"
                    .value=${this.startDateInput}
                    @input=${this._onInput}
                    ?required=${this.modeInput === 'real'}
                  />
                </div>
              `
            : null}
        </div>
      </section>
    `;
  }

  _renderCards() {
    return html`
      <section class="cards-wrapper">
        <loan-savings-card
          .principal=${this._principalValue()}
          .mode=${this.modeInput}
          .startDate=${this.startDateInput}
          .currency=${this.currency}
          .periodDays=${this.periodDays}
          @loan-savings-change=${this._onLoanSavingsChange}
        ></loan-savings-card>

        <credit-card-card
          .principal=${this._principalValue()}
          .currency=${this.currency}
          .periodDays=${this.periodDays}
          @cc-change=${this._onCcChange}
        ></credit-card-card>
      </section>
    `;
  }

  _renderSummary(metrics) {
    const loanInterestText = formatMaybeCurrency(metrics.loanInterest, this.currency);
    const loanSavingsCostText = formatMaybeCurrency(metrics.loanSavingsCost, this.currency);
    const ccRewardsText = formatMaybeCurrency(metrics.cardRewards, this.currency);
    const ccInterestText = formatMaybeCurrency(metrics.cardInterest, this.currency);

    return html`
      <section class="solar-card summary-card">
        <div class="bullets">
          <p>
            <span class="bullet-label">Loan + savings net benefit/cost:</span>
            <span data-role="loan-savings-cost">${loanSavingsCostText}</span>
          </p>
          <p><span class="bullet-label">Plain loan cost:</span> ${loanInterestText}</p>
          <p><span class="bullet-label">Credit reward:</span> <span>${ccRewardsText}</span></p>
          <p>
            <span class="bullet-label">One cycle credit card cost if not paid:</span>
            <span>${ccInterestText}</span>
          </p>
        </div>
      </section>
    `;
  }

  _setError(message) {
    this.errorMessage = message;
    this._clearResult();
  }

  _clearResult() {
    this._loanSavingsData = null;
    this._ccData = null;
    this.metrics = null;
  }

  _principalValue() {
    const parsed = Number.parseFloat(String(this.principalInput).trim());
    return Number.isFinite(parsed) ? parsed : null;
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

  _parseDate(value) {
    if (!value) {
      this._setError('Select a start date for real world mode.');
      return null;
    }

    const normalized = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      this._setError('Enter a valid calendar date (YYYY-MM-DD).');
      return null;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      this._setError('Enter a valid calendar date (YYYY-MM-DD).');
      return null;
    }

    return normalized;
  }

  static styles = tradeoffWidgetStyles;
}

customElements.define('tradeoff-widget', TradeoffWidget);
export { TradeoffWidget };
