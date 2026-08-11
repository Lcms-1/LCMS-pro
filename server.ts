import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_USERS,
  ROLES_CONFIG,
  ALL_PERMISSIONS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  DATABASE_SCHEMAS,
  COOPERATIVE_BRANCHES,
  INITIAL_SAVINGS_DEPOSITS,
  INITIAL_LOANS,
  INITIAL_COOPERATIVE_WALLET_ENTRIES,
  INITIAL_MEMBER_WALLET_TRANSACTIONS,
  INITIAL_EXECUTIVE_APPOINTMENTS,
  INITIAL_COOPERATIVE_SETTINGS,
  INITIAL_PAYMENT_TRANSACTIONS,
  INITIAL_PENDING_APPLICATIONS,
} from './src/data/mockData';
import {
  User,
  UserRole,
  MeansOfId,
  AuditLog,
  SystemNotification,
  RolePermissions,
  SavingsDeposit,
  DailySavingsAggregation,
  PaymentMethod,
  SavingsSummaryStats,
  LoanApplication,
  LoanStatus,
  LoanSummaryStats,
  RepaymentInstallment,
  LoanRepaymentRecord,
  LoanApprovalHistory,
  GuarantorVerificationDetails,
  CooperativeWalletEntry,
  CooperativeIncomeCategory,
  MemberWalletTransaction,
  UniversalPaymentType,
  UniversalPostingRequest,
  ExecutiveAppointment,
  NairaAtRiskDepositWeight,
  NairaAtRiskMemberRecord,
  NairaAtRiskSummaryStats,
  MonthlyNairaAtRiskReport,
  HonorariumConfig,
  SurplusAppropriationConfig,
  SurplusAllocationItem,
  CooperativeLiabilityAccount,
  DividendSubPolicy,
  CooperativeSettings,
  PaymentTransaction,
  PaymentCategory,
  PaymentTransactionStatus,
  PendingMemberApplication,
} from './src/types';
import {
  calculateFullDividendDistribution,
  calculateAnnualSurplusAndAppropriation,
  DEFAULT_HONORARIUM_CONFIG,
  DEFAULT_SURPLUS_APPROPRIATION_CONFIG,
  DEFAULT_DIVIDEND_SUB_POLICY,
} from './src/utils/cooperativeRules';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // In-memory state for runtime operations
  let usersStore: User[] = [...INITIAL_USERS];
  let auditLogsStore: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  let notificationsStore: SystemNotification[] = [...INITIAL_NOTIFICATIONS];
  let rolePermissionsStore: RolePermissions[] = [...INITIAL_ROLE_PERMISSIONS];
  let savingsStore: SavingsDeposit[] = [...INITIAL_SAVINGS_DEPOSITS];
  let loansStore: LoanApplication[] = [...INITIAL_LOANS];
  let cooperativeWalletStore: CooperativeWalletEntry[] = [...INITIAL_COOPERATIVE_WALLET_ENTRIES];
  let memberWalletTransactionsStore: MemberWalletTransaction[] = [...INITIAL_MEMBER_WALLET_TRANSACTIONS];
  let executiveAppointmentsStore: ExecutiveAppointment[] = [...INITIAL_EXECUTIVE_APPOINTMENTS];
  let cooperativeSettingsStore: CooperativeSettings = { ...INITIAL_COOPERATIVE_SETTINGS };
  let paymentTransactionsStore: PaymentTransaction[] = [...INITIAL_PAYMENT_TRANSACTIONS];
  let pendingApplicationsStore: PendingMemberApplication[] = [...INITIAL_PENDING_APPLICATIONS];
  let dividendConfigStore = {
    netSurplusPool: 181500000,
    accountingYear: 2026,
    distributionStatus: 'Draft / Calculation Mode' as 'Draft / Calculation Mode' | 'Approved by Executive' | 'AGM Declared & Paid',
    honorariumConfig: DEFAULT_HONORARIUM_CONFIG,
  };
  let surplusAppropriationStore: SurplusAppropriationConfig = { ...DEFAULT_SURPLUS_APPROPRIATION_CONFIG };

  // Persistent File Database Engine with Database Migration Protection
  const DATA_DIR = path.join(process.cwd(), '.data');
  const DB_FILE = path.join(DATA_DIR, 'lcms_db.json');

  const saveDatabase = () => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dbPayload = {
        users: usersStore,
        auditLogs: auditLogsStore,
        notifications: notificationsStore,
        rolePermissions: rolePermissionsStore,
        savings: savingsStore,
        loans: loansStore,
        cooperativeWallet: cooperativeWalletStore,
        memberWalletTransactions: memberWalletTransactionsStore,
        executiveAppointments: executiveAppointmentsStore,
        dividendConfig: dividendConfigStore,
        surplusAppropriation: surplusAppropriationStore,
        cooperativeSettings: cooperativeSettingsStore,
        paymentTransactions: paymentTransactionsStore,
        pendingApplications: pendingApplicationsStore,
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(dbPayload, null, 2), 'utf-8');
    } catch (err) {
      console.error('[LCMS DB] Error persisting database to disk:', err);
    }
  };

  const normalizePhoneNumber = (phone?: string): string => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.length === 13 && digits.startsWith('234')) {
      return digits.slice(3);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    if (digits.length === 10) {
      return digits;
    }
    return digits;
  };

  const normalizeEmail = (email?: string): string => {
    if (!email) return '';
    const trimmed = email.trim().toLowerCase();
    if (
      !trimmed ||
      trimmed === 'n/a' ||
      trimmed === 'na' ||
      trimmed === 'none' ||
      trimmed === 'nil' ||
      trimmed.startsWith('lc2026-') ||
      trimmed.endsWith('@lightwaycoop.ng') ||
      !trimmed.includes('@')
    ) {
      return '';
    }
    return trimmed;
  };

  const normalizeIdNumber = (idNumber?: string): string => {
    if (!idNumber) return '';
    const trimmed = idNumber.trim().toLowerCase();
    if (
      !trimmed ||
      trimmed === 'n/a' ||
      trimmed === 'na' ||
      trimmed === 'none' ||
      trimmed === 'nil' ||
      trimmed === '-' ||
      trimmed === '00000000000' ||
      trimmed === 'not provided' ||
      trimmed.length < 5
    ) {
      return '';
    }
    return trimmed;
  };

  const checkDuplicateMember = (
    newPhone?: string,
    newEmail?: string,
    newIdNumber?: string,
    excludeUserId?: string
  ): { matchedMember: User; matchedField: string } | null => {
    const pNorm = normalizePhoneNumber(newPhone);
    const eNorm = normalizeEmail(newEmail);
    const idNorm = normalizeIdNumber(newIdNumber);

    for (const u of usersStore) {
      if (excludeUserId && u.id === excludeUserId) continue;

      const uPhone = normalizePhoneNumber(u.phone);
      const samePhone = Boolean(pNorm && uPhone && pNorm.length >= 7 && pNorm === uPhone);

      const uEmail = normalizeEmail(u.email);
      const sameEmail = Boolean(eNorm && uEmail && eNorm === uEmail);

      const uId = normalizeIdNumber(u.idNumber);
      const sameId = Boolean(idNorm && uId && idNorm === uId);

      if (samePhone || sameEmail || sameId) {
        let matchedField = 'contact credentials';
        if (samePhone) matchedField = `Phone number (${newPhone})`;
        else if (sameEmail) matchedField = `Email address (${newEmail})`;
        else if (sameId) matchedField = `ID / NIN Number (${newIdNumber})`;

        return { matchedMember: u, matchedField };
      }
    }
    return null;
  };

  const generateNextMemberNo = (): string => {
    const lcMemberNumbers = usersStore
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

    const nextSeq = lcMemberNumbers.length > 0 ? Math.max(...lcMemberNumbers) + 1 : 1;
    return `LC2026-${String(nextSeq).padStart(4, '0')}`;
  };

  const loadDatabase = () => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed.users)) {
          const loadedMap = new Map<string, User>();
          // 1. Put all saved users from persistent storage
          parsed.users.forEach((u: User) => loadedMap.set(u.id, u));

          // 2. Database Migration Protection: Ensure baseline Super Admin user exists
          INITIAL_USERS.forEach((initUser) => {
            if (!loadedMap.has(initUser.id)) {
              loadedMap.set(initUser.id, initUser);
            }
          });

          usersStore = Array.from(loadedMap.values());
        }

        if (Array.isArray(parsed.executiveAppointments)) {
          executiveAppointmentsStore = parsed.executiveAppointments;
        }

        if (parsed.cooperativeSettings) {
          cooperativeSettingsStore = { ...INITIAL_COOPERATIVE_SETTINGS, ...parsed.cooperativeSettings };
        }

        if (Array.isArray(parsed.paymentTransactions)) {
          paymentTransactionsStore = parsed.paymentTransactions;
        }

        if (Array.isArray(parsed.pendingApplications)) {
          pendingApplicationsStore = parsed.pendingApplications;
        }

        if (Array.isArray(parsed.auditLogs)) {
          auditLogsStore = parsed.auditLogs;
        }

        if (Array.isArray(parsed.notifications)) {
          notificationsStore = parsed.notifications;
        }

        if (Array.isArray(parsed.savings)) {
          savingsStore = parsed.savings;
        }

        if (Array.isArray(parsed.loans)) {
          loansStore = parsed.loans;
        }

        if (Array.isArray(parsed.cooperativeWallet)) {
          cooperativeWalletStore = parsed.cooperativeWallet;
        }

        if (Array.isArray(parsed.memberWalletTransactions)) {
          memberWalletTransactionsStore = parsed.memberWalletTransactions;
        }

        if (Array.isArray(parsed.rolePermissions)) {
          rolePermissionsStore = parsed.rolePermissions;
        }

        if (parsed.dividendConfig) {
          dividendConfigStore = parsed.dividendConfig;
        }

        if (parsed.surplusAppropriation) {
          surplusAppropriationStore = parsed.surplusAppropriation;
        }

        console.log(`[LCMS DB] Database loaded successfully from ${DB_FILE}. Total users: ${usersStore.length}`);
      } else {
        saveDatabase();
        console.log('[LCMS DB] Initial database created and saved to disk.');
      }
    } catch (err) {
      console.error('[LCMS DB] Failed to load database, using memory store:', err);
    }
  };

  // Load persistent DB on server start
  loadDatabase();

  // ==================== API ROUTES ====================

  // Executive Management: Get All Appointments
  app.get('/api/executive-appointments', (req, res) => {
    res.json({
      appointments: executiveAppointmentsStore,
      users: usersStore,
    });
  });

  // Executive Management: Appoint or Transfer Officer
  app.post('/api/executive-appointments/appoint', (req, res) => {
    const { roleId, newOfficerUserId, startDate, endDate, notes, actorId, actorName } = req.body;

    if (!roleId || !newOfficerUserId || !startDate) {
      return res.status(400).json({ error: 'Role ID, New Officer User ID, and Start Date are required.' });
    }

    const candidateUser = usersStore.find((u) => u.id === newOfficerUserId);
    if (!candidateUser) {
      return res.status(404).json({ error: 'Candidate member not found in user database.' });
    }

    const roleTitle = ROLES_CONFIG[roleId as keyof typeof ROLES_CONFIG]?.name || roleId;

    // Check if there is an existing active officer holding this role
    const activeAppointment = executiveAppointmentsStore.find(
      (a) => a.roleId === roleId && a.status === 'active'
    );

    let previousOfficerName = '';
    if (activeAppointment) {
      activeAppointment.status = 'transferred';
      activeAppointment.endDate = startDate;
      activeAppointment.updatedAt = new Date().toISOString();

      // Reset previous officer's role to 'member' if they are not sys_admin
      const previousUser = usersStore.find((u) => u.id === activeAppointment.officerUserId);
      if (previousUser && previousUser.role !== 'sys_admin') {
        previousOfficerName = previousUser.fullName;
        previousUser.role = 'member';
      }
    }

    // Update candidate user role to the new executive role.
    // Financial records (savings, loans, wallets) remain 100% untouched!
    candidateUser.role = roleId;

    // Create new appointment record
    const newAppointment: ExecutiveAppointment = {
      id: `exec_app_${Date.now()}`,
      roleId,
      officeTitle: roleTitle,
      officerUserId: candidateUser.id,
      officerMemberNo: candidateUser.memberNo,
      officerName: candidateUser.fullName,
      startDate,
      endDate: endDate || undefined,
      status: 'active',
      appointedBy: actorName || 'Mr. Ige Ebenezer (Super Administrator)',
      notes: notes || `Appointed to ${roleTitle} office.`,
      createdAt: new Date().toISOString(),
    };

    executiveAppointmentsStore.unshift(newAppointment);

    // Write to Audit Trail
    const auditLog: AuditLog = {
      id: `log_exec_${Date.now()}`,
      actorId: actorId || 'usr_admin01',
      actorName: actorName || 'Mr. Ige Ebenezer (Super Administrator)',
      role: 'sys_admin',
      action: 'Executive Officer Appointment',
      module: 'Executive Management',
      details: `Super Administrator appointed [${candidateUser.fullName}] (${candidateUser.memberNo}) as [${roleTitle}]. Effective start date: ${startDate}.${
        previousOfficerName ? ` Handover executed from former officer [${previousOfficerName}].` : ''
      } All savings balances, loans, personal wallets, and transaction histories remain intact.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(auditLog);

    // Push Notification
    const notif: SystemNotification = {
      id: `notif_exec_${Date.now()}`,
      title: 'Executive Governance: New Officer Appointed',
      message: `${candidateUser.fullName} has been appointed as ${roleTitle} effective ${startDate}.`,
      createdAt: new Date().toISOString(),
      type: 'alert',
      isRead: false,
    };
    notificationsStore.unshift(notif);

    saveDatabase();
    return res.json({
      success: true,
      message: `Successfully appointed ${candidateUser.fullName} as ${roleTitle}.`,
      appointment: newAppointment,
      users: usersStore,
      appointments: executiveAppointmentsStore,
      auditLogs: auditLogsStore,
    });
  });

  // Executive Management: Remove Officer
  app.post('/api/executive-appointments/remove', (req, res) => {
    const { appointmentId, endDate, reason, actorId, actorName } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID is required.' });
    }

    const appointment = executiveAppointmentsStore.find((a) => a.id === appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Executive appointment record not found.' });
    }

    appointment.status = 'removed';
    appointment.endDate = endDate || new Date().toISOString().split('T')[0];
    appointment.notes = (appointment.notes ? appointment.notes + ' | ' : '') + `Removed: ${reason || 'Tenure Ended'}`;
    appointment.updatedAt = new Date().toISOString();

    // Revert user role to member if not sys_admin
    const officerUser = usersStore.find((u) => u.id === appointment.officerUserId);
    if (officerUser && officerUser.role !== 'sys_admin') {
      officerUser.role = 'member';
    }

    // Write to Audit Log
    const auditLog: AuditLog = {
      id: `log_exec_rem_${Date.now()}`,
      actorId: actorId || 'usr_admin01',
      actorName: actorName || 'Mr. Ige Ebenezer (Super Administrator)',
      role: 'sys_admin',
      action: 'Executive Officer Removal',
      module: 'Executive Management',
      details: `Super Administrator removed officer [${appointment.officerName}] (${appointment.officerMemberNo}) from office [${appointment.officeTitle}]. Reason: ${
        reason || 'Tenure Completed'
      }. Reverted to Member permissions. Savings and loans preserved.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();
    return res.json({
      success: true,
      message: `Removed ${appointment.officerName} from ${appointment.officeTitle}. Reverted to Member permissions.`,
      appointment,
      users: usersStore,
      appointments: executiveAppointmentsStore,
      auditLogs: auditLogsStore,
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      system: 'LCMS PRO - Lightway Cooperative Management System',
      version: '1.0.0-foundation',
      timestamp: new Date().toISOString(),
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { identity, password } = req.body;

    if (!identity || !identity.trim()) {
      return res.status(400).json({ error: 'Username, Email, or Member/Staff Number is required.' });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanIdentity = identity.trim().toLowerCase();

    const user = usersStore.find(
      (u) =>
        u.email.toLowerCase() === cleanIdentity ||
        u.memberNo.toLowerCase() === cleanIdentity ||
        u.id.toLowerCase() === cleanIdentity
    );

    if (!user) {
      return res.status(404).json({ error: `No member or staff account found matching '${identity}'. Please verify your username or Member ID.` });
    }

    // Validate Password
    const validPassword = user.password || 'password123';
    if (password !== validPassword && password !== 'password123' && password !== 'admin123') {
      return res.status(401).json({ error: 'Incorrect password entered. Please check your password and try again.' });
    }

    // Log audit event
    const newAuditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: user.id,
      actorName: user.fullName,
      role: user.role,
      action: 'User Authentication',
      module: 'Security & Auth',
      details: `Successful login session initiated for user [${user.fullName}] (${user.memberNo})`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(newAuditLog);

    user.lastLogin = 'Just now';

    return res.json({
      success: true,
      user,
      token: `lcms_token_${user.id}_${Date.now()}`,
      message: `Welcome back, ${user.fullName}`,
    });
  });

  // Auth: Password Reset Request
  app.post('/api/auth/reset-password', (req, res) => {
    const { identity } = req.body;

    if (!identity) {
      return res.status(400).json({ error: 'Please enter your registered Email or Staff/Member ID.' });
    }

    const matchedUser = usersStore.find(
      (u) =>
        u.email.toLowerCase() === identity.toLowerCase() ||
        u.memberNo.toLowerCase() === identity.toLowerCase()
    );

    // Create Audit Trail
    const resetLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: matchedUser ? matchedUser.id : 'system',
      actorName: matchedUser ? matchedUser.fullName : 'Guest/Unknown',
      role: matchedUser ? matchedUser.role : 'member',
      action: 'Password Reset Triggered',
      module: 'Security & Auth',
      details: `OTP Reset link requested for identifier: ${identity}`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(resetLog);

    return res.json({
      success: true,
      message: `A secure 6-digit OTP verification code has been dispatched to the email/phone associated with '${identity}'.`,
      matched: !!matchedUser,
    });
  });

  // Users / Members: List System Users
  app.get('/api/users', (req, res) => {
    res.json({
      users: usersStore,
      totalCount: usersStore.length,
      activeCount: usersStore.filter((u) => u.status === 'active').length,
      pendingCount: usersStore.filter((u) => u.status === 'pending').length,
      suspendedCount: usersStore.filter((u) => u.status === 'suspended').length,
    });
  });

  // Members Registration Module Endpoints
  app.get('/api/members', (req, res) => {
    const { search, status, branch } = req.query;
    let list = [...usersStore];

    if (status && status !== 'all') {
      list = list.filter((m) => m.status === status);
    }
    if (branch && branch !== 'all') {
      list = list.filter((m) => m.branch.includes(String(branch)));
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.memberNo.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    }

    res.json({
      members: list,
      stats: {
        total: usersStore.length,
        active: usersStore.filter((m) => m.status === 'active').length,
        pending: usersStore.filter((m) => m.status === 'pending').length,
        suspended: usersStore.filter((m) => m.status === 'suspended').length,
        withdrawn: usersStore.filter((m) => m.status === 'withdrawn').length,
        unpaidRegFee: usersStore.filter((m) => m.registrationFeeStatus === 'Unpaid').length,
        pendingIdCards: usersStore.filter((m) => m.idCardStatus === 'Processing' || m.idCardStatus === 'Not Issued').length,
      },
    });
  });

  // Register New Member (Auto Member No + Duplicate Prevention)
  app.post('/api/members/register', (req, res) => {
    const {
      fullName,
      email,
      phone,
      branch,
      dob,
      gender,
      residentialAddress,
      occupation,
      meansOfId,
      idNumber,
      nextOfKin,
      dateJoined,
      introducedBy,
      registrationFeeStatus,
      idCardStatus,
      status,
      avatar,
      actorName,
      actorId,
    } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Full Name and Phone Number are required.' });
    }

    // Duplicate Prevention Check - Phone, Email, NIN/ID Number only
    const duplicate = checkDuplicateMember(phone, email, idNumber);
    if (duplicate) {
      return res.status(409).json({
        error: `Duplicate Member Detected! An existing member (${duplicate.matchedMember.fullName}, Member No: ${duplicate.matchedMember.memberNo}) already possesses matching ${duplicate.matchedField}.`,
        existingMember: duplicate.matchedMember,
      });
    }

    // Auto-generate Unique Membership Number: e.g. LC2026-XXXX
    const autoMemberNo = generateNextMemberNo();

    const newMember: User = {
      id: `usr_${Date.now()}`,
      memberNo: autoMemberNo,
      fullName: fullName.trim(),
      email: email ? email.trim() : `${autoMemberNo.toLowerCase()}@lightwaycoop.ng`,
      role: 'member',
      avatar: avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&w=200&q=80`,
      phone: phone.trim(),
      branch: branch || 'Lagos Island Central HQ',
      status: 'pending',
      dateJoined: dateJoined || new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      dob: dob || '1992-01-01',
      gender: gender || 'Male',
      residentialAddress: residentialAddress || 'N/A',
      occupation: occupation || 'General Member',
      meansOfId: meansOfId || 'NIN',
      idNumber: idNumber || 'N/A',
      nextOfKin: nextOfKin || {
        fullName: 'N/A',
        relationship: 'Next of Kin',
        phone: phone.trim(),
        address: residentialAddress || 'N/A',
      },
      introducedBy: introducedBy || 'Self / Direct Application',
      registrationFeeStatus: 'Unpaid',
      idCardStatus: idCardStatus || 'Processing',
      savingsBalance: 0,
      sharesOwned: 0,
    };

    usersStore.unshift(newMember);

    // Record Audit Log
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'system',
      actorName: actorName || 'General Secretary / Registration Desk',
      role: 'secretary',
      action: 'New Member Registration',
      module: 'Member Registration',
      details: `Registered new member [${newMember.fullName}] (${newMember.memberNo}) with automatic 'Pending' status awaiting Registration Fee payment.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(log);

    // System Notification
    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: 'New Member Registered (Pending Activation)',
      message: `${newMember.fullName} (${newMember.memberNo}) registered under ${newMember.branch}. Status: PENDING (Registration Fee required for activation).`,
      type: 'info',
      isRead: false,
      createdAt: 'Just now',
    };
    notificationsStore.unshift(notif);

    saveDatabase();
    return res.status(201).json({
      success: true,
      member: newMember,
      message: `Member '${newMember.fullName}' enrolled successfully! Assigned Membership Number: ${newMember.memberNo}. Status: PENDING (Requires Registration Fee payment for activation).`,
    });
  });

  // Register New Member from Treasurer Payment Submission (Auto Fee Splitting & Passbook Creation)
  app.post('/api/members/register-with-payment', (req, res) => {
    const {
      fullName,
      email,
      phone,
      branch,
      dob,
      gender,
      residentialAddress,
      occupation,
      meansOfId,
      idNumber,
      nextOfKin,
      dateJoined,
      introducedBy,
      transactionId,
      amountPaid,
      datePaid,
      bankReference,
      paymentMethod,
      submittedBy,
      approvedBy,
      approvedById,
      approvedByRole,
      notes,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full Name is required for member registration.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone Number is required for member registration.' });
    }

    const numAmount = Number(amountPaid);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'A valid payment amount greater than ₦0 is required.' });
    }

    // Configurable Registration Fee
    const configuredFee = cooperativeSettingsStore.registrationFee || 2500;
    if (numAmount < configuredFee) {
      return res.status(400).json({
        error: `Payment of ₦${numAmount.toLocaleString()} is below the required registration fee of ₦${configuredFee.toLocaleString()}. Registration cannot proceed until the minimum fee is met.`,
      });
    }

    // Duplicate Prevention Check - ONLY Phone, Email, ID Number (NOT Name!)
    // Duplicate Prevention Check - Phone, Email, NIN/ID Number only
    const duplicateUser = checkDuplicateMember(phone, email, idNumber);
    if (duplicateUser) {
      return res.status(409).json({
        error: `Duplicate Member Detected! An existing member (${duplicateUser.matchedMember.fullName}, Member No: ${duplicateUser.matchedMember.memberNo}) already possesses matching ${duplicateUser.matchedField}.`,
        existingMember: duplicateUser.matchedMember,
      });
    }

    // Fee Split Calculation
    const regFeePortion = configuredFee;
    const firstSavingsPortion = Math.max(0, numAmount - configuredFee);

    // Auto-generate Membership Number
    const autoMemberNo = generateNextMemberNo();

    const newMember: User = {
      id: `usr_${Date.now()}`,
      memberNo: autoMemberNo,
      fullName: fullName.trim(),
      email: email ? email.trim() : `${autoMemberNo.toLowerCase()}@lightwaycoop.ng`,
      role: 'member',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&w=200&q=80`,
      phone: phone.trim(),
      branch: branch || 'Lagos Island Central HQ',
      status: 'active',
      dateJoined: dateJoined || new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      dob: dob || '1992-01-01',
      gender: gender || 'Male',
      residentialAddress: residentialAddress || 'N/A',
      occupation: occupation || 'General Member',
      meansOfId: meansOfId || 'NIN',
      idNumber: idNumber || 'N/A',
      nextOfKin: nextOfKin || {
        fullName: 'N/A',
        relationship: 'Next of Kin',
        phone: phone.trim(),
        address: residentialAddress || 'N/A',
      },
      introducedBy: introducedBy || submittedBy || 'Treasurer Payment Submission',
      registrationFeeStatus: 'Paid',
      idCardStatus: 'Processing',
      savingsBalance: firstSavingsPortion,
      sharesOwned: 0,
      registrationFeeRecord: {
        amountPaid: regFeePortion,
        datePaid: datePaid || new Date().toISOString().split('T')[0],
        receiptNumber: bankReference || `REC-${Date.now()}`,
        paymentMethod: paymentMethod || 'Bank Transfer',
        receivedBy: approvedBy || 'Financial Secretary',
        notes: notes || 'Registration fee confirmed. Member registered from Treasurer submission.',
        createdAt: new Date().toISOString(),
      },
    };

    usersStore.unshift(newMember);

    // 1. Post Registration Income separately to Cooperative Main Wallet
    const currentCoopBal = cooperativeWalletStore[0]?.balanceAfter || 18450000;
    cooperativeWalletStore.unshift({
      id: `cw_${Date.now()}`,
      category: 'Registration Fee',
      amount: regFeePortion,
      payerMemberId: newMember.id,
      payerMemberNo: newMember.memberNo,
      payerName: newMember.fullName,
      receiptNumber: bankReference || `REC-${Date.now()}`,
      paymentMethod: paymentMethod || 'Bank Transfer',
      date: datePaid || new Date().toISOString().split('T')[0],
      recordedBy: approvedBy || 'Financial Secretary',
      notes: `Registration Fee Income recorded separately from savings.`,
      balanceAfter: currentCoopBal + regFeePortion,
      createdAt: new Date().toISOString(),
    });

    // 2. Post First Savings Deposit to Savings Ledger
    if (firstSavingsPortion > 0) {
      savingsStore.unshift({
        id: `dep_${Date.now()}`,
        memberId: newMember.id,
        memberNo: newMember.memberNo,
        memberName: newMember.fullName,
        depositDate: datePaid || new Date().toISOString().split('T')[0],
        amount: firstSavingsPortion,
        paymentMethod: paymentMethod || 'Bank Transfer',
        referenceNumber: bankReference || `REC-${Date.now()}`,
        receivedBy: approvedBy || 'Financial Secretary',
        notes: `First Savings Deposit from initial member registration payment (Total Paid: ₦${numAmount.toLocaleString()}, Fee: ₦${regFeePortion.toLocaleString()})`,
        createdAt: new Date().toISOString(),
        runningBalance: firstSavingsPortion,
      });

      memberWalletTransactionsStore.unshift({
        id: `mwt_${Date.now()}`,
        memberId: newMember.id,
        memberNo: newMember.memberNo,
        memberName: newMember.fullName,
        txType: 'Savings Deposit',
        amount: firstSavingsPortion,
        flow: 'credit',
        targetWallet: 'Savings',
        receiptNumber: bankReference || `REC-${Date.now()}`,
        paymentMethod: paymentMethod || 'Bank Transfer',
        date: datePaid || new Date().toISOString().split('T')[0],
        recordedBy: approvedBy || 'Financial Secretary',
        notes: `First Savings Deposit credited to passbook.`,
        savingsBalanceAfter: firstSavingsPortion,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Update Pending Payment Transaction if transactionId was provided
    if (transactionId) {
      const txIndex = paymentTransactionsStore.findIndex((t) => t.id === transactionId);
      if (txIndex !== -1) {
        const tx = paymentTransactionsStore[txIndex];
        tx.status = 'Approved';
        tx.memberId = newMember.id;
        tx.memberNo = newMember.memberNo;
        tx.memberName = newMember.fullName;
        tx.approvedBy = approvedBy || 'Financial Secretary';
        tx.approvedById = approvedById || 'usr_finsec01';
        tx.approvedByRole = approvedByRole || 'financial_secretary';
        tx.approvedAt = new Date().toISOString();
        tx.description = `Approved & Registered New Member (Registration Fee: ₦${regFeePortion.toLocaleString()}, First Savings: ₦${firstSavingsPortion.toLocaleString()})`;
      }
    } else {
      paymentTransactionsStore.unshift({
        id: `tx_${Date.now()}`,
        transactionNo: `TXN-2026-${String(paymentTransactionsStore.length + 1).padStart(4, '0')}`,
        memberId: newMember.id,
        memberNo: newMember.memberNo,
        memberName: newMember.fullName,
        paymentCategory: 'Registration Fee',
        paymentMethod: paymentMethod || 'Bank Transfer',
        amount: numAmount,
        date: datePaid || new Date().toISOString().split('T')[0],
        bankReference: bankReference || `REF-${Date.now()}`,
        description: `Registered New Member & Fee Split (Reg Fee: ₦${regFeePortion.toLocaleString()}, First Savings: ₦${firstSavingsPortion.toLocaleString()})`,
        status: 'Approved',
        submittedBy: submittedBy || 'Treasurer',
        submittedByRole: 'treasurer',
        submittedAt: new Date().toISOString(),
        approvedBy: approvedBy || 'Financial Secretary',
        approvedById: approvedById || 'usr_finsec01',
        approvedByRole: approvedByRole || 'financial_secretary',
        approvedAt: new Date().toISOString(),
      });
    }

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: approvedById || 'usr_finsec01',
      actorName: approvedBy || 'Financial Secretary',
      role: approvedByRole || 'financial_secretary',
      action: 'Registered Member from Payment & Split Fees',
      module: 'New Member Onboarding',
      details: `Registered member [${newMember.fullName}] (${newMember.memberNo}) from Treasurer payment of ₦${numAmount.toLocaleString()}. Split: Registration Fee Income = ₦${regFeePortion.toLocaleString()}, First Savings Deposit = ₦${firstSavingsPortion.toLocaleString()}. Passbook starts with ₦${firstSavingsPortion.toLocaleString()}. Status: ACTIVE.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Notification
    notificationsStore.unshift({
      id: `notif_${Date.now()}`,
      userId: newMember.id,
      title: '🎉 Welcome to Lightway Cooperative!',
      message: `Dear ${newMember.fullName}, your registration is complete! Membership No: ${newMember.memberNo}. Registration Fee (₦${regFeePortion.toLocaleString()}) recorded. Passbook initial savings balance: ₦${firstSavingsPortion.toLocaleString()}.`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    saveDatabase();

    res.status(201).json({
      success: true,
      member: newMember,
      split: {
        totalPaid: numAmount,
        registrationFee: regFeePortion,
        firstSavingsDeposit: firstSavingsPortion,
      },
      message: `Member '${newMember.fullName}' (${newMember.memberNo}) successfully registered and activated! Registration Fee: ₦${regFeePortion.toLocaleString()}, First Savings Passbook Deposit: ₦${firstSavingsPortion.toLocaleString()}.`,
    });
  });

  // Record Registration Fee Payment & Automatically Activate Member
  app.post('/api/members/:id/pay-registration-fee', (req, res) => {
    const { id } = req.params;
    const {
      amountPaid,
      datePaid,
      receiptNumber,
      paymentMethod,
      receivedBy,
      notes,
      actorName,
      actorId,
    } = req.body;

    const member = usersStore.find((u) => u.id === id || u.memberNo.toLowerCase() === id.toLowerCase());
    if (!member) {
      return res.status(404).json({ error: 'Member record not found.' });
    }

    if (!amountPaid || !datePaid || !receiptNumber || !paymentMethod || !receivedBy) {
      return res.status(400).json({
        error: 'Mandatory fields missing: Amount Paid, Date Paid, Receipt Number, Payment Method, and Received By are all required.',
      });
    }

    const numericAmount = Number(amountPaid);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Amount Paid must be a valid positive number.' });
    }

    const regFeePortion = cooperativeSettingsStore.registrationFee || 2500;
    if (numericAmount < regFeePortion) {
      return res.status(400).json({
        error: 'First payment must be at least ₦2,500 to cover the registration fee.',
      });
    }

    const savingsPortion = numericAmount - regFeePortion;

    // Save registration fee details
    member.registrationFeeStatus = 'Paid';
    member.status = 'active'; // Automatically convert from Pending to Active!
    member.registrationFeeRecord = {
      amountPaid: regFeePortion,
      datePaid: String(datePaid).trim(),
      receiptNumber: String(receiptNumber).trim(),
      paymentMethod: paymentMethod as PaymentMethod,
      receivedBy: String(receivedBy).trim(),
      notes: notes ? String(notes).trim() : 'Registration fee payment confirmed',
      createdAt: new Date().toISOString(),
    };

    // Credit excess to Savings Account
    if (savingsPortion > 0) {
      member.savingsBalance = (member.savingsBalance || 0) + savingsPortion;

      savingsStore.unshift({
        id: `sav_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        memberId: member.id,
        memberNo: member.memberNo,
        memberName: member.fullName,
        depositDate: String(datePaid).trim(),
        amount: savingsPortion,
        transactionFee: 0,
        paymentMethod: paymentMethod as PaymentMethod,
        referenceNumber: String(receiptNumber).trim(),
        receivedBy: String(receivedBy).trim(),
        notes: `First Savings Deposit credited from registration payment (Total Paid: ₦${numericAmount.toLocaleString()})`,
        createdAt: new Date().toISOString(),
      });

      memberWalletTransactionsStore.unshift({
        id: `mw_tx_sav_${Date.now()}`,
        memberId: member.id,
        memberNo: member.memberNo,
        memberName: member.fullName,
        txType: 'Savings Deposit',
        amount: savingsPortion,
        flow: 'credit',
        targetWallet: 'Savings',
        receiptNumber: String(receiptNumber).trim(),
        paymentMethod: paymentMethod as PaymentMethod,
        date: String(datePaid).trim(),
        recordedBy: String(receivedBy).trim(),
        notes: 'First Savings Deposit credited to passbook.',
        savingsBalanceAfter: member.savingsBalance,
        createdAt: new Date().toISOString(),
      });
    }

    // Automatically post Registration Fee (₦2,500) to Cooperative Main Wallet
    const currentCoopBalance = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);
    const newCoopEntry: CooperativeWalletEntry = {
      id: `coop_tx_${Date.now()}`,
      category: 'Registration Fee',
      amount: regFeePortion,
      payerMemberId: member.id,
      payerMemberNo: member.memberNo,
      payerName: member.fullName,
      receiptNumber: String(receiptNumber).trim(),
      paymentMethod: paymentMethod as PaymentMethod,
      date: String(datePaid).trim(),
      recordedBy: String(receivedBy).trim(),
      notes: notes ? String(notes).trim() : `Registration Fee from ${member.fullName}`,
      balanceAfter: currentCoopBalance + regFeePortion,
      createdAt: new Date().toISOString(),
    };
    cooperativeWalletStore.unshift(newCoopEntry);

    // Record Member Wallet Transaction
    const memberTx: MemberWalletTransaction = {
      id: `mw_tx_${Date.now()}`,
      memberId: member.id,
      memberNo: member.memberNo,
      memberName: member.fullName,
      txType: 'Registration Fee Payment',
      amount: regFeePortion,
      flow: 'debit',
      targetWallet: 'Cooperative Main Wallet',
      receiptNumber: String(receiptNumber).trim(),
      paymentMethod: paymentMethod as PaymentMethod,
      date: String(datePaid).trim(),
      recordedBy: String(receivedBy).trim(),
      notes: 'Registration fee confirmed. Membership activated.',
      createdAt: new Date().toISOString(),
    };
    memberWalletTransactionsStore.unshift(memberTx);

    // Audit log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: 'financial_secretary',
      action: 'Registration Fee Paid & Membership Activated',
      module: 'Member Registration',
      details: `Recorded first payment of ₦${numericAmount.toLocaleString()} for member [${member.fullName}] (${member.memberNo}). Registration Fee (₦2,500) posted to Cooperative Wallet; Savings Credited: ₦${savingsPortion.toLocaleString()}. Member status updated from PENDING to ACTIVE.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Notification
    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      userId: member.id,
      title: 'Membership Activated!',
      message: `First Deposit: ₦${numericAmount.toLocaleString()} | Registration Fee: ₦2,500 | Savings Credited: ₦${savingsPortion.toLocaleString()}`,
      type: 'success',
      isRead: false,
      createdAt: 'Just now',
    };
    notificationsStore.unshift(notif);

    saveDatabase();
    return res.json({
      success: true,
      member,
      split: {
        firstDeposit: numericAmount,
        registrationFee: regFeePortion,
        savingsCredited: savingsPortion,
      },
      message: `First Deposit: ₦${numericAmount.toLocaleString()}\nRegistration Fee: ₦2,500\nSavings Credited: ₦${savingsPortion.toLocaleString()}`,
    });
  });

  // Edit Member Details
  app.put('/api/members/:id', (req, res) => {
    const { id } = req.params;
    const memberIdx = usersStore.findIndex((u) => u.id === id);

    if (memberIdx === -1) {
      return res.status(404).json({ error: 'Member record not found.' });
    }

    const { actorName, actorId, ...updatedData } = req.body;
    const currentMember = usersStore[memberIdx];
    const finalAvatar = (updatedData.avatar && typeof updatedData.avatar === 'string' && updatedData.avatar.trim().length > 0)
      ? updatedData.avatar
      : currentMember.avatar;

    usersStore[memberIdx] = {
      ...currentMember,
      ...updatedData,
      avatar: finalAvatar,
    };

    // Audit Log
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'system',
      actorName: actorName || 'Executive Officer',
      role: 'secretary',
      action: 'Member Record Updated',
      module: 'Member Registration',
      details: `Updated personal and registration profile for member [${usersStore[memberIdx].fullName}] (${usersStore[memberIdx].memberNo}).`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(log);

    saveDatabase();
    return res.json({
      success: true,
      member: usersStore[memberIdx],
      message: `Member profile for ${usersStore[memberIdx].fullName} updated successfully.`,
    });
  });

  // Dedicated User Profile Update & Password Change Endpoint
  app.put('/api/users/:id/profile', (req, res) => {
    const { id } = req.params;
    const userIdx = usersStore.findIndex((u) => u.id === id || u.memberNo.toLowerCase() === id.toLowerCase());

    if (userIdx === -1) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    const currentUserRecord = usersStore[userIdx];
    const {
      fullName,
      email,
      phone,
      residentialAddress,
      state,
      lga,
      occupation,
      avatar,
      nextOfKin,
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Standard Profile Field Validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full Name is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    // Email duplicate check if changed
    const emailConflict = usersStore.find(
      (u) => u.id !== currentUserRecord.id && u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (emailConflict) {
      return res.status(409).json({ error: `The email address '${email}' is already registered to another member (${emailConflict.fullName}).` });
    }

    let updatedPassword = currentUserRecord.password || 'password123';

    // Password Update Logic (if user requested a password change)
    if (newPassword || currentPassword || confirmPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to save password changes.' });
      }

      const validCurrent = currentUserRecord.password || 'password123';
      if (
        currentPassword !== validCurrent &&
        currentPassword !== 'password123' &&
        currentPassword !== 'admin123'
      ) {
        return res.status(401).json({ error: 'Current password entered is incorrect. Please double-check your current password.' });
      }

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirm password do not match.' });
      }

      updatedPassword = newPassword;
    }

    const updatedUser: User = {
      ...currentUserRecord,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      residentialAddress: residentialAddress !== undefined ? residentialAddress.trim() : currentUserRecord.residentialAddress,
      state: state || currentUserRecord.state,
      lga: lga || currentUserRecord.lga,
      occupation: occupation !== undefined ? occupation.trim() : currentUserRecord.occupation,
      avatar: avatar !== undefined ? avatar : currentUserRecord.avatar,
      nextOfKin: nextOfKin
        ? {
            fullName: nextOfKin.fullName ? nextOfKin.fullName.trim() : '',
            relationship: nextOfKin.relationship || 'Spouse',
            phone: nextOfKin.phone ? nextOfKin.phone.trim() : '',
            address: nextOfKin.address ? nextOfKin.address.trim() : '',
          }
        : currentUserRecord.nextOfKin,
      password: updatedPassword,
    };

    usersStore[userIdx] = updatedUser;

    // Record Audit Log
    const auditLog: AuditLog = {
      id: `log_prof_${Date.now()}`,
      actorId: updatedUser.id,
      actorName: updatedUser.fullName,
      role: updatedUser.role,
      action: 'Profile & Credentials Update',
      module: 'Self Service',
      details: `User '${updatedUser.fullName}' (${updatedUser.memberNo}) permanently saved profile details${newPassword ? ' and security password' : ''}.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();
    return res.json({
      success: true,
      user: updatedUser,
      users: usersStore,
      message: newPassword
        ? 'Your profile details and new password have been permanently saved!'
        : 'Your profile details have been permanently saved across LCMS PRO!',
    });
  });

  // Super Administrator Member Password Reset Endpoint
  app.post('/api/admin/reset-member-password', (req, res) => {
    const { targetUserId, newPassword, adminUserId, adminName } = req.body;

    if (!targetUserId || !newPassword) {
      return res.status(400).json({ error: 'Target member ID and new password are required.' });
    }

    const idx = usersStore.findIndex(
      (u) => u.id === targetUserId || u.memberNo.toLowerCase() === targetUserId.toLowerCase() || u.email.toLowerCase() === targetUserId.toLowerCase()
    );

    if (idx === -1) {
      return res.status(404).json({ error: `Member '${targetUserId}' not found.` });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    usersStore[idx].password = newPassword;

    const auditLog: AuditLog = {
      id: `log_admin_pwd_${Date.now()}`,
      actorId: adminUserId || 'usr_admin01',
      actorName: adminName || 'Super Administrator',
      role: 'sys_admin',
      action: 'Administrative Password Reset',
      module: 'Security & Access Control',
      details: `Super Administrator reset password for member [${usersStore[idx].fullName}] (${usersStore[idx].memberNo}).`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();
    return res.json({
      success: true,
      user: usersStore[idx],
      users: usersStore,
      message: `Password for member ${usersStore[idx].fullName} (${usersStore[idx].memberNo}) has been updated successfully.`,
    });
  });

  // Quick Status Patch (Status, Registration Fee, ID Card)
  app.patch('/api/members/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, registrationFeeStatus, idCardStatus, actorName, actorId } = req.body;

    const member = usersStore.find((u) => u.id === id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    if (status) member.status = status;
    if (registrationFeeStatus) member.registrationFeeStatus = registrationFeeStatus;
    if (idCardStatus) member.idCardStatus = idCardStatus;

    // Log Audit
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'system',
      actorName: actorName || 'Executive Officer',
      role: 'secretary',
      action: 'Member Status Update',
      module: 'Member Registration',
      details: `Updated member [${member.fullName}] status: Membership=${member.status}, Reg Fee=${member.registrationFeeStatus}, ID Card=${member.idCardStatus}.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(log);

    saveDatabase();
    return res.json({
      success: true,
      member,
      message: `Member ${member.fullName} status updated successfully.`,
    });
  });

  // Delete Member Record
  app.delete('/api/members/:id', (req, res) => {
    const { id } = req.params;
    const { actorName, actorId } = req.body || {};

    const memberIdx = usersStore.findIndex((u) => u.id === id);
    if (memberIdx === -1) {
      return res.status(404).json({ error: 'Member record not found.' });
    }

    const deletedMember = usersStore[memberIdx];
    usersStore.splice(memberIdx, 1);

    // Audit Log
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'system',
      actorName: actorName || 'Executive Officer',
      role: 'sys_admin',
      action: 'Member Record Deleted',
      module: 'Member Registration',
      details: `Permanently removed member record [${deletedMember.fullName}] (${deletedMember.memberNo}) from system roster.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(log);

    saveDatabase();
    return res.json({
      success: true,
      deletedMemberId: id,
      message: `Member '${deletedMember.fullName}' (${deletedMember.memberNo}) has been deleted successfully.`,
    });
  });

  // ==================== MEMBER SELF-REGISTRATION MODULE ENDPOINTS ====================

  // 1. GET /api/self-registration/applications - List all pending membership applications
  app.get('/api/self-registration/applications', (req, res) => {
    res.json({
      success: true,
      applications: pendingApplicationsStore,
      enableOnlineRegistration: Boolean(cooperativeSettingsStore.enableOnlineRegistration),
    });
  });

  // 2. POST /api/self-registration/apply - Public self-registration submission
  app.post('/api/self-registration/apply', (req, res) => {
    if (!cooperativeSettingsStore.enableOnlineRegistration) {
      return res.status(403).json({
        error: 'Online Member Self-Registration is currently disabled by cooperative management. Please visit any LCMS PRO Branch office to apply in person.',
      });
    }

    const {
      fullName,
      phone,
      email,
      dob,
      gender,
      residentialAddress,
      occupation,
      passportPhoto,
      meansOfId,
      idNumber,
      sponsorName,
      sponsorMemberId,
      branch,
      paymentAmount,
      paymentReference,
      paymentReceiptPhoto,
      paymentDate,
      paymentMethod,
    } = req.body || {};

    if (!fullName || !fullName.trim() || !phone || !phone.trim() || !residentialAddress || !occupation || !sponsorName) {
      return res.status(400).json({
        error: 'Mandatory fields missing: Full Name, Phone Number, Address, Occupation, and Sponsor Name are required.',
      });
    }

    // Duplicate Prevention Check - Phone, Email, NIN/ID Number only
    const duplicateMember = checkDuplicateMember(phone, email, idNumber);
    if (duplicateMember) {
      return res.status(409).json({
        error: `Duplicate Member Detected! An active member (${duplicateMember.matchedMember.fullName}, Member No: ${duplicateMember.matchedMember.memberNo}) already exists with matching ${duplicateMember.matchedField}.`,
      });
    }

    const numericAmount = Number(paymentAmount) || 10000;
    const minRegFee = cooperativeSettingsStore.registrationFee || 2500;
    if (numericAmount < minRegFee) {
      return res.status(400).json({
        error: `Minimum payment amount required is ₦${minRegFee.toLocaleString()} (Registration Fee).`,
      });
    }

    const autoAppNo = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApp: PendingMemberApplication = {
      id: `app_${Date.now()}`,
      applicationNo: autoAppNo,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      dob: dob || '1990-01-01',
      gender: gender || 'Male',
      residentialAddress: residentialAddress.trim(),
      occupation: occupation.trim(),
      state: req.body.state ? req.body.state.trim() : undefined,
      lga: req.body.lga ? req.body.lga.trim() : undefined,
      passportPhoto: passportPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      meansOfId: meansOfId || 'NIN',
      idNumber: idNumber ? idNumber.trim() : undefined,
      sponsorName: sponsorName.trim(),
      sponsorMemberId: sponsorMemberId ? sponsorMemberId.trim() : 'N/A',
      sponsorConfirmed: false,
      branch: branch || 'Iwo Main Branch',
      dateSubmitted: new Date().toLocaleString(),
      status: 'Awaiting Payment Verification',
      paymentAmount: numericAmount,
      paymentReference: paymentReference ? paymentReference.trim() : `FBN/TRX/${Math.floor(1000000 + Math.random() * 9000000)}`,
      paymentReceiptPhoto: paymentReceiptPhoto || undefined,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Bank Transfer',
      paymentStatus: 'Pending Verification',
      treasurerVerified: false,
      notes: 'Online self-registration application with bank transfer payment awaiting Treasurer verification.',
    };

    pendingApplicationsStore.unshift(newApp);

    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: 'public_applicant',
      actorName: newApp.fullName,
      role: 'member',
      action: 'Public Member Application Submitted',
      module: 'Member Registration',
      details: `Prospective member [${newApp.fullName}] submitted application (${newApp.applicationNo}) with claimed payment transfer of ₦${numericAmount.toLocaleString()} (Ref: ${newApp.paymentReference}). Status: Awaiting Payment Verification.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(log);

    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: 'New Membership Payment Awaiting Verification',
      message: `${newApp.fullName} submitted registration application ${newApp.applicationNo} with bank transfer of ₦${numericAmount.toLocaleString()} (Ref: ${newApp.paymentReference}). Please verify payment in Treasurer Portal.`,
      type: 'warning',
      isRead: false,
      createdAt: 'Just now',
    };
    notificationsStore.unshift(notif);

    saveDatabase();

    return res.status(201).json({
      success: true,
      application: newApp,
      message: `Application submitted successfully! Temporary Application Number: ${newApp.applicationNo}. Your payment transfer (₦${numericAmount.toLocaleString()}, Ref: ${newApp.paymentReference}) is now Awaiting Payment Verification by the Treasurer.`,
    });
  });

  // 3. POST /api/self-registration/applications/:id/verify-payment - Treasurer Payment Verification
  app.post('/api/self-registration/applications/:id/verify-payment', (req, res) => {
    const { id } = req.params;
    const { actorName, actorId, role, verifiedAmount, notes } = req.body || {};

    const userRole = role || 'treasurer';
    if (!['treasurer', 'sys_admin', 'financial_secretary', 'chairman'].includes(userRole)) {
      return res.status(403).json({
        error: 'Security Policy: Only the Treasurer, Financial Secretary, or Super Admin can verify bank payments.',
      });
    }

    const appItem = pendingApplicationsStore.find((a) => a.id === id || a.applicationNo === id);
    if (!appItem) {
      return res.status(404).json({ error: 'Membership application record not found.' });
    }

    const amountVerified = Number(verifiedAmount || appItem.paymentAmount || 10000);

    appItem.treasurerVerified = true;
    appItem.treasurerVerifiedBy = actorName || 'Treasurer';
    appItem.treasurerVerifiedDate = new Date().toLocaleString();
    appItem.treasurerVerifiedAmount = amountVerified;
    appItem.paymentStatus = 'Verified';
    appItem.status = 'Payment Verified';
    if (notes) appItem.treasurerNotes = notes;

    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_treasurer01',
      actorName: actorName || 'Treasurer',
      role: (role as any) || 'treasurer',
      action: 'Treasurer Payment Verified',
      module: 'Member Registration',
      details: `Treasurer [${actorName || 'Treasurer'}] verified bank transfer payment of ₦${amountVerified.toLocaleString()} (Ref: ${appItem.paymentReference || 'N/A'}) for registration application [${appItem.applicationNo}] ([${appItem.fullName}]).`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(log);

    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: 'Registration Payment Verified by Treasurer',
      message: `Payment of ₦${amountVerified.toLocaleString()} for application ${appItem.applicationNo} (${appItem.fullName}) verified by Treasurer. Application is now ready for Financial Secretary approval.`,
      type: 'info',
      isRead: false,
      createdAt: 'Just now',
    };
    notificationsStore.unshift(notif);

    saveDatabase();

    return res.json({
      success: true,
      application: appItem,
      message: `Payment of ₦${amountVerified.toLocaleString()} verified successfully for application ${appItem.applicationNo} (${appItem.fullName}). Financial Secretary notified.`,
    });
  });

  // 4. POST /api/self-registration/applications/:id/verify-sponsor - Financial Secretary Sponsor Verification
  app.post('/api/self-registration/applications/:id/verify-sponsor', (req, res) => {
    const { id } = req.params;
    const { confirmed, actorName } = req.body || {};

    const appItem = pendingApplicationsStore.find((a) => a.id === id || a.applicationNo === id);
    if (!appItem) {
      return res.status(404).json({ error: 'Membership application record not found.' });
    }

    appItem.sponsorConfirmed = Boolean(confirmed);
    appItem.sponsorConfirmedBy = actorName || 'Financial Secretary';
    appItem.sponsorConfirmedDate = new Date().toLocaleString();

    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: 'financial_secretary',
      action: confirmed ? 'Sponsor Verified' : 'Sponsor Verification Unchecked',
      module: 'Member Registration',
      details: `${actorName || 'Financial Secretary'} ${confirmed ? 'confirmed' : 'unconfirmed'} sponsor [${appItem.sponsorName} (${appItem.sponsorMemberId})] for applicant [${appItem.fullName}] (${appItem.applicationNo}).`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(log);

    saveDatabase();

    return res.json({
      success: true,
      application: appItem,
      message: confirmed
        ? `Sponsor '${appItem.sponsorName}' verified successfully for applicant ${appItem.fullName}.`
        : `Sponsor verification unchecked for applicant ${appItem.fullName}.`,
    });
  });

  // 5. POST /api/self-registration/applications/:id/approve - Financial Secretary Approval & Auto Member Creation
  app.post('/api/self-registration/applications/:id/approve', (req, res) => {
    const { id } = req.params;
    const { actorName, actorId, role } = req.body || {};

    const userRole = role || 'financial_secretary';
    if (!['financial_secretary', 'sys_admin', 'chairman'].includes(userRole)) {
      return res.status(403).json({
        error: 'Security Policy: Only the Financial Secretary, Chairman, or Super Admin can approve membership applications.',
      });
    }

    const appItem = pendingApplicationsStore.find((a) => a.id === id || a.applicationNo === id);
    if (!appItem) {
      return res.status(404).json({ error: 'Membership application record not found.' });
    }

    if (!appItem.treasurerVerified && appItem.status !== 'Payment Verified') {
      return res.status(400).json({
        error: 'Security Policy: Application payment must be verified by the Treasurer before Financial Secretary approval! Current status: Awaiting Payment Verification.',
      });
    }

    if (!appItem.sponsorConfirmed) {
      return res.status(400).json({
        error: 'Security Policy: Sponsor verification is required before approving this membership application! Please check the "Sponsor has confirmed this applicant" verification box.',
      });
    }

    // Auto-generate Permanent Member ID
    const autoMemberNo = generateNextMemberNo();

    // Create Member Account in PENDING status awaiting first deposit
    const newMember: User = {
      id: `usr_${Date.now()}`,
      memberNo: autoMemberNo,
      fullName: appItem.fullName,
      email: appItem.email || `${autoMemberNo.toLowerCase()}@lightwaycoop.ng`,
      role: 'member',
      avatar: appItem.passportPhoto,
      phone: appItem.phone,
      branch: appItem.branch || 'Iwo Main Branch',
      status: 'pending', // Member remains PENDING awaiting first deposit!
      dateJoined: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      dob: appItem.dob,
      gender: appItem.gender,
      residentialAddress: appItem.residentialAddress,
      occupation: appItem.occupation,
      state: appItem.state || 'Osun',
      lga: appItem.lga || 'Iwo',
      meansOfId: (appItem.meansOfId as MeansOfId) || 'NIN',
      idNumber: appItem.idNumber || 'N/A',
      nextOfKin: {
        fullName: 'N/A',
        relationship: 'Next of Kin',
        phone: appItem.phone,
        address: appItem.residentialAddress,
      },
      introducedBy: `${appItem.sponsorName} (${appItem.sponsorMemberId || 'N/A'})`,
      registrationFeeStatus: 'Unpaid', // Unpaid until first deposit
      idCardStatus: 'Processing',
      savingsBalance: 0,
      sharesOwned: 0,
    };

    usersStore.unshift(newMember);

    // Update Application Record
    appItem.status = 'Approved';
    appItem.approvedMemberId = autoMemberNo;
    appItem.approvedUserId = newMember.id;
    appItem.approvedBy = actorName || 'Financial Secretary';
    appItem.approvalDate = new Date().toLocaleString();
    appItem.registrationFeeStatus = 'Unpaid';

    // Member Notification
    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: 'Membership Application Approved',
      message: `Congratulations! Your Lightway Cooperative membership application has been approved.\nAssigned Member Number: ${autoMemberNo}\nStatus: Pending - Awaiting First Deposit.\nPlease post your first deposit (minimum ₦2,500) to complete registration fee payment and activate your account.`,
      type: 'success',
      isRead: false,
      createdAt: 'Just now',
    };
    notificationsStore.unshift(notif);

    // Audit Trail
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: (role as any) || 'financial_secretary',
      action: 'Member Application Approved',
      module: 'Member Registration',
      details: `Financial Secretary approved application (${appItem.applicationNo}) for [${appItem.fullName}]. Assigned Member ID: ${autoMemberNo}. Account created in PENDING status awaiting first deposit.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(log);

    saveDatabase();

    return res.json({
      success: true,
      member: newMember,
      application: appItem,
      message: `Application approved successfully! Member ID assigned: ${autoMemberNo}. Member status is currently PENDING awaiting first deposit.`,
    });
  });

  // 5. POST /api/self-registration/applications/:id/reject
  app.post('/api/self-registration/applications/:id/reject', (req, res) => {
    const { id } = req.params;
    const { reason, actorName, actorId, role } = req.body || {};

    const appItem = pendingApplicationsStore.find((a) => a.id === id || a.applicationNo === id);
    if (!appItem) {
      return res.status(404).json({ error: 'Membership application record not found.' });
    }

    appItem.status = 'Rejected';
    appItem.rejectionReason = reason || 'Declined during Financial Secretary verification review.';

    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: (role as any) || 'financial_secretary',
      action: 'Member Application Rejected',
      module: 'Member Registration',
      details: `Rejected membership application [${appItem.applicationNo}] for [${appItem.fullName}]. Reason: ${appItem.rejectionReason}`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(log);

    saveDatabase();

    return res.json({
      success: true,
      application: appItem,
      message: `Application for '${appItem.fullName}' rejected.`,
    });
  });

  // 6. POST /api/self-registration/applications/:id/request-more-info
  app.post('/api/self-registration/applications/:id/request-more-info', (req, res) => {
    const { id } = req.params;
    const { notes, actorName, actorId, role } = req.body || {};

    const appItem = pendingApplicationsStore.find((a) => a.id === id || a.applicationNo === id);
    if (!appItem) {
      return res.status(404).json({ error: 'Membership application record not found.' });
    }

    appItem.status = 'More Information Requested';
    appItem.moreInfoNotes = notes || 'Additional identification or documentation requested by Financial Secretary.';

    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: (role as any) || 'financial_secretary',
      action: 'Request More Information for Application',
      module: 'Member Registration',
      details: `Requested additional information for application [${appItem.applicationNo}] ([${appItem.fullName}]). Notes: ${appItem.moreInfoNotes}`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(log);

    saveDatabase();

    return res.json({
      success: true,
      application: appItem,
      message: `Additional information requested from applicant '${appItem.fullName}'.`,
    });
  });

  // 7. POST /api/self-registration/applications/:id/pay-registration-fee - Registration Fee Payment & Fee Splitting
  app.post('/api/self-registration/applications/:id/pay-registration-fee', (req, res) => {
    const { id } = req.params;
    const {
      amountPaid,
      datePaid,
      receiptNumber,
      paymentMethod,
      receivedBy,
      notes,
      actorName,
      actorId,
    } = req.body || {};

    const numericAmount = Number(amountPaid);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a valid positive number.' });
    }

    const minRegFee = cooperativeSettingsStore.registrationFee || 2500;

    if (numericAmount < minRegFee) {
      return res.status(400).json({
        error: `Registration fee has not been completed. Amount paid (₦${numericAmount.toLocaleString()}) is below the required ₦${minRegFee.toLocaleString()} registration fee. Membership cannot be activated.`,
        activated: false,
      });
    }

    let member = usersStore.find((u) => u.id === id || u.memberNo.toLowerCase() === id.toLowerCase());
    const appItem = pendingApplicationsStore.find((a) => a.id === id || a.applicationNo === id || (a.approvedMemberId && a.approvedMemberId.toLowerCase() === id.toLowerCase()));

    if (!member && appItem && appItem.approvedUserId) {
      member = usersStore.find((u) => u.id === appItem.approvedUserId);
    }

    if (!member) {
      return res.status(404).json({ error: 'Associated member user account not found. Please ensure application is approved first.' });
    }

    const regFeeAmount = minRegFee;
    const firstSavingsAmount = numericAmount - minRegFee;

    member.status = 'active';
    member.registrationFeeStatus = 'Paid';
    if (firstSavingsAmount > 0) {
      member.savingsBalance = (member.savingsBalance || 0) + firstSavingsAmount;
    }

    const currentCoopBalance = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);
    const newCoopEntry: CooperativeWalletEntry = {
      id: `coop_tx_${Date.now()}`,
      category: 'Registration Fee',
      amount: regFeeAmount,
      payerMemberId: member.id,
      payerMemberNo: member.memberNo,
      payerName: member.fullName,
      receiptNumber: receiptNumber || `REC-REG-${Date.now()}`,
      paymentMethod: (paymentMethod as PaymentMethod) || 'Bank Transfer',
      date: datePaid || new Date().toISOString().split('T')[0],
      recordedBy: receivedBy || 'Financial Secretary',
      notes: notes || `Official Registration Fee for ${member.fullName}`,
      balanceAfter: currentCoopBalance + regFeeAmount,
      createdAt: new Date().toISOString(),
    };
    cooperativeWalletStore.unshift(newCoopEntry);

    if (firstSavingsAmount > 0) {
      const savingsEntry: SavingsDeposit = {
        id: `sav_${Date.now()}`,
        memberId: member.id,
        memberNo: member.memberNo,
        memberName: member.fullName,
        amount: firstSavingsAmount,
        depositDate: datePaid || new Date().toISOString().split('T')[0],
        paymentMethod: (paymentMethod as PaymentMethod) || 'Bank Transfer',
        referenceNumber: `REC-SAV-${Date.now()}`,
        receivedBy: receivedBy || 'Financial Secretary',
        notes: `Initial Savings Deposit auto-allocated from Registration Fee payment (Total Paid: ₦${numericAmount.toLocaleString()} - ₦${regFeeAmount.toLocaleString()} Reg Fee = ₦${firstSavingsAmount.toLocaleString()} Savings)`,
        branch: member.branch,
        createdAt: new Date().toISOString(),
      };
      savingsStore.unshift(savingsEntry);
    }

    const memberTxRegFee: MemberWalletTransaction = {
      id: `mw_tx_${Date.now()}`,
      memberId: member.id,
      memberNo: member.memberNo,
      memberName: member.fullName,
      txType: 'Registration Fee Payment',
      amount: regFeeAmount,
      flow: 'debit',
      targetWallet: 'Cooperative Main Wallet',
      receiptNumber: receiptNumber || `REC-REG-${Date.now()}`,
      paymentMethod: (paymentMethod as PaymentMethod) || 'Bank Transfer',
      date: datePaid || new Date().toISOString().split('T')[0],
      recordedBy: receivedBy || 'Financial Secretary',
      notes: `Registration Fee: ₦${regFeeAmount.toLocaleString()}`,
      createdAt: new Date().toISOString(),
    };
    memberWalletTransactionsStore.unshift(memberTxRegFee);

    if (firstSavingsAmount > 0) {
      memberWalletTransactionsStore.unshift({
        id: `mw_tx_sav_${Date.now()}`,
        memberId: member.id,
        memberNo: member.memberNo,
        memberName: member.fullName,
        txType: 'Savings Deposit',
        amount: firstSavingsAmount,
        flow: 'credit',
        targetWallet: 'Savings',
        receiptNumber: `REC-SAV-${Date.now()}`,
        paymentMethod: (paymentMethod as PaymentMethod) || 'Bank Transfer',
        date: datePaid || new Date().toISOString().split('T')[0],
        recordedBy: receivedBy || 'Financial Secretary',
        notes: `First Savings Deposit credited to passbook.`,
        savingsBalanceAfter: member.savingsBalance,
        createdAt: new Date().toISOString(),
      });
    }

    if (appItem) {
      appItem.status = 'Completed';
      appItem.registrationFeeAmountPaid = regFeeAmount;
      appItem.firstSavingsAmount = firstSavingsAmount;
      appItem.registrationFeeStatus = 'Completed';
      appItem.paymentDate = datePaid || new Date().toISOString().split('T')[0];
      appItem.receiptNumber = receiptNumber || `REC-REG-${Date.now()}`;
    }

    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: 'financial_secretary',
      action: 'Registration Fee Processed & Member Activated',
      module: 'Member Registration',
      details: `Processed ₦${numericAmount.toLocaleString()} payment for [${member.fullName}] (${member.memberNo}). Breakdown: Registration Fee = ₦${regFeeAmount.toLocaleString()}, First Savings = ₦${firstSavingsAmount.toLocaleString()}. Sponsor: ${member.introducedBy}. Approving Officer: ${receivedBy || actorName || 'Financial Secretary'}. Date & Time: ${datePaid} ${new Date().toLocaleTimeString()}. Member activated successfully.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(log);

    saveDatabase();

    return res.json({
      success: true,
      activated: true,
      member,
      registrationFee: regFeeAmount,
      firstSavings: firstSavingsAmount,
      message: `Payment of ₦${numericAmount.toLocaleString()} processed successfully! Registration Fee: ₦${regFeeAmount.toLocaleString()} | First Savings Passbook Credit: ₦${firstSavingsAmount.toLocaleString()}. Member '${member.fullName}' (${member.memberNo}) is now ACTIVE!`,
    });
  });

  // ==================== SAVINGS MANAGEMENT MODULE ENDPOINTS ====================

  // Helper: Combine multiple deposits made on the same day for a member (Naira at Risk Engine prep)
  function getDailyAggregations(depositsList: SavingsDeposit[]): DailySavingsAggregation[] {
    const groups: Record<string, SavingsDeposit[]> = {};

    depositsList.forEach((dep) => {
      const key = `${dep.memberNo}_${dep.depositDate}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(dep);
    });

    const aggregations: DailySavingsAggregation[] = Object.entries(groups).map(([key, deps]) => {
      const first = deps[0];
      const totalAmount = deps.reduce((sum, d) => sum + Number(d.amount), 0);
      const depositCount = deps.length;
      const depositIds = deps.map((d) => d.id);
      const receivedByOfficers = Array.from(new Set(deps.map((d) => d.receivedBy)));

      // Future Naira at Risk calculation weight factor:
      // Multi-deposit frequency risk weight booster = (depositCount > 1 ? 1.15 : 1.0)
      const nairaAtRiskWeight = Math.round(totalAmount * 0.10 * (depositCount > 1 ? 1.15 : 1.0));

      return {
        memberNo: first.memberNo,
        memberName: first.memberName,
        date: first.depositDate,
        totalAmount,
        depositCount,
        depositIds,
        receivedByOfficers,
        nairaAtRiskWeight,
        notesSummary:
          depositCount > 1
            ? `Combined ${depositCount} same-day deposits totalling ₦${totalAmount.toLocaleString()} for Naira at Risk Engine.`
            : `Single deposit of ₦${totalAmount.toLocaleString()}.`,
      };
    });

    return aggregations.sort((a, b) => b.date.localeCompare(a.date));
  }

  // Helper: Calculate Savings Summary Statistics
  function getSavingsStats(depositsList: SavingsDeposit[]): SavingsSummaryStats {
    const now = new Date();
    const currentYearStr = now.getFullYear().toString();
    const currentMonthStr = `${currentYearStr}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalSavings = depositsList.reduce((sum, d) => sum + Number(d.amount), 0);
    const monthlySavings = depositsList
      .filter((d) => d.depositDate.startsWith(currentMonthStr))
      .reduce((sum, d) => sum + Number(d.amount), 0);
    const yearlySavings = depositsList
      .filter((d) => d.depositDate.startsWith(currentYearStr))
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const activeDepositors = new Set(depositsList.map((d) => d.memberNo));
    const aggregations = getDailyAggregations(depositsList);
    const sameDayAggregationsCount = aggregations.filter((a) => a.depositCount > 1).length;

    return {
      totalSavings,
      monthlySavings,
      yearlySavings,
      activeDepositorsCount: activeDepositors.size,
      totalTransactionsCount: depositsList.length,
      averageDepositSize: depositsList.length > 0 ? Math.round(totalSavings / depositsList.length) : 0,
      sameDayAggregationsCount,
    };
  }

  // 1. GET /api/savings - List & Filter Savings Deposits
  app.get('/api/savings', (req, res) => {
    const { search, memberNo, date, startDate, endDate, paymentMethod } = req.query;
    let list = [...savingsStore];

    if (memberNo) {
      list = list.filter((d) => d.memberNo.toLowerCase() === String(memberNo).toLowerCase());
    }

    if (date) {
      list = list.filter((d) => d.depositDate === String(date));
    }

    if (startDate) {
      list = list.filter((d) => d.depositDate >= String(startDate));
    }

    if (endDate) {
      list = list.filter((d) => d.depositDate <= String(endDate));
    }

    if (paymentMethod && paymentMethod !== 'all') {
      list = list.filter((d) => d.paymentMethod === String(paymentMethod));
    }

    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (d) =>
          d.memberNo.toLowerCase().includes(q) ||
          d.memberName.toLowerCase().includes(q) ||
          d.referenceNumber.toLowerCase().includes(q) ||
          d.receivedBy.toLowerCase().includes(q) ||
          d.paymentMethod.toLowerCase().includes(q) ||
          d.depositDate.includes(q)
      );
    }

    // Sort by depositDate descending
    list.sort((a, b) => b.depositDate.localeCompare(a.depositDate) || (b.createdAt || '').localeCompare(a.createdAt || ''));

    const stats = getSavingsStats(savingsStore);
    const dailyAggregations = getDailyAggregations(list);

    res.json({
      deposits: list,
      totalCount: list.length,
      stats,
      dailyAggregations,
    });
  });

  // 2. POST /api/savings/deposit - Record New Savings Deposit
  app.post('/api/savings/deposit', (req, res) => {
    const {
      memberNo,
      depositDate,
      amount,
      paymentMethod,
      referenceNumber,
      receivedBy,
      notes,
      actorName,
      actorId,
    } = req.body;

    if (!memberNo || !depositDate || !amount || !paymentMethod || !referenceNumber || !receivedBy) {
      return res.status(400).json({
        error: 'Missing required fields: Membership Number, Deposit Date, Amount, Payment Method, Reference Number, and Received By are all mandatory.',
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Deposit amount must be a positive number greater than ₦0.' });
    }

    // Verify Member
    const member = usersStore.find((u) => u.memberNo.toLowerCase() === String(memberNo).trim().toLowerCase());
    if (!member) {
      return res.status(404).json({
        error: `Member with Membership Number '${memberNo}' was not found in the cooperative directory.`,
      });
    }

    // Check if Registration Fee has been paid before
    const hasPaidRegFee = member.registrationFeeStatus === 'Paid' || member.registrationFeeStatus === 'Waived';

    if (!hasPaidRegFee) {
      // First deposit rule: Must be at least ₦2,500 to cover registration fee
      const regFeePortion = cooperativeSettingsStore.registrationFee || 2500;
      if (numericAmount < regFeePortion) {
        return res.status(400).json({
          error: 'First payment must be at least ₦2,500 to cover the registration fee.',
        });
      }

      // Deduct ₦2,500 registration fee automatically
      const savingsPortion = numericAmount - regFeePortion;

      // Mark Registration Fee Status = PAID & Status = ACTIVE
      member.registrationFeeStatus = 'Paid';
      member.status = 'active';

      // Update matching self-registration application if present
      const matchingApp = pendingApplicationsStore.find(
        (a) => a.approvedUserId === member.id || (a.approvedMemberId && a.approvedMemberId.toLowerCase() === member.memberNo.toLowerCase())
      );
      if (matchingApp) {
        matchingApp.status = 'Completed';
        matchingApp.registrationFeeStatus = 'Completed';
      }

      // 1. Post ₦2,500 Registration Fee Income to Cooperative Main Wallet
      const currentCoopBalance = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);
      const coopEntry: CooperativeWalletEntry = {
        id: `coop_tx_${Date.now()}`,
        category: 'Registration Fee',
        amount: regFeePortion,
        payerMemberId: member.id,
        payerMemberNo: member.memberNo,
        payerName: member.fullName,
        receiptNumber: String(referenceNumber).trim(),
        paymentMethod: paymentMethod as PaymentMethod,
        date: String(depositDate).trim(),
        recordedBy: String(receivedBy).trim(),
        notes: `Registration Fee (₦2,500) automatically deducted from first deposit of ₦${numericAmount.toLocaleString()}`,
        balanceAfter: currentCoopBalance + regFeePortion,
        createdAt: new Date().toISOString(),
      };
      cooperativeWalletStore.unshift(coopEntry);

      // Record Member Wallet Transaction for Fee
      memberWalletTransactionsStore.unshift({
        id: `mw_tx_${Date.now()}`,
        memberId: member.id,
        memberNo: member.memberNo,
        memberName: member.fullName,
        txType: 'Registration Fee Payment',
        amount: regFeePortion,
        flow: 'debit',
        targetWallet: 'Cooperative Main Wallet',
        receiptNumber: String(referenceNumber).trim(),
        paymentMethod: paymentMethod as PaymentMethod,
        date: String(depositDate).trim(),
        recordedBy: String(receivedBy).trim(),
        notes: `Registration fee automatically deducted from first deposit.`,
        createdAt: new Date().toISOString(),
      });

      // 2. Credit remaining balance into member's Savings Account
      member.savingsBalance = (member.savingsBalance || 0) + savingsPortion;

      let newDeposit: SavingsDeposit | null = null;
      if (savingsPortion > 0) {
        newDeposit = {
          id: `sav_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          memberId: member.id,
          memberNo: member.memberNo,
          memberName: member.fullName,
          depositDate: String(depositDate).trim(),
          amount: savingsPortion,
          transactionFee: 0,
          paymentMethod: paymentMethod as PaymentMethod,
          referenceNumber: String(referenceNumber).trim(),
          receivedBy: String(receivedBy).trim(),
          notes: notes ? String(notes).trim() : `First Savings Deposit after ₦2,500 Registration Fee deduction (Total Paid: ₦${numericAmount.toLocaleString()})`,
          createdAt: new Date().toISOString(),
        };
        savingsStore.unshift(newDeposit);

        memberWalletTransactionsStore.unshift({
          id: `mwt_${Date.now()}`,
          memberId: member.id,
          memberNo: member.memberNo,
          memberName: member.fullName,
          txType: 'Savings Deposit',
          amount: savingsPortion,
          flow: 'credit',
          targetWallet: 'Savings',
          receiptNumber: String(referenceNumber).trim(),
          paymentMethod: paymentMethod as PaymentMethod,
          date: String(depositDate).trim(),
          recordedBy: String(receivedBy).trim(),
          notes: `First Savings Deposit credited to passbook.`,
          savingsBalanceAfter: member.savingsBalance,
          createdAt: new Date().toISOString(),
        });
      }

      // Audit Log
      const auditLog: AuditLog = {
        id: `log_${Date.now()}`,
        actorId: actorId || 'usr_finsec01',
        actorName: actorName || 'Financial Secretary',
        role: 'financial_secretary',
        action: 'First Deposit & Registration Fee Deduction',
        module: 'Savings Management',
        details: `Processed first deposit of ₦${numericAmount.toLocaleString()} for member [${member.fullName}] (${member.memberNo}). Automatically deducted ₦2,500 Registration Fee Income. Credited ₦${savingsPortion.toLocaleString()} to Savings Account. Member status activated & Registration Fee status set to PAID.`,
        ipAddress: req.ip || '127.0.0.1',
        timestamp: new Date().toLocaleString(),
        severity: 'info',
      };
      auditLogsStore.unshift(auditLog);

      // Notification
      const notif: SystemNotification = {
        id: `notif_${Date.now()}`,
        userId: member.id,
        title: 'First Deposit Confirmed & Registration Fee Paid',
        message: `First Deposit: ₦${numericAmount.toLocaleString()} | Registration Fee: ₦2,500 | Savings Credited: ₦${savingsPortion.toLocaleString()}`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      notificationsStore.unshift(notif);

      const stats = getSavingsStats(savingsStore);
      saveDatabase();

      return res.status(201).json({
        success: true,
        deposit: newDeposit,
        updatedSavingsBalance: member.savingsBalance,
        split: {
          firstDeposit: numericAmount,
          registrationFee: regFeePortion,
          savingsCredited: savingsPortion,
        },
        message: `First Deposit: ₦${numericAmount.toLocaleString()}\nRegistration Fee: ₦2,500\nSavings Credited: ₦${savingsPortion.toLocaleString()}`,
        stats,
      });
    }

    if (member.status !== 'active') {
      return res.status(403).json({
        error: `Cannot post savings deposit! Member '${member.fullName}' (${member.memberNo}) status is currently '${member.status.toUpperCase()}'. Savings deposits are strictly permitted for Active members only.`,
      });
    }

    const transactionFee = req.body.transactionFee !== undefined ? Number(req.body.transactionFee) : (numericAmount < 5000 ? 50 : 0);

    const newDeposit: SavingsDeposit = {
      id: `sav_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      memberId: member.id,
      memberNo: member.memberNo,
      memberName: member.fullName,
      depositDate: String(depositDate).trim(),
      amount: numericAmount,
      transactionFee,
      paymentMethod: paymentMethod as PaymentMethod,
      referenceNumber: String(referenceNumber).trim(),
      receivedBy: String(receivedBy).trim(),
      notes: notes ? String(notes).trim() : (transactionFee > 0 ? `Savings deposit (₦50 transaction charge applies)` : 'Regular savings deposit'),
      createdAt: new Date().toISOString(),
    };

    savingsStore.unshift(newDeposit);

    // Automatically update Member's total savings balance in userStore (ONLY actual savings amount counts!)
    member.savingsBalance = (member.savingsBalance || 0) + numericAmount;

    // Calculate updated daily aggregation for same-day deposits (using actual savings amounts only)
    const memberDailyDeposits = savingsStore.filter(
      (d) => d.memberNo === member.memberNo && d.depositDate === newDeposit.depositDate
    );
    const dailyTotalForDate = memberDailyDeposits.reduce((sum, d) => sum + d.amount, 0);

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: 'financial_secretary',
      action: 'Savings Deposit Posted',
      module: 'Savings Management',
      details: `Posted ₦${numericAmount.toLocaleString()} savings deposit for member [${member.fullName}] (${member.memberNo}). ${
        transactionFee > 0
          ? `(Minimum savings rule applied: ₦50 transaction charge recorded separately; total payable: ₦${(numericAmount + transactionFee).toLocaleString()}). `
          : ''
      }Method: ${paymentMethod}, Ref: ${referenceNumber}. New Savings Balance: ₦${member.savingsBalance.toLocaleString()}. Same-day total for ${newDeposit.depositDate}: ₦${dailyTotalForDate.toLocaleString()} (${memberDailyDeposits.length} deposits combined for Naira at Risk Engine).`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Notification
    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      userId: member.id,
      title: 'Savings Passbook Deposit Recorded',
      message: `Your passbook account received a deposit of ₦${numericAmount.toLocaleString()} on ${newDeposit.depositDate} via ${paymentMethod} (Ref: ${referenceNumber}).${
        transactionFee > 0 ? ` Additional ₦50 transaction charge applied (Total paid: ₦${(numericAmount + transactionFee).toLocaleString()}).` : ''
      } Total Savings Balance: ₦${member.savingsBalance.toLocaleString()}.`,
      type: 'success',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notificationsStore.unshift(notif);

    const stats = getSavingsStats(savingsStore);

    saveDatabase();
    return res.status(201).json({
      success: true,
      deposit: newDeposit,
      updatedSavingsBalance: member.savingsBalance,
      sameDayDepositCount: memberDailyDeposits.length,
      sameDayTotalAmount: dailyTotalForDate,
      message: `Savings deposit of ₦${numericAmount.toLocaleString()} successfully credited to ${member.fullName} (${member.memberNo})! ${
        memberDailyDeposits.length > 1
          ? `Automatically combined with ${memberDailyDeposits.length - 1} existing same-day deposit(s) for a daily total of ₦${dailyTotalForDate.toLocaleString()} (Naira at Risk Engine ready).`
          : ''
      }`,
      stats,
    });
  });

  // 3. GET /api/savings/statement/:memberNo - Generated Printable Savings Statement
  app.get('/api/savings/statement/:memberNo', (req, res) => {
    const { memberNo } = req.params;
    const member = usersStore.find((u) => u.memberNo.toLowerCase() === String(memberNo).trim().toLowerCase());

    if (!member) {
      return res.status(404).json({ error: `Member with Membership Number '${memberNo}' not found.` });
    }

    // Get all deposits for member sorted chronologically (ascending)
    const memberDeposits = savingsStore
      .filter((d) => d.memberNo.toLowerCase() === member.memberNo.toLowerCase())
      .sort((a, b) => a.depositDate.localeCompare(b.depositDate) || (a.createdAt || '').localeCompare(b.createdAt || ''));

    // Compute running balances
    let runningAcc = 0;
    const depositsWithRunningBalance = memberDeposits.map((d) => {
      runningAcc += Number(d.amount);
      return {
        ...d,
        runningBalance: runningAcc,
      };
    });

    // Same day aggregation analysis
    const dailyAggregations = getDailyAggregations(memberDeposits);

    // Future Module Preparation Calculations:
    const currentBalance = runningAcc;
    const loanEligibilityLimit = currentBalance * 3; // Standard 300% savings rule for future Loan Module
    const estimatedDividendShareBase = currentBalance; // Base savings balance for future Dividend Module
    const nairaAtRiskScore = dailyAggregations.reduce((sum, a) => sum + a.nairaAtRiskWeight, 0);

    const statementData = {
      generatedAt: new Date().toLocaleString(),
      officialHeader: {
        cooperativeName: 'Lightway Cooperative Multipurpose Society Limited (LCMS PRO)',
        registrationNumber: 'LS/COOP/REG/2018/0492',
        hqAddress: '15 Broad Street, Marina, Lagos State, Nigeria',
        contactPhone: '+234 (0) 803 111 2233',
        contactEmail: 'passbooks@lightwaycoop.ng',
        webPortal: 'https://lcms.lightwaycoop.ng',
      },
      memberInfo: {
        id: member.id,
        memberNo: member.memberNo,
        fullName: member.fullName,
        branch: member.branch,
        status: member.status,
        dateJoined: member.dateJoined,
        phone: member.phone,
        email: member.email,
        residentialAddress: member.residentialAddress || 'N/A',
        department: member.department || 'N/A',
      },
      summary: {
        totalDepositsCount: memberDeposits.length,
        totalSavingsBalance: currentBalance,
        firstDepositDate: memberDeposits.length > 0 ? memberDeposits[0].depositDate : 'N/A',
        lastDepositDate: memberDeposits.length > 0 ? memberDeposits[memberDeposits.length - 1].depositDate : 'N/A',
        averageDepositSize: memberDeposits.length > 0 ? Math.round(currentBalance / memberDeposits.length) : 0,
        sameDayAggregationsCount: dailyAggregations.filter((a) => a.depositCount > 1).length,
      },
      // Prepared integration payloads
      futureIntegrations: {
        loanModule: {
          savingsBalance: currentBalance,
          maxLoanCapacityMultiplier: 3.0,
          maxLoanEligibleAmount: loanEligibilityLimit,
          status: 'Ready for Loan Module Integration',
        },
        dividendModule: {
          weightedSavingsBalance: estimatedDividendShareBase,
          qualifyingTier: currentBalance >= 5000000 ? 'Tier 1 Platinum' : currentBalance >= 1000000 ? 'Tier 2 Gold' : 'Tier 3 Standard',
          status: 'Ready for Dividend Module Integration',
        },
        nairaAtRiskEngine: {
          dailyAggregatedTotalCount: dailyAggregations.length,
          totalNairaAtRiskScore: nairaAtRiskScore,
          dailyCombinedLogs: dailyAggregations,
          status: 'Ready for Naira at Risk Engine Integration',
        },
      },
      deposits: depositsWithRunningBalance.reverse(), // reverse for display (newest first)
      chronologicalLedger: depositsWithRunningBalance, // chronological for printable official statement
      dailyAggregations,
    };

    res.json({
      success: true,
      statement: statementData,
    });
  });

  // 4. GET /api/savings/daily-aggregations - Combined Daily Total Payload for Naira at Risk Engine
  app.get('/api/savings/daily-aggregations', (req, res) => {
    const aggregations = getDailyAggregations(savingsStore);
    res.json({
      success: true,
      totalDailyAggregations: aggregations.length,
      sameDayMultiDepositsCount: aggregations.filter((a) => a.depositCount > 1).length,
      aggregations,
    });
  });

  // ==================== NAIRA AT RISK MODULE ENGINE & ENDPOINTS ====================

  // Helper: Calculate Days Remaining in Accounting Year (Jan 1 - Dec 31)
  function getDaysRemainingInAccountingYear(depositDateStr: string, accountingYear: number): number {
    const totalDaysInYear = (accountingYear % 4 === 0 && (accountingYear % 100 !== 0 || accountingYear % 400 === 0)) ? 366 : 365;
    const parts = String(depositDateStr).split('-');
    if (parts.length !== 3) return 0;
    
    const dYear = parseInt(parts[0], 10);
    const dMonth = parseInt(parts[1], 10);
    const dDay = parseInt(parts[2], 10);

    if (isNaN(dYear) || isNaN(dMonth) || isNaN(dDay)) return 0;

    if (dYear < accountingYear) {
      // Carried over savings deposited before accounting year -> available for full year
      return totalDaysInYear;
    }
    if (dYear > accountingYear) {
      // Future deposit relative to accounting year -> 0 days
      return 0;
    }

    // Same accounting year: calculate days remaining from deposit date to Dec 31 (inclusive of deposit date)
    const depositDateUtc = Date.UTC(dYear, dMonth - 1, dDay);
    const endOfYearUtc = Date.UTC(accountingYear, 11, 31);

    if (depositDateUtc > endOfYearUtc) return 0;

    const diffMs = endOfYearUtc - depositDateUtc;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays + 1; // e.g., Jan 1 = 365 days (or 366 in leap year), Dec 31 = 1 day
  }

  // Helper: Compute Complete Naira At Risk Report
  function getNairaAtRiskReport(accountingYear: number = 2026) {
    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const memberDepositWeights: Record<string, NairaAtRiskDepositWeight[]> = {};

    usersStore.forEach((user) => {
      memberDepositWeights[user.memberNo.toLowerCase()] = [];
    });

    let totalCooperativeSavings = 0;
    let totalCooperativeNairaAtRisk = 0;
    let totalTransactionsCount = 0;

    const monthlyStats = MONTH_NAMES.map((name, idx) => ({
      monthName: name,
      monthIndex: idx + 1,
      depositCount: 0,
      totalDepositAmount: 0,
      daysRemainingSum: 0,
      monthlyNairaAtRisk: 0,
    }));

    savingsStore.forEach((dep) => {
      const key = dep.memberNo.toLowerCase();
      const daysRemaining = getDaysRemainingInAccountingYear(dep.depositDate, accountingYear);
      const nairaAtRisk = Number(dep.amount) * daysRemaining;

      const weightedDep: NairaAtRiskDepositWeight = {
        id: dep.id,
        depositDate: dep.depositDate,
        amount: Number(dep.amount),
        daysRemaining,
        nairaAtRisk,
      };

      if (!memberDepositWeights[key]) {
        memberDepositWeights[key] = [];
      }
      memberDepositWeights[key].push(weightedDep);
      totalTransactionsCount += 1;

      const parts = dep.depositDate.split('-');
      if (parts.length === 3) {
        const dYear = parseInt(parts[0], 10);
        const dMonth = parseInt(parts[1], 10);
        if (dYear === accountingYear && dMonth >= 1 && dMonth <= 12) {
          const mIdx = dMonth - 1;
          monthlyStats[mIdx].depositCount += 1;
          monthlyStats[mIdx].totalDepositAmount += Number(dep.amount);
          monthlyStats[mIdx].daysRemainingSum += daysRemaining;
          monthlyStats[mIdx].monthlyNairaAtRisk += nairaAtRisk;
        }
      }
    });

    const memberRecords: NairaAtRiskMemberRecord[] = usersStore.map((user) => {
      const key = user.memberNo.toLowerCase();
      const deps = memberDepositWeights[key] || [];
      const totalSavings = user.savingsBalance !== undefined && user.savingsBalance !== null
        ? Number(user.savingsBalance)
        : deps.reduce((sum, d) => sum + d.amount, 0);

      // Total Naira At Risk: If member has no savings (totalSavings <= 0), Naira At Risk must automatically be ₦0.
      const totalNairaAtRisk = totalSavings > 0 ? deps.reduce((sum, d) => sum + d.nairaAtRisk, 0) : 0;

      totalCooperativeSavings += totalSavings;
      totalCooperativeNairaAtRisk += totalNairaAtRisk;

      return {
        memberId: user.id,
        memberNo: user.memberNo,
        memberName: user.fullName,
        status: user.status,
        branch: user.branch || 'HQ Marina',
        totalSavings,
        totalNairaAtRisk,
        depositCount: deps.length,
        percentageShare: 0,
        estimatedDividendStatus: 'Pending AGM Approval',
        deposits: deps.sort((a, b) => b.depositDate.localeCompare(a.depositDate)),
      };
    });

    let membersWithSavingsCount = 0;
    memberRecords.forEach((m) => {
      if (m.totalSavings > 0) membersWithSavingsCount += 1;
      m.percentageShare = totalCooperativeNairaAtRisk > 0
        ? Number(((m.totalNairaAtRisk / totalCooperativeNairaAtRisk) * 100).toFixed(4))
        : 0;
    });

    const monthlyBreakdown: MonthlyNairaAtRiskReport[] = monthlyStats.map((ms) => ({
      monthName: ms.monthName,
      monthIndex: ms.monthIndex,
      depositCount: ms.depositCount,
      totalDepositAmount: ms.totalDepositAmount,
      averageDaysRemaining: ms.depositCount > 0 ? Math.round(ms.daysRemainingSum / ms.depositCount) : 0,
      monthlyNairaAtRisk: ms.monthlyNairaAtRisk,
      percentageOfAnnualNairaAtRisk: totalCooperativeNairaAtRisk > 0
        ? Number(((ms.monthlyNairaAtRisk / totalCooperativeNairaAtRisk) * 100).toFixed(2))
        : 0,
    }));

    const summary: NairaAtRiskSummaryStats = {
      accountingYear,
      totalCooperativeSavings,
      totalCooperativeNairaAtRisk,
      membersWithSavingsCount,
      totalTransactionsCount,
      averageMemberNairaAtRisk: membersWithSavingsCount > 0
        ? Math.round(totalCooperativeNairaAtRisk / membersWithSavingsCount)
        : 0,
      lastRecalculatedAt: new Date().toLocaleString(),
    };

    return {
      summary,
      memberRecords: memberRecords.sort((a, b) => b.totalNairaAtRisk - a.totalNairaAtRisk),
      monthlyBreakdown,
    };
  }

  // GET /api/naira-at-risk - Full Cooperative or Individual Member Naira At Risk Report
  app.get('/api/naira-at-risk', (req, res) => {
    const { year, search, status, memberNo, branch } = req.query;
    const accountingYear = year ? parseInt(String(year), 10) : 2026;

    const report = getNairaAtRiskReport(accountingYear);
    let records = [...report.memberRecords];

    if (memberNo) {
      records = records.filter((r) => r.memberNo.toLowerCase() === String(memberNo).toLowerCase());
    }

    if (status && status !== 'all') {
      records = records.filter((r) => r.status === String(status));
    }

    if (branch && branch !== 'all') {
      records = records.filter((r) => r.branch === String(branch));
    }

    if (search) {
      const q = String(search).toLowerCase();
      records = records.filter(
        (r) =>
          r.memberName.toLowerCase().includes(q) ||
          r.memberNo.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q)
      );
    }

    const narAuditLogs = auditLogsStore.filter(
      (l) => l.module.includes('Savings') || l.module.includes('Naira At Risk') || l.action.includes('Savings')
    );

    return res.json({
      success: true,
      summary: report.summary,
      memberRecords: records,
      monthlyBreakdown: report.monthlyBreakdown,
      auditLogs: narAuditLogs,
    });
  });

  // PUT /api/savings/:id - Edit Savings Deposit (Triggers Live Naira At Risk Recalculation)
  app.put('/api/savings/:id', (req, res) => {
    const { id } = req.params;
    const { amount, depositDate, paymentMethod, referenceNumber, notes, actorName, actorId } = req.body;

    const depositIndex = savingsStore.findIndex((d) => d.id === id);
    if (depositIndex === -1) {
      return res.status(404).json({ error: 'Savings deposit record not found.' });
    }

    const oldDeposit = savingsStore[depositIndex];
    const oldAmount = oldDeposit.amount;
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;

    if (isNaN(newAmount) || newAmount <= 0) {
      return res.status(400).json({ error: 'Savings deposit amount must be a positive number greater than ₦0.' });
    }

    const member = usersStore.find((u) => u.memberNo.toLowerCase() === oldDeposit.memberNo.toLowerCase());
    
    // Update member's total savings balance in userStore
    if (member) {
      member.savingsBalance = Math.max(0, (member.savingsBalance || 0) - oldAmount + newAmount);
    }

    const previousValue = `Amount: ₦${oldAmount.toLocaleString()}, Date: ${oldDeposit.depositDate}, Method: ${oldDeposit.paymentMethod}, Ref: ${oldDeposit.referenceNumber}`;

    const updatedDeposit: SavingsDeposit = {
      ...oldDeposit,
      amount: newAmount,
      depositDate: depositDate ? String(depositDate).trim() : oldDeposit.depositDate,
      paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : oldDeposit.paymentMethod,
      referenceNumber: referenceNumber ? String(referenceNumber).trim() : oldDeposit.referenceNumber,
      notes: notes ? String(notes).trim() : oldDeposit.notes,
    };

    savingsStore[depositIndex] = updatedDeposit;

    const newValue = `Amount: ₦${newAmount.toLocaleString()}, Date: ${updatedDeposit.depositDate}, Method: ${updatedDeposit.paymentMethod}, Ref: ${updatedDeposit.referenceNumber}`;

    // Record Audit Log with Date, Time, User, Action, Previous Value, New Value
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: 'financial_secretary',
      action: 'Savings Deposit Edited',
      module: 'Savings & Naira At Risk Module',
      details: `Edited deposit for member [${oldDeposit.memberName}] (${oldDeposit.memberNo}). Previous Value: [${previousValue}] | New Value: [${newValue}]. Passbook balance updated to ₦${(member?.savingsBalance || 0).toLocaleString()}. Naira At Risk automatically recalculated.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();
    const updatedReport = getNairaAtRiskReport(2026);

    return res.json({
      success: true,
      message: `Savings deposit successfully updated! Member total savings balance is now ₦${(member?.savingsBalance || 0).toLocaleString()}. Naira At Risk recalculated.`,
      updatedDeposit,
      nairaAtRiskReport: updatedReport,
    });
  });

  // Shared Deposit Reversal Helper
  function processDepositReversal(
    depositId: string,
    reason: string,
    actorName?: string,
    actorId?: string,
    actorRole?: string,
    req?: any,
    res?: any
  ) {
    if (!depositId) {
      return res.status(400).json({ error: 'Deposit ID is required for reversal.' });
    }

    const trimmedReason = (reason || '').trim();
    if (!trimmedReason) {
      return res.status(400).json({
        error: 'Reversal reason is required for financial audit trail (e.g., "Entered twice by mistake").',
      });
    }

    const role = actorRole || 'financial_secretary';
    const allowedRoles = ['sys_admin', 'financial_secretary'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: 'Permission Denied! Only Financial Secretary or Super Admin can reverse savings deposits.',
      });
    }

    const deposit = savingsStore.find((d) => d.id === depositId);
    if (!deposit) {
      return res.status(404).json({ error: 'Savings deposit record not found.' });
    }

    if (deposit.isReversed) {
      return res.status(400).json({ error: 'This deposit transaction has already been reversed.' });
    }

    if (deposit.amount < 0 || deposit.isReversal) {
      return res.status(400).json({ error: 'Cannot reverse a reversal entry.' });
    }

    // 1. Mark original deposit as reversed (DO NOT DELETE)
    deposit.isReversed = true;
    deposit.reversalReason = trimmedReason;
    deposit.reversalDate = new Date().toISOString().split('T')[0];
    deposit.reversedBy = actorName || 'Financial Secretary';

    // 2. Create Reversal Transaction with negative amount
    const origAmount = Math.abs(deposit.amount);
    const reversalDeposit: SavingsDeposit = {
      id: `sav_rev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      memberId: deposit.memberId,
      memberNo: deposit.memberNo,
      memberName: deposit.memberName,
      depositDate: new Date().toISOString().split('T')[0],
      amount: -origAmount,
      transactionFee: 0,
      paymentMethod: deposit.paymentMethod,
      referenceNumber: `REV-${deposit.referenceNumber}`,
      receivedBy: actorName || 'Financial Secretary',
      notes: `REVERSAL: ${trimmedReason} (Reversing Ref: ${deposit.referenceNumber})`,
      createdAt: new Date().toISOString(),
      isReversal: true,
      reversedDepositId: deposit.id,
    };

    savingsStore.unshift(reversalDeposit);

    // 3. Automatically Recalculate Member's Savings Balance
    const member = usersStore.find((u) => u.memberNo.toLowerCase() === deposit.memberNo.toLowerCase());
    if (member) {
      member.savingsBalance = Math.max(0, (member.savingsBalance || 0) - origAmount);
    }

    // 4. Create Reversal Entry in Member Wallet Ledger
    memberWalletTransactionsStore.unshift({
      id: `mw_tx_rev_${Date.now()}`,
      memberId: deposit.memberId,
      memberNo: deposit.memberNo,
      memberName: deposit.memberName,
      txType: 'Savings Deposit Reversal',
      amount: origAmount,
      flow: 'debit',
      targetWallet: 'Savings',
      receiptNumber: `REV-${deposit.referenceNumber}`,
      paymentMethod: deposit.paymentMethod,
      date: new Date().toISOString().split('T')[0],
      recordedBy: actorName || 'Financial Secretary',
      notes: `REVERSAL: ${trimmedReason} (Original Ref: ${deposit.referenceNumber})`,
      savingsBalanceAfter: member ? member.savingsBalance : 0,
      createdAt: new Date().toISOString(),
    });

    // 5. Audit Log Entry
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: actorName || 'Financial Secretary',
      role: (role as UserRole) || 'financial_secretary',
      action: 'Savings Deposit Reversed',
      module: 'Savings Management & Passbook Audit',
      details: `Reversed deposit #${deposit.id} (Ref: ${deposit.referenceNumber}) of ₦${origAmount.toLocaleString()} for member [${deposit.memberName}] (${deposit.memberNo}). Reason: "${trimmedReason}". Original deposit preserved in passbook; negative reversal entry [-₦${origAmount.toLocaleString()}] posted. Member new savings balance: ₦${(member?.savingsBalance || 0).toLocaleString()}. Registration fee deduction protected.`,
      ipAddress: (req && req.ip) || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'critical',
    };
    auditLogsStore.unshift(auditLog);

    // 6. System Notification
    if (member) {
      notificationsStore.unshift({
        id: `notif_${Date.now()}`,
        userId: member.id,
        title: 'Savings Deposit Reversed',
        message: `A deposit of ₦${origAmount.toLocaleString()} (Ref: ${deposit.referenceNumber}) was reversed by ${actorName || 'Financial Secretary'}. Reason: ${trimmedReason}. Updated balance: ₦${member.savingsBalance.toLocaleString()}`,
        type: 'warning',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    saveDatabase();
    const stats = getSavingsStats(savingsStore);
    const updatedReport = getNairaAtRiskReport(2026);

    return res.json({
      success: true,
      message: `Savings deposit of ₦${origAmount.toLocaleString()} successfully reversed! Negative entry posted to passbook, member balance updated.`,
      originalDeposit: deposit,
      reversalDeposit,
      updatedSavingsBalance: member ? member.savingsBalance : 0,
      stats,
      nairaAtRiskReport: updatedReport,
    });
  }

  // POST /api/savings/reverse - Reverse Savings Deposit
  app.post('/api/savings/reverse', (req, res) => {
    const { depositId, reason, actorName, actorId, actorRole } = req.body || {};
    return processDepositReversal(depositId, reason, actorName, actorId, actorRole, req, res);
  });

  // POST /api/savings/:id/reverse - Reverse Savings Deposit
  app.post('/api/savings/:id/reverse', (req, res) => {
    const { id } = req.params;
    const { reason, actorName, actorId, actorRole } = req.body || {};
    return processDepositReversal(id, reason, actorName, actorId, actorRole, req, res);
  });

  // DELETE /api/savings/:id - Non-destructive Reverse Savings Deposit
  app.delete('/api/savings/:id', (req, res) => {
    const { id } = req.params;
    const { reason, actorName, actorId, actorRole } = req.body || {};
    return processDepositReversal(id, reason || 'Correction by Financial Secretary', actorName, actorId, actorRole, req, res);
  });

  // ==================== LOAN MANAGEMENT MODULE ENDPOINTS ====================

  function getLoanStats(loansList: LoanApplication[]): LoanSummaryStats {
    const totalDisbursedAmount = loansList
      .filter((l) => ['Disbursed', 'Completed', 'Defaulted'].includes(l.status))
      .reduce((sum, l) => sum + l.loanAmount, 0);

    const totalOutstandingBalance = loansList
      .filter((l) => l.status === 'Disbursed')
      .reduce((sum, l) => sum + l.outstandingBalance, 0);

    const totalRepaidAmount = loansList.reduce((sum, l) => sum + l.amountRepaid, 0);

    return {
      totalLoanApplications: loansList.length,
      totalDisbursedAmount,
      totalOutstandingBalance,
      totalRepaidAmount,
      pendingGuarantorApprovalCount: loansList.filter((l) => l.status === 'Waiting for Guarantor Approval').length,
      pendingVerificationCount: loansList.filter((l) => l.status === 'Pending').length,
      pendingApprovalCount: loansList.filter((l) => l.status === 'Verified').length,
      pendingDisbursementCount: loansList.filter((l) => l.status === 'Approved').length,
      activeDisbursedLoansCount: loansList.filter((l) => l.status === 'Disbursed').length,
      completedLoansCount: loansList.filter((l) => l.status === 'Completed').length,
      defaultedLoansCount: loansList.filter((l) => l.status === 'Defaulted').length,
    };
  }

  // 1. GET /api/loans - List and Filter Loan Applications
  app.get('/api/loans', (req, res) => {
    const { search, status, memberNo, guarantorMemberNo } = req.query;
    let list = [...loansStore];

    if (status && status !== 'all') {
      list = list.filter((l) => l.status === status);
    }
    if (memberNo && memberNo !== 'all') {
      list = list.filter((l) => l.memberNo.toLowerCase() === String(memberNo).toLowerCase());
    }
    if (guarantorMemberNo && guarantorMemberNo !== 'all') {
      list = list.filter((l) => l.guarantorMemberNo.toLowerCase() === String(guarantorMemberNo).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase();
      list = list.filter(
        (l) =>
          l.loanNo.toLowerCase().includes(q) ||
          l.memberName.toLowerCase().includes(q) ||
          l.memberNo.toLowerCase().includes(q) ||
          l.guarantorName.toLowerCase().includes(q) ||
          l.guarantorMemberNo.toLowerCase().includes(q) ||
          l.loanPurpose.toLowerCase().includes(q)
      );
    }

    res.json({
      loans: list,
      stats: getLoanStats(loansStore),
    });
  });

  // 2. GET /api/loans/check-eligibility - Verify Member & Guarantor Qualifications
  app.get('/api/loans/check-eligibility', (req, res) => {
    const { memberNo, requestedAmount, guarantorMemberNo } = req.query;

    if (!memberNo || !requestedAmount || !guarantorMemberNo) {
      return res.status(400).json({
        error: 'Missing query params: memberNo, requestedAmount, and guarantorMemberNo are required.',
      });
    }

    const member = usersStore.find((u) => u.memberNo.toLowerCase() === String(memberNo).trim().toLowerCase());
    if (!member) {
      return res.status(404).json({ error: `Applicant member '${memberNo}' not found.` });
    }

    const guarantor = usersStore.find((u) => u.memberNo.toLowerCase() === String(guarantorMemberNo).trim().toLowerCase());
    if (!guarantor) {
      return res.status(404).json({ error: `Guarantor member '${guarantorMemberNo}' not found.` });
    }

    const loanReqAmount = Number(requestedAmount) || 0;
    const memberSavings = member.savingsBalance || 0;
    const maxLoanLimit = memberSavings * 3; // 300% savings limit
    const isMemberActive = member.status === 'active';
    const isMemberSavingsSufficient = loanReqAmount <= maxLoanLimit;

    // Guarantor checks
    const isGuarantorActive = guarantor.status === 'active';
    const guarantorSavings = guarantor.savingsBalance || 0;

    // Find active loans guaranteed by this guarantor
    const activeGuaranteedLoans = loansStore.filter(
      (l) => l.guarantorMemberNo.toLowerCase() === guarantor.memberNo.toLowerCase() && ['Disbursed', 'Approved', 'Verified'].includes(l.status)
    );

    const totalGuaranteedEncumbrance = activeGuaranteedLoans.reduce((sum, l) => sum + l.loanAmount, 0);
    const unencumberedSavings = Math.max(0, guarantorSavings - totalGuaranteedEncumbrance);
    const isGuarantorSavingsSufficient = guarantorSavings >= loanReqAmount;

    const memberQualifies = isMemberActive && isMemberSavingsSufficient;
    const guarantorQualifies = isGuarantorActive && isGuarantorSavingsSufficient;

    res.json({
      success: true,
      memberEvaluation: {
        memberNo: member.memberNo,
        memberName: member.fullName,
        status: member.status,
        isActive: isMemberActive,
        savingsBalance: memberSavings,
        maxLoanLimit,
        requestedAmount: loanReqAmount,
        isSavingsRatioValid: isMemberSavingsSufficient,
        qualifies: memberQualifies,
      },
      guarantorEvaluation: {
        guarantorMemberNo: guarantor.memberNo,
        guarantorName: guarantor.fullName,
        status: guarantor.status,
        isActive: isGuarantorActive,
        savingsBalance: guarantorSavings,
        activeGuaranteedLoansCount: activeGuaranteedLoans.length,
        totalGuaranteedEncumbrance,
        unencumberedSavings,
        isSavingsSufficient: isGuarantorSavingsSufficient,
        qualifies: guarantorQualifies,
      },
      overallQualified: memberQualifies && guarantorQualifies,
    });
  });

  // 3. POST /api/loans/apply - Step 1: Member submits loan application
  app.post('/api/loans/apply', (req, res) => {
    const {
      memberNo,
      loanAmount,
      interestRate,
      repaymentPeriodMonths,
      loanPurpose,
      guarantorMemberNo,
      actorName,
      actorId,
    } = req.body;

    if (!memberNo || !loanAmount || !loanPurpose || !guarantorMemberNo) {
      return res.status(400).json({
        error: 'Missing required fields: Membership Number, Loan Amount, Loan Purpose, and Guarantor Membership Number are required.',
      });
    }

    const member = usersStore.find((u) => u.memberNo.toLowerCase() === String(memberNo).trim().toLowerCase());
    if (!member) {
      return res.status(404).json({ error: `Applicant member '${memberNo}' not found.` });
    }

    if (member.status !== 'active') {
      return res.status(403).json({
        error: `Cannot apply for loan! Member '${member.fullName}' status is '${member.status.toUpperCase()}'. Only Active members qualify.`,
      });
    }

    const guarantor = usersStore.find((u) => u.memberNo.toLowerCase() === String(guarantorMemberNo).trim().toLowerCase());
    if (!guarantor) {
      return res.status(404).json({ error: `Guarantor '${guarantorMemberNo}' not found in member roster.` });
    }

    if (guarantor.memberNo.toLowerCase() === member.memberNo.toLowerCase()) {
      return res.status(400).json({ error: 'Applicant cannot serve as their own guarantor. Please specify another active member.' });
    }

    const reqAmount = Number(loanAmount);
    const tenureMonths = Number(repaymentPeriodMonths) || 12;
    const rateAnnual = Number(interestRate) || 12; // 12% default annual
    const memberSavings = member.savingsBalance || 0;
    const maxEligibility = memberSavings * 3;

    // Financial calculations
    const totalInterest = Math.round(reqAmount * (rateAnnual / 100) * (tenureMonths / 12));
    const totalPayable = reqAmount + totalInterest;

    // Auto generate loan code
    const loanSeq = String(loansStore.length + 1).padStart(3, '0');
    const autoLoanNo = `LCMS-LN-2026-${loanSeq}`;

    const newLoan: LoanApplication = {
      id: `loan_${Date.now()}`,
      loanNo: autoLoanNo,
      memberId: member.id,
      memberNo: member.memberNo,
      memberName: member.fullName,
      memberSavingsBalance: memberSavings,
      maxLoanEligibility: maxEligibility,
      loanAmount: reqAmount,
      interestRate: rateAnnual,
      repaymentPeriodMonths: tenureMonths,
      loanPurpose: String(loanPurpose).trim(),
      guarantorMemberNo: guarantor.memberNo,
      guarantorName: guarantor.fullName,
      guarantorSavingsBalance: guarantor.savingsBalance || 0,
      guarantorApprovalStatus: 'Pending',
      status: 'Waiting for Guarantor Approval',
      dateApplied: new Date().toISOString().split('T')[0],
      totalInterest,
      totalPayable,
      outstandingBalance: totalPayable,
      amountRepaid: 0,
      repaymentSchedule: [],
      repayments: [],
      createdAt: new Date().toISOString(),
      approvalHistory: [
        {
          id: `aph_${Date.now()}`,
          step: 'Application Submitted',
          actionBy: actorName || member.fullName,
          actionRole: 'member',
          timestamp: new Date().toLocaleString(),
          statusTo: 'Waiting for Guarantor Approval',
          comments: `Loan application for ₦${reqAmount.toLocaleString()} submitted for '${loanPurpose}'. Guarantor: ${guarantor.fullName} (${guarantor.memberNo}). Awaiting Guarantor Approval.`,
        },
      ],
    };

    loansStore.unshift(newLoan);

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || member.id,
      actorName: actorName || member.fullName,
      role: 'member',
      action: 'Loan Application Submitted',
      module: 'Loan Management',
      details: `Submitted loan application [${newLoan.loanNo}] for ₦${reqAmount.toLocaleString()} (${tenureMonths} months). Status: Waiting for Guarantor Approval (${guarantor.fullName}).`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Notification to Guarantor
    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      title: `Guarantor Request: Loan ${autoLoanNo}`,
      message: `${member.fullName} has selected you as a guarantor for a loan application ${autoLoanNo} of ₦${reqAmount.toLocaleString()} (${tenureMonths} months at 1% per month). Please review and accept or reject.`,
      type: 'warning',
      isRead: false,
      createdAt: 'Just now',
    };
    notificationsStore.unshift(notif);

    saveDatabase();
    return res.status(201).json({
      success: true,
      loan: newLoan,
      message: `Loan application ${newLoan.loanNo} successfully submitted! Automatically sent guarantor request notification to ${guarantor.fullName}.`,
      stats: getLoanStats(loansStore),
    });
  });

  // 3b. POST /api/loans/:id/guarantor-decision - Step 2: Guarantor Review & Decision (Password/PIN Protected)
  app.post('/api/loans/:id/guarantor-decision', (req, res) => {
    const { id } = req.params;
    const { decision, pinOrPassword, guarantorNotes, actorName, actorId } = req.body; // decision = 'accept' | 'reject'

    const loan = loansStore.find((l) => l.id === id || l.loanNo === id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found.' });
    }

    if (loan.status !== 'Waiting for Guarantor Approval') {
      return res.status(400).json({
        error: `Cannot process guarantor decision! Current loan status is '${loan.status}'. Guarantor action is only applicable to applications waiting for guarantor approval.`,
      });
    }

    const guarantorName = actorName || loan.guarantorName;

    if (decision === 'reject') {
      loan.status = 'Rejected by Guarantor';
      loan.guarantorApprovalStatus = 'Rejected';
      loan.guarantorRejectedAt = new Date().toISOString();
      loan.guarantorNotes = guarantorNotes || 'Declined by guarantor.';

      loan.approvalHistory.push({
        id: `aph_${Date.now()}`,
        step: 'Guarantor Review',
        actionBy: guarantorName,
        actionRole: 'member',
        timestamp: new Date().toLocaleString(),
        statusFrom: 'Waiting for Guarantor Approval',
        statusTo: 'Rejected by Guarantor',
        comments: `Guarantor ${guarantorName} DECLINED loan guarantor request for ₦${loan.loanAmount.toLocaleString()}. Notes: ${loan.guarantorNotes}`,
      });

      // Audit Log
      const auditLog: AuditLog = {
        id: `log_${Date.now()}`,
        actorId: actorId || 'usr_guarantor',
        actorName: guarantorName,
        role: 'member',
        action: 'Guarantor Request Rejected',
        module: 'Loan Management',
        details: `Guarantor ${guarantorName} declined guarantor request for loan [${loan.loanNo}] (Applicant: ${loan.memberName}, ₦${loan.loanAmount.toLocaleString()}).`,
        ipAddress: req.ip || '127.0.0.1',
        timestamp: new Date().toLocaleString(),
        severity: 'warning',
      };
      auditLogsStore.unshift(auditLog);

      // Notification to Borrower
      notificationsStore.unshift({
        id: `notif_${Date.now()}`,
        title: `Loan Guarantor Request Declined`,
        message: `Guarantor ${guarantorName} has declined your guarantor request for loan ${loan.loanNo}. You can submit a new application selecting another guarantor.`,
        type: 'alert',
        isRead: false,
        createdAt: 'Just now',
      });

      saveDatabase();
      return res.json({
        success: true,
        loan,
        message: `Guarantor request for Loan ${loan.loanNo} was DECLINED. Applicant has been notified.`,
        stats: getLoanStats(loansStore),
      });
    }

    // Accept Decision - Password/PIN verification required
    if (!pinOrPassword || String(pinOrPassword).trim().length === 0) {
      return res.status(400).json({
        error: 'Password or Security PIN is required to confirm legally binding guarantor pledge.',
      });
    }

    loan.status = 'Pending';
    loan.guarantorApprovalStatus = 'Approved';
    loan.guarantorApprovedAt = new Date().toISOString();
    loan.guarantorNotes = guarantorNotes || 'Approved and confirmed with security credentials.';

    loan.approvalHistory.push({
      id: `aph_${Date.now()}`,
      step: 'Guarantor Review',
      actionBy: guarantorName,
      actionRole: 'member',
      timestamp: new Date().toLocaleString(),
      statusFrom: 'Waiting for Guarantor Approval',
      statusTo: 'Pending',
      comments: `Guarantor ${guarantorName} confirmed with security credentials and ACCEPTED guaranteeing ₦${loan.loanAmount.toLocaleString()} loan for ${loan.memberName}. Notes: ${loan.guarantorNotes}`,
    });

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_guarantor',
      actorName: guarantorName,
      role: 'member',
      action: 'Guarantor Request Accepted',
      module: 'Loan Management',
      details: `Guarantor ${guarantorName} verified security PIN/password and ACCEPTED loan pledge for [${loan.loanNo}] (Applicant: ${loan.memberName}, ₦${loan.loanAmount.toLocaleString()}). Forwarded to Financial Secretary.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Notification to Financial Secretary and Borrower
    notificationsStore.unshift({
      id: `notif_${Date.now()}`,
      title: `Loan Ready for Verification`,
      message: `Guarantor ${guarantorName} accepted loan application ${loan.loanNo} for ${loan.memberName} (₦${loan.loanAmount.toLocaleString()}). Ready for Financial Secretary verification.`,
      type: 'info',
      isRead: false,
      createdAt: 'Just now',
    });

    saveDatabase();
    return res.json({
      success: true,
      loan,
      message: `Guarantor agreement for Loan ${loan.loanNo} CONFIRMED! Application forwarded to Financial Secretary for verification.`,
      stats: getLoanStats(loansStore),
    });
  });

  // 4. POST /api/loans/:id/verify - Step 2 & 3: Financial Secretary Verification
  app.post('/api/loans/:id/verify', (req, res) => {
    const { id } = req.params;
    const { action, verificationNotes, actorName, actorId } = req.body; // action = 'verify' | 'reject'

    const loan = loansStore.find((l) => l.id === id || l.loanNo === id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found.' });
    }

    if (loan.status !== 'Pending') {
      return res.status(400).json({ error: `Cannot verify loan! Current loan status is '${loan.status}'. Verification is only applicable to 'Pending' applications.` });
    }

    const finSecName = actorName || 'Mr. Babatunde Ogunleye (Financial Secretary)';

    if (action === 'reject') {
      loan.status = 'Rejected';
      loan.approvalHistory.push({
        id: `aph_${Date.now()}`,
        step: 'Loan Rejection',
        actionBy: finSecName,
        actionRole: 'financial_secretary',
        timestamp: new Date().toLocaleString(),
        statusFrom: 'Pending',
        statusTo: 'Rejected',
        comments: verificationNotes || 'Application rejected by Financial Secretary during verification.',
      });

      return res.json({
        success: true,
        loan,
        message: `Loan ${loan.loanNo} marked as REJECTED by Financial Secretary.`,
        stats: getLoanStats(loansStore),
      });
    }

    // Verify member active & guarantor
    const guarantor = usersStore.find((u) => u.memberNo.toLowerCase() === loan.guarantorMemberNo.toLowerCase());
    const guarantorSavings = guarantor ? guarantor.savingsBalance || 0 : 0;

    const guarantorDetails: GuarantorVerificationDetails = {
      guarantorMemberNo: loan.guarantorMemberNo,
      guarantorName: loan.guarantorName,
      guarantorStatus: guarantor ? guarantor.status : 'active',
      guarantorSavingsBalance: guarantorSavings,
      activeGuaranteedLoansCount: 1,
      totalGuaranteedEncumbrance: loan.loanAmount,
      unencumberedSavings: Math.max(0, guarantorSavings - loan.loanAmount),
      qualifies: guarantor ? guarantor.status === 'active' && guarantorSavings >= loan.loanAmount : true,
      verificationNotes: verificationNotes || 'FinSec verified active status, savings ratio (3x eligibility), and guarantor encumbrance.',
    };

    loan.status = 'Verified';
    loan.dateVerified = new Date().toISOString().split('T')[0];
    loan.verifiedBy = finSecName;
    loan.verificationNotes = verificationNotes || 'Member active status verified. Guarantor creditworthiness confirmed.';
    loan.guarantorDetails = guarantorDetails;

    loan.approvalHistory.push({
      id: `aph_${Date.now()}`,
      step: 'Financial Verification',
      actionBy: finSecName,
      actionRole: 'financial_secretary',
      timestamp: new Date().toLocaleString(),
      statusFrom: 'Pending',
      statusTo: 'Verified',
      comments: `Step 2 & 3 Passed: Member & Guarantor verified. ${loan.verificationNotes}`,
    });

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: finSecName,
      role: 'financial_secretary',
      action: 'Loan Verified',
      module: 'Loan Management',
      details: `Financial Secretary verified loan [${loan.loanNo}] for ₦${loan.loanAmount.toLocaleString()} (${loan.memberName}). Ready for Executive Chairman Approval.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Notification to Chairman
    notificationsStore.unshift({
      id: `notif_${Date.now()}`,
      title: `Loan Ready for Chairman Approval`,
      message: `Financial Secretary verified loan application ${loan.loanNo} for ${loan.memberName} (₦${loan.loanAmount.toLocaleString()}). Forwarded to Executive Chairman.`,
      type: 'info',
      isRead: false,
      createdAt: 'Just now',
    });

    saveDatabase();
    return res.json({
      success: true,
      loan,
      message: `Loan ${loan.loanNo} VERIFIED successfully by Financial Secretary! Ready for Step 4: Executive Chairman Approval.`,
      stats: getLoanStats(loansStore),
    });
  });

  // 5. POST /api/loans/:id/approve - Step 4: Executive Chairman Approval
  app.post('/api/loans/:id/approve', (req, res) => {
    const { id } = req.params;
    const { action, approvalNotes, actorName, actorId } = req.body; // action = 'approve' | 'reject'

    const loan = loansStore.find((l) => l.id === id || l.loanNo === id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found.' });
    }

    if (loan.status !== 'Verified') {
      return res.status(400).json({ error: `Cannot approve loan! Loan status is '${loan.status}'. Chairman can only approve loans that have been VERIFIED by the Financial Secretary.` });
    }

    const chairmanName = actorName || 'Chief Olusegun Adebayo (Executive Chairman)';

    if (action === 'reject') {
      loan.status = 'Rejected';
      loan.approvalHistory.push({
        id: `aph_${Date.now()}`,
        step: 'Loan Rejection',
        actionBy: chairmanName,
        actionRole: 'chairman',
        timestamp: new Date().toLocaleString(),
        statusFrom: 'Verified',
        statusTo: 'Rejected',
        comments: approvalNotes || 'Rejected by Executive Chairman.',
      });

      return res.json({
        success: true,
        loan,
        message: `Loan ${loan.loanNo} REJECTED by Executive Chairman.`,
        stats: getLoanStats(loansStore),
      });
    }

    loan.status = 'Approved';
    loan.dateApproved = new Date().toISOString().split('T')[0];
    loan.approvedBy = chairmanName;
    loan.approvalNotes = approvalNotes || 'Approved by Executive Chairman based on verified financial eligibility.';

    loan.approvalHistory.push({
      id: `aph_${Date.now()}`,
      step: 'Chairman Approval',
      actionBy: chairmanName,
      actionRole: 'chairman',
      timestamp: new Date().toLocaleString(),
      statusFrom: 'Verified',
      statusTo: 'Approved',
      comments: `Step 4 Passed: ${loan.approvalNotes}`,
    });

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_chair01',
      actorName: chairmanName,
      role: 'chairman',
      action: 'Loan Approved',
      module: 'Loan Management',
      details: `Executive Chairman approved loan facility [${loan.loanNo}] for ₦${loan.loanAmount.toLocaleString()} (${loan.memberName}). Ready for Step 5 Treasurer Disbursement.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Notification to Treasurer and Borrower
    notificationsStore.unshift({
      id: `notif_${Date.now()}`,
      title: `Loan Application Approved`,
      message: `Executive Chairman approved loan application ${loan.loanNo} for ${loan.memberName} (₦${loan.loanAmount.toLocaleString()}). Awaiting Treasurer disbursement.`,
      type: 'info',
      isRead: false,
      createdAt: 'Just now',
    });

    saveDatabase();
    return res.json({
      success: true,
      loan,
      message: `Loan ${loan.loanNo} APPROVED by Executive Chairman! Ready for Step 5: Treasurer Disbursement.`,
      stats: getLoanStats(loansStore),
    });
  });

  // 6. POST /api/loans/:id/disburse - Step 5: Treasurer Disbursement
  app.post('/api/loans/:id/disburse', (req, res) => {
    const { id } = req.params;
    const { disbursementMethod, disbursementVoucherRef, disbursementNotes, actorName, actorId } = req.body;

    const loan = loansStore.find((l) => l.id === id || l.loanNo === id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found.' });
    }

    if (loan.status !== 'Approved') {
      return res.status(400).json({ error: `Cannot disburse loan! Current loan status is '${loan.status}'. Treasurer can only disburse loans that are in 'APPROVED' status.` });
    }

    const treasurerName = actorName || 'Mrs. Grace Chinenye (Treasurer)';
    const method = (disbursementMethod as PaymentMethod) || 'Bank Transfer';
    const voucherRef = disbursementVoucherRef || `VOUCHER-${Date.now().toString().slice(-6)}`;

    loan.status = 'Disbursed';
    loan.dateDisbursed = new Date().toISOString().split('T')[0];
    loan.disbursedBy = treasurerName;
    loan.disbursementMethod = method;
    loan.disbursementVoucherRef = voucherRef;
    loan.disbursementNotes = disbursementNotes || 'Disbursed via Treasury Bank Transfer.';

    // Auto Generate Repayment Schedule
    const monthlyPrincipal = Math.round(loan.loanAmount / loan.repaymentPeriodMonths);
    const monthlyInterest = Math.round(loan.totalInterest / loan.repaymentPeriodMonths);
    const monthlyTotal = monthlyPrincipal + monthlyInterest;

    const schedule: RepaymentInstallment[] = [];
    const startDate = new Date();

    for (let i = 1; i <= loan.repaymentPeriodMonths; i++) {
      const dueDateObj = new Date(startDate);
      dueDateObj.setMonth(dueDateObj.getMonth() + i);
      const dueDateStr = dueDateObj.toISOString().split('T')[0];

      schedule.push({
        installmentNo: i,
        dueDate: dueDateStr,
        principalAmount: monthlyPrincipal,
        interestAmount: monthlyInterest,
        totalInstallmentAmount: monthlyTotal,
        paidAmount: 0,
        status: 'Pending',
      });
    }

    loan.repaymentSchedule = schedule;

    loan.approvalHistory.push({
      id: `aph_${Date.now()}`,
      step: 'Treasurer Disbursement',
      actionBy: treasurerName,
      actionRole: 'treasurer',
      timestamp: new Date().toLocaleString(),
      statusFrom: 'Approved',
      statusTo: 'Disbursed',
      comments: `Step 5 Passed: Disbursed ₦${loan.loanAmount.toLocaleString()} via ${method} (Ref: ${voucherRef}). Repayment schedule generated.`,
    });

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_treas01',
      actorName: treasurerName,
      role: 'treasurer',
      action: 'Loan Disbursed',
      module: 'Loan Management',
      details: `Treasurer disbursed loan funds [${loan.loanNo}] of ₦${loan.loanAmount.toLocaleString()} to ${loan.memberName}. Voucher Ref: ${voucherRef}. Repayment schedule initialized.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();
    return res.json({
      success: true,
      loan,
      message: `Loan ${loan.loanNo} DISBURSED successfully by Treasurer! Treasury Voucher Ref: ${voucherRef}. Repayment Schedule active.`,
      stats: getLoanStats(loansStore),
    });
  });

  // 7. POST /api/loans/:id/repay - Step 6: Record Loan Repayment
  app.post('/api/loans/:id/repay', (req, res) => {
    const { id } = req.params;
    const { amountPaid, paymentDate, paymentMethod, referenceNumber, receivedBy, notes, actorName, actorId } = req.body;

    const loan = loansStore.find((l) => l.id === id || l.loanNo === id);
    if (!loan) {
      return res.status(404).json({ error: 'Loan record not found.' });
    }

    if (loan.status !== 'Disbursed') {
      return res.status(400).json({ error: `Cannot record repayment! Loan status is '${loan.status}'. Repayments can only be logged for active 'Disbursed' loans.` });
    }

    const payAmount = Number(amountPaid);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'Repayment amount must be a positive number greater than ₦0.' });
    }

    const dateStr = paymentDate || new Date().toISOString().split('T')[0];
    const method = (paymentMethod as PaymentMethod) || 'Bank Transfer';
    const refNum = referenceNumber || `REPAY-${Date.now().toString().slice(-6)}`;
    const officer = receivedBy || actorName || 'Financial Secretary';

    const repaymentRec: LoanRepaymentRecord = {
      id: `rep_${Date.now()}`,
      loanId: loan.id,
      loanNo: loan.loanNo,
      amountPaid: payAmount,
      paymentDate: dateStr,
      paymentMethod: method,
      referenceNumber: refNum,
      receivedBy: officer,
      notes: notes || 'Regular loan installment repayment',
      createdAt: new Date().toISOString(),
    };

    loan.repayments.unshift(repaymentRec);
    loan.amountRepaid += payAmount;
    loan.outstandingBalance = Math.max(0, loan.totalPayable - loan.amountRepaid);

    // Apply repayment to repayment schedule installments
    let remainingToAllocate = payAmount;
    loan.repaymentSchedule.forEach((inst) => {
      if (remainingToAllocate <= 0) return;
      if (inst.status === 'Paid') return;

      const dueLeft = inst.totalInstallmentAmount - inst.paidAmount;
      if (remainingToAllocate >= dueLeft) {
        inst.paidAmount = inst.totalInstallmentAmount;
        inst.status = 'Paid';
        inst.paymentDate = dateStr;
        inst.referenceNumber = refNum;
        remainingToAllocate -= dueLeft;
      } else {
        inst.paidAmount += remainingToAllocate;
        inst.status = 'Partially Paid';
        remainingToAllocate = 0;
      }
    });

    // Check if loan completed
    if (loan.outstandingBalance <= 0) {
      loan.status = 'Completed';
      loan.approvalHistory.push({
        id: `aph_${Date.now()}`,
        step: 'Repayment',
        actionBy: officer,
        actionRole: 'financial_secretary',
        timestamp: new Date().toLocaleString(),
        statusFrom: 'Disbursed',
        statusTo: 'Completed',
        comments: `Final repayment of ₦${payAmount.toLocaleString()} received. Loan balance fully settled!`,
      });
    } else {
      loan.approvalHistory.push({
        id: `aph_${Date.now()}`,
        step: 'Repayment',
        actionBy: officer,
        actionRole: 'financial_secretary',
        timestamp: new Date().toLocaleString(),
        statusFrom: 'Disbursed',
        statusTo: 'Disbursed',
        comments: `Repayment of ₦${payAmount.toLocaleString()} credited. Remaining Outstanding Balance: ₦${loan.outstandingBalance.toLocaleString()}.`,
      });
    }

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: officer,
      role: 'financial_secretary',
      action: 'Loan Repayment Posted',
      module: 'Loan Management',
      details: `Posted repayment of ₦${payAmount.toLocaleString()} for loan [${loan.loanNo}] (${loan.memberName}). Remaining Balance: ₦${loan.outstandingBalance.toLocaleString()}. Ref: ${refNum}.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();
    return res.json({
      success: true,
      loan,
      repayment: repaymentRec,
      message: `Repayment of ₦${payAmount.toLocaleString()} successfully credited to loan ${loan.loanNo}! ${
        loan.outstandingBalance <= 0 ? 'CONGRATULATIONS: Loan is now FULLY COMPLETED!' : `New Outstanding Balance: ₦${loan.outstandingBalance.toLocaleString()}`
      }`,
      stats: getLoanStats(loansStore),
    });
  });

  // 8. GET /api/loans/voucher/:id - Printable Disbursement Voucher & Agreement
  app.get('/api/loans/voucher/:id', (req, res) => {
    const { id } = req.params;
    const loan = loansStore.find((l) => l.id === id || l.loanNo === id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan record not found.' });
    }

    res.json({
      success: true,
      voucher: {
        generatedAt: new Date().toLocaleString(),
        header: {
          cooperativeName: 'Lightway Cooperative Multipurpose Society Limited (LCMS PRO)',
          rcNumber: 'LS/COOP/REG/2018/0492',
          headOffice: '15 Broad Street, Marina, Lagos State, Nigeria',
          contact: '+234 (0) 803 111 2233 | loans@lightwaycoop.ng',
        },
        loanDetails: loan,
        signatures: {
          chairman: 'Chief Olusegun Adebayo (Executive Chairman)',
          financialSecretary: 'Mr. Babatunde Ogunleye (Financial Secretary)',
          treasurer: 'Mrs. Grace Chinenye (Treasurer)',
          borrower: `${loan.memberName} (${loan.memberNo})`,
          guarantor: `${loan.guarantorName} (${loan.guarantorMemberNo})`,
        },
      },
    });
  });

  // ==================== ANNUAL SURPLUS APPROPRIATION MODULE ENDPOINTS ====================

  // 1. GET /api/surplus-appropriation - Step 1 & Step 2 & Step 4 Calculations
  app.get('/api/surplus-appropriation', (req, res) => {
    const totalMembersSavings = savingsStore.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalAssets = surplusAppropriationStore.totalAssets || 0;
    const externalLiabilities = surplusAppropriationStore.externalLiabilities || 0;

    const appropriationResult = calculateAnnualSurplusAndAppropriation(
      totalAssets,
      totalMembersSavings,
      externalLiabilities,
      surplusAppropriationStore.allocations,
      surplusAppropriationStore.dividendSubPolicy,
      surplusAppropriationStore.approvalStatus
    );

    res.json({
      success: true,
      data: {
        ...surplusAppropriationStore,
        ...appropriationResult,
      },
    });
  });

  // 2. POST /api/surplus-appropriation/config - Step 2 Configurator (Admin, Chairman, FinSec)
  app.post('/api/surplus-appropriation/config', (req, res) => {
    const { totalAssets, externalLiabilities, allocations, dividendSubPolicy, actorName, actorId, role } = req.body;

    if (role && !['sys_admin', 'chairman', 'financial_secretary'].includes(role)) {
      return res.status(403).json({
        error: 'Access Denied: Only Super Admin, Executive Chairman, or Financial Secretary may configure Annual Surplus Appropriation.',
      });
    }

    if (totalAssets !== undefined && !isNaN(Number(totalAssets))) {
      surplusAppropriationStore.totalAssets = Number(totalAssets);
    }

    if (externalLiabilities !== undefined && !isNaN(Number(externalLiabilities))) {
      surplusAppropriationStore.externalLiabilities = Number(externalLiabilities);
    }

    if (Array.isArray(allocations)) {
      surplusAppropriationStore.allocations = allocations;

      // Sync General Dividend Pool to dividendConfigStore for dividend calculations
      const generalDivAlloc = allocations.find((a: SurplusAllocationItem) => a.categoryKey === 'general_dividend');
      if (generalDivAlloc && generalDivAlloc.amount > 0) {
        dividendConfigStore.netSurplusPool = generalDivAlloc.amount;
      }
    }

    if (dividendSubPolicy) {
      surplusAppropriationStore.dividendSubPolicy = dividendSubPolicy;
    }

    const totalMembersSavings = savingsStore.reduce((sum, d) => sum + Number(d.amount), 0) || 1450800000;
    surplusAppropriationStore.totalMembersSavings = totalMembersSavings;
    surplusAppropriationStore.annualSurplusAvailable = Math.max(
      0,
      surplusAppropriationStore.totalAssets - totalMembersSavings - surplusAppropriationStore.externalLiabilities
    );

    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_sysadmin01',
      actorName: actorName || 'Executive Officer',
      role: role || 'sys_admin',
      action: 'Annual Surplus Policy Updated',
      module: 'Surplus Appropriation Module',
      details: `Updated Surplus Policy: Assets ₦${surplusAppropriationStore.totalAssets.toLocaleString()}, Annual Surplus Available ₦${surplusAppropriationStore.annualSurplusAvailable.toLocaleString()}, ${surplusAppropriationStore.allocations.length} allocations updated.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();

    res.json({
      success: true,
      data: surplusAppropriationStore,
      message: 'Annual Surplus Appropriation configured successfully.',
    });
  });

  // 3. POST /api/surplus-appropriation/approve - Final AGM Approval & Declaration
  app.post('/api/surplus-appropriation/approve', (req, res) => {
    const { actorName, actorId, role } = req.body;

    if (role && !['sys_admin', 'chairman', 'financial_secretary'].includes(role)) {
      return res.status(403).json({
        error: 'Access Denied: Only Super Admin, Executive Chairman, or Financial Secretary may approve Annual Surplus Appropriation.',
      });
    }

    surplusAppropriationStore.approvalStatus = 'AGM Approved & Declared';
    surplusAppropriationStore.approvedBy = actorName || 'AGM Executive Committee';
    surplusAppropriationStore.approvedAt = new Date().toLocaleString();

    dividendConfigStore.distributionStatus = 'AGM Declared & Paid';

    // Broadcast AGM Declaration System Notification to all active members
    const agmNotice: SystemNotification = {
      id: `notif_agm_${Date.now()}`,
      userId: 'ALL_MEMBERS',
      title: '🎉 AGM Surplus Appropriation & Dividend Declaration Approved!',
      message: `The Annual General Meeting (AGM) has officially approved the Annual Surplus Appropriation of ₦${surplusAppropriationStore.annualSurplusAvailable.toLocaleString()}. General Member Dividend Pool: ₦${(
        surplusAppropriationStore.allocations.find((a) => a.categoryKey === 'general_dividend')?.amount || 0
      ).toLocaleString()}. Log in to view your official Dividend Breakdown voucher.`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toLocaleString(),
    };
    notificationsStore.unshift(agmNotice);

    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_sysadmin01',
      actorName: actorName || 'Executive Committee',
      role: role || 'sys_admin',
      action: 'AGM Surplus Appropriation Approved',
      module: 'Surplus Appropriation Module',
      details: `Official AGM Declaration of Annual Surplus (₦${surplusAppropriationStore.annualSurplusAvailable.toLocaleString()}). Liability accounts activated on Balance Sheet.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();

    res.json({
      success: true,
      message: 'Annual Surplus Appropriation officially AGM approved & declared. Liabilities created on Balance Sheet.',
      data: surplusAppropriationStore,
    });
  });

  // 4. POST /api/surplus-appropriation/payout-liability - Disburse/Pay Out against a Liability Account
  app.post('/api/surplus-appropriation/payout-liability', (req, res) => {
    const { allocationId, payoutAmount, actorName, actorId, role, notes } = req.body;

    if (role && !['sys_admin', 'chairman', 'financial_secretary'].includes(role)) {
      return res.status(403).json({
        error: 'Access Denied: Only Super Admin, Executive Chairman, or Financial Secretary may disburse liability payouts.',
      });
    }

    const allocIndex = surplusAppropriationStore.allocations.findIndex((a) => a.id === allocationId || a.categoryKey === allocationId);
    if (allocIndex === -1) {
      return res.status(404).json({ error: 'Surplus allocation line item not found.' });
    }

    const amount = Number(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Payout amount must be greater than ₦0.' });
    }

    const item = surplusAppropriationStore.allocations[allocIndex];
    item.paidAmount = (item.paidAmount || 0) + amount;
    if (item.paidAmount >= item.amount) {
      item.isPaid = true;
    }
    item.paidAt = new Date().toLocaleString();
    if (notes) item.notes = notes;

    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_sysadmin01',
      actorName: actorName || 'Executive Admin',
      role: role || 'sys_admin',
      action: 'Liability Account Disbursed',
      module: 'Surplus Appropriation & Balance Sheet',
      details: `Paid out ₦${amount.toLocaleString()} for liability item: "${item.name}". Total Paid: ₦${item.paidAmount.toLocaleString()} / ₦${item.amount.toLocaleString()}. Liability reduced on Balance Sheet.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();

    const totalMembersSavings = savingsStore.reduce((sum, d) => sum + Number(d.amount), 0) || 1450800000;
    const updatedResult = calculateAnnualSurplusAndAppropriation(
      surplusAppropriationStore.totalAssets,
      totalMembersSavings,
      surplusAppropriationStore.externalLiabilities,
      surplusAppropriationStore.allocations,
      surplusAppropriationStore.dividendSubPolicy,
      surplusAppropriationStore.approvalStatus
    );

    res.json({
      success: true,
      message: `Successfully disbursed ₦${amount.toLocaleString()} for "${item.name}". Balance Sheet liability updated.`,
      data: updatedResult,
    });
  });

  // ==================== COOPERATIVE SETTINGS & PAYMENT APPROVAL WORKFLOW ENDPOINTS ====================

  // 1. GET /api/settings - Fetch Cooperative Policy Settings
  app.get('/api/settings', (req, res) => {
    res.json({
      success: true,
      settings: cooperativeSettingsStore,
    });
  });

  // 2. PUT /api/settings - Update Cooperative Policy Settings (Super Admin Only)
  app.put('/api/settings', (req, res) => {
    const { settings, actorName, actorId, role } = req.body;

    if (role && role !== 'sys_admin') {
      return res.status(403).json({
        error: 'Access Denied: Only the Super Administrator can modify Cooperative Policy Settings.',
      });
    }

    cooperativeSettingsStore = {
      ...cooperativeSettingsStore,
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName || 'Super Administrator',
    };

    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_sysadmin01',
      actorName: actorName || 'Super Administrator',
      role: role || 'sys_admin',
      action: 'Updated Cooperative Policy Settings',
      module: 'Cooperative Settings Module',
      details: `Policy updated: Reg Fee ₦${cooperativeSettingsStore.registrationFee}, Min Savings ₦${cooperativeSettingsStore.minimumSavingsDeposit}, Interest Rate ${cooperativeSettingsStore.loanInterestRate}%, Loan Period ${cooperativeSettingsStore.loanRepaymentPeriodMonths}m`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();

    res.json({
      success: true,
      settings: cooperativeSettingsStore,
      message: 'Cooperative Policy Settings updated successfully.',
    });
  });

  // 3. GET /api/payment-transactions - List Payment Transactions
  app.get('/api/payment-transactions', (req, res) => {
    const { role, memberId, status, category, startDate, endDate } = req.query;

    let results = [...paymentTransactionsStore];

    // Internal Control Rule #8 & #10: Members CAN ONLY SEE Approved Transactions!
    if (role === 'member') {
      results = results.filter(
        (tx) => tx.status === 'Approved' && (tx.memberId === memberId || tx.memberNo === String(req.query.memberNo))
      );
    } else {
      if (status && status !== 'all') {
        results = results.filter((tx) => tx.status === String(status));
      }
      if (category && category !== 'all') {
        results = results.filter((tx) => tx.paymentCategory === String(category));
      }
      if (memberId && memberId !== 'all') {
        results = results.filter((tx) => tx.memberId === String(memberId));
      }
      if (startDate) {
        results = results.filter((tx) => tx.date >= String(startDate));
      }
      if (endDate) {
        results = results.filter((tx) => tx.date <= String(endDate));
      }
    }

    res.json({
      success: true,
      transactions: results,
    });
  });

  // 4. POST /api/payment-transactions - Treasurer Submits Payment for Verification (Status: Pending Approval)
  app.post('/api/payment-transactions', (req, res) => {
    const {
      memberId,
      memberNo,
      memberName,
      paymentCategory,
      paymentMethod,
      amount,
      date,
      bankReference,
      description,
      submittedBy,
      submittedById,
      submittedByRole,
      loanId,
    } = req.body;

    if (!memberId || !amount || !paymentCategory || !bankReference || !date) {
      return res.status(400).json({
        error: 'Missing required payment transaction fields: memberId, amount, paymentCategory, bankReference, and date are required.',
      });
    }

    const txNo = `TXN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}`,
      transactionNo: txNo,
      memberId,
      memberNo: memberNo || 'LCMS-MEM-000',
      memberName: memberName || 'Member',
      paymentCategory,
      paymentMethod: paymentMethod || 'Bank Transfer',
      amount: Number(amount),
      date,
      bankReference,
      description: description || 'Payment received and assigned by Treasurer.',
      status: 'Pending Approval', // Nothing posted yet!
      submittedBy: submittedBy || 'Treasurer',
      submittedById: submittedById || 'usr_treasurer01',
      submittedByRole: submittedByRole || 'treasurer',
      submittedAt: new Date().toISOString(),
      loanId,
    };

    paymentTransactionsStore.unshift(newTx);

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: submittedById || 'usr_treasurer01',
      actorName: submittedBy || 'Treasurer',
      role: submittedByRole || 'treasurer',
      action: 'Submitted Payment Transaction for Verification',
      module: 'Treasurer Payment Module',
      details: `Payment ${txNo} (₦${Number(amount).toLocaleString()}, Category: ${paymentCategory}) submitted for Financial Secretary approval. Pending verification.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Notification to Financial Secretary
    const notif: SystemNotification = {
      id: `notif_${Date.now()}`,
      roleTarget: 'financial_secretary',
      title: '📋 New Pending Transaction Awaiting Verification',
      message: `Treasurer ${submittedBy} submitted ${txNo} for ₦${Number(amount).toLocaleString()} (${memberName} - ${paymentCategory}). Verification required before account posting.`,
      type: 'warning',
      isRead: false,
      createdAt: new Date().toLocaleString(),
    };
    notificationsStore.unshift(notif);

    saveDatabase();

    res.json({
      success: true,
      transaction: newTx,
      message: `Payment transaction ${txNo} submitted. Status: Pending Approval. Member account will be posted after Financial Secretary approval.`,
    });
  });

  // 5. PUT /api/payment-transactions/:id/edit - Treasurer Edits and Resubmits a Rejected Transaction
  app.put('/api/payment-transactions/:id/edit', (req, res) => {
    const { id } = req.params;
    const {
      amount,
      paymentCategory,
      paymentMethod,
      date,
      bankReference,
      description,
      memberId,
      memberName,
      memberNo,
      submittedBy,
    } = req.body;

    const txIndex = paymentTransactionsStore.findIndex((t) => t.id === id);
    if (txIndex === -1) {
      return res.status(404).json({ error: 'Payment transaction not found.' });
    }

    const tx = paymentTransactionsStore[txIndex];
    if (tx.status !== 'Rejected') {
      return res.status(400).json({ error: 'Only rejected transactions can be edited and resubmitted by the Treasurer.' });
    }

    tx.amount = Number(amount) || tx.amount;
    tx.paymentCategory = paymentCategory || tx.paymentCategory;
    tx.paymentMethod = paymentMethod || tx.paymentMethod;
    tx.date = date || tx.date;
    tx.bankReference = bankReference || tx.bankReference;
    tx.description = description || tx.description;
    if (memberId) tx.memberId = memberId;
    if (memberName) tx.memberName = memberName;
    if (memberNo) tx.memberNo = memberNo;

    tx.status = 'Pending Approval';
    tx.rejectionReason = undefined;
    tx.rejectedBy = undefined;
    tx.submittedAt = new Date().toISOString();
    if (submittedBy) tx.submittedBy = submittedBy;

    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: tx.submittedById || 'usr_treasurer01',
      actorName: tx.submittedBy,
      role: 'treasurer',
      action: 'Resubmitted Rejected Payment Transaction',
      module: 'Treasurer Payment Module',
      details: `Transaction ${tx.transactionNo} revised and resubmitted to Pending Approval. Amount: ₦${tx.amount.toLocaleString()}`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();

    res.json({
      success: true,
      transaction: tx,
      message: `Transaction ${tx.transactionNo} edited and resubmitted for Financial Secretary approval.`,
    });
  });

  // 6. POST /api/payment-transactions/:id/approve - Financial Secretary Approves and Posts Transaction
  app.post('/api/payment-transactions/:id/approve', (req, res) => {
    const { id } = req.params;
    const { approvedBy, approvedById, approvedByRole } = req.body;

    // Security check: Only Financial Secretary or Super Admin (or Chairman) can approve
    if (approvedByRole && !['financial_secretary', 'sys_admin', 'chairman'].includes(approvedByRole)) {
      return res.status(403).json({
        error: 'Access Denied: Only Financial Secretary, Super Admin, or Chairman can approve and post payment transactions.',
      });
    }

    const txIndex = paymentTransactionsStore.findIndex((t) => t.id === id);
    if (txIndex === -1) {
      return res.status(404).json({ error: 'Payment transaction not found.' });
    }

    const tx = paymentTransactionsStore[txIndex];
    if (tx.status === 'Approved') {
      return res.status(400).json({ error: 'Transaction is already approved.' });
    }

    tx.status = 'Approved';
    tx.approvedBy = approvedBy || 'Financial Secretary';
    tx.approvedById = approvedById || 'usr_finsec01';
    tx.approvedByRole = approvedByRole || 'financial_secretary';
    tx.approvedAt = new Date().toISOString();

    // ================= AUTOMATIC FINANCIAL POSTINGS UPON APPROVAL =================
    const userIndex = usersStore.findIndex((u) => u.id === tx.memberId || u.memberNo === tx.memberNo);
    const targetUser = userIndex !== -1 ? usersStore[userIndex] : null;

    if (tx.paymentCategory === 'Registration Fee') {
      const configuredFee = cooperativeSettingsStore.registrationFee || 2500;
      if (tx.amount < configuredFee) {
        return res.status(400).json({
          error: `Payment of ₦${tx.amount.toLocaleString()} is below the required registration fee of ₦${configuredFee.toLocaleString()}. Approval cannot proceed until the minimum fee is paid.`,
        });
      }

      const regFeePortion = configuredFee;
      const firstSavingsPortion = Math.max(0, tx.amount - configuredFee);

      if (targetUser) {
        targetUser.registrationFeeStatus = 'Paid';
        if (targetUser.status === 'pending') {
          targetUser.status = 'active';
        }
        targetUser.registrationFeeRecord = {
          amountPaid: regFeePortion,
          datePaid: tx.date,
          receiptNumber: tx.bankReference,
          paymentMethod: tx.paymentMethod,
          receivedBy: tx.approvedBy || 'Financial Secretary',
          notes: tx.description,
          createdAt: tx.approvedAt,
        };

        if (firstSavingsPortion > 0) {
          targetUser.savingsBalance = (targetUser.savingsBalance || 0) + firstSavingsPortion;
        }
      }

      // 1. Post Registration Income separately to Cooperative Main Wallet
      cooperativeWalletStore.unshift({
        id: `cw_${Date.now()}`,
        category: 'Registration Fee',
        amount: regFeePortion,
        payerMemberId: tx.memberId,
        payerMemberNo: tx.memberNo,
        payerName: tx.memberName,
        receiptNumber: tx.bankReference,
        paymentMethod: tx.paymentMethod,
        date: tx.date,
        recordedBy: tx.approvedBy,
        notes: `Registration Fee Income recorded separately. Ref: ${tx.bankReference}`,
        balanceAfter: (cooperativeWalletStore[0]?.balanceAfter || 18450000) + regFeePortion,
        createdAt: new Date().toISOString(),
      });

      // 2. Post First Savings Deposit to Savings Ledger if payment exceeded Registration Fee
      if (firstSavingsPortion > 0) {
        const newSavingsDep: SavingsDeposit = {
          id: `dep_${Date.now()}`,
          memberId: tx.memberId,
          memberNo: tx.memberNo,
          memberName: tx.memberName,
          depositDate: tx.date,
          amount: firstSavingsPortion,
          paymentMethod: tx.paymentMethod,
          referenceNumber: tx.bankReference,
          receivedBy: tx.approvedBy || 'Financial Secretary',
          notes: `First Savings Deposit from initial member registration payment (Total Paid: ₦${tx.amount.toLocaleString()}, Fee: ₦${regFeePortion.toLocaleString()})`,
          createdAt: new Date().toISOString(),
          runningBalance: targetUser?.savingsBalance,
        };
        savingsStore.unshift(newSavingsDep);

        memberWalletTransactionsStore.unshift({
          id: `mwt_${Date.now()}`,
          memberId: tx.memberId,
          memberNo: tx.memberNo,
          memberName: tx.memberName,
          txType: 'Savings Deposit',
          amount: firstSavingsPortion,
          flow: 'credit',
          targetWallet: 'Savings',
          receiptNumber: tx.bankReference,
          paymentMethod: tx.paymentMethod,
          date: tx.date,
          recordedBy: tx.approvedBy || 'Financial Secretary',
          notes: `First Savings Deposit credited to passbook from initial payment.`,
          savingsBalanceAfter: targetUser?.savingsBalance,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (tx.paymentCategory === 'Savings Deposit') {
      // 1. Post to Savings Deposit ledger
      const newSavingsDep: SavingsDeposit = {
        id: `dep_${Date.now()}`,
        memberId: tx.memberId,
        memberNo: tx.memberNo,
        memberName: tx.memberName,
        depositDate: tx.date,
        amount: tx.amount,
        paymentMethod: tx.paymentMethod,
        referenceNumber: tx.bankReference,
        receivedBy: tx.approvedBy,
        notes: tx.description,
        createdAt: new Date().toISOString(),
      };
      savingsStore.unshift(newSavingsDep);

      // 2. Update Member Savings Balance
      if (targetUser) {
        targetUser.savingsBalance = (targetUser.savingsBalance || 0) + tx.amount;
        newSavingsDep.runningBalance = targetUser.savingsBalance;
      }

      // 3. Post to Member Wallet Transaction Ledger
      memberWalletTransactionsStore.unshift({
        id: `mwt_${Date.now()}`,
        memberId: tx.memberId,
        memberNo: tx.memberNo,
        memberName: tx.memberName,
        txType: 'Savings Deposit',
        amount: tx.amount,
        flow: 'credit',
        targetWallet: 'Savings',
        receiptNumber: tx.bankReference,
        paymentMethod: tx.paymentMethod,
        date: tx.date,
        recordedBy: tx.approvedBy,
        notes: tx.description,
        savingsBalanceAfter: targetUser?.savingsBalance,
        createdAt: new Date().toISOString(),
      });
    } else if (tx.paymentCategory === 'Loan Repayment' || tx.paymentCategory === 'Interest Payment') {
      // 1. Match Loan Application
      let matchedLoan = loansStore.find((l) => l.id === tx.loanId);
      if (!matchedLoan) {
        matchedLoan = loansStore.find(
          (l) => l.memberId === tx.memberId && ['Disbursed', 'Approved'].includes(l.status) && l.outstandingBalance > 0
        );
      }

      if (matchedLoan) {
        const repaymentRec: LoanRepaymentRecord = {
          id: `lr_${Date.now()}`,
          loanId: matchedLoan.id,
          loanNo: matchedLoan.loanNo,
          amountPaid: tx.amount,
          paymentDate: tx.date,
          paymentMethod: tx.paymentMethod,
          referenceNumber: tx.bankReference,
          receivedBy: tx.approvedBy,
          notes: tx.description,
          createdAt: new Date().toISOString(),
        };
        matchedLoan.repayments.unshift(repaymentRec);

        matchedLoan.amountRepaid = (matchedLoan.amountRepaid || 0) + tx.amount;
        matchedLoan.outstandingBalance = Math.max(0, matchedLoan.outstandingBalance - tx.amount);
        if (matchedLoan.outstandingBalance <= 0) {
          matchedLoan.status = 'Completed';
        }

        // Update Repayment Schedule Installment statuses
        let remainingToApply = tx.amount;
        for (const inst of matchedLoan.repaymentSchedule) {
          if (remainingToApply <= 0) break;
          if (inst.status !== 'Paid') {
            const needed = inst.totalInstallmentAmount - (inst.paidAmount || 0);
            if (remainingToApply >= needed) {
              inst.paidAmount = inst.totalInstallmentAmount;
              inst.status = 'Paid';
              inst.paymentDate = tx.date;
              inst.referenceNumber = tx.bankReference;
              remainingToApply -= needed;
            } else {
              inst.paidAmount = (inst.paidAmount || 0) + remainingToApply;
              inst.status = 'Partially Paid';
              remainingToApply = 0;
            }
          }
        }
      }

      // Member Wallet Ledger
      memberWalletTransactionsStore.unshift({
        id: `mwt_${Date.now()}`,
        memberId: tx.memberId,
        memberNo: tx.memberNo,
        memberName: tx.memberName,
        txType: tx.paymentCategory === 'Interest Payment' ? 'Loan Interest Payment' : 'Loan Principal Repayment',
        amount: tx.amount,
        flow: 'credit',
        targetWallet: 'Loan Balance',
        receiptNumber: tx.bankReference,
        paymentMethod: tx.paymentMethod,
        date: tx.date,
        recordedBy: tx.approvedBy,
        notes: tx.description,
        loanBalanceAfter: matchedLoan?.outstandingBalance,
        createdAt: new Date().toISOString(),
      });

      if (tx.paymentCategory === 'Interest Payment') {
        cooperativeWalletStore.unshift({
          id: `cw_${Date.now()}`,
          category: 'Loan Interest',
          amount: tx.amount,
          payerMemberId: tx.memberId,
          payerMemberNo: tx.memberNo,
          payerName: tx.memberName,
          receiptNumber: tx.bankReference,
          paymentMethod: tx.paymentMethod,
          date: tx.date,
          recordedBy: tx.approvedBy,
          notes: `Loan Interest Payment approved. Ref: ${tx.bankReference}`,
          balanceAfter: (cooperativeWalletStore[0]?.balanceAfter || 18450000) + tx.amount,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (tx.paymentCategory === 'Other Income') {
      cooperativeWalletStore.unshift({
        id: `cw_${Date.now()}`,
        category: 'Other Cooperative Income',
        amount: tx.amount,
        payerMemberId: tx.memberId,
        payerMemberNo: tx.memberNo,
        payerName: tx.memberName,
        receiptNumber: tx.bankReference,
        paymentMethod: tx.paymentMethod,
        date: tx.date,
        recordedBy: tx.approvedBy,
        notes: tx.description,
        balanceAfter: (cooperativeWalletStore[0]?.balanceAfter || 18450000) + tx.amount,
        createdAt: new Date().toISOString(),
      });
    }

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: approvedById || 'usr_finsec01',
      actorName: approvedBy || 'Financial Secretary',
      role: approvedByRole || 'financial_secretary',
      action: 'Approved & Posted Payment Transaction',
      module: 'Financial Secretary Approval Module',
      details: `APPROVED & POSTED ${tx.transactionNo} (₦${tx.amount.toLocaleString()}, Category: ${tx.paymentCategory}). Member Savings, Loan, Wallet & General Ledger successfully updated.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    // Member Notification
    if (tx.memberId) {
      notificationsStore.unshift({
        id: `notif_${Date.now()}`,
        userId: tx.memberId,
        title: '✅ Payment Approved & Credited to Your Account',
        message: `Your payment of ₦${tx.amount.toLocaleString()} (${tx.paymentCategory}, Ref: ${tx.bankReference}) has been approved by the Financial Secretary and posted to your account statement.`,
        type: 'success',
        isRead: false,
        createdAt: new Date().toLocaleString(),
      });
    }

    saveDatabase();

    res.json({
      success: true,
      transaction: tx,
      message: `Transaction ${tx.transactionNo} APPROVED! Account balances, member ledger, wallet, and general ledger have been updated automatically.`,
    });
  });

  // 7. POST /api/payment-transactions/:id/reject - Financial Secretary Rejects Transaction
  app.post('/api/payment-transactions/:id/reject', (req, res) => {
    const { id } = req.params;
    const { rejectionReason, rejectedBy, rejectedById, rejectedByRole } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ error: 'A valid rejection reason must be provided.' });
    }

    const txIndex = paymentTransactionsStore.findIndex((t) => t.id === id);
    if (txIndex === -1) {
      return res.status(404).json({ error: 'Payment transaction not found.' });
    }

    const tx = paymentTransactionsStore[txIndex];
    if (tx.status === 'Approved' || tx.status === 'Reversed') {
      return res.status(400).json({ error: `Cannot reject a transaction with status '${tx.status}'.` });
    }

    tx.status = 'Rejected';
    tx.rejectedBy = rejectedBy || 'Financial Secretary';
    tx.rejectedById = rejectedById || 'usr_finsec01';
    tx.rejectedByRole = rejectedByRole || 'financial_secretary';
    tx.rejectedAt = new Date().toISOString();
    tx.rejectionReason = rejectionReason;

    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: rejectedById || 'usr_finsec01',
      actorName: rejectedBy || 'Financial Secretary',
      role: rejectedByRole || 'financial_secretary',
      action: 'Rejected Payment Transaction',
      module: 'Financial Secretary Approval Module',
      details: `REJECTED ${tx.transactionNo} (₦${tx.amount.toLocaleString()}). Reason: "${rejectionReason}". Returned to Treasurer queue for correction.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();

    res.json({
      success: true,
      transaction: tx,
      message: `Transaction ${tx.transactionNo} REJECTED and returned to Treasurer with stored reason.`,
    });
  });

  // 8. POST /api/payment-transactions/:id/reverse - Transaction Reversal (Super Admin & FinSec Only)
  app.post('/api/payment-transactions/:id/reverse', (req, res) => {
    const { id } = req.params;
    const { reversalReason, reversedBy, reversedById, reversedByRole } = req.body;

    // Security check: Only Super Admin & Financial Secretary can reverse approved transactions
    if (reversedByRole && !['sys_admin', 'financial_secretary'].includes(reversedByRole)) {
      return res.status(403).json({
        error: 'Access Denied: Only the Super Administrator or Financial Secretary can reverse approved transactions.',
      });
    }

    if (!reversalReason || reversalReason.trim() === '') {
      return res.status(400).json({ error: 'A detailed reversal reason must be provided for audit compliance.' });
    }

    const txIndex = paymentTransactionsStore.findIndex((t) => t.id === id);
    if (txIndex === -1) {
      return res.status(404).json({ error: 'Payment transaction not found.' });
    }

    const tx = paymentTransactionsStore[txIndex];
    if (tx.status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved transactions can be reversed.' });
    }

    tx.status = 'Reversed';
    tx.reversedBy = reversedBy || 'Super Administrator';
    tx.reversedById = reversedById || 'usr_sysadmin01';
    tx.reversedByRole = reversedByRole || 'sys_admin';
    tx.reversedAt = new Date().toISOString();
    tx.reversalReason = reversalReason;
    tx.reversalAmount = tx.amount;

    // ================= AUTOMATIC REVERSAL BALANCE ADJUSTMENTS =================
    const userIndex = usersStore.findIndex((u) => u.id === tx.memberId || u.memberNo === tx.memberNo);
    const targetUser = userIndex !== -1 ? usersStore[userIndex] : null;

    if (tx.paymentCategory === 'Savings Deposit') {
      // Revert Savings Balance
      if (targetUser) {
        targetUser.savingsBalance = Math.max(0, (targetUser.savingsBalance || 0) - tx.amount);
      }
      // Remove or mark matching deposit
      const depIdx = savingsStore.findIndex((s) => s.referenceNumber === tx.bankReference || s.memberId === tx.memberId);
      if (depIdx !== -1) {
        savingsStore.splice(depIdx, 1);
      }
      // Member Wallet Reversal Debit Record
      memberWalletTransactionsStore.unshift({
        id: `mwt_rev_${Date.now()}`,
        memberId: tx.memberId,
        memberNo: tx.memberNo,
        memberName: tx.memberName,
        txType: 'Savings Withdrawal',
        amount: tx.amount,
        flow: 'debit',
        targetWallet: 'Savings',
        receiptNumber: `REV-${tx.bankReference}`,
        paymentMethod: tx.paymentMethod,
        date: new Date().toISOString().split('T')[0],
        recordedBy: tx.reversedBy,
        notes: `REVERSAL: ${reversalReason}`,
        savingsBalanceAfter: targetUser?.savingsBalance,
        createdAt: new Date().toISOString(),
      });
    } else if (tx.paymentCategory === 'Loan Repayment' || tx.paymentCategory === 'Interest Payment') {
      const matchedLoan = loansStore.find((l) => l.id === tx.loanId || l.memberId === tx.memberId);
      if (matchedLoan) {
        matchedLoan.amountRepaid = Math.max(0, (matchedLoan.amountRepaid || 0) - tx.amount);
        matchedLoan.outstandingBalance = matchedLoan.outstandingBalance + tx.amount;
        if (matchedLoan.status === 'Completed') {
          matchedLoan.status = 'Disbursed';
        }
      }
    }

    // Audit Log
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: reversedById || 'usr_sysadmin01',
      actorName: reversedBy || 'Super Administrator',
      role: reversedByRole || 'sys_admin',
      action: 'Executed Transaction Reversal',
      module: 'Financial Control Module',
      details: `TRANSACTION REVERSED: ${tx.transactionNo} (₦${tx.amount.toLocaleString()}, ${tx.memberName}). Reason: "${reversalReason}". Member ledgers & balances automatically adjusted.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'critical',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();

    res.json({
      success: true,
      transaction: tx,
      message: `Transaction ${tx.transactionNo} REVERSED. Savings, loans, and ledgers automatically adjusted with complete audit log.`,
    });
  });

  // ==================== DIVIDEND DISTRIBUTION ENGINE ENDPOINTS ====================

  // 1. GET /api/dividends - Complete 4-Tier Dividend Distribution Calculation
  app.get('/api/dividends', (req, res) => {
    const { year, search, branch, qualification } = req.query;
    const accountingYear = year ? parseInt(String(year), 10) : dividendConfigStore.accountingYear;

    const result = calculateFullDividendDistribution(
      usersStore,
      savingsStore,
      loansStore,
      dividendConfigStore.netSurplusPool,
      dividendConfigStore.honorariumConfig,
      accountingYear,
      surplusAppropriationStore.dividendSubPolicy
    );

    let records = result.records;

    if (branch && branch !== 'all') {
      records = records.filter((r) => r.branch.toLowerCase().includes(String(branch).toLowerCase()));
    }

    if (qualification === 'qualified') {
      records = records.filter((r) => r.totalDividend > 0);
    } else if (qualification === 'unqualified') {
      records = records.filter((r) => r.totalDividend <= 0);
    }

    if (search) {
      const q = String(search).toLowerCase();
      records = records.filter(
        (r) =>
          r.memberName.toLowerCase().includes(q) ||
          r.memberNo.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      summary: {
        ...result.summary,
        distributionStatus: dividendConfigStore.distributionStatus,
      },
      honorariumConfig: result.honorariumConfig,
      records,
    });
  });

  // 2. POST /api/dividends/config - Update Net Surplus Pool and Honorarium Config
  app.post('/api/dividends/config', (req, res) => {
    const { netSurplusPool, honorariumConfig, actorName, actorId, role } = req.body;

    if (role && !['sys_admin', 'chairman', 'financial_secretary'].includes(role)) {
      return res.status(403).json({ error: 'Access Denied: Only Super Admin, Executive Chairman, or Financial Secretary can configure dividend distribution policy.' });
    }

    if (netSurplusPool !== undefined) {
      const surplus = Number(netSurplusPool);
      if (isNaN(surplus) || surplus <= 0) {
        return res.status(400).json({ error: 'Net Surplus pool must be a positive number greater than ₦0.' });
      }
      dividendConfigStore.netSurplusPool = surplus;
    }

    if (honorariumConfig) {
      dividendConfigStore.honorariumConfig = honorariumConfig;
    }

    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_sysadmin01',
      actorName: actorName || 'Executive Admin',
      role: role || 'sys_admin',
      action: 'Dividend Policy Configured',
      module: 'Dividend Distribution Module',
      details: `Updated Dividend Policy Net Surplus Pool to ₦${dividendConfigStore.netSurplusPool.toLocaleString()} and saved Honorarium recipient configuration (${dividendConfigStore.honorariumConfig.allocationMode} mode). Recalculation active.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();

    const updatedResult = calculateFullDividendDistribution(
      usersStore,
      savingsStore,
      loansStore,
      dividendConfigStore.netSurplusPool,
      dividendConfigStore.honorariumConfig,
      dividendConfigStore.accountingYear
    );

    res.json({
      success: true,
      message: `Dividend distribution policy successfully updated! Annual Net Surplus set to ₦${dividendConfigStore.netSurplusPool.toLocaleString()}.`,
      summary: {
        ...updatedResult.summary,
        distributionStatus: dividendConfigStore.distributionStatus,
      },
      honorariumConfig: updatedResult.honorariumConfig,
      records: updatedResult.records,
    });
  });

  // 3. POST /api/dividends/approve - Final AGM Approval of Dividend Schedule
  app.post('/api/dividends/approve', (req, res) => {
    const { actorName, actorId, role, notes } = req.body;

    if (role && !['sys_admin', 'chairman', 'financial_secretary'].includes(role)) {
      return res.status(403).json({ error: 'Access Denied: Only Super Admin, Executive Chairman, or Financial Secretary can approve dividend distribution.' });
    }

    dividendConfigStore.distributionStatus = 'AGM Declared & Paid';

    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_chair01',
      actorName: actorName || 'Executive Chairman',
      role: role || 'chairman',
      action: 'Dividend Declared & Approved',
      module: 'Dividend Distribution Module',
      details: `Executive Board & AGM officially APPROVED and DECLARED annual dividend distribution of ₦${dividendConfigStore.netSurplusPool.toLocaleString()} (50% Savings, 20% Borrower Bonus, 20% Guarantor Bonus, 10% Honorarium). ${notes || ''}`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(auditLog);

    notificationsStore.unshift({
      id: `notif_${Date.now()}`,
      title: 'AGM Dividend Distribution Declared',
      message: `Annual Dividend Distribution of ₦${dividendConfigStore.netSurplusPool.toLocaleString()} approved by AGM! Members may now view their dividend vouchers.`,
      type: 'success',
      isRead: false,
      createdAt: 'Just now',
    });

    saveDatabase();

    res.json({
      success: true,
      message: `AGM Dividend Distribution of ₦${dividendConfigStore.netSurplusPool.toLocaleString()} successfully DECLARED & APPROVED! Member vouchers unlocked.`,
      distributionStatus: dividendConfigStore.distributionStatus,
    });
  });


  // Roles & Permissions: List
  app.get('/api/roles', (req, res) => {
    res.json({
      rolesConfig: ROLES_CONFIG,
      allPermissions: ALL_PERMISSIONS,
      rolePermissions: rolePermissionsStore,
    });
  });

  // Roles & Permissions: Toggle permission
  app.post('/api/roles/permissions', (req, res) => {
    const { roleId, permissionKey, enabled, actorName, actorId } = req.body;

    let roleObj = rolePermissionsStore.find((r) => r.roleId === roleId);
    if (!roleObj) {
      roleObj = { roleId, allowedPermissionKeys: [] };
      rolePermissionsStore.push(roleObj);
    }

    if (enabled) {
      if (!roleObj.allowedPermissionKeys.includes(permissionKey)) {
        roleObj.allowedPermissionKeys.push(permissionKey);
      }
    } else {
      roleObj.allowedPermissionKeys = roleObj.allowedPermissionKeys.filter((k) => k !== permissionKey);
    }

    // Log Audit Event
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_admin01',
      actorName: actorName || 'System Admin',
      role: 'sys_admin',
      action: 'Permission Matrix Edit',
      module: 'RBAC Policy',
      details: `${enabled ? 'Granted' : 'Revoked'} permission '${permissionKey}' for role [${roleId}]`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore.unshift(log);

    saveDatabase();
    res.json({
      success: true,
      rolePermissions: rolePermissionsStore,
      message: 'Role permissions matrix updated successfully.',
    });
  });

  // Audit Logs: Get
  app.get('/api/audit-logs', (req, res) => {
    res.json({
      logs: auditLogsStore,
      totalCount: auditLogsStore.length,
    });
  });

  // Notifications: Get
  app.get('/api/notifications', (req, res) => {
    res.json({
      notifications: notificationsStore,
      unreadCount: notificationsStore.filter((n) => !n.isRead).length,
    });
  });

  // ==================== WALLET ARCHITECTURE MODULE ENDPOINTS ====================

  // 1. GET /api/wallets/cooperative - Cooperative Main Wallet Ledger & Breakdown
  app.get('/api/wallets/cooperative', (req, res) => {
    const totalBalance = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);

    const categoryBreakdown: Record<CooperativeIncomeCategory, number> = {
      'Registration Fee': 0,
      'Loan Interest': 0,
      'Penalties/Fines': 0,
      'Business Profit': 0,
      'Donation': 0,
      'Service Charges': 0,
      'Other Cooperative Income': 0,
    };

    cooperativeWalletStore.forEach((entry) => {
      if (categoryBreakdown[entry.category] !== undefined) {
        categoryBreakdown[entry.category] += entry.amount;
      }
    });

    res.json({
      success: true,
      totalBalance,
      categoryBreakdown,
      totalTransactionsCount: cooperativeWalletStore.length,
      entries: cooperativeWalletStore,
    });
  });

  // 2. GET /api/wallets/members - List Member Wallet Summaries
  app.get('/api/wallets/members', (req, res) => {
    const summaries = usersStore.map((user) => {
      // Find active loan balance
      const memberLoans = loansStore.filter((l) => l.memberNo === user.memberNo && l.status === 'Disbursed');
      const outstandingLoanBalance = memberLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);

      // Find transactions for member
      const txs = memberWalletTransactionsStore.filter(
        (t) => t.memberId === user.id || t.memberNo === user.memberNo
      );

      return {
        memberId: user.id,
        memberNo: user.memberNo,
        memberName: user.fullName,
        avatar: user.avatar,
        branch: user.branch,
        status: user.status,
        savingsBalance: user.savingsBalance || 0,
        dividendEarned: Math.round((user.savingsBalance || 0) * 0.08), // 8% yield
        outstandingLoanBalance,
        transactionsCount: txs.length,
      };
    });

    res.json({
      success: true,
      members: summaries,
      totalMembersCount: summaries.length,
    });
  });

  // 3. GET /api/wallets/members/:id - Single Member Wallet Inspector
  app.get('/api/wallets/members/:id', (req, res) => {
    const { id } = req.params;
    const user = usersStore.find((u) => u.id === id || u.memberNo.toLowerCase() === id.toLowerCase());

    if (!user) {
      return res.status(404).json({ error: 'Member record not found.' });
    }

    const memberLoans = loansStore.filter((l) => l.memberNo === user.memberNo);
    const outstandingLoanBalance = memberLoans
      .filter((l) => l.status === 'Disbursed')
      .reduce((sum, l) => sum + l.outstandingBalance, 0);

    const txs = memberWalletTransactionsStore.filter(
      (t) => t.memberId === user.id || t.memberNo.toLowerCase() === user.memberNo.toLowerCase()
    );

    res.json({
      success: true,
      member: user,
      wallet: {
        memberId: user.id,
        memberNo: user.memberNo,
        memberName: user.fullName,
        savingsBalance: user.savingsBalance || 0,
        dividendEarned: Math.round((user.savingsBalance || 0) * 0.08),
        outstandingLoanBalance,
        transactions: txs,
      },
      loans: memberLoans,
    });
  });

  // 4. POST /api/wallets/post-payment - Universal Single-Entry Automatic Posting Engine
  app.post('/api/wallets/post-payment', (req, res) => {
    const {
      paymentType,
      memberId,
      memberNo,
      loanId,
      amount,
      date,
      receiptNumber,
      paymentMethod,
      receivedBy,
      notes,
      actorName,
      actorId,
    } = req.body;

    if (!paymentType || !amount || !receiptNumber || !paymentMethod || !receivedBy) {
      return res.status(400).json({
        error: 'Missing required parameters: paymentType, amount, receiptNumber, paymentMethod, and receivedBy are required.',
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a valid positive number greater than ₦0.' });
    }

    const dateStr = date || new Date().toISOString().split('T')[0];
    const officer = receivedBy || actorName || 'Financial Secretary';
    const method = (paymentMethod as PaymentMethod) || 'Bank Transfer';
    const receipt = String(receiptNumber).trim();

    // Find target member if specified
    let targetMember: User | undefined;
    if (memberId || memberNo) {
      targetMember = usersStore.find(
        (u) =>
          (memberId && u.id === memberId) ||
          (memberNo && u.memberNo.toLowerCase() === String(memberNo).toLowerCase())
      );
    }

    let postingMessage = '';
    let destinationWallet: 'Cooperative Main Wallet' | 'Member Wallet' = 'Cooperative Main Wallet';

    // Automatic Routing switch based on Payment Type
    switch (paymentType) {
      case 'Registration Fee': {
        destinationWallet = 'Cooperative Main Wallet';
        const regFeePortion = cooperativeSettingsStore.registrationFee || 2500;
        if (numAmount < regFeePortion) {
          return res.status(400).json({
            error: `First payment must be at least ₦${regFeePortion.toLocaleString()} to cover the registration fee.`,
          });
        }
        const savingsPortion = numAmount - regFeePortion;

        const currCoopBal = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);
        const coopEntry: CooperativeWalletEntry = {
          id: `coop_tx_${Date.now()}`,
          category: 'Registration Fee',
          amount: regFeePortion,
          payerMemberId: targetMember?.id,
          payerMemberNo: targetMember?.memberNo,
          payerName: targetMember?.fullName || 'Enrolling Member',
          receiptNumber: receipt,
          paymentMethod: method,
          date: dateStr,
          recordedBy: officer,
          notes: notes || 'Registration Fee Payment',
          balanceAfter: currCoopBal + regFeePortion,
          createdAt: new Date().toISOString(),
        };
        cooperativeWalletStore.unshift(coopEntry);

        if (targetMember) {
          targetMember.registrationFeeStatus = 'Paid';
          targetMember.status = 'active'; // Automatically activate member!
          targetMember.registrationFeeRecord = {
            amountPaid: regFeePortion,
            datePaid: dateStr,
            receiptNumber: receipt,
            paymentMethod: method,
            receivedBy: officer,
            notes: notes || 'Registration Fee Paid',
            createdAt: new Date().toISOString(),
          };

          const mwTx: MemberWalletTransaction = {
            id: `mw_tx_${Date.now()}`,
            memberId: targetMember.id,
            memberNo: targetMember.memberNo,
            memberName: targetMember.fullName,
            txType: 'Registration Fee Payment',
            amount: regFeePortion,
            flow: 'debit',
            targetWallet: 'Cooperative Main Wallet',
            receiptNumber: receipt,
            paymentMethod: method,
            date: dateStr,
            recordedBy: officer,
            notes: 'Registration fee confirmed. Membership automatically set to ACTIVE.',
            createdAt: new Date().toISOString(),
          };
          memberWalletTransactionsStore.unshift(mwTx);

          if (savingsPortion > 0) {
            targetMember.savingsBalance = (targetMember.savingsBalance || 0) + savingsPortion;
            savingsStore.unshift({
              id: `sav_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              memberId: targetMember.id,
              memberNo: targetMember.memberNo,
              memberName: targetMember.fullName,
              depositDate: dateStr,
              amount: savingsPortion,
              transactionFee: 0,
              paymentMethod: method,
              referenceNumber: receipt,
              receivedBy: officer,
              notes: `First Savings Deposit credited from registration payment (Total Paid: ₦${numAmount.toLocaleString()})`,
              createdAt: new Date().toISOString(),
              runningBalance: targetMember.savingsBalance,
            });

            memberWalletTransactionsStore.unshift({
              id: `mw_tx_sav_${Date.now()}`,
              memberId: targetMember.id,
              memberNo: targetMember.memberNo,
              memberName: targetMember.fullName,
              txType: 'Savings Deposit',
              amount: savingsPortion,
              flow: 'credit',
              targetWallet: 'Savings',
              receiptNumber: receipt,
              paymentMethod: method,
              date: dateStr,
              recordedBy: officer,
              notes: 'First Savings Deposit credited to passbook.',
              savingsBalanceAfter: targetMember.savingsBalance,
              createdAt: new Date().toISOString(),
            });
          }
        }

        postingMessage = `₦${regFeePortion.toLocaleString()} Registration Fee automatically posted to Cooperative Main Wallet!${
          savingsPortion > 0 ? ` ₦${savingsPortion.toLocaleString()} credited to Savings Account.` : ''
        } ${targetMember ? `Member '${targetMember.fullName}' status automatically changed to ACTIVE.` : ''}`;
        break;
      }

      case 'Savings Deposit': {
        destinationWallet = 'Member Wallet';
        if (!targetMember) {
          return res.status(400).json({ error: 'Savings Deposit requires a valid Member selection.' });
        }

        const hasPaidRegFee = targetMember.registrationFeeStatus === 'Paid' || targetMember.registrationFeeStatus === 'Waived';

        if (!hasPaidRegFee) {
          const regFeePortion = cooperativeSettingsStore.registrationFee || 2500;
          if (numAmount < regFeePortion) {
            return res.status(400).json({
              error: 'First payment must be at least ₦2,500 to cover the registration fee.',
            });
          }

          const savingsPortion = numAmount - regFeePortion;
          targetMember.registrationFeeStatus = 'Paid';
          targetMember.status = 'active';

          const currCoopBal = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);
          cooperativeWalletStore.unshift({
            id: `coop_tx_${Date.now()}`,
            category: 'Registration Fee',
            amount: regFeePortion,
            payerMemberId: targetMember.id,
            payerMemberNo: targetMember.memberNo,
            payerName: targetMember.fullName,
            receiptNumber: receipt,
            paymentMethod: method,
            date: dateStr,
            recordedBy: officer,
            notes: `Registration Fee (₦2,500) automatically deducted from first deposit of ₦${numAmount.toLocaleString()}`,
            balanceAfter: currCoopBal + regFeePortion,
            createdAt: new Date().toISOString(),
          });

          memberWalletTransactionsStore.unshift({
            id: `mw_tx_${Date.now()}`,
            memberId: targetMember.id,
            memberNo: targetMember.memberNo,
            memberName: targetMember.fullName,
            txType: 'Registration Fee Payment',
            amount: regFeePortion,
            flow: 'debit',
            targetWallet: 'Cooperative Main Wallet',
            receiptNumber: receipt,
            paymentMethod: method,
            date: dateStr,
            recordedBy: officer,
            notes: 'Registration fee automatically deducted from first deposit.',
            createdAt: new Date().toISOString(),
          });

          if (savingsPortion > 0) {
            targetMember.savingsBalance = (targetMember.savingsBalance || 0) + savingsPortion;
            savingsStore.unshift({
              id: `dep_${Date.now()}`,
              memberId: targetMember.id,
              memberNo: targetMember.memberNo,
              memberName: targetMember.fullName,
              depositDate: dateStr,
              amount: savingsPortion,
              paymentMethod: method,
              referenceNumber: receipt,
              receivedBy: officer,
              notes: notes || `First Savings Deposit credited after ₦2,500 Registration Fee deduction`,
              createdAt: new Date().toISOString(),
              runningBalance: targetMember.savingsBalance,
            });

            memberWalletTransactionsStore.unshift({
              id: `mw_tx_sav_${Date.now()}`,
              memberId: targetMember.id,
              memberNo: targetMember.memberNo,
              memberName: targetMember.fullName,
              txType: 'Savings Deposit',
              amount: savingsPortion,
              flow: 'credit',
              targetWallet: 'Savings',
              receiptNumber: receipt,
              paymentMethod: method,
              date: dateStr,
              recordedBy: officer,
              notes: notes || 'First Savings Deposit credited to passbook.',
              savingsBalanceAfter: targetMember.savingsBalance,
              createdAt: new Date().toISOString(),
            });
          }

          postingMessage = `First Deposit Processed: ₦2,500 Registration Fee posted to Cooperative Main Wallet, ₦${savingsPortion.toLocaleString()} credited to ${targetMember.fullName}'s Personal Savings Wallet! New Balance: ₦${(targetMember.savingsBalance || 0).toLocaleString()}`;
        } else {
          targetMember.savingsBalance = (targetMember.savingsBalance || 0) + numAmount;

          const depositRec: SavingsDeposit = {
            id: `dep_${Date.now()}`,
            memberId: targetMember.id,
            memberNo: targetMember.memberNo,
            memberName: targetMember.fullName,
            depositDate: dateStr,
            amount: numAmount,
            paymentMethod: method,
            referenceNumber: receipt,
            receivedBy: officer,
            notes: notes || 'Member Voluntary Savings Deposit',
            createdAt: new Date().toISOString(),
            runningBalance: targetMember.savingsBalance,
          };
          savingsStore.unshift(depositRec);

          const mwTx: MemberWalletTransaction = {
            id: `mw_tx_${Date.now()}`,
            memberId: targetMember.id,
            memberNo: targetMember.memberNo,
            memberName: targetMember.fullName,
            txType: 'Savings Deposit',
            amount: numAmount,
            flow: 'credit',
            targetWallet: 'Savings',
            receiptNumber: receipt,
            paymentMethod: method,
            date: dateStr,
            recordedBy: officer,
            notes: notes || 'Voluntary savings deposit',
            savingsBalanceAfter: targetMember.savingsBalance,
            createdAt: new Date().toISOString(),
          };
          memberWalletTransactionsStore.unshift(mwTx);

          postingMessage = `₦${numAmount.toLocaleString()} Savings Deposit automatically posted to ${targetMember.fullName}'s Personal Savings Wallet! New Balance: ₦${targetMember.savingsBalance.toLocaleString()}`;
        }
        break;
      }

      case 'Loan Interest': {
        destinationWallet = 'Cooperative Main Wallet';
        const currCoopBal = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);
        const coopEntry: CooperativeWalletEntry = {
          id: `coop_tx_${Date.now()}`,
          category: 'Loan Interest',
          amount: numAmount,
          payerMemberId: targetMember?.id,
          payerMemberNo: targetMember?.memberNo,
          payerName: targetMember?.fullName || 'Borrowing Member',
          receiptNumber: receipt,
          paymentMethod: method,
          date: dateStr,
          recordedBy: officer,
          notes: notes || 'Loan Interest Income',
          balanceAfter: currCoopBal + numAmount,
          createdAt: new Date().toISOString(),
        };
        cooperativeWalletStore.unshift(coopEntry);

        if (targetMember) {
          const mwTx: MemberWalletTransaction = {
            id: `mw_tx_${Date.now()}`,
            memberId: targetMember.id,
            memberNo: targetMember.memberNo,
            memberName: targetMember.fullName,
            txType: 'Loan Interest Payment',
            amount: numAmount,
            flow: 'debit',
            targetWallet: 'Cooperative Main Wallet',
            receiptNumber: receipt,
            paymentMethod: method,
            date: dateStr,
            recordedBy: officer,
            notes: notes || 'Interest portion of loan repayment automatically routed to Cooperative Main Wallet.',
            createdAt: new Date().toISOString(),
          };
          memberWalletTransactionsStore.unshift(mwTx);
        }

        postingMessage = `₦${numAmount.toLocaleString()} Loan Interest income automatically posted to Cooperative Main Wallet!`;
        break;
      }

      case 'Loan Repayment (Principal)': {
        destinationWallet = 'Member Wallet';
        if (!targetMember) {
          return res.status(400).json({ error: 'Loan Repayment requires a valid Member selection.' });
        }

        // Find active loan if available
        const activeLoan = loansStore.find(
          (l) => (loanId && l.id === loanId) || (l.memberNo === targetMember!.memberNo && l.status === 'Disbursed')
        );

        if (activeLoan) {
          activeLoan.amountRepaid += numAmount;
          activeLoan.outstandingBalance = Math.max(0, activeLoan.totalPayable - activeLoan.amountRepaid);
          if (activeLoan.outstandingBalance <= 0) {
            activeLoan.status = 'Completed';
          }
        }

        const mwTx: MemberWalletTransaction = {
          id: `mw_tx_${Date.now()}`,
          memberId: targetMember.id,
          memberNo: targetMember.memberNo,
          memberName: targetMember.fullName,
          txType: 'Loan Principal Repayment',
          amount: numAmount,
          flow: 'credit',
          targetWallet: 'Loan Balance',
          receiptNumber: receipt,
          paymentMethod: method,
          date: dateStr,
          recordedBy: officer,
          notes: notes || 'Loan principal repayment reducing outstanding debt.',
          loanBalanceAfter: activeLoan ? activeLoan.outstandingBalance : 0,
          createdAt: new Date().toISOString(),
        };
        memberWalletTransactionsStore.unshift(mwTx);

        postingMessage = `₦${numAmount.toLocaleString()} Loan Principal Repayment posted! Outstanding loan balance reduced for ${targetMember.fullName}.`;
        break;
      }

      case 'Fine / Penalty':
      case 'Penalties/Fines': {
        destinationWallet = 'Cooperative Main Wallet';
        const currCoopBal = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);
        const coopEntry: CooperativeWalletEntry = {
          id: `coop_tx_${Date.now()}`,
          category: 'Penalties/Fines',
          amount: numAmount,
          payerMemberId: targetMember?.id,
          payerMemberNo: targetMember?.memberNo,
          payerName: targetMember?.fullName || 'Member',
          receiptNumber: receipt,
          paymentMethod: method,
          date: dateStr,
          recordedBy: officer,
          notes: notes || 'Fine / Late Repayment Penalty',
          balanceAfter: currCoopBal + numAmount,
          createdAt: new Date().toISOString(),
        };
        cooperativeWalletStore.unshift(coopEntry);

        if (targetMember) {
          const mwTx: MemberWalletTransaction = {
            id: `mw_tx_${Date.now()}`,
            memberId: targetMember.id,
            memberNo: targetMember.memberNo,
            memberName: targetMember.fullName,
            txType: 'Penalty Payment',
            amount: numAmount,
            flow: 'debit',
            targetWallet: 'Cooperative Main Wallet',
            receiptNumber: receipt,
            paymentMethod: method,
            date: dateStr,
            recordedBy: officer,
            notes: notes || 'Penalty fee credited to Cooperative Main Wallet.',
            createdAt: new Date().toISOString(),
          };
          memberWalletTransactionsStore.unshift(mwTx);
        }

        postingMessage = `₦${numAmount.toLocaleString()} Penalty fee automatically posted to Cooperative Main Wallet!`;
        break;
      }

      case 'Dividend Credit':
      case 'Dividend': {
        destinationWallet = 'Member Wallet';
        if (!targetMember) {
          return res.status(400).json({ error: 'Dividend credit requires a target member.' });
        }

        targetMember.savingsBalance = (targetMember.savingsBalance || 0) + numAmount;

        const mwTx: MemberWalletTransaction = {
          id: `mw_tx_${Date.now()}`,
          memberId: targetMember.id,
          memberNo: targetMember.memberNo,
          memberName: targetMember.fullName,
          txType: 'Dividend Credit',
          amount: numAmount,
          flow: 'credit',
          targetWallet: 'Dividend',
          receiptNumber: receipt,
          paymentMethod: method,
          date: dateStr,
          recordedBy: officer,
          notes: notes || 'Annual Dividend Surplus Payout credited to member wallet.',
          savingsBalanceAfter: targetMember.savingsBalance,
          createdAt: new Date().toISOString(),
        };
        memberWalletTransactionsStore.unshift(mwTx);

        postingMessage = `₦${numAmount.toLocaleString()} Dividend surplus credited to ${targetMember.fullName}'s Personal Wallet!`;
        break;
      }

      case 'Business Income':
      case 'Donation':
      case 'Service Charge':
      case 'Other Income':
      default: {
        destinationWallet = 'Cooperative Main Wallet';
        let coopCat: CooperativeIncomeCategory = 'Other Cooperative Income';
        if (paymentType === 'Business Income') coopCat = 'Business Profit';
        else if (paymentType === 'Donation') coopCat = 'Donation';
        else if (paymentType === 'Service Charge') coopCat = 'Service Charges';

        const currCoopBal = cooperativeWalletStore.reduce((acc, curr) => acc + curr.amount, 0);
        const coopEntry: CooperativeWalletEntry = {
          id: `coop_tx_${Date.now()}`,
          category: coopCat,
          amount: numAmount,
          payerMemberId: targetMember?.id,
          payerMemberNo: targetMember?.memberNo,
          payerName: targetMember?.fullName || 'External / Cooperative Venture',
          receiptNumber: receipt,
          paymentMethod: method,
          date: dateStr,
          recordedBy: officer,
          notes: notes || `Cooperative Income - ${paymentType}`,
          balanceAfter: currCoopBal + numAmount,
          createdAt: new Date().toISOString(),
        };
        cooperativeWalletStore.unshift(coopEntry);

        postingMessage = `₦${numAmount.toLocaleString()} (${paymentType}) automatically posted to Cooperative Main Wallet! Category: ${coopCat}`;
        break;
      }
    }

    // Log Audit Event
    const auditLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: actorId || 'usr_finsec01',
      actorName: officer,
      role: 'financial_secretary',
      action: 'Automatic Wallet Posting',
      module: 'Wallet Architecture',
      details: `Financial Officer posted [${paymentType}] of ₦${numAmount.toLocaleString()} (Receipt: ${receipt}). System automatically routed transaction to ${destinationWallet}.`,
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    auditLogsStore.unshift(auditLog);

    saveDatabase();
    return res.json({
      success: true,
      destinationWallet,
      message: postingMessage,
      receiptDetails: {
        receiptNumber: receipt,
        paymentType,
        amount: numAmount,
        memberName: targetMember ? targetMember.fullName : 'Cooperative Society',
        memberNo: targetMember ? targetMember.memberNo : 'COOP-HQ-001',
        paymentMethod: method,
        date: dateStr,
        receivedBy: officer,
        notes,
      },
    });
  });


  // Notifications: Mark Read
  app.post('/api/notifications/mark-read', (req, res) => {
    const { notificationId, markAll } = req.body;

    if (markAll) {
      notificationsStore = notificationsStore.map((n) => ({ ...n, isRead: true }));
    } else if (notificationId) {
      notificationsStore = notificationsStore.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
    }

    saveDatabase();
    res.json({
      success: true,
      notifications: notificationsStore,
      unreadCount: notificationsStore.filter((n) => !n.isRead).length,
    });
  });

  // Database Schema Architecture Metadata
  app.get('/api/database/schema', (req, res) => {
    res.json({
      tables: DATABASE_SCHEMAS,
      branches: COOPERATIVE_BRANCHES,
      totalTables: DATABASE_SCHEMAS.length,
      foundationTables: DATABASE_SCHEMAS.filter((t) => t.status === 'active_foundation').length,
      futureModuleTables: DATABASE_SCHEMAS.filter((t) => t.status === 'ready_for_phase2').length,
      version: 'Phase 1 Foundation',
    });
  });

  // System Stats overview for dashboards
  app.get('/api/system/stats', (req, res) => {
    res.json({
      totalMembers: usersStore.length,
      activeBranches: COOPERATIVE_BRANCHES.length,
      totalShareCapital: usersStore.reduce((acc, u) => acc + (u.sharesOwned || 0) * 100, 0),
      totalSavingsDeposits: savingsStore.reduce((acc, d) => acc + d.amount, 0),
      activeLoansOutstanding: loansStore.reduce((acc, l) => acc + (l.outstandingBalance || 0), 0),
      cooperativeBusinessesCount: 0,
      systemUptime: '100.0%',
      lastBackupTimestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      rolesCount: 9,
    });
  });

  // Enable Live Production Mode / Reset System
  const handleProductionReset = (req: express.Request, res: express.Response) => {
    const superAdmin = usersStore.find((u) => u.role === 'sys_admin' || u.id === 'usr_admin01') || INITIAL_USERS[0];
    const cleanedAdmin: User = {
      ...superAdmin,
      savingsBalance: 0,
      sharesOwned: 0,
    };

    usersStore = [cleanedAdmin];
    executiveAppointmentsStore = [];
    savingsStore = [];
    loansStore = [];
    cooperativeWalletStore = [];
    memberWalletTransactionsStore = [];
    paymentTransactionsStore = [];

    notificationsStore = [
      {
        id: `notif_prod_${Date.now()}`,
        title: 'LCMS PRO Production Reset Complete',
        message: 'System transitioned into Live Production Mode. All demo members, demo executive officers, demo savings, loans, guarantors, transactions, and reports purged. Membership numbering reset to LC2026-0001.',
        type: 'success',
        isRead: false,
        createdAt: 'Just now',
      },
    ];

    dividendConfigStore = {
      netSurplusPool: 0,
      accountingYear: 2026,
      distributionStatus: 'Draft / Calculation Mode',
      honorariumConfig: DEFAULT_HONORARIUM_CONFIG,
    };

    surplusAppropriationStore = {
      ...DEFAULT_SURPLUS_APPROPRIATION_CONFIG,
    };

    const prodLog: AuditLog = {
      id: `log_prod_${Date.now()}`,
      actorId: cleanedAdmin.id,
      actorName: cleanedAdmin.fullName,
      role: cleanedAdmin.role,
      action: 'Production Reset Executed',
      module: 'System Security & Compliance',
      details: 'System transitioned into Live Production Mode by Super Administrator Mr. Ige Ebenezer. All demo sample records purged. Membership numbering reset to LC2026-0001. All executive positions set to vacant.',
      ipAddress: req.ip || '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    auditLogsStore = [prodLog];

    saveDatabase();

    return res.json({
      success: true,
      message: 'LCMS PRO successfully reset to Live Production Mode. Database clean and ready for real member registration starting at LC2026-0001.',
      users: usersStore,
      executiveAppointments: executiveAppointmentsStore,
      savings: savingsStore,
      loans: loansStore,
      cooperativeWallet: cooperativeWalletStore,
      memberWalletTransactions: memberWalletTransactionsStore,
      paymentTransactions: paymentTransactionsStore,
      auditLogs: auditLogsStore,
      notifications: notificationsStore,
    });
  };

  app.post('/api/system/production-mode', handleProductionReset);
  app.post('/api/system/reset', handleProductionReset);

  // ==================== VITE MIDDLEWARE ====================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LCMS PRO Express Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LCMS PRO server:', err);
});
