import { motion } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        q: "What is AtomiX?",
        a: "AtomiX is a Chrome extension that generates human-like replies on X (Twitter) using AI and your custom prompts. It reads the tweet context and produces a perfectly-tuned response in under 2 seconds.",
    },
    {
        q: "Is it free to use?",
        a: "Yes! The free plan includes 100 replies per month. If you need more, you can upgrade to Pro for 1,000 replies/month.",
    },
    {
        q: "Does it work with other platforms?",
        a: "Currently, AtomiX works exclusively with X (Twitter). Support for LinkedIn and other platforms is on our roadmap.",
    },
    {
        q: "How does context analysis work?",
        a: "AtomiX reads the original tweet, any conversation thread, and applies your custom prompts to generate a relevant, natural-sounding reply that fits the conversation.",
    },
    {
        q: "Is my data safe?",
        a: "Absolutely. We never store tweets or personal information. Your custom prompts are encrypted and only accessible by you.",
    },
];

export function FAQSection() {
    return (
        <section id="faq" className="px-6 py-32 bg-slate-50/50 relative">
            <div className="mx-auto max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-extrabold text-slate-900 md:text-5xl tracking-tight">Frequently asked questions</h2>
                    <p className="mt-4 text-lg text-slate-600 font-medium">Everything you need to know about AtomiX.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 md:p-8"
                >
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`} className="border-b border-slate-100 last:border-0">
                                <AccordionTrigger className="text-left text-[16px] font-semibold text-slate-900 hover:text-blue-600 transition-colors py-5 [&[data-state=open]>svg]:text-blue-600">
                                    {faq.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-[15px] leading-relaxed text-slate-600 font-medium pb-5">
                                    {faq.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    );
}
