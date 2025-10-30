import { describe, expect, it } from 'vitest';

import { calculateLoanWithSavings } from '../../src/math/loan-math.js';

describe('calculateLoanWithSavings', () => {
  it('captures savings lift when APR is zero and funds remain invested monthly', () => {
    const result = calculateLoanWithSavings({
      principal: 1200,
      termCount: 12,
      period: 'monthly',
      aprPercent: 0,
      apyPercent: 4.5,
    });

    expect(result.loan.paymentSchedule).toHaveLength(12);
    expect(result.loan.totalInterest).toBe(0);
    expect(result.loan.paymentPerPeriod).toBe(100);
    expect(result.savings.totalInterestEarned).toBeCloseTo(29.45, 2);
    expect(result.comparison.netBenefitVsCash).toBeCloseTo(29.45, 2);
    expect(result.comparison.additionalOutOfPocket).toBe(0);

    const finalPeriod = result.loan.paymentSchedule.at(-1);
    expect(finalPeriod.savingsBalance).toBeCloseTo(29.45, 2);
    expect(finalPeriod.externalContribution).toBe(0);
  });

  it('tracks external contributions when loan interest exceeds savings yield (weekly cadence)', () => {
    const result = calculateLoanWithSavings({
      principal: 500,
      termCount: 26,
      period: 'weekly',
      aprPercent: 5,
      apyPercent: 4,
    });

    expect(result.loan.totalInterest).toBeCloseTo(12.5, 2);
    expect(result.loan.paymentPerPeriod).toBeCloseTo(19.71, 2);
    expect(result.savings.totalInterestEarned).toBeCloseTo(5.02, 2);
    expect(result.comparison.netBenefitVsCash).toBeCloseTo(-7.48, 2);

    const contributions = result.loan.paymentSchedule.map((entry) => entry.externalContribution);
    expect(contributions.at(-1)).toBeCloseTo(7.48, 2);
    const totalContributions = contributions.reduce((acc, value) => acc + value, 0);
    expect(totalContributions).toBeCloseTo(result.comparison.additionalOutOfPocket, 2);
  });

  it('validates required inputs', () => {
    expect(() =>
      calculateLoanWithSavings({
        principal: 0,
        termCount: 6,
        period: 'monthly',
        aprPercent: 0,
        apyPercent: 0,
      }),
    ).toThrow(/principal/);

    expect(() =>
      calculateLoanWithSavings({
        principal: 1000,
        termCount: 6,
        period: 'daily',
        aprPercent: 0,
        apyPercent: 0,
      }),
    ).toThrow(/period/);
  });
});
