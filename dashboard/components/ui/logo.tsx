import React from 'react';

export function LogoMark({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <defs>
                <linearGradient id="atomix-x-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
            </defs>
            {/* Deep blue hexagon background */}
            <polygon points="50 5, 89 27.5, 89 72.5, 50 95, 11 72.5, 11 27.5" fill="#1e3a8a" />

            {/* Dynamic Purple-to-Blue 'X' */}
            <path d="M30 30 L70 70 M70 30 L30 70" stroke="url(#atomix-x-grad)" strokeWidth="12" strokeLinecap="round" />

            {/* Magenta Spark (Center) */}
            <path d="M50 38 Q50 50 38 50 Q50 50 50 62 Q50 50 62 50 Q50 50 50 38 Z" fill="#ec4899" />
        </svg>
    );
}

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <LogoMark />
            <span className="font-extrabold text-xl tracking-tight text-[#1e3a8a]">
                AtomiX
            </span>
        </div>
    );
}
