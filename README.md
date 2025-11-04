# APY APR Tradeoffs

This library provides a small calculator to demonstrate the issues discussed in this [blog post](https://codinginthetrenches.com/2025/10/15/does-that-0-pay-over-time-loan-make-sense/). The library is structured in two parts. (1) a small module library that provides a couple functions for calculating the trade off between the cost of a loan over time plus yield from a held asset versus paying all at once using a rewards credit or similar. (2) An optional web component that provides form fields for a user to enter data and get numeric results from the library in (1).

While the blog post's focus is on 0% APR loans combined with high yield saving accounts versus rewards credits cards, the library can also be used for loans with greater than 0% APRs, cash discounts, and purchase fees.

## Assumptions

The calculator does make some simplifying assumptions. Namely,

1. Loans are either monthly or weekly periods
2. Loans are simple (ie not compounded) and fixed term
3. Deposit accounts accrue and compound interest daily 
4. When using a credit card, the purchase is fully paid off within the next statement cycle so that the cardholder does not owe interest
5. A buyer using a credit card or loan will pay the same purchase price, _unless_ there is an explicit credit card fee that increases the effective purchase price when using a credit card

## Usages and inputs

The calculator exposes a few different convenience functions with similar options for comparing purchase methods. The different functions expose different ways of handling interest expense and accrual over time. This is needed for to handle real work deposit and loan accounts where payment dates may not align or accounts may be on different accrual schedules, for example,

1. A loan with a non-compounding, weekly payment period loan backed by a daily compounding deposit account
2. A loan with a non-compounding monthly payment period that is unaligned with a daily compounting, monthly paying deposit account (ie loan payments are owed every 17th of the month and deposit interest is deposited at the end of the month).

We handle these scenarios and other via two different methodologies.

1. Idealized world which assumes every month is 31 days (note well: that means a 372 day year...), monthly loans have payments due at the end of the 31-day month, and deposit account interest is deposited also at the end of the 31-day month. Furthermore, the deposit account daily accrual rate is calculated as 1/365 of the APY.
2. Real world which requires that the end user provide a starting date for calculations. With a starting date the calculator then figures the actual number of days/weeks/months etc for loan and deposit accounts.

Underneath the aforementioned convenience functions, we expose functions for calculating simple term loan interest, deposit account accruals, and related data.
