import { LitElement, html } from 'lit';

import { Account as DepositAccount } from '../accounts/deposit.js';
import { Account as LoanAccount } from '../accounts/loan.js';

import { tradeoffWidgetStyles } from './tradeoff-widget.styles.js';

const currencyFormatter = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

class LoanSavingsCard extends LitElement {
  static properties = {
    principal: { type: Number },
    mode: { type: String },
    startDate: { type: String, attribute: 'start-date' },
    currency: { type: String },
    results: { type: Object },
    loanRateInput: { state: true },
    termMonthsInput: { state: true },
    apyInput: { state: true },
    paymentValue: { state: true },
    interestValue: { state: true },
  };

  constructor() {
    super();
    this.principal = undefined;
    this.mode = 'idealized';
    this.startDate = '';
    this.currency = 'USD';
    this.results = {};
    this.loanRateInput = '';
    this.termMonthsInput = '';
    this.apyInput = '';
    this.paymentValue = Number.NaN;
    this.interestValue = Number.NaN;
  }

  updated(changed) {
    if (changed.has('principal')) {
      this._calculateLoan();
      this._calculateDeposit();
    }
  }

  render() {
    const paymentText = this._formatMaybeCurrency(this.paymentValue);
    const interestText = this._formatMaybeCurrency(this.interestValue);
    const savingsInterestText = this._formatMaybeCurrency(this.results?.depositInterest);
    const savingsBalanceText = this._formatMaybeCurrency(this.results?.savingsEndBalance, {
      fallback: '—',
    });
    const loanSavingsCostText = this._formatMaybeCurrency(this.results?.loanSavingsCost, {
      fallback: '—',
      sign: true,
    });

    return html`
      <div class="loan-savings-grid">
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
                @input=${this._onLoanInput}
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
                @input=${this._onLoanInput}
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

        <div class="connector" aria-hidden="true">
          <span>Loan payments parked here →</span>
        </div>

        <article class="option-card savings-card">
          <div class="pill-link">
            <span class="strategy-pill">Loan + Savings Strategy</span>
          </div>
          <div class="card-heading">
            <h2>Savings while you carry the loan</h2>
            <p class="subtitle">Where would-be loan payments sit and earn interest.</p>
            <p class="subtitle mobile-connector">
              This section models what happens if you keep each loan payment in a savings account
              until you need to send it to the lender.
            </p>
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
                @input=${this._onDepositInput}
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
      </div>
    `;
  }

  get loan() {
    const parsed = this._buildLoanAccount();
    return parsed?.loanAccount ?? null;
  }

  get deposit() {
    const parsed = this._buildDepositAccount();
    return parsed?.depositAccount ?? null;
  }

  _onLoanInput(event) {
    const { name, value } = event.target;
    const stateKey = `${name}Input`;
    if (stateKey in this) {
      this[stateKey] = value;
    }
    this._calculateLoan();
  }

  _onDepositInput(event) {
    const { name, value } = event.target;
    const stateKey = `${name}Input`;
    if (stateKey in this) {
      this[stateKey] = value;
    }
    this._calculateDeposit();
  }

  _calculateLoan() {
    const { loanAccount, monthlyPayment, totalInterest } = this._buildLoanAccount() || {};

    if (!loanAccount) {
      this.paymentValue = Number.NaN;
      this.interestValue = Number.NaN;
      this._emitLoanChange({ valid: false });
      return;
    }

    this.paymentValue = monthlyPayment;
    this.interestValue = totalInterest;
    this._emitLoanChange({
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

  _calculateDeposit() {
    const parsed = this._buildDepositAccount();
    if (!parsed) {
      this._emitDepositChange({ valid: false });
      return;
    }

    this._emitDepositChange({
      valid: true,
      principal: this.principal,
      mode: this.mode,
      startDate: this.startDate,
      depositApy: parsed.depositApy,
      depositAccount: parsed.depositAccount,
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

  _emitLoanChange(detail) {
    this.dispatchEvent(
      new CustomEvent('loan-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  _emitDepositChange(detail) {
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

  _parseInteger(value) {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    const parsed = Number.parseInt(String(value).trim(), 10);
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

customElements.define('loan-savings-card', LoanSavingsCard);
export { LoanSavingsCard };
