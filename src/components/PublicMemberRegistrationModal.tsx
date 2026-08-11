import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  X,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Building2,
  ShieldAlert,
  Sparkles,
  Info,
  BadgeCheck,
  Lock,
} from 'lucide-react';
import { PassportPhotoPicker } from './PassportPhotoPicker';
import { COOPERATIVE_BRANCHES } from '../data/mockData';
import { APPROVED_OPERATING_STATES, NIGERIAN_STATES_AND_LGAS } from '../data/nigeriaStatesLgas';
import { MeansOfId } from '../types';
import { apiUrl } from '../utils/apiClient';

interface PublicMemberRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSubmitted?: () => void;
}

export const PublicMemberRegistrationModal: React.FC<PublicMemberRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccessSubmitted,
}) => {
  const [isOnlineRegEnabled, setIsOnlineRegEnabled] = useState<boolean>(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);

  // Form State
  const initialForm = {
    fullName: '',
    phone: '',
    email: '',
    dob: '1992-06-15',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    residentialAddress: '',
    occupation: '',
    state: '',
    lga: '',
    branch: '',
    passportPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    meansOfId: 'NIN' as MeansOfId,
    idNumber: '',
    sponsorName: '',
    sponsorMemberId: '',
    // Payment Transfer Fields
    paymentAmount: '10000',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    paymentReceiptPhoto: '',
  };

  const [form, setForm] = useState(initialForm);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);

  const handleStateChange = (newState: string) => {
    setForm((prev) => ({
      ...prev,
      state: newState,
      lga: '',
      branch: '',
    }));
  };

  const handleLgaChange = (newLga: string) => {
    setForm((prev) => ({
      ...prev,
      lga: newLga,
      branch: '',
    }));
  };

  const availableLgas = form.state ? NIGERIAN_STATES_AND_LGAS[form.state] || [] : [];

  const availableBranches = (() => {
    if (!form.state || !form.lga) return [];
    const normState = form.state.replace(/ State$/i, '').trim();

    const stateBranches = COOPERATIVE_BRANCHES.filter((b) => {
      const bState = b.state.replace(/ State$/i, '').trim();
      return bState.toLowerCase() === normState.toLowerCase();
    });

    const list = [...stateBranches];
    const hasLgaBranch = list.some(
      (b) =>
        b.lga?.toLowerCase() === form.lga.toLowerCase() ||
        b.city.toLowerCase() === form.lga.toLowerCase() ||
        b.name.toLowerCase().includes(form.lga.toLowerCase())
    );

    if (!hasLgaBranch && form.lga) {
      list.push({
        id: `branch_${form.lga.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${form.lga} Zonal Branch`,
        code: `LCMS-${form.lga.substring(0, 3).toUpperCase()}-01`,
        state: normState,
        lga: form.lga,
        city: form.lga,
        memberCount: 150,
        isHq: false,
      });
    }

    return list;
  })();

  useEffect(() => {
    if (isOpen) {
      setIsLoadingSettings(true);
      fetch(apiUrl('/api/self-registration/applications'))
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setIsOnlineRegEnabled(Boolean(data.enableOnlineRegistration));
          }
        })
        .catch(() => {
          setIsOnlineRegEnabled(false);
        })
        .finally(() => setIsLoadingSettings(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.residentialAddress.trim() ||
      !form.occupation.trim() ||
      !form.sponsorName.trim()
    ) {
      setErrorMsg('Please complete all required personal details (*): Full Name, Phone, Address, Occupation, and Sponsor Name.');
      return;
    }

    if (!form.state || !form.lga || !form.branch) {
      setErrorMsg('Please complete your location selection in sequence: 1. State → 2. Local Government (LGA) → 3. Branch.');
      return;
    }

    const amountNum = Number(form.paymentAmount);
    if (isNaN(amountNum) || amountNum < 2500) {
      setErrorMsg('Minimum Registration Fee payment required is ₦2,500.');
      return;
    }

    if (!form.paymentReference.trim()) {
      setErrorMsg('Please enter your Bank Transfer Transaction Reference / Session ID after transferring payment.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/self-registration/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          paymentAmount: amountNum,
          paymentReference: form.paymentReference.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit membership application.');
      }

      setSubmittedApp(data.application);
      if (onSuccessSubmitted) onSuccessSubmitted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/20 border border-teal-400/30 rounded-xl backdrop-blur-sm">
              <UserPlus className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                LCMS PRO Prospective Member Self-Registration
              </h2>
              <p className="text-xs text-teal-200/90 mt-1">
                Official Lightway Cooperative Online Membership Enrollment Portal (v1.0)
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">

          {/* Loading Settings State */}
          {isLoadingSettings && (
            <div className="py-12 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm font-medium">Checking cooperative online registration availability...</p>
            </div>
          )}

          {/* When Online Registration is DISABLED in Settings */}
          {!isLoadingSettings && !isOnlineRegEnabled && (
            <div className="py-8 px-6 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800/60 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Online Member Registration is Currently Disabled
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
                Cooperative management has disabled self-registration applications. Please visit any official Lightway Cooperative branch office or contact the Financial Secretary to apply in person.
              </p>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 text-left space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-teal-600" /> Administrative Note:
                </div>
                <p>Executives & Admins can enable this feature in <strong className="text-slate-700 dark:text-slate-200">Cooperative Settings &rarr; Enable Online Member Registration</strong>.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-md"
                >
                  Close Portal & Return to Login
                </button>
              </div>
            </div>
          )}

          {/* Submitted Application Receipt Modal View */}
          {!isLoadingSettings && isOnlineRegEnabled && submittedApp && (
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800 shadow-inner animate-bounce">
                <BadgeCheck className="w-10 h-10" />
              </div>

              <div>
                <span className="bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider border border-amber-300 dark:border-amber-800">
                  ⏳ Status: Awaiting Payment Verification
                </span>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                  Application Submitted Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Your temporary registration application has been logged into the LCMS PRO portal.
                </p>
              </div>

              {/* Reference Card */}
              <div className="bg-teal-50/90 dark:bg-teal-950/40 p-5 rounded-2xl border border-teal-200 dark:border-teal-800/80 max-w-lg mx-auto text-left space-y-3">
                <div className="flex justify-between items-center border-b border-teal-200 dark:border-teal-800 pb-2">
                  <span className="text-xs text-teal-900 dark:text-teal-200 font-bold">Temporary Application Number:</span>
                  <span className="font-mono font-extrabold text-teal-900 dark:text-teal-200 text-sm bg-white dark:bg-teal-900/90 px-3 py-1 rounded-lg border border-teal-300 dark:border-teal-700 shadow-xs">
                    {submittedApp.applicationNo}
                  </span>
                </div>

                <div className="text-xs text-slate-800 dark:text-slate-200 space-y-1.5 pt-1">
                  <p><strong>Applicant Name:</strong> {submittedApp.fullName}</p>
                  <p><strong>Phone Number:</strong> {submittedApp.phone}</p>
                  <p><strong>Sponsor / Introducer:</strong> {submittedApp.sponsorName} ({submittedApp.sponsorMemberId})</p>
                  <p><strong>Branch:</strong> {submittedApp.branch}</p>
                  <div className="pt-2 border-t border-teal-200 dark:border-teal-800/80 mt-2 space-y-1">
                    <p className="text-teal-900 dark:text-teal-200 font-bold flex justify-between">
                      <span>Amount Transferred:</span>
                      <span className="font-mono text-sm">₦{Number(submittedApp.paymentAmount || 10000).toLocaleString()}</span>
                    </p>
                    <p className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Bank Reference / TRX ID:</span>
                      <span className="font-mono">{submittedApp.paymentReference}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Cooperative Bank Account Summary Card */}
              <div className="bg-slate-900 text-white p-4 rounded-xl max-w-lg mx-auto text-left border border-slate-800 text-xs space-y-1.5">
                <div className="text-teal-400 font-bold uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Lightway Cooperative Official Bank Account</span>
                  <span className="text-emerald-400 font-semibold">Verified Bank</span>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Bank Name:</span>
                  <strong className="text-white">First Bank of Nigeria</strong>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Account Number:</span>
                  <strong className="text-amber-300 font-mono text-sm tracking-wider">2039485712</strong>
                </div>
                <div className="flex justify-between text-slate-200">
                  <span>Account Name:</span>
                  <strong className="text-white">Lightway Credit & Multipurpose Coop. Soc.</strong>
                </div>
              </div>

              {/* Next Steps Workflow Card */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 max-w-lg mx-auto text-left space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Automatic Cooperative Workflow Steps:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300">
                  <li><strong>Treasurer Verification:</strong> The Treasurer receives your payment notification and verifies the transfer against bank records.</li>
                  <li><strong>Financial Secretary Approval:</strong> The Financial Secretary verifies your sponsor (<strong className="text-slate-900 dark:text-white">{submittedApp.sponsorName}</strong>) and approves your application.</li>
                  <li><strong>Automatic Member Creation & Fee Split:</strong> Upon approval, your permanent Member ID will be generated, <strong>₦2,500</strong> Registration Fee deducted, and the remaining <strong>₦{(Number(submittedApp.paymentAmount || 10000) - 2500).toLocaleString()}</strong> credited to your First Savings Account!</li>
                </ol>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setSubmittedApp(null);
                    setForm(initialForm);
                    onClose();
                  }}
                  className="px-8 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-lg shadow-teal-700/20 transition-all text-sm"
                >
                  Done / Close
                </button>
              </div>
            </div>
          )}

          {/* Public Application Form */}
          {!isLoadingSettings && isOnlineRegEnabled && !submittedApp && (
            <form onSubmit={handleSubmit} className="space-y-6">

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Header Info Pill */}
              <div className="bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-200 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Fill out your personal details accurately. Applications are reviewed and verified by the Financial Secretary before activation.</span>
              </div>

              {/* Photo Upload & Passport Section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center gap-4">
                <div className="shrink-0">
                  <PassportPhotoPicker
                    photoUrl={form.passportPhoto}
                    onPhotoChange={(url) => setForm({ ...form, passportPhoto: url })}
                  />
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 text-center md:text-left">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Passport Photograph *</h4>
                  <p>Upload a clear, front-facing passport photograph (JPEG/PNG/Data URL).</p>
                  <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Used for your official LCMS PRO Member Profile & Digital ID Card.</p>
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4" /> Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adewale Opeyemi Sandra"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 08034567812"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        placeholder="e.g. opeyemi.adewale@gmail.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Gender & DOB */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Residential Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Residential Address *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 14 Unity Close, Off Stadium Road, Iwo, Osun State"
                        value={form.residentialAddress}
                        onChange={(e) => setForm({ ...form, residentialAddress: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Occupation */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Occupation / Business *
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Secondary School Teacher / Businessman"
                        value={form.occupation}
                        onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Location & Branch Assignment Section (State -> LGA -> Branch Sequence) */}
                  <div className="md:col-span-2 space-y-3 bg-teal-50/60 dark:bg-teal-950/30 p-4 rounded-xl border border-teal-200 dark:border-teal-800/80">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Cooperative Location & Branch Assignment *
                      </label>
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider bg-white dark:bg-teal-900/80 px-2.5 py-0.5 rounded-md border border-teal-300 dark:border-teal-700">
                        Selection Sequence: State &rarr; LGA &rarr; Branch
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 1. State Dropdown */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          1. State *
                        </label>
                        <select
                          required
                          value={form.state}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
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
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          2. Local Government Area (LGA) *
                        </label>
                        <select
                          required
                          disabled={!form.state}
                          value={form.lga}
                          onChange={(e) => handleLgaChange(e.target.value)}
                          className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                            !form.state
                              ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500'
                          }`}
                        >
                          <option value="">
                            {!form.state ? 'Select State First...' : '-- Select Local Government --'}
                          </option>
                          {availableLgas.map((lgaName) => (
                            <option key={lgaName} value={lgaName}>
                              {lgaName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 3. Branch Dropdown */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          3. Cooperative Branch *
                        </label>
                        <select
                          required
                          disabled={!form.state || !form.lga}
                          value={form.branch}
                          onChange={(e) => setForm({ ...form, branch: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                            !form.state || !form.lga
                              ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-teal-500'
                          }`}
                        >
                          <option value="">
                            {!form.state || !form.lga
                              ? 'Select State & LGA First...'
                              : '-- Select Branch --'}
                          </option>
                          {availableBranches.map((b) => (
                            <option key={b.id || b.name} value={b.name}>
                              {b.name} ({b.city})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identification Details (Optional) */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 border-b border-slate-200 dark:border-slate-800 pb-1">
                  Means of Identification (Optional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Identification Type
                    </label>
                    <select
                      value={form.meansOfId}
                      onChange={(e) => setForm({ ...form, meansOfId: e.target.value as MeansOfId })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="NIN">National Identity Number (NIN)</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="International Passport">International Passport</option>
                      <option value="Voter's Card">Voter's Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ID Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 78493021958"
                      value={form.idNumber}
                      onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Sponsor Verification Details (Required) */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-600" /> Sponsor / Introducer Information (Mandatory *)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Every prospective member must be introduced by an existing active cooperative member. The Financial Secretary will verify this sponsor before approving your application.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sponsor's Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chief Olusegun Adebayo"
                      value={form.sponsorName}
                      onChange={(e) => setForm({ ...form, sponsorName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Sponsor's Member ID / Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LCMS-MEM-002 or 08021234567"
                      value={form.sponsorMemberId}
                      onChange={(e) => setForm({ ...form, sponsorMemberId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Official Cooperative Registration Bank Transfer Section */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                    <Building2 className="w-4 h-4 text-emerald-600" /> Official Cooperative Bank Account Payment (Mandatory *)
                  </div>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase">
                    Step 2 of 2
                  </span>
                </div>

                {/* Bank Account Details Banner */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 shadow-md">
                  <div className="text-teal-400 font-bold text-[11px] uppercase tracking-wider flex justify-between">
                    <span>Pay into Official Lightway Account</span>
                    <span className="text-emerald-400">First Bank of Nigeria</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-200 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">ACCOUNT NUMBER</span>
                      <span className="text-amber-300 font-mono font-bold text-base tracking-wider">2039485712</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ACCOUNT NAME</span>
                      <span className="font-semibold text-white">Lightway Cooperative Society</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 leading-relaxed">
                  💡 <strong>Fee Allocation Policy:</strong> Minimum Registration Fee is <strong>₦2,500</strong>. Any amount paid above ₦2,500 (e.g., ₦10,000 transfer) will automatically be credited as your <strong>First Savings Deposit</strong> upon approval!
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Amount Transferred */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Amount Transferred (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      min="2500"
                      step="500"
                      placeholder="e.g. 10000"
                      value={form.paymentAmount}
                      onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      ₦2,500 Reg Fee + ₦{(Math.max(0, Number(form.paymentAmount || 10000) - 2500)).toLocaleString()} Savings
                    </span>
                  </div>

                  {/* Payment Reference / Session ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Transaction Reference / Session ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FBN/TRX/9834102 or Bank Session ID"
                      value={form.paymentReference}
                      onChange={(e) => setForm({ ...form, paymentReference: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Found on your mobile bank transfer debit receipt
                    </span>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Transfer Date
                    </label>
                    <input
                      type="date"
                      value={form.paymentDate}
                      onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Channel
                    </label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Bank Transfer">Mobile Bank Transfer</option>
                      <option value="USSD Transfer">USSD Transfer (*894# / *901#)</option>
                      <option value="Bank Deposit">Branch Bank Deposit Slip</option>
                      <option value="POS Machine">POS Agent Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-lg shadow-teal-700/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Submit Membership Application</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
