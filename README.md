# APY APR Tradeoffs

This library provides a small calculator to demonstrate the issues discussed in this [blog post](https://codinginthetrenches.com/2025/10/15/does-that-0-pay-over-time-loan-make-sense/). The library is structured in two parts. (1) a small library that provides a couple functions for calculating the trade off between the cost of a loan over time plus yield from a held asset versus paying all at once using a rewards credit or similar. (2) An optional web component that provides form fields for a user to enter data and get numeric results from the library in (1).

While the blog post's focus is on 0% APR loans combined with high yield saving accounts versus rewards credits cards, the library can also be used for loans with greater than 0% APRs.

## Assumptions

The calculator does make some simplifying assumptions. Namely,

1. Loans use monthly periods
2. Loans are simple (ie not compounded) and fixed term
3. Deposit accounts accrue and compound interest daily based on a 365 day year
4. A buyer using a credit card or loan will pay the same purchase price

## Usages and inputs

The calculator exposes a few different convenience functions with similar options for comparing purchase methods. The different functions expose different ways of handling interest expense and accrual over time. This is needed for to handle real work deposit and loan accounts where payment dates may not align or accounts may be on different accrual schedules, for example,

1. A loan with a non-compounding, weekly payment period loan backed by a daily compounding deposit account
2. A credit card with a 1.5% rewards rate and a 28.99% APR for unpaid balances

We handle these scenarios and other via two different methodologies.

1. Idealized world which assumes every month is 31 days (note well: that means a 372 day year...), monthly loans have payments due at the end of the 31-day month, and deposit account interest is deposited also at the end of the 31-day month. Furthermore, the deposit account daily accrual rate is calculated as 1/365 of the APY.
2. Real world which requires that the end user provide a starting date for calculations. With a starting date the calculator figures the actual number of days for each period, schedules loan payments on their true monthly due dates, accrues deposit interest daily, and only credits that interest at the end of each calendar month. Credit Card interest remains simplified, using a 31-day month statement period. Note well that this might result in a different net-benefit/cost value from #1 and might even change the result from net-benefit to net-cost.

The web component exposes a mode toggle to switch between the idealized and real-world calendars and requires a start date when using the real-world schedule.

## Cautions / Usage / Other notes

### How accruals are handled

Beyond the general statement above regarding daily compounding deposit interest. There are some additional specifics,
- Interest is computed daily with 20 digits of precision
- Interest is *posted* at month end with fractional pennies rolling over to the next month
- Loan payments are posted to a deposit account *before* that day's accrual calculation

### Other notes

The underlying library can be used as part of simpler term-loan and credit card interest calculators. The library, for the fun of it, uses an internally implemented arthimatic class based on decimal.js for handling monetary and related calculations. This is implemented in the 'mini-money.js' file.

I do _not_ recommend separately using the Amount class. While it does support some of the needed rounding semantics and it is not well used and is more of a utility class for use within this little example calculator than a full-fledged implementation.
