import { afterEach, describe, expect, it, vi } from 'vitest';

import '../../src/ui/credit-card-card.ui.js';

const renderCard = async () => {
  const element = document.createElement('credit-card-card');
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
};

const setValue = (input, value) => {
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

describe('credit-card-card', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('emits cc-change with parsed rates and computed values', async () => {
    const listener = vi.fn();
    const element = await renderCard();
    element.principal = 500;
    element.periodDays = 28;
    element.addEventListener('cc-change', (event) => listener(event.detail));
    await element.updateComplete;

    const shadow = element.shadowRoot;
    setValue(shadow.querySelector('input[name="ccRate"]'), '24');
    setValue(shadow.querySelector('input[name="ccRewardsRate"]'), '2');
    await element.updateComplete;

    expect(listener).toHaveBeenCalled();
    const detail = listener.mock.calls.at(-1)[0];
    expect(detail.valid).toBe(true);
    expect(detail.ccRate).toBeCloseTo(0.24, 4);
    expect(detail.ccRewardsRate).toBeCloseTo(0.02, 4);
    expect(detail.rewardsValue).toBeGreaterThan(0);
    expect(detail.interestValue).toBeGreaterThan(0);
    expect(detail.periodDays).toBe(28);
  });

  it('uses defaults and signals invalid on bad input', async () => {
    const listener = vi.fn();
    const element = await renderCard();
    element.principal = -1;
    element.addEventListener('cc-change', (event) => listener(event.detail));
    await element.updateComplete;

    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls.at(-1)[0].valid).toBe(false);
  });

  it('formats currency output with provided code', async () => {
    const element = await renderCard();
    element.principal = 200;
    element.currency = 'EUR';
    await element.updateComplete;

    const shadow = element.shadowRoot;
    setValue(shadow.querySelector('input[name="ccRate"]'), '20');
    await element.updateComplete;
    expect(shadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/€/);
    expect(shadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/€/);
  });
});
