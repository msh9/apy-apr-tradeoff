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
      expect.arrayContaining(['Rate', 'APY', 'Amount', 'Term', 'Net Benefit (Cost)']),
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
});
