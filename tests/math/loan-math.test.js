import { describe, expect, it } from 'vitest';

import { calculateLoanWithSavings } from '../../src/math/loan-math.js';

describe('calculations on zero APR loans starting "TODAY"', () => {
  it('calculates savings lift on loans on 6-month term', () => {
    const result = calculateLoanWithSavings({
      principal: 1200,
      termCount: 6,
      period: 'monthly',
      aprPercent: 0,
      apyPercent: 4.5,
    });

    expect(result.loan.paymentSchedule).toHaveLength(6);
    expect(result.loan.totalInterest).toBe(0);
    expect(result.loan.paymentPerPeriod).toBe(200);
    expect(result.savings.totalInterestEarned).toBeCloseTo(15.93, 2);
    expect(result.comparison.netBenefitVsCash).toBeCloseTo(15.93, 2);
    expect(result.comparison.additionalOutOfPocket).toBe(0);

    const finalPeriod = result.loan.paymentSchedule.at(-1);
    expect(finalPeriod.savingsBalance).toBeCloseTo(15.93, 2);
    expect(finalPeriod.externalContribution).toBe(0);
  });

  it('calculates savings lift on medium sized loans on 6-month term', () => {
    const result = calculateLoanWithSavings({
      principal: 25263.23,
      termCount: 6,
      period: 'monthly',
      aprPercent: 0,
      apyPercent: 4.89,
    });

    expect(result.loan.paymentSchedule).toHaveLength(6);
    expect(result.loan.totalInterest).toBe(0);
    expect(result.loan.paymentPerPeriod).toBeCloseTo(4210.54, 2);
    expect(result.savings.totalInterestEarned).toBeCloseTo(364.15, 2);
    expect(result.comparison.netBenefitVsCash).toBeCloseTo(364.15, 2);
    expect(result.comparison.additionalOutOfPocket).toBe(0);

    const finalPeriod = result.loan.paymentSchedule.at(-1);
    expect(finalPeriod.savingsBalance).toBeCloseTo(364.15, 2);
    expect(finalPeriod.externalContribution).toBe(0);
  });

  it('calculates zero savings lift APY are zero', () => {
    const result = calculateLoanWithSavings({
      principal: 1000000.0,
      termCount: 500,
      period: 'monthly',
      aprPercent: 0,
      apyPercent: 0,
    });

    expect(result.loan.paymentSchedule).toHaveLength(500);
    expect(result.loan.paymentPerPeriod).toBe(1000000 / 500);
    expect(result.comparison.netBenefitVsCash).toBe(0);
  });

  it('calculates savings lift on small dollar loans', () => {
    const result = calculateLoanWithSavings({
      principal: 13.49,
      termCount: 6,
      period: 'monthly',
      aprPercent: 0,
      apyPercent: 4.89,
    });

    expect(result.loan.paymentSchedule).toHaveLength(6);
    expect(result.loan.paymentPerPeriod).toBeCloseTo(2.25, 2);
    expect(result.comparison.netBenefitVsCash).toBeCloseTo(0.19, 2);
    expect(result.savings.totalInterestEarned).toBeCloseTo(0.19, 2);
  });
});

describe('calculate function validate inputs', () => {
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
