import { describe, expect, it } from 'vitest';

import { Account as CreditCardAccount } from '../../src/accounts/credit-card.js';
import { financialCalendar } from '../../src/math/constants.js';

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

    expect(interest.toDecimal()).toBeCloseTo(18.6879325478, 10);
  });

  it('returns zero interest for a zero length cycle', () => {
    const account = new CreditCardAccount({ apr: 0.25 });

    const interest = account.interestForDays(100, 0);

    expect(interest.toDecimal()).toBe(0);
  });

  it('returns zero interest for a zero apr cycle', () => {
    const account = new CreditCardAccount({ apr: 0 });
    const interest = account.interestForDays(1200, financialCalendar.daysInMonth);
    expect(interest.toDecimal()).toBe(0);
  });
});
