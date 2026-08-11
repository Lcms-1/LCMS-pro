import React, { useState, useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  PiggyBank,
  Banknote,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  TrendingUp,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';
import { CoopLogo } from './CoopLogo';

interface OnboardingSlideshowProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

interface SlideData {
  id: number;
  title: string;
  tagline: string;
  subtitle: string;
  description: string;
  badge: string;
  points: string[];
  icon: React.ReactNode;
  accentColor: string;
}

export const OnboardingSlideshow: React.FC<OnboardingSlideshowProps> = ({
  isOpen,
  onComplete,
  onSkip,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  if (!isOpen) return null;

  const slides: SlideData[] = [
    {
      id: 0,
      title: 'Welcome to LIGHTWAY COOPERATIVE',
      tagline: 'SOCIETY LIMITED',
      subtitle: '“Together We Grow, Together We Prosper.”',
      description:
        'Your trusted multi-branch digital cooperative platform. Designed to empower members, ensure complete financial transparency, and automate cooperative growth for lasting community prosperity.',
      badge: 'Official LCMS PRO Portal',
      points: [
        'Multi-branch membership structure',
        'Transparent ledger & audit trail',
        'Democratic cooperative governance',
      ],
      icon: <CoopLogo size="xl" variant="gold" showText={false} />,
      accentColor: 'from-[#014421] via-emerald-900 to-[#013318]',
    },
    {
      id: 1,
      title: 'Smart Savings & Passbook',
      tagline: 'DAILY LEDGER & TRANSPARENCY',
      subtitle: 'Save consistently, track deposits & monitor balances in real-time.',
      description:
        'Members can make daily or regular savings deposits, track verified payments instantly, and access their digitized savings passbook with clear transaction history and deposit dates.',
      badge: 'Transparent Ledger',
      points: [
        'Instant passbook entry tracking',
        'Daily deposit aggregations',
        'Verified treasurer receipts',
      ],
      icon: (
        <div className="w-20 h-20 rounded-3xl bg-amber-400/20 border-2 border-[#DAA520] flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/10">
          <PiggyBank className="w-11 h-11" />
        </div>
      ),
      accentColor: 'from-emerald-950 via-[#014421] to-teal-950',
    },
    {
      id: 2,
      title: 'Cooperative Loans',
      tagline: 'FAIR & TRANSPARENT CREDIT',
      subtitle: 'Access affordable loans with clear repayment schedules.',
      description:
        'Eligible members can apply for cooperative loans according to approved bylaws. View active loan balances, repayment schedules, interest breakdowns, and real-time approval status anytime.',
      badge: 'Rule-Based Credit',
      points: [
        '6-Tier executive approval workflow',
        'Transparent interest calculation',
        'Flexible monthly repayment schedules',
      ],
      icon: (
        <div className="w-20 h-20 rounded-3xl bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-xl shadow-emerald-500/10">
          <Banknote className="w-11 h-11" />
        </div>
      ),
      accentColor: 'from-slate-950 via-[#014421] to-emerald-900',
    },
    {
      id: 3,
      title: 'Dividends & Member Benefits',
      tagline: 'COLLECTIVE SURPLUS & GROWTH',
      subtitle: 'Participate in cooperative economic success & member rewards.',
      description:
        'Participate in cooperative business ventures and economic growth. Eligible members receive annual dividends and member benefits based on active participation, savings equity, and cooperative surplus.',
      badge: 'Shared Prosperity',
      points: [
        'Naira at Risk dividend calculation',
        'Annual surplus distribution',
        'Fair participation rewards',
      ],
      icon: (
        <div className="w-20 h-20 rounded-3xl bg-amber-400/20 border-2 border-[#DAA520] flex items-center justify-center text-[#DAA520] shadow-xl shadow-amber-500/20">
          <Award className="w-11 h-11" />
        </div>
      ),
      accentColor: 'from-[#01381b] via-[#014421] to-[#022c15]',
    },
  ];

  const slide = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('lcms_onboarding_completed', 'true');
    } catch (e) {}
    onComplete();
  };

  const handleSkipAction = () => {
    try {
      localStorage.setItem('lcms_onboarding_completed', 'true');
    } catch (e) {}
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40; // minimum 40px swipe threshold

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next slide
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Previous slide
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-lg bg-gradient-to-b from-[#014421] via-[#013519] to-slate-950 text-white rounded-3xl shadow-2xl border-2 border-[#DAA520]/80 overflow-hidden my-auto flex flex-col min-h-[580px] max-h-[92vh]"
      >
        {/* Top Header Bar */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between border-b border-emerald-800/40 relative z-10">
          <div className="flex items-center gap-2">
            <CoopLogo size="sm" showText={false} variant="gold" />
            <span className="text-xs font-bold tracking-wider text-[#DAA520] uppercase">
              LCMS PRO Tour
            </span>
          </div>

          <button
            onClick={handleSkipAction}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-amber-300 hover:text-white rounded-full text-xs font-bold tracking-wide transition-all border border-[#DAA520]/40 flex items-center gap-1"
          >
            Skip
          </button>
        </div>

        {/* Slide Content Container */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between relative overflow-y-auto select-none">
          {/* Visual Hero Area */}
          <div className="flex flex-col items-center text-center space-y-4 my-auto">
            {/* Slide Badge */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-amber-400/20 text-[#DAA520] border border-[#DAA520]/40 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              {slide.badge}
            </span>

            {/* Slide Icon */}
            <div className="py-2 transform transition-all duration-300 hover:scale-105">
              {slide.icon}
            </div>

            {/* Slide Titles */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                {slide.title}
              </h2>
              <div className="text-xs font-bold tracking-widest text-[#DAA520] uppercase">
                {slide.tagline}
              </div>
            </div>

            {/* Subtitle / Quote */}
            <p className="text-sm font-semibold text-amber-200/90 italic leading-relaxed max-w-sm">
              {slide.subtitle}
            </p>

            {/* Description Body */}
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-md font-medium">
              {slide.description}
            </p>

            {/* Key Feature Bullets */}
            <div className="w-full max-w-sm pt-2 space-y-2 text-left bg-black/20 p-3.5 rounded-2xl border border-emerald-700/30">
              {slide.points.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-emerald-100 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation & Indicator Controls */}
        <div className="p-6 bg-slate-950/70 border-t border-emerald-800/50 backdrop-blur-md flex flex-col gap-4 relative z-10">
          {/* Indicator Dots */}
          <div className="flex items-center justify-center gap-2">
            {slides.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlide(s.id)}
                aria-label={`Go to slide ${s.id + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentSlide === s.id
                    ? 'w-8 h-2.5 bg-[#DAA520] shadow-md shadow-amber-500/50'
                    : 'w-2.5 h-2.5 bg-emerald-800/80 hover:bg-emerald-600'
                }`}
              />
            ))}
          </div>

          {/* Buttons Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Back Button */}
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-1 transition-all ${
                currentSlide === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Next / Get Started Button */}
            <button
              onClick={handleNext}
              className="flex-1 sm:flex-initial px-6 py-3.5 bg-gradient-to-r from-amber-500 via-[#DAA520] to-amber-600 hover:from-amber-400 hover:to-amber-500 active:from-amber-600 text-slate-950 font-black text-sm tracking-wide rounded-2xl shadow-xl shadow-amber-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 border border-amber-300/40"
            >
              <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Swipe Hint for Mobile */}
          <div className="text-[10px] text-center text-emerald-400/60 tracking-wider uppercase font-mono pt-1">
            Swipe left or right to navigate
          </div>
        </div>
      </div>
    </div>
  );
};
