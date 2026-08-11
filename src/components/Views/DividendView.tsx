import React, { useState, useMemo } from 'react';
import {
  Coins,
  Calculator,
  Search,
  Printer,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  FileText,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  PieChart as PieIcon,
  X,
  Building,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  HeartHandshake,
  UserCheck,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Sliders,
  AlertCircle,
  Briefcase,
  Check,
} from 'lucide-react';
import {
  User,
  UserRole,
  SavingsDeposit,
  LoanApplication,
  HonorariumConfig,
  HonorariumRecipientConfig,
  MemberDividendRecord,
  DividendSummaryStats,
  SurplusAppropriationConfig,
  SurplusAllocationItem,
  CooperativeLiabilityAccount,
  DividendSubPolicy,
} from '../../types';
import { AlertMessage } from '../AlertMessage';
import { apiUrl } from '../../utils/apiClient';
import {
  calculateFullDividendDistribution,
  calculateAnnualSurplusAndAppropriation,
  DEFAULT_HONORARIUM_CONFIG,
  DEFAULT_SURPLUS_APPROPRIATION_CONFIG,
  DEFAULT_DIVIDEND_SUB_POLICY,
  FullDividendEngineResult,
} from '../../utils/cooperativeRules';

interface DividendViewProps {
  users: User[];
  deposits?: SavingsDeposit[];
  loans?: LoanApplication[];
  currentUser?: User;
  currentUserRole?: UserRole;
  currentUserName?: string;
  onRefreshData?: () => void;
}

export const DividendView: React.FC<DividendViewProps> = ({
  users,
  deposits = [],
  loans = [],
  currentUser,
  currentUserRole = 'sys_admin',
  currentUserName = 'Mr. Ige Ebenezer',
  onRefreshData,
}) => {
  // Determine role & administrative permissions
  const activeRole = currentUser?.role || currentUserRole || 'sys_admin';
  const isSuperAdmin = ['sys_admin', 'chairman', 'financial_secretary'].includes(activeRole);

  // Active View Tab State
  const [activeTab, setActiveTab] = useState<'appropriation' | 'dividend_schedule' | 'liabilities'>('appropriation');

  // Financial Year & Annual Net Surplus Pool State
  const [financialYear, setFinancialYear] = useState('2026/2027');
  const [netSurplusPool, setNetSurplusPool] = useState<number>(181500000); // ₦181,500,000 default (General Dividend Pool)
  const [distributionStatus, setDistributionStatus] = useState<
    'Draft / Calculation Mode' | 'Approved by Executive' | 'AGM Approved & Declared' | 'AGM Declared & Paid'
  >('Draft / Calculation Mode');

  // Surplus Appropriation Config State (Step 1, Step 2, Step 4)
  const [surplusConfig, setSurplusConfig] = useState<SurplusAppropriationConfig>(DEFAULT_SURPLUS_APPROPRIATION_CONFIG);
  const [totalAssetsInput, setTotalAssetsInput] = useState<number>(1838800000);
  const [externalLiabilitiesInput, setExternalLiabilitiesInput] = useState<number>(25000000);

  // Liability Payout Modal State
  const [payoutTarget, setPayoutTarget] = useState<SurplusAllocationItem | null>(null);
  const [payoutAmountInput, setPayoutAmountInput] = useState<number>(0);

  // Honorarium Module Configuration State
  const [honorariumConfig, setHonorariumConfig] = useState<HonorariumConfig>(DEFAULT_HONORARIUM_CONFIG);
  const [isHonorariumModalOpen, setIsHonorariumModalOpen] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [qualificationFilter, setQualificationFilter] = useState<'all' | 'qualified' | 'unqualified'>('all');
  const [sortBy, setSortBy] = useState<'total' | 'savings' | 'borrower' | 'guarantor' | 'honorarium' | 'name'>('total');

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState<MemberDividendRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [voucherRecord, setVoucherRecord] = useState<MemberDividendRecord | null>(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  // Status feedback message
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fetch Surplus Appropriation Config from API on mount
  const loadSurplusConfig = () => {
    fetch(apiUrl('/api/surplus-appropriation'))
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setSurplusConfig(resData.data);
          setTotalAssetsInput(resData.data.totalAssets || 1838800000);
          setExternalLiabilitiesInput(resData.data.externalLiabilities || 25000000);
          setDistributionStatus(resData.data.approvalStatus || 'Draft / Calculation Mode');

          const genDiv = resData.data.allocations?.find((a: any) => a.categoryKey === 'general_dividend');
          if (genDiv && genDiv.amount > 0) {
            setNetSurplusPool(genDiv.amount);
          }
        }
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    loadSurplusConfig();
  }, []);

  // Recalculate Step 1 & Step 2 live in frontend
  const computedTotalSavings = useMemo(() => {
    return deposits.reduce((s, d) => s + Number(d.amount), 0) || 1450800000;
  }, [deposits]);

  const liveSurplusResult = useMemo(() => {
    return calculateAnnualSurplusAndAppropriation(
      totalAssetsInput,
      computedTotalSavings,
      externalLiabilitiesInput,
      surplusConfig.allocations,
      surplusConfig.dividendSubPolicy,
      distributionStatus
    );
  }, [totalAssetsInput, computedTotalSavings, externalLiabilitiesInput, surplusConfig.allocations, surplusConfig.dividendSubPolicy, distributionStatus]);

  // Execute Complete 4-Tier Dividend Distribution Engine
  const engineResult: FullDividendEngineResult = useMemo(() => {
    return calculateFullDividendDistribution(
      users,
      deposits,
      loans,
      netSurplusPool,
      honorariumConfig,
      2026,
      surplusConfig.dividendSubPolicy || DEFAULT_DIVIDEND_SUB_POLICY
    );
  }, [users, deposits, loans, netSurplusPool, honorariumConfig, surplusConfig.dividendSubPolicy]);

  const { summary, records, honorariumConfig: processedHonorarium } = engineResult;

  // Filtered & Sorted Records List
  const filteredRecords = useMemo(() => {
    let list = records.filter((r) => {
      // Security check for regular members: if not admin, only show current logged in user's record
      if (!isSuperAdmin && currentUser?.memberNo) {
        if (r.memberNo.toLowerCase() !== currentUser.memberNo.toLowerCase()) {
          return false;
        }
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.memberName.toLowerCase().includes(q) ||
        r.memberNo.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q);

      const matchesBranch =
        selectedBranch === 'all' ||
        r.branch.toLowerCase().includes(selectedBranch.toLowerCase());

      const matchesQualification =
        qualificationFilter === 'all' ||
        (qualificationFilter === 'qualified' && r.totalDividend > 0) ||
        (qualificationFilter === 'unqualified' && r.totalDividend <= 0);

      return matchesSearch && matchesBranch && matchesQualification;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'total') return b.totalDividend - a.totalDividend;
      if (sortBy === 'savings') return b.savingsDividend - a.savingsDividend;
      if (sortBy === 'borrower') return b.borrowerBonus - a.borrowerBonus;
      if (sortBy === 'guarantor') return b.guarantorBonus - a.guarantorBonus;
      if (sortBy === 'honorarium') return b.honorariumAmount - a.honorariumAmount;
      if (sortBy === 'name') return a.memberName.localeCompare(b.memberName);
      return 0;
    });

    return list;
  }, [records, searchQuery, selectedBranch, qualificationFilter, sortBy, isSuperAdmin, currentUser]);

  // Handle Export Dividend Schedule to Excel (CSV)
  const handleExportCSV = () => {
    const headers = [
      'Membership No',
      'Member Name',
      'Branch',
      'Status',
      'Total Savings (NGN)',
      'Savings Naira At Risk',
      'Savings Dividend 50% (NGN)',
      'Total Loan Repaid (NGN)',
      'Borrower Repayment NAR',
      'Borrower Bonus 20% (NGN)',
      'Guarantor Repayment NAR',
      'Guarantor Bonus 20% (NGN)',
      'Honorarium 10% (NGN)',
      'Total Combined Dividend (NGN)',
      'Qualification Status',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.memberNo}"`,
      `"${r.memberName.replace(/"/g, '""')}"`,
      `"${r.branch}"`,
      `"${r.status}"`,
      r.totalSavings,
      r.savingsNairaAtRisk,
      r.savingsDividend,
      r.totalRepaid,
      r.borrowerNairaAtRisk,
      r.borrowerBonus,
      r.guarantorNairaAtRisk,
      r.guarantorBonus,
      r.honorariumAmount,
      r.totalDividend,
      `"${r.dividendStatus}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `LCMS_PRO_Dividend_Schedule_FY_${financialYear.replace('/', '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback('Full 4-tier dividend schedule exported successfully as Excel CSV.');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Handle Print Report
  const handlePrintReport = () => {
    window.print();
  };

  // Surplus Appropriation API Handlers
  const handleSaveSurplusConfig = async () => {
    try {
      const res = await fetch(apiUrl('/api/surplus-appropriation/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAssets: totalAssetsInput,
          externalLiabilities: externalLiabilitiesInput,
          allocations: liveSurplusResult.allocations,
          dividendSubPolicy: surplusConfig.dividendSubPolicy,
          actorName: currentUserName,
          actorId: currentUser?.id || 'usr_sysadmin01',
          role: activeRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('Annual Surplus Appropriation & Dividend Sub-Policy saved successfully!');
        loadSurplusConfig();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setFeedback('Failed to save Surplus Appropriation policy.');
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleApproveAGMResolution = async () => {
    try {
      const res = await fetch(apiUrl('/api/surplus-appropriation/approve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorName: currentUserName,
          actorId: currentUser?.id || 'usr_sysadmin01',
          role: activeRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDistributionStatus('AGM Approved & Declared');
        setFeedback('🎉 Annual Surplus Appropriation officially AGM APPROVED & DECLARED! Liability accounts generated on Balance Sheet.');
        loadSurplusConfig();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback(`Error: ${data.error}`);
      }
    } catch (err) {
      setFeedback('Failed to approve AGM Surplus Appropriation.');
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleDisburseLiability = async () => {
    if (!payoutTarget || payoutAmountInput <= 0) return;
    try {
      const res = await fetch(apiUrl('/api/surplus-appropriation/payout-liability'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocationId: payoutTarget.id,
          payoutAmount: payoutAmountInput,
          actorName: currentUserName,
          actorId: currentUser?.id || 'usr_sysadmin01',
          role: activeRole,
          notes: `Disbursement for ${payoutTarget.name}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(`Disbursed ₦${payoutAmountInput.toLocaleString()} for ${payoutTarget.name}. Balance Sheet liability updated.`);
        setPayoutTarget(null);
        setPayoutAmountInput(0);
        loadSurplusConfig();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedback(`Error: ${data.error}`);
      }
    } catch (err) {
      setFeedback('Failed to disburse liability payout.');
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddCustomAllocation = () => {
    const newAlloc: SurplusAllocationItem = {
      id: `alloc_${Date.now()}`,
      categoryKey: 'custom',
      name: 'Special AGM Allocation',
      percentage: 0,
      amount: 0,
      isPaid: false,
      paidAmount: 0,
      notes: 'Custom allocation approved by AGM',
    };
    setSurplusConfig((prev) => ({
      ...prev,
      allocations: [...prev.allocations, newAlloc],
    }));
  };

  const handleRemoveAllocation = (id: string) => {
    setSurplusConfig((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((a) => a.id !== id),
    }));
  };

  const handleUpdateAllocationPercentage = (id: string, percentage: number) => {
    setSurplusConfig((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a) =>
        a.id === id ? { ...a, percentage: Math.max(0, percentage) } : a
      ),
    }));
  };

  const handleUpdateAllocationName = (id: string, name: string) => {
    setSurplusConfig((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a) => (a.id === id ? { ...a, name } : a)),
    }));
  };

  // Honorarium Module Handlers
  const handleAddHonorariumRecipient = (memberNo: string) => {
    const selectedUser = users.find(
      (u) => u.memberNo.toLowerCase() === memberNo.toLowerCase()
    );
    if (!selectedUser) return;

    if (
      honorariumConfig.recipients.some(
        (r) => r.memberNo.toLowerCase() === selectedUser.memberNo.toLowerCase()
      )
    ) {
      setFeedback('Member is already added to the Honorarium recipient list.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const newRec: HonorariumRecipientConfig = {
      id: `hon_${Date.now()}`,
      memberId: selectedUser.id,
      memberNo: selectedUser.memberNo,
      memberName: selectedUser.fullName,
      roleTitle: selectedUser.role || 'Executive Officer',
      percentageShare: 0,
      allocatedAmount: 0,
    };

    setHonorariumConfig((prev) => ({
      ...prev,
      recipients: [...prev.recipients, newRec],
    }));
  };

  const handleRemoveHonorariumRecipient = (id: string) => {
    setHonorariumConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r.id !== id),
    }));
  };

  const handleUpdateRecipientPercentage = (id: string, percentage: number) => {
    setHonorariumConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) =>
        r.id === id ? { ...r, percentageShare: Math.max(0, percentage) } : r
      ),
    }));
  };

  const handleUpdateRecipientRole = (id: string, roleTitle: string) => {
    setHonorariumConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) =>
        r.id === id ? { ...r, roleTitle } : r
      ),
    }));
  };

  const handleApproveDividend = () => {
    setDistributionStatus('AGM Declared & Paid');
    setFeedback(
      `Annual Dividend Distribution of ₦${netSurplusPool.toLocaleString()} officially APPROVED and DECLARED for AGM payout!`
    );
    setTimeout(() => setFeedback(null), 5000);
  };

  // Calculate sum of custom honorarium percentages
  const totalHonorariumPercentage = useMemo(() => {
    return honorariumConfig.recipients.reduce(
      (sum, r) => sum + (r.percentageShare || 0),
      0
    );
  }, [honorariumConfig]);

  return (
    <div className="space-[#014421] space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#014421] via-emerald-950 to-[#014421] text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 rounded-full bg-[#DAA520]/15 blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DAA520] text-[#014421] font-black text-xs uppercase tracking-wider mb-2 shadow-sm">
              <Coins className="w-3.5 h-3.5" />
              Official LCMS PRO Dividend Engine
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Annual Dividend Distribution Engine (50/20/20/10 Policy)
            </h1>
            <p className="text-xs text-emerald-200 mt-1 max-w-3xl leading-relaxed">
              Automated multi-tier distribution of AGM Net Surplus based on actual financial discipline: 
              <strong className="text-amber-300"> 50% Savings General Dividend</strong>, 
              <strong className="text-indigo-300"> 20% Borrower Repayment Bonus</strong>, 
              <strong className="text-teal-300"> 20% Guarantor Repayment Bonus</strong>, and 
              <strong className="text-purple-300"> 10% Executive Honorarium</strong>.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={() => setIsHonorariumModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-100 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sliders className="w-4 h-4 text-purple-300" />
                Configure Honorarium (10%)
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              Export Schedule (CSV)
            </button>

            <button
              onClick={handlePrintReport}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              Print Report
            </button>
          </div>
        </div>
      </div>

      {feedback && <AlertMessage type="info" message={feedback} />}

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-2 pt-2">
        <button
          onClick={() => setActiveTab('appropriation')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === 'appropriation'
              ? 'bg-slate-900 text-amber-400 border-t-2 border-x border-amber-500/60 shadow-md'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Step 1 & 2: Annual Surplus Appropriation Engine
        </button>
        <button
          onClick={() => setActiveTab('dividend_schedule')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === 'dividend_schedule'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-x border-emerald-500/60 shadow-md'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          <Coins className="w-4 h-4 text-emerald-400" />
          Step 3: Member Dividend Distribution Schedule (50/20/20/10)
        </button>
        <button
          onClick={() => setActiveTab('liabilities')}
          className={`px-4 py-3 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${
            activeTab === 'liabilities'
              ? 'bg-slate-900 text-purple-400 border-t-2 border-x border-purple-500/60 shadow-md'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
          }`}
        >
          <PieIcon className="w-4 h-4 text-purple-400" />
          Step 4: Balance Sheet Liability Accounts & Disbursals
        </button>
      </div>

      {/* TAB 1: ANNUAL SURPLUS APPROPRIATION ENGINE (STEP 1 & STEP 2) */}
      {activeTab === 'appropriation' && (
        <div className="space-y-6">
          {/* Step 1: Calculation Header */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold text-[11px] uppercase tracking-wider mb-1 border border-amber-700/50">
                  <Calculator className="w-3.5 h-3.5" />
                  Step 1: Financial Accounting Calculation
                </div>
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  Annual Surplus Available for AGM Appropriation
                </h2>
                <p className="text-xs text-slate-400">
                  Formula: Total Cooperative Assets − Total Members' Contributory Savings − External Liabilities
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  distributionStatus === 'AGM Approved & Declared'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                    : 'bg-amber-950 text-amber-300 border border-amber-600'
                }`}>
                  {distributionStatus}
                </span>

                {isSuperAdmin && distributionStatus !== 'AGM Approved & Declared' && (
                  <button
                    onClick={handleApproveAGMResolution}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Declare AGM Surplus Resolution
                  </button>
                )}
              </div>
            </div>

            {/* Step 1 Live Formula Box */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Asset Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Cooperative Assets</span>
                {isSuperAdmin ? (
                  <div className="flex items-center gap-1 text-blue-400 font-black text-lg">
                    <span>₦</span>
                    <input
                      type="number"
                      value={totalAssetsInput}
                      onChange={(e) => setTotalAssetsInput(Number(e.target.value))}
                      className="w-full bg-slate-900 px-2 py-1 rounded text-sm text-blue-300 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div className="text-lg font-black text-blue-400">
                    ₦{totalAssetsInput.toLocaleString()}
                  </div>
                )}
                <p className="text-[10px] text-slate-500">Bank cash balances + member loan receivables</p>
              </div>

              {/* Contributory Savings Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">− Members Savings (Contributory)</span>
                <div className="text-lg font-black text-amber-400">
                  ₦{computedTotalSavings.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500">Total member deposits (Liabilities)</p>
              </div>

              {/* External Liabilities Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">− External Liabilities</span>
                {isSuperAdmin ? (
                  <div className="flex items-center gap-1 text-red-400 font-black text-lg">
                    <span>₦</span>
                    <input
                      type="number"
                      value={externalLiabilitiesInput}
                      onChange={(e) => setExternalLiabilitiesInput(Number(e.target.value))}
                      className="w-full bg-slate-900 px-2 py-1 rounded text-sm text-red-300 font-mono focus:outline-none focus:border-red-500"
                    />
                  </div>
                ) : (
                  <div className="text-lg font-black text-red-400">
                    ₦{externalLiabilitiesInput.toLocaleString()}
                  </div>
                )}
                <p className="text-[10px] text-slate-500">Third-party obligations & debt</p>
              </div>

              {/* Annual Surplus Result Box */}
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/60 space-y-1">
                <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">= Annual Surplus Available</span>
                <div className="text-xl font-black text-emerald-300 font-mono">
                  ₦{liveSurplusResult.annualSurplusAvailable.toLocaleString()}
                </div>
                <p className="text-[10px] text-emerald-200/80 leading-tight">
                  Available for AGM distribution into reserves, honorarium & member dividends.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Surplus Allocations Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  Step 2: AGM Surplus Allocations Schedule & Percentage Configurator
                </h3>
                <p className="text-xs text-slate-400">
                  Allocate the Annual Surplus (₦{liveSurplusResult.annualSurplusAvailable.toLocaleString()}) according to Cooperative Constitution.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                  liveSurplusResult.allocations.reduce((s, a) => s + (a.percentage || 0), 0) === 100
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                    : 'bg-amber-950 border-amber-600 text-amber-300'
                }`}>
                  <span>Total Percentage: {liveSurplusResult.allocations.reduce((s, a) => s + (a.percentage || 0), 0)}%</span>
                  {liveSurplusResult.allocations.reduce((s, a) => s + (a.percentage || 0), 0) === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                {isSuperAdmin && (
                  <>
                    <button
                      onClick={handleAddCustomAllocation}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 border border-slate-700"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      Add Custom Allocation
                    </button>
                    <button
                      onClick={handleSaveSurplusConfig}
                      className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Save Allocations Policy
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Allocations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Allocation Category / Purpose</th>
                    <th className="p-3 text-center">AGM Share (%)</th>
                    <th className="p-3 text-right">Appropriated Amount (₦)</th>
                    <th className="p-3">Constitutional Rule</th>
                    {isSuperAdmin && <th className="p-3 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                  {liveSurplusResult.allocations.map((alloc) => (
                    <tr key={alloc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-100">
                        {alloc.categoryKey === 'custom' && isSuperAdmin ? (
                          <input
                            type="text"
                            value={alloc.name}
                            onChange={(e) => handleUpdateAllocationName(alloc.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 px-2 py-1 rounded text-xs text-slate-100 w-64"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{alloc.name}</span>
                            {alloc.categoryKey === 'general_dividend' && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                                Member Dividend Pool
                              </span>
                            )}
                            {alloc.categoryKey === 'reserve_fund' && (
                              <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700 text-[10px] font-bold">
                                Mandatory 20%
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {isSuperAdmin ? (
                          <div className="inline-flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-700">
                            <input
                              type="number"
                              value={alloc.percentage}
                              onChange={(e) => handleUpdateAllocationPercentage(alloc.id, Number(e.target.value))}
                              className="w-14 bg-transparent text-center font-bold text-amber-300 focus:outline-none"
                            />
                            <span className="text-slate-500">%</span>
                          </div>
                        ) : (
                          <span className="font-bold text-amber-400">{alloc.percentage}%</span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-300">
                        ₦{alloc.amount.toLocaleString()}
                      </td>

                      <td className="p-3 text-slate-400 text-[11px]">
                        {alloc.notes || 'AGM Approved Allocation'}
                      </td>

                      {isSuperAdmin && (
                        <td className="p-3 text-center">
                          {alloc.categoryKey === 'custom' ? (
                            <button
                              onClick={() => handleRemoveAllocation(alloc.id)}
                              className="p-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800"
                              title="Remove custom allocation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[10px]">Standard</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3: Dividend Sub-Policy Rules (50/20/20/10 Rule) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-900/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  Step 3: Dividend Sub-Policy Breakdown (Lightway 50/20/20/10 Rule)
                </h3>
                <p className="text-xs text-slate-400">
                  Sub-allocates the Member Dividend Pool (₦{(liveSurplusResult.allocations.find(a => a.categoryKey === 'general_dividend')?.amount || 181500000).toLocaleString()}) across Savings, Borrower Bonus, Guarantor Bonus & Executive Honorarium.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 space-y-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  Savings General Dividend (50%)
                </span>
                <div className="text-xl font-extrabold text-emerald-200">
                  ₦{((liveSurplusResult.allocations.find(a => a.categoryKey === 'general_dividend')?.amount || 181500000) * 0.5).toLocaleString()}
                </div>
                <p className="text-[10px] text-emerald-300/70">
                  Calculated using Savings Naira At Risk formula based on total days member funds remained in cooperative account.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-800/60 space-y-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Borrower Bonus (20%)
                </span>
                <div className="text-xl font-extrabold text-indigo-200">
                  ₦{((liveSurplusResult.allocations.find(a => a.categoryKey === 'general_dividend')?.amount || 181500000) * 0.2).toLocaleString()}
                </div>
                <p className="text-[10px] text-indigo-300/70">
                  Earned strictly from actual loan repayments made during the accounting year. (Original loan principle excluded).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-teal-950/60 border border-teal-800/60 space-y-2">
                <span className="text-xs font-bold text-teal-300 flex items-center gap-1">
                  <HeartHandshake className="w-4 h-4 text-teal-400" />
                  Guarantor Bonus (20%)
                </span>
                <div className="text-xl font-extrabold text-teal-200">
                  ₦{((liveSurplusResult.allocations.find(a => a.categoryKey === 'general_dividend')?.amount || 181500000) * 0.2).toLocaleString()}
                </div>
                <p className="text-[10px] text-teal-300/70">
                  Earned when guaranteed borrowers make timely loan repayments. (Generates Guarantor Repayment NAR).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/60 border border-purple-800/60 space-y-2">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  Executive Honorarium (10%)
                </span>
                <div className="text-xl font-extrabold text-purple-200">
                  ₦{((liveSurplusResult.allocations.find(a => a.categoryKey === 'general_dividend')?.amount || 181500000) * 0.1).toLocaleString()}
                </div>
                <p className="text-[10px] text-purple-300/70">
                  Shared among executive officers configured by Super Admin / Chairman for leadership performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBER DIVIDEND DISTRIBUTION SCHEDULE */}
      {activeTab === 'dividend_schedule' && (
        <div className="space-y-6">
          {/* Admin Net Surplus Control */}
          {isSuperAdmin && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-900/60 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#DAA520]/20 border border-[#DAA520]/40 flex items-center justify-center text-[#DAA520]">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      General Member Dividend Pool
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-black ${
                        distributionStatus === 'AGM Declared & Paid'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-400 text-slate-950'
                      }`}>
                        {distributionStatus}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      General Dividend Pool from Step 2 Surplus Appropriation.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 font-bold">Dividend Pool:</span>
                    <span className="text-xs text-amber-400 font-extrabold">₦</span>
                    <input
                      type="number"
                      value={netSurplusPool}
                      onChange={(e) => setNetSurplusPool(Math.max(0, Number(e.target.value)))}
                      className="w-36 bg-transparent text-sm font-black text-amber-300 focus:outline-none"
                    />
                  </div>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setIsHonorariumModalOpen(true)}
                      className="px-3 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-100 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Sliders className="w-4 h-4 text-purple-300" />
                      Configure Honorarium
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

      {/* 4-Tier Dividend Policy Metric Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier 1: 50% General Dividend (Savings) */}
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
            <span className="flex items-center gap-1">
              <Coins className="w-4 h-4 text-emerald-400" />
              General Dividend (50%)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-100 text-[10px] font-black">
              Savings NAR
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-2">
            ₦{summary.generalDividendPool.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center justify-between">
            <span>Coop Savings NAR:</span>
            <span className="font-bold text-white">₦{summary.totalSavingsNairaAtRisk.toLocaleString()} Days</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-300/70 border-t border-emerald-800/60 pt-1.5">
            Distributed via Member Savings Naira At Risk proportion.
          </div>
        </div>

        {/* Tier 2: 20% Borrower Bonus */}
        <div className="p-4 rounded-2xl bg-indigo-950/70 border border-indigo-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-indigo-200 font-bold">
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4 text-indigo-400" />
              Borrower Bonus (20%)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-800 text-indigo-100 text-[10px] font-black">
              Repayments NAR
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-300 mt-2">
            ₦{summary.borrowerBonusPool.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-200/80 mt-1 flex items-center justify-between">
            <span>Borrower Repaid NAR:</span>
            <span className="font-bold text-white">₦{summary.totalBorrowerNairaAtRisk.toLocaleString()} Days</span>
          </div>
          <div className="mt-2 text-[10px] text-indigo-300/70 border-t border-indigo-800/60 pt-1.5">
            Earned ONLY through actual recorded loan repayments.
          </div>
        </div>

        {/* Tier 3: 20% Guarantor Bonus */}
        <div className="p-4 rounded-2xl bg-teal-950/70 border border-teal-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-teal-200 font-bold">
            <span className="flex items-center gap-1">
              <HeartHandshake className="w-4 h-4 text-teal-400" />
              Guarantor Bonus (20%)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-teal-800 text-teal-100 text-[10px] font-black">
              Pledge Safeguard
            </span>
          </div>
          <div className="text-2xl font-black text-teal-300 mt-2">
            ₦{summary.guarantorBonusPool.toLocaleString()}
          </div>
          <div className="text-[11px] text-teal-200/80 mt-1 flex items-center justify-between">
            <span>Guaranteed Repaid NAR:</span>
            <span className="font-bold text-white">₦{summary.totalGuarantorNairaAtRisk.toLocaleString()} Days</span>
          </div>
          <div className="mt-2 text-[10px] text-teal-300/70 border-t border-teal-800/60 pt-1.5">
            Earned when guaranteed borrowers actually repay.
          </div>
        </div>

        {/* Tier 4: 10% Honorarium */}
        <div className="p-4 rounded-2xl bg-purple-950/70 border border-purple-700/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-purple-200 font-bold">
            <span className="flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-purple-400" />
              Honorarium (10%)
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-800 text-purple-100 text-[10px] font-black">
              Executive Pool
            </span>
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">
            ₦{summary.honorariumPool.toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-200/80 mt-1 flex items-center justify-between">
            <span>Configured Recipients:</span>
            <span className="font-bold text-white">{processedHonorarium.recipients.length} Officers</span>
          </div>
          <div className="mt-2 text-[10px] text-purple-300/70 border-t border-purple-800/60 pt-1.5">
            Mode: {processedHonorarium.allocationMode === 'equal' ? 'Equal Share' : 'Custom % Allocation'}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member name or membership no..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Branch filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Branches</option>
            <option value="Lagos Central">Lagos Central Branch</option>
            <option value="Ikeja">Ikeja Branch</option>
            <option value="Victoria Island">Victoria Island Branch</option>
            <option value="Abuja">Abuja Main Branch</option>
            <option value="Port Harcourt">Port Harcourt Branch</option>
          </select>

          {/* Qualification filter */}
          <select
            value={qualificationFilter}
            onChange={(e) => setQualificationFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">All Members ({records.length})</option>
            <option value="qualified">Qualified for Dividend ({records.filter(r => r.totalDividend > 0).length})</option>
            <option value="unqualified">No Dividend Qualification</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none"
          >
            <option value="total">Sort: Highest Total Dividend</option>
            <option value="savings">Sort: Highest Savings Dividend</option>
            <option value="borrower">Sort: Highest Borrower Bonus</option>
            <option value="guarantor">Sort: Highest Guarantor Bonus</option>
            <option value="honorarium">Sort: Highest Honorarium</option>
            <option value="name">Sort: Member Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Consolidated Dividend Schedule Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Consolidated Dividend Distribution Schedule ({filteredRecords.length} Records)
            </h3>
          </div>
          <div className="text-xs text-slate-400">
            Accounting Year: <span className="font-bold text-amber-300">2026 (FY Dec 31)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3">Member Details</th>
                <th className="p-3 text-right">Savings (50%)</th>
                <th className="p-3 text-right">Borrower Bonus (20%)</th>
                <th className="p-3 text-right">Guarantor Bonus (20%)</th>
                <th className="p-3 text-right">Honorarium (10%)</th>
                <th className="p-3 text-right">Total Dividend</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No member records matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r.memberId}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Member Details */}
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{r.memberName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-emerald-400 font-mono">{r.memberNo}</span>
                        <span>•</span>
                        <span>{r.branch}</span>
                      </div>
                    </td>

                    {/* Savings 50% */}
                    <td className="p-3 text-right">
                      <div className="font-bold text-emerald-300">
                        ₦{r.savingsDividend.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        NAR: {r.savingsNairaAtRisk.toLocaleString()}
                      </div>
                    </td>

                    {/* Borrower Bonus 20% */}
                    <td className="p-3 text-right">
                      <div className="font-bold text-indigo-300">
                        ₦{r.borrowerBonus.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Repaid NAR: {r.borrowerNairaAtRisk.toLocaleString()}
                      </div>
                    </td>

                    {/* Guarantor Bonus 20% */}
                    <td className="p-3 text-right">
                      <div className="font-bold text-teal-300">
                        ₦{r.guarantorBonus.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Pledged NAR: {r.guarantorNairaAtRisk.toLocaleString()}
                      </div>
                    </td>

                    {/* Honorarium 10% */}
                    <td className="p-3 text-right">
                      {r.honorariumAmount > 0 ? (
                        <div>
                          <div className="font-bold text-purple-300">
                            ₦{r.honorariumAmount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-purple-400 font-semibold">
                            Executive Honorarium
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Total Dividend */}
                    <td className="p-3 text-right">
                      <div className="text-sm font-black text-amber-300">
                        ₦{r.totalDividend.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        {r.dividendStatus}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition-all"
                        >
                          Breakdown
                        </button>
                        <button
                          onClick={() => {
                            setVoucherRecord(r);
                            setIsVoucherOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-[11px] font-semibold transition-all flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          Voucher
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* TAB 3: BALANCE SHEET LIABILITY ACCOUNTS & DISBURSALS (STEP 4) */}
  {activeTab === 'liabilities' && (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-purple-800/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-400" />
              Step 4: Balance Sheet Liability Accounts & AGM Payout Ledger
            </h3>
            <p className="text-xs text-slate-400">
              Track and disburse funds against liability accounts generated during AGM Surplus Appropriation.
            </p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
            surplusConfig.approvalStatus === 'AGM Approved & Declared'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
              : 'bg-amber-950 text-amber-300 border border-amber-600'
          }`}>
            {surplusConfig.approvalStatus || 'Draft / Calculation Mode'}
          </span>
        </div>

        {/* Liabilities Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3">Liability Account Name</th>
                <th className="p-3 text-right">Appropriated Pool (₦)</th>
                <th className="p-3 text-right">Disbursed Paid (₦)</th>
                <th className="p-3 text-right">Outstanding Liability (₦)</th>
                <th className="p-3 text-center">Account Status</th>
                {isSuperAdmin && <th className="p-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
              {(liveSurplusResult.liabilityAccounts || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No liability accounts generated yet. Complete Step 1 & 2 Surplus Appropriation to create liabilities.
                  </td>
                </tr>
              ) : (
                (liveSurplusResult.liabilityAccounts || []).map((account) => {
                  const matchedAlloc = surplusConfig.allocations.find(a => a.categoryKey === account.category);
                  const isSettled = account.outstandingBalance <= 0;
                  const isPartial = account.totalPaidOut > 0 && account.outstandingBalance > 0;
                  const statusLabel = isSettled ? 'Fully Settled' : isPartial ? 'Partially Disbursed' : 'Pending Disbursal';

                  return (
                    <tr key={account.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-100">{account.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Code: {account.code} • Category: {account.category}
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-200">
                        ₦{account.totalAllocated.toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        ₦{account.totalPaidOut.toLocaleString()}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-amber-300">
                        ₦{account.outstandingBalance.toLocaleString()}
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSettled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : isPartial
                            ? 'bg-blue-950 text-blue-300 border border-blue-700'
                            : 'bg-amber-950 text-amber-300 border border-amber-700'
                        }`}>
                          {statusLabel}
                        </span>
                      </td>

                      {isSuperAdmin && (
                        <td className="p-3 text-center">
                          {account.outstandingBalance > 0 ? (
                            <button
                              onClick={() => {
                                if (matchedAlloc) {
                                  setPayoutTarget(matchedAlloc);
                                  setPayoutAmountInput(account.outstandingBalance);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-100 border border-purple-600/60 text-xs font-bold transition-all"
                            >
                              Disburse Payout
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[11px]">Fully Paid</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {/* DISBURSEMENT PAYOUT MODAL */}
  {payoutTarget && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-purple-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            Disburse Liability Payout
          </h3>
          <button
            onClick={() => setPayoutTarget(null)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="text-slate-400 font-semibold">Liability Account:</div>
            <div className="font-bold text-purple-300 text-sm">{payoutTarget.name}</div>
            <div className="flex justify-between text-slate-400 pt-1">
              <span>Current Paid: ₦{payoutTarget.paidAmount.toLocaleString()}</span>
              <span>Total Allocated: ₦{payoutTarget.amount.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Disbursement Amount (₦)
            </label>
            <input
              type="number"
              value={payoutAmountInput}
              onChange={(e) => setPayoutAmountInput(Math.max(0, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-emerald-300 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setPayoutTarget(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleDisburseLiability}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md"
            >
              Confirm Disbursement
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Honorarium Module Drawer / Modal */}
      {isHonorariumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-purple-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border-b border-purple-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-100">
                    Honorarium Allocation Module (10% Pool)
                  </h3>
                  <p className="text-xs text-purple-300/80">
                    Configure executive officers approved by AGM to receive Honorarium bonuses (Pool: ₦{summary.honorariumPool.toLocaleString()}).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsHonorariumModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Allocation Mode Selector */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Honorarium Allocation Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setHonorariumConfig((prev) => ({ ...prev, allocationMode: 'equal' }))
                    }
                    className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                      honorariumConfig.allocationMode === 'equal'
                        ? 'bg-purple-950 border-purple-500 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-slate-100 font-bold">Equal Sharing Mode</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Split 10% pool equally among all configured recipients.
                      </div>
                    </div>
                    {honorariumConfig.allocationMode === 'equal' && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setHonorariumConfig((prev) => ({ ...prev, allocationMode: 'custom' }))
                    }
                    className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                      honorariumConfig.allocationMode === 'custom'
                        ? 'bg-purple-950 border-purple-500 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-slate-100 font-bold">Custom Percentage Allocation</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Assign specific percentage shares per executive role.
                      </div>
                    </div>
                    {honorariumConfig.allocationMode === 'custom' && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Add New Recipient Dropdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <span className="text-xs text-slate-300 font-bold whitespace-nowrap">
                  Add Executive Recipient:
                </span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddHonorariumRecipient(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">-- Select Member from Registry --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.memberNo}>
                      {u.fullName} ({u.memberNo}) - {u.role || 'Member'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipients List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Configured Officers ({honorariumConfig.recipients.length})</span>
                  {honorariumConfig.allocationMode === 'custom' && (
                    <span
                      className={`text-xs font-black ${
                        totalHonorariumPercentage === 100
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      Total Percentage: {totalHonorariumPercentage}% / 100%
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-800 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                  {honorariumConfig.recipients.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50"
                    >
                      <div>
                        <div className="font-bold text-slate-100 text-xs flex items-center gap-2">
                          {rec.memberName}
                          <span className="text-purple-400 text-[10px] bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                            {rec.memberNo}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={rec.roleTitle}
                          onChange={(e) => handleUpdateRecipientRole(rec.id, e.target.value)}
                          className="text-[11px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-purple-500 focus:outline-none mt-0.5 font-semibold"
                          placeholder="Role title (e.g. Executive Chairman)"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        {honorariumConfig.allocationMode === 'custom' ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={rec.percentageShare}
                              onChange={(e) =>
                                handleUpdateRecipientPercentage(rec.id, Number(e.target.value))
                              }
                              className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-purple-300 text-right focus:outline-none"
                            />
                            <span className="text-xs text-slate-400 font-bold">%</span>
                          </div>
                        ) : (
                          <div className="text-xs text-purple-300 font-bold">
                            Equal Allocation
                          </div>
                        )}

                        <div className="text-xs font-black text-amber-300 w-28 text-right">
                          ₦{rec.allocatedAmount.toLocaleString()}
                        </div>

                        <button
                          onClick={() => handleRemoveHonorariumRecipient(rec.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHonorariumModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Save & Apply Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Detailed Breakdown Modal */}
      {isDetailModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Detailed Dividend Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedRecord.memberName} ({selectedRecord.memberNo})
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-slate-400">Total Savings Balance:</div>
                  <div className="text-base font-bold text-emerald-300 mt-0.5">
                    ₦{selectedRecord.totalSavings.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Savings NAR Weight:</div>
                  <div className="text-base font-bold text-slate-100 mt-0.5">
                    {selectedRecord.savingsNairaAtRisk.toLocaleString()} Days
                  </div>
                </div>
              </div>

              {/* 4 Tier Breakdown List */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-300">1. General Savings Dividend (50%)</div>
                    <div className="text-[10px] text-emerald-200/70">
                      Share: {(selectedRecord.savingsShare * 100).toFixed(4)}%
                    </div>
                  </div>
                  <div className="text-sm font-black text-emerald-300">
                    ₦{selectedRecord.savingsDividend.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-indigo-300">2. Borrower Repayment Bonus (20%)</div>
                    <div className="text-[10px] text-indigo-200/70">
                      Repaid NAR: {selectedRecord.borrowerNairaAtRisk.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-black text-indigo-300">
                    ₦{selectedRecord.borrowerBonus.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-950/50 border border-teal-800/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-teal-300">3. Guarantor Repayment Bonus (20%)</div>
                    <div className="text-[10px] text-teal-200/70">
                      Pledged NAR: {selectedRecord.guarantorNairaAtRisk.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-black text-teal-300">
                    ₦{selectedRecord.guarantorBonus.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-800/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-purple-300">4. Executive Honorarium (10%)</div>
                    <div className="text-[10px] text-purple-200/70">
                      Executive Officer Allocation
                    </div>
                  </div>
                  <div className="text-sm font-black text-purple-300">
                    ₦{selectedRecord.honorariumAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Total Combined */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-600/60 flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">Total Payable Dividend:</span>
                <span className="text-xl font-black text-amber-300">
                  ₦{selectedRecord.totalDividend.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Dividend Voucher Modal */}
      {isVoucherOpen && voucherRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-[#DAA520]/60 shadow-2xl overflow-hidden my-auto">
            {/* Voucher Print Area */}
            <div className="p-6 bg-slate-900 text-slate-100 space-y-5">
              {/* Official Header */}
              <div className="text-center border-b border-slate-800 pb-4">
                <div className="inline-flex items-center gap-2 text-xs font-black text-[#DAA520] uppercase tracking-widest">
                  <Building className="w-4 h-4" />
                  Lightway Cooperative Multipurpose Society Ltd
                </div>
                <h2 className="text-lg font-black text-slate-100 mt-1">
                  OFFICIAL AGM DIVIDEND DISTRIBUTION VOUCHER
                </h2>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  RC: LS/COOP/REG/2018/0492 • Accounting Year: 2026/2027
                </div>
              </div>

              {/* Member Details */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Member Name:</span>
                  <span className="font-bold text-slate-100">{voucherRecord.memberName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Membership No:</span>
                  <span className="font-bold text-emerald-400 font-mono">{voucherRecord.memberNo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Branch Office:</span>
                  <span className="font-semibold text-slate-300">{voucherRecord.branch}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Qualification Status:</span>
                  <span className="font-bold text-amber-300">{voucherRecord.dividendStatus}</span>
                </div>
              </div>

              {/* 4 Pool Allocations Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Dividend Policy Category</th>
                      <th className="p-2.5 text-right">Amount (NGN)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-2.5 text-emerald-300 font-semibold">1. General Savings Dividend (50%)</td>
                      <td className="p-2.5 text-right font-bold text-emerald-300">₦{voucherRecord.savingsDividend.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-indigo-300 font-semibold">2. Borrower Repayment Bonus (20%)</td>
                      <td className="p-2.5 text-right font-bold text-indigo-300">₦{voucherRecord.borrowerBonus.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-teal-300 font-semibold">3. Guarantor Repayment Bonus (20%)</td>
                      <td className="p-2.5 text-right font-bold text-teal-300">₦{voucherRecord.guarantorBonus.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-purple-300 font-semibold">4. Executive Honorarium (10%)</td>
                      <td className="p-2.5 text-right font-bold text-purple-300">₦{voucherRecord.honorariumAmount.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-950 font-black">
                      <td className="p-3 text-slate-100 text-sm">TOTAL COMBINED DIVIDEND PAYABLE:</td>
                      <td className="p-3 text-right text-base text-amber-300">₦{voucherRecord.totalDividend.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Official Signatures */}
              <div className="pt-4 grid grid-cols-2 gap-4 text-[10px] text-slate-400 border-t border-slate-800">
                <div className="text-center space-y-2">
                  <div className="h-8 border-b border-dashed border-slate-700 flex items-end justify-center font-serif text-slate-300 italic">
                    Ige Ebenezer
                  </div>
                  <div>Financial Secretary / Executive Board</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="h-8 border-b border-dashed border-slate-700 flex items-end justify-center font-serif text-slate-300 italic">
                    {voucherRecord.memberName}
                  </div>
                  <div>Member Signature & Date</div>
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={handlePrintReport}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-slate-400" />
                Print Voucher
              </button>
              <button
                onClick={() => setIsVoucherOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs"
              >
                Close Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
