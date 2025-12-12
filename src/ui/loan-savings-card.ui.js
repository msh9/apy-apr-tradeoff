import { LitElement, html } from 'lit';

import { Account as DepositAccount } from '../accounts/deposit.js';
import { Account as LoanAccount } from '../accounts/loan.js';
import { TradeoffComparison } from '../tradeoff.js';

import { parseFloatNumber, formatMaybeCurrency } from './formatting.ui.js';
import { tradeoffWidgetStyles } from './tradeoff-widget.styles.js';

class LoanSavingsCard extends LitElement {
  static properties = {
    principal: { type: Number },
    mode: { type: String },
    startDate: { type: String, attribute: 'start-date' },
    periodDays: { type: Number, attribute: 'period-days' },
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
    this.periodDays = undefined;
    this.currency = 'USD';
    this.results = {};
    this.loanRateInput = '';
    this.termMonthsInput = '';
    this.apyInput = '';
    this.paymentValue = Number.NaN;
    this.interestValue = Number.NaN;
    this._calculator = new TradeoffComparison();
    this._loanData = null;
    this._depositData = null;
  }

  updated(changed) {
    if (changed.has('periodDays')) {
      const days = Number.isInteger(this.periodDays) ? this.periodDays : undefined;
      this._calculator = new TradeoffComparison({ periodDays: days });
    }

    if (
      changed.has('principal') ||
      changed.has('mode') ||
      changed.has('startDate') ||
      changed.has('periodDays')
    ) {
      this._calculateLoan();
      this._calculateDeposit();
      this._calculateCombined();
    }
  }

  render() {
    const paymentText = formatMaybeCurrency(this.paymentValue, this.currency);
    const interestText = formatMaybeCurrency(this.interestValue, this.currency);
    const savingsInterestText = formatMaybeCurrency(this.results?.depositInterest, this.currency);
    const savingsBalanceText = formatMaybeCurrency(this.results?.savingsEndBalance, this.currency);
    const loanSavingsCostText = formatMaybeCurrency(this.results?.loanSavingsCost, this.currency);

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
      this._loanData = null;
    } else {
      this.paymentValue = monthlyPayment;
      this.interestValue = totalInterest;
      this._loanData = {
        valid: true,
        principal: this.principal,
        mode: this.mode,
        startDate: this.startDate,
        termMonths: loanAccount.periodCount,
        loanRate: loanAccount.nominalAnnualRate.toDecimal(),
        loanAccount,
        monthlyPayment,
        totalInterest,
      };
    }

    this._calculateCombined();
  }

  _calculateDeposit() {
    const apyPercent = parseFloatNumber(this.apyInput);
    if (apyPercent !== null && apyPercent < 0) {
      this._depositData = null;
      this._emitLoanSavingsChange({
        valid: false,
        errorMessage: 'APY must be zero or greater.',
      });
      this._updateResults(null);
      return;
    }

    const parsed = this._buildDepositAccount(apyPercent);
    if (!parsed) {
      this._depositData = null;
    } else {
      this._depositData = {
        valid: true,
        principal: this.principal,
        mode: this.mode,
        startDate: this.startDate,
        depositApy: parsed.depositApy,
        depositAccount: parsed.depositAccount,
      };
    }

    this._calculateCombined();
  }

  _buildLoanAccount() {
    if (!Number.isFinite(this.principal) || this.principal < 0) {
      return null;
    }

    const termMonths = this._parseInteger(this.termMonthsInput);
    const ratePercent = parseFloatNumber(this.loanRateInput);
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

  _buildDepositAccount(apyPercent = parseFloatNumber(this.apyInput)) {
    if (!Number.isFinite(this.principal) || this.principal < 0) {
      return null;
    }

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

  _calculateCombined() {
    const modeValue = (this.mode || 'idealized').toLowerCase();
    const useRealMode = modeValue === 'real' || modeValue === 'real-world';

    if (!this._loanData?.valid || !this._depositData?.valid) {
      this._updateResults(null);
      this._emitLoanSavingsChange({ valid: false });
      return;
    }

    if (!Number.isFinite(this.principal) || this.principal < 0) {
      this._updateResults(null);
      this._emitLoanSavingsChange({
        valid: false,
        errorMessage: 'Enter a positive value for the amount.',
      });
      return;
    }

    let normalizedStartDate = undefined;
    if (useRealMode) {
      normalizedStartDate = this._validateStartDate(this.startDate);
      if (!normalizedStartDate) {
        this._updateResults(null);
        this._emitLoanSavingsChange({
          valid: false,
          errorMessage: 'Select a start date for real world mode.',
        });
        return;
      }
    }

    try {
      const scenario = this._calculator.simulateScenario({
        principal: this.principal,
        periodCount: this._loanData.termMonths,
        loanRate: this._loanData.loanRate,
        depositApy: this._depositData.depositApy,
        mode: modeValue,
        startDate: normalizedStartDate,
      });

      const netValue = scenario?.net?.toDecimal ? scenario.net.toDecimal() : Number.NaN;
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

      const combined = {
        loanPayment,
        loanInterest,
        depositInterest,
        savingsEndBalance,
        loanSavingsCost,
        netValue,
      };
      this._updateResults(combined);
      this._emitLoanSavingsChange({
        valid: true,
        termMonths: this._loanData.termMonths,
        loanRate: this._loanData.loanRate,
        depositApy: this._depositData.depositApy,
        ...combined,
        loanAccount: scenario.loanAccount,
        depositAccount: scenario.depositAccount,
      });
    } catch (error) {
      this._updateResults(null);
      this._emitLoanSavingsChange({
        valid: false,
        errorMessage: error?.message,
      });
    }
  }

  _updateResults(results) {
    if (!results) {
      this.results = {
        depositInterest: Number.NaN,
        savingsEndBalance: Number.NaN,
        loanSavingsCost: Number.NaN,
        loanInterest: Number.NaN,
      };
      return;
    }
    this.results = results;
  }

  _emitLoanSavingsChange(detail) {
    this.dispatchEvent(
      new CustomEvent('loan-savings-change', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  _parseInteger(value) {
    if (value === '' || value === undefined || value === null) {
      return null;
    }
    const parsed = Number.parseInt(String(value).trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  _validateStartDate(value) {
    if (!value) {
      return null;
    }

    const normalized = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return null;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return normalized;
  }

  static styles = tradeoffWidgetStyles;
}

customElements.define('loan-savings-card', LoanSavingsCard);
export { LoanSavingsCard };
