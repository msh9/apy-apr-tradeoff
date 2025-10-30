const PERIOD_CONFIG = {
  monthly: {
    periodsPerYear: 12,
    daysPerPeriod: 365 / 12,
  },
  weekly: {
    periodsPerYear: 52,
    daysPerPeriod: 7,
  },
};

const EPSILON = 1e-6;

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const toDecimal = (percent) => percent / 100;

const validateInputs = ({ principal, termCount, period, aprPercent, apyPercent }) => {
  if (!Number.isFinite(principal) || principal <= 0) {
    throw new Error('principal must be a positive finite number');
  }
  if (!Number.isInteger(termCount) || termCount <= 0) {
    throw new Error('termCount must be a positive integer');
  }
  if (!PERIOD_CONFIG[period]) {
    throw new Error(`period must be one of: ${Object.keys(PERIOD_CONFIG).join(', ')}`);
  }
  if (!Number.isFinite(aprPercent) || aprPercent < 0) {
    throw new Error('aprPercent must be a non-negative number');
  }
  if (!Number.isFinite(apyPercent) || apyPercent < 0) {
    throw new Error('apyPercent must be a non-negative number');
  }
};

/**
 * Calculates the effective cost of financing a purchase with a simple-interest loan
 * while keeping the principal in a daily-compounding savings account that is tapped
 * to make each installment payment.
 *
 * @param {Object} params
 * @param {number} params.principal - Purchase price / loan principal.
 * @param {number} params.termCount - Number of repayment periods.
 * @param {'monthly'|'weekly'} params.period - Period cadence for the loan.
 * @param {number} params.aprPercent - Simple-interest APR for the loan (percentage).
 * @param {number} params.apyPercent - Savings account APY (percentage, compounded daily).
 * @returns {Object} Loan, savings, and comparison metrics.
 */
export const calculateLoanWithSavings = ({
  principal,
  termCount,
  period,
  aprPercent,
  apyPercent,
}) => {
  validateInputs({ principal, termCount, period, aprPercent, apyPercent });

  const { periodsPerYear, daysPerPeriod } = PERIOD_CONFIG[period];

  const aprDecimal = toDecimal(aprPercent);
  const apyDecimal = toDecimal(apyPercent);

  const termYears = termCount / periodsPerYear;
  const totalLoanInterest = principal * aprDecimal * termYears;
  const totalLoanCost = principal + totalLoanInterest;
  const paymentPerPeriod = totalLoanCost / termCount;

  const dailyRate = Math.pow(1 + apyDecimal, 1 / 365) - 1;

  let savingsBalance = principal;
  let totalSavingsInterest = 0;
  let additionalOutOfPocket = 0;

  const paymentSchedule = Array.from({ length: termCount }, (_, index) => {
    const growthFactor = Math.pow(1 + dailyRate, daysPerPeriod);
    const balanceAfterInterest = savingsBalance * growthFactor;
    const periodInterest = balanceAfterInterest - savingsBalance;

    totalSavingsInterest += periodInterest;

    const balanceAfterPayment = balanceAfterInterest - paymentPerPeriod;
    const contribution = balanceAfterPayment < -EPSILON ? Math.abs(balanceAfterPayment) : 0;
    if (contribution > 0) {
      additionalOutOfPocket += contribution;
    }

    const normalizedBalance =
      contribution > 0 ? 0 : Math.abs(balanceAfterPayment) <= EPSILON ? 0 : balanceAfterPayment;

    savingsBalance = normalizedBalance;

    return {
      periodNumber: index + 1,
      payment: roundCurrency(paymentPerPeriod),
      interestAccrued: roundCurrency(periodInterest),
      savingsBalance: roundCurrency(savingsBalance),
      externalContribution: roundCurrency(contribution),
    };
  });

  const netBenefitVsCash = totalSavingsInterest - totalLoanInterest;
  const effectiveCostWithLoan = totalLoanCost - totalSavingsInterest;

  return {
    inputs: {
      principal,
      termCount,
      period,
      aprPercent,
      apyPercent,
    },
    loan: {
      totalInterest: roundCurrency(totalLoanInterest),
      totalPaid: roundCurrency(totalLoanCost),
      paymentPerPeriod: roundCurrency(paymentPerPeriod),
      paymentSchedule,
    },
    savings: {
      totalInterestEarned: roundCurrency(totalSavingsInterest),
      endingBalance: roundCurrency(savingsBalance),
      dailyRate,
    },
    comparison: {
      effectiveCostWithLoan: roundCurrency(effectiveCostWithLoan),
      netBenefitVsCash: roundCurrency(netBenefitVsCash),
      additionalOutOfPocket: roundCurrency(additionalOutOfPocket),
    },
    assumptions: {
      loanInterestType: 'simple',
      savingsCompounding: 'daily',
      daysPerPeriod,
      periodsPerYear,
    },
  };
};
