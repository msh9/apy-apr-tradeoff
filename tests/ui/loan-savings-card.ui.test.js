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

  it('emits invalid change when principal or inputs are missing', async () => {
    const element = await renderCard();
    element.principal = -5;
    await element.updateComplete;

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
