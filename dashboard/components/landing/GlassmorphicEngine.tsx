'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Copy, Heart, Repeat, MessageCircle, BarChart2 } from "lucide-react"

export function GlassmorphicEngine() {
    const [isHovered, setIsHovered] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [replyText, setReplyText] = useState("")
    const fullContext = "Communism is just bureaucracy in the limit. 'Soviet' is a Russian word for 'committee'..."
    const targetReply = "Fascinating perspective piece. The bureaucratic ceiling of historical communism often masked the original communal intent behind the nomenclature."

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>
        if (isGenerating) {
            let i = 0
            setReplyText("")
            const typeWriter = () => {
                if (i < targetReply.length) {
                    setReplyText(targetReply.substring(0, i + 1))
                    i++
                    timeout = setTimeout(typeWriter, 15)
                } else {
                    setIsGenerating(false)
                }
            }
            typeWriter()
        } else if (!isHovered) {
            setReplyText("")
        }
        return () => clearTimeout(timeout)
    }, [isGenerating, isHovered, targetReply])

    const handleTrigger = () => {
        if (!isGenerating && replyText === "") {
            setIsGenerating(true)
        }
    }

    return (
        <div
            className="relative w-full max-w-md aspect-square mx-auto cursor-pointer perspective-[1200px]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false)
                setIsGenerating(false)
            }}
            onClick={handleTrigger}
        >
            <motion.div
                className="relative w-full h-full transform-style-3d"
                animate={{
                    rotateX: isHovered ? 15 : 5,
                    rotateY: isHovered ? -15 : -5,
                    scale: isHovered ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >

                {/* Layer 1: Context (Elon's Tweet) */}
                <motion.div
                    className="absolute inset-x-0 bottom-12 rounded-2xl bg-white/40 border border-white/50 shadow-xl backdrop-blur-md p-6 origin-center"
                    animate={{
                        translateZ: isHovered ? -80 : 0,
                        opacity: isHovered ? 0.6 : 1,
                        y: isHovered ? 40 : 0,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12 border border-slate-200">
                            <AvatarImage src="https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_400x400.jpg" alt="Elon Musk" />
                            <AvatarFallback>EM</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">Elon Musk</span>
                                <span className="text-slate-500 text-sm">@elonmusk</span>
                                <span className="text-slate-500 text-sm">· 2h</span>
                            </div>
                            <p className="mt-2 text-slate-800 text-[15px] leading-relaxed">
                                {fullContext}
                            </p>
                            <div className="flex items-center justify-between mt-4 text-slate-500 max-w-xs">
                                <MessageCircle className="w-4 h-4 cursor-pointer hover:text-blue-500" />
                                <Repeat className="w-4 h-4 cursor-pointer hover:text-green-500" />
                                <Heart className="w-4 h-4 cursor-pointer hover:text-red-500" />
                                <BarChart2 className="w-4 h-4 cursor-pointer hover:text-blue-500" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Layer 2: Processing / Magic (The Glowing Connection) */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    animate={{
                        translateZ: isHovered ? 40 : 0,
                        opacity: isGenerating ? 1 : 0,
                    }}
                    transition={{ duration: 0.4 }}
                >
                    {isGenerating && (
                        <div className="relative w-full h-full overflow-hidden">
                            {/* Abstract glowing data lines moving upwards */}
                            <motion.div
                                className="absolute bottom-1/4 left-1/2 w-0.5 h-32 bg-gradient-to-t from-transparent via-blue-500 to-purple-500 blur-[1px]"
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: -100, opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                            />
                            <motion.div
                                className="absolute bottom-1/4 left-[45%] w-0.5 h-24 bg-gradient-to-t from-transparent via-purple-500 to-blue-500 blur-[1px]"
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: -150, opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.2 }}
                            />
                            <motion.div
                                className="absolute bottom-1/4 left-[55%] w-0.5 h-28 bg-gradient-to-t from-transparent via-blue-400 to-indigo-500 blur-[1px]"
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: -120, opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 1.1, ease: "linear", delay: 0.4 }}
                            />
                        </div>
                    )}
                </motion.div>

                {/* Layer 3: Action (AtomiX Button & Generation Output) */}
                <motion.div
                    className="absolute inset-x-0 bottom-4 rounded-2xl bg-white/80 border border-white shadow-2xl backdrop-blur-xl p-4 origin-center"
                    animate={{
                        translateZ: isHovered ? 120 : 0,
                        y: isHovered ? -20 : 0,
                        opacity: 1,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">✨</span>
                                AtomiX Reply
                            </div>
                            {!isGenerating && replyText === "" && (
                                <Button
                                    size="sm"
                                    className="h-8 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                                    onClick={(e) => { e.stopPropagation(); handleTrigger() }}
                                >
                                    Generate
                                </Button>
                            )}
                        </div>

                        <div className="w-full min-h-[80px] rounded-xl bg-slate-50/50 border border-slate-100 p-3 relative overflow-hidden">
                            {replyText ? (
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                    {replyText}
                                    {isGenerating && <span className="inline-block w-1.5 h-3.5 ml-1 bg-purple-500 animate-pulse" />}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-400 font-medium italic">
                                    {isHovered ? "Click 'Generate' to analyze..." : "Hover to expand layers..."}
                                </p>
                            )}

                            {replyText === targetReply && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute bottom-2 right-2 flex items-center gap-2"
                                >
                                    <div className="bg-white rounded-full px-2 py-1 shadow-sm border border-slate-100 text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                        ⚡ 1.2s
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md text-slate-400 hover:text-blue-600 bg-white shadow-sm border border-slate-100 pointer-events-none">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    )
}
