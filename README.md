# APY APR Tradeoffs

This library provides a small calculator to demonstrate the issues discussed in this [blog post](https://codinginthetrenches.com/2025/10/15/does-that-0-pay-over-time-loan-make-sense/). The library is structured in two parts. (1) a small module library that provides a couple functions for calculating the trade off between the cost of a loan over time plus yield from a held asset versus paying all at once using a rewards credit or similar. (2) An optional web component that provides form fields for a user to enter data and get numeric results from the library in (1).

While the blog post's focus is on 0% APR loans combined with high yield saving accounts versus rewards credits cards, the library can also be used for loans with greater than 0% APRs, cash discounts, and purchase fees.

## Assumptions

The calculator does make some simplifying assumptions. Namely,

1. Loans are either monthly or weekly periods
2. Loans are simple (ie not compounded) and fixed term
3. Deposit accounts accrue and compound interest daily
4. When using a credit card, the purchase is fully paid off within the next statement cycle so that the cardholder does not owe interest
5. A buyer using a credit card or loan will pay the same purchase price, *unless* there is an explicit credit card fee that increases the effective purchase price when using a credit card

## Inputs

The main inputs to the calculator are,

1. Purchase Price
2. Loan term and type (ie 6-months/monthly or 6 weeks/weekly, etc)
3. 'Cash' purchase discount, defaults to 0% (ie how much to discount the purchase price by if the buyer uses EFT/ACH/cash/etc)
4. Loan APR as a percentage
5. Deposit account APY as a percentage
6. Effective credit card rewards rate as a percentage
7. Credit card fee as a percentage

## Outputs

The main calculator outputs are,

1. The most efficient purchase type between loan, card, cash, etc in terms of reducing effective purchase cost
2. The monthly yield and payment schedule when using a loan with a high yield savings account
3. The difference in effective purchase cost reduction between credit card rewards and loans