'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

export function CheckoutTrigger() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        const checkoutPlan = searchParams.get('checkout');

        if (checkoutPlan === 'pro' && !isCheckingOut) {
            setIsCheckingOut(true);

            const handleCheckout = async () => {
                try {
                    const supabase = createClient();
                    const { data: { session } } = await supabase.auth.getSession();

                    if (!session?.user?.email) {
                        console.error('CheckoutTrigger: User email not yet hydrated.');
                        setIsCheckingOut(false);
                        return;
                    }

                    const response = await fetch('/api/payments/create-invoice', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: session.user.email }),
                    });

                    const data = await response.json();

                    if (data.paymentUrl) {
                        window.location.href = data.paymentUrl;
                    } else {
                        console.error('No payment URL found:', data.error);
                        setIsCheckingOut(false);
                    }
                } catch (error) {
                    console.error('Checkout redirect error:', error);
                    setIsCheckingOut(false);
                }
            };

            handleCheckout();
        }
    }, [searchParams, isCheckingOut]);

    if (!isCheckingOut) return null;

    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl shadow-purple-500/20 max-w-sm w-full mx-4 border border-purple-100">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                <h3 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Preparing Checkout
                </h3>
                <p className="text-slate-500 text-center font-medium">
                    Securely redirecting to our payment partner...
                </p>
            </div>
        </div>
    );
}
