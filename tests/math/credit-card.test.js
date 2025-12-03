import { describe, expect, it } from 'vitest';

import { financialCalendar } from '../../src/math/constants.js';
import { Account as CreditCardAccount } from '../../src/math/credit-card.js';

describe('CreditCardAccount', () => {
  it('calculates rewards on a purchase using the rewards rate', () => {
    const account = new CreditCardAccount({ apr: 0.2899, rewardsRate: 0.02 });

    const rewards = account.calculateRewards(500);

    expect(rewards.toDecimal()).toBeCloseTo(10, 10);
  });

  it('accrues daily compounding interest for a billing cycle', () => {
    const account = new CreditCardAccount({ apr: 0.2899 });
    const purchaseAmount = 750;

    const interest = account.interestForDays(purchaseAmount, financialCalendar.daysInMonth);

    const expected =
      purchaseAmount *
      (Math.pow(1 + 0.2899 / financialCalendar.daysInYear, financialCalendar.daysInMonth) - 1);
    expect(interest.toDecimal()).toBeCloseTo(expected, 8);
  });

  it('returns zero interest for a zero length cycle', () => {
    const account = new CreditCardAccount({ apr: 0.25 });

    const interest = account.interestForDays(100, 0);

    expect(interest.toDecimal()).toBe(0);
  });
});
