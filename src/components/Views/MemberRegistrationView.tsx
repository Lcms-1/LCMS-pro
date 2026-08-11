import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Edit3,
  Eye,
  CreditCard,
  Printer,
  ShieldAlert,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  BadgeCheck,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  X,
  UserCheck,
  RefreshCw,
  Award,
  FileText,
  Check,
  User as UserIcon,
  Building2,
  Lock,
  Trash2,
} from 'lucide-react';
import { User, MembershipStatus, MeansOfId, RegistrationFeeStatus, IdCardStatus, NextOfKin, PaymentMethod } from '../../types';
import { COOPERATIVE_BRANCHES } from '../../data/mockData';
import { NIGERIAN_STATES, NIGERIAN_STATES_AND_LGAS, APPROVED_OPERATING_STATES } from '../../data/nigeriaStatesLgas';
import { PassportPhotoPicker } from '../PassportPhotoPicker';
import { AlertMessage } from '../AlertMessage';
import { MemberStatusBadge } from '../MemberStatusBadge';
import { CoopLogo } from '../CoopLogo';
import { PendingMembershipApplicationsModule } from '../PendingMembershipApplicationsModule';
import { findDuplicateMember } from '../../utils/duplicateValidation';
import { apiUrl } from '../../utils/apiClient';

interface MemberRegistrationViewProps {
  users: User[];
  currentRole?: string;
  initialStatusFilter?: string;
  initialRegFeeFilter?: string;
  initialIdCardFilter?: string;
  onRegisterMember: (newMemberData: Partial<User>) => Promise<{ success: boolean; message: string; error?: string }>;
  onUpdateMember: (id: string, updatedData: Partial<User>) => Promise<{ success: boolean; message: string; error?: string }>;
  onUpdateStatus: (id: string, status: MembershipStatus, regFee?: RegistrationFeeStatus, idCard?: IdCardStatus) => Promise<void>;
  onDeleteMember?: (id: string) => Promise<{ success: boolean; message: string; error?: string }>;
}

export const MemberRegistrationView: React.FC<MemberRegistrationViewProps> = ({
  users,
  currentRole = 'sys_admin',
  initialStatusFilter = 'all',
  initialRegFeeFilter = 'all',
  initialIdCardFilter = 'all',
  onRegisterMember,
  onUpdateMember,
  onUpdateStatus,
  onDeleteMember,
}) => {
  // Navigation & Search State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [regFeeFilter, setRegFeeFilter] = useState<string>(initialRegFeeFilter);
  const [idCardFilter, setIdCardFilter] = useState<string>(initialIdCardFilter);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeModuleTab, setActiveModuleTab] = useState<'roster' | 'pending_applications'>('roster');
  const [pendingAppsCount, setPendingAppsCount] = useState<number>(0);

  const fetchPendingAppsCount = () => {
    fetch(apiUrl('/api/self-registration/applications'))
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.applications)) {
          const p = d.applications.filter((a: any) => a.status === 'Pending Registration').length;
          setPendingAppsCount(p);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchPendingAppsCount();
  }, []);

  useEffect(() => {
    if (initialStatusFilter !== undefined) setStatusFilter(initialStatusFilter);
    if (initialRegFeeFilter !== undefined) setRegFeeFilter(initialRegFeeFilter);
    if (initialIdCardFilter !== undefined) setIdCardFilter(initialIdCardFilter);
  }, [initialStatusFilter, initialRegFeeFilter, initialIdCardFilter]);

  // Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedMemberForView, setSelectedMemberForView] = useState<User | null>(null);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<User | null>(null);
  const [selectedMemberForIdCard, setSelectedMemberForIdCard] = useState<User | null>(null);
  const [selectedMemberForSlip, setSelectedMemberForSlip] = useState<User | null>(null);

  // Dynamic Registration Fee from Cooperative Settings
  const [configuredRegFee, setConfiguredRegFee] = useState<number>(2500);

  useEffect(() => {
    fetch(apiUrl('/api/settings'))
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings?.registrationFee) {
          setConfiguredRegFee(d.settings.registrationFee);
          setFeePaymentForm((prev) => ({ ...prev, amountPaid: d.settings.registrationFee }));
        }
      })
      .catch(() => {});
  }, []);

  // Registration Fee Payment / Activation Modal State
  const [selectedMemberForFeePayment, setSelectedMemberForFeePayment] = useState<User | null>(null);
  const [feePaymentForm, setFeePaymentForm] = useState({
    amountPaid: 2500,
    datePaid: new Date().toISOString().split('T')[0],
    receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    receivedBy: 'Financial Secretary',
    notes: 'Registration fee confirmed. Membership activated.',
  });
  const [feeSuccessNotice, setFeeSuccessNotice] = useState<string | null>(null);
  const [feeErrorNotice, setFeeErrorNotice] = useState<string | null>(null);

  // Registration Form State
  const initialFormState = {
    fullName: '',
    email: '',
    phone: '',
    branch: '',
    dob: '1990-06-15',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    state: '',
    lga: '',
    residentialAddress: '',
    occupation: '',
    meansOfId: 'NIN' as MeansOfId,
    idNumber: '',
    nextOfKinName: '',
    nextOfKinRel: 'Spouse',
    nextOfKinPhone: '',
    nextOfKinAddress: '',
    dateJoined: new Date().toISOString().split('T')[0],
    introducedBy: 'Chief Olusegun Adebayo (LCMS-MEM-002)',
    status: 'pending' as MembershipStatus,
    registrationFeeStatus: 'Unpaid' as RegistrationFeeStatus,
    idCardStatus: 'Processing' as IdCardStatus,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'personal' | 'id_sponsor' | 'kin' | 'fee_status'>('personal');

  // Edit Form State
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  // Open Registration Fee Payment Modal for a Member
  const openFeePaymentModal = (member: User) => {
    setSelectedMemberForFeePayment(member);
    setFeePaymentForm({
      amountPaid: configuredRegFee,
      datePaid: new Date().toISOString().split('T')[0],
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: 'Bank Transfer' as PaymentMethod,
      receivedBy: 'Financial Secretary',
      notes: `Registration fee confirmed (₦${configuredRegFee.toLocaleString()}). Membership activated.`,
    });
    setFeeSuccessNotice(null);
    setFeeErrorNotice(null);
  };

  // Submit Registration Fee Payment & Automatically Activate Member
  const handleConfirmFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForFeePayment) return;

    if (!feePaymentForm.receiptNumber.trim()) {
      setFeeErrorNotice('Please enter a valid Receipt Number.');
      return;
    }

    setIsSubmitting(true);
    setFeeErrorNotice(null);

    try {
      const res = await fetch(apiUrl(`/api/members/${selectedMemberForFeePayment.id}/pay-registration-fee`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feePaymentForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await onUpdateStatus(selectedMemberForFeePayment.id, 'active', 'Paid');
        setFeeSuccessNotice(
          `Registration Fee of ₦${feePaymentForm.amountPaid.toLocaleString()} recorded! Member '${selectedMemberForFeePayment.fullName}' status is now ACTIVE!`
        );
        setTimeout(() => {
          setSelectedMemberForFeePayment(null);
          setFeeSuccessNotice(null);
        }, 1800);
      } else {
        // Fallback local state update
        await onUpdateStatus(selectedMemberForFeePayment.id, 'active', 'Paid');
        setFeeSuccessNotice(`Registration fee recorded! Member '${selectedMemberForFeePayment.fullName}' activated.`);
        setTimeout(() => {
          setSelectedMemberForFeePayment(null);
          setFeeSuccessNotice(null);
        }, 1800);
      }
    } catch (err) {
      await onUpdateStatus(selectedMemberForFeePayment.id, 'active', 'Paid');
      setFeeSuccessNotice(`Registration fee recorded! Member '${selectedMemberForFeePayment.fullName}' activated.`);
      setTimeout(() => {
        setSelectedMemberForFeePayment(null);
        setFeeSuccessNotice(null);
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate preview Membership Number sequentially (LC2026-XXXX)
  const lcMemberNumbers = users
    .map((u) => u.memberNo)
    .filter((m) => Boolean(m))
    .map((m) => {
      if (m.startsWith('LC2026-')) {
        const parts = m.split('-');
        return parseInt(parts[1], 10);
      }
      const matches = m.match(/\d+/g);
      if (matches && matches.length > 0) {
        return parseInt(matches[matches.length - 1], 10);
      }
      return 0;
    })
    .filter((num) => !isNaN(num) && num > 0);
  const nextSeq = lcMemberNumbers.length > 0 ? Math.max(...lcMemberNumbers) + 1 : users.length + 1;
  const autoGeneratedNumberPreview = `LC2026-${String(nextSeq).padStart(4, '0')}`;

  const getAvailableBranches = (selectedState: string, selectedLga: string) => {
    if (!selectedState || !selectedLga) return [];
    const normState = selectedState.replace(/ State$/i, '').trim();

    const stateBranches = COOPERATIVE_BRANCHES.filter((b) => {
      const bState = b.state.replace(/ State$/i, '').trim();
      return bState.toLowerCase() === normState.toLowerCase();
    });

    const list = [...stateBranches];
    const hasLgaBranch = list.some(
      (b) =>
        b.lga?.toLowerCase() === selectedLga.toLowerCase() ||
        b.city.toLowerCase() === selectedLga.toLowerCase() ||
        b.name.toLowerCase().includes(selectedLga.toLowerCase())
    );

    if (!hasLgaBranch && selectedLga) {
      list.push({
        id: `branch_${selectedLga.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${selectedLga} Zonal Branch`,
        code: `LCMS-${selectedLga.substring(0, 3).toUpperCase()}-01`,
        state: normState,
        lga: selectedLga,
        city: selectedLga,
        memberCount: 150,
        isHq: false,
      });
    }

    return list;
  };

  // Real-time Duplicate Checking on Registration (Only phone, valid email, and NIN/ID number)
  const handleFormChange = (field: string, value: any) => {
    let updated = { ...formData, [field]: value };

    // When state changes, clear LGA and Branch
    if (field === 'state') {
      updated = { ...formData, state: value, lga: '', branch: '' };
    } else if (field === 'lga') {
      updated = { ...formData, lga: value, branch: '' };
    }

    setFormData(updated);

    if (field === 'phone' || field === 'email' || field === 'idNumber') {
      const dupResult = findDuplicateMember(users, {
        phone: updated.phone,
        email: updated.email,
        idNumber: updated.idNumber,
      });

      if (dupResult) {
        setDuplicateWarning(
          `Duplicate Alert: An existing member (${dupResult.matchedMember.fullName}, ${dupResult.matchedMember.memberNo}) already possesses matching ${dupResult.matchedField}.`
        );
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  // Submit New Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.fullName.trim()) {
      setFormError('Please enter Full Name.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Please enter Phone Number.');
      return;
    }
    if (!formData.residentialAddress.trim()) {
      setFormError('Please enter Residential Address.');
      return;
    }
    if (!formData.state || !formData.lga || !formData.branch) {
      setFormError('Please complete your location selection: 1. State → 2. Local Government (LGA) → 3. Branch.');
      return;
    }
    if (!formData.nextOfKinName.trim()) {
      setFormError('Please enter Next of Kin Name.');
      return;
    }

    setIsSubmitting(true);

    const payload: Partial<User> = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      branch: formData.branch,
      dob: formData.dob,
      gender: formData.gender,
      state: formData.state,
      lga: formData.lga,
      residentialAddress: formData.residentialAddress,
      occupation: formData.occupation,
      meansOfId: formData.meansOfId,
      idNumber: formData.idNumber || 'N/A',
      nextOfKin: {
        fullName: formData.nextOfKinName,
        relationship: formData.nextOfKinRel,
        phone: formData.nextOfKinPhone || formData.phone,
        address: formData.nextOfKinAddress || formData.residentialAddress,
      },
      dateJoined: formData.dateJoined,
      introducedBy: formData.introducedBy,
      status: formData.status,
      registrationFeeStatus: formData.registrationFeeStatus,
      idCardStatus: formData.idCardStatus,
      avatar: formData.avatar,
    };

    const res = await onRegisterMember(payload);
    setIsSubmitting(false);

    if (res.success) {
      setIsRegisterModalOpen(false);
      setFormData(initialFormState);
      setDuplicateWarning(null);
      // Reset filters so newly registered member is immediately displayed
      setStatusFilter('all');
      setRegFeeFilter('all');
      setIdCardFilter('all');
      setSearch('');
    } else {
      setFormError(res.error || res.message || 'Registration failed.');
    }
  };

  // Submit Edit Member
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberForEdit) return;

    setIsSubmitting(true);
    const res = await onUpdateMember(selectedMemberForEdit.id, editFormData);
    setIsSubmitting(false);

    if (res.success) {
      setSelectedMemberForEdit(null);
    } else {
      alert(res.error || 'Failed to update member record');
    }
  };

  // Filtered Roster
  const filteredMembers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.memberNo.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.email.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || u.branch.includes(branchFilter);
    const matchesRegFee = regFeeFilter === 'all' || u.registrationFeeStatus === regFeeFilter;
    const matchesIdCard =
      idCardFilter === 'all' ||
      (idCardFilter === 'Processing'
        ? u.idCardStatus === 'Processing' || u.idCardStatus === 'Not Issued'
        : u.idCardStatus === idCardFilter);

    return matchesSearch && matchesStatus && matchesBranch && matchesRegFee && matchesIdCard;
  });

  // Calculate Key Summary Stats
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const suspendedCount = users.filter((u) => u.status === 'suspended').length;
  const unpaidFeeCount = users.filter((u) => u.registrationFeeStatus === 'Unpaid').length;
  const pendingIdCards = users.filter((u) => u.idCardStatus === 'Processing' || u.idCardStatus === 'Not Issued').length;

  // Role permissions check
  const canEditMember = ['sys_admin', 'chairman', 'vice_chairman', 'secretary', 'financial_secretary'].includes(currentRole);

  return (
    <div className="space-y-6 bg-white min-h-screen p-2 sm:p-4 text-black">
      {/* Banner / Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#014421] text-white shadow-md relative border-2 border-[#DAA520]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DAA520] text-[#014421] font-black text-xs uppercase tracking-wider mb-3 shadow-sm">
              <Users className="w-4 h-4" />
              Member Registration Module
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Membership Enrolment & Roster Engine
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 font-bold mt-1.5 max-w-2xl leading-relaxed">
              Official membership desk for LCMS PRO. Automatically generates unique Membership Numbers, prevents duplicate entries, manages identification credentials, and prepares profiles for Savings, Loans, and Dividends.
            </p>
          </div>

          <button
            onClick={() => {
              setFormData(initialFormState);
              setFormError(null);
              setDuplicateWarning(null);
              setIsRegisterModalOpen(true);
            }}
            className="px-5 py-3 rounded-xl bg-[#DAA520] hover:bg-amber-400 text-[#014421] font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            <span>Register New Member</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-1">
        <button
          onClick={() => setActiveModuleTab('roster')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeModuleTab === 'roster'
              ? 'bg-[#014421] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Member Roster Directory ({totalCount})</span>
        </button>

        <button
          onClick={() => {
            setActiveModuleTab('pending_applications');
            fetchPendingAppsCount();
          }}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeModuleTab === 'pending_applications'
              ? 'bg-teal-900 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-500" />
          <span>Pending Membership Applications</span>
          {pendingAppsCount > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {pendingAppsCount}
            </span>
          )}
        </button>
      </div>

      {activeModuleTab === 'pending_applications' ? (
        <PendingMembershipApplicationsModule
          currentRole={currentRole}
          onRefreshData={fetchPendingAppsCount}
        />
      ) : (
        <>
          {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => {
            setStatusFilter('all');
            setRegFeeFilter('all');
            setIdCardFilter('all');
          }}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            statusFilter === 'all' && regFeeFilter === 'all' && idCardFilter === 'all'
              ? 'bg-[#014421] text-white border-[#DAA520]'
              : 'bg-white border-slate-800 text-black'
          }`}
        >
          <div className="text-xs uppercase font-black tracking-wider">Total Roster</div>
          <div className="text-2xl font-black mt-1">{totalCount}</div>
          <div className="text-xs mt-1 font-bold">Enrolled Members</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('active');
            setRegFeeFilter('all');
            setIdCardFilter('all');
          }}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            statusFilter === 'active' && regFeeFilter === 'all' && idCardFilter === 'all'
              ? 'bg-[#014421] text-white border-emerald-400'
              : 'bg-white border-slate-800 text-black'
          }`}
        >
          <div className="text-xs uppercase font-black tracking-wider text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Status
          </div>
          <div className="text-2xl font-black mt-1 text-black">{activeCount}</div>
          <div className="text-xs mt-1 font-bold text-slate-800">In Good Standing</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('pending');
            setRegFeeFilter('all');
            setIdCardFilter('all');
          }}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            statusFilter === 'pending' && regFeeFilter === 'all' && idCardFilter === 'all'
              ? 'bg-amber-600 text-white border-amber-800'
              : 'bg-white border-slate-800 text-black'
          }`}
        >
          <div className="text-xs uppercase font-black tracking-wider text-amber-900 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </div>
          <div className="text-2xl font-black mt-1 text-black">{pendingCount}</div>
          <div className="text-xs mt-1 font-bold text-slate-800">Awaiting Board</div>
        </div>

        <div
          onClick={() => {
            setRegFeeFilter('Unpaid');
            setStatusFilter('all');
            setIdCardFilter('all');
          }}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            regFeeFilter === 'Unpaid'
              ? 'bg-rose-700 text-white border-rose-900'
              : 'bg-white border-slate-800 text-black'
          }`}
        >
          <div className="text-xs uppercase font-black tracking-wider text-rose-900 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Reg Fee Unpaid
          </div>
          <div className="text-2xl font-black mt-1 text-black">{unpaidFeeCount}</div>
          <div className="text-xs mt-1 font-bold text-slate-800">Fee Outstanding</div>
        </div>

        <div
          onClick={() => {
            setIdCardFilter('Processing');
            setStatusFilter('all');
            setRegFeeFilter('all');
          }}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            idCardFilter === 'Processing'
              ? 'bg-blue-800 text-white border-blue-900'
              : 'bg-white border-slate-800 text-black'
          }`}
        >
          <div className="text-xs uppercase font-black tracking-wider text-blue-900 flex items-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5" /> ID Cards Pending
          </div>
          <div className="text-2xl font-black mt-1 text-black">{pendingIdCards}</div>
          <div className="text-xs mt-1 font-bold text-slate-800">Processing</div>
        </div>

        <div
          onClick={() => {
            setStatusFilter('suspended');
            setRegFeeFilter('all');
            setIdCardFilter('all');
          }}
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
            statusFilter === 'suspended' && regFeeFilter === 'all' && idCardFilter === 'all'
              ? 'bg-slate-900 text-white border-black'
              : 'bg-white border-slate-800 text-black'
          }`}
        >
          <div className="text-xs uppercase font-black tracking-wider text-slate-800 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Suspended
          </div>
          <div className="text-2xl font-black mt-1 text-black">{suspendedCount}</div>
          <div className="text-xs mt-1 font-bold text-slate-800">Inactive</div>
        </div>
      </div>

      {/* Control Bar: Search & Multi-Filters */}
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-800" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Full Name, Member No (e.g. LC2026-0042), Phone, or Email..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:outline-none focus:border-[#014421]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700 hover:text-black"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-400 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#014421] text-white shadow-xs'
                  : 'text-black hover:bg-slate-200'
              }`}
            >
              Master Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#014421] text-white shadow-xs'
                  : 'text-black hover:bg-slate-200'
              }`}
            >
              Dossier Cards
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-300 text-xs">
          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 rounded-xl border-2 border-slate-800 bg-white font-bold text-black"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Members</option>
              <option value="pending">Pending Approvals</option>
              <option value="suspended">Suspended</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">Branch Filter</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full p-2 rounded-xl border-2 border-slate-800 bg-white font-bold text-black"
            >
              <option value="all">All Branches</option>
              {COOPERATIVE_BRANCHES.map((b) => (
                <option key={b.id} value={b.name.split(' ')[0]}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">Registration Fee</label>
            <select
              value={regFeeFilter}
              onChange={(e) => setRegFeeFilter(e.target.value)}
              className="w-full p-2 rounded-xl border-2 border-slate-800 bg-white font-bold text-black"
            >
              <option value="all">All Fee Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Waived">Waived</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-black mb-1">ID Card Status</label>
            <select
              value={idCardFilter}
              onChange={(e) => setIdCardFilter(e.target.value)}
              className="w-full p-2 rounded-xl border-2 border-slate-800 bg-white font-bold text-black"
            >
              <option value="all">All ID Statuses</option>
              <option value="Issued">Issued</option>
              <option value="Processing">Processing</option>
              <option value="Not Issued">Not Issued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Members Roster Content */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto border border-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-black text-lg">No Members Found</h3>
          <p className="text-xs text-black font-semibold max-w-sm mx-auto">
            No member matches your current search criteria or active filter combination.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setBranchFilter('all');
              setRegFeeFilter('all');
              setIdCardFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white text-xs font-black transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Master Table View */
        <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-800 text-xs font-black uppercase tracking-wider text-black">
                  <th className="p-4">Member Info</th>
                  <th className="p-4">Membership No</th>
                  <th className="p-4">Contact & Address</th>
                  <th className="p-4">Means of Identification</th>
                  <th className="p-4">Next of Kin</th>
                  <th className="p-4">Reg Fee / ID Card</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200 text-xs text-black font-bold">
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Member Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                          alt={member.fullName}
                          className="w-10 h-10 rounded-xl object-cover border-2 border-[#014421]"
                        />
                        <div>
                          <div className="font-black text-black text-sm flex items-center gap-1.5">
                            {member.fullName}
                            {member.gender && (
                              <span className="text-xs font-extrabold text-slate-700">({member.gender})</span>
                            )}
                          </div>
                          <div className="text-xs text-black font-semibold truncate max-w-[160px]">
                            {member.occupation || 'Member'}
                          </div>
                          <div className="text-xs text-[#014421] font-black">
                            Joined {member.dateJoined}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Membership Number */}
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 border-2 border-[#014421] text-[#014421] font-mono font-black text-xs">
                        {member.memberNo}
                      </span>
                      <div className="text-xs text-black font-bold mt-1 truncate max-w-[140px]">
                        {member.branch}
                      </div>
                    </td>

                    {/* Contact & Address */}
                    <td className="p-4 space-y-0.5">
                      <div className="font-extrabold text-black">{member.phone}</div>
                      <div className="text-xs text-[#014421] font-black truncate max-w-[180px]">
                        {member.state || 'Osun'} • {member.lga || 'Iwo'}
                      </div>
                      <div className="text-xs text-black font-medium truncate max-w-[180px]">
                        {member.residentialAddress || 'Address on file'}
                      </div>
                    </td>

                    {/* Identification */}
                    <td className="p-4">
                      <div className="font-extrabold text-black">
                        {member.meansOfId || 'NIN'}
                      </div>
                      <div className="font-mono text-xs font-bold text-black">{member.idNumber || 'N/A'}</div>
                      <div className="text-xs text-black font-medium truncate max-w-[130px]">
                        Intro: {member.introducedBy || 'Direct'}
                      </div>
                    </td>

                    {/* Next of Kin */}
                    <td className="p-4">
                      {member.nextOfKin ? (
                        <div>
                          <div className="font-extrabold text-black">
                            {member.nextOfKin.fullName}
                          </div>
                          <div className="text-xs text-black font-semibold">
                            {member.nextOfKin.relationship} • {member.nextOfKin.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic font-bold">Not set</span>
                      )}
                    </td>

                    {/* Reg Fee & ID Card */}
                    <td className="p-4 space-y-1">
                      <div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                            member.registrationFeeStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-800'
                              : member.registrationFeeStatus === 'Waived'
                              ? 'bg-blue-100 text-blue-950 border border-blue-800'
                              : 'bg-rose-100 text-rose-950 border border-rose-800'
                          }`}
                        >
                          Fee: {member.registrationFeeStatus || 'Unpaid'}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                            member.idCardStatus === 'Issued'
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-700'
                              : member.idCardStatus === 'Processing'
                              ? 'bg-amber-100 text-amber-950 border-amber-700'
                              : 'bg-slate-200 text-black border-slate-600'
                          }`}
                        >
                          ID: {member.idCardStatus || 'Processing'}
                        </span>
                      </div>
                    </td>

                    {/* Membership Status */}
                    <td className="p-4">
                      <MemberStatusBadge status={member.status} />
                    </td>

                    {/* Actions Menu */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Activate Member / Pay Registration Fee */}
                        {member.status === 'pending' && (
                          <button
                            onClick={() => openFeePaymentModal(member)}
                            title="Record Registration Fee & Activate Membership"
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs border border-amber-700 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Record Fee & Activate
                          </button>
                        )}

                        {/* View Profile Slip */}
                        <button
                          onClick={() => setSelectedMemberForView(member)}
                          title="View Full Dossier"
                          className="p-2 rounded-lg bg-[#014421] text-white hover:bg-emerald-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* ID Card Generator */}
                        <button
                          onClick={() => setSelectedMemberForIdCard(member)}
                          title="Print Digital ID Card"
                          className="p-2 rounded-lg bg-[#014421] text-white hover:bg-emerald-800 transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {/* Print Application Slip */}
                        <button
                          onClick={() => setSelectedMemberForSlip(member)}
                          title="Print Membership Slip"
                          className="p-2 rounded-lg bg-[#014421] text-white hover:bg-emerald-800 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Edit Member */}
                        {canEditMember && (
                          <button
                            onClick={() => {
                              setSelectedMemberForEdit(member);
                              setEditFormData({ ...member });
                            }}
                            title="Edit Member Information"
                            className="p-2 rounded-lg bg-[#014421] text-white hover:bg-emerald-800 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Member */}
                        {canEditMember && onDeleteMember && (
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to permanently delete member ${member.fullName} (${member.memberNo})?`)) {
                                const res = await onDeleteMember(member.id);
                                if (!res.success) {
                                  alert(res.message || 'Failed to delete member.');
                                }
                              }
                            }}
                            title="Delete Member Record"
                            className="p-2 rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border-2 border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4 text-black"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={member.fullName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#014421]"
                    />
                    <div>
                      <h3 className="font-black text-sm text-black leading-snug">
                        {member.fullName}
                      </h3>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-100 text-[#014421] font-mono font-black text-xs border border-emerald-800">
                        {member.memberNo}
                      </span>
                    </div>
                  </div>

                  <MemberStatusBadge status={member.status} />
                </div>

                {/* Details Grid */}
                <div className="mt-4 pt-3 border-t-2 border-slate-200 space-y-2 text-xs text-black font-bold">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-800" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#014421]" />
                    <span className="font-black text-[#014421]">{member.state || 'Osun'}, {member.lga || 'Iwo'} LGA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-800" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-800" />
                    <span className="truncate">{member.branch}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-800" />
                    <span>
                      ID: {member.meansOfId} ({member.idNumber})
                    </span>
                  </div>
                  {member.nextOfKin && (
                    <div className="flex items-center gap-2 text-xs text-slate-900 font-bold">
                      <UserCheck className="w-4 h-4 text-slate-800" />
                      <span>
                        NOK: {member.nextOfKin.fullName} ({member.nextOfKin.relationship})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t-2 border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-black ${
                      member.registrationFeeStatus === 'Paid'
                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-800'
                        : 'bg-rose-100 text-rose-950 border border-rose-800'
                    }`}
                  >
                    Reg Fee: {member.registrationFeeStatus}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {member.status === 'pending' && (
                    <button
                      onClick={() => openFeePaymentModal(member)}
                      title="Record Registration Fee & Activate Membership"
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs border border-amber-700 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pay Fee & Activate
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedMemberForView(member)}
                    className="p-2 rounded-lg bg-[#014421] text-white hover:bg-emerald-800 text-xs font-bold transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedMemberForIdCard(member)}
                    className="p-2 rounded-lg bg-[#014421] text-white hover:bg-emerald-800 text-xs font-bold transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                  {canEditMember && (
                    <button
                      onClick={() => {
                        setSelectedMemberForEdit(member);
                        setEditFormData({ ...member });
                      }}
                      className="p-2 rounded-lg bg-[#014421] text-white hover:bg-emerald-800 text-xs font-bold transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {canEditMember && onDeleteMember && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to permanently delete member ${member.fullName} (${member.memberNo})?`)) {
                          const res = await onDeleteMember(member.id);
                          if (!res.success) {
                            alert(res.message || 'Failed to delete member.');
                          }
                        }
                      }}
                      title="Delete Member Record"
                      className="p-2 rounded-lg bg-rose-700 text-white hover:bg-rose-800 text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* ==================== REGISTER MEMBER MODAL ==================== */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border-4 border-[#014421] shadow-2xl overflow-hidden my-8 text-black">
            {/* Modal Header */}
            <div className="p-6 bg-[#014421] text-white flex items-center justify-between border-b-2 border-[#DAA520]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="p-2 rounded-xl bg-emerald-900 text-white hover:bg-emerald-800 border border-emerald-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Return to Member List (Back ←)"
                  aria-label="Back button"
                >
                  <ArrowLeft className="w-5 h-5 text-[#DAA520]" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="w-10 h-10 rounded-xl bg-[#DAA520] text-[#014421] flex items-center justify-center font-black">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-white">Member Enrolment Application</h2>
                  <p className="text-xs text-emerald-100 font-bold">Lightway Cooperative Management System (LCMS PRO)</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-2 rounded-xl bg-emerald-900 text-white hover:bg-rose-900/80 hover:text-rose-200 border border-emerald-700 cursor-pointer"
                title="Close enrolment modal (✕)"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto Membership Number Highlight */}
            <div className="px-6 py-3 bg-emerald-100 border-b-2 border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-black">
                <Sparkles className="w-4 h-4 text-[#014421]" />
                Auto-Generated Membership Number:
              </div>
              <span className="font-mono font-black text-sm px-3 py-1 bg-[#014421] text-white rounded-lg shadow-xs">
                {autoGeneratedNumberPreview}
              </span>
            </div>

            {/* Duplicate Warning Alert */}
            {duplicateWarning && (
              <div className="mx-6 mt-4">
                <AlertMessage
                  type="warning"
                  title="Duplicate Record Warning"
                  message={duplicateWarning}
                  onClose={() => setDuplicateWarning(null)}
                />
              </div>
            )}

            {/* Form Error */}
            {formError && (
              <div className="mx-6 mt-4">
                <AlertMessage
                  type="error"
                  title="Registration Error"
                  message={formError}
                  onClose={() => setFormError(null)}
                />
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex border-b-2 border-slate-800 text-xs font-black px-6 pt-4 bg-slate-100 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFormTab('personal')}
                className={`pb-3 px-3 border-b-4 transition-colors whitespace-nowrap ${
                  activeFormTab === 'personal'
                    ? 'border-[#014421] text-[#014421] font-black bg-white'
                    : 'border-transparent text-slate-800'
                }`}
              >
                1. Bio & Contact
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('id_sponsor')}
                className={`pb-3 px-3 border-b-4 transition-colors whitespace-nowrap ${
                  activeFormTab === 'id_sponsor'
                    ? 'border-[#014421] text-[#014421] font-black bg-white'
                    : 'border-transparent text-slate-800'
                }`}
              >
                2. Identification & Sponsor
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('kin')}
                className={`pb-3 px-3 border-b-4 transition-colors whitespace-nowrap ${
                  activeFormTab === 'kin'
                    ? 'border-[#014421] text-[#014421] font-black bg-white'
                    : 'border-transparent text-slate-800'
                }`}
              >
                3. Next of Kin
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('fee_status')}
                className={`pb-3 px-3 border-b-4 transition-colors whitespace-nowrap ${
                  activeFormTab === 'fee_status'
                    ? 'border-[#014421] text-[#014421] font-black bg-white'
                    : 'border-transparent text-slate-800'
                }`}
              >
                4. Fees & Status
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-white">
              {activeFormTab === 'personal' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-black text-black text-xs mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chief Olumide Babatunde"
                      value={formData.fullName}
                      onChange={(e) => handleFormChange('fullName', e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-black text-xs mb-1">Phone Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="+234 803 000 0000"
                        value={formData.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-black text-xs mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="member@domain.com"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-black text-xs mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleFormChange('dob', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                      />
                    </div>

                    <div>
                      <label className="block font-black text-black text-xs mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Location & Branch Assignment Section (State -> LGA -> Branch Sequence) */}
                  <div className="space-y-3 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border-2 border-emerald-800/40">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-[#014421] dark:text-emerald-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        Cooperative Location & Branch Assignment *
                      </label>
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-200/60 dark:bg-emerald-900 px-2 py-0.5 rounded">
                        Sequence: State &rarr; LGA &rarr; Branch
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* 1. State Dropdown */}
                      <div>
                        <label className="block font-black text-slate-800 dark:text-slate-200 text-[11px] mb-1">
                          1. State *
                        </label>
                        <select
                          value={formData.state}
                          onChange={(e) => handleFormChange('state', e.target.value)}
                          className="w-full p-2.5 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421] text-xs"
                        >
                          <option value="">-- Select State --</option>
                          {APPROVED_OPERATING_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st} State
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. LGA Dropdown */}
                      <div>
                        <label className="block font-black text-slate-800 dark:text-slate-200 text-[11px] mb-1">
                          2. Local Government (LGA) *
                        </label>
                        <select
                          disabled={!formData.state}
                          value={formData.lga}
                          onChange={(e) => handleFormChange('lga', e.target.value)}
                          className={`w-full p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                            !formData.state
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 cursor-not-allowed'
                              : 'bg-white text-black border-slate-800 focus:border-[#014421]'
                          }`}
                        >
                          <option value="">
                            {!formData.state ? 'Select State First...' : '-- Select Local Government --'}
                          </option>
                          {(NIGERIAN_STATES_AND_LGAS[formData.state] || []).map((lgaName) => (
                            <option key={lgaName} value={lgaName}>
                              {lgaName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Branch Dropdown */}
                      <div>
                        <label className="block font-black text-slate-800 dark:text-slate-200 text-[11px] mb-1">
                          3. Cooperative Branch *
                        </label>
                        <select
                          disabled={!formData.state || !formData.lga}
                          value={formData.branch}
                          onChange={(e) => handleFormChange('branch', e.target.value)}
                          className={`w-full p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                            !formData.state || !formData.lga
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 cursor-not-allowed'
                              : 'bg-white text-black border-slate-800 focus:border-[#014421]'
                          }`}
                        >
                          <option value="">
                            {!formData.state || !formData.lga
                              ? 'Select State & LGA First...'
                              : '-- Select Branch --'}
                          </option>
                          {getAvailableBranches(formData.state, formData.lga).map((b) => (
                            <option key={b.id || b.name} value={b.name}>
                              {b.name} ({b.city})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-black text-xs mb-1">Residential Address *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Street name, house number, area"
                      value={formData.residentialAddress}
                      onChange={(e) => handleFormChange('residentialAddress', e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-black text-xs mb-1">Occupation / Profession</label>
                    <input
                      type="text"
                      placeholder="e.g. Civil Servant, Merchant, Lawyer"
                      value={formData.occupation}
                      onChange={(e) => handleFormChange('occupation', e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'id_sponsor' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-black text-xs mb-1">Means of Identification</label>
                      <select
                        value={formData.meansOfId}
                        onChange={(e) => handleFormChange('meansOfId', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                      >
                        <option value="NIN">National Identity Number (NIN)</option>
                        <option value="Voter's Card">Voter's Card (VIN)</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="International Passport">International Passport</option>
                        <option value="Other">Other ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-black text-black text-xs mb-1">ID Number</label>
                      <input
                        type="text"
                        placeholder="ID / NIN / License No"
                        value={formData.idNumber}
                        onChange={(e) => handleFormChange('idNumber', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-black text-xs mb-1">Introduced By (Sponsor)</label>
                    <select
                      value={formData.introducedBy}
                      onChange={(e) => handleFormChange('introducedBy', e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                    >
                      <option value="Self / Direct Application">Self / Direct Application</option>
                      {users.map((u) => (
                        <option key={u.id} value={`${u.fullName} (${u.memberNo})`}>
                          {u.fullName} — {u.memberNo} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Passport Photograph Picker with Camera & Gallery Upload */}
                  <PassportPhotoPicker
                    photoUrl={formData.avatar}
                    onPhotoChange={(url) => handleFormChange('avatar', url)}
                    required
                  />
                </div>
              )}

              {activeFormTab === 'kin' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-black text-black text-xs mb-1">Next of Kin Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name of Next of Kin"
                      value={formData.nextOfKinName}
                      onChange={(e) => handleFormChange('nextOfKinName', e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-black text-black text-xs mb-1">Relationship</label>
                      <select
                        value={formData.nextOfKinRel}
                        onChange={(e) => handleFormChange('nextOfKinRel', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Business Partner">Business Partner</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-black text-black text-xs mb-1">Next of Kin Phone</label>
                      <input
                        type="text"
                        placeholder="+234 800 000 0000"
                        value={formData.nextOfKinPhone}
                        onChange={(e) => handleFormChange('nextOfKinPhone', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-black text-xs mb-1">Next of Kin Address</label>
                    <textarea
                      rows={2}
                      placeholder="Address if different from member"
                      value={formData.nextOfKinAddress}
                      onChange={(e) => handleFormChange('nextOfKinAddress', e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold placeholder-slate-500 focus:border-[#014421]"
                    />
                  </div>
                </div>
              )}

              {activeFormTab === 'fee_status' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-black text-black text-xs mb-1">Membership Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                      >
                        <option value="active">Active (Approved)</option>
                        <option value="pending">Pending Board Review</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-black text-black text-xs mb-1">Registration Fee</label>
                      <select
                        value={formData.registrationFeeStatus}
                        onChange={(e) => handleFormChange('registrationFeeStatus', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                      >
                        <option value="Paid">Paid (NGN 10,000)</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Waived">Waived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-black text-black text-xs mb-1">ID Card Status</label>
                      <select
                        value={formData.idCardStatus}
                        onChange={(e) => handleFormChange('idCardStatus', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                      >
                        <option value="Issued">Issued</option>
                        <option value="Processing">Processing</option>
                        <option value="Not Issued">Not Issued</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-black text-xs mb-1">Date Enrolled</label>
                    <input
                      type="date"
                      value={formData.dateJoined}
                      onChange={(e) => handleFormChange('dateJoined', e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t-2 border-slate-300 flex items-center justify-between">
                {activeFormTab !== 'personal' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormTab === 'id_sponsor') setActiveFormTab('personal');
                      if (activeFormTab === 'kin') setActiveFormTab('id_sponsor');
                      if (activeFormTab === 'fee_status') setActiveFormTab('kin');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#014421] text-white font-extrabold hover:bg-emerald-800 cursor-pointer"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-[#014421] text-white font-extrabold hover:bg-emerald-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}

                {activeFormTab !== 'fee_status' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFormTab === 'personal') setActiveFormTab('id_sponsor');
                      if (activeFormTab === 'id_sponsor') setActiveFormTab('kin');
                      if (activeFormTab === 'kin') setActiveFormTab('fee_status');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#014421] text-white font-extrabold hover:bg-emerald-800 cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white font-black shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save Enrollment</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== VIEW FULL DOSSIER MODAL ==================== */}
      {selectedMemberForView && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border-4 border-[#014421] shadow-2xl overflow-hidden my-8 text-black">
            <div className="p-6 bg-[#014421] text-white flex items-center justify-between border-b-2 border-[#DAA520]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForView(null)}
                  className="p-2 rounded-xl bg-emerald-900 text-white hover:bg-emerald-800 border border-emerald-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Return to Directory (Back ←)"
                  aria-label="Back button"
                >
                  <ArrowLeft className="w-5 h-5 text-[#DAA520]" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <img
                  src={selectedMemberForView.avatar}
                  alt={selectedMemberForView.fullName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-[#DAA520]"
                />
                <div>
                  <h2 className="font-extrabold text-lg text-white">{selectedMemberForView.fullName}</h2>
                  <p className="text-xs text-[#DAA520] font-mono font-black">{selectedMemberForView.memberNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForView(null)}
                className="p-2 rounded-xl bg-emerald-900 text-white hover:bg-rose-900/80 hover:text-rose-200 border border-emerald-700 cursor-pointer"
                title="Close dossier view (✕)"
                aria-label="Close view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-black max-h-[70vh] overflow-y-auto bg-white font-bold">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-100 border-2 border-slate-800">
                <div>
                  <span className="text-xs uppercase font-black text-slate-800 block">Status</span>
                  <span className="font-black uppercase text-emerald-900">
                    {selectedMemberForView.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase font-black text-slate-800 block">Registration Fee</span>
                  <span className="font-black text-black">
                    {selectedMemberForView.registrationFeeStatus || 'Unpaid'}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase font-black text-slate-800 block">ID Card Status</span>
                  <span className="font-black text-black">
                    {selectedMemberForView.idCardStatus || 'Processing'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-sm text-[#014421] border-b-2 border-slate-800 pb-1">
                  Personal Particulars
                </h4>
                <div className="grid grid-cols-2 gap-2 text-black">
                  <div>
                    <span className="text-slate-800 font-extrabold block">Phone:</span>
                    <span className="font-black">{selectedMemberForView.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-800 font-extrabold block">Email:</span>
                    <span className="font-black">{selectedMemberForView.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-800 font-extrabold block">Date of Birth:</span>
                    <span className="font-black">{selectedMemberForView.dob || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-800 font-extrabold block">Gender:</span>
                    <span className="font-black">{selectedMemberForView.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-800 font-extrabold block">Occupation:</span>
                    <span className="font-black">{selectedMemberForView.occupation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-800 font-extrabold block">Branch:</span>
                    <span className="font-black">{selectedMemberForView.branch}</span>
                  </div>
                  <div>
                    <span className="text-slate-800 font-extrabold block">State / LGA:</span>
                    <span className="font-black text-[#014421]">
                      {selectedMemberForView.state || 'Osun'} / {selectedMemberForView.lga || 'Iwo'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-800 font-extrabold block">Residential Address:</span>
                  <span className="font-black">{selectedMemberForView.residentialAddress || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-black text-sm text-[#014421] border-b-2 border-slate-800 pb-1">
                  Identification & Sponsorship
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-800 font-extrabold block">Means of ID:</span>
                    <span className="font-black">{selectedMemberForView.meansOfId || 'NIN'}</span>
                  </div>
                  <div>
                    <span className="text-slate-800 font-extrabold block">ID Number:</span>
                    <span className="font-mono font-black">{selectedMemberForView.idNumber || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-800 font-extrabold block">Introduced By:</span>
                    <span className="font-black">{selectedMemberForView.introducedBy || 'Direct'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-black text-sm text-[#014421] border-b-2 border-slate-800 pb-1">Next of Kin</h4>
                {selectedMemberForView.nextOfKin ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-800 font-extrabold block">Full Name:</span>
                      <span className="font-black">{selectedMemberForView.nextOfKin.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-800 font-extrabold block">Relationship:</span>
                      <span className="font-black">{selectedMemberForView.nextOfKin.relationship}</span>
                    </div>
                    <div>
                      <span className="text-slate-800 font-extrabold block">Phone:</span>
                      <span className="font-black">{selectedMemberForView.nextOfKin.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-800 font-extrabold block">Address:</span>
                      <span className="font-black">{selectedMemberForView.nextOfKin.address}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 font-bold italic">No next of kin recorded</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t-2 border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedMemberForSlip(selectedMemberForView);
                  setSelectedMemberForView(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#014421] text-white font-black text-xs flex items-center gap-1.5 hover:bg-emerald-800"
              >
                <Printer className="w-4 h-4 text-[#DAA520]" /> Print Application Slip
              </button>
              <button
                onClick={() => setSelectedMemberForView(null)}
                className="px-4 py-2 rounded-xl bg-[#014421] text-white font-black text-xs hover:bg-emerald-800"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DIGITAL ID CARD PREVIEW MODAL ==================== */}
      {selectedMemberForIdCard && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 text-center border-4 border-[#014421] shadow-2xl text-black">
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <h3 className="font-black text-sm text-[#014421] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Cooperative Digital ID Card
              </h3>
              <button
                onClick={() => setSelectedMemberForIdCard(null)}
                className="p-1.5 rounded-lg bg-[#014421] text-white hover:bg-emerald-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Graphic ID Card Front */}
            <div className="w-full aspect-[1.58/1] rounded-xl bg-[#014421] text-white p-5 shadow-xl relative overflow-hidden text-left flex flex-col justify-between border-2 border-[#DAA520]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-emerald-700 pb-2">
                <CoopLogo size="sm" showText variant="gold" />
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#DAA520] text-[#014421] rounded">MEMBER ID</span>
              </div>

              {/* Body */}
              <div className="flex items-center gap-3 my-2">
                <img
                  src={selectedMemberForIdCard.avatar}
                  alt="Member Photo"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[#DAA520] shrink-0"
                />
                <div className="space-y-0.5 overflow-hidden">
                  <div className="text-xs font-black truncate text-white">{selectedMemberForIdCard.fullName}</div>
                  <div className="text-[10px] font-mono text-[#DAA520] font-black">{selectedMemberForIdCard.memberNo}</div>
                  <div className="text-[9px] text-emerald-100 font-bold truncate">{selectedMemberForIdCard.branch}</div>
                  <div className="text-[8px] text-white font-bold">Issue Date: {selectedMemberForIdCard.dateJoined}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-emerald-700 text-[8px] text-emerald-100 font-mono">
                <span>NIN: {selectedMemberForIdCard.idNumber || 'VERIFIED'}</span>
                <span className="font-bold text-[#DAA520]">LCMS SEC-VERIFIED</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#DAA520]" /> Print ID Card
              </button>
              <button
                onClick={() => setSelectedMemberForIdCard(null)}
                className="px-4 py-2.5 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== APPLICATION SLIP MODAL ==================== */}
      {selectedMemberForSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 space-y-6 text-black shadow-2xl border-4 border-[#014421] my-8">
            <div className="flex items-center justify-between border-b-2 border-[#014421] pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForSlip(null)}
                  className="p-1.5 rounded-lg bg-[#014421] text-white hover:bg-emerald-800 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Return to Member Details (Back ←)"
                  aria-label="Back button"
                >
                  <ArrowLeft className="w-4 h-4 text-[#DAA520]" />
                  <span>Back</span>
                </button>
                <CoopLogo size="lg" showText variant="dark" />
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForSlip(null)}
                className="p-1 rounded bg-[#014421] text-white hover:bg-rose-700 cursor-pointer"
                title="Close slip view (✕)"
                aria-label="Close slip view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-black">
              <div className="flex items-start justify-between bg-slate-100 p-4 rounded-xl border-2 border-slate-800">
                <div>
                  <span className="text-xs text-black font-black uppercase block">Membership Number</span>
                  <span className="font-mono font-black text-base text-[#014421]">
                    {selectedMemberForSlip.memberNo}
                  </span>
                </div>
                <img
                  src={selectedMemberForSlip.avatar}
                  alt="Photo"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[#014421]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 border-b-2 border-slate-800 pb-3">
                <div>
                  <span className="text-[#014421] font-black block">Full Name:</span>
                  <span className="font-extrabold text-sm">{selectedMemberForSlip.fullName}</span>
                </div>
                <div>
                  <span className="text-[#014421] font-black block">Phone Number:</span>
                  <span>{selectedMemberForSlip.phone}</span>
                </div>
                <div>
                  <span className="text-[#014421] font-black block">Date of Birth:</span>
                  <span>{selectedMemberForSlip.dob || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#014421] font-black block">Means of ID:</span>
                  <span>
                    {selectedMemberForSlip.meansOfId} ({selectedMemberForSlip.idNumber})
                  </span>
                </div>
                <div>
                  <span className="text-[#014421] font-black block">Branch:</span>
                  <span>{selectedMemberForSlip.branch}</span>
                </div>
                <div>
                  <span className="text-[#014421] font-black block">Date Enrolled:</span>
                  <span>{selectedMemberForSlip.dateJoined}</span>
                </div>
              </div>

              {selectedMemberForSlip.nextOfKin && (
                <div className="border-b-2 border-slate-800 pb-3 space-y-1">
                  <span className="text-[#014421] font-black block">Next of Kin Details:</span>
                  <p>
                    {selectedMemberForSlip.nextOfKin.fullName} ({selectedMemberForSlip.nextOfKin.relationship}) —{' '}
                    {selectedMemberForSlip.nextOfKin.phone}
                  </p>
                </div>
              )}

              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs font-black">
                <div className="border-t-2 border-black pt-1">Member's Signature</div>
                <div className="border-t-2 border-black pt-1">General Secretary Stamp & Sign</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#DAA520]" /> Print Slip
              </button>
              <button
                onClick={() => setSelectedMemberForSlip(null)}
                className="px-4 py-2 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white text-xs font-black cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT MEMBER MODAL ==================== */}
      {selectedMemberForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border-4 border-[#014421] shadow-2xl overflow-hidden my-8 text-black">
            <div className="p-6 bg-[#014421] text-white flex items-center justify-between border-b-2 border-[#DAA520]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForEdit(null)}
                  className="p-1.5 rounded-xl bg-emerald-900 text-white hover:bg-emerald-800 border border-emerald-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Return to list (Back ←)"
                  aria-label="Back button"
                >
                  <ArrowLeft className="w-4 h-4 text-[#DAA520]" />
                  <span>Back</span>
                </button>
                <Edit3 className="w-5 h-5 text-[#DAA520]" />
                <h2 className="font-extrabold text-base text-white">Edit Member Information</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForEdit(null)}
                className="p-2 bg-emerald-900 text-white hover:bg-rose-900/80 hover:text-rose-200 rounded-xl cursor-pointer"
                title="Close edit modal (✕)"
                aria-label="Close edit modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs max-h-[65vh] overflow-y-auto bg-white font-bold">
              <div>
                <label className="block font-black text-black text-xs mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.fullName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-black text-xs mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                  />
                </div>
                <div>
                  <label className="block font-black text-black text-xs mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-black text-xs mb-1">Status</label>
                  <select
                    value={editFormData.status || 'active'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as MembershipStatus })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-black text-xs mb-1">Registration Fee</label>
                  <select
                    value={editFormData.registrationFeeStatus || 'Paid'}
                    onChange={(e) => setEditFormData({ ...editFormData, registrationFeeStatus: e.target.value as RegistrationFeeStatus })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Waived">Waived</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-black text-xs mb-1">ID Card Status</label>
                  <select
                    value={editFormData.idCardStatus || 'Issued'}
                    onChange={(e) => setEditFormData({ ...editFormData, idCardStatus: e.target.value as IdCardStatus })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                  >
                    <option value="Issued">Issued</option>
                    <option value="Processing">Processing</option>
                    <option value="Not Issued">Not Issued</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-black text-xs mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={editFormData.residentialAddress || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, residentialAddress: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421]"
                />
              </div>

              {/* State, LGA, and Branch Edit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-black text-xs mb-1">State</label>
                  <select
                    value={editFormData.state || ''}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setEditFormData({ ...editFormData, state: newState, lga: '', branch: '' });
                    }}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-800 bg-white text-black font-bold focus:border-[#014421] text-xs"
                  >
                    <option value="">-- Select State --</option>
                    {APPROVED_OPERATING_STATES.map((s) => (
                      <option key={s} value={s}>{s} State</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-black text-xs mb-1">LGA</label>
                  <select
                    disabled={!editFormData.state}
                    value={editFormData.lga || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, lga: e.target.value, branch: '' })}
                    className={`w-full p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      !editFormData.state
                        ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                        : 'bg-white text-black border-slate-800 focus:border-[#014421]'
                    }`}
                  >
                    <option value="">{!editFormData.state ? 'Select State First...' : '-- Select LGA --'}</option>
                    {(NIGERIAN_STATES_AND_LGAS[editFormData.state || ''] || []).map((lgaName) => (
                      <option key={lgaName} value={lgaName}>{lgaName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-black text-xs mb-1">Branch</label>
                  <select
                    disabled={!editFormData.state || !editFormData.lga}
                    value={editFormData.branch || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      !editFormData.state || !editFormData.lga
                        ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed'
                        : 'bg-white text-black border-slate-800 focus:border-[#014421]'
                    }`}
                  >
                    <option value="">{!editFormData.state || !editFormData.lga ? 'Select State & LGA First...' : '-- Select Branch --'}</option>
                    {getAvailableBranches(editFormData.state || '', editFormData.lga || '').map((b) => (
                      <option key={b.id || b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Passport Photo Upload in Edit */}
              <div>
                <PassportPhotoPicker
                  photoUrl={editFormData.avatar || ''}
                  onPhotoChange={(url) => setEditFormData({ ...editFormData, avatar: url })}
                />
              </div>

              <div className="pt-4 border-t-2 border-slate-300 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForEdit(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#014421] text-white font-extrabold hover:bg-emerald-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white font-black cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== REGISTRATION FEE PAYMENT & ACTIVATION MODAL ==================== */}
      {selectedMemberForFeePayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border-4 border-[#014421] shadow-2xl overflow-hidden my-8 text-black">
            {/* Header */}
            <div className="p-6 bg-[#014421] text-white flex items-center justify-between border-b-2 border-[#DAA520]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForFeePayment(null)}
                  className="p-2 rounded-xl bg-emerald-900 text-white hover:bg-emerald-800 border border-emerald-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Return to Member List (Back ←)"
                  aria-label="Back button"
                >
                  <ArrowLeft className="w-5 h-5 text-[#DAA520]" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="w-10 h-10 rounded-xl bg-[#DAA520] text-[#014421] flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg text-white">Record Registration Fee & Activate</h2>
                  <p className="text-xs text-emerald-100 font-bold">Financial Secretary Membership Activation Portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForFeePayment(null)}
                className="p-2 rounded-xl bg-emerald-900 text-white hover:bg-rose-900/80 hover:text-rose-200 border border-emerald-700 cursor-pointer"
                title="Close payment modal (✕)"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Card Summary */}
            <div className="p-4 bg-amber-50 border-b-2 border-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedMemberForFeePayment.avatar}
                  alt={selectedMemberForFeePayment.fullName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-[#014421]"
                />
                <div>
                  <h3 className="font-black text-sm text-black">{selectedMemberForFeePayment.fullName}</h3>
                  <div className="text-xs font-mono font-bold text-slate-700">{selectedMemberForFeePayment.memberNo} • {selectedMemberForFeePayment.branch}</div>
                </div>
              </div>
              <MemberStatusBadge status={selectedMemberForFeePayment.status} />
            </div>

            {feeSuccessNotice && (
              <div className="p-4">
                <AlertMessage type="success" message={feeSuccessNotice} />
              </div>
            )}

            {feeErrorNotice && (
              <div className="p-4">
                <AlertMessage type="error" message={feeErrorNotice} />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleConfirmFeePayment} className="p-6 space-y-4 text-xs font-bold text-black">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 leading-snug">
                ℹ️ <strong>Workflow Rule:</strong> Confirming this payment will record the official receipt in member history and automatically transition member status from <strong>Pending</strong> to <strong>ACTIVE</strong>.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-black text-xs mb-1">Registration Fee Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    value={feePaymentForm.amountPaid}
                    onChange={(e) => setFeePaymentForm({ ...feePaymentForm, amountPaid: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white font-black text-base text-[#014421]"
                  />
                </div>

                <div>
                  <label className="block font-black text-black text-xs mb-1">Date Paid *</label>
                  <input
                    type="date"
                    required
                    value={feePaymentForm.datePaid}
                    onChange={(e) => setFeePaymentForm({ ...feePaymentForm, datePaid: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-black text-xs mb-1">Receipt / Teller Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="REC-2026-0001"
                    value={feePaymentForm.receiptNumber}
                    onChange={(e) => setFeePaymentForm({ ...feePaymentForm, receiptNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block font-black text-black text-xs mb-1">Payment Method *</label>
                  <select
                    value={feePaymentForm.paymentMethod}
                    onChange={(e) => setFeePaymentForm({ ...feePaymentForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white font-bold"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="POS">POS</option>
                    <option value="Direct Payroll Deduction">Direct Payroll Deduction</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Mobile Transfer">Mobile Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-black text-xs mb-1">Received By (Officer Name) *</label>
                <input
                  type="text"
                  required
                  value={feePaymentForm.receivedBy}
                  onChange={(e) => setFeePaymentForm({ ...feePaymentForm, receivedBy: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-black text-black text-xs mb-1">Notes / Voucher Reference (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks or bank transaction reference..."
                  value={feePaymentForm.notes}
                  onChange={(e) => setFeePaymentForm({ ...feePaymentForm, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white font-bold"
                />
              </div>

              <div className="pt-3 border-t-2 border-slate-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMemberForFeePayment(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-black font-extrabold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white font-black flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing Payment...' : 'Confirm Payment & Activate Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
