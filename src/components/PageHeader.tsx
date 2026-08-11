import React from 'react';
import { ArrowLeft, Home, ChevronRight, X } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  onGoBack: () => void;
  onGoHome: () => void;
  badge?: string;
  onClose?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  onGoBack,
  onGoHome,
  badge,
  onClose,
}) => {
  const handleExit = onClose || onGoHome;

  return (
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-2 border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 mb-6 shadow-md rounded-b-2xl -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-all duration-200">
      {/* Left Action & Title Group */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Top-Left Fixed Back Button */}
        <button
          onClick={onGoBack}
          className="px-3 py-2 rounded-xl bg-[#014421] hover:bg-[#026230] text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-[#DAA520] active:scale-95 shadow-sm shrink-0 group"
          title="Return to previous screen (Back ←)"
          aria-label="Back button"
        >
          <ArrowLeft className="w-4 h-4 text-[#DAA520] group-hover:-translate-x-0.5 transition-transform" />
          <span className="inline">Back</span>
        </button>

        {/* Quick Home Button */}
        <button
          onClick={onGoHome}
          className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-slate-300 dark:border-slate-700 active:scale-95 shrink-0"
          title="Return to Dashboard Home"
          aria-label="Home button"
        >
          <Home className="w-4 h-4 text-[#014421] dark:text-emerald-400" />
          <span className="hidden md:inline">Home</span>
        </button>

        {/* Title and Subtitle */}
        <div className="min-w-0 ml-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {Icon && <Icon className="w-4 h-4 text-[#014421] dark:text-emerald-400 shrink-0 hidden xs:inline" />}
            <h1 className="text-sm sm:text-base font-extrabold text-[#1B2A41] dark:text-white tracking-tight truncate">
              {title}
            </h1>
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-[#DAA520] text-[#014421] text-[9px] font-black uppercase shrink-0">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-[#495057] dark:text-slate-400 font-medium truncate max-w-xs sm:max-w-md hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Navigation & Top-Right Close (✕) Button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Breadcrumb path hint */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={onGoHome}
            className="text-[#014421] dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Dashboard
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 dark:text-slate-200 font-extrabold truncate max-w-[150px]">{title}</span>
        </div>

        {/* Top-Right Fixed Close (✕) Button */}
        <button
          onClick={handleExit}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/80 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-all cursor-pointer active:scale-95 shadow-xs flex items-center gap-1 font-bold text-xs"
          title="Close page and return to main dashboard (✕)"
          aria-label="Close view"
        >
          <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span className="hidden xs:inline">Close</span>
        </button>
      </div>
    </div>
  );
};

