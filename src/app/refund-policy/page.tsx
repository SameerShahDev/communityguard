import Link from 'next/link';

export const metadata = {
  title: 'Refund Policy - CommunityGuard',
  description: 'Refund Policy for CommunityGuard AI-powered Discord community management platform.',
};

export default function RefundPolicyPage() {
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
            Refund Policy
          </h1>
          <p className="text-slate-400">Last updated: April 8, 2026</p>
          <p className="text-slate-500 text-sm mt-2">Legal Entity: <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN (CEO)</span></p>
        </div>

        <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Overview</h2>
              <p className="text-slate-400 leading-relaxed">
                At CommunityGuard (CEO: SAHANA PRAVEEN), we strive to ensure your satisfaction with our services. 
                This Refund Policy outlines the conditions under which refunds may be granted for our subscription plans.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Refund Eligibility</h2>
              <div className="space-y-4 text-slate-400">
                <p><strong className="text-white">7-Day Money-Back Guarantee:</strong> New subscribers are eligible for a full refund within 7 days of their initial purchase, no questions asked.</p>
                <p><strong className="text-white">Pro-Rated Refunds:</strong> After the 7-day period, refunds may be granted on a pro-rated basis for unused service days in exceptional circumstances.</p>
                <p><strong className="text-white">Technical Issues:</strong> If our service is non-functional due to technical issues on our end for more than 48 hours, you may request a pro-rated refund.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Non-Refundable Items</h2>
              <ul className="list-disc list-inside text-slate-400 space-y-2">
                <li>Subscription renewals after the initial 7-day period</li>
                <li>Partially used monthly subscriptions beyond the guarantee period</li>
                <li>Add-on purchases and custom development services</li>
                <li>Promotional or discounted subscriptions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. How to Request a Refund</h2>
              <p className="text-slate-400 leading-relaxed">
                To request a refund, please contact us at <a href="mailto:sahanapraveen2006@gmail.com" className="text-[#5865F2] hover:underline">sahanapraveen2006@gmail.com</a> or call 
                <a href="tel:+917321086174" className="text-[#5865F2] hover:underline"> +91 73210 86174</a> within the eligible period. 
                Include your order ID and reason for the refund request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Processing Time</h2>
              <p className="text-slate-400 leading-relaxed">
                Refund requests are processed within 5-7 business days. The refund will be credited to the original 
                payment method used during the purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Contact Information</h2>
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
