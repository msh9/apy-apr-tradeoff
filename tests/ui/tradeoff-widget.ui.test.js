import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TradeoffComparison } from '../../src/tradeoff.js';
import '../../src/ui/tradeoff-widget.ui.js';

const renderWidget = async () => {
  const element = document.createElement('tradeoff-widget');
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
};

const setValue = (input, value) => {
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

const getLoanSavingsShadow = (root) => root.querySelector('loan-savings-card').shadowRoot;
const getCreditCardShadow = (root) => root.querySelector('credit-card-card').shadowRoot;

describe('tradeoff-widget', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('normalizes percent inputs and computes when all inputs are valid', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 30 },
      creditCardRewards: { toDecimal: () => 10 },
      creditCardInterest: { toDecimal: () => 2.5 },
      loanAccount: {
        payment: () => ({ toDecimal: () => 200 }),
        totalInterest: () => ({ toDecimal: () => 20 }),
      },
      depositAccount: { balance: { toDecimal: () => 30 } },
      depositInterest: { toDecimal: () => 50 },
    });

    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);
    const creditCardShadow = getCreditCardShadow(shadow);

    setValue(shadow.querySelector('input[name="principal"]'), '2000');
    setValue(loanSavingsShadow.querySelector('input[name="termMonths"]'), '12');
    setValue(loanSavingsShadow.querySelector('input[name="loanRate"]'), '4');
    setValue(loanSavingsShadow.querySelector('input[name="apy"]'), '5');
    setValue(creditCardShadow.querySelector('input[name="ccRewardsRate"]'), '1.5');
    setValue(creditCardShadow.querySelector('input[name="ccRate"]'), '28.99');
    await loanSavingsShadow.host.updateComplete;
    await creditCardShadow.host.updateComplete;
    await element.updateComplete;

    expect(simulateSpy).toHaveBeenCalled();
    const lastCallArgs = simulateSpy.mock.calls.at(-1)[0];
    expect(lastCallArgs).toMatchObject({
      principal: 2000,
      periodCount: 12,
      depositApy: 0.05,
      loanRate: 0.04,
    });

    expect(loanSavingsShadow.querySelector('[data-role="loan-payment"]').textContent).toMatch(/\$/);
    expect(loanSavingsShadow.querySelector('[data-role="loan-interest"]').textContent).toMatch(
      /\$/,
    );
    expect(loanSavingsShadow.querySelector('[data-role="deposit-interest"]').textContent).toMatch(
      /\$50/,
    );
    expect(creditCardShadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/\$/);
    expect(creditCardShadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/\$/);
    expect(loanSavingsShadow.querySelector('[data-role="loan-savings-cost"]').textContent).toMatch(
      /-\$/,
    );
  });

  it('blocks calculation and surfaces an error when inputs are invalid', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario');
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    setValue(shadow.querySelector('input[name="principal"]'), '-10');
    await element.updateComplete;

    expect(simulateSpy).not.toHaveBeenCalled();
    expect(shadow.querySelector('[data-role="error"]').textContent).toMatch(/positive value/i);
  });

  it('ignores non-numeric input fragments and avoids calculation', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario');
    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);
    const creditCardShadow = getCreditCardShadow(shadow);

    setValue(shadow.querySelector('input[name="principal"]'), '10abc');
    await element.updateComplete;

    expect(simulateSpy).not.toHaveBeenCalled();
    expect(shadow.querySelector('[data-role="error"]').textContent).toBe('');
    expect(loanSavingsShadow.querySelector('[data-role="loan-payment"]').textContent).toBe('—');
    expect(creditCardShadow.querySelector('[data-role="cc-rewards"]').textContent).toBe('—');
    expect(creditCardShadow.querySelector('[data-role="cc-interest"]').textContent).toBe('—');
  });

  it('defaults the credit card rate when left empty', async () => {
    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);
    const creditCardShadow = getCreditCardShadow(shadow);
    const ccListener = vi.fn();
    creditCardShadow.host.addEventListener('cc-change', (event) => ccListener(event.detail));

    setValue(shadow.querySelector('input[name="principal"]'), '300');
    setValue(loanSavingsShadow.querySelector('input[name="termMonths"]'), '3');
    setValue(loanSavingsShadow.querySelector('input[name="loanRate"]'), '0');
    setValue(loanSavingsShadow.querySelector('input[name="apy"]'), '2');
    setValue(creditCardShadow.querySelector('input[name="ccRewardsRate"]'), '2');
    await loanSavingsShadow.host.updateComplete;
    await creditCardShadow.host.updateComplete;

    expect(ccListener).toHaveBeenCalled();
    const ccDetail = ccListener.mock.calls.at(-1)[0];
    expect(ccDetail.ccRate).toBeCloseTo(0.2899, 4);
  });

  it('clears the result when an input is emptied after a valid calculation', async () => {
    vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 50 },
      creditCardRewards: { toDecimal: () => 5 },
      creditCardInterest: { toDecimal: () => 1.5 },
      loanAccount: {
        payment: () => ({ toDecimal: () => 100 }),
        totalInterest: () => ({ toDecimal: () => 10 }),
      },
      depositAccount: { balance: { toDecimal: () => 50 } },
    });
    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);
    const creditCardShadow = getCreditCardShadow(shadow);

    setValue(shadow.querySelector('input[name="principal"]'), '1000');
    setValue(loanSavingsShadow.querySelector('input[name="termMonths"]'), '6');
    setValue(loanSavingsShadow.querySelector('input[name="loanRate"]'), '0');
    setValue(loanSavingsShadow.querySelector('input[name="apy"]'), '3');
    await loanSavingsShadow.host.updateComplete;
    await creditCardShadow.host.updateComplete;
    await element.updateComplete;

    expect(loanSavingsShadow.querySelector('[data-role="loan-savings-cost"]').textContent).toMatch(
      /—/,
    );
    expect(creditCardShadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/\$/);
    expect(creditCardShadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/\$/);

    setValue(shadow.querySelector('input[name="principal"]'), '');
    await element.updateComplete;
    await creditCardShadow.host.updateComplete;

    expect(loanSavingsShadow.querySelector('[data-role="loan-savings-cost"]').textContent).toBe(
      '—',
    );
    expect(creditCardShadow.querySelector('[data-role="cc-rewards"]').textContent).toBe('—');
    expect(creditCardShadow.querySelector('[data-role="cc-interest"]').textContent).toBe('—');
  });

  it('applies positive-range constraints via input attributes', async () => {
    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);
    const creditCardShadow = getCreditCardShadow(shadow);

    expect(shadow.querySelector('input[name="principal"]').getAttribute('min')).toBe('0');
    expect(loanSavingsShadow.querySelector('input[name="apy"]').getAttribute('min')).toBe('0');
    expect(loanSavingsShadow.querySelector('input[name="loanRate"]').getAttribute('min')).toBe('0');
    expect(creditCardShadow.querySelector('input[name="ccRewardsRate"]').getAttribute('min')).toBe(
      '0',
    );
    expect(creditCardShadow.querySelector('input[name="ccRate"]').getAttribute('min')).toBe('0');
    expect(loanSavingsShadow.querySelector('input[name="termMonths"]').getAttribute('min')).toBe(
      '1',
    );
  });

  it('reformats results when currency changes and falls back on invalid codes', async () => {
    vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 10 },
      creditCardRewards: { toDecimal: () => 3 },
      creditCardInterest: { toDecimal: () => 1 },
      loanAccount: {
        payment: () => ({ toDecimal: () => 50 }),
        totalInterest: () => ({ toDecimal: () => 5 }),
      },
      depositAccount: { balance: { toDecimal: () => 10 } },
    });
    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);
    const creditCardShadow = getCreditCardShadow(shadow);

    setValue(shadow.querySelector('input[name="principal"]'), '100');
    setValue(loanSavingsShadow.querySelector('input[name="termMonths"]'), '3');
    setValue(loanSavingsShadow.querySelector('input[name="loanRate"]'), '0');
    setValue(loanSavingsShadow.querySelector('input[name="apy"]'), '5');
    await loanSavingsShadow.host.updateComplete;
    await element.updateComplete;

    element.currency = 'EUR';
    await element.updateComplete;
    expect(loanSavingsShadow.querySelector('[data-role="loan-savings-cost"]').textContent).toMatch(
      /—/,
    );
    expect(creditCardShadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/€/);
    expect(creditCardShadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/€/);

    element.currency = 'NOT-A-CODE';
    await element.updateComplete;
    expect(loanSavingsShadow.querySelector('[data-role="loan-savings-cost"]').textContent).toMatch(
      /—/,
    );
    expect(creditCardShadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/\$/);
    expect(creditCardShadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/\$/);
  });

  it('recalculates when periodDays changes after inputs are complete', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 1 },
      creditCardRewards: { toDecimal: () => 0 },
      creditCardInterest: { toDecimal: () => 0 },
    });
    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);

    setValue(shadow.querySelector('input[name="principal"]'), '500');
    setValue(loanSavingsShadow.querySelector('input[name="termMonths"]'), '4');
    setValue(loanSavingsShadow.querySelector('input[name="loanRate"]'), '0');
    setValue(loanSavingsShadow.querySelector('input[name="apy"]'), '2');
    await loanSavingsShadow.host.updateComplete;
    await element.updateComplete;
    const initialCalls = simulateSpy.mock.calls.length;

    element.periodDays = 28;
    await element.updateComplete;
    expect(simulateSpy.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it('requires a start date when real world mode is selected', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario');
    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);

    setValue(shadow.querySelector('input[name="principal"]'), '400');
    setValue(loanSavingsShadow.querySelector('input[name="termMonths"]'), '4');
    setValue(loanSavingsShadow.querySelector('input[name="loanRate"]'), '0');
    setValue(loanSavingsShadow.querySelector('input[name="apy"]'), '3');
    await loanSavingsShadow.host.updateComplete;
    await element.updateComplete;

    const callsBeforeModeToggle = simulateSpy.mock.calls.length;
    shadow.querySelector('select[name="mode"]').value = 'real';
    shadow.querySelector('select[name="mode"]').dispatchEvent(new Event('input'));
    await element.updateComplete;
    await element.updateComplete;

    expect(simulateSpy).toHaveBeenCalledTimes(callsBeforeModeToggle);
    expect(shadow.querySelector('[data-role="error"]').textContent).toMatch(/start date/i);
  });

  it('passes mode and start date into simulation when provided', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 5 },
      creditCardRewards: { toDecimal: () => 0 },
      creditCardInterest: { toDecimal: () => 0 },
    });
    const element = await renderWidget();
    const shadow = element.shadowRoot;
    const loanSavingsShadow = getLoanSavingsShadow(shadow);

    setValue(shadow.querySelector('input[name="principal"]'), '500');
    setValue(loanSavingsShadow.querySelector('input[name="termMonths"]'), '3');
    setValue(loanSavingsShadow.querySelector('input[name="loanRate"]'), '0');
    setValue(loanSavingsShadow.querySelector('input[name="apy"]'), '4');
    shadow.querySelector('select[name="mode"]').value = 'real';
    shadow.querySelector('select[name="mode"]').dispatchEvent(new Event('input'));
    await element.updateComplete;
    setValue(shadow.querySelector('input[name="startDate"]'), '2024-01-10');
    await element.updateComplete;

    const lastCallArgs = simulateSpy.mock.calls.at(-1)[0];
    expect(lastCallArgs.mode).toBe('real');
    expect(lastCallArgs.startDate).toBe('2024-01-10');
  });
});
