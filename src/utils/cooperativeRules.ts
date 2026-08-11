/**
 * Lightway Cooperative Management System (LCMS PRO)
 * Official Cooperative Business Rules & Calculation Engine
 */

import {
  SavingsDeposit,
  User,
  LoanApplication,
  HonorariumConfig,
  MemberDividendRecord,
  DividendSummaryStats,
  SurplusAppropriationConfig,
  DividendSubPolicy,
  CooperativeLiabilityAccount,
  SurplusAllocationItem,
} from '../types';

export interface MemberNairaAtRiskSummary {
  memberNo: string;
  memberName: string;
  totalSavings: number;
  totalNairaAtRisk: number;
  memberProportion: number; // 0.0 to 1.0
  memberProportionPercent: string; // e.g. "12.45%"
  calculatedDividend: number;
  dailyBreakdown: Array<{
    date: string;
    dailyTotalAmount: number;
    daysRemaining: number;
    dailyNairaAtRisk: number;
    transactionCount: number;
  }>;
}

export interface CooperativeNairaAtRiskEngineResult {
  cooperativeTotalSavings: number;
  cooperativeTotalNairaAtRisk: number;
  totalDividendAvailable: number;
  memberSummaries: Record<string, MemberNairaAtRiskSummary>;
  memberList: MemberNairaAtRiskSummary[];
}

export interface FullDividendEngineResult {
  summary: DividendSummaryStats;
  records: MemberDividendRecord[];
  honorariumConfig: HonorariumConfig;
}

export const DEFAULT_HONORARIUM_CONFIG: HonorariumConfig = {
  allocationMode: 'equal',
  recipients: [
    { id: 'hon_1', memberId: 'usr_admin01', memberNo: 'LCMS-ADM-001', memberName: 'Mr. Ige Ebenezer', roleTitle: 'Founder & Super Administrator', percentageShare: 100, allocatedAmount: 0 },
  ],
};

export const DEFAULT_DIVIDEND_SUB_POLICY: DividendSubPolicy = {
  savingsPercentage: 50,
  borrowerPercentage: 20,
  guarantorPercentage: 20,
  honorariumPercentage: 10,
};

export const DEFAULT_SURPLUS_APPROPRIATION_CONFIG: SurplusAppropriationConfig = {
  accountingYear: 2026,
  totalAssets: 0,
  totalMembersSavings: 0,
  externalLiabilities: 0,
  annualSurplusAvailable: 0,
  approvalStatus: 'Draft / Calculation Mode',
  allocations: [
    { id: 'alloc_1', categoryKey: 'general_dividend', name: 'General Member Dividend Pool', percentage: 50, amount: 0, isPaid: false, paidAmount: 0, notes: '50% of surplus allocated to member dividend pool' },
    { id: 'alloc_2', categoryKey: 'reserve_fund', name: 'Statutory Reserve Fund (20% Mandatory)', percentage: 20, amount: 0, isPaid: false, paidAmount: 0, notes: 'Cooperative Law Statutory Reserve' },
    { id: 'alloc_3', categoryKey: 'education_fund', name: 'Cooperative Education & Training Fund (5%)', percentage: 5, amount: 0, isPaid: false, paidAmount: 0, notes: 'Member financial literacy & leadership seminars' },
    { id: 'alloc_4', categoryKey: 'business_owners_share', name: 'Business Owners / Enterprise Ventures Share (10%)', percentage: 10, amount: 0, isPaid: false, paidAmount: 0, notes: 'Venture Partners Share' },
    { id: 'alloc_5', categoryKey: 'honorarium', name: 'Executive Honorarium Pool (5%)', percentage: 5, amount: 0, isPaid: false, paidAmount: 0, notes: 'AGM approved executive leadership bonus' },
    { id: 'alloc_6', categoryKey: 'retained_earnings', name: 'Retained Earnings for Capital Expansion (10%)', percentage: 10, amount: 0, isPaid: false, paidAmount: 0, notes: 'Re-invested into cooperative assets' },
  ],
  dividendSubPolicy: DEFAULT_DIVIDEND_SUB_POLICY,
};

/**
 * STEP 1 & 2 & 4: CALCULATE ANNUAL SURPLUS, APPROPRIATIONS & LIABILITY ACCOUNTS
 * Formula: Annual Surplus = Total Assets - Total Members' Contributory Savings - External Liabilities
 */
export function calculateAnnualSurplusAndAppropriation(
  totalAssets: number = 1838800000,
  totalMembersSavings: number = 1450800000,
  externalLiabilities: number = 25000000,
  allocationsConfig: SurplusAllocationItem[] = DEFAULT_SURPLUS_APPROPRIATION_CONFIG.allocations,
  dividendSubPolicy: DividendSubPolicy = DEFAULT_DIVIDEND_SUB_POLICY,
  approvalStatus: 'Draft / Calculation Mode' | 'Approved by Executive' | 'AGM Approved & Declared' | 'AGM Declared & Paid' = 'Draft / Calculation Mode'
) {
  // Step 1: Calculate Annual Surplus Available for Appropriation
  const annualSurplusAvailable = Math.max(0, totalAssets - totalMembersSavings - externalLiabilities);

  // Step 2: Recalculate Allocation Amounts
  const updatedAllocations = allocationsConfig.map((item) => {
    const computedAmount = Math.round((item.percentage / 100) * annualSurplusAvailable);
    return {
      ...item,
      amount: item.percentage > 0 ? computedAmount : item.amount,
    };
  });

  // Step 4: Create Liability Accounts corresponding to approved allocations
  const liabilityAccounts: CooperativeLiabilityAccount[] = [
    {
      id: 'lia_div_01',
      code: 'LIA-2010',
      name: 'Member Dividend Payable Ledger',
      category: 'general_dividend',
      totalAllocated: updatedAllocations.find((a) => a.categoryKey === 'general_dividend')?.amount || 0,
      totalPaidOut: updatedAllocations.find((a) => a.categoryKey === 'general_dividend')?.paidAmount || 0,
      outstandingBalance:
        (updatedAllocations.find((a) => a.categoryKey === 'general_dividend')?.amount || 0) -
        (updatedAllocations.find((a) => a.categoryKey === 'general_dividend')?.paidAmount || 0),
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'lia_hon_02',
      code: 'LIA-2020',
      name: 'Executive Honorarium Payable',
      category: 'honorarium',
      totalAllocated: updatedAllocations.find((a) => a.categoryKey === 'honorarium')?.amount || 0,
      totalPaidOut: updatedAllocations.find((a) => a.categoryKey === 'honorarium')?.paidAmount || 0,
      outstandingBalance:
        (updatedAllocations.find((a) => a.categoryKey === 'honorarium')?.amount || 0) -
        (updatedAllocations.find((a) => a.categoryKey === 'honorarium')?.paidAmount || 0),
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'lia_biz_03',
      code: 'LIA-2030',
      name: "Business Owners' / Cement Supervisor Share Payable",
      category: 'business_owners_share',
      totalAllocated: updatedAllocations.find((a) => a.categoryKey === 'business_owners_share')?.amount || 0,
      totalPaidOut: updatedAllocations.find((a) => a.categoryKey === 'business_owners_share')?.paidAmount || 0,
      outstandingBalance:
        (updatedAllocations.find((a) => a.categoryKey === 'business_owners_share')?.amount || 0) -
        (updatedAllocations.find((a) => a.categoryKey === 'business_owners_share')?.paidAmount || 0),
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'lia_res_04',
      code: 'LIA-2040',
      name: 'Statutory Reserve Fund Pool',
      category: 'reserve_fund',
      totalAllocated: updatedAllocations.find((a) => a.categoryKey === 'reserve_fund')?.amount || 0,
      totalPaidOut: updatedAllocations.find((a) => a.categoryKey === 'reserve_fund')?.paidAmount || 0,
      outstandingBalance:
        (updatedAllocations.find((a) => a.categoryKey === 'reserve_fund')?.amount || 0) -
        (updatedAllocations.find((a) => a.categoryKey === 'reserve_fund')?.paidAmount || 0),
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'lia_edu_05',
      code: 'LIA-2050',
      name: 'Cooperative Education & Training Fund Payable',
      category: 'education_fund',
      totalAllocated: updatedAllocations.find((a) => a.categoryKey === 'education_fund')?.amount || 0,
      totalPaidOut: updatedAllocations.find((a) => a.categoryKey === 'education_fund')?.paidAmount || 0,
      outstandingBalance:
        (updatedAllocations.find((a) => a.categoryKey === 'education_fund')?.amount || 0) -
        (updatedAllocations.find((a) => a.categoryKey === 'education_fund')?.paidAmount || 0),
      lastUpdated: new Date().toISOString().split('T')[0],
    },
    {
      id: 'lia_ret_06',
      code: 'LIA-2060',
      name: 'Retained Earnings Reserve',
      category: 'retained_earnings',
      totalAllocated: updatedAllocations.find((a) => a.categoryKey === 'retained_earnings')?.amount || 0,
      totalPaidOut: updatedAllocations.find((a) => a.categoryKey === 'retained_earnings')?.paidAmount || 0,
      outstandingBalance:
        (updatedAllocations.find((a) => a.categoryKey === 'retained_earnings')?.amount || 0) -
        (updatedAllocations.find((a) => a.categoryKey === 'retained_earnings')?.paidAmount || 0),
      lastUpdated: new Date().toISOString().split('T')[0],
    },
  ];

  return {
    annualSurplusAvailable,
    totalAssets,
    totalMembersSavings,
    externalLiabilities,
    allocations: updatedAllocations,
    liabilityAccounts,
    approvalStatus,
    dividendSubPolicy,
  };
}

/**
 * Calculates days remaining in the year until December 31 inclusive
 * Example:
 * Jan 1, 2026 -> 365 days
 * March 15, 2026 -> 292 days
 * Dec 31, 2026 -> 1 day
 */
export function calculateDaysRemainingInYear(dateString: string): number {
  try {
    const parts = dateString.split('-');
    if (parts.length < 3) return 365;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);

    const depositDate = new Date(year, month, day);
    const dec31 = new Date(year, 11, 31);

    const diffMs = dec31.getTime() - depositDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Jan 1 -> 364 diff + 1 = 365 days
    return Math.max(1, diffDays + 1);
  } catch (e) {
    return 365;
  }
}

/**
 * Calculates exact Naira At Risk, Member Proportions, and Dividend Allocations
 * for all members based on savings transaction history and declared total dividend available.
 */
export function calculateCooperativeNairaAtRisk(
  users: User[],
  deposits: SavingsDeposit[],
  totalDividendAvailable: number = 50000000
): CooperativeNairaAtRiskEngineResult {
  // 1. Group deposits by member and then by date
  const memberDailyMap: Record<
    string,
    Record<string, { totalAmount: number; count: number }>
  > = {};

  // Initialize all active members in the map
  users.forEach((u) => {
    if (!memberDailyMap[u.memberNo]) {
      memberDailyMap[u.memberNo] = {};
    }
  });

  // Aggregate daily totals per member
  deposits.forEach((dep) => {
    if (!dep.memberNo) return;
    if (!memberDailyMap[dep.memberNo]) {
      memberDailyMap[dep.memberNo] = {};
    }

    const dateStr = dep.depositDate || '2026-01-01';
    if (!memberDailyMap[dep.memberNo][dateStr]) {
      memberDailyMap[dep.memberNo][dateStr] = { totalAmount: 0, count: 0 };
    }

    memberDailyMap[dep.memberNo][dateStr].totalAmount += dep.amount;
    memberDailyMap[dep.memberNo][dateStr].count += 1;
  });

  // 2. Compute individual Member Total Savings & Member Total Naira At Risk
  let cooperativeTotalNairaAtRisk = 0;
  let cooperativeTotalSavings = 0;

  const rawSummaries: Record<
    string,
    {
      memberNo: string;
      memberName: string;
      totalSavings: number;
      totalNairaAtRisk: number;
      dailyBreakdown: Array<{
        date: string;
        dailyTotalAmount: number;
        daysRemaining: number;
        dailyNairaAtRisk: number;
        transactionCount: number;
      }>;
    }
  > = {};

  users.forEach((user) => {
    const memberNo = user.memberNo;
    const dailyMap = memberDailyMap[memberNo] || {};

    let totalSavings = 0;
    let totalNairaAtRisk = 0;
    const dailyBreakdown: Array<{
      date: string;
      dailyTotalAmount: number;
      daysRemaining: number;
      dailyNairaAtRisk: number;
      transactionCount: number;
    }> = [];

    Object.keys(dailyMap).sort().forEach((dateStr) => {
      const dailyTotalAmount = dailyMap[dateStr].totalAmount;
      const count = dailyMap[dateStr].count;
      const daysRemaining = calculateDaysRemainingInYear(dateStr);
      const dailyNairaAtRisk = dailyTotalAmount * daysRemaining;

      totalSavings += dailyTotalAmount;
      totalNairaAtRisk += dailyNairaAtRisk;

      dailyBreakdown.push({
        date: dateStr,
        dailyTotalAmount,
        daysRemaining,
        dailyNairaAtRisk,
        transactionCount: count,
      });
    });



    cooperativeTotalSavings += totalSavings;
    cooperativeTotalNairaAtRisk += totalNairaAtRisk;

    rawSummaries[memberNo] = {
      memberNo,
      memberName: user.fullName,
      totalSavings,
      totalNairaAtRisk,
      dailyBreakdown,
    };
  });

  // 3. Compute Member Proportion & Member Dividend
  const memberSummaries: Record<string, MemberNairaAtRiskSummary> = {};
  const memberList: MemberNairaAtRiskSummary[] = [];

  users.forEach((user) => {
    const memberNo = user.memberNo;
    const raw = rawSummaries[memberNo] || {
      memberNo,
      memberName: user.fullName,
      totalSavings: 0,
      totalNairaAtRisk: 0,
      dailyBreakdown: [],
    };

    const memberProportion =
      cooperativeTotalNairaAtRisk > 0
        ? raw.totalNairaAtRisk / cooperativeTotalNairaAtRisk
        : 0;

    const memberProportionPercent = `${(memberProportion * 100).toFixed(4)}%`;

    const calculatedDividend = Math.round(
      memberProportion * totalDividendAvailable * 100
    ) / 100;

    const summary: MemberNairaAtRiskSummary = {
      ...raw,
      memberProportion,
      memberProportionPercent,
      calculatedDividend,
    };

    memberSummaries[memberNo] = summary;
    memberList.push(summary);
  });

  return {
    cooperativeTotalSavings,
    cooperativeTotalNairaAtRisk,
    totalDividendAvailable,
    memberSummaries,
    memberList,
  };
}

/**
 * COMPLETE LCMS PRO DIVIDEND DISTRIBUTION ENGINE (50/20/20/10 RULE)
 * - 50% General Dividend (Savings Naira At Risk)
 * - 20% Borrower Bonus (Borrower Repayment Naira At Risk from actual repayments)
 * - 20% Guarantor Bonus (Guarantor Repayment Naira At Risk from actual borrower repayments)
 * - 10% Honorarium (Executive Recipients configured by Admin)
 */
export function calculateFullDividendDistribution(
  users: User[],
  deposits: SavingsDeposit[],
  loans: LoanApplication[] = [],
  netSurplusPool: number = 50000000,
  honorariumConfig: HonorariumConfig = DEFAULT_HONORARIUM_CONFIG,
  accountingYear: number = 2026,
  dividendSubPolicy: DividendSubPolicy = DEFAULT_DIVIDEND_SUB_POLICY
): FullDividendEngineResult {
  // 1. Calculate Pools based on configurable dividend sub policy
  const sPct = (dividendSubPolicy.savingsPercentage || 50) / 100;
  const bPct = (dividendSubPolicy.borrowerPercentage || 20) / 100;
  const gPct = (dividendSubPolicy.guarantorPercentage || 20) / 100;
  const hPct = (dividendSubPolicy.honorariumPercentage || 10) / 100;

  const generalDividendPool = netSurplusPool * sPct;
  const borrowerBonusPool = netSurplusPool * bPct;
  const guarantorBonusPool = netSurplusPool * gPct;
  const honorariumPool = netSurplusPool * hPct;

  // 2. Savings Naira At Risk (General Dividend)
  const savingsNARMap: Record<string, number> = {};
  let totalSavingsNAR = 0;

  users.forEach((u) => {
    if (u.memberNo) {
      savingsNARMap[u.memberNo.toLowerCase()] = 0;
    }
  });

  deposits.forEach((dep) => {
    if (!dep.memberNo) return;
    const key = dep.memberNo.toLowerCase();
    const days = calculateDaysRemainingInYear(dep.depositDate || `${accountingYear}-01-01`);
    const nar = Number(dep.amount) * days;
    savingsNARMap[key] = (savingsNARMap[key] || 0) + nar;
    totalSavingsNAR += nar;
  });

  // 3. Borrower Repayment Naira At Risk & Total Repaid (Borrower Bonus)
  const borrowerNARMap: Record<string, number> = {};
  const totalRepaidMap: Record<string, number> = {};
  let totalBorrowerNAR = 0;

  users.forEach((u) => {
    if (u.memberNo) {
      borrowerNARMap[u.memberNo.toLowerCase()] = 0;
      totalRepaidMap[u.memberNo.toLowerCase()] = 0;
    }
  });

  loans.forEach((loan) => {
    if (!loan.memberNo) return;
    const bKey = loan.memberNo.toLowerCase();
    const repayments = loan.repayments || [];
    repayments.forEach((rep) => {
      const repDate = rep.paymentDate || (rep.createdAt ? rep.createdAt.split('T')[0] : `${accountingYear}-01-01`);
      const days = calculateDaysRemainingInYear(repDate);
      const repNAR = Number(rep.amountPaid) * days;

      borrowerNARMap[bKey] = (borrowerNARMap[bKey] || 0) + repNAR;
      totalRepaidMap[bKey] = (totalRepaidMap[bKey] || 0) + Number(rep.amountPaid);
      totalBorrowerNAR += repNAR;
    });
  });

  // 4. Guarantor Repayment Naira At Risk (Guarantor Bonus)
  const guarantorNARMap: Record<string, number> = {};
  let totalGuarantorNAR = 0;

  users.forEach((u) => {
    if (u.memberNo) {
      guarantorNARMap[u.memberNo.toLowerCase()] = 0;
    }
  });

  loans.forEach((loan) => {
    if (!loan.guarantorMemberNo) return;
    const gKey = loan.guarantorMemberNo.toLowerCase();
    const repayments = loan.repayments || [];
    repayments.forEach((rep) => {
      const repDate = rep.paymentDate || (rep.createdAt ? rep.createdAt.split('T')[0] : `${accountingYear}-01-01`);
      const days = calculateDaysRemainingInYear(repDate);
      const gNAR = Number(rep.amountPaid) * days;

      guarantorNARMap[gKey] = (guarantorNARMap[gKey] || 0) + gNAR;
      totalGuarantorNAR += gNAR;
    });
  });

  // 5. Honorarium Allocation
  const honorariumAllocations: Record<string, number> = {};
  const recipientCount = honorariumConfig.recipients.length || 1;
  const updatedRecipients = honorariumConfig.recipients.map((rec) => {
    let allocated = 0;
    if (honorariumConfig.allocationMode === 'equal') {
      allocated = Math.round(honorariumPool / recipientCount);
    } else {
      allocated = Math.round(honorariumPool * ((rec.percentageShare || 0) / 100));
    }
    const recKey = rec.memberNo.toLowerCase();
    honorariumAllocations[recKey] = (honorariumAllocations[recKey] || 0) + allocated;
    return { ...rec, allocatedAmount: allocated };
  });

  const processedHonorariumConfig: HonorariumConfig = {
    ...honorariumConfig,
    recipients: updatedRecipients,
  };

  // 6. Build Member Dividend Records
  const records: MemberDividendRecord[] = users.map((user) => {
    const key = user.memberNo ? user.memberNo.toLowerCase() : '';
    const sNAR = savingsNARMap[key] || 0;
    const sShare = totalSavingsNAR > 0 ? sNAR / totalSavingsNAR : 0;
    const sDiv = Math.round(sShare * generalDividendPool);

    const bNAR = borrowerNARMap[key] || 0;
    const bShare = totalBorrowerNAR > 0 ? bNAR / totalBorrowerNAR : 0;
    const bBonus = Math.round(bShare * borrowerBonusPool);

    const gNAR = guarantorNARMap[key] || 0;
    const gShare = totalGuarantorNAR > 0 ? gNAR / totalGuarantorNAR : 0;
    const gBonus = Math.round(gShare * guarantorBonusPool);

    const hAmt = honorariumAllocations[key] || 0;

    const totalDiv = sDiv + bBonus + gBonus + hAmt;

    return {
      memberId: user.id,
      memberNo: user.memberNo,
      memberName: user.fullName,
      branch: user.branch || 'Lagos Central Branch',
      status: user.status || 'active',
      totalSavings: user.savingsBalance || 0,
      savingsNairaAtRisk: sNAR,
      savingsShare: sShare,
      savingsDividend: sDiv,
      totalRepaid: totalRepaidMap[key] || 0,
      borrowerNairaAtRisk: bNAR,
      borrowerShare: bShare,
      borrowerBonus: bBonus,
      guarantorNairaAtRisk: gNAR,
      guarantorShare: gShare,
      guarantorBonus: gBonus,
      honorariumAmount: hAmt,
      totalDividend: totalDiv,
      dividendStatus: totalDiv > 0 ? 'Pending AGM Approval' : 'No Dividend Qualification',
    };
  });

  const summary: DividendSummaryStats = {
    accountingYear,
    netSurplusPool,
    generalDividendPool,
    borrowerBonusPool,
    guarantorBonusPool,
    honorariumPool,
    totalSavingsNairaAtRisk: totalSavingsNAR,
    totalBorrowerNairaAtRisk: totalBorrowerNAR,
    totalGuarantorNairaAtRisk: totalGuarantorNAR,
    eligibleMembersCount: records.filter((r) => r.totalDividend > 0).length,
    distributionStatus: 'Draft / Calculation Mode',
    lastCalculatedAt: new Date().toLocaleString(),
  };

  return {
    summary,
    records,
    honorariumConfig: processedHonorariumConfig,
  };
}

// ==================== LOAN BALANCE MODULE UTILITIES ====================

export interface LoanBalanceDetails {
  loanId: string;
  loanNo: string;
  memberName: string;
  memberNo: string;
  originalLoanAmount: number;
  totalInterest: number;
  totalPayable: number;
  totalPrincipalRepaid: number;
  totalInterestPaid: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  totalOutstandingBalance: number;
  repaymentPercentage: number;
  nextDueDate: string;
  loanStatus: 'Active' | 'Completed' | 'Overdue' | string;
  isOverdue: boolean;
  installmentsTotalCount: number;
  installmentsPaidCount: number;
  repaymentsCount: number;
}

export function calculateLoanBalanceDetails(loan: LoanApplication): LoanBalanceDetails {
  const originalLoanAmount = loan.loanAmount || 0;
  const totalInterest =
    loan.totalInterest ||
    Math.round(originalLoanAmount * ((loan.interestRate || 12) / 100));
  const totalPayable = loan.totalPayable || originalLoanAmount + totalInterest;
  const amountRepaid = loan.amountRepaid || 0;

  let totalPrincipalRepaid = loan.totalPrincipalRepaid || 0;
  let totalInterestPaid = loan.totalInterestPaid || 0;

  if (totalPrincipalRepaid === 0 && totalInterestPaid === 0 && amountRepaid > 0) {
    if (totalPayable > 0) {
      const principalRatio = originalLoanAmount / totalPayable;
      const interestRatio = totalInterest / totalPayable;
      totalPrincipalRepaid = Math.min(originalLoanAmount, Math.round(amountRepaid * principalRatio));
      totalInterestPaid = Math.min(totalInterest, Math.round(amountRepaid * interestRatio));
    } else {
      totalPrincipalRepaid = Math.min(originalLoanAmount, amountRepaid);
    }
  }

  const outstandingPrincipal = Math.max(0, originalLoanAmount - totalPrincipalRepaid);
  const outstandingInterest = Math.max(0, totalInterest - totalInterestPaid);
  const totalOutstandingBalance = Math.max(0, totalPayable - amountRepaid);

  const repaymentPercentage =
    totalPayable > 0 ? Math.min(100, Number(((amountRepaid / totalPayable) * 100).toFixed(1))) : 0;

  // Compute Next Due Date from repayment schedule
  let nextDueDate = 'Fully Settled';
  let installmentsPaidCount = 0;
  const schedule = loan.repaymentSchedule || [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (const inst of schedule) {
    if (inst.status === 'Paid') {
      installmentsPaidCount++;
    } else if (nextDueDate === 'Fully Settled') {
      nextDueDate = inst.dueDate;
    }
  }

  if (schedule.length === 0 && totalOutstandingBalance > 0) {
    nextDueDate = loan.dateDisbursed || loan.dateApplied || 'Pending Schedule';
  } else if (totalOutstandingBalance <= 0) {
    nextDueDate = 'Fully Settled';
  }

  let isOverdue = false;
  if (
    totalOutstandingBalance > 0 &&
    nextDueDate !== 'Fully Settled' &&
    nextDueDate !== 'Pending Schedule'
  ) {
    if (todayStr > nextDueDate) {
      isOverdue = true;
    }
  }

  let loanStatus: 'Active' | 'Completed' | 'Overdue' | string = loan.status;
  if (totalOutstandingBalance <= 0 || loan.status === 'Completed') {
    loanStatus = 'Completed';
  } else if (isOverdue) {
    loanStatus = 'Overdue';
  } else if (['Disbursed', 'Active'].includes(loan.status)) {
    loanStatus = 'Active';
  }

  return {
    loanId: loan.id,
    loanNo: loan.loanNo,
    memberName: loan.memberName,
    memberNo: loan.memberNo,
    originalLoanAmount,
    totalInterest,
    totalPayable,
    totalPrincipalRepaid,
    totalInterestPaid,
    outstandingPrincipal,
    outstandingInterest,
    totalOutstandingBalance,
    repaymentPercentage,
    nextDueDate,
    loanStatus,
    isOverdue,
    installmentsTotalCount: schedule.length,
    installmentsPaidCount,
    repaymentsCount: loan.repayments?.length || 0,
  };
}

