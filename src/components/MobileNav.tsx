import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  PiggyBank,
  HandCoins,
  Wallet,
  Menu,
  User as UserIcon,
} from 'lucide-react';
import { NavTab, ROLE_ALLOWED_TABS } from './Sidebar';
import { UserRole } from '../types';

interface MobileNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadNotificationsCount: number;
  userRole?: UserRole;
  onToggleSidebarMobile?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  unreadNotificationsCount,
  userRole = 'sys_admin',
  onToggleSidebarMobile,
}) => {
  const allowed = ROLE_ALLOWED_TABS[userRole] || ROLE_ALLOWED_TABS.member;

  const rawItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my_profile' as NavTab, label: 'Profile', icon: UserIcon },
    { id: 'member_registration' as NavTab, label: 'Members', icon: UserPlus },
    { id: 'savings_management' as NavTab, label: 'Savings', icon: PiggyBank },
    { id: 'loan_management' as NavTab, label: 'Loans', icon: HandCoins },
    { id: 'wallet_management' as NavTab, label: 'Wallets', icon: Wallet },
  ];

  const items = rawItems.filter((i) => allowed.includes(i.id)).slice(0, 4);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#014421] border-t-2 border-[#DAA520] px-1 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center py-1 px-1.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#DAA520] font-black'
                  : 'text-white hover:text-[#DAA520] font-bold'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  isActive ? 'bg-[#DAA520] text-[#014421] shadow-md' : 'bg-emerald-900 text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold mt-0.5 tracking-tight truncate max-w-[55px]">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu drawer button for Android/Mobile */}
        <button
          onClick={onToggleSidebarMobile}
          className="flex flex-col items-center py-1 px-1.5 rounded-xl text-amber-300 font-bold hover:text-white transition-all cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-amber-400 text-[#014421] shadow-md">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black mt-0.5 tracking-tight">
            All Menu
          </span>
        </button>
      </div>
    </nav>
  );
};


