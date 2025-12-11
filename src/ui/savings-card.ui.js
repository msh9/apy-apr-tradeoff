import { LitElement, html } from 'lit';

import { Account as DepositAccount } from '../accounts/deposit.js';

import { tradeoffWidgetStyles } from './tradeoff-widget.styles.js';

const currencyFormatter = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

class SavingsCard extends LitElement {
  static properties = {
    principal: { type: Number },
    mode: { type: String },
    startDate: { type: String, attribute: 'start-date' },
    currency: { type: String },
    results: { type: Object },
  };

  constructor() {
    super();
    this.principal = undefined;
    this.mode = 'idealized';
    this.startDate = '';
    this.currency = 'USD';
    this.results = {};
    this.apyInput = '';
  }

  updated(changed) {
    if (changed.has('principal')) {
      this._calculate();
    }
  }

  render() {
    const savingsInterestText = this._formatMaybeCurrency(this.results?.depositInterest);
    const savingsBalanceText = this._formatMaybeCurrency(this.results?.savingsEndBalance, {
      fallback: '—',
    });
    const loanSavingsCostText = this._formatMaybeCurrency(this.results?.loanSavingsCost, {
      fallback: '—',
      sign: true,
    });

    return html`
      <article class="option-card savings-card">
        <div class="pill-link">
          <span class="strategy-pill">Loan + Savings Strategy</span>
        </div>
        <div class="card-heading">
          <h2>Savings while you carry the loan</h2>
          <p class="subtitle">Where would-be loan payments sit and earn interest.</p>
        </div>

        <div class="field-group">
          <p class="group-label">Deposit Information</p>
          <div class="field">
            <label for="apy">Savings or deposit APY</label>
            <p class="helper">APY on the account holding future payments.</p>
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
          ${Number.isFinite(this.results?.loanInterest)
            ? null
            : html`
                <p class="muted helper">
                  We’ll calculate savings on your loan payments once you enter a loan rate on the
                  left.
                </p>
              `}
        </div>
      </article>
    `;
  }

  get deposit() {
    const parsed = this._buildDepositAccount();
    return parsed?.depositAccount ?? null;
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
    const parsed = this._buildDepositAccount();
    if (!parsed) {
      this._emitChange({ valid: false });
      return;
    }

    this._emitChange({
      valid: true,
      principal: this.principal,
      mode: this.mode,
      startDate: this.startDate,
      depositApy: parsed.depositApy,
      depositAccount: parsed.depositAccount,
    });
  }

  _buildDepositAccount() {
    if (!Number.isFinite(this.principal) || this.principal < 0) {
      return null;
    }

    const apyPercent = this._parseNumber(this.apyInput);
    if (apyPercent === null || apyPercent < 0) {
      return null;
    }

    const depositApy = apyPercent / 100;
    try {
      const depositAccount = new DepositAccount(this.principal, depositApy);
      return { depositAccount, depositApy };
    } catch {
      return null;
    }
  }

  _emitChange(detail) {
    this.dispatchEvent(
      new CustomEvent('deposit-change', {
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

  _formatMaybeCurrency(value, { fallback = '—', sign = false } = {}) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    const formatted = (() => {
      try {
        return currencyFormatter(Math.abs(value), this.currency);
      } catch {
        return currencyFormatter(Math.abs(value), 'USD');
      }
    })();
    return sign && value < 0 ? `-${formatted}` : formatted;
  }

  static styles = tradeoffWidgetStyles;
}

customElements.define('savings-card', SavingsCard);
export { SavingsCard };
