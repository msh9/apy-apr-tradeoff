import { LitElement, css, html } from 'lit';

import { TradeoffComparison } from '../tradeoff.js';

const currencyFormatter = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
const DEFAULT_CC_RATE_PERCENT = 28.99;

class TradeoffWidget extends LitElement {
  static properties = {
    loanRateInput: { state: true },
    apyInput: { state: true },
    ccRewardsRateInput: { state: true },
    ccRateInput: { state: true },
    principalInput: { state: true },
    termMonthsInput: { state: true },
    customTermMonthsInput: { state: true },
    useGlobalTerm: { state: true },
    startDateInput: { state: true },
    modeInput: { state: true },
    errorMessage: { state: true },
    metrics: { state: true },
    currency: { type: String },
    periodDays: { type: Number, attribute: 'period-days' },
  };

  constructor() {
    super();
    this.loanRateInput = '';
    this.apyInput = '';
    this.ccRewardsRateInput = '';
    this.ccRateInput = '';
    this.principalInput = '';
    this.termMonthsInput = '';
    this.customTermMonthsInput = '';
    this.useGlobalTerm = true;
    this.startDateInput = '';
    this.modeInput = 'idealized';
    this.errorMessage = '';
    this.metrics = null;
    this._currency = 'USD';
    this.periodDays = undefined;
    this._calculator = new TradeoffComparison();
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
    const metrics = this.metrics || {};
    const loanPaymentText = this._formatMaybeCurrency(metrics.loanPayment);
    const loanInterestText = this._formatMaybeCurrency(metrics.loanInterest);
    const savingsInterestText = this._formatMaybeCurrency(metrics.depositInterest);
    const savingsBalanceText = this._formatMaybeCurrency(metrics.savingsEndBalance, {
      fallback: '—',
      sign: true,
    });
    const loanSavingsCostText = this._formatMaybeCurrency(metrics.loanSavingsCost, {
      fallback: '—',
      sign: true,
    });
    const ccRewardsText = this._formatMaybeCurrency(metrics.cardRewards);
    const ccInterestText = this._formatMaybeCurrency(metrics.cardInterest);
    const ccNetText = this._formatMaybeCurrency(metrics.cardNetCost, { fallback: '—', sign: true });

    const ranking = this._buildCostRanking(metrics);
    const recommended = ranking[0];
    const headline = this._buildHeadline(recommended);

    return html`
      <article class="tradeoff-shell">
        <header class="intro">
          <p class="eyebrow">Loan, savings, credit card</p>
          <h1>How should I pay for this purchase?</h1>
          <p class="lede">
            Compare paying cash, taking a loan and parking the cash in savings, or using your credit
            card.
          </p>
        </header>

        <section class="solar-card global-card">
          <form class="global-grid" @submit=${this._onSubmit} novalidate>
            <div class="field">
              <label for="principal">Purchase amount</label>
              <p class="helper">Total price before tax (or include tax if you prefer).</p>
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

            <div class="field">
              <label for="termMonths">How long will you take to pay? (months)</label>
              <p class="helper">Used for loan, savings, and credit card comparisons.</p>
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
          </form>

          <div class="timing-row">
            <div class="field compact">
              <label for="mode">Calendar mode</label>
              <select id="mode" name="mode" .value=${this.modeInput} @input=${this._onInput}>
                <option value="idealized">Idealized (31-day months)</option>
                <option value="real">Real world calendar</option>
              </select>
            </div>

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
          </div>
        </section>

        <section class="cards-wrapper">
          <article class="option-card loan-card">
            <div class="pill-link">
              <span class="strategy-pill">Loan + Savings Strategy</span>
            </div>
            <div class="card-heading">
              <h2>Loan</h2>
              <p class="subtitle">Spread payments over time.</p>
            </div>

            <div class="field-group">
              <p class="group-label">Basics</p>
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
            </div>

            <div class="mini-results">
              <p>
                <span class="label">Monthly payment:</span>
                <span data-role="loan-payment">${loanPaymentText}</span>
              </p>
              <p>
                <span class="label">Total interest paid:</span>
                <span data-role="loan-interest">${loanInterestText}</span>
              </p>
            </div>
          </article>

          <article class="option-card savings-card">
            <div class="mobile-connector">
              This section models what happens if you keep each loan payment in a savings account
              until it’s due.
            </div>
            <div class="pill-link">
              <span class="strategy-pill">Loan + Savings Strategy</span>
            </div>
            <div class="card-heading">
              <h2>Savings while you carry the loan</h2>
              <p class="subtitle">Where your would-be loan payments sit and earn interest.</p>
            </div>

            <div class="field">
              <label for="apy">Savings or deposit APY</label>
              <p class="helper">Where you’d keep the money that covers your loan payments.</p>
              <input
                id="apy"
                name="apy"
                type="number"
                step="0.01"
                inputmode="decimal"
                min="0"
                placeholder="e.g. 4.5"
                .value=${this.apyInput}
                @input=${this._onInput}
                required
              />
            </div>

            <div class="mini-results">
              <p>
                <span class="label">Interest earned on parked payments:</span>
                <span data-role="deposit-interest">${savingsInterestText}</span>
              </p>
              <p>
                <span class="label">Final savings balance after last payment:</span>
                <span data-role="savings-balance">${savingsBalanceText}</span>
              </p>
              <p>
                <span class="label">Loan + savings net cost:</span>
                <span data-role="loan-savings-cost">${loanSavingsCostText}</span>
              </p>
              ${Number.isFinite(metrics.loanInterest)
                ? null
                : html`
                    <p class="muted helper">
                      We’ll calculate savings on your loan payments once you enter a loan rate on
                      the left.
                    </p>
                  `}
            </div>
          </article>

          <article class="option-card card-card">
            <div class="pill-link">
              <span class="strategy-pill">Credit Card Strategy</span>
            </div>
            <div class="card-heading">
              <h2>Credit card</h2>
              <p class="subtitle">Use your credit card.</p>
            </div>

            <div class="field-grid">
              <div class="field">
                <label for="ccRate">Credit card APR</label>
                <input
                  id="ccRate"
                  name="ccRate"
                  type="number"
                  step="0.01"
                  inputmode="decimal"
                  min="0"
                  placeholder="Defaults to 28.99%"
                  .value=${this.ccRateInput}
                  @input=${this._onInput}
                />
              </div>
              <div class="field">
                <label for="ccRewardsRate">Rewards rate</label>
                <p class="helper">For this purchase (cash back, points, miles).</p>
                <input
                  id="ccRewardsRate"
                  name="ccRewardsRate"
                  type="number"
                  step="0.01"
                  inputmode="decimal"
                  min="0"
                  placeholder="e.g. 2"
                  .value=${this.ccRewardsRateInput}
                  @input=${this._onInput}
                />
              </div>
            </div>

            <div class="mini-results">
              <p>
                <span class="label">Rewards earned:</span>
                <span data-role="cc-rewards">${ccRewardsText}</span>
              </p>
              <p>
                <span class="label">Example One Statement Cycle Interest:</span>
                <span data-role="cc-interest">${ccInterestText}</span>
              </p>
            </div>
          </article>
        </section>

        <section class="solar-card summary-card">
          <div class="bullets">
            <p><span class="bullet-label">Loan + savings net benefit/cost:</span> ${loanSavingsCostText}</p>
            <p><span class="bullet-label">Plain loan cost:</span> ${loanInterestText}</p>
            <p><span class="bullet-label">Credit reward:</span> ${ccRewardsText}</p>
            <p><span class="bullet-label">One cycle credit card cost if not paid:</span> ${ccInterestText}></p>
          </div>
        </section>

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

  _onToggleUseGlobalTerm(event) {
    this.useGlobalTerm = event.target.checked;
    this.errorMessage = '';
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

    const baseTermMonths = this._parseInteger(this.termMonthsInput);
    const customTermMonths = this.useGlobalTerm
      ? baseTermMonths
      : this._parseInteger(this.customTermMonthsInput);
    const termMonths = this.useGlobalTerm ? baseTermMonths : customTermMonths;
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

    let ccRewardsPercent = null;
    if (this.ccRewardsRateInput !== '' && this.ccRewardsRateInput !== undefined) {
      ccRewardsPercent = this._parseMoney(this.ccRewardsRateInput);
      if (ccRewardsPercent === null) {
        this._clearResult();
        return;
      }
      if (ccRewardsPercent < 0) {
        this._setError('Rewards rate must be zero or greater.');
        return;
      }
    }

    let ccRatePercent = null;
    if (this.ccRateInput !== '' && this.ccRateInput !== undefined) {
      ccRatePercent = this._parseMoney(this.ccRateInput);
      if (ccRatePercent === null) {
        this._clearResult();
        return;
      }
      if (ccRatePercent < 0) {
        this._setError('Credit card rate must be zero or greater.');
        return;
      }
    }

    let startDate = undefined;
    if (useRealMode) {
      startDate = this._parseDate(this.startDateInput);
      if (startDate === null) {
        this._clearResult();
        return;
      }
    }

    const loanRate = ratePercent === null ? 0 : ratePercent / 100;
    const depositApy = apyPercent / 100;
    const ccRewardsRate = ccRewardsPercent === null ? 0 : ccRewardsPercent / 100;
    const ccRate = (ccRatePercent === null ? DEFAULT_CC_RATE_PERCENT : ccRatePercent) / 100;

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
    const loanSavingsCost = Number.isFinite(netValue) ? -netValue : Number.NaN;
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

  static styles = css`
    :host {
      display: block;
      --base03: #002b36;
      --base02: #073642;
      --base01: #586e75;
      --base00: #657b83;
      --base0: #839496;
      --base1: #93a1a1;
      --base2: #eee8d5;
      --base3: #fdf6e3;
      --yellow: #b58900;
      --orange: #cb4b16;
      --red: #dc322f;
      --magenta: #d33682;
      --violet: #6c71c4;
      --blue: #268bd2;
      --cyan: #2aa198;
      --green: #859900;
    }

    .tradeoff-shell {
      display: grid;
      gap: 18px;
      color: var(--base0);
      background: var(--base03);
      padding: 18px;
      border-radius: 14px;
      border: 1px solid var(--base02);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      font-family:
        'IBM Plex Sans',
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        sans-serif;
    }

    .intro h1 {
      margin: 4px 0;
      font-size: 28px;
      color: var(--base1);
    }

    .eyebrow {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 12px;
      color: var(--base00);
    }

    .lede {
      margin: 0;
      color: var(--base0);
      font-size: 16px;
    }

    .solar-card {
      background: var(--base02);
      border: 1px solid var(--base01);
      border-radius: 12px;
      padding: 16px;
    }

    .global-card {
      display: grid;
      gap: 12px;
    }

    .global-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }

    .timing-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      align-items: end;
    }

    .cards-wrapper {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      align-items: start;
    }

    .option-card {
      background: var(--base02);
      border: 1px solid var(--base01);
      border-radius: 12px;
      padding: 16px;
      display: grid;
      gap: 10px;
      min-height: 100%;
      position: relative;
    }

    .loan-card {
      border-top: 4px solid var(--orange);
    }

    .savings-card {
      border-top: 4px solid var(--green);
    }

    .card-card {
      border-top: 4px solid var(--violet);
    }

    .pill-link {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .strategy-pill {
      background: linear-gradient(
        90deg,
        var(--orange) 0%,
        var(--orange) 50%,
        var(--green) 50%,
        var(--green) 100%
      );
      color: var(--base3);
      padding: 6px 10px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.1px;
      text-align: center;
      flex: 1 1 auto;
    }

    .option-tag {
      background: var(--base01);
      color: var(--base3);
      padding: 6px 10px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 12px;
      white-space: nowrap;
    }

    .option-tag.subtle {
      background: var(--base00);
      color: var(--base3);
    }

    .card-heading h2 {
      margin: 0;
      color: var(--base1);
      font-size: 20px;
    }

    .subtitle {
      margin: 2px 0 0 0;
      color: var(--base0);
      font-size: 14px;
    }

    .field {
      display: grid;
      gap: 4px;
    }

    .field.compact {
      gap: 2px;
    }

    .field.inline-field {
      grid-template-columns: 1fr;
    }

    .field-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }

    label {
      font-weight: 700;
      font-size: 15px;
      color: var(--base1);
    }

    .helper {
      margin: 0;
      color: var(--base0);
      font-size: 13px;
    }

    input,
    select {
      background: var(--base03);
      border: 1px solid var(--base01);
      border-radius: 6px;
      padding: 10px;
      color: var(--base1);
      font-size: 15px;
      font-family:
        'IBM Plex Sans',
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        sans-serif;
    }

    input:focus,
    select:focus {
      outline: 2px solid var(--blue);
      box-shadow: 0 0 0 2px rgba(38, 139, 210, 0.25);
    }

    .field-group {
      border: 1px dashed var(--base01);
      border-radius: 10px;
      padding: 10px;
      display: grid;
      gap: 8px;
      background: rgba(255, 255, 255, 0.02);
    }

    .group-label {
      margin: 0;
      font-weight: 700;
      color: var(--base0);
      letter-spacing: 0.02em;
      text-transform: uppercase;
      font-size: 12px;
    }

    .checkbox-row {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 14px;
      color: var(--base0);
    }

    .checkbox-row input {
      width: 18px;
      height: 18px;
    }

    .mini-results {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 10px;
      padding: 10px;
      display: grid;
      gap: 6px;
      border: 1px solid var(--base01);
    }

    .mini-results p {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      color: var(--base1);
      font-size: 14px;
    }

    .mini-results .label {
      color: var(--base0);
      font-weight: 600;
    }

    .connector {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--base0);
      font-size: 13px;
      letter-spacing: 0.02em;
    }

    .connector span {
      padding: 6px 10px;
      border: 1px dashed var(--base01);
      border-radius: 999px;
    }

    .mobile-connector {
      display: none;
      color: var(--base0);
      background: rgba(133, 153, 0, 0.12);
      border: 1px solid var(--green);
      border-radius: 8px;
      padding: 8px;
      font-size: 13px;
    }

    .summary-card {
      display: grid;
      gap: 10px;
    }

    .summary-headline {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--base1);
    }

    .ranking {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 6px;
    }

    .ranking li {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 1px solid var(--base01);
      border-radius: 8px;
    }

    .ranking .rank {
      font-weight: 700;
      color: var(--base0);
    }

    .ranking .label {
      color: var(--base1);
      font-weight: 600;
    }

    .ranking .value {
      color: var(--base1);
      justify-self: end;
      font-weight: 600;
    }

    .chip {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      justify-self: end;
    }

    .chip.positive {
      background: var(--green);
    }

    .chip.caution {
      background: var(--orange);
    }

    .chip.baseline {
      background: var(--blue);
    }

    .chip.neutral {
      background: var(--base00);
    }

    .bullets {
      display: grid;
      gap: 4px;
      color: var(--base0);
    }

    .bullet-label {
      font-weight: 700;
      color: var(--base1);
      margin-right: 6px;
    }

    .muted {
      color: var(--base00);
    }

    .error {
      color: var(--red);
      min-height: 18px;
      margin: 0;
      font-size: 13px;
    }

    @media (max-width: 960px) {
      .cards-wrapper {
        grid-template-columns: 1fr;
      }

      .connector {
        display: none;
      }

      .mobile-connector {
        display: block;
      }
    }

    @media (prefers-color-scheme: light) {
      .tradeoff-shell {
        background: var(--base3);
        color: var(--base00);
        border-color: var(--base2);
      }

      .solar-card,
      .option-card {
        background: var(--base2);
        border-color: var(--base1);
      }

      input,
      select {
        background: var(--base3);
        color: var(--base00);
        border-color: var(--base1);
      }

      .mini-results {
        background: rgba(0, 0, 0, 0.03);
      }
    }
  `;
}

customElements.define('tradeoff-widget', TradeoffWidget);
export { TradeoffWidget };
