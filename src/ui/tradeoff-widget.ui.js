import { LitElement, html } from 'lit';

import { TradeoffComparison } from '../tradeoff.js';
import './loan-savings-card.ui.js';
import './credit-card-card.ui.js';

import { tradeoffWidgetStyles } from './tradeoff-widget.styles.js';

const currencyFormatter = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
const DEFAULT_CC_RATE_PERCENT = 28.99;
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
    this._calculator = new TradeoffComparison();
    this._loanData = null;
    this._depositData = null;
    this._ccData = null;
    this._lastNetValue = undefined;
    this._lastCcRewardsValue = undefined;
    this._lastCcInterestValue = undefined;
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
  }

  render() {
    const metrics = this.metrics || EMPTY_METRICS;

    return html`
      <article class="tradeoff-shell">
        ${this._renderIntro()} ${this._renderGlobalInputs()} ${this._renderCards(metrics)}
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
    this._calculateIfReady();
  }

  _onLoanChange(event) {
    const detail = event.detail || {};
    if (!detail.valid) {
      this._loanData = null;
      this._calculateIfReady();
      return;
    }
    this._loanData = detail;
    this._calculateIfReady();
  }

  _onDepositChange(event) {
    const detail = event.detail || {};
    if (!detail.valid) {
      this._depositData = null;
      this._calculateIfReady();
      return;
    }
    this._depositData = detail;
    this._calculateIfReady();
  }

  _onCcChange(event) {
    const detail = event.detail || {};
    if (!detail.valid) {
      this._ccData = null;
      this._calculateIfReady();
      return;
    }
    this._ccData = detail;
    this._calculateIfReady();
  }

  _calculateIfReady() {
    const modeValue = (this.modeInput || 'idealized').toLowerCase();
    const useRealMode = modeValue === 'real' || modeValue === 'real-world';

    const principal = this._parseMoney(this.principalInput);
    if (principal === null) {
      this._clearResult();
      return;
    }
    if (principal < 0) {
      this._setError('Enter a positive value for the amount.');
      return;
    }

    if (!this._loanData || !this._loanData.valid) {
      this._clearResult();
      return;
    }
    const { termMonths, loanRate } = this._loanData;

    if (!this._depositData || !this._depositData.valid) {
      this._clearResult();
      return;
    }
    const { depositApy } = this._depositData;
    if (!Number.isFinite(depositApy) || depositApy < 0) {
      this._setError('APY must be zero or greater.');
      return;
    }

    let startDate = undefined;
    if (useRealMode) {
      startDate = this._parseDate(this.startDateInput);
      if (startDate === null) {
        this._clearResult();
        return;
      }
    }

    const ccRewardsRate = this._ccData?.valid ? this._ccData.ccRewardsRate : 0;
    const ccRate = this._ccData?.valid ? this._ccData.ccRate : DEFAULT_CC_RATE_PERCENT / 100;

    const scenario = this._calculator.simulateScenario({
      principal,
      periodCount: termMonths,
      loanRate,
      depositApy,
      ccRewardsRate,
      ccRate,
      mode: modeValue,
      startDate,
    });

    const netValue = scenario?.net?.toDecimal ? scenario.net.toDecimal() : Number.NaN;
    this._lastNetValue = Number.isFinite(netValue) ? netValue : undefined;
    const ccRewardsValue = scenario?.creditCardRewards?.toDecimal
      ? scenario.creditCardRewards.toDecimal()
      : Number.NaN;
    const ccInterestValue = scenario?.creditCardInterest?.toDecimal
      ? scenario.creditCardInterest.toDecimal()
      : Number.NaN;
    this._lastCcRewardsValue = Number.isFinite(ccRewardsValue) ? ccRewardsValue : undefined;
    this._lastCcInterestValue = Number.isFinite(ccInterestValue) ? ccInterestValue : undefined;

    const loanPaymentAmount = scenario?.loanAccount?.payment?.();
    const loanPayment = loanPaymentAmount?.toDecimal ? loanPaymentAmount.toDecimal() : Number.NaN;
    const loanInterestAmount = scenario?.loanAccount?.totalInterest?.();
    const loanInterest = loanInterestAmount?.toDecimal
      ? loanInterestAmount.toDecimal()
      : Number.NaN;
    const savingsBalanceAmount = scenario?.depositAccount?.balance;
    const savingsEndBalance = savingsBalanceAmount?.toDecimal
      ? savingsBalanceAmount.toDecimal()
      : Number.NaN;
    const depositInterest =
      Number.isFinite(netValue) && Number.isFinite(loanInterest)
        ? netValue + loanInterest
        : Number.NaN;
    const loanSavingsCost =
      Number.isFinite(netValue) && Number.isFinite(loanInterest)
        ? loanInterest - depositInterest
        : Number.NaN;
    const cardNetCost =
      Number.isFinite(ccInterestValue) && Number.isFinite(ccRewardsValue)
        ? ccInterestValue - ccRewardsValue
        : Number.NaN;

    this.metrics = {
      loanPayment,
      loanInterest,
      depositInterest,
      savingsEndBalance,
      loanSavingsCost,
      cardRewards: ccRewardsValue,
      cardInterest: ccInterestValue,
      cardNetCost,
    };

    this._emitChange({
      principal,
      termMonths,
      loanRate,
      depositApy,
      ccRewardsRate,
      ccRate,
      mode: modeValue,
      startDate,
      netValue,
      creditCardRewards: ccRewardsValue,
      creditCardInterest: ccInterestValue,
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

  _renderCards(metrics) {
    return html`
      <section class="cards-wrapper">
        <loan-savings-card
          .principal=${this._principalValue()}
          .mode=${this.modeInput}
          .startDate=${this.startDateInput}
          .currency=${this.currency}
          .results=${{
            depositInterest: metrics.depositInterest,
            savingsEndBalance: metrics.savingsEndBalance,
            loanSavingsCost: metrics.loanSavingsCost,
            loanInterest: metrics.loanInterest,
          }}
          @loan-change=${this._onLoanChange}
          @deposit-change=${this._onDepositChange}
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
    const loanInterestText = this._formatMaybeCurrency(metrics.loanInterest);
    const loanSavingsCostText = this._formatMaybeCurrency(metrics.loanSavingsCost, {
      fallback: '—',
      sign: true,
    });
    const ccRewardsText = this._formatMaybeCurrency(metrics.cardRewards);
    const ccInterestText = this._formatMaybeCurrency(metrics.cardInterest);

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
    this._lastNetValue = undefined;
    this._lastCcRewardsValue = undefined;
    this._lastCcInterestValue = undefined;
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

  _formatCurrency(amount) {
    try {
      return currencyFormatter(amount, this.currency);
    } catch {
      return currencyFormatter(amount, 'USD');
    }
  }

  _formatMaybeCurrency(value, { fallback = '—', sign = false } = {}) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    const formatted = this._formatCurrency(Math.abs(value));
    if (!sign) {
      return formatted;
    }
    return value < 0 ? `-${formatted}` : formatted;
  }

  _buildCostRanking(metrics = {}) {
    const candidates = [
      { key: 'loanSavings', label: 'Loan + savings', cost: metrics.loanSavingsCost },
      { key: 'cash', label: 'Pay cash now', cost: 0 },
      { key: 'plainLoan', label: 'Plain loan', cost: metrics.loanInterest },
      { key: 'creditCard', label: 'Credit card', cost: metrics.cardNetCost },
    ].filter(({ cost }) => Number.isFinite(cost));

    return candidates.sort((a, b) => a.cost - b.cost);
  }

  _buildHeadline(recommended) {
    if (!recommended || !Number.isFinite(recommended.cost)) {
      return 'Recommended strategy: fill in the numbers to see your best path.';
    }

    if (recommended.key === 'cash' && recommended.cost === 0) {
      return 'Recommended strategy: Paying cash now is the baseline cost.';
    }

    const differenceFromCash = recommended.cost;
    if (differenceFromCash < 0) {
      return `Recommended strategy: ${recommended.label} saves you ${this._formatCurrency(
        Math.abs(differenceFromCash),
      )} versus paying cash now.`;
    }

    if (differenceFromCash === 0) {
      return `Recommended strategy: ${recommended.label} roughly matches paying cash now.`;
    }

    return `Recommended strategy: ${recommended.label} costs ${this._formatCurrency(
      differenceFromCash,
    )} more than paying cash now.`;
  }

  _chipTone(item, best) {
    if (!best || !item) {
      return 'neutral';
    }
    if (item === best) {
      return 'positive';
    }
    if (item.key === 'cash') {
      return 'baseline';
    }
    return 'caution';
  }

  static styles = tradeoffWidgetStyles;
}

customElements.define('tradeoff-widget', TradeoffWidget);
export { TradeoffWidget };
