import Link from 'next/link';
import { Mail, Phone, Instagram, Linkedin, Facebook, Youtube } from 'lucide-react';

export const metadata = {
  title: 'Contact Us - CommunityGuard',
  description: 'Contact CommunityGuard - SAHANA PRAVEEN. Get in touch for support.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0c0e12] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-white font-bold text-xl">CommunityGuard</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white mt-6 mb-4">Contact Us</h1>
          <p className="text-slate-400">We&apos;d love to hear from you!</p>
          <p className="text-slate-500 text-sm mt-2">Operated by <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN</span></p>
        </div>

        <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
              <div className="space-y-4">
                <a href="mailto:sahanapraveen2006@gmail.com" className="flex items-center gap-4 text-slate-400 hover:text-[#5865F2]">
                  <Mail className="w-5 h-5" /> sahanapraveen2006@gmail.com
                </a>
                <a href="tel:+917321086174" className="flex items-center gap-4 text-slate-400 hover:text-[#5865F2]">
                  <Phone className="w-5 h-5" /> +91 73210 86174
                </a>
              </div>
              <h3 className="text-xl font-bold text-white mt-8 mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/sameershahdev/" target="_blank" rel="noopener" className="text-slate-400 hover:text-pink-500"><Instagram className="w-6 h-6" /></a>
                <a href="https://www.linkedin.com/in/sameershahdev" target="_blank" rel="noopener" className="text-slate-400 hover:text-blue-500"><Linkedin className="w-6 h-6" /></a>
                <a href="https://www.facebook.com/Sameershahdev" target="_blank" rel="noopener" className="text-slate-400 hover:text-blue-600"><Facebook className="w-6 h-6" /></a>
                <a href="https://youtube.com/@sameershahdev" target="_blank" rel="noopener" className="text-slate-400 hover:text-red-500"><Youtube className="w-6 h-6" /></a>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Send Message</h2>
              <form className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-xl bg-[#0c0e12] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#5865F2]" />
                <input type="email" placeholder="Your Email" className="w-full px-4 py-3 rounded-xl bg-[#0c0e12] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#5865F2]" />
                <textarea placeholder="Your Message" rows={4} className="w-full px-4 py-3 rounded-xl bg-[#0c0e12] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"></textarea>
                <button type="submit" className="w-full py-3 rounded-xl bg-[#5865F2] text-white font-semibold hover:bg-[#4752C4] transition-colors">Send Message</button>
              </form>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-600 text-sm">Operated by <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN</span></p>
        </div>
      </div>
    </div>
  );
}
