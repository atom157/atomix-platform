import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md bg-white/70 border-b border-slate-100">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Logo Placeholder */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">✨</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">AtomiX</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                    <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
                    <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
                    <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
                </nav>

                <div className="flex items-center gap-4">
                    <a href="#login" className="text-sm font-medium text-slate-600 hover:text-slate-900 hidden md:block">Log in</a>
                    <Button className="bg-slate-900 text-white rounded-full px-5 hover:bg-slate-800">
                        Get Extension
                    </Button>
                </div>
            </div>
        </header>
    );
}
