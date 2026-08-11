import React from 'react';
import { MembershipStatus } from '../types';
import { Clock, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';

interface MemberStatusBadgeProps {
  status: MembershipStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const MemberStatusBadge: React.FC<MemberStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  let badgeStyle = '';
  let label = '';
  let icon = null;

  switch (status) {
    case 'pending':
      // Pending (Orange)
      badgeStyle = 'bg-amber-500 text-slate-950 border border-amber-600 font-black shadow-xs';
      label = 'Pending';
      icon = <Clock className="w-3.5 h-3.5 shrink-0" />;
      break;
    case 'active':
      // Active (Green)
      badgeStyle = 'bg-emerald-600 text-white border border-emerald-700 font-black shadow-xs';
      label = 'Active';
      icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
      break;
    case 'suspended':
      // Suspended (Red)
      badgeStyle = 'bg-rose-600 text-white border border-rose-700 font-black shadow-xs';
      label = 'Suspended';
      icon = <ShieldAlert className="w-3.5 h-3.5 shrink-0" />;
      break;
    case 'withdrawn':
    default:
      // Withdrawn (Gray)
      badgeStyle = 'bg-slate-500 text-white border border-slate-600 font-black shadow-xs';
      label = 'Withdrawn';
      icon = <XCircle className="w-3.5 h-3.5 shrink-0" />;
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-md',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-lg',
    lg: 'px-3.5 py-1.5 text-sm gap-2 rounded-xl',
  }[size];

  return (
    <span className={`inline-flex items-center uppercase tracking-wider ${sizeClasses} ${badgeStyle}`}>
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
