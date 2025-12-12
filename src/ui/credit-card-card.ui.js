import { LitElement, html } from 'lit';

import { Account as CreditCardAccount } from '../accounts/credit-card.js';

import { parseFloatNumber, formatMaybeCurrency } from './formatting.ui.js';
import { tradeoffWidgetStyles } from './tradeoff-widget.styles.js';

const DEFAULT_CC_RATE_PERCENT = 28.99;

class CreditCardCard extends LitElement {
  static properties = {
    principal: { type: Number },
    currency: { type: String },
    periodDays: { type: Number, attribute: 'period-days' },
    ccRateInput: { state: true },
    ccRewardsRateInput: { state: true },
    rewardsValue: { state: true },
    interestValue: { state: true },
  };

  constructor() {
    super();
    this.principal = undefined;
    this.currency = 'USD';
    this.periodDays = undefined;
    this.ccRateInput = '';
    this.ccRewardsRateInput = '';
    this.rewardsValue = Number.NaN;
    this.interestValue = Number.NaN;
  }

  updated(changed) {
    if (changed.has('principal') || changed.has('periodDays')) {
      this._calculate();
    }
  }

  render() {
    const rewardsText = formatMaybeCurrency(this.rewardsValue, this.currency);
    const interestText = formatMaybeCurrency(this.interestValue, this.currency);

    return html`
    <div class="loan-savings-grid">
      <article class="option-card card-card">
        <div class="pill-link">
          <span class="strategy-pill">Credit Card Strategy</span>
        </div>
        <div class="card-heading">
          <h2>Credit card</h2>
          <p class="subtitle">Use your credit card.</p>
        </div>

        <div class="field-group">
          <p class="group-label">Credit Card Information</p>
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
            <span data-role="cc-rewards">${rewardsText}</span>
          </p>
          <p>
            <span class="label">Example One Statement Cycle Interest:</span>
            <span data-role="cc-interest">${interestText}</span>
          </p>
        </div>
      </article>
      </div>
    `;
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
    const parsed = this._buildAccount();
    if (!parsed) {
      this.rewardsValue = Number.NaN;
      this.interestValue = Number.NaN;
      this._emitChange({ valid: false });
      return;
    }

    this.rewardsValue = parsed.rewardsValue;
    this.interestValue = parsed.interestValue;

    this._emitChange({
      valid: true,
      principal: this.principal,
      ccRewardsRate: parsed.ccRewardsRate,
      ccRate: parsed.ccRate,
      ccAccount: parsed.ccAccount,
      rewardsValue: parsed.rewardsValue,
      interestValue: parsed.interestValue,
    });
  }

  _buildAccount() {
    if (!Number.isFinite(this.principal) || this.principal < 0) {
      return null;
    }

    const rewardsPercent = parseFloatNumber(this.ccRewardsRateInput);
    const ccRatePercent = parseFloatNumber(this.ccRateInput);
    if (
      (rewardsPercent !== null && rewardsPercent < 0) ||
      (ccRatePercent !== null && ccRatePercent < 0)
    ) {
      return null;
    }

    const ccRewardsRate = (rewardsPercent === null ? 0 : rewardsPercent) / 100;
    const ccRate = (ccRatePercent === null ? DEFAULT_CC_RATE_PERCENT : ccRatePercent) / 100;

    try {
      const ccAccount = new CreditCardAccount({ apr: ccRate, rewardsRate: ccRewardsRate });
      const rewards = ccAccount.calculateRewards(this.principal).toDecimal();
      const days = Number.isInteger(this.periodDays) ? this.periodDays : undefined;
      const interest = (
        days === undefined
          ? ccAccount.interestForDays(this.principal)
          : ccAccount.interestForDays(this.principal, days)
      ).toDecimal();
      return {
        ccAccount,
        ccRewardsRate,
        ccRate,
        rewardsValue: rewards,
        interestValue: interest,
      };
    } catch {
      return null;
    }
  }

  _emitChange(detail) {
    this.dispatchEvent(
      new CustomEvent('cc-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  static styles = tradeoffWidgetStyles;
}

customElements.define('credit-card-card', CreditCardCard);
export { CreditCardCard };
