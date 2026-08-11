import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab, ROLE_ALLOWED_TABS } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { LoginModal } from './components/Auth/LoginModal';
import { PasswordResetModal } from './components/Auth/PasswordResetModal';
import { PageHeader } from './components/PageHeader';
import { FloatingNavControls } from './components/FloatingNavControls';

// Role Dashboards
import { MasterDashboard } from './components/Dashboards/MasterDashboard';
import { AdminDashboard } from './components/Dashboards/AdminDashboard';
import { ChairmanDashboard } from './components/Dashboards/ChairmanDashboard';
import { ViceChairmanDashboard } from './components/Dashboards/ViceChairmanDashboard';
import { SecretaryDashboard } from './components/Dashboards/SecretaryDashboard';
import { FinSecDashboard } from './components/Dashboards/FinSecDashboard';
import { TreasurerDashboard } from './components/Dashboards/TreasurerDashboard';
import { AuditorDashboard } from './components/Dashboards/AuditorDashboard';
import { BusinessSupervisorDashboard } from './components/Dashboards/BusinessSupervisorDashboard';
import { MemberDashboard } from './components/Dashboards/MemberDashboard';

// Views
import { MemberRegistrationView } from './components/Views/MemberRegistrationView';
import { SavingsManagementView } from './components/Views/SavingsManagementView';
import { NairaAtRiskView } from './components/Views/NairaAtRiskView';
import { LoanManagementView } from './components/Views/LoanManagementView';
import { DividendView } from './components/Views/DividendView';
import { ReportsView } from './components/Views/ReportsView';
import { DatabaseSchemaView } from './components/Views/DatabaseSchemaView';
import { PermissionsMatrixView } from './components/Views/PermissionsMatrixView';
import { AuditLogView } from './components/Views/AuditLogView';
import { DirectoryView } from './components/Views/DirectoryView';
import { NotificationCenterView } from './components/Views/NotificationCenterView';
import { SecuritySettingsView } from './components/Views/SecuritySettingsView';
import { MyProfileView } from './components/Views/MyProfileView';
import { WalletManagementView } from './components/Views/WalletManagementView';
import { BusinessManagementView } from './components/Views/BusinessManagementView';
import { RoleAssignmentView } from './components/Views/RoleAssignmentView';
import { ExecutiveManagementView } from './components/Views/ExecutiveManagementView';
import { CooperativeSettingsView } from './components/Views/CooperativeSettingsView';
import { TreasurerWorkflowView } from './components/Views/TreasurerWorkflowView';
import { FinSecApprovalView } from './components/Views/FinSecApprovalView';
import { BankAlertImportView } from './components/Views/BankAlertImportView';
import { PublicMemberRegistrationModal } from './components/PublicMemberRegistrationModal';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingSlideshow } from './components/OnboardingSlideshow';

// Types & Data
import { User, UserRole, SystemNotification, AuditLog, TableSchema, Permission, RolePermissions, CooperativeBranch, MembershipStatus, RegistrationFeeStatus, IdCardStatus, SavingsDeposit, DailySavingsAggregation, SavingsSummaryStats, LoanApplication, LoanSummaryStats, RoleAssignmentRecord, ExecutiveAppointment } from './types';
import { apiUrl } from './utils/apiClient';
import {
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  DATABASE_SCHEMAS,
  ALL_PERMISSIONS,
  INITIAL_ROLE_PERMISSIONS,
  COOPERATIVE_BRANCHES,
  INITIAL_SAVINGS_DEPOSITS,
  INITIAL_LOANS,
  ROLES_CONFIG,
  INITIAL_ROLE_ASSIGNMENT_RECORDS,
  INITIAL_EXECUTIVE_APPOINTMENTS,
} from './data/mockData';

export default function App() {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('lcms_users');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUserStr = localStorage.getItem('lcms_current_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        return parsed;
      }
    } catch (e) {}
    // No saved session: do not auto-login as the admin account.
    // The login/registration screen will handle authentication.
    return null;
  });

  // Keep localStorage in sync
  useEffect(() => {
    try {
      localStorage.setItem('lcms_users', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('lcms_current_user', JSON.stringify(currentUser));
      } catch (e) {}
    }
  }, [currentUser]);

  // Fetch initial users from API
  useEffect(() => {
    fetch(apiUrl('/api/users'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.users && Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);
          const savedUserStr = localStorage.getItem('lcms_current_user');
          if (savedUserStr) {
            try {
              const savedUser = JSON.parse(savedUserStr);
              const matched = data.users.find((u: User) => u.id === savedUser.id || u.email.toLowerCase() === savedUser.email.toLowerCase());
              if (matched) setCurrentUser(matched);
            } catch (e) {}
          }
        }
      })
      .catch(() => {});
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const savedFlag = localStorage.getItem('lcms_is_logged_in');
      if (savedFlag === 'false') return false;
      if (savedFlag === 'true') return true;
    } catch (e) {}
    // No saved session: default to logged out so a fresh install
    // (or a different member's phone) shows the login/register screen.
    return false;
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<boolean>(false);
  const [isSelfRegModalOpen, setIsSelfRegModalOpen] = useState<boolean>(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState<string>('');

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    try {
      const savedFlag = localStorage.getItem('lcms_is_logged_in');
      if (savedFlag === 'false') return true;
    } catch (e) {}
    return false;
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  const handleSplashFinish = () => {
    setShowSplash(false);
    try {
      const onboardingDone = localStorage.getItem('lcms_onboarding_completed');
      if (onboardingDone !== 'true') {
        setShowOnboarding(true);
      } else {
        setShowLoginModal(true);
      }
    } catch (e) {
      setShowLoginModal(true);
    }
  };

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem('lcms_onboarding_completed', 'true');
    } catch (e) {}
    setShowOnboarding(false);
    setShowLoginModal(true);
  };

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [walletSubTab, setWalletSubTab] = useState<'cooperative' | 'members' | 'single_entry'>('cooperative');
  const [reportsSubTab, setReportsSubTab] = useState<
    | 'naira_at_risk_dividend'
    | 'financial_statements'
    | 'trial_balance'
    | 'member_passbooks'
    | 'loan_portfolio_aging'
    | 'statutory_audit'
  >('financial_statements');
  const [navHistory, setNavHistory] = useState<NavTab[]>(['dashboard']);

  const [branches, setBranches] = useState<CooperativeBranch[]>(COOPERATIVE_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState<CooperativeBranch>(COOPERATIVE_BRANCHES[0]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isProductionMode, setIsProductionMode] = useState<boolean>(false);

  // Navigation Handlers
  const handleNavigate = (tab: NavTab, subTab?: string) => {
    if (subTab) {
      if (tab === 'wallet_management') {
        setWalletSubTab(subTab as any);
      } else if (tab === 'reports_analytics') {
        setReportsSubTab(subTab as any);
      }
    }

    if (tab === 'dashboard') {
      setNavHistory(['dashboard']);
    } else {
      setNavHistory((prev) => {
        if (prev[prev.length - 1] === tab) return prev;
        return [...prev, tab];
      });
    }
    setActiveTab(tab);
  };

  const handleGoBack = () => {
    if (navHistory.length > 1) {
      const updated = [...navHistory];
      updated.pop(); // remove current tab
      const previousTab = updated[updated.length - 1];
      setNavHistory(updated);
      setActiveTab(previousTab || 'dashboard');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleGoHome = () => {
    setNavHistory(['dashboard']);
    setActiveTab('dashboard');
  };

  // System State Stores
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);
  const [databaseSchemas, setDatabaseSchemas] = useState<TableSchema[]>(DATABASE_SCHEMAS);
  const [allPermissions] = useState<Permission[]>(ALL_PERMISSIONS);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>(INITIAL_ROLE_PERMISSIONS);
  const [assignmentRecords, setAssignmentRecords] = useState<RoleAssignmentRecord[]>(INITIAL_ROLE_ASSIGNMENT_RECORDS);
  const [executiveAppointments, setExecutiveAppointments] = useState<ExecutiveAppointment[]>(INITIAL_EXECUTIVE_APPOINTMENTS);

  const fetchExecutiveAppointments = () => {
    fetch(apiUrl('/api/executive-appointments'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.appointments) {
          setExecutiveAppointments(data.appointments);
          if (data.users) setUsers(data.users);
        }
      })
      .catch(() => {});
  };

  const handleAppointOfficer = async (
    roleId: UserRole,
    newOfficerUserId: string,
    startDate: string,
    endDate?: string,
    notes?: string
  ) => {
    try {
      const res = await fetch(apiUrl('/api/executive-appointments/appoint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          newOfficerUserId,
          startDate,
          endDate,
          notes,
          actorId: currentUser?.id,
          actorName: currentUser?.fullName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.appointments) setExecutiveAppointments(data.appointments);
        if (data.users) setUsers(data.users);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        fetch(apiUrl('/api/notifications')).then((r) => r.json()).then((d) => d.notifications && setNotifications(d.notifications)).catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to appoint officer.' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server error appointing officer.' };
    }
  };

  const handleRemoveOfficer = async (
    appointmentId: string,
    endDate: string,
    reason: string
  ) => {
    try {
      const res = await fetch(apiUrl('/api/executive-appointments/remove'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          endDate,
          reason,
          actorId: currentUser?.id,
          actorName: currentUser?.fullName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.appointments) setExecutiveAppointments(data.appointments);
        if (data.users) setUsers(data.users);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to remove officer.' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server error removing officer.' };
    }
  };

  // Savings Management Stores
  const [savingsDeposits, setSavingsDeposits] = useState<SavingsDeposit[]>(INITIAL_SAVINGS_DEPOSITS);
  const [savingsStats, setSavingsStats] = useState<SavingsSummaryStats>({
    totalSavings: INITIAL_SAVINGS_DEPOSITS.reduce((sum, d) => sum + d.amount, 0),
    monthlySavings: INITIAL_SAVINGS_DEPOSITS.filter((d) => d.depositDate.startsWith('2026-07')).reduce((sum, d) => sum + d.amount, 0),
    yearlySavings: INITIAL_SAVINGS_DEPOSITS.filter((d) => d.depositDate.startsWith('2026')).reduce((sum, d) => sum + d.amount, 0),
    activeDepositorsCount: new Set(INITIAL_SAVINGS_DEPOSITS.map((d) => d.memberNo)).size,
    totalTransactionsCount: INITIAL_SAVINGS_DEPOSITS.length,
    averageDepositSize: Math.round(INITIAL_SAVINGS_DEPOSITS.reduce((sum, d) => sum + d.amount, 0) / INITIAL_SAVINGS_DEPOSITS.length),
    sameDayAggregationsCount: 1,
  });
  const [dailyAggregations, setDailyAggregations] = useState<DailySavingsAggregation[]>([]);

  // Loan Management Stores
  const [loans, setLoans] = useState<LoanApplication[]>(INITIAL_LOANS);
  const [loanStats, setLoanStats] = useState<LoanSummaryStats>({
    totalLoanApplications: INITIAL_LOANS.length,
    totalDisbursedAmount: INITIAL_LOANS.filter((l) => ['Disbursed', 'Completed', 'Defaulted'].includes(l.status)).reduce((s, l) => s + l.loanAmount, 0),
    totalOutstandingBalance: INITIAL_LOANS.filter((l) => l.status === 'Disbursed').reduce((s, l) => s + l.outstandingBalance, 0),
    totalRepaidAmount: INITIAL_LOANS.reduce((s, l) => s + l.amountRepaid, 0),
    pendingGuarantorApprovalCount: INITIAL_LOANS.filter((l) => l.status === 'Waiting for Guarantor Approval').length,
    pendingVerificationCount: INITIAL_LOANS.filter((l) => l.status === 'Pending').length,
    pendingApprovalCount: INITIAL_LOANS.filter((l) => l.status === 'Verified').length,
    pendingDisbursementCount: INITIAL_LOANS.filter((l) => l.status === 'Approved').length,
    activeDisbursedLoansCount: INITIAL_LOANS.filter((l) => l.status === 'Disbursed').length,
    completedLoansCount: INITIAL_LOANS.filter((l) => l.status === 'Completed').length,
    defaultedLoansCount: INITIAL_LOANS.filter((l) => l.status === 'Defaulted').length,
  });

  const fetchSavingsData = () => {
    fetch(apiUrl('/api/savings'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.deposits) {
          setSavingsDeposits(data.deposits);
          if (data.stats) setSavingsStats(data.stats);
          if (data.dailyAggregations) setDailyAggregations(data.dailyAggregations);
        }
      })
      .catch(() => {});
  };

  const fetchLoansData = () => {
    fetch(apiUrl('/api/loans'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.loans) {
          setLoans(data.loans);
          if (data.stats) setLoanStats(data.stats);
        }
      })
      .catch(() => {});
  };

  // Fetch initial API data if server is running
  useEffect(() => {
    fetch(apiUrl('/api/database/schema'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.tables) setDatabaseSchemas(data.tables);
      })
      .catch(() => {});

    fetch(apiUrl('/api/audit-logs'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.logs) setAuditLogs(data.logs);
      })
      .catch(() => {});

    fetch(apiUrl('/api/notifications'))
      .then((res) => res.json())
      .then((data) => {
        if (data && data.notifications) setNotifications(data.notifications);
      })
      .catch(() => {});

    fetchSavingsData();
    fetchLoansData();
    fetchExecutiveAppointments();
  }, []);

  const handleRecordDeposit = async (depositData: Partial<SavingsDeposit>) => {
    try {
      const res = await fetch(apiUrl('/api/savings/deposit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...depositData,
          actorName: currentUser?.fullName,
          actorId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh local savings and user state
        fetchSavingsData();

        // Update local users array with new savings balance
        if (data.deposit && data.updatedSavingsBalance !== undefined) {
          setUsers((prev) =>
            prev.map((u) =>
              u.memberNo.toLowerCase() === data.deposit.memberNo.toLowerCase()
                ? { ...u, savingsBalance: data.updatedSavingsBalance }
                : u
            )
          );
        }

        // Fetch logs and notifications
        fetch(apiUrl('/api/audit-logs')).then((r) => r.json()).then((d) => d.logs && setAuditLogs(d.logs)).catch(() => {});
        fetch(apiUrl('/api/notifications')).then((r) => r.json()).then((d) => d.notifications && setNotifications(d.notifications)).catch(() => {});

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to post deposit.' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server error while recording savings deposit.' };
    }
  };

  // Loan Management Workflow Handlers
  const handleApplyLoan = async (loanData: any) => {
    try {
      const res = await fetch(apiUrl('/api/loans/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...loanData,
          actorName: currentUser?.fullName,
          actorId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoansData();
        fetch(apiUrl('/api/audit-logs')).then((r) => r.json()).then((d) => d.logs && setAuditLogs(d.logs)).catch(() => {});
        fetch(apiUrl('/api/notifications')).then((r) => r.json()).then((d) => d.notifications && setNotifications(d.notifications)).catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to submit loan application.', error: data.error };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server communication error.', error: err.message };
    }
  };

  const handleGuarantorDecision = async (id: string, decision: 'accept' | 'reject', pinOrPassword?: string, guarantorNotes?: string) => {
    try {
      const res = await fetch(apiUrl(`/api/loans/${id}/guarantor-decision`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          pinOrPassword,
          guarantorNotes,
          actorName: currentUser?.fullName,
          actorId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoansData();
        fetch(apiUrl('/api/audit-logs')).then((r) => r.json()).then((d) => d.logs && setAuditLogs(d.logs)).catch(() => {});
        fetch(apiUrl('/api/notifications')).then((r) => r.json()).then((d) => d.notifications && setNotifications(d.notifications)).catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to process guarantor decision.', error: data.error };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server communication error.', error: err.message };
    }
  };

  const handleVerifyLoan = async (id: string, action: 'verify' | 'reject', notes?: string) => {
    try {
      const res = await fetch(apiUrl(`/api/loans/${id}/verify`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          verificationNotes: notes,
          actorName: currentUser?.fullName,
          actorId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoansData();
        fetch(apiUrl('/api/audit-logs')).then((r) => r.json()).then((d) => d.logs && setAuditLogs(d.logs)).catch(() => {});
        fetch(apiUrl('/api/notifications')).then((r) => r.json()).then((d) => d.notifications && setNotifications(d.notifications)).catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to verify loan.', error: data.error };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server communication error.', error: err.message };
    }
  };

  const handleApproveLoan = async (id: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const res = await fetch(apiUrl(`/api/loans/${id}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          approvalNotes: notes,
          actorName: currentUser?.fullName,
          actorId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoansData();
        fetch(apiUrl('/api/audit-logs')).then((r) => r.json()).then((d) => d.logs && setAuditLogs(d.logs)).catch(() => {});
        fetch(apiUrl('/api/notifications')).then((r) => r.json()).then((d) => d.notifications && setNotifications(d.notifications)).catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to approve loan.', error: data.error };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server communication error.', error: err.message };
    }
  };

  const handleDisburseLoan = async (id: string, disburseData: any) => {
    try {
      const res = await fetch(apiUrl(`/api/loans/${id}/disburse`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...disburseData,
          actorName: currentUser?.fullName,
          actorId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoansData();
        fetch(apiUrl('/api/audit-logs')).then((r) => r.json()).then((d) => d.logs && setAuditLogs(d.logs)).catch(() => {});
        fetch(apiUrl('/api/notifications')).then((r) => r.json()).then((d) => d.notifications && setNotifications(d.notifications)).catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to disburse loan.', error: data.error };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server communication error.', error: err.message };
    }
  };

  const handleRepayLoan = async (id: string, repayData: any) => {
    try {
      const res = await fetch(apiUrl(`/api/loans/${id}/repay`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...repayData,
          actorName: currentUser?.fullName,
          actorId: currentUser?.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchLoansData();
        fetch(apiUrl('/api/audit-logs')).then((r) => r.json()).then((d) => d.logs && setAuditLogs(d.logs)).catch(() => {});
        fetch(apiUrl('/api/notifications')).then((r) => r.json()).then((d) => d.notifications && setNotifications(d.notifications)).catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to record repayment.', error: data.error };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Server communication error.', error: err.message };
    }
  };

  const handleAddBranch = (branchInput: { name: string; state: string; lga?: string; city: string; code?: string }) => {
    const newBranch: CooperativeBranch = {
      id: `br_${Date.now()}`,
      name: branchInput.name,
      code: branchInput.code || `LCMS-${branchInput.name.slice(0, 3).toUpperCase()}-${branches.length + 1}`,
      state: branchInput.state,
      city: branchInput.city,
      memberCount: 0,
      isHq: false,
    };
    setBranches((prev) => [...prev, newBranch]);

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: currentUser?.id || 'usr_admin01',
      actorName: currentUser?.fullName || 'Mr. Ige Ebenezer',
      role: currentUser?.role || 'sys_admin',
      action: 'Create Cooperative Branch',
      module: 'Branch Infrastructure',
      details: `New branch '${newBranch.name}' (${newBranch.city}, ${newBranch.state}) created by Super Administrator.`,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      actorId: updatedUser.id,
      actorName: updatedUser.fullName,
      role: updatedUser.role,
      action: 'Update Profile Details',
      module: 'Self Service',
      details: `User '${updatedUser.fullName}' updated profile information and photograph.`,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'info',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Super Administrator role assignment handler
  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, role: newRole };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    const targetUser = users.find((u) => u.id === userId);
    const newLog: AuditLog = {
      id: `log_rbac_${Date.now()}`,
      actorId: currentUser?.id || 'usr_admin01',
      actorName: currentUser?.fullName || 'Super Administrator',
      role: currentUser?.role || 'sys_admin',
      action: 'Assign User Role (RBAC)',
      module: 'Roles & RBAC Matrix',
      details: `Role for user '${targetUser?.fullName || userId}' was changed to [${ROLES_CONFIG[newRole]?.name || newRole}] by Super Administrator.`,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Full Office Election & Transfer Handler preserving financial history
  const handleAssignRole = (
    targetUserId: string,
    newRole: UserRole,
    effectiveDate: string,
    reason: string,
    previousUserId?: string
  ) => {
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return;

    const previousUser = previousUserId ? users.find((u) => u.id === previousUserId) : undefined;
    const previousRole = targetUser.role;
    const officeTitle = ROLES_CONFIG[newRole]?.name || newRole;

    setUsers((prev) =>
      prev.map((u) => {
        if (previousUserId && u.id === previousUserId && u.id !== targetUserId && newRole !== 'member') {
          return { ...u, role: 'member' };
        }
        if (u.id === targetUserId) {
          return { ...u, role: newRole };
        }
        return u;
      })
    );

    if (currentUser) {
      if (currentUser.id === targetUserId) {
        setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
      } else if (previousUserId && currentUser.id === previousUserId && newRole !== 'member') {
        setCurrentUser((prev) => (prev ? { ...prev, role: 'member' } : null));
      }
    }

    const newRecord: RoleAssignmentRecord = {
      id: `rah_${Date.now()}`,
      officeTitle,
      roleId: newRole,
      previousOfficerId: previousUser?.id || targetUser.id,
      previousOfficerName: previousUser?.fullName || (previousRole !== newRole ? targetUser.fullName : 'Vacant Office'),
      newOfficerId: targetUser.id,
      newOfficerName: targetUser.fullName,
      effectiveDate,
      assignedBy: currentUser?.fullName || 'Mr. Ige Ebenezer (Super Administrator)',
      reason,
      timestamp: new Date().toLocaleString(),
    };

    setAssignmentRecords((prev) => [newRecord, ...prev]);

    const newAuditLog: AuditLog = {
      id: `log_role_${Date.now()}`,
      actorId: currentUser?.id || 'usr_admin01',
      actorName: currentUser?.fullName || 'Super Administrator',
      role: currentUser?.role || 'sys_admin',
      action: 'Executive Office Transfer & Election',
      module: 'Leadership & Role Management',
      details: `Office [${officeTitle}] assigned to ${targetUser.fullName} (${targetUser.memberNo}). Effective date: ${effectiveDate}. Reason: ${reason}. Outgoing officer: ${previousUser?.fullName || 'N/A'}. All savings balances and loans retained intact.`,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };

    setAuditLogs((prev) => [newAuditLog, ...prev]);

    fetch(apiUrl('/api/roles/assign'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId,
        newRole,
        effectiveDate,
        reason,
        previousUserId,
        actorId: currentUser?.id,
        actorName: currentUser?.fullName,
      }),
    }).catch(() => {});
  };

  // Enforce Role-Based Access Control (RBAC) navigation guard
  useEffect(() => {
    if (!currentUser) return;
    const allowed = ROLE_ALLOWED_TABS[currentUser.role] || ROLE_ALLOWED_TABS.member;
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser?.role, activeTab]);

  const handleEnableProductionMode = () => {
    // Perform server-side call if endpoint is active
    fetch(apiUrl('/api/system/production-mode'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .catch(() => {});

    // Retain only Super Administrator (Mr. Ige Ebenezer) account
    const superAdmin = users.find((u) => u.role === 'sys_admin') || {
      id: 'usr_admin01',
      memberNo: 'LCMS-2026-001',
      fullName: 'Mr. Ige Ebenezer',
      email: 'igeebenezer16@gmail.com',
      phone: '+234 803 123 4567',
      role: 'sys_admin' as const,
      branch: 'Iwo Main Branch',
      state: 'Osun State',
      lga: 'Iwo Local Government Area',
      occupation: 'Founder & Super Administrator',
      residentialAddress: 'Cooperative HQ, Iwo, Osun State',
      dateJoined: '2026-01-01',
      status: 'active' as const,
      savingsBalance: 0,
      sharesOwned: 0,
      lastLogin: 'Just now',
    };

    const cleanedAdmin: User = {
      ...superAdmin,
      savingsBalance: 0,
      sharesOwned: 0,
    };

    setUsers([cleanedAdmin]);
    setCurrentUser(cleanedAdmin);

    // Clear sample transactions, deposits, loans, notifications, appointments
    setExecutiveAppointments([]);
    setAssignmentRecords([]);
    setSavingsDeposits([]);
    setDailyAggregations([]);
    setSavingsStats({
      totalSavings: 0,
      monthlySavings: 0,
      yearlySavings: 0,
      activeDepositorsCount: 0,
      totalTransactionsCount: 0,
      averageDepositSize: 0,
      sameDayAggregationsCount: 0,
    });

    setLoans([]);
    setLoanStats({
      totalLoanApplications: 0,
      totalDisbursedAmount: 0,
      totalOutstandingBalance: 0,
      totalRepaidAmount: 0,
      pendingGuarantorApprovalCount: 0,
      pendingVerificationCount: 0,
      pendingApprovalCount: 0,
      pendingDisbursementCount: 0,
      activeDisbursedLoansCount: 0,
      completedLoansCount: 0,
      defaultedLoansCount: 0,
    });

    setNotifications([]);

    // Single clean production log
    const prodLog: AuditLog = {
      id: `log_prod_${Date.now()}`,
      actorId: cleanedAdmin.id,
      actorName: cleanedAdmin.fullName,
      role: cleanedAdmin.role,
      action: 'Enable Live Production Mode',
      module: 'System Security & Compliance',
      details: 'System transitioned into Live Production Mode by Super Administrator Mr. Ige Ebenezer. All demo sample records successfully purged. Ready for live member onboarding.',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toLocaleString(),
      severity: 'warning',
    };
    setAuditLogs([prodLog]);
    setIsProductionMode(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    try {
      localStorage.setItem('lcms_is_logged_in', 'false');
      localStorage.removeItem('lcms_current_user');
    } catch (e) {}
    setShowLoginModal(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setShowLoginModal(false);
    try {
      localStorage.setItem('lcms_is_logged_in', 'true');
      localStorage.setItem('lcms_current_user', JSON.stringify(user));
    } catch (e) {}
  };

  const handleTogglePermission = (roleId: UserRole, permissionKey: string, enabled: boolean) => {
    setRolePermissions((prev) => {
      return prev.map((rp) => {
        if (rp.roleId === roleId) {
          const keys = enabled
            ? [...rp.allowedPermissionKeys, permissionKey]
            : rp.allowedPermissionKeys.filter((k) => k !== permissionKey);
          return { ...rp, allowedPermissionKeys: keys };
        }
        return rp;
      });
    });

    // Send API update
    fetch(apiUrl('/api/roles/permissions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roleId,
        permissionKey,
        enabled,
        actorId: currentUser?.id,
        actorName: currentUser?.fullName,
      }),
    }).catch(() => {});
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetch(apiUrl('/api/notifications/mark-read'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {});
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    fetch(apiUrl('/api/notifications/mark-read'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    }).catch(() => {});
  };

  // Member Registration Handlers
  const handleRegisterMember = async (newMemberData: Partial<User>) => {
    try {
      const res = await fetch(apiUrl('/api/members/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMemberData,
          actorId: currentUser?.id,
          actorName: currentUser?.fullName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setUsers((prev) => [data.member, ...prev]);
        // Refresh audit logs & notifications
        fetch(apiUrl('/api/audit-logs'))
          .then((r) => r.json())
          .then((d) => { if (d && d.logs) setAuditLogs(d.logs); })
          .catch(() => {});
        fetch(apiUrl('/api/notifications'))
          .then((r) => r.json())
          .then((d) => { if (d && d.notifications) setNotifications(d.notifications); })
          .catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Registration failed', error: data.error };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error.', error: 'Failed to communicate with server.' };
    }
  };

  const handleUpdateMember = async (id: string, updatedData: Partial<User>) => {
    try {
      const res = await fetch(apiUrl(`/api/members/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedData,
          actorId: currentUser?.id,
          actorName: currentUser?.fullName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setUsers((prev) => prev.map((u) => (u.id === id ? data.member : u)));
        fetch(apiUrl('/api/audit-logs'))
          .then((r) => r.json())
          .then((d) => { if (d && d.logs) setAuditLogs(d.logs); })
          .catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Update failed', error: data.error };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error.', error: 'Failed to communicate with server.' };
    }
  };

  const handleUpdateMemberStatus = async (
    id: string,
    status: MembershipStatus,
    regFee?: RegistrationFeeStatus,
    idCard?: IdCardStatus
  ) => {
    try {
      const res = await fetch(apiUrl(`/api/members/${id}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          registrationFeeStatus: regFee,
          idCardStatus: idCard,
          actorId: currentUser?.id,
          actorName: currentUser?.fullName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setUsers((prev) => prev.map((u) => (u.id === id ? data.member : u)));
        fetch(apiUrl('/api/audit-logs'))
          .then((r) => r.json())
          .then((d) => { if (d && d.logs) setAuditLogs(d.logs); })
          .catch(() => {});
      }
    } catch (err) {}
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/members/${id}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser?.id,
          actorName: currentUser?.fullName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        fetch(apiUrl('/api/audit-logs'))
          .then((r) => r.json())
          .then((d) => { if (d && d.logs) setAuditLogs(d.logs); })
          .catch(() => {});
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Delete failed.' };
      }
    } catch (err) {
      return { success: false, message: 'Server connection error.' };
    }
  };

  const getPageHeaderDetails = (tab: NavTab) => {
    switch (tab) {
      case 'member_registration':
        return { title: 'Member Registration & Dossiers', subtitle: 'Enrolment, Passbooks, Status Management & KYC Verification', badge: 'Members' };
      case 'savings_management':
        return { title: 'Savings Management & Passbooks', subtitle: 'Daily Postings, Passbook Reconciliation & Active Savings Engine', badge: 'Savings' };
      case 'loan_management':
        return { title: 'Loan Management & 6-Step Workflow', subtitle: 'Applications, Vetting, Verifications, Approvals & Repayments', badge: 'Loans' };
      case 'guarantor_exposure':
        return { title: 'Guarantor Risk Exposure', subtitle: '3x Savings Capacity Checks & Unsecured Liability Tracking', badge: 'Risk Engine' };
      case 'wallet_management':
        return { title: 'Wallet Architecture & Vault Ledger', subtitle: 'Cooperative Master Income Vault & Personal Member Passbooks', badge: 'Wallets' };
      case 'commercial_ventures':
        return { title: 'Business Management & Commercial Ventures', subtitle: 'Fleet, Supermarket, Housing Estate & Agro-Processing Enterprise Profits', badge: 'Business' };
      case 'dividend_distribution':
        return { title: 'Dividend Distribution & Surplus Pool', subtitle: '8% Annual Yield Allocation & Patronage Dividend Calculations', badge: 'Dividends' };
      case 'reports_analytics':
        return { title: 'Financial Statements & Reports', subtitle: 'Statutory Reports, Trial Balance & Naira At Risk Exposure', badge: 'Reports' };
      case 'database_schema':
        return { title: 'Database Schema Architecture', subtitle: '10 Core Relational Tables & Modular Foundation', badge: 'Phase 2' };
      case 'permissions_matrix':
        return { title: 'Roles & RBAC Permission Matrix', subtitle: '9 Role Profiles & 24 System Capability Mappings', badge: 'Security' };
      case 'executive_management':
        return { title: 'Executive Management & Officers Governance', subtitle: 'Appoint Officers, Tenure Track, Role Transfer & Audit Logging', badge: 'Super Admin Only' };
      case 'cooperative_settings':
        return { title: 'Cooperative Policy Settings', subtitle: 'Dynamic Registration Fees, Savings Thresholds & Interest Rates', badge: 'Policy' };
      case 'treasurer_workflow':
        return { title: 'Treasurer Payment Receipt & Assignment', subtitle: 'Bank Alert Matching, Cash Entries & Verification Submission', badge: 'Treasurer' };
      case 'bank_alert_import':
        return { title: 'Bulk Bank Alert SMS Import & Parser', subtitle: 'Auto-Extract Bank Alerts, Member Assignment & Duplicate Verification', badge: 'SMS Parser' };
      case 'finsec_approval':
        return { title: 'Financial Secretary Approval Queue & Reversals', subtitle: 'Verify Pending Payments, Reject with Notes & Reversal Auditing', badge: 'FinSec' };
      case 'role_assignment':
        return { title: 'Role Assignment & Executive Elections', subtitle: 'Executive Office Transfers, Member Role Appointments & Audit Trail', badge: 'Elections' };
      case 'audit_logs':
        return { title: 'System Audit Trail & Security Logs', subtitle: 'Immutable Action Logs & Session Stream', badge: 'Audit Trail' };
      case 'directory':
        return { title: 'Cooperative Directory & Roster', subtitle: 'Executives, Staff & Members Roster', badge: 'Roster' };
      case 'notifications':
        return { title: 'Notification Center', subtitle: 'System Alerts & Important Communications', badge: 'Alerts' };
      case 'settings':
        return { title: 'Security & Administrator Settings', subtitle: 'Credentials Management, Password Reset & 2FA Configuration', badge: 'Settings' };
      default:
        return { title: 'Operational View', subtitle: 'LCMS PRO Enterprise Portal', badge: 'Portal' };
    }
  };

  // Render main master dashboard
  const renderDashboardContent = () => {
    if (!currentUser) return null;

    return (
      <MasterDashboard
        currentUser={currentUser}
        users={users}
        savingsStats={savingsStats}
        loanStats={loanStats}
        savingsDeposits={savingsDeposits}
        loans={loans}
        onNavigate={handleNavigate}
        onNavigateToSchema={() => handleNavigate('database_schema')}
        onNavigateToPermissions={() => handleNavigate('permissions_matrix')}
        onRepayLoan={handleRepayLoan}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-black font-sans antialiased flex flex-col">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        notifications={notifications}
        onOpenNotifications={() => handleNavigate('notifications')}
        selectedBranch={selectedBranch}
        onSelectBranch={setSelectedBranch}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenPublicSelfRegistration={() => setIsSelfRegModalOpen(true)}
        branches={branches}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleNavigate}
          userRole={currentUser?.role}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onLogout={handleLogout}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-24 lg:pb-12">
          {activeTab !== 'dashboard' && (
            <PageHeader
              {...getPageHeaderDetails(activeTab)}
              onGoBack={handleGoBack}
              onGoHome={handleGoHome}
            />
          )}

          {activeTab === 'dashboard' && renderDashboardContent()}

          {activeTab === 'cooperative_settings' && currentUser && (
            <CooperativeSettingsView currentUser={currentUser} />
          )}

          {activeTab === 'treasurer_workflow' && currentUser && (
            <TreasurerWorkflowView
              currentUser={currentUser}
              users={users}
              onNavigate={handleNavigate}
              onRefreshData={() => {
                fetchSavingsData();
                fetchLoansData();
              }}
            />
          )}

          {activeTab === 'bank_alert_import' && currentUser && (
            <BankAlertImportView
              currentUser={currentUser}
              users={users}
              onNavigateToFinSec={() => handleNavigate('finsec_approval')}
              onRefreshData={() => {
                fetchSavingsData();
                fetchLoansData();
              }}
            />
          )}

          {activeTab === 'finsec_approval' && currentUser && (
            <FinSecApprovalView
              currentUser={currentUser}
              onNavigateToDashboard={() => handleNavigate('dashboard')}
              onRefreshData={() => {
                fetchSavingsData();
                fetchLoansData();
              }}
            />
          )}

          {activeTab === 'wallet_management' && (
            <WalletManagementView
              users={users}
              currentRole={currentUser?.role || 'sys_admin'}
              currentUser={currentUser || undefined}
              initialTab={walletSubTab}
              onRefreshData={() => {
                fetchSavingsData();
                fetchLoansData();
              }}
            />
          )}

          {activeTab === 'commercial_ventures' && (
            <BusinessManagementView
              currentUser={currentUser || undefined}
              onRefreshData={() => {
                fetchSavingsData();
                fetchLoansData();
              }}
            />
          )}

          {activeTab === 'member_registration' && (
            <MemberRegistrationView
              users={users}
              currentRole={currentUser?.role}
              onRegisterMember={handleRegisterMember}
              onUpdateMember={handleUpdateMember}
              onUpdateStatus={handleUpdateMemberStatus}
              onDeleteMember={handleDeleteMember}
            />
          )}

          {activeTab === 'savings_management' && (
            <SavingsManagementView
              users={users}
              currentUserRole={currentUser?.role}
              currentUserName={currentUser?.fullName}
              currentUserId={currentUser?.id}
              deposits={savingsDeposits}
              stats={savingsStats}
              dailyAggregations={dailyAggregations}
              onRecordDeposit={handleRecordDeposit}
              onRefreshData={fetchSavingsData}
            />
          )}

          {activeTab === 'naira_at_risk' && (
            <NairaAtRiskView
              currentUser={currentUser}
              users={users}
              deposits={savingsDeposits}
              onRefreshData={fetchSavingsData}
            />
          )}

          {activeTab === 'loan_management' && (
            <LoanManagementView
              users={users}
              currentUserRole={currentUser?.role}
              currentUserName={currentUser?.fullName}
              currentUserId={currentUser?.id}
              loans={loans}
              stats={loanStats}
              onApplyLoan={handleApplyLoan}
              onGuarantorDecision={handleGuarantorDecision}
              onVerifyLoan={handleVerifyLoan}
              onApproveLoan={handleApproveLoan}
              onDisburseLoan={handleDisburseLoan}
              onRepayLoan={handleRepayLoan}
              onRefreshData={fetchLoansData}
            />
          )}

          {activeTab === 'guarantor_exposure' && (
            <LoanManagementView
              users={users}
              currentUserRole={currentUser?.role}
              currentUserName={currentUser?.fullName}
              currentUserId={currentUser?.id}
              loans={loans}
              stats={loanStats}
              initialTab="guarantor_exposure"
              onApplyLoan={handleApplyLoan}
              onGuarantorDecision={handleGuarantorDecision}
              onVerifyLoan={handleVerifyLoan}
              onApproveLoan={handleApproveLoan}
              onDisburseLoan={handleDisburseLoan}
              onRepayLoan={handleRepayLoan}
              onRefreshData={fetchLoansData}
            />
          )}

          {activeTab === 'dividend_distribution' && (
            <DividendView
              users={users}
              deposits={savingsDeposits}
              loans={loans}
              currentUser={currentUser}
              currentUserRole={currentUser?.role}
              currentUserName={currentUser?.fullName}
              onRefreshData={() => {
                fetchSavingsData();
                fetchLoansData();
              }}
            />
          )}

          {activeTab === 'reports_analytics' && (
            <ReportsView
              users={users}
              loans={loans}
              deposits={savingsDeposits}
              initialTab={reportsSubTab}
            />
          )}

          {activeTab === 'database_schema' && (
            <DatabaseSchemaView schemas={databaseSchemas} />
          )}

          {activeTab === 'permissions_matrix' && (
            <PermissionsMatrixView
              allPermissions={allPermissions}
              rolePermissions={rolePermissions}
              onTogglePermission={handleTogglePermission}
              currentUserRole={currentUser?.role}
            />
          )}

          {activeTab === 'executive_management' && currentUser && (
            <ExecutiveManagementView
              users={users}
              currentUser={currentUser}
              appointments={executiveAppointments}
              onAppointOfficer={handleAppointOfficer}
              onRemoveOfficer={handleRemoveOfficer}
              onRefreshData={() => {
                fetchExecutiveAppointments();
              }}
            />
          )}

          {activeTab === 'role_assignment' && (
            <RoleAssignmentView
              users={users}
              currentUser={currentUser!}
              assignmentRecords={assignmentRecords}
              onAssignRole={handleAssignRole}
            />
          )}

          {activeTab === 'audit_logs' && <AuditLogView logs={auditLogs} />}

          {activeTab === 'directory' && (
            <DirectoryView
              users={users}
              currentUserRole={currentUser?.role}
              onUpdateUserRole={handleUpdateUserRole}
            />
          )}

          {activeTab === 'my_profile' && currentUser && (
            <MyProfileView
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenterView
              notifications={notifications}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onMarkRead={handleMarkNotificationRead}
            />
          )}

          {activeTab === 'settings' && currentUser && (
            <SecuritySettingsView
              currentUser={currentUser}
              branches={branches}
              onAddBranch={handleAddBranch}
              onOpenResetPassword={() => setShowResetPasswordModal(true)}
              isProductionMode={isProductionMode}
              onEnableProductionMode={handleEnableProductionMode}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        unreadNotificationsCount={notifications.filter((n) => !n.isRead).length}
        userRole={currentUser?.role}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Floating Navigation Controls (Global Back & Scroll-to-Top) */}
      <FloatingNavControls
        activeTab={activeTab}
        navHistory={navHistory}
        onGoBack={handleGoBack}
        onGoHome={handleGoHome}
      />

      {/* Splash Screen */}
      {showSplash && !isLoggedIn && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {/* Onboarding Slideshow */}
      <OnboardingSlideshow
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingComplete}
      />

      {/* Auth Modals */}
      <LoginModal
        isOpen={(showLoginModal || !isLoggedIn) && !showSplash && !showOnboarding}
        onLoginSuccess={handleLoginSuccess}
        onOpenResetPassword={() => setShowResetPasswordModal(true)}
        onOpenSelfRegistration={() => setIsSelfRegModalOpen(true)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        successNotification={resetSuccessNotice}
      />

      <PasswordResetModal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        currentUserRole={currentUser?.role}
        users={users}
        onSuccess={(msg) => {
          setResetSuccessNotice(msg);
          setShowLoginModal(true);
        }}
      />

      {/* Public Member Self-Registration Modal */}
      <PublicMemberRegistrationModal
        isOpen={isSelfRegModalOpen}
        onClose={() => setIsSelfRegModalOpen(false)}
      />
    </div>
  );
}
