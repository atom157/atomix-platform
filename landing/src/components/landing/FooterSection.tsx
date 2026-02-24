export function FooterSection() {
    return (
        <footer className="border-t border-slate-100 bg-white px-6 py-12 relative overflow-hidden">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row relative z-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/20">
                        <span className="text-white font-bold text-sm">✨</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        Atomi<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">X</span>
                    </span>
                </div>

                <div className="flex items-center gap-8">
                    <a href="#privacy-policy" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Privacy Policy</a>
                    <a href="#terms" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Terms</a>
                    <a href="mailto:support@atomix.guru" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Contact</a>
                </div>

                <p className="text-sm font-medium text-slate-400">&copy; 2024 AtomiX. All rights reserved.</p>
            </div>
        </footer>
    );
}
