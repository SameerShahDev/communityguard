"use client";

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LandingPage() {
  const [prices, setPrices] = useState({ pro: 3500, ent: 12000 });
  const supabase = createClient();

  useEffect(() => {
    async function getPrices() {
      const { data } = await supabase.from('admin_settings').select('pro_price, enterprise_price').single();
      if (data) setPrices({ pro: data.pro_price, ent: data.enterprise_price });
    }
    getPrices();
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0e12] text-[#f6f6fc] font-sans selection:bg-[#5865F2]/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0c0e12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-[0_0_20px_rgba(88,101,242,0.4)] transition-transform hover:scale-105">
                <span className="text-white font-bold text-xl">C</span>
             </div>
             <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">CommunityGuard</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all">Login</Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-24 px-4 overflow-hidden">
          {/* Animated Background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none">
             <div className="absolute top-[-100px] left-[-20%] w-[140%] h-[120%] bg-[#5865F2] opacity-[0.05] blur-[160px] rounded-[100%] animate-pulse" />
             <div className="absolute top-40 left-1/2 -translate-x-1/2 w-full max-w-lg h-full bg-gradient-to-b from-[#5865F2]/10 to-transparent blur-[120px]" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#a2a9fa] text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
               Trusted by 200+ Discord Communities
            </div>
            
            <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
               Prevent Silent <br/>
               <span className="text-[#5865F2] drop-shadow-[0_0_30px_rgba(88,101,242,0.3)]">Discord Churn</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
               Auto-detect members losing interest and recover them before they leave. The only health monitor for Discord communities.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
              <Link href="/login" className="w-full sm:w-auto px-10 py-5 bg-[#5865F2] hover:bg-[#4752c4] text-white font-extrabold rounded-2xl transition-all shadow-[0_8px_30px_rgba(88,101,242,0.4)] hover:shadow-[0_12px_40px_rgba(88,101,242,0.6)] hover:-translate-y-1 transform scale-105 active:scale-100">
                Start Protecting Free
              </Link>
              <Link href="#features" className="w-full sm:w-auto text-slate-400 hover:text-white font-bold transition-colors">
                 See how it works &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic Visual Mockup */}
        <section className="px-4 pb-32">
           <div className="max-w-6xl mx-auto relative">
              <div className="absolute inset-0 bg-[#5865F2]/20 blur-[100px] rounded-full group-hover:bg-[#5865F2]/30 transition-colors duration-1000" />
              <div className="relative bg-[#111318] border border-white/5 rounded-3xl p-4 md:p-8 shadow-2xl backdrop-blur-3xl">
                 <div className="bg-[#0c0e12] rounded-2xl border border-white/5 overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center group">
                    <div className="text-center">
                       <p className="text-[#a2a9fa] font-mono text-sm mb-4">Tracking 47,290+ Discord Members...</p>
                       <div className="flex items-center gap-4 justify-center">
                          <div className="w-3 h-32 rounded-full bg-slate-800 relative overflow-hidden">
                             <div className="absolute bottom-0 w-full h-[70%] bg-emerald-500 animate-bounce delay-75" />
                          </div>
                          <div className="w-3 h-32 rounded-full bg-slate-800 relative overflow-hidden">
                             <div className="absolute bottom-0 w-full h-[40%] bg-amber-500 animate-bounce" />
                          </div>
                          <div className="w-3 h-32 rounded-full bg-slate-800 relative overflow-hidden">
                             <div className="absolute bottom-0 w-full h-[85%] bg-red-500 animate-bounce delay-150" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4 bg-[#0c0e12] relative z-10">
           <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 hover:border-[#5865F2]/50 transition-colors group">
                 <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🔮</div>
                 <h3 className="text-xl font-bold mb-3 text-white">Identify High Risk</h3>
                 <p className="text-slate-400 leading-relaxed">Our bespoke formula tracks messages and warns you of silently churning members before they hit the leave button.</p>
              </div>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 hover:border-[#5865F2]/50 transition-colors group">
                 <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
                 <h3 className="text-xl font-bold mb-3 text-white">Auto-Recovery</h3>
                 <p className="text-slate-400 leading-relaxed">Send personalized "brother we miss you" emails using Resend AI, reminding them what they are missing in your server.</p>
              </div>
              <div className="p-8 rounded-3xl bg-[#111318] border border-white/5 hover:border-[#5865F2]/50 transition-colors group">
                 <div className="w-12 h-12 rounded-xl bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🛡️</div>
                 <h3 className="text-xl font-bold mb-3 text-white">Revenue Protection</h3>
                 <p className="text-slate-400 leading-relaxed">Every member saved is revenue retained. CommunityGuard pays for itself by reducing community churn by up to 40%.</p>
              </div>
           </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-4 relative">
           <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-6xl font-extrabold mb-6 italic tracking-tight">Simple Pricing</h2>
                 <p className="text-slate-400 text-lg">Invest in your community's long-term health.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                 {/* Pro Plan */}
                 <div className="bg-[#111318] border-2 border-[#5865F2]/30 rounded-[2.5rem] p-10 relative overflow-hidden group hover:border-[#5865F2]/60 transition-colors">
                    <div className="absolute top-0 right-0 p-4">
                       <span className="px-4 py-1.5 rounded-full bg-[#5865F2] text-xs font-bold text-white uppercase tracking-widest">Most Popular</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Pro Community</h3>
                    <div className="flex items-baseline gap-2 mb-8">
                       <span className="text-5xl font-extrabold text-white">₹{prices.pro}</span>
                       <span className="text-slate-400 font-bold">/month</span>
                    </div>
                    <ul className="space-y-5 mb-10 text-slate-300">
                       <li className="flex items-center gap-3"><span className="text-emerald-400">✓</span> Unlimited Member Tracking</li>
                       <li className="flex items-center gap-3"><span className="text-emerald-400">✓</span> Smart Churn Prediction</li>
                       <li className="flex items-center gap-3"><span className="text-emerald-400">✓</span> Auto-Recovery Emails (200/mo)</li>
                       <li className="flex items-center gap-3"><span className="text-emerald-400">✓</span> Advanced Admin Panel</li>
                    </ul>
                    <Link href="/login" className="block w-full py-5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-center font-extrabold rounded-2xl transition-all shadow-[0_4px_20px_rgba(88,101,242,0.3)]">
                       Get Started Pro
                    </Link>
                 </div>

                 {/* Enterprise Plan */}
                 <div className="bg-[#111318] border border-white/5 rounded-[2.5rem] p-10 group hover:border-white/10 transition-colors">
                    <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
                    <div className="flex items-baseline gap-2 mb-8">
                       <span className="text-5xl font-extrabold text-white">₹{prices.ent}</span>
                       <span className="text-slate-400 font-bold">/3 month</span>
                    </div>
                    <ul className="space-y-5 mb-10 text-slate-300">
                       <li className="flex items-center gap-3"><span className="text-slate-500">✓</span> Priority Support</li>
                       <li className="flex items-center gap-3"><span className="text-slate-500">✓</span> Custom Recovery Workflows</li>
                       <li className="flex items-center gap-3"><span className="text-slate-500">✓</span> Unlimited Recovery Emails</li>
                       <li className="flex items-center gap-3"><span className="text-slate-500">✓</span> Multi-Server Dashboard</li>
                    </ul>
                    <Link href="/login" className="block w-full py-5 bg-white/5 hover:bg-white/10 text-white text-center font-bold rounded-2xl border border-white/5 transition-all">
                       Contact Sales
                    </Link>
                 </div>
              </div>
           </div>
        </section>

        {/* Footer */}
        <footer className="py-16 border-t border-white/5 bg-[#0c0e12]">
           <div className="max-w-7xl mx-auto px-4">
              {/* Main Footer Content */}
              <div className="grid md:grid-cols-4 gap-8 mb-12">
                 {/* Brand */}
                 <div className="md:col-span-1">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center">
                          <span className="text-white font-bold text-lg">C</span>
                       </div>
                       <span className="text-lg font-bold text-white">CommunityGuard</span>
                    </div>
                    <p className="text-slate-500 text-sm mb-4">AI-powered Discord community management platform.</p>
                    <p className="text-slate-400 text-sm">Founded by <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN</span></p>
                 </div>

                 {/* Quick Links */}
                 <div>
                    <h4 className="text-white font-semibold mb-4">Legal</h4>
                    <ul className="space-y-2 text-sm">
                       <li><Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms & Conditions</Link></li>
                       <li><Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                       <li><Link href="/refund-policy" className="text-slate-400 hover:text-white transition-colors">Refund Policy</Link></li>
                       <li><Link href="/cancellation-policy" className="text-slate-400 hover:text-white transition-colors">Cancellation Policy</Link></li>
                       <li><Link href="/return-policy" className="text-slate-400 hover:text-white transition-colors">Return Policy</Link></li>
                       <li><Link href="/replacement-policy" className="text-slate-400 hover:text-white transition-colors">Replacement Policy</Link></li>
                    </ul>
                 </div>

                 {/* Contact */}
                 <div>
                    <h4 className="text-white font-semibold mb-4">Contact</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                       <li><a href="mailto:sahanapraveen2006@gmail.com" className="hover:text-[#5865F2] transition-colors">sahanapraveen2006@gmail.com</a></li>
                       <li><a href="tel:+917321086174" className="hover:text-[#5865F2] transition-colors">+91 73210 86174</a></li>
                       <li><Link href="/contact" className="hover:text-[#5865F2] transition-colors">Contact Us</Link></li>
                    </ul>
                 </div>

                 {/* Social */}
                 <div>
                    <h4 className="text-white font-semibold mb-4">Follow Us</h4>
                    <div className="flex gap-4">
                       <a href="https://www.instagram.com/sameershahdev/" target="_blank" rel="noopener" className="text-slate-400 hover:text-pink-500 transition-colors">Instagram</a>
                       <a href="https://www.linkedin.com/in/sameershahdev" target="_blank" rel="noopener" className="text-slate-400 hover:text-blue-500 transition-colors">LinkedIn</a>
                       <a href="https://www.facebook.com/Sameershahdev" target="_blank" rel="noopener" className="text-slate-400 hover:text-blue-600 transition-colors">Facebook</a>
                       <a href="https://youtube.com/@sameershahdev" target="_blank" rel="noopener" className="text-slate-400 hover:text-red-500 transition-colors">YouTube</a>
                    </div>
                 </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                 <p className="text-slate-500 text-sm">&copy; 2025 CommunityGuard.ai All rights reserved.</p>
                 <p className="text-slate-500 text-sm">Founded by <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN</span></p>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}
