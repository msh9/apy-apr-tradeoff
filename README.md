# APY APR Tradeoffs

This library provides a small calculator to demonstrate the issues discussed in this [blog post](https://codinginthetrenches.com/2025/10/15/does-that-0-pay-over-time-loan-make-sense/). The library is structured in two parts. (1) a small module library that provides a couple functions for calculating the trade off between the cost of a loan over time plus yield from a held asset versus paying all at once using a rewards credit or similar. (2) An optional web component that provides form fields for a user to enter data and get numeric results from the library in (1).

While the blog post's focus is on 0% APR loans combined with high yield saving accounts versus rewards credits cards, the library can also be used for loans with greater than 0% APRs, cash discounts, and purchase fees.

## Assumptions

The calculator does make some simplifying assumptions. Namely,

1. Loans ause monthly periods
2. Loans are simple (ie not compounded) and fixed term
3. Deposit accounts accrue and compound interest daily
4. When using a credit card, the purchase is fully paid off within the next statement cycle so that the cardholder does not owe interest
5. A buyer using a credit card or loan will pay the same purchase price, _unless_ there is an explicit credit card fee that increases the effective purchase price when using a credit card

## Usages and inputs

The calculator exposes a few different convenience functions with similar options for comparing purchase methods. The different functions expose different ways of handling interest expense and accrual over time. This is needed for to handle real work deposit and loan accounts where payment dates may not align or accounts may be on different accrual schedules, for example,

1. A loan with a non-compounding, weekly payment period loan backed by a daily compounding deposit account

We handle these scenarios and other via two different methodologies.

1. Idealized world which assumes every month is 31 days (note well: that means a 372 day year...), monthly loans have payments due at the end of the 31-day month, and deposit account interest is deposited also at the end of the 31-day month. Furthermore, the deposit account daily accrual rate is calculated as 1/365 of the APY.
2. Real world which requires that the end user provide a starting date for calculations. With a starting date the calculator then figures the actual number of days/weeks/months etc for loan and deposit accounts.

Underneath the aforementioned convenience functions, we expose functions for calculating simple term loan interest, deposit account accruals, and related data.

## Module reference

The math helpers that power the UI live under `src/math/`. Each file focuses on a single responsibility so you can reuse the helpers without pulling in the entire web component.

### `src/math/mini-money.js`

- Exposes the `Amount` class, a fixed-precision numeric type that avoids floating point rounding drift by recording values internally as 20-decimal-place integers.
- Provides addition, subtraction, multiplication, and division helpers that return new `Amount` instances. Division guards against divide-by-zero and truncates toward zero.
- Includes a `pow` helper that raises an `Amount` to a non-negative integer exponent using repeated multiplication (used by the loan amortization functions).
- Convert back to a native number with `amount.toDecimal()` whenever you need to display a result. All public APIs accept either a number or an `Amount`, automatically converting as needed.

```js
import { Amount } from './src/math/mini-money.js';

const balance = new Amount(1523.45);
const withInterest = balance.multiplyBy(new Amount(1.05));
console.log(withInterest.toDecimal()); // 1599.62 with full precision
```

### `src/math/loan.js`

- Implements a simple-interest, fixed-term installment loan `Account`. Only monthly periods are supported today, mirroring most consumer "0% APR" offers.
- The constructor validates non-negative rates, non-negative principals, and requires an integer `periodCount`.
- `payment()` calculates a constant payment amount for every period. Zero-interest loans are rounded down to the nearest cent per period so that the borrower never overpays.
- `totalInterest()` sums the scheduled payments, subtracts principal, and rounds down to cents unless almost a full penny would otherwise be lost (it keeps ≥$0.0095 fractions to stay borrower-friendly).
- Internally, periodic rates are derived by dividing the nominal annual rate by 12 (see `financialCalendar.monthsInYear`). Compounding uses the `Amount#pow` helper, so no floating point math sneaks in.

```js
import { Account as LoanAccount } from './src/math/loan.js';

const loan = new LoanAccount(12, 'month', 0.0799, 1200);
loan.payment().toDecimal(); // -> monthly payment
loan.totalInterest().toDecimal(); // -> total dollars of finance charges
```

### `src/math/deposit.js`

- Models a deposit `Account` with daily compounding. The constructor accepts an opening balance and APY (numbers or `Amount`s) and derives a daily rate from the APY via `(1 + apy)^(1/365) - 1`.
- `balance` is exposed via a getter/setter that always stores an `Amount`. The module assumes no maintenance fees or transfer limits.
- `withdraw(amount)` enforces non-negative amounts and prevents overdrafts by throwing if the withdrawal exceeds the balance.
- `accrueForDays(days)` compounds the balance day-by-day using the pre-computed daily rate. Interest is immediately added to the balance (unlike many real institutions that post interest monthly), which aligns with the calculator’s assumption that interest is accessible as soon as it accrues.

```js
import { Account as DepositAccount } from './src/math/deposit.js';

const savings = new DepositAccount(1500, 0.05);
savings.accrueForDays(14).balance.toDecimal(); // balance after two weeks
savings.withdraw(200);
```

These modules form the foundation for comparing an installment loan (or a credit card paid in full each cycle) against the opportunity cost of keeping funds in a high-yield deposit account. Consume them directly for your own flows, or rely on the bundled web component for a ready-to-use UI.
