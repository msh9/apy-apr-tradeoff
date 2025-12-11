import { describe, expect, it, vi } from 'vitest';

import { Account as LoanAccount } from '../../src/accounts/loan.js';
import '../../src/ui/loan-card.ui.js';

const renderLoanCard = async () => {
  const el = document.createElement('loan-card');
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

describe('loan-card', () => {
  it('emits a loan-change event with a LoanAccount when inputs are valid', async () => {
    const el = await renderLoanCard();
    const shadow = el.shadowRoot;
    const handler = vi.fn();
    el.addEventListener('loan-change', handler);

    el.principal = 1000;
    shadow.querySelector('input[name="termMonths"]').value = '6';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="loanRate"]').value = '5';
    shadow.querySelector('input[name="loanRate"]').dispatchEvent(new Event('input'));
    await el.updateComplete;

    expect(handler).toHaveBeenCalled();
    const detail = handler.mock.calls.at(-1)[0].detail;
    expect(detail.valid).toBe(true);
    expect(detail.loanAccount).toBeInstanceOf(LoanAccount);
    expect(detail.loanRate).toBeCloseTo(0.05);
    expect(detail.termMonths).toBe(6);
    expect(detail.monthlyPayment).toBeGreaterThan(0);
  });

  it('emits invalid change when principal is missing', async () => {
    const el = await renderLoanCard();
    const handler = vi.fn();
    el.addEventListener('loan-change', handler);

    const shadow = el.shadowRoot;
    shadow.querySelector('input[name="termMonths"]').value = '6';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    await el.updateComplete;

    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls.at(-1)[0].detail.valid).toBe(false);
  });
});
