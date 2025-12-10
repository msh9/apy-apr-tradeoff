import { describe, expect, it } from 'vitest';

import { Account as CreditCardAccount } from '../../src/accounts/credit-card.js';
import { financialCalendar } from '../../src/math/constants.js';

describe('CreditCardAccount', () => {
  it('calculates rewards on a purchase using the rewards rate', () => {
    const account = new CreditCardAccount({ apr: 0.2899, rewardsRate: 0.02 });

    const rewards = account.calculateRewards(650.23);

    expect(rewards.toDecimal()).toBeCloseTo(13.0, 2);
  });

  it('calculates rewards on a purchase using a zero rewards ate', () => {
    const account = new CreditCardAccount({ apr: 0.2899, rewardsRate: 0 });

    const rewards = account.calculateRewards(650.23);

    expect(rewards.toDecimal()).toBeCloseTo(0, 2);
  });

  it('accrues daily compounding interest for a billing cycle', () => {
    const account = new CreditCardAccount({ apr: 0.2899 });
    const purchaseAmount = 750;

    const interest = account.interestForDays(purchaseAmount, financialCalendar.daysInMonth);

    expect(interest.toDecimal()).toBeCloseTo(18.69, 2);
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
