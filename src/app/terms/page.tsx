import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Terms & Conditions - IGone',
  description: 'Terms and Conditions for CommunityGuard AI-powered Discord community management platform.',
};

export default function TermsPage() {
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
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(88,101,242,0.4)]">
              <Image src="/icon.jpeg" alt="IGone Logo" width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-xl">IGone</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mt-6 mb-4">
            Terms & Conditions
          </h1>
          <p className="text-slate-400">Last updated: April 8, 2026</p>
          <p className="text-slate-500 text-sm mt-2">Legal Entity: <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN (CEO)</span></p>
        </div>

        {/* Content Card */}
        <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="prose prose-invert prose-slate max-w-none">
            <div className="space-y-8">
              {/* Section 1 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">01</span>
                  Acceptance of Terms
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  By accessing or using CommunityGuard (&quot;Service&quot;), you agree to be bound by these Terms and Conditions. 
                  If you disagree with any part of the terms, you may not access the Service. These Terms apply to all users, 
                  including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">02</span>
                  Discord Integration
                </h2>
                <p className="text-slate-400 leading-relaxed mb-3">
                  Our Service integrates with Discord to provide community analytics and management tools. By using our Service, you:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                  <li>Authorize us to access your Discord account information as permitted by Discord&apos;s API</li>
                  <li>Grant permission to read server member data, message activity, and community metrics</li>
                  <li>Understand that we comply with Discord&apos;s Terms of Service and Privacy Policy</li>
                  <li>May revoke access at any time through your Discord settings</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">03</span>
                  Data Usage & Privacy
                </h2>
                <p className="text-slate-400 leading-relaxed mb-3">
                  We collect and process data to provide our AI-powered community insights:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                  <li>Discord server metadata (name, ID, member count)</li>
                  <li>Member activity patterns and engagement metrics</li>
                  <li>Message frequency and timing data (not message content)</li>
                  <li>User IDs for churn analysis and risk scoring</li>
                </ul>
                <p className="text-slate-400 leading-relaxed mt-3">
                  All data is stored securely and used solely for providing community analytics. 
                  We do not sell or share your data with third parties. See our Privacy Policy for complete details.
                </p>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">04</span>
                  AI-Powered Features
                </h2>
                <p className="text-slate-400 leading-relaxed mb-3">
                  Our Service uses artificial intelligence to analyze community health and predict member churn:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                  <li>Churn risk scores are algorithmic predictions, not guarantees</li>
                  <li>Recovery email suggestions are automated recommendations</li>
                  <li>AI analysis is based on activity patterns, not personal characteristics</li>
                  <li>We continuously improve our models but cannot guarantee 100% accuracy</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">05</span>
                  Subscription & Billing
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  CommunityGuard offers both free and paid subscription plans. By subscribing to a paid plan:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4 mt-3">
                  <li>You agree to pay all fees associated with your subscription tier</li>
                  <li>Billing occurs monthly and is processed securely through Stripe</li>
                  <li>You may cancel your subscription at any time from your dashboard</li>
                  <li>Refunds are handled on a case-by-case basis</li>
                  <li>We reserve the right to modify pricing with 30 days notice</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">06</span>
                  Acceptable Use
                </h2>
                <p className="text-slate-400 leading-relaxed mb-3">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon or violate our intellectual property rights</li>
                  <li>Harass, abuse, or harm others</li>
                  <li>Send spam or unsolicited communications</li>
                  <li>Attempt to circumvent security measures or access unauthorized data</li>
                </ul>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">07</span>
                  Limitation of Liability
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  In no event shall CommunityGuard, nor its directors, employees, partners, agents, suppliers, 
                  or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, 
                  including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                  resulting from your access to or use of or inability to access or use the Service.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">08</span>
                  Changes to Terms
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                  If a revision is material we will try to provide at least 30 days&apos; notice prior to any new terms taking effect. 
                  What constitutes a material change will be determined at our sole discretion.
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] text-sm">09</span>
                  Contact Us
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  If you have any questions about these Terms, please contact us at{' '}
                  <a href="mailto:support@igone.ai" className="text-[#a2a9fa] hover:text-white transition-colors">
                    support@igone.ai
                  </a>
                </p>
              </section>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              By using CommunityGuard, you agree to these terms.
            </p>
            <div className="flex gap-4">
              <Link 
                href="/privacy" 
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
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
