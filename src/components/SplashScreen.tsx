import React, { useEffect } from 'react';
import { CoopLogo } from './CoopLogo';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      onClick={onFinish}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#014421] via-[#013519] to-slate-950 text-white flex flex-col items-center justify-between p-8 select-none cursor-pointer animate-in fade-in duration-300"
    >
      <div className="w-full flex justify-between items-center text-xs text-amber-300/80 font-mono">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" /> LCMS PRO Secure System
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-[#DAA520] font-bold">
          v1.0.0
        </span>
      </div>

      <div className="flex flex-col items-center text-center space-y-6 my-auto max-w-md">
        {/* Animated Logo Container */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
          <div className="relative p-6 bg-[#014421] border-2 border-[#DAA520] rounded-3xl shadow-2xl">
            <CoopLogo size="xl" variant="gold" showText={false} />
          </div>
        </div>

        {/* Titles */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
            LIGHTWAY COOPERATIVE
          </h1>
          <h2 className="text-sm font-bold tracking-widest text-[#DAA520] uppercase">
            SOCIETY LIMITED
          </h2>
          <p className="text-xs text-amber-200/90 font-serif italic pt-1">
            “Together We Grow, Together We Prosper.”
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-emerald-100/80 max-w-xs leading-relaxed">
          Enterprise Cloud Management System for Nigerian Cooperative Societies
        </p>

        {/* Animated Progress Bar */}
        <div className="w-48 h-1.5 bg-emerald-950 rounded-full overflow-hidden border border-emerald-800/60 mt-4">
          <div className="h-full bg-gradient-to-r from-amber-400 via-[#DAA520] to-amber-500 rounded-full animate-pulse w-full"></div>
        </div>
      </div>

      <div className="text-[11px] text-emerald-300/70 text-center font-medium">
        Tap screen to continue &rarr;
      </div>
    </div>
  );
};
