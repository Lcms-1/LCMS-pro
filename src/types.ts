/**
 * LCMS PRO - Lightway Cooperative Management System
 * Core Data Types and Interfaces
 */

export type AppMode = 'development' | 'production';

export type UserRole =
  | 'sys_admin'
  | 'chairman'
  | 'vice_chairman'
  | 'secretary'
  | 'financial_secretary'
  | 'treasurer'
  | 'loan_officer'
  | 'auditor'
  | 'business_supervisor'
  | 'member';

export type MembershipStatus = 'active' | 'pending' | 'suspended' | 'withdrawn';
export type MeansOfId = 'NIN' | "Voter's Card" | "Driver's License" | 'International Passport' | 'National ID' | 'Other';
export type RegistrationFeeStatus = 'Unpaid' | 'Paid' | 'Waived';
export type IdCardStatus = 'Not Issued' | 'Processing' | 'Issued';

export interface NextOfKin {
  fullName: string;
  relationship: string;
  phone: string;
  address: string;
}

export interface RoleConfig {
  id: UserRole;
  name: string;
  title: string;
  description: string;
  badgeColor: string;
  badgeBg: string;
  permissionsCount: number;
}

export interface RegistrationFeePayment {
  amountPaid: number;
  datePaid: string;
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  receivedBy: string;
  notes?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  memberNo: string;
  fullName: string;
  email: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  phone: string;
  branch: string;
  status: MembershipStatus;
  dateJoined: string;
  lastLogin: string;
  department?: string;
  sharesOwned?: number;
  savingsBalance?: number;

  // Member Registration Module Extended Fields
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  state?: string;
  lga?: string;
  residentialAddress?: string;
  occupation?: string;
  meansOfId?: MeansOfId;
  idNumber?: string;
  nextOfKin?: NextOfKin;
  introducedBy?: string;
  registrationFeeStatus?: RegistrationFeeStatus;
  idCardStatus?: IdCardStatus;
  registrationFeeRecord?: RegistrationFeePayment;
}

export interface Permission {
  id: string;
  key: string;
  label: string;
  category: 'User Management' | 'Financial Operations' | 'Governance & Approvals' | 'Audit & Compliance' | 'Business Ventures' | 'System Config';
  description: string;
}

export interface RolePermissions {
  roleId: UserRole;
  allowedPermissionKeys: string[];
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  role: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface SystemNotification {
  id: string;
  userId?: string;
  roleTarget?: UserRole | 'all';
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  isForeignKey?: boolean;
  references?: string;
  description: string;
}

export interface TableSchema {
  tableName: string;
  moduleName: string;
  description: string;
  columns: DatabaseColumn[];
  estimatedRows: number;
  status: 'active_foundation' | 'ready_for_phase2';
}

export interface CooperativeBranch {
  id: string;
  name: string;
  code: string;
  state: string;
  lga?: string;
  city: string;
  memberCount: number;
  isHq: boolean;
}

export type PaymentMethod =
  | 'Bank Transfer'
  | 'Cash Deposit'
  | 'POS'
  | 'Direct Payroll Deduction'
  | 'Cheque'
  | 'Mobile Transfer';

export interface SavingsDeposit {
  id: string;
  memberId?: string;
  memberNo: string;
  memberName: string;
  depositDate: string; // YYYY-MM-DD
  amount: number;
  transactionFee?: number; // ₦50 fee if amount < ₦5,000
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receivedBy: string;
  notes?: string;
  branch?: string;
  createdAt?: string;
  runningBalance?: number;
  isReversal?: boolean;
  reversedDepositId?: string;
  isReversed?: boolean;
  reversalReason?: string;
  reversalDate?: string;
  reversedBy?: string;
}

export interface DailySavingsAggregation {
  memberNo: string;
  memberName: string;
  date: string; // YYYY-MM-DD
  totalAmount: number;
  depositCount: number;
  depositIds: string[];
  receivedByOfficers: string[];
  nairaAtRiskWeight: number; // Computed score factor for Naira at Risk Engine
  notesSummary: string;
}

// ==================== NAIRA AT RISK MODULE TYPES ====================

export interface NairaAtRiskDepositWeight {
  id: string;
  depositDate: string;
  amount: number;
  daysRemaining: number;
  nairaAtRisk: number;
}

export interface NairaAtRiskMemberRecord {
  memberId: string;
  memberNo: string;
  memberName: string;
  status: MembershipStatus;
  branch: string;
  totalSavings: number;
  totalNairaAtRisk: number;
  depositCount: number;
  percentageShare: number;
  estimatedDividendStatus: string; // E.g., "Pending AGM Approval"
  deposits: NairaAtRiskDepositWeight[];
}

export interface NairaAtRiskSummaryStats {
  accountingYear: number;
  totalCooperativeSavings: number;
  totalCooperativeNairaAtRisk: number;
  membersWithSavingsCount: number;
  totalTransactionsCount: number;
  averageMemberNairaAtRisk: number;
  lastRecalculatedAt: string;
}

export interface MonthlyNairaAtRiskReport {
  monthName: string; // e.g., "January", "February"
  monthIndex: number; // 1 - 12
  depositCount: number;
  totalDepositAmount: number;
  averageDaysRemaining: number;
  monthlyNairaAtRisk: number;
  percentageOfAnnualNairaAtRisk: number;
}

// ==================== SURPLUS APPROPRIATION & LIABILITY TYPES ====================

export type SurplusAllocationCategory =
  | 'general_dividend'
  | 'borrower_dividend'
  | 'guarantor_dividend'
  | 'honorarium'
  | 'business_owners_share'
  | 'retained_earnings'
  | 'reserve_fund'
  | 'education_fund'
  | 'custom';

export interface SurplusAllocationItem {
  id: string;
  categoryKey: SurplusAllocationCategory;
  name: string;
  percentage: number; // Percentage of Annual Surplus, e.g., 50
  amount: number;     // Calculated Naira value
  isPaid: boolean;
  paidAmount: number;
  paidAt?: string;
  notes?: string;
}

export interface DividendSubPolicy {
  savingsPercentage: number;   // default 50%
  borrowerPercentage: number;  // default 20%
  guarantorPercentage: number; // default 20%
  honorariumPercentage: number; // default 10%
}

export interface SurplusAppropriationConfig {
  accountingYear: number;
  totalAssets: number;
  totalMembersSavings: number;
  externalLiabilities: number;
  annualSurplusAvailable: number; // Total Assets - Total Members' Savings - External Liabilities
  approvalStatus: 'Draft / Calculation Mode' | 'Approved by Executive' | 'AGM Approved & Declared' | 'AGM Declared & Paid';
  approvedBy?: string;
  approvedAt?: string;
  allocations: SurplusAllocationItem[];
  dividendSubPolicy: DividendSubPolicy;
  liabilityAccounts?: CooperativeLiabilityAccount[];
}

export interface CooperativeLiabilityAccount {
  id: string;
  code: string; // e.g. LIA-201
  name: string; // e.g. Dividend Payable, Honorarium Payable
  category: SurplusAllocationCategory | 'Other Payable';
  totalAllocated: number;
  totalPaidOut: number;
  outstandingBalance: number; // totalAllocated - totalPaidOut
  lastUpdated: string;
}

// ==================== DIVIDEND DISTRIBUTION ENGINE TYPES ====================

export interface HonorariumRecipientConfig {
  id: string;
  memberId: string;
  memberNo: string;
  memberName: string;
  roleTitle: string;
  percentageShare: number; // For custom percentage mode
  allocatedAmount: number;
}

export interface HonorariumConfig {
  allocationMode: 'equal' | 'custom';
  recipients: HonorariumRecipientConfig[];
}

export interface MemberDividendRecord {
  memberId: string;
  memberNo: string;
  memberName: string;
  branch: string;
  status: MembershipStatus;
  totalSavings: number;
  savingsNairaAtRisk: number;
  savingsShare: number;
  savingsDividend: number;
  totalRepaid: number;
  borrowerNairaAtRisk: number;
  borrowerShare: number;
  borrowerBonus: number;
  guarantorNairaAtRisk: number;
  guarantorShare: number;
  guarantorBonus: number;
  honorariumAmount: number;
  totalDividend: number;
  dividendStatus: string;
}

export interface DividendSummaryStats {
  accountingYear: number;
  netSurplusPool: number;
  generalDividendPool: number; // 50%
  borrowerBonusPool: number;   // 20%
  guarantorBonusPool: number;  // 20%
  honorariumPool: number;      // 10%
  totalSavingsNairaAtRisk: number;
  totalBorrowerNairaAtRisk: number;
  totalGuarantorNairaAtRisk: number;
  eligibleMembersCount: number;
  distributionStatus: 'Draft / Calculation Mode' | 'Approved by Executive' | 'AGM Declared & Paid';
  lastCalculatedAt: string;
}

export interface SavingsSummaryStats {
  totalSavings: number;
  monthlySavings: number;
  yearlySavings: number;
  activeDepositorsCount: number;
  totalTransactionsCount: number;
  averageDepositSize: number;
  sameDayAggregationsCount: number;
}

// ==================== LOAN MANAGEMENT MODULE TYPES ====================

export type LoanStatus =
  | 'Waiting for Guarantor Approval'
  | 'Pending'
  | 'Rejected by Guarantor'
  | 'Verified'
  | 'Approved'
  | 'Rejected'
  | 'Disbursed'
  | 'Completed'
  | 'Defaulted';

export interface RepaymentInstallment {
  installmentNo: number;
  dueDate: string; // YYYY-MM-DD
  principalAmount: number;
  interestAmount: number;
  totalInstallmentAmount: number;
  paidAmount: number;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partially Paid';
  paymentDate?: string;
  referenceNumber?: string;
}

export interface LoanRepaymentRecord {
  id: string;
  loanId: string;
  loanNo: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface LoanApprovalHistory {
  id: string;
  step: 'Application Submitted' | 'Guarantor Review' | 'Financial Verification' | 'Chairman Approval' | 'Treasurer Disbursement' | 'Loan Rejection' | 'Repayment';
  actionBy: string;
  actionRole: UserRole;
  timestamp: string;
  statusFrom?: LoanStatus;
  statusTo: LoanStatus;
  comments?: string;
}

export interface GuarantorVerificationDetails {
  guarantorMemberNo: string;
  guarantorName: string;
  guarantorStatus: MembershipStatus;
  guarantorSavingsBalance: number;
  activeGuaranteedLoansCount: number;
  totalGuaranteedEncumbrance: number;
  unencumberedSavings: number;
  qualifies: boolean;
  verificationNotes: string;
}

export interface LoanApplication {
  id: string;
  loanNo: string;
  memberId: string;
  memberNo: string;
  memberName: string;
  memberSavingsBalance: number;
  maxLoanEligibility: number; // 3x Savings rule
  loanAmount: number;
  interestRate: number; // Annual percentage rate e.g. 12% (1% monthly)
  repaymentPeriodMonths: number;
  loanPurpose: string;
  
  // Guarantor details
  guarantorMemberNo: string;
  guarantorName: string;
  guarantorSavingsBalance: number;
  guarantorApprovalStatus?: 'Pending' | 'Approved' | 'Rejected';
  guarantorApprovedAt?: string;
  guarantorRejectedAt?: string;
  guarantorNotes?: string;
  guarantorDetails?: GuarantorVerificationDetails;

  // Workflow Status & Dates
  status: LoanStatus;
  dateApplied: string; // YYYY-MM-DD
  dateVerified?: string;
  verifiedBy?: string;
  verificationNotes?: string;

  dateApproved?: string;
  approvedBy?: string;
  approvalNotes?: string;

  dateDisbursed?: string;
  disbursedBy?: string;
  disbursementMethod?: PaymentMethod;
  disbursementVoucherRef?: string;
  disbursementNotes?: string;

  // Financial calculations
  totalInterest: number;
  totalPayable: number;
  outstandingBalance: number;
  amountRepaid: number;
  totalPrincipalRepaid?: number;
  totalInterestPaid?: number;
  outstandingInterestBalance?: number;

  // Schedules & Records
  repaymentSchedule: RepaymentInstallment[];
  repayments: LoanRepaymentRecord[];
  approvalHistory: LoanApprovalHistory[];

  createdAt: string;
}

export interface LoanSummaryStats {
  totalLoanApplications: number;
  totalDisbursedAmount: number;
  totalOutstandingBalance: number;
  totalRepaidAmount: number;
  pendingGuarantorApprovalCount: number;
  pendingVerificationCount: number;
  pendingApprovalCount: number;
  pendingDisbursementCount: number;
  activeDisbursedLoansCount: number;
  completedLoansCount: number;
  defaultedLoansCount: number;
}

// ==================== WALLET ARCHITECTURE MODULE TYPES ====================

export type CooperativeIncomeCategory =
  | 'Registration Fee'
  | 'Loan Interest'
  | 'Penalties/Fines'
  | 'Business Profit'
  | 'Donation'
  | 'Service Charges'
  | 'Other Cooperative Income';

export interface CooperativeWalletEntry {
  id: string;
  category: CooperativeIncomeCategory;
  amount: number;
  payerMemberId?: string;
  payerMemberNo?: string;
  payerName?: string;
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  recordedBy: string;
  notes?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface CooperativeWalletSummary {
  totalBalance: number;
  categoryBreakdown: Record<CooperativeIncomeCategory, number>;
  totalTransactionsCount: number;
  recentEntries: CooperativeWalletEntry[];
}

export type MemberWalletTxType =
  | 'Savings Deposit'
  | 'Savings Deposit Reversal'
  | 'Savings Withdrawal'
  | 'Loan Principal Repayment'
  | 'Loan Interest Payment'
  | 'Dividend Credit'
  | 'Registration Fee Payment'
  | 'Penalty Payment'
  | 'Other';

export interface MemberWalletTransaction {
  id: string;
  memberId: string;
  memberNo: string;
  memberName: string;
  txType: MemberWalletTxType;
  amount: number;
  flow: 'credit' | 'debit';
  targetWallet: 'Savings' | 'Dividend' | 'Loan Balance' | 'Cooperative Main Wallet';
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  date: string;
  recordedBy: string;
  notes?: string;
  savingsBalanceAfter?: number;
  loanBalanceAfter?: number;
  createdAt: string;
}

export interface MemberWalletSummary {
  memberId: string;
  memberNo: string;
  memberName: string;
  savingsBalance: number;
  dividendEarned: number;
  outstandingLoanBalance: number;
  transactions: MemberWalletTransaction[];
}

export type UniversalPaymentType =
  | 'Registration Fee'
  | 'Savings Deposit'
  | 'Loan Repayment (Principal)'
  | 'Loan Interest'
  | 'Fine / Penalty'
  | 'Dividend Credit'
  | 'Business Income'
  | 'Donation'
  | 'Service Charge'
  | 'Other Income';

export interface UniversalPostingRequest {
  paymentType: UniversalPaymentType;
  memberId?: string;
  memberNo?: string;
  loanId?: string;
  amount: number;
  date: string;
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  receivedBy: string;
  notes?: string;
}

export interface RoleAssignmentRecord {
  id: string;
  officeTitle: string;
  roleId: UserRole;
  previousOfficerId?: string;
  previousOfficerName?: string;
  newOfficerId: string;
  newOfficerName: string;
  effectiveDate: string;
  assignedBy: string;
  reason: string;
  timestamp: string;
}

export interface ExecutiveAppointment {
  id: string;
  roleId: UserRole;
  officeTitle: string;
  officerUserId: string;
  officerMemberNo: string;
  officerName: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD or undefined if active
  status: 'active' | 'completed' | 'removed' | 'transferred';
  appointedBy: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== COOPERATIVE SETTINGS & PAYMENT APPROVAL WORKFLOW TYPES ====================

export interface CooperativeSettings {
  registrationFee: number; // Default: 2500
  minimumSavingsDeposit: number; // Default: 1000
  minimumTransferAmount: number; // Default: 500
  belowMinBankCharge: number; // Default: 50
  loanInterestRate: number; // Default: 12 (12% p.a.)
  loanRepaymentPeriodMonths: number; // Default: 12
  maxLoanSavingsMultiplier: number; // Default: 3
  guarantorMinSavingsPercentage: number; // Default: 100
  cooperativeBankName: string; // Default: "First Bank of Nigeria"
  cooperativeAccountNumber: string; // Default: "2039485712"
  currencySymbol: string; // Default: "₦"
  enableOnlineRegistration?: boolean; // Default: false
  updatedAt?: string;
  updatedBy?: string;
}

// ==================== MEMBER SELF-REGISTRATION TYPES ====================

export type PendingApplicationStatus =
  | 'Awaiting Payment Verification'
  | 'Payment Verified'
  | 'Pending Registration'
  | 'Approved'
  | 'Approved - Pending First Deposit'
  | 'Completed'
  | 'Rejected'
  | 'More Information Requested';

export interface PendingMemberApplication {
  id: string;
  applicationNo: string; // Temporary Application Number e.g. APP-2026-8492
  fullName: string;
  phone: string;
  email?: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  residentialAddress: string;
  occupation: string;
  state?: string;
  lga?: string;
  passportPhoto: string;
  meansOfId?: MeansOfId | string;
  idNumber?: string;
  sponsorName: string;
  sponsorMemberId: string;
  sponsorConfirmed: boolean;
  branch?: string;
  dateSubmitted: string;
  status: PendingApplicationStatus;

  // Payment Details (Submitted by Applicant)
  paymentAmount?: number;
  paymentReference?: string;
  paymentReceiptPhoto?: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentStatus?: 'Pending Verification' | 'Verified' | 'Rejected';

  // Treasurer Verification Details
  treasurerVerified?: boolean;
  treasurerVerifiedBy?: string;
  treasurerVerifiedDate?: string;
  treasurerVerifiedAmount?: number;
  treasurerNotes?: string;

  // Financial Secretary & System Approval
  approvedMemberId?: string;
  approvedUserId?: string;
  approvedBy?: string;
  approvalDate?: string;
  sponsorConfirmedBy?: string;
  sponsorConfirmedDate?: string;

  // Split Fee Details
  registrationFeeAmountPaid?: number;
  firstSavingsAmount?: number;
  registrationFeeStatus?: 'Unpaid' | 'Partial' | 'Completed';
  receiptNumber?: string;

  rejectionReason?: string;
  moreInfoNotes?: string;
  notes?: string;
}

export type PaymentCategory =
  | 'Registration Fee'
  | 'Savings Deposit'
  | 'Loan Repayment'
  | 'Interest Payment'
  | 'Other Income';

export type PaymentTransactionStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Reversed';

export interface PaymentTransaction {
  id: string;
  transactionNo: string; // e.g., "TXN-2026-0001"
  memberId: string;
  memberNo: string;
  memberName: string;
  paymentCategory: PaymentCategory;
  paymentMethod: PaymentMethod;
  amount: number;
  date: string; // YYYY-MM-DD
  bankReference: string;
  description: string;
  status: PaymentTransactionStatus;

  // Audit Trail & Roles
  submittedBy: string; // Officer Name
  submittedById?: string;
  submittedByRole: UserRole;
  submittedAt: string;

  approvedBy?: string;
  approvedById?: string;
  approvedByRole?: UserRole;
  approvedAt?: string;

  rejectedBy?: string;
  rejectedById?: string;
  rejectedByRole?: UserRole;
  rejectedAt?: string;
  rejectionReason?: string;

  reversedBy?: string;
  reversedById?: string;
  reversedByRole?: UserRole;
  reversedAt?: string;
  reversalReason?: string;
  reversalAmount?: number;
  originalTxId?: string;

  loanId?: string; // If applicable to a loan repayment
}

export interface PeriodSummaryStat {
  count: number;
  totalAmount: number;
}

export interface CategorySummaryStat {
  category: PaymentCategory;
  today: PeriodSummaryStat;
  week: PeriodSummaryStat;
  month: PeriodSummaryStat;
  year: PeriodSummaryStat;
}

// ==================== BULK BANK ALERT IMPORT TYPES ====================

export type BankAlertStatus = 'Pending Member Assignment' | 'Assigned' | 'Ignored' | 'Submitted';

export interface BankAlertSMSItem {
  id: string;
  rawSms: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time?: string;
  senderName?: string;
  bankName?: string;
  bankReference: string;
  narration?: string;
  status: BankAlertStatus;

  // Member assignment fields
  assignedMemberId?: string;
  assignedMemberNo?: string;
  assignedMemberName?: string;
  paymentCategory?: PaymentCategory;
  loanId?: string;
  description?: string;

  // Duplicate warning flags
  isDuplicate?: boolean;
  duplicateReason?: string;
}

export interface BankAlertImportHistory {
  id: string;
  batchReference: string;
  importedAt: string;
  importedBy: string;
  totalParsed: number;
  totalAssigned: number;
  totalAmount: number;
  status: 'Completed' | 'Partial' | 'Draft';
  alertsSummary?: BankAlertSMSItem[];
}






