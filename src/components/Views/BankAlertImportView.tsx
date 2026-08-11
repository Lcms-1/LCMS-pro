import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Copy,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck,
  Building2,
  Calendar,
  Hash,
  ArrowRight,
  Send,
  Trash2,
  Clock,
  History,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  User,
  PaymentTransaction,
  PaymentCategory,
  BankAlertSMSItem,
  BankAlertImportHistory,
} from '../../types';
import { parseBankAlertSMS, SAMPLE_SMS_PRESETS } from '../../utils/smsParser';
import { apiUrl } from '../../utils/apiClient';

interface BankAlertImportViewProps {
  currentUser: User;
  users: User[];
  onNavigateToFinSec?: () => void;
  onRefreshData?: () => void;
}

export const BankAlertImportView: React.FC<BankAlertImportViewProps> = ({
  currentUser,
  users,
  onNavigateToFinSec,
  onRefreshData,
}) => {
  const [smsRawInput, setSmsRawInput] = useState<string>('');
  const [parsedAlerts, setParsedAlerts] = useState<BankAlertSMSItem[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<PaymentTransaction[]>([]);
  const [importHistory, setImportHistory] = useState<BankAlertImportHistory[]>([]);
  
  // UI states
  const [activeSubTab, setActiveSubTab] = useState<'import' | 'history'>('import');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedSmsId, setExpandedSmsId] = useState<string | null>(null);
  
  // Member Search Modal / Picker state per item
  const [selectingMemberForAlertId, setSelectingMemberForAlertId] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  // Processing & Success alerts
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch existing transactions on mount to run real-time duplicate detection against live server
  useEffect(() => {
    fetch(apiUrl('/api/payment-transactions'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.transactions) {
          setExistingTransactions(data.transactions);
        }
      })
      .catch(() => {});
  }, []);

  // Parse SMS text handler
  const handleParseSMS = () => {
    if (!smsRawInput.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please paste or select SMS bank alert messages first.' });
      return;
    }

    const alerts = parseBankAlertSMS(smsRawInput, existingTransactions);
    
    // Auto-match members by name if senderName is detected
    const autoMatched = alerts.map((alert) => {
      if (alert.senderName && alert.senderName !== 'Unknown Sender') {
        const sName = alert.senderName.toLowerCase();
        const matchedUser = users.find((u) => {
          const uName = u.fullName.toLowerCase();
          return uName.includes(sName) || sName.includes(uName);
        });
        if (matchedUser) {
          return {
            ...alert,
            assignedMemberId: matchedUser.id,
            assignedMemberNo: matchedUser.memberNo,
            assignedMemberName: matchedUser.fullName,
            paymentCategory: alert.paymentCategory || ('Savings Deposit' as PaymentCategory),
            status: 'Assigned' as const,
          };
        }
      }
      return alert;
    });

    setParsedAlerts(autoMatched);
    setFeedbackMessage({
      type: 'success',
      text: `Successfully parsed ${alerts.length} bank alert SMS message(s)! ${
        autoMatched.filter((a) => a.status === 'Assigned').length
      } automatically matched to cooperative members.`,
    });
  };

  const handleLoadPreset = (presetText: string) => {
    setSmsRawInput(presetText);
    const alerts = parseBankAlertSMS(presetText, existingTransactions);
    
    // Auto-match
    const autoMatched = alerts.map((alert) => {
      if (alert.senderName && alert.senderName !== 'Unknown Sender') {
        const sName = alert.senderName.toLowerCase();
        const matchedUser = users.find((u) => {
          const uName = u.fullName.toLowerCase();
          return uName.includes(sName) || sName.includes(uName);
        });
        if (matchedUser) {
          return {
            ...alert,
            assignedMemberId: matchedUser.id,
            assignedMemberNo: matchedUser.memberNo,
            assignedMemberName: matchedUser.fullName,
            paymentCategory: alert.paymentCategory || ('Savings Deposit' as PaymentCategory),
            status: 'Assigned' as const,
          };
        }
      }
      return alert;
    });

    setParsedAlerts(autoMatched);
    setFeedbackMessage({
      type: 'success',
      text: `Loaded preset! Parsed ${alerts.length} bank alert(s). Duplicate check active.`,
    });
  };

  const handleAssignMemberToAlert = (alertId: string, member: User, category: PaymentCategory = 'Savings Deposit') => {
    setParsedAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === alertId) {
          return {
            ...alert,
            assignedMemberId: member.id,
            assignedMemberNo: member.memberNo,
            assignedMemberName: member.fullName,
            paymentCategory: category,
            status: 'Assigned',
          };
        }
        return alert;
      })
    );
    setSelectingMemberForAlertId(null);
  };

  const handleCategoryChange = (alertId: string, category: PaymentCategory) => {
    setParsedAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === alertId) {
          return {
            ...alert,
            paymentCategory: category,
          };
        }
        return alert;
      })
    );
  };

  const handleRemoveAlert = (alertId: string) => {
    setParsedAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleIgnoreAlert = (alertId: string) => {
    setParsedAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, status: 'Ignored' } : alert))
    );
  };

  // Submit assigned alerts to FinSec approval queue in bulk
  const handleSubmitBatchToFinSec = async () => {
    const assignedItems = parsedAlerts.filter((a) => a.status === 'Assigned' && a.assignedMemberId);

    if (assignedItems.length === 0) {
      setFeedbackMessage({
        type: 'error',
        text: 'No assigned bank alerts ready for submission. Please assign at least one member before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    const batchRef = `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let successCount = 0;
    let failCount = 0;

    for (const item of assignedItems) {
      try {
        const payload = {
          memberId: item.assignedMemberId,
          memberNo: item.assignedMemberNo,
          memberName: item.assignedMemberName,
          paymentCategory: item.paymentCategory || 'Savings Deposit',
          paymentMethod: `${item.bankName} (SMS Import)`,
          amount: item.amount,
          date: item.date,
          bankReference: item.bankReference,
          description: item.narration || `Imported Bank Alert (SMS) from ${item.senderName || 'Member'}`,
          submittedBy: currentUser.fullName,
          submittedById: currentUser.id,
          submittedByRole: currentUser.role,
        };

        const res = await fetch(apiUrl('/api/payment-transactions/submit'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    }

    setIsSubmitting(false);

    // Save batch to history log
    const newHistory: BankAlertImportHistory = {
      id: `hist_${Date.now()}`,
      batchReference: batchRef,
      importedAt: new Date().toLocaleString(),
      importedBy: currentUser.fullName,
      totalParsed: parsedAlerts.length,
      totalAssigned: assignedItems.length,
      totalAmount: assignedItems.reduce((sum, a) => sum + a.amount, 0),
      status: failCount === 0 ? 'Completed' : 'Partial',
      alertsSummary: assignedItems,
    };
    setImportHistory((prev) => [newHistory, ...prev]);

    // Clear submitted items from parsed list
    setParsedAlerts((prev) => prev.filter((a) => a.status !== 'Assigned'));

    // Trigger parent refresh
    if (onRefreshData) onRefreshData();

    setFeedbackMessage({
      type: 'success',
      text: `Batch submission complete! ${successCount} bank alert(s) sent to Financial Secretary Approval Queue under batch reference ${batchRef}.`,
    });
  };

  // Filtered parsed alerts
  const filteredAlerts = parsedAlerts.filter((alert) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      alert.bankReference.toLowerCase().includes(q) ||
      alert.senderName?.toLowerCase().includes(q) ||
      alert.narration?.toLowerCase().includes(q) ||
      (alert.assignedMemberName && alert.assignedMemberName.toLowerCase().includes(q)) ||
      (alert.assignedMemberNo && alert.assignedMemberNo.toLowerCase().includes(q));

    const matchesCat =
      filterCategory === 'all'
        ? true
        : filterCategory === 'assigned'
        ? alert.status === 'Assigned'
        : filterCategory === 'pending'
        ? alert.status === 'Pending Member Assignment'
        : filterCategory === 'duplicate'
        ? alert.isDuplicate
        : true;

    return matchesSearch && matchesCat;
  });

  const totalAmountParsed = parsedAlerts.reduce((sum, a) => sum + a.amount, 0);
  const assignedCount = parsedAlerts.filter((a) => a.status === 'Assigned').length;
  const assignedAmount = parsedAlerts.filter((a) => a.status === 'Assigned').reduce((sum, a) => sum + a.amount, 0);
  const pendingCount = parsedAlerts.filter((a) => a.status === 'Pending Member Assignment').length;
  const duplicateCount = parsedAlerts.filter((a) => a.isDuplicate).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#014421] via-[#013318] to-emerald-950 text-white p-6 rounded-2xl shadow-lg border-2 border-[#DAA520]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-[#DAA520] text-[#014421] rounded-xl font-bold shadow-md">
              <Smartphone className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Bulk Bank Alert Import (SMS Import)</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#DAA520] text-[#014421] text-xs font-black">
                  Treasurer Portal
                </span>
              </div>
              <p className="text-emerald-100 text-xs sm:text-sm mt-0.5 font-medium">
                Paste raw SMS bank alerts from phone to auto-extract transaction details, detect duplicates, assign members, and batch-submit to FinSec approval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('import')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeSubTab === 'import'
                  ? 'bg-[#DAA520] text-[#014421] shadow-md'
                  : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <Smartphone className="w-4 h-4 inline mr-1.5" />
              Import SMS Alerts
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeSubTab === 'history'
                  ? 'bg-[#DAA520] text-[#014421] shadow-md'
                  : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-800'
              }`}
            >
              <History className="w-4 h-4 inline mr-1.5" />
              Import History ({importHistory.length})
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between font-bold text-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs px-2 py-1 bg-white/60 hover:bg-white rounded font-black border"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeSubTab === 'import' && (
        <>
          {/* Step 1: SMS Input Section */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#014421]" />
                <h2 className="text-base font-extrabold text-slate-900">Step 1: Paste or Share SMS Bank Alert Messages</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Supports GTBank, Zenith, FirstBank, Access, UBA, Kuda, OPay, etc.</span>
            </div>

            {/* Quick Sample Presets Loader */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5 text-[#DAA520]" />
                <span>Quick Test Presets (1-Click Sample Loaders for Demo & Testing):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {SAMPLE_SMS_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleLoadPreset(preset.text)}
                    className="text-left p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 transition-all group cursor-pointer"
                  >
                    <div className="text-xs font-extrabold text-[#014421] group-hover:text-emerald-900 truncate">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Raw SMS Textarea */}
            <div>
              <textarea
                rows={5}
                value={smsRawInput}
                onChange={(e) => setSmsRawInput(e.target.value)}
                placeholder="Paste single or multiple bank alert SMS messages here... (e.g. Credit: N25,000.00 Acc: 2039****12 Desc: FBN/JOHN ADEBAYO Date: 05-Aug-2026 Ref: 893402948210)"
                className="w-full p-4 rounded-xl border-2 border-slate-300 focus:border-[#014421] focus:ring-2 focus:ring-emerald-200 text-sm font-mono text-slate-800 placeholder-slate-400 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSmsRawInput('');
                  setParsedAlerts([]);
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Clear Input
              </button>

              <button
                type="button"
                onClick={handleParseSMS}
                className="px-6 py-3 bg-[#014421] hover:bg-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer border border-[#DAA520]"
              >
                <Sparkles className="w-4 h-4 text-[#DAA520]" />
                Parse & Extract SMS Bank Alerts
              </button>
            </div>
          </div>

          {/* Parsed Summary Stats Bar */}
          {parsedAlerts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500">Total SMS Parsed</div>
                <div className="text-xl font-black text-slate-900 mt-1">{parsedAlerts.length} Alerts</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">₦{totalAmountParsed.toLocaleString()} Total</div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
                <div className="text-xs font-bold text-emerald-800">Assigned Members</div>
                <div className="text-xl font-black text-emerald-900 mt-1">{assignedCount} Assigned</div>
                <div className="text-xs text-emerald-700 font-medium mt-0.5">₦{assignedAmount.toLocaleString()} Ready</div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
                <div className="text-xs font-bold text-amber-800">Pending Assignment</div>
                <div className="text-xl font-black text-amber-900 mt-1">{pendingCount} Alerts</div>
                <div className="text-xs text-amber-700 font-medium mt-0.5">Requires Member Search</div>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 shadow-sm">
                <div className="text-xs font-bold text-rose-800">Duplicates Detected</div>
                <div className="text-xl font-black text-rose-900 mt-1">{duplicateCount} Warnings</div>
                <div className="text-xs text-rose-700 font-medium mt-0.5">Existing Ref / Amount</div>
              </div>
            </div>
          )}

          {/* Step 2: Parsed Alerts Workstation Table */}
          {parsedAlerts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden space-y-0">
              {/* Header Controls */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Step 2: Assign Members & Categories</h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Search cooperative members to match each bank alert, select payment category, then submit batch.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search alerts, ref, sender..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#014421] w-48 sm:w-56"
                    />
                  </div>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-700"
                  >
                    <option value="all">All Alerts ({parsedAlerts.length})</option>
                    <option value="assigned">Assigned ({assignedCount})</option>
                    <option value="pending">Pending ({pendingCount})</option>
                    <option value="duplicate">Duplicates ({duplicateCount})</option>
                  </select>
                </div>
              </div>

              {/* Batch Submit Action Bar */}
              {assignedCount > 0 && (
                <div className="p-4 bg-[#014421] text-white flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#DAA520]" />
                    <span className="text-xs sm:text-sm font-extrabold">
                      {assignedCount} Assigned Alert(s) Ready for Batch Submission (Total: ₦{assignedAmount.toLocaleString()})
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSubmitBatchToFinSec}
                    className="px-5 py-2.5 bg-[#DAA520] hover:bg-amber-400 text-[#014421] font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting Batch...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit {assignedCount} Alert(s) to FinSec Approval Queue</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Alerts List */}
              <div className="divide-y divide-slate-100">
                {filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium">
                    No bank alerts match your search or filter selection.
                  </div>
                ) : (
                  filteredAlerts.map((alert, idx) => (
                    <div
                      key={alert.id}
                      className={`p-5 transition-colors ${
                        alert.isDuplicate
                          ? 'bg-rose-50/40 hover:bg-rose-50/70'
                          : alert.status === 'Assigned'
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Top Row: Ref, Date, Amount, Status */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold shrink-0">
                            <Building2 className="w-5 h-5 text-[#014421]" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border">
                                Ref: {alert.bankReference}
                              </span>
                              <span className="text-xs font-extrabold text-[#014421] px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                                {alert.bankName}
                              </span>
                              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {alert.date} {alert.time}
                              </span>
                            </div>

                            <div className="text-xs text-slate-700 font-bold mt-1">
                              Sender: <span className="text-slate-900 font-black">{alert.senderName}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium line-clamp-1">
                              {alert.narration}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="flex items-center gap-4 self-end md:self-auto">
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-900">
                              ₦{alert.amount.toLocaleString()}
                            </div>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                alert.status === 'Assigned'
                                  ? 'bg-emerald-600 text-white'
                                  : alert.status === 'Ignored'
                                  ? 'bg-slate-400 text-white'
                                  : 'bg-amber-500 text-slate-950'
                              }`}
                            >
                              {alert.status}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedSmsId(expandedSmsId === alert.id ? null : alert.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            title="Toggle raw SMS preview"
                          >
                            {expandedSmsId === alert.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveAlert(alert.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Delete alert"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Duplicate Warning Box */}
                      {alert.isDuplicate && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{alert.duplicateReason}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setParsedAlerts((prev) =>
                                prev.map((a) => (a.id === alert.id ? { ...a, isDuplicate: false } : a))
                              );
                            }}
                            className="text-[11px] px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 rounded-lg border font-black shrink-0"
                          >
                            Dismiss Flag
                          </button>
                        </div>
                      )}

                      {/* Raw SMS Expandable Preview */}
                      {expandedSmsId === alert.id && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed border border-slate-700">
                          <div className="text-[10px] text-slate-400 uppercase font-sans font-bold mb-1">Raw SMS Message Body:</div>
                          {alert.rawSms}
                        </div>
                      )}

                      {/* Member Assignment & Classification Controls */}
                      <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 p-3 rounded-xl">
                        {/* Member Status / Selector */}
                        <div className="flex-1 min-w-0">
                          {alert.assignedMemberId ? (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="text-xs font-extrabold text-emerald-900 truncate">
                                Assigned Member: <span className="underline">{alert.assignedMemberName}</span> ({alert.assignedMemberNo})
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectingMemberForAlertId(alert.id)}
                                className="text-[10px] px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-black ml-1"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-xs text-amber-900 font-bold">Unassigned</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectingMemberForAlertId(alert.id);
                                  setMemberSearchQuery(alert.senderName || '');
                                }}
                                className="px-3 py-1.5 bg-[#014421] hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Search className="w-3.5 h-3.5 text-[#DAA520]" />
                                <span>Search & Assign Member</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Category Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">Category:</span>
                          <select
                            value={alert.paymentCategory || 'Savings Deposit'}
                            onChange={(e) => handleCategoryChange(alert.id, e.target.value as PaymentCategory)}
                            className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 bg-white font-black text-[#014421] focus:outline-none focus:border-[#014421]"
                          >
                            <option value="Savings Deposit">Savings Deposit</option>
                            <option value="Registration Fee">Registration Fee</option>
                            <option value="Loan Repayment">Loan Repayment (Principal)</option>
                            <option value="Interest Payment">Interest Payment</option>
                            <option value="Other Income">Other Income</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* History Subtab */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b pb-3">
            <History className="w-5 h-5 text-[#014421]" />
            <h2 className="text-base font-extrabold text-slate-900">Bulk Import Batch History</h2>
          </div>

          {importHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No previous import batches recorded in this session yet.
            </div>
          ) : (
            <div className="space-y-3">
              {importHistory.map((hist) => (
                <div key={hist.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">{hist.batchReference}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                        {hist.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 font-medium">
                      Imported at {hist.importedAt} by {hist.importedBy}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">₦{hist.totalAmount.toLocaleString()}</div>
                    <div className="text-xs text-slate-500 font-medium">{hist.totalAssigned} alerts submitted</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Member Assignment Picker Modal */}
      {selectingMemberForAlertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#DAA520] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 bg-[#014421] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#DAA520]" />
                <h3 className="font-extrabold text-sm">Assign Member to Bank Alert</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectingMemberForAlertId(null)}
                className="text-emerald-200 hover:text-white font-black text-xs px-2 py-1 bg-emerald-900 rounded"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search member by Name, Member No (e.g. LC2026-0001), or Phone..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border-2 border-slate-300 focus:border-[#014421] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-100">
                {users
                  .filter((u) => {
                    const q = memberSearchQuery.toLowerCase();
                    return (
                      u.fullName.toLowerCase().includes(q) ||
                      u.memberNo.toLowerCase().includes(q) ||
                      u.phone.includes(q)
                    );
                  })
                  .slice(0, 10)
                  .map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleAssignMemberToAlert(selectingMemberForAlertId, u)}
                      className="p-3 rounded-xl hover:bg-emerald-50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-black text-slate-900 group-hover:text-[#014421]">
                          {u.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          No: {u.memberNo} | Branch: {u.branch} | Phone: {u.phone}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1 bg-[#014421] text-white text-[11px] font-black rounded-lg shadow-xs group-hover:bg-[#DAA520] group-hover:text-[#014421] transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
