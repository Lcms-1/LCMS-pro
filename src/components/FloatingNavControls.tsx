import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronUp, ChevronDown, Home } from 'lucide-react';
import { NavTab } from './Sidebar';

interface FloatingNavControlsProps {
  activeTab: NavTab;
  navHistory: NavTab[];
  onGoBack: () => void;
  onGoHome: () => void;
}

export const FloatingNavControls: React.FC<FloatingNavControlsProps> = ({
  activeTab,
  navHistory,
  onGoBack,
  onGoHome,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check window scroll position or scroll position of main scrollable containers
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const mainElement = document.querySelector('main');
      const mainScroll = mainElement ? mainElement.scrollTop : 0;
      setShowScrollTop(scrollY > 150 || mainScroll > 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll, { passive: true });
    }
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollables = document.querySelectorAll('main, .overflow-y-auto');
    scrollables.forEach((container) => {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    const scrollables = document.querySelectorAll('main, .overflow-y-auto');
    scrollables.forEach((container) => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
  };

  const canGoBack = activeTab !== 'dashboard' || navHistory.length > 1;

  return (
    <div className="print:hidden pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* Floating Bottom-Left Back & Home Controls */}
      {canGoBack && (
        <div className="pointer-events-auto fixed bottom-5 left-4 sm:bottom-6 sm:left-6 flex items-center gap-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* Main Floating Back Button */}
          <button
            onClick={onGoBack}
            className="group px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-[#014421] hover:bg-[#026230] text-white shadow-2xl shadow-emerald-950/40 border-2 border-[#DAA520] transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 text-xs font-bold tracking-wide cursor-pointer"
            title="Return to previous screen (Back ←)"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4 text-[#DAA520] group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back</span>
          </button>

          {/* Quick Floating Home Button */}
          <button
            onClick={onGoHome}
            className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-[#014421] dark:hover:text-emerald-400 shadow-xl border-2 border-slate-200 dark:border-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            title="Return to Main Dashboard (Home)"
            aria-label="Go to Dashboard Home"
          >
            <Home className="w-4 h-4 text-[#DAA520]" />
          </button>
        </div>
      )}

      {/* Floating Bottom-Right Scroll Controls (Top & Bottom) */}
      <div className="pointer-events-auto fixed bottom-5 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
        {/* Scroll-to-Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="group p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#1B2A41] hover:bg-slate-800 text-white shadow-xl shadow-slate-950/30 border-2 border-emerald-500/60 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Scroll back to top of page (↑)"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-4 h-4 text-emerald-400 group-hover:-translate-y-0.5 transition-transform duration-200" />
            <span className="hidden sm:inline">Top</span>
          </button>
        )}

        {/* Scroll-to-Bottom Button */}
        <button
          onClick={scrollToBottom}
          className="group p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#014421] hover:bg-emerald-900 text-white shadow-xl shadow-emerald-950/30 border-2 border-[#DAA520] transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          title="Scroll straight to bottom of page (↓)"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4 text-[#DAA520] group-hover:translate-y-0.5 transition-transform duration-200" />
          <span className="hidden sm:inline">Bottom</span>
        </button>
      </div>
    </div>
  );
};

