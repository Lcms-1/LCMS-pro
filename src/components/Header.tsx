import React, { useState } from 'react';
import {
  Building2,
  Bell,
  User as UserIcon,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Search,
  Sparkles,
  CheckCircle2,
  Menu,
  Wrench,
  Lock,
  Shield,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import { User, UserRole, CooperativeBranch, SystemNotification, AppMode } from '../types';
import { ROLES_CONFIG, COOPERATIVE_BRANCHES } from '../data/mockData';
import { CoopLogo } from './CoopLogo';

interface HeaderProps {
  currentUser: User | null;
  appMode?: AppMode;
  onToggleAppMode?: (mode: AppMode) => void;
  isSuperAdminUser?: boolean;
  activeTestRole?: UserRole | null;
  onSwitchTestRole?: (role: UserRole | null) => void;
  onLogout: () => void;
  notifications: SystemNotification[];
  onOpenNotifications: () => void;
  selectedBranch: CooperativeBranch;
  onSelectBranch: (branch: CooperativeBranch) => void;
  onToggleSidebarMobile: () => void;
  onOpenMyProfile?: () => void;
  onOpenPublicSelfRegistration?: () => void;
  branches?: CooperativeBranch[];
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  appMode = 'development',
  onToggleAppMode,
  isSuperAdminUser = false,
  activeTestRole = null,
  onSwitchTestRole,
  onLogout,
  notifications,
  onOpenNotifications,
  selectedBranch,
  onSelectBranch,
  onToggleSidebarMobile,
  onOpenMyProfile,
  onOpenPublicSelfRegistration,
  branches = COOPERATIVE_BRANCHES,
}) => {
  const [showRoleTesterDropdown, setShowRoleTesterDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const effectiveRole = activeTestRole || currentUser?.role || 'member';
  const currentRoleConfig = ROLES_CONFIG[effectiveRole];

  return (
    <header className="sticky top-0 z-30 bg-white border-b-2 border-[#DAA520] shadow-sm transition-all">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebarMobile}
            className="p-2 rounded-lg text-emerald-900 bg-emerald-50 hover:bg-emerald-100 lg:hidden focus:outline-none border border-emerald-200"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <CoopLogo size="md" showText variant="dark" />
          </div>
        </div>

        {/* Center: Search / Branch Selector */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search member passbook, staff ID, transaction..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 dark:bg-emerald-900/40 dark:border-emerald-800 dark:text-white dark:placeholder-slate-400"
            />
          </div>

          {/* Branch Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-800 whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{selectedBranch.name.split(' ')[0]} HQ</span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
            </button>

            {showBranchDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 dark:bg-slate-900 dark:border-slate-800">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cooperative Branches
                </div>
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      onSelectBranch(branch);
                      setShowBranchDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-900/50 ${
                      selectedBranch.id === branch.id
                        ? 'bg-emerald-50/80 font-bold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-[10px] text-slate-400">{branch.city} • {branch.memberCount} Members</div>
                    </div>
                    {selectedBranch.id === branch.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Environment Mode Toggle, Role Indicator / Role Tester, Notifications, Profile */}
        <div className="flex items-center gap-2.5">
          {/* Environment Mode Switcher Button */}
          {onToggleAppMode && (
            <button
              type="button"
              onClick={() => onToggleAppMode(appMode === 'development' ? 'production' : 'development')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-black transition-all cursor-pointer shadow-2xs ${
                appMode === 'development'
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300'
                  : 'bg-emerald-900 text-amber-300 border-[#DAA520] hover:bg-emerald-950 shadow-sm'
              }`}
              title={`Click to switch to ${appMode === 'development' ? 'Production' : 'Development'} Mode`}
            >
              {appMode === 'development' ? (
                <>
                  <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span>Development Mode</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Production Mode</span>
                </>
              )}
            </button>
          )}

          {/* Super Administrator Role Tester (ONLY for Mr. Ige Ebenezer in Development Mode) */}
          {appMode === 'development' && isSuperAdminUser && onSwitchTestRole ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleTesterDropdown(!showRoleTesterDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 bg-purple-50 text-purple-950 hover:bg-purple-100 dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-200 transition-all shadow-xs cursor-pointer"
                title="Super Admin Role Tester (Mr. Ige Ebenezer)"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <div className="text-left hidden md:block">
                  <div className="text-[8px] uppercase tracking-wider font-black text-purple-700 dark:text-purple-300">
                    {activeTestRole ? `Testing: ${currentRoleConfig?.name}` : 'Super Admin View'}
                  </div>
                  <div className="text-[11px] font-bold truncate max-w-[120px]">
                    {activeTestRole ? ROLES_CONFIG[activeTestRole].name : 'Full Admin (Mr. Ige)'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
              </button>

              {showRoleTesterDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-purple-200 py-2 z-50 max-h-[80vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/40">
                    <div className="text-xs font-black text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-purple-600" />
                      Super Admin Role Tester
                    </div>
                    <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-0.5">
                      Exclusive to Mr. Ige Ebenezer in Development Mode. Select a role to test modules.
                    </p>
                  </div>

                  {activeTestRole && (
                    <div className="p-1 border-b border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchTestRole(null);
                          setShowRoleTesterDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center gap-2 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reset to Full Super Admin View</span>
                      </button>
                    </div>
                  )}

                  <div className="p-1 space-y-1">
                    {(Object.keys(ROLES_CONFIG) as UserRole[]).map((rKey) => {
                      const r = ROLES_CONFIG[rKey];
                      const isActive = (activeTestRole || currentUser?.role) === rKey;
                      return (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => {
                            onSwitchTestRole(rKey === 'sys_admin' ? null : rKey);
                            setShowRoleTesterDropdown(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-start gap-2 ${
                            isActive
                              ? 'bg-purple-900 text-white font-semibold shadow-xs'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div
                            className={`mt-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                              isActive ? 'bg-amber-400 text-slate-950' : r.badgeBg + ' ' + r.badgeColor
                            }`}
                          >
                            {rKey.slice(0, 3)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{r.name}</div>
                            <div className={`text-[10px] truncate ${isActive ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
                              {r.title}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Active Role Indicator (Restricted Profile Enforced) */
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 dark:text-emerald-400">
                  {appMode === 'production' ? 'Production Role' : 'Role Restricted'}
                </div>
                <div className="text-xs font-bold truncate max-w-[140px]">
                  {currentRoleConfig?.name || currentUser?.role || 'Member'}
                </div>
              </div>
            </div>
          )}

          {/* Member Self-Registration Portal Button */}
          {onOpenPublicSelfRegistration && (
            <button
              onClick={onOpenPublicSelfRegistration}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-black shadow-xs transition-all cursor-pointer border border-teal-600"
              title="Open LCMS PRO Member Self-Registration Portal"
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-300" />
              <span>Self-Registration</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg dark:text-slate-300 dark:hover:bg-emerald-900/50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-emerald-950">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/40 transition-all"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser?.fullName || 'User'}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-600/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs ring-2 ring-emerald-600/30">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                  {currentUser?.fullName || 'User'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {currentUser?.memberNo || ''}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 dark:bg-slate-900 dark:border-slate-800">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {currentUser?.fullName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {currentUser?.email}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {currentRoleConfig?.name}
                  </div>
                </div>

                <div className="p-1">
                  <div className="px-3 py-1.5 text-[10px] text-slate-400 font-semibold uppercase">
                    Account Details
                  </div>
                  <div className="px-3 py-1 text-xs text-slate-600 dark:text-slate-300 flex justify-between">
                    <span>Staff/Passbook No:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{currentUser?.memberNo}</span>
                  </div>
                  <div className="px-3 py-1 text-xs text-slate-600 dark:text-slate-300 flex justify-between">
                    <span>Branch:</span>
                    <span className="font-medium text-slate-800 dark:text-white">{currentUser?.branch.split(' ')[0]}</span>
                  </div>
                  <div className="px-3 py-1 text-xs text-slate-600 dark:text-slate-300 flex justify-between">
                    <span>Status:</span>
                    <span className="font-bold text-emerald-600 capitalize">{currentUser?.status}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 mt-2 p-1 space-y-1">
                  {onOpenMyProfile && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onOpenMyProfile();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#014421] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-[#DAA520]" />
                      My Profile Page
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out of LCMS PRO
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
