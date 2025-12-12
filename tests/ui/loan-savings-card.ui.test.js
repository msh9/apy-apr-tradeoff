import { afterEach, describe, expect, it, vi } from 'vitest';

import '../../src/ui/loan-savings-card.ui.js';
import { TradeoffComparison } from '../../src/tradeoff.js';

const renderCard = async () => {
  const element = document.createElement('loan-savings-card');
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
};

const setValue = (input, value) => {
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('loan-savings-card', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('emits loan and deposit events independently with parsed data', async () => {
    const loanListener = vi.fn();
    const depositListener = vi.fn();
    const element = await renderCard();
    element.principal = 1200;
    element.addEventListener('loan-change', (event) => loanListener(event.detail));
    element.addEventListener('deposit-change', (event) => depositListener(event.detail));
    await element.updateComplete;

    const shadow = element.shadowRoot;
    setValue(shadow.querySelector('input[name="loanRate"]'), '5');
    setValue(shadow.querySelector('input[name="termMonths"]'), '12');
    setValue(shadow.querySelector('input[name="apy"]'), '4');
    await element.updateComplete;

    expect(loanListener).toHaveBeenCalled();
    const loanDetail = loanListener.mock.calls.at(-1)[0];
    expect(loanDetail.valid).toBe(true);
    expect(loanDetail.loanRate).toBeCloseTo(0.05, 4);
    expect(loanDetail.termMonths).toBe(12);
    expect(element.loan).toBeTruthy();

    expect(depositListener).toHaveBeenCalled();
    const depositDetail = depositListener.mock.calls.at(-1)[0];
    expect(depositDetail.valid).toBe(true);
    expect(depositDetail.depositApy).toBeCloseTo(0.04, 4);
    expect(element.deposit).toBeTruthy();
  });

  it('emits invalid change when principal or inputs are missing', async () => {
    const loanListener = vi.fn();
    const depositListener = vi.fn();
    const element = await renderCard();
    element.principal = -5;
    element.addEventListener('loan-change', (event) => loanListener(event.detail));
    element.addEventListener('deposit-change', (event) => depositListener(event.detail));
    await element.updateComplete;

    expect(loanListener).toHaveBeenCalled();
    expect(depositListener).toHaveBeenCalled();
    expect(loanListener.mock.calls.at(-1)[0].valid).toBe(false);
    expect(depositListener.mock.calls.at(-1)[0].valid).toBe(false);
    expect(element.loan).toBeNull();
    expect(element.deposit).toBeNull();
  });

  it('emits combined loan-savings change with simulated results', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 30 },
      loanAccount: {
        payment: () => ({ toDecimal: () => 200 }),
        totalInterest: () => ({ toDecimal: () => 20 }),
      },
      depositAccount: { balance: { toDecimal: () => 30 } },
    });
    const combinedListener = vi.fn();
    const element = await renderCard();
    element.principal = 1000;
    element.addEventListener('loan-savings-change', (event) => combinedListener(event.detail));
    await element.updateComplete;

    const shadow = element.shadowRoot;
    setValue(shadow.querySelector('input[name="loanRate"]'), '4');
    setValue(shadow.querySelector('input[name="termMonths"]'), '12');
    setValue(shadow.querySelector('input[name="apy"]'), '5');
    await element.updateComplete;

    expect(simulateSpy).toHaveBeenCalled();
    expect(combinedListener).toHaveBeenCalled();
    const detail = combinedListener.mock.calls.at(-1)[0];
    expect(detail.valid).toBe(true);
    expect(detail.loanSavingsCost).toBeCloseTo(-30, 2);
    expect(shadow.querySelector('[data-role="deposit-interest"]').textContent).toMatch(/\$/);
    expect(shadow.querySelector('[data-role="loan-savings-cost"]').textContent).toMatch(/-/);
  });
});
