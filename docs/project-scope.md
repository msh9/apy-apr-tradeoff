# Project Scope

## Loan Versus Lump Sum Scenarios

- Provide a reusable math module that compares effective purchase costs between installment loans, credit card rewards, and cash/ACH discounts while respecting inputs from the README and internal guidelines.
- Offer a Lit-based web component that surfaces the core comparison in a browser with default light/dark styling and CSS hooks for host customization.
- Keep monetary calculations precise, avoiding floating point drift; only round for final presentation.

## Economic Assumptions

- Loans considered in v1 are fixed-term, simple-interest products with either monthly or weekly cadence.
- Deposited funds earn daily-compounded interest, reflecting current high-yield savings behavior noted in the reference blog article.
- Shoppers using credit cards pay the same sticker price unless an explicit card fee is modeled; card balances are paid in full by the next statement to avoid card interest.
- Cash buyers may receive a configurable percentage discount on the purchase price.

## Blog Alignment Notes

- The motivating scenario contrasts 0% APR “buy now, pay later” offers against keeping cash in a high-yield account versus paying-up-front on a rewards card; the library should keep these comparison levers front-and-center to match the article narrative.
- Highlight sensitivity to APY shifts, loan fee add-ons, and promotional timeframes so users can explore when “0%” financing loses its edge once opportunity cost and card rewards are considered.
