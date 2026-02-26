'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, Hexagon } from 'lucide-react';

const steps = [
    {
        id: 1,
        title: "Context Analysis",
        desc: "Reads the original tweet, thread, and tone before generating. Your reply always fits the conversation perfectly.",
        IconComponent: Step1Icon,
    },
    {
        id: 2,
        title: "Custom Prompts",
        desc: "Create your own voice and style. Define how you want to sound so every reply feels authentically yours.",
        IconComponent: Step2Icon,
    },
    {
        id: 3,
        title: "Lightning Speed",
        desc: "Lightning-fast generation powered by GPT-4o. Get your perfectly-tuned reply in under 2 seconds.",
        IconComponent: Step3Icon,
    },
];

/* ─── 3D Icon Components ─── */

function Step1Icon({ isHovered }: { isHovered: boolean }) {
    return (
        <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
            {/* Blurred UI Snippet (Background Layer) */}
            <motion.div
                className="absolute inset-x-8 top-12 bottom-12 rounded-xl bg-slate-100/50 border border-slate-200/50 backdrop-blur-sm p-3 shadow-inner"
                animate={{
                    translateZ: isHovered ? -30 : -10,
                    opacity: isHovered ? 0.6 : 0.8,
                    rotateX: isHovered ? 10 : 0,
                    rotateY: isHovered ? -10 : 0,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="w-full flex gap-2 items-center mb-3">
                    <div className="w-5 h-5 rounded-full bg-slate-300/50" />
                    <div className="w-16 h-2 rounded-full bg-slate-300/50" />
                </div>
                <div className="w-full h-2 rounded-full bg-slate-300/40 mb-2" />
                <div className="w-4/5 h-2 rounded-full bg-slate-300/40" />
            </motion.div>

            {/* Glowing Magnifying Glass (Foreground Layer) */}
            <motion.div
                className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 border border-white/60 shadow-[0_10px_30px_-5px_rgba(59,130,246,0.3)] backdrop-blur-xl flex items-center justify-center"
                animate={{
                    translateZ: isHovered ? 60 : 20,
                    scale: isHovered ? 1.1 : 1,
                    y: isHovered ? -10 : 0,
                }}
                transition={{ duration: 0.5, ease: "easeOut", type: "spring", stiffness: 200, damping: 20 }}
            >
                {/* Lens reflection */}
                <div className="absolute top-2 left-3 w-8 h-4 bg-white/40 rounded-full blur-[2px] -rotate-45" />
                <Search className="w-10 h-10 text-blue-600 drop-shadow-md" strokeWidth={2.5} />

                {/* Handle of the magnifying glass (CSS drawn) */}
                <div className="absolute -bottom-6 -right-5 w-4 h-12 bg-gradient-to-b from-slate-300 to-slate-400 rounded-full border border-white/50 shadow-lg -rotate-45" />
            </motion.div>
        </div>
    );
}

function Step2Icon({ isHovered }: { isHovered: boolean }) {
    return (
        <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
            {/* Glowing Core */}
            <motion.div
                className="absolute w-16 h-16 rounded-full bg-purple-500 blur-[30px]"
                animate={{
                    scale: isHovered ? 1.5 : 1,
                    opacity: isHovered ? 0.8 : 0.4,
                }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />

            {/* 3D Crystal / Geometric Node */}
            <motion.div
                className="relative z-10 text-purple-600 flex items-center justify-center"
                animate={{
                    translateZ: isHovered ? 60 : 20,
                    rotateY: isHovered ? 180 : 0,
                    rotateX: isHovered ? 20 : 0,
                    scale: isHovered ? 1.1 : 1,
                    y: isHovered ? -10 : 0,
                }}
                transition={{ duration: 0.8, ease: "easeOut", rotateY: { duration: 8, repeat: Infinity, ease: "linear" } }}
            >
                <div className="relative w-28 h-28">
                    {/* Outer Hexagon */}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400/50" />
                        <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="rgba(168,85,247,0.1)" className="backdrop-blur-sm" />
                    </svg>
                    {/* Inner layers to give 3D crystal look */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg rotate-45 border border-white/40 shadow-inner flex items-center justify-center">
                            <div className="w-8 h-8 bg-white/20 rounded-sm rotate-45 backdrop-blur-md" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function Step3Icon({ isHovered }: { isHovered: boolean }) {
    return (
        <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
            {/* Background motion blur traces */}
            <motion.div
                className="absolute w-2 h-32 bg-gradient-to-b from-transparent via-pink-500/40 to-transparent blur-md -rotate-12"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{
                    opacity: isHovered ? [0, 1, 0] : 0,
                    scaleY: isHovered ? [0.5, 1.5, 0.5] : 0,
                    y: isHovered ? [-50, 50] : 0,
                }}
                transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
            />

            {/* 3D Lightning Bolt */}
            <motion.div
                className="relative z-10 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(236,72,153,0.4)]"
                animate={{
                    translateZ: isHovered ? 70 : 20,
                    scale: isHovered ? 1.15 : 1,
                    rotateZ: isHovered ? 5 : 0,
                    y: isHovered ? -10 : 0,
                }}
                transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 15 }}
            >
                {/* Custom SVG Lightning for a sleek, premium look */}
                <div className="relative w-24 h-32">
                    <svg viewBox="0 0 40 60" className="w-full h-full absolute inset-0">
                        <defs>
                            <linearGradient id="lightning-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#c084fc" /> {/* Purple-400 */}
                                <stop offset="100%" stopColor="#f472b6" /> {/* Pink-400 */}
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <motion.path
                            d="M22 2 L4 34 L18 34 L14 58 L36 24 L20 24 Z"
                            fill="url(#lightning-grad)"
                            stroke="rgba(255,255,255,0.8)"
                            strokeWidth="1"
                            filter="url(#glow)"
                            animate={{
                                strokeDasharray: isHovered ? ["0, 200", "200, 0"] : "200, 0",
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </svg>

                    {/* Core highlight inside lightning */}
                    <div className="absolute top-1/4 left-1/3 w-2 h-6 bg-white/60 blur-[1px] rotate-[-20deg] rounded-full" />
                </div>
            </motion.div>
        </div>
    );
}

/* ─── Main Section Component ─── */

export function HowItWorks3D() {
    return (
        <section id="how-it-works" className="relative px-6 py-32 overflow-hidden bg-slate-50">
            {/* Background glows matching the Hero */}
            <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-[100px] opacity-60 mix-blend-multiply pointer-events-none" />
            <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-100/40 blur-[100px] opacity-60 mix-blend-multiply pointer-events-none" />

            <div className="mx-auto max-w-7xl relative z-10">
                <div className="text-center mb-24">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                        How it <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Works</span>
                    </h2>
                    <p className="mt-6 text-lg sm:text-xl text-slate-600 font-medium max-w-2xl mx-auto">
                        Three simple steps to generate authentic replies that feel like you.
                    </p>
                </div>

                <div className="grid gap-8 lg:gap-12 md:grid-cols-3 max-w-6xl mx-auto perspective-[1200px]">
                    {steps.map((step, index) => {
                        const [isHovered, setIsHovered] = useState(false);

                        return (
                            <motion.div
                                key={step.id}
                                className="relative flex flex-col items-center group cursor-pointer"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                {/* The Glassmorphic Card */}
                                <motion.div
                                    className="relative w-full h-[420px] rounded-[2rem] bg-white/40 border-[0.5px] border-white/60 shadow-xl shadow-slate-200/50 backdrop-blur-[12px] p-8 flex flex-col items-center text-center overflow-hidden transform-style-3d"
                                    animate={{
                                        rotateX: isHovered ? 5 : 0,
                                        rotateY: isHovered ? (index === 0 ? 5 : index === 2 ? -5 : 0) : 0,
                                        y: isHovered ? -10 : 0,
                                    }}
                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                >
                                    {/* Subtle gradient overlay that appears on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />

                                    {/* Top 3D Icon Container */}
                                    <div className="relative w-full h-[180px] mb-8 rounded-2xl bg-gradient-to-b from-slate-50/50 to-transparent border border-white/40 shadow-inner flex items-center justify-center perspective-[1200px] overflow-visible">
                                        <div className="w-full h-full transform scale-[0.70]">
                                            <step.IconComponent isHovered={isHovered} />
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <motion.div
                                        animate={{ translateZ: isHovered ? 20 : 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="relative z-10 flex flex-col items-center"
                                    >
                                        <div className="mb-4 inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200/60 shadow-sm text-sm font-bold text-slate-700">
                                            Step {step.id}
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                                            {step.title}
                                        </h3>
                                        <p className="text-[15px] leading-relaxed text-slate-600 font-medium px-2">
                                            {step.desc}
                                        </p>
                                    </motion.div>

                                    {/* Decorative bottom glow line */}
                                    <div className="absolute bottom-0 inset-x-12 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
