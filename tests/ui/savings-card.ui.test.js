import { describe, expect, it, vi } from 'vitest';

import { Account as DepositAccount } from '../../src/accounts/deposit.js';
import '../../src/ui/savings-card.ui.js';

const renderSavingsCard = async () => {
  const el = document.createElement('savings-card');
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

describe('savings-card', () => {
  it('emits deposit-change with a DepositAccount when inputs are valid', async () => {
    const el = await renderSavingsCard();
    const shadow = el.shadowRoot;
    const handler = vi.fn();
    el.addEventListener('deposit-change', handler);

    el.principal = 500;
    shadow.querySelector('input[name="apy"]').value = '4';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    await el.updateComplete;

    expect(handler).toHaveBeenCalled();
    const detail = handler.mock.calls.at(-1)[0].detail;
    expect(detail.valid).toBe(true);
    expect(detail.depositAccount).toBeInstanceOf(DepositAccount);
    expect(detail.depositApy).toBeCloseTo(0.04);
  });

  it('renders provided results into mini outputs', async () => {
    const el = await renderSavingsCard();
    el.results = {
      depositInterest: 10,
      savingsEndBalance: 12,
      loanSavingsCost: -5,
      loanInterest: 20,
    };
    await el.updateComplete;

    const shadow = el.shadowRoot;
    expect(shadow.querySelector('[data-role="deposit-interest"]').textContent).toMatch(/\$10/);
    expect(shadow.querySelector('[data-role="savings-balance"]').textContent).toMatch(/\$12/);
    expect(shadow.querySelector('[data-role="loan-savings-cost"]').textContent).toMatch(/-\$/);
  });
});
