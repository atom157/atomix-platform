import React from 'react';
import Image from 'next/image';

export function LogoMark({ className = "w-8 h-8", ...props }: { className?: string } & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={`relative ${className} overflow - hidden rounded - md flex - shrink - 0`} {...props}>
            <Image
                src="/logo-512.png"
                alt="AtomiX Logo"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
}

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items - center gap - 2 ${className} `}>
            <LogoMark />
            <span className="font-extrabold text-xl tracking-tight text-[#1e3a8a]">
                AtomiX
            </span>
        </div>
    );
}
