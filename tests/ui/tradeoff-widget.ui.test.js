import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TradeoffComparison } from '../../src/math/tradeoff.js';
import '../../src/ui/tradeoff-widget.ui.js';

const renderWidget = async () => {
  const element = document.createElement('tradeoff-widget');
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
};

describe('tradeoff-widget', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('normalizes percent inputs and computes when all inputs are valid', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 123.45 },
      creditCardRewards: { toDecimal: () => 10 },
      creditCardInterest: { toDecimal: () => 2.5 },
    });

    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '2000';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="termMonths"]').value = '12';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="apy"]').value = '5';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="loanRate"]').value = '4';
    shadow.querySelector('input[name="loanRate"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="ccRewardsRate"]').value = '1.5';
    shadow.querySelector('input[name="ccRewardsRate"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="ccRate"]').value = '28.99';
    shadow.querySelector('input[name="ccRate"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    expect(simulateSpy).toHaveBeenCalled();
    const lastCallArgs = simulateSpy.mock.calls.at(-1)[0];
    expect(lastCallArgs).toMatchObject({
      principal: 2000,
      periodCount: 12,
      depositApy: 0.05,
      loanRate: 0.04,
      ccRewardsRate: 0.015,
      ccRate: 0.2899,
    });

    expect(shadow.querySelector('[data-role="result"]').textContent).toMatch(/123\.45/);
    expect(shadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/\$10/);
    expect(shadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/\$2\.50/);
  });

  it('blocks calculation and surfaces an error when inputs are invalid', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario');
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '-10';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    expect(simulateSpy).not.toHaveBeenCalled();
    expect(shadow.querySelector('[data-role="error"]').textContent).toMatch(/positive value/i);
  });

  it('ignores non-numeric input fragments and avoids calculation', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario');
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '10abc';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    expect(simulateSpy).not.toHaveBeenCalled();
    expect(shadow.querySelector('[data-role="error"]').textContent).toBe('');
    expect(shadow.querySelector('[data-role="result"]').textContent).toMatch(
      /dollars gained or lost/,
    );
    expect(shadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/dollars/);
    expect(shadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/dollars/);
  });

  it('defaults the credit card rate when left empty', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 0 },
      creditCardRewards: { toDecimal: () => 0 },
      creditCardInterest: { toDecimal: () => 0 },
    });

    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '300';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="termMonths"]').value = '3';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="apy"]').value = '2';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="ccRewardsRate"]').value = '2';
    shadow.querySelector('input[name="ccRewardsRate"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    const lastCallArgs = simulateSpy.mock.calls.at(-1)[0];
    expect(lastCallArgs.ccRate).toBeCloseTo(0.2899, 4);
  });

  it('shows cost label and currency formatting for negative net values', async () => {
    vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => -99.99 },
      creditCardRewards: { toDecimal: () => 0 },
      creditCardInterest: { toDecimal: () => 0 },
    });

    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '1000';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="termMonths"]').value = '6';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="apy"]').value = '3';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="loanRate"]').value = '4';
    shadow.querySelector('input[name="loanRate"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    const resultText = shadow.querySelector('[data-role="result"]').textContent;
    expect(resultText).toMatch(/Cost/i);
    expect(resultText).toMatch(/\$99\.99/);
  });

  it('clears the result when an input is emptied after a valid calculation', async () => {
    vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 50 },
      creditCardRewards: { toDecimal: () => 5 },
      creditCardInterest: { toDecimal: () => 1.5 },
    });
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '1000';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="termMonths"]').value = '6';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="apy"]').value = '3';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    await element.updateComplete;
    expect(shadow.querySelector('[data-role="result"]').textContent).toMatch(/50/);
    expect(shadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/\$/);
    expect(shadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/\$/);

    shadow.querySelector('input[name="principal"]').value = '';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    expect(shadow.querySelector('[data-role="result"]').textContent).toBe('dollars gained or lost');
    expect(shadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/dollars/);
    expect(shadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/dollars/);
  });

  it('applies positive-range constraints via input attributes', async () => {
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    expect(shadow.querySelector('input[name="principal"]').getAttribute('min')).toBe('0');
    expect(shadow.querySelector('input[name="apy"]').getAttribute('min')).toBe('0');
    expect(shadow.querySelector('input[name="loanRate"]').getAttribute('min')).toBe('0');
    expect(shadow.querySelector('input[name="ccRewardsRate"]').getAttribute('min')).toBe('0');
    expect(shadow.querySelector('input[name="ccRate"]').getAttribute('min')).toBe('0');
    expect(shadow.querySelector('input[name="termMonths"]').getAttribute('min')).toBe('1');
  });

  it('reformats results when currency changes and falls back on invalid codes', async () => {
    vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 10 },
      creditCardRewards: { toDecimal: () => 3 },
      creditCardInterest: { toDecimal: () => 1 },
    });
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '100';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="termMonths"]').value = '3';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="apy"]').value = '5';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    element.currency = 'EUR';
    await element.updateComplete;
    expect(shadow.querySelector('[data-role="result"]').textContent).toMatch(/€/);
    expect(shadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/€/);
    expect(shadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/€/);

    element.currency = 'NOT-A-CODE';
    await element.updateComplete;
    expect(shadow.querySelector('[data-role="result"]').textContent).toMatch(/\$/);
    expect(shadow.querySelector('[data-role="cc-rewards"]').textContent).toMatch(/\$/);
    expect(shadow.querySelector('[data-role="cc-interest"]').textContent).toMatch(/\$/);
  });

  it('recalculates when periodDays changes after inputs are complete', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 1 },
      creditCardRewards: { toDecimal: () => 0 },
      creditCardInterest: { toDecimal: () => 0 },
    });
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '500';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="termMonths"]').value = '4';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="apy"]').value = '2';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    await element.updateComplete;
    expect(simulateSpy).toHaveBeenCalledTimes(1);

    element.periodDays = 28;
    await element.updateComplete;
    expect(simulateSpy).toHaveBeenCalledTimes(2);
  });

  it('requires a start date when real world mode is selected', async () => {
    const simulateSpy = vi.spyOn(TradeoffComparison.prototype, 'simulateScenario');
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    shadow.querySelector('input[name="principal"]').value = '400';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="termMonths"]').value = '4';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="apy"]').value = '3';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    const callsBeforeModeToggle = simulateSpy.mock.calls.length;
    shadow.querySelector('select[name="mode"]').value = 'real';
    shadow.querySelector('select[name="mode"]').dispatchEvent(new Event('input'));
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

    shadow.querySelector('input[name="principal"]').value = '500';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="termMonths"]').value = '3';
    shadow.querySelector('input[name="termMonths"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="apy"]').value = '4';
    shadow.querySelector('input[name="apy"]').dispatchEvent(new Event('input'));
    shadow.querySelector('select[name="mode"]').value = 'real';
    shadow.querySelector('select[name="mode"]').dispatchEvent(new Event('input'));
    shadow.querySelector('input[name="startDate"]').value = '2024-01-10';
    shadow.querySelector('input[name="startDate"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    const lastCallArgs = simulateSpy.mock.calls.at(-1)[0];
    expect(lastCallArgs.mode).toBe('real');
    expect(lastCallArgs.startDate).toBe('2024-01-10');
  });
});
