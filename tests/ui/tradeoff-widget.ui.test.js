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

  it('renders labeled inputs and result area matching the mock', async () => {
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    const labels = Array.from(shadow.querySelectorAll('label')).map((node) =>
      node.textContent.trim(),
    );
    expect(labels).toEqual(
      expect.arrayContaining([
        'Nominal Annual Loan Rate',
        'APY',
        'Amount',
        'Term',
        'Net Benefit (Cost)',
      ]),
    );

    expect(shadow.querySelector('input[name="loanRate"]').placeholder).toContain('Rate');
    expect(shadow.querySelector('input[name="apy"]').placeholder).toContain('APY');
    expect(shadow.querySelector('input[name="principal"]').placeholder).toContain('Purchase');
    expect(shadow.querySelector('input[name="termMonths"]').placeholder).toContain('months');
  });

  it('normalizes percent inputs and computes when all inputs are valid', async () => {
    const simulateSpy = vi
      .spyOn(TradeoffComparison.prototype, 'simulateScenario')
      .mockReturnValue({ net: { toDecimal: () => 123.45 } });

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
    await element.updateComplete;

    expect(simulateSpy).toHaveBeenCalled();
    const lastCallArgs = simulateSpy.mock.calls.at(-1)[0];
    expect(lastCallArgs).toMatchObject({
      principal: 2000,
      periodCount: 12,
      depositApy: 0.05,
      loanRate: 0.04,
    });

    expect(shadow.querySelector('[data-role="result"]').textContent).toMatch(/123\.45/);
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
  });

  it('shows cost label and currency formatting for negative net values', async () => {
    vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => -99.99 },
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

    shadow.querySelector('input[name="principal"]').value = '';
    shadow.querySelector('input[name="principal"]').dispatchEvent(new Event('input'));
    await element.updateComplete;

    expect(shadow.querySelector('[data-role="result"]').textContent).toBe('dollars gained or lost');
  });

  it('applies positive-range constraints via input attributes', async () => {
    const element = await renderWidget();
    const shadow = element.shadowRoot;

    expect(shadow.querySelector('input[name="principal"]').getAttribute('min')).toBe('0');
    expect(shadow.querySelector('input[name="apy"]').getAttribute('min')).toBe('0');
    expect(shadow.querySelector('input[name="loanRate"]').getAttribute('min')).toBe('0');
    expect(shadow.querySelector('input[name="termMonths"]').getAttribute('min')).toBe('1');
  });

  it('reformats results when currency changes and falls back on invalid codes', async () => {
    vi.spyOn(TradeoffComparison.prototype, 'simulateScenario').mockReturnValue({
      net: { toDecimal: () => 10 },
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

    element.currency = 'NOT-A-CODE';
    await element.updateComplete;
    expect(shadow.querySelector('[data-role="result"]').textContent).toMatch(/\$/);
  });

  it('recalculates when periodDays changes after inputs are complete', async () => {
    const simulateSpy = vi
      .spyOn(TradeoffComparison.prototype, 'simulateScenario')
      .mockReturnValue({ net: { toDecimal: () => 1 } });
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
});
