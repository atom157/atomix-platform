import { motion } from "framer-motion";

const steps = [
    {
        number: "1",
        title: "Install Extension",
        description: "Add AtomiX to Chrome in one click. It integrates directly into the X interface without any clunky popups.",
    },
    {
        number: "2",
        title: "Set Your Tone",
        description: "Configure custom prompts that match your personality, profession, and unique communication style.",
    },
    {
        number: "3",
        title: "Reply Instantly",
        description: "Click the AtomiX button directly on any tweet to instantly generate a context-aware, human-like reply.",
    },
];

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="relative px-6 py-32 overflow-hidden">
            {/* Background with subtle glow */}
            <div className="absolute inset-0 bg-slate-50/50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-100/40 rounded-full blur-[100px] -z-10" />

            <div className="mx-auto max-w-7xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-24"
                >
                    <h2 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight">How it works</h2>
                    <p className="mt-4 text-lg text-slate-600 font-medium">Three simple steps to authentic replies.</p>
                </motion.div>

                <div className="grid gap-12 md:grid-cols-3 relative">
                    {/* Connecting Line for desktop */}
                    <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-blue-100 via-purple-200 to-blue-100 -z-10" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="flex flex-col items-center text-center relative"
                        >
                            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-slate-200/50 border border-slate-100 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600 relative z-10 group-hover:scale-110 transition-transform">
                                {step.number}
                                {/* Ping animation behind the number */}
                                <div className="absolute inset-0 rounded-full border border-purple-400 opacity-0 animate-[ping_3s_ease-out_infinite]" style={{ animationDelay: `${index * 1.5}s` }} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                            <p className="max-w-sm text-[15px] leading-relaxed text-slate-600 font-medium px-4">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
