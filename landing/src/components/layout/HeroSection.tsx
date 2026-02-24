import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { GlassmorphicEngine } from "../3d/GlassmorphicEngine";

export function HeroSection() {
    const container: any = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 },
        },
    };

    const item: any = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
    };

    return (
        <section className="relative w-full min-h-screen pt-24 pb-12 flex items-center overflow-hidden">
            {/* Background gradients for the "vibrant neon accents" on a white theme */}
            <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-100/50 blur-3xl opacity-60 mix-blend-multiply" />
                <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-100/50 blur-3xl opacity-60 mix-blend-multiply" />
            </div>

            <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center z-10">

                {/* Left Column: Copy & Actions */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col items-start gap-8 max-w-xl relative"
                >
                    <motion.div variants={item}>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-4 py-1.5 rounded-full flex gap-2 items-center text-sm font-medium">
                            <span className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                            </span>
                            <span>5.0 Rating | Saves 2+ hours a week</span>
                        </Badge>
                    </motion.div>

                    <motion.div variants={item} className="space-y-4">
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                            Reply Like You, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Not Like AI</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                            Custom prompts + context analysis = replies that sound human.
                            Read the context and generate perfectly-tuned responses right inside X in under 2 seconds.
                        </p>
                    </motion.div>

                    <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 rounded-full px-8 h-14 text-base font-semibold group relative overflow-hidden transition-all hover:scale-[1.02]">
                            <span className="relative z-10 flex items-center gap-2">
                                Add to Chrome — Free
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 transition-all">
                            View Demo
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Right Column: 3D Glassmorphic Engine */}
                <div className="relative w-full h-[600px] perspective-[1200px] flex items-center justify-center">
                    <GlassmorphicEngine />
                </div>

            </div>
        </section>
    );
}
