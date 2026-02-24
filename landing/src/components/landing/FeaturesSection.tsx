import { motion } from "framer-motion";

const features = [
    {
        title: "Custom Prompts",
        description: "Create your own voice and style. Define how you want to sound so every reply feels authentic.",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 013.002 3.002L7.368 18.635a2 2 0 01-.855.506l-2.872.838a.5.5 0 01-.62-.62l.838-2.872a2 2 0 01.506-.854z" />
            </svg>
        ),
    },
    {
        title: "Context Analysis",
        description: "Reads the original tweet, thread, and tone before generating. Your reply always fits the conversation.",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
        ),
    },
    {
        title: "Human-Like Replies",
        description: "No robotic text. AtomiX generates replies that match your personality and feel genuinely human.",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
        ),
    },
    {
        title: "One-Click Generation",
        description: "Just click the AtomiX button right inside the X reply box. No tab switching, no copy-pasting.",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
    },
    {
        title: "Under 2 Seconds",
        description: "Lightning-fast generation powered by GPT-4o. Get your perfectly-tuned reply in a blink.",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
        ),
    },
    {
        title: "Privacy First",
        description: "Your data stays yours. We never store tweets or personal information. Fully transparent.",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
        ),
    },
];

const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

export function FeaturesSection() {
    return (
        <section id="features" className="px-6 py-32 bg-white relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <div className="mx-auto max-w-7xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight">Everything you need</h2>
                    <p className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto">Powerful features that make your X replies stand out, engineered for speed and authenticity.</p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {features.map((f) => (
                        <motion.div
                            variants={itemVariants}
                            key={f.title}
                            className="group relative rounded-3xl border border-slate-100 bg-white/50 p-8 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 hover:border-slate-200"
                        >
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white to-transparent opacity-0 transition-opacity group-hover:opacity-100 -z-10" />
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600 shadow-inner border border-blue-100/50 group-hover:scale-110 transition-transform duration-300">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                            <p className="text-[15px] leading-relaxed text-slate-600 font-medium">{f.description}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
