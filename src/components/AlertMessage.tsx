import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string | React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const AlertMessage: React.FC<AlertMessageProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
}) => {
  if (!message) return null;

  const config = {
    success: {
      container: 'bg-[#014421] text-white border-2 border-emerald-950 shadow-lg',
      icon: <CheckCircle2 className="w-6 h-6 text-[#DAA520] shrink-0 mt-0.5" />,
      closeBtn: 'text-emerald-200 hover:text-white hover:bg-emerald-900',
      titleColor: 'text-[#DAA520] font-black',
      textColor: 'text-white font-extrabold',
    },
    error: {
      container: 'bg-rose-800 text-white border-2 border-rose-950 shadow-lg',
      icon: <AlertCircle className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />,
      closeBtn: 'text-rose-200 hover:text-white hover:bg-rose-900',
      titleColor: 'text-amber-300 font-black',
      textColor: 'text-white font-extrabold',
    },
    warning: {
      container: 'bg-amber-400 text-slate-950 border-2 border-amber-600 shadow-lg',
      icon: <AlertTriangle className="w-6 h-6 text-slate-950 shrink-0 mt-0.5" />,
      closeBtn: 'text-slate-800 hover:text-black hover:bg-amber-500',
      titleColor: 'text-slate-950 font-black',
      textColor: 'text-slate-950 font-black',
    },
    info: {
      container: 'bg-blue-700 text-white border-2 border-blue-900 shadow-lg',
      icon: <Info className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />,
      closeBtn: 'text-blue-200 hover:text-white hover:bg-blue-800',
      titleColor: 'text-amber-300 font-black',
      textColor: 'text-white font-extrabold',
    },
  }[type];

  return (
    <div
      className={`p-4 rounded-xl flex items-start gap-3.5 ${config.container} ${className}`}
      role="alert"
    >
      {config.icon}
      <div className="flex-1 text-sm sm:text-base leading-snug break-words">
        {title && (
          <div className={`text-sm sm:text-base uppercase tracking-wider mb-1 ${config.titleColor}`}>
            {title}
          </div>
        )}
        <div className={config.textColor}>{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`p-1.5 rounded-lg shrink-0 transition-colors cursor-pointer ${config.closeBtn}`}
          aria-label="Close message"
        >
          <X className="w-5 h-5 font-black" />
        </button>
      )}
    </div>
  );
};
