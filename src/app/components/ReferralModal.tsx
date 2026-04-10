"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { applyReferralCode, skipReferral, hasSeenReferralPrompt } from "@/app/dashboard/referrals/actions";

export default function ReferralModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkPrompt() {
      const { shown } = await hasSeenReferralPrompt();
      if (!shown) {
        setIsOpen(true);
      }
    }
    checkPrompt();
  }, []);

  const handleApply = async () => {
    if (!code.trim()) return;
    
    setIsLoading(true);
    const result = await applyReferralCode(code.trim().toUpperCase());
    setIsLoading(false);
    
    if (result.success) {
      setResult({ success: true, message: result.message });
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 2000);
    } else {
      setResult({ success: false, message: result.error || "Failed to apply code" });
    }
  };

  const handleSkip = async () => {
    await skipReferral();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111318] border border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
            🎁
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Have a Referral Code?</h2>
          <p className="text-slate-400 text-sm">
            Enter a friend&apos;s code and <span className="text-emerald-400 font-semibold">both get 3 days FREE!</span>
          </p>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., USER_AB12)"
              className="w-full bg-[#0c0e12] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center font-mono tracking-wider"
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
            />
          </div>

          {/* Result Message */}
          {result && (
            <div className={`p-3 rounded-xl text-sm text-center ${
              result.success 
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}>
              {result.message}
            </div>
          )}

          {/* Apply Button */}
          <button
            onClick={handleApply}
            disabled={isLoading || !code.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Applying...
              </span>
            ) : (
              "Apply Code & Get 3 Days Free"
            )}
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            I don&apos;t have a code → Skip
          </button>
        </div>

        {/* Info */}
        <p className="mt-6 text-xs text-slate-600 text-center">
          You can always add a referral code later from the Referrals page.
        </p>
      </div>
    </div>
  );
}
