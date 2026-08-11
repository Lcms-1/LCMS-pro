import React from 'react';
import lightwayLogo from '../assets/images/lightway_coop_logo_1785392593556.jpg';

interface CoopLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  subtextClassName?: string;
  variant?: 'light' | 'dark' | 'gold';
}

export const CoopLogo: React.FC<CoopLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textClassName = '',
  subtextClassName = '',
  variant = 'light',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const imageSizeClass = sizeClasses[size] || 'w-10 h-10';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative shrink-0 overflow-hidden rounded-xl border border-amber-400/40 shadow-sm bg-white p-0.5 ${imageSizeClass}`}>
        <img
          src={lightwayLogo}
          alt="Lightway Cooperative Society"
          className="w-full h-full object-contain rounded-lg"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-black tracking-tight ${
              textClassName ||
              (variant === 'dark'
                ? 'text-slate-900 text-sm'
                : variant === 'gold'
                ? 'text-[#DAA520] text-base'
                : 'text-white text-base')
            }`}
          >
            LIGHTWAY COOPERATIVE
          </span>
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              subtextClassName ||
              (variant === 'dark'
                ? 'text-emerald-800'
                : variant === 'gold'
                ? 'text-amber-200'
                : 'text-emerald-200')
            }`}
          >
            SOCIETY LIMITED
          </span>
        </div>
      )}
    </div>
  );
};
