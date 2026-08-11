import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  FileText,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Building2,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  DollarSign,
  Wallet,
  UserPlus,
  HelpCircle,
  Printer,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { PendingMemberApplication, PaymentMethod } from '../types';
import { formatNaira } from '../utils/formatters';
import { CoopLogo } from './CoopLogo';
import { apiUrl } from '../utils/apiClient';

interface PendingMembershipApplicationsModuleProps {
  currentRole?: string;
  actorName?: string;
  actorId?: string;
  onRefreshData?: () => void;
}

export const PendingMembershipApplicationsModule: React.FC<PendingMembershipApplicationsModuleProps> = ({
  currentRole = 'financial_secretary',
  actorName = 'Financial Secretary',
  actorId = 'usr_finsec01',
  onRefreshData,
}) => {
  const [applications, setApplications] = useState<PendingMemberApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<PendingMemberApplication | null>(null);
  const [selectedAppForReject, setSelectedAppForReject] = useState<PendingMemberApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedAppForMoreInfo, setSelectedAppForMoreInfo] = useState<PendingMemberApplication | null>(null);
  const [moreInfoNotes, setMoreInfoNotes] = useState<string>('');

  // Fee Payment Modal State
  const [selectedAppForFee, setSelectedAppForFee] = useState<PendingMemberApplication | null>(null);
  const [feeForm, setFeeForm] = useState({
    amountPaid: 2500,
    datePaid: new Date().toISOString().split('T')[0],
    receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    receivedBy: actorName || 'Financial Secretary',
    notes: 'Registration fee & initial savings passbook allocation',
  });

  const [noticeMsg, setNoticeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/self-registration/applications'));
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Error fetching pending member applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Sponsor Verification Checkbox Handler
  const handleToggleSponsorConfirmed = async (appId: string, currentVal: boolean) => {
    try {
      const res = await fetch(apiUrl(`/api/self-registration/applications/${appId}/verify-sponsor`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed: !currentVal,
          actorName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update sponsor verification status.');
      }

      setNoticeMsg({
        type: 'success',
        text: data.message || 'Sponsor verification updated successfully.',
      });
      fetchApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setNoticeMsg({ type: 'error', text: err.message || 'Error verifying sponsor.' });
    }
  };

  // Approval Handler
  const handleApproveApplication = async (appId: string) => {
    setIsActionLoading(true);
    setNoticeMsg(null);
    try {
      const res = await fetch(apiUrl(`/api/self-registration/applications/${appId}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorName,
          actorId,
          role: currentRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve membership application.');
      }

      setNoticeMsg({
        type: 'success',
        text: data.message || 'Membership application approved successfully!',
      });
      fetchApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setNoticeMsg({ type: 'error', text: err.message || 'Approval failed.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Rejection Handler
  const handleRejectApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForReject) return;
    setIsActionLoading(true);
    setNoticeMsg(null);
    try {
      const res = await fetch(apiUrl(`/api/self-registration/applications/${selectedAppForReject.id}/reject`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectionReason,
          actorName,
          actorId,
          role: currentRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject application.');
      }

      setNoticeMsg({ type: 'success', text: data.message || 'Application rejected.' });
      setSelectedAppForReject(null);
      setRejectionReason('');
      fetchApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setNoticeMsg({ type: 'error', text: err.message || 'Rejection failed.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Request More Info Handler
  const handleRequestMoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForMoreInfo) return;
    setIsActionLoading(true);
    setNoticeMsg(null);
    try {
      const res = await fetch(apiUrl(`/api/self-registration/applications/${selectedAppForMoreInfo.id}/request-more-info`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: moreInfoNotes,
          actorName,
          actorId,
          role: currentRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to request additional info.');
      }

      setNoticeMsg({ type: 'success', text: data.message || 'Additional info requested.' });
      setSelectedAppForMoreInfo(null);
      setMoreInfoNotes('');
      fetchApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setNoticeMsg({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Pay Registration Fee & Activate Member Handler (Auto-Split)
  const handlePayRegistrationFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppForFee) return;
    setIsActionLoading(true);
    setNoticeMsg(null);

    try {
      const res = await fetch(apiUrl(`/api/self-registration/applications/${selectedAppForFee.id}/pay-registration-fee`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...feeForm,
          actorName,
          actorId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process registration fee.');
      }

      setNoticeMsg({
        type: 'success',
        text: data.message || 'Registration fee payment recorded and member activated!',
      });

      setSelectedAppForFee(null);
      fetchApplications();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setNoticeMsg({ type: 'error', text: err.message || 'Fee payment failed.' });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filtered List
  const filteredApplications = applications.filter((app) => {
    const q = search.toLowerCase();
    const matchesQuery =
      app.fullName.toLowerCase().includes(q) ||
      app.phone.toLowerCase().includes(q) ||
      app.applicationNo.toLowerCase().includes(q) ||
      app.sponsorName.toLowerCase().includes(q) ||
      app.occupation.toLowerCase().includes(q) ||
      (app.paymentReference && app.paymentReference.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (statusFilter === 'awaiting_payment') return app.status === 'Awaiting Payment Verification' || app.status === 'Pending Registration';
    if (statusFilter === 'payment_verified') return app.status === 'Payment Verified' || app.treasurerVerified;
    if (statusFilter === 'approved') return app.status === 'Approved';
    if (statusFilter === 'rejected') return app.status === 'Rejected';
    if (statusFilter === 'more_info') return app.status === 'More Information Requested';

    return true;
  });

  const awaitingPaymentCount = applications.filter((a) => a.status === 'Awaiting Payment Verification' || a.status === 'Pending Registration').length;
  const paymentVerifiedCount = applications.filter((a) => a.status === 'Payment Verified' || (a.treasurerVerified && a.status !== 'Approved')).length;
  const approvedCount = applications.filter((a) => a.status === 'Approved').length;

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white p-6 rounded-2xl shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Financial Secretary Control Deck
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30">
                LCMS PRO v1.0
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-7 h-7 text-teal-400" /> Pending Membership Applications
            </h2>
            <p className="text-xs text-teal-200/80 max-w-2xl">
              Review self-registration submissions, verify sponsor confirmation by phone or in person, approve member ID creation, and post registration fees with automatic ₦2,500 fee / savings splitting.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center">
              <div className="text-xl font-black text-amber-400">{awaitingPaymentCount}</div>
              <div className="text-[10px] text-teal-200 uppercase font-semibold">Awaiting Payment</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center">
              <div className="text-xl font-black text-teal-300">{paymentVerifiedCount}</div>
              <div className="text-[10px] text-teal-200 uppercase font-semibold">Payment Verified</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center">
              <div className="text-xl font-black text-emerald-400">{approvedCount}</div>
              <div className="text-[10px] text-teal-200 uppercase font-semibold">Approved & Activated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Message Toast */}
      {noticeMsg && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            noticeMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800/80 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/60 dark:border-rose-800/80 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {noticeMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{noticeMsg.text}</span>
          </div>
          <button onClick={() => setNoticeMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Applicant, Phone, App No, Sponsor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              statusFilter === 'all'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All ({applications.length})
          </button>

          <button
            onClick={() => setStatusFilter('awaiting_payment')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              statusFilter === 'awaiting_payment'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Awaiting Payment ({awaitingPaymentCount})
          </button>

          <button
            onClick={() => setStatusFilter('payment_verified')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              statusFilter === 'payment_verified'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Payment Verified ({paymentVerifiedCount})
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Approved ({approvedCount})
          </button>

          <button
            onClick={() => setStatusFilter('more_info')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              statusFilter === 'more_info'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            More Info Requested
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm font-medium">Loading pending membership applications store...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Membership Applications Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No self-registration applications match your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all shadow-xs ${
                app.status === 'Pending Registration'
                  ? 'border-amber-300 dark:border-amber-800/60 hover:shadow-md'
                  : app.status === 'Approved'
                  ? 'border-emerald-300 dark:border-emerald-800/60'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                
                {/* Applicant Photo & Info */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={app.passportPhoto}
                      alt={app.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-xs"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs ${
                        app.sponsorConfirmed ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      title={app.sponsorConfirmed ? 'Sponsor Verified' : 'Sponsor Pending Verification'}
                    >
                      {app.sponsorConfirmed ? '✓' : '!'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {app.fullName}
                      </h3>
                      <span className="font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                        {app.applicationNo}
                      </span>
                      
                      {/* Status Badges */}
                      {(app.status === 'Awaiting Payment Verification' || app.status === 'Pending Registration') && (
                        <span className="bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> Awaiting Payment Verification
                        </span>
                      )}
                      {(app.status === 'Payment Verified' || (app.treasurerVerified && app.status !== 'Approved')) && (
                        <span className="bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-teal-300 dark:border-teal-800">
                          <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" /> Payment Verified (₦{Number(app.treasurerVerifiedAmount || app.paymentAmount || 10000).toLocaleString()})
                        </span>
                      )}
                      {(app.status === 'Approved' || app.status === 'Approved - Pending First Deposit') && (
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> Pending First Deposit ({app.approvedMemberId})
                        </span>
                      )}
                      {app.status === 'Completed' && (
                        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                          <BadgeCheck className="w-3 h-3" /> Active Member ({app.approvedMemberId})
                        </span>
                      )}
                      {app.status === 'More Information Requested' && (
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-300 dark:border-blue-800">
                          <HelpCircle className="w-3 h-3" /> More Info Requested
                        </span>
                      )}
                      {app.status === 'Rejected' && (
                        <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-300 dark:border-rose-800">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {app.phone}
                      </span>
                      {app.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {app.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {app.occupation}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {app.branch}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <MapPin className="w-3 h-3 inline mr-1 text-slate-400" /> Address: {app.residentialAddress}
                    </div>
                  </div>
                </div>

                {/* Sponsor Verification Box & Action Controls */}
                <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  
                  {/* Payment Verification & Sponsor Verification Cards */}
                  <div className="flex flex-col gap-2 w-full lg:w-80">
                    
                    {/* Treasurer Payment Verification Status Box */}
                    <div className={`p-2.5 rounded-xl border text-xs ${
                      app.treasurerVerified || app.status === 'Payment Verified'
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 text-teal-900 dark:text-teal-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                    }`}>
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Treasurer Bank Verification:
                        </span>
                        <span>
                          {app.treasurerVerified || app.status === 'Payment Verified' ? (
                            <strong className="text-teal-700 dark:text-teal-300">VERIFIED ✓</strong>
                          ) : (
                            <strong className="text-amber-700 dark:text-amber-400">PENDING ⏳</strong>
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 space-y-0.5">
                        <p>Claimed Transfer: <strong className="font-mono text-slate-900 dark:text-white">₦{Number(app.paymentAmount || 10000).toLocaleString()}</strong> (Ref: <span className="font-mono">{app.paymentReference || 'N/A'}</span>)</p>
                        {app.treasurerVerifiedBy && (
                          <p className="text-teal-700 dark:text-teal-400 font-medium">Verified by: {app.treasurerVerifiedBy} on {app.treasurerVerifiedDate || 'Recently'}</p>
                        )}
                      </div>
                    </div>

                    {/* MANDATORY Sponsor Checkbox */}
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60">
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id={`sponsor_check_${app.id}`}
                          checked={app.sponsorConfirmed}
                          onChange={() => handleToggleSponsorConfirmed(app.id, app.sponsorConfirmed)}
                          className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-amber-300 dark:border-amber-700 cursor-pointer"
                        />
                        <label htmlFor={`sponsor_check_${app.id}`} className="text-xs cursor-pointer select-none">
                          <span className="font-bold text-amber-900 dark:text-amber-200 block">
                            ☐ Sponsor has confirmed this applicant
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5">
                            Introduced by: <strong className="text-slate-900 dark:text-white">{app.sponsorName}</strong> ({app.sponsorMemberId})
                          </span>
                        </label>
                      </div>

                      {app.sponsorConfirmed && (
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1.5 pt-1 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3 text-emerald-600" /> Verified by {app.sponsorConfirmedBy || 'FinSec'} ({app.sponsorConfirmedDate || 'Recently'})
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
                    
                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>

                    {/* Approve Application Button */}
                    {app.status !== 'Approved' && app.status !== 'Approved - Pending First Deposit' && app.status !== 'Completed' && app.status !== 'Rejected' && (
                      <div className="relative group">
                        <button
                          disabled={!app.sponsorConfirmed || (!app.treasurerVerified && app.status !== 'Payment Verified') || isActionLoading}
                          onClick={() => handleApproveApplication(app.id)}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs ${
                            app.sponsorConfirmed && (app.treasurerVerified || app.status === 'Payment Verified')
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Application
                        </button>

                        {(!app.sponsorConfirmed || (!app.treasurerVerified && app.status !== 'Payment Verified')) && (
                          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-72 bg-slate-900 text-white text-[10px] p-2.5 rounded-lg shadow-xl z-20 font-medium space-y-1">
                            {!app.treasurerVerified && app.status !== 'Payment Verified' && (
                              <p className="text-amber-300">⚠️ Step 1: Treasurer must verify the bank transfer payment first.</p>
                            )}
                            {!app.sponsorConfirmed && (
                              <p className="text-amber-300">⚠️ Step 2: Financial Secretary must confirm sponsor introduction.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Post Registration Fee & First Deposit Button (For Approved applications awaiting first deposit) */}
                    {(app.status === 'Approved' || app.status === 'Approved - Pending First Deposit') && (
                      <button
                        onClick={() => {
                          setSelectedAppForFee(app);
                          setFeeForm((prev) => ({
                            ...prev,
                            notes: `First deposit & registration fee for ${app.fullName} (${app.approvedMemberId})`,
                          }));
                        }}
                        className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Post First Deposit (₦2,500+ Reg Fee)
                      </button>
                    )}

                    {/* More Info Button */}
                    {app.status === 'Pending Registration' && (
                      <button
                        onClick={() => setSelectedAppForMoreInfo(app)}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Request Info
                      </button>
                    )}

                    {/* Reject Button */}
                    {app.status === 'Pending Registration' && (
                      <button
                        onClick={() => setSelectedAppForReject(app)}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}

                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: Full Application View Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CoopLogo size="sm" />
                <div>
                  <h3 className="font-bold text-sm">LCMS PRO Membership Application Dossier</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedApp.applicationNo}</p>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-1.5 hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Photo & Main Info Header */}
              <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <img
                  src={selectedApp.passportPhoto}
                  alt={selectedApp.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-300 dark:border-slate-600 shadow-md"
                />
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedApp.fullName}</h2>
                  <p className="text-xs text-slate-500 font-mono">App No: {selectedApp.applicationNo}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300"><strong>Status:</strong> {selectedApp.status}</p>
                  <p className="text-xs text-slate-500"><strong>Submitted:</strong> {selectedApp.dateSubmitted}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold mb-0.5">Phone Number</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApp.phone}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold mb-0.5">Email Address</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApp.email || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold mb-0.5">Date of Birth & Gender</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApp.dob} ({selectedApp.gender})</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold mb-0.5">Occupation</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApp.occupation}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700 col-span-2">
                  <span className="text-slate-400 block font-semibold mb-0.5">Residential Address</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApp.residentialAddress}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold mb-0.5">Means of Identification</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApp.meansOfId || 'NIN'}: {selectedApp.idNumber || 'N/A'}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block font-semibold mb-0.5">Cooperative Branch</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedApp.branch}</span>
                </div>
              </div>

              {/* Sponsor Information Card */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span>Introducer / Sponsor Verification</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedApp.sponsorConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'}`}>
                    {selectedApp.sponsorConfirmed ? 'CONFIRMED' : 'PENDING VERIFICATION'}
                  </span>
                </div>
                <p><strong>Sponsor Name:</strong> {selectedApp.sponsorName}</p>
                <p><strong>Sponsor Member ID:</strong> {selectedApp.sponsorMemberId}</p>
                {selectedApp.sponsorConfirmed && (
                  <p className="text-emerald-700 dark:text-emerald-400">
                    <strong>Verified By:</strong> {selectedApp.sponsorConfirmedBy || 'Financial Secretary'} on {selectedApp.sponsorConfirmedDate}
                  </p>
                )}
              </div>

              {/* Approval History if approved */}
              {selectedApp.approvedMemberId && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
                  <div className="font-bold">Approval Audit Details</div>
                  <p><strong>Generated Member ID:</strong> {selectedApp.approvedMemberId}</p>
                  <p><strong>Approved By:</strong> {selectedApp.approvedBy}</p>
                  <p><strong>Approval Date:</strong> {selectedApp.approvalDate}</p>
                </div>
              )}

            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Fee Payment Modal with Live Split Calculator */}
      {selectedAppForFee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="bg-teal-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Post Registration Fee Payment</h3>
                <p className="text-xs text-teal-200">{selectedAppForFee.fullName} ({selectedAppForFee.approvedMemberId})</p>
              </div>
              <button onClick={() => setSelectedAppForFee(null)} className="p-1 hover:bg-teal-800 rounded-full">
                <X className="w-5 h-5 text-teal-200" />
              </button>
            </div>

            <form onSubmit={handlePayRegistrationFee} className="p-6 space-y-4">
              
              {/* Live Fee Splitting Calculator Banner */}
              <div className="bg-teal-50 dark:bg-teal-950/50 p-4 rounded-xl border border-teal-200 dark:border-teal-800 space-y-2 text-xs">
                <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" /> Automatic Fee Split Logic:
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Default Registration Fee:</span>
                    <strong className="text-teal-900 dark:text-teal-200">{formatNaira(2500)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>First Savings Passbook Credit:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {feeForm.amountPaid >= 2500 ? formatNaira(feeForm.amountPaid - 2500) : formatNaira(0)}
                    </strong>
                  </div>
                </div>

                {feeForm.amountPaid < 2500 && (
                  <div className="text-rose-600 dark:text-rose-400 text-[11px] font-bold pt-1 border-t border-teal-200 dark:border-teal-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Below ₦2,500 threshold! Membership will NOT be activated.
                  </div>
                )}
              </div>

              {/* Amount Paid Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Payment Received (₦) *
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  value={feeForm.amountPaid}
                  onChange={(e) => setFeeForm({ ...feeForm, amountPaid: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold font-mono focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Example: If member pays ₦10,000 &rarr; ₦2,500 goes to Registration Fee Vault & ₦7,500 to Savings Passbook.
                </p>
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={feeForm.datePaid}
                    onChange={(e) => setFeeForm({ ...feeForm, datePaid: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={feeForm.paymentMethod}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="POS / Card">POS / Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt / Bank Reference No
                </label>
                <input
                  type="text"
                  required
                  value={feeForm.receiptNumber}
                  onChange={(e) => setFeeForm({ ...feeForm, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              {/* Receving Officer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receiving Financial Officer
                </label>
                <input
                  type="text"
                  value={feeForm.receivedBy}
                  onChange={(e) => setFeeForm({ ...feeForm, receivedBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForFee(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isActionLoading || feeForm.amountPaid < 2500}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-700/20 disabled:opacity-50"
                >
                  {isActionLoading ? 'Processing...' : 'Confirm & Activate Member'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Rejection Modal */}
      {selectedAppForReject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" /> Reject Application: {selectedAppForReject.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason for declining this self-registration application.
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g. Sponsor unconfirmed after multiple contact attempts."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppForReject(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectApplication}
                disabled={!rejectionReason.trim() || isActionLoading}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Request More Info Modal */}
      {selectedAppForMoreInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" /> Request Information: {selectedAppForMoreInfo.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              Specify what additional documentation or details are required from the applicant.
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g. Please re-upload a clearer passport photograph or provide valid NIN number."
              value={moreInfoNotes}
              onChange={(e) => setMoreInfoNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppForMoreInfo(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestMoreInfo}
                disabled={!moreInfoNotes.trim() || isActionLoading}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
