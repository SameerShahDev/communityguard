import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Cancellation Policy - IGone',
  description: 'Cancellation Policy for IGone AI-powered Discord community management platform.',
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0c0e12] py-12 px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#5865F2] opacity-[0.05] blur-[150px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3 hover:scale-105 transition-transform mb-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <Image src="/icon.jpeg" alt="IGone Logo" width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-xl">IGone</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mt-6 mb-4">
            Cancellation Policy
          </h1>
          <p className="text-slate-400">Last updated: April 8, 2026</p>
          <p className="text-slate-500 text-sm mt-2">Legal Entity: <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN (CEO)</span></p>
        </div>

        <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Cancellation Rights</h2>
              <p className="text-slate-400 leading-relaxed">
                As a subscriber of Cigone (CEO: SAHANA PRAVEEN), you have the right to cancel your 
                subscription at any time. This policy explains how cancellations work and what to expect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How to Cancel</h2>
              <div className="space-y-4 text-slate-400">
                <p>You can cancel your subscription through the following methods:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Via your Dashboard: Go to Settings → Billing → Cancel Subscription</li>
                  <li>Email us at <a href="mailto:sahanapraveen2006@gmail.com" className="text-[#5865F2] hover:underline">sahanapraveen2006@gmail.com</a></li>
                  <li>Call us at <a href="tel:+917321086174" className="text-[#5865F2] hover:underline">+91 73210 86174</a></li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Cancellation Timing</h2>
              <div className="space-y-4 text-slate-400">
                <p><strong className="text-white">Monthly Subscriptions:</strong> Cancel anytime before your next billing date. You will continue to have access until the end of your current billing period.</p>
                <p><strong className="text-white">Annual Subscriptions:</strong> Cancel anytime. You will continue to have access until the end of your current annual billing period. No partial refunds for unused months except within the 7-day money-back guarantee period.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Immediate Cancellation</h2>
              <p className="text-slate-400 leading-relaxed">
                If you request immediate cancellation, your access will be terminated within 24 hours, and any applicable 
                refund will be processed according to our Refund Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Retention After Cancellation</h2>
              <p className="text-slate-400 leading-relaxed">
                After cancellation, your data will be retained for 30 days in case you decide to reactivate. 
                After 30 days, all personal data will be permanently deleted from our servers in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Reactivation</h2>
              <p className="text-slate-400 leading-relaxed">
                You can reactivate your subscription at any time by logging into your account and selecting a plan. 
                Your previous settings and data (if within the 30-day retention period) will be restored.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Contact Information</h2>
              <div className="bg-[#0c0e12] rounded-xl p-6 border border-white/5">
                <p className="text-slate-400"><strong className="text-white">Business Name:</strong> SAHANA PRAVEEN (CEO)</p>
                <p className="text-slate-400 mt-2"><strong className="text-white">Email:</strong> <a href="mailto:sahanapraveen2006@gmail.com" className="text-[#5865F2] hover:underline">sahanapraveen2006@gmail.com</a></p>
                <p className="text-slate-400 mt-2"><strong className="text-white">Phone:</strong> <a href="tel:+917321086174" className="text-[#5865F2] hover:underline">+91 73210 86174</a></p>
              </div>
            </section>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-600 text-sm">
            Made by <span className="text-[#5865F2] font-semibold">Sameer Shah</span> | CEO: <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN</span>
          </p>
        </div>
      </div>
    </div>
  );
}
