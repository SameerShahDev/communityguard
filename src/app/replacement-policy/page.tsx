import Link from 'next/link';

export const metadata = {
  title: 'Replacement Policy - CommunityGuard',
  description: 'Replacement Policy for CommunityGuard AI-powered Discord community management platform.',
};

export default function ReplacementPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0c0e12] py-12 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#5865F2] opacity-[0.05] blur-[150px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 hover:scale-105 transition-transform mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="text-white font-bold text-xl">CommunityGuard</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mt-6 mb-4">
            Replacement Policy
          </h1>
          <p className="text-slate-400">Last updated: April 8, 2026</p>
          <p className="text-slate-500 text-sm mt-2">Legal Entity: <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN</span></p>
        </div>

        <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Service-Level Replacement</h2>
              <p className="text-slate-400 leading-relaxed">
                As a digital service provider, CommunityGuard (operated by SAHANA PRAVEEN) does not deal in physical 
                goods. However, we offer service-level replacements in the form of account credits, service extensions, 
                or plan upgrades/downgrades as outlined in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Service Credit Replacements</h2>
              <div className="space-y-4 text-slate-400">
                <p>We may provide service credits as replacements in the following situations:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Extended downtime exceeding 24 hours due to our infrastructure issues</li>
                  <li>Data loss due to technical failures on our end</li>
                  <li>Incorrect billing or double charging</li>
                  <li>Service not delivered as described due to our error</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Plan Replacement/Exchange</h2>
              <p className="text-slate-400 leading-relaxed">
                Subscribers may request to replace (exchange) their current plan with another plan within the first 
                7 days of subscription. The price difference will be either charged or refunded accordingly. 
                After 7 days, plan changes will take effect from the next billing cycle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Service Extension Replacements</h2>
              <p className="text-slate-400 leading-relaxed">
                If we fail to meet our guaranteed service uptime of 99.9%, affected subscribers are eligible for 
                service extensions as compensation:
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2 mt-4">
                <li>1-4 hours downtime: 1 day extension</li>
                <li>4-12 hours downtime: 3 days extension</li>
                <li>12-24 hours downtime: 7 days extension</li>
                <li>More than 24 hours: 14 days extension or pro-rated refund option</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. How to Request a Replacement</h2>
              <p className="text-slate-400 leading-relaxed">
                To request a service replacement (credit, extension, or plan exchange), please contact us:
              </p>
              <div className="bg-[#0c0e12] rounded-xl p-6 border border-white/5 mt-4">
                <p className="text-slate-400"><strong className="text-white">Email:</strong> <a href="mailto:sahanapraveen2006@gmail.com" className="text-[#5865F2] hover:underline">sahanapraveen2006@gmail.com</a></p>
                <p className="text-slate-400 mt-2"><strong className="text-white">Phone:</strong> <a href="tel:+917321086174" className="text-[#5865F2] hover:underline">+91 73210 86174</a></p>
                <p className="text-slate-400 mt-4 text-sm">Include your account details, the issue encountered, and your preferred replacement option.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Processing Time</h2>
              <p className="text-slate-400 leading-relaxed">
                Replacement requests are reviewed and processed within 3-5 business days. Service credits and 
                extensions are applied immediately upon approval. Plan exchanges may take up to 24 hours to reflect 
                in your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Contact Information</h2>
              <div className="bg-[#0c0e12] rounded-xl p-6 border border-white/5">
                <p className="text-slate-400"><strong className="text-white">Business Name:</strong> SAHANA PRAVEEN</p>
                <p className="text-slate-400 mt-2"><strong className="text-white">Email:</strong> <a href="mailto:sahanapraveen2006@gmail.com" className="text-[#5865F2] hover:underline">sahanapraveen2006@gmail.com</a></p>
                <p className="text-slate-400 mt-2"><strong className="text-white">Phone:</strong> <a href="tel:+917321086174" className="text-[#5865F2] hover:underline">+91 73210 86174</a></p>
              </div>
            </section>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-600 text-sm">
            Operated by <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN</span>
          </p>
        </div>
      </div>
    </div>
  );
}
