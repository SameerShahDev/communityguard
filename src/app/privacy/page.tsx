import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - CommunityGuard',
  description: 'Privacy Policy for CommunityGuard AI-powered Discord community management platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0c0e12] py-12 px-4">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#5865F2] opacity-[0.05] blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#5865F2] opacity-[0.03] blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 hover:scale-105 transition-transform mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center shadow-[0_0_20px_rgba(88,101,242,0.4)]">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-white font-bold text-xl">CommunityGuard</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mt-6 mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400">Last updated: April 6, 2026</p>
        </div>

        {/* Content Card */}
        <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="prose prose-invert prose-slate max-w-none">
            <div className="space-y-8">
              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">01</span>
                  Introduction
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  CommunityGuard (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                  when you use our Discord community management platform. Please read this privacy policy carefully. 
                  If you do not agree with the terms of this privacy policy, please do not access the application.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">02</span>
                  Information We Collect
                </h2>
                <p className="text-slate-400 leading-relaxed mb-3">
                  We collect information that you provide directly to us when using our Service:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                  <li><strong>Discord Account Information:</strong> When you authenticate with Discord, we receive your Discord ID, username, email address, and profile information.</li>
                  <li><strong>Server Information:</strong> Discord server IDs, server names, and member counts for servers you connect.</li>
                  <li><strong>Usage Data:</strong> Member activity patterns, message frequency, and engagement metrics (not message content).</li>
                  <li><strong>Device Information:</strong> Browser type, IP address, and operating system for analytics and security.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">03</span>
                  How We Use Your Information
                </h2>
                <p className="text-slate-400 leading-relaxed mb-3">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                  <li>Provide and maintain our community management services</li>
                  <li>Generate AI-powered churn risk predictions and analytics</li>
                  <li>Send recovery emails to at-risk community members</li>
                  <li>Improve our algorithms and service quality</li>
                  <li>Communicate with you about updates, security alerts, and support</li>
                  <li>Prevent fraud and ensure platform security</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">04</span>
                  Discord Data Access
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Our Service integrates with Discord&apos;s API. We access:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mt-3">
                  <li>Your Discord profile information (ID, username, avatar)</li>
                  <li>Server information you authorize us to access</li>
                  <li>Member activity data (join dates, last active timestamps)</li>
                  <li>Message metadata (frequency, timing) - not content</li>
                </ul>
                <p className="text-slate-400 leading-relaxed mt-3">
                  We never read, store, or process the content of Discord messages. 
                  You can revoke our access at any time through your Discord settings.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">05</span>
                  Data Security
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  We implement appropriate technical and organizational security measures 
                  to protect your personal information. This includes encryption in transit 
                  and at rest, secure database hosting with Supabase, and regular security audits. 
                  However, no method of transmission over the Internet or electronic storage 
                  is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">06</span>
                  Data Retention
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  We retain your information for as long as your account is active or as needed 
                  to provide you services. If you wish to delete your account or request that 
                  we no longer use your information, please contact us at{' '}
                  <a href="mailto:support@igone.ai" className="text-[#a2a9fa] hover:text-white transition-colors">
                    support@igone.ai
                  </a>.
                  We will retain and use your information as necessary to comply with legal obligations,
                  resolve disputes, and enforce our agreements.
                </p>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">07</span>
                  Your Rights
                </h2>
                <p className="text-slate-400 leading-relaxed mb-3">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                  <li>Access the personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Withdraw consent for data processing</li>
                  <li>Export your data in a portable format</li>
                </ul>
                <p className="text-slate-400 leading-relaxed mt-3">
                  To exercise these rights, please contact us using the information below.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">08</span>
                  Third-Party Services
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  We use trusted third-party services to operate our platform:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mt-3">
                  <li><strong>Supabase:</strong> For database hosting and authentication</li>
                  <li><strong>Discord:</strong> For community integration</li>
                  <li><strong>Stripe:</strong> For payment processing (if applicable)</li>
                  <li><strong>Cloudflare:</strong> For hosting and CDN services</li>
                </ul>
                <p className="text-slate-400 leading-relaxed mt-3">
                  Each of these services has their own privacy policies and security measures.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">09</span>
                  Changes to This Policy
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  We may update our Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new Privacy Policy on this page and updating the 
                  &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically 
                  for any changes.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">10</span>
                  Contact Us
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mt-3">
                  <li>Email: <a href="mailto:support@igone.ai" className="text-[#a2a9fa] hover:text-white transition-colors">support@igone.ai</a></li>
                  <li>Discord: Join our support server at <a href="#" className="text-[#a2a9fa] hover:text-white transition-colors">discord.gg/igone</a></li>
                </ul>
              </section>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              Your privacy is important to us.
            </p>
            <div className="flex gap-4">
              <Link 
                href="/terms" 
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link 
                href="/" 
                className="px-6 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl font-semibold text-sm transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Made By */}
        <div className="text-center mt-8">
          <p className="text-slate-600 text-sm">
            Made by <span className="text-[#5865F2] font-semibold">Sameer Shah</span> | CEO: <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN</span>
          </p>
        </div>
      </div>
    </div>
  );
}
