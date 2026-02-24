import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "/month",
        description: "Perfect for getting started",
        features: ["20 replies/month", "Basic prompts", "Standard generation", "Custom prompts"],
        cta: "Get Started",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "$9",
        period: "/month",
        description: "For power users on X",
        features: ["∞ unlimited replies/month", "Custom prompts", "Priority generation", "Analytics dashboard"],
        cta: "Get Started",
        highlighted: true,
    },
];

export function PricingSection() {
    return (
        <section id="pricing" className="px-6 py-32 bg-white relative">
            <div className="mx-auto max-w-6xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight">Simple pricing</h2>
                    <p className="mt-4 text-lg text-slate-600 font-medium">Choose the plan that fits your workflow. No hidden fees.</p>
                </motion.div>

                <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative rounded-3xl p-8 flex flex-col h-full bg-white transition-all duration-300 hover:-translate-y-2 ${plan.highlighted
                                ? "border-[2px] border-transparent shadow-2xl shadow-purple-500/10 scale-105 z-10"
                                : "border border-slate-200 shadow-sm"
                                }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-b from-blue-500 to-purple-600 -z-20">
                                    <div className="absolute inset-0 bg-white rounded-[22px] z-[-1]" />
                                </div>
                            )}

                            {plan.highlighted && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                                <p className="mt-2 text-[15px] font-medium text-slate-500">{plan.description}</p>
                                <div className="mt-6 flex items-baseline gap-1">
                                    <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                                    {plan.period && <span className="text-[15px] font-semibold text-slate-500">{plan.period}</span>}
                                </div>
                            </div>

                            <ul className="mb-8 flex flex-col gap-4 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-3 text-[15px] font-medium text-slate-600">
                                        <div className="mt-0.5 rounded-full bg-blue-50 p-1">
                                            <Check className="h-4 w-4 text-blue-600" strokeWidth={3} />
                                        </div>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full rounded-full h-12 text-[15px] font-semibold transition-all ${plan.highlighted
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 shadow-md shadow-blue-500/20 border-0"
                                    : "bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200"
                                    }`}
                            >
                                {plan.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
