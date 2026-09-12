import React from "react";

interface ExamoraLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  badgeClassName?: string;
  textClassName?: string;
}

export const ExamoraLogo: React.FC<ExamoraLogoProps> = ({
  size = "md",
  showTagline = false,
  taglineText = "Smart Examination & Assessment Platform",
  className = "",
  badgeClassName = "",
  textClassName = "",
}) => {
  const iconSizes = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
    xl: "w-16 h-16 rounded-3xl",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const svgDimensions = {
    sm: 18,
    md: 22,
    lg: 26,
    xl: 34,
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Geometric 'E' Examora Mark */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0 border border-indigo-400/30 ${badgeClassName}`}
      >
        <svg
          width={svgDimensions[size]}
          height={svgDimensions[size]}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          {/* Stylized geometric 'E' with assessment tick/node */}
          <path
            d="M5 4.5C5 3.67157 5.67157 3 6.5 3H18.5C19.0523 3 19.5 3.44772 19.5 4C19.5 4.55228 19.0523 5 18.5 5H7V9.5H16.5C17.0523 9.5 17.5 9.94772 17.5 10.5C17.5 11.0523 17.0523 11.5 16.5 11.5H7V19H18.5C19.0523 19 19.5 19.4477 19.5 20C19.5 20.5523 19.0523 21 18.5 21H6.5C5.67157 21 5 20.3284 5 19.5V4.5Z"
            fill="currentColor"
          />
          {/* Assessment check/focus accent node */}
          <circle cx="16" cy="15" r="2" fill="#38BDF8" />
        </svg>
      </div>

      <div>
        <span
          className={`font-black tracking-tight text-white block ${textSizes[size]} ${textClassName}`}
        >
          Exam<span className="text-indigo-400">ora</span>
        </span>
        {showTagline && (
          <span className="text-slate-400 text-xs block leading-tight font-normal">
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};
