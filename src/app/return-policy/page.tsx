import Link from 'next/link';

export const metadata = {
  title: 'Return Policy - CommunityGuard',
  description: 'Return Policy for CommunityGuard AI-powered Discord community management platform.',
};

export default function ReturnPolicyPage() {
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
            Return Policy
          </h1>
          <p className="text-slate-400">Last updated: April 8, 2026</p>
          <p className="text-slate-500 text-sm mt-2">Legal Entity: <span className="text-[#5865F2] font-semibold">SAHANA PRAVEEN (CEO)</span></p>
        </div>

        <div className="bg-[#111318] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Digital Service Nature</h2>
              <p className="text-slate-400 leading-relaxed">
                CommunityGuard (CEO: SAHANA PRAVEEN) is a digital SaaS (Software as a Service) product. 
                As our service is delivered entirely online, traditional &quot;returns&quot; of physical goods do not apply. 
                Instead, we offer satisfaction guarantees and refund options as outlined below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Service Cancellation as Return</h2>
              <p className="text-slate-400 leading-relaxed">
                Since we provide digital services, cancelling your subscription within the eligible refund period 
                serves as the equivalent of a return. Please refer to our Cancellation Policy and Refund Policy 
                for detailed information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. 7-Day Satisfaction Guarantee</h2>
              <p className="text-slate-400 leading-relaxed">
                We offer a 7-day satisfaction guarantee for all new subscriptions. If you are not satisfied with 
                our service within the first 7 days of your subscription, you may request a full refund, which 
                effectively acts as a return of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Ineligible Returns</h2>
              <ul className="list-disc list-inside text-slate-400 space-y-2">
                <li>Services used beyond the 7-day guarantee period</li>
                <li>Partially consumed subscription periods</li>
                <li>Custom configurations or setup services already rendered</li>
                <li>Data analysis reports already generated</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. How to Request a Return/Refund</h2>
              <p className="text-slate-400 leading-relaxed">
                To request a return (refund) of our digital service, please contact us:
              </p>
              <div className="bg-[#0c0e12] rounded-xl p-6 border border-white/5 mt-4">
                <p className="text-slate-400"><strong className="text-white">Email:</strong> <a href="mailto:sahanapraveen2006@gmail.com" className="text-[#5865F2] hover:underline">sahanapraveen2006@gmail.com</a></p>
                <p className="text-slate-400 mt-2"><strong className="text-white">Phone:</strong> <a href="tel:+917321086174" className="text-[#5865F2] hover:underline">+91 73210 86174</a></p>
                <p className="text-slate-400 mt-4 text-sm">Please include your order ID and reason for the return request.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Processing</h2>
              <p className="text-slate-400 leading-relaxed">
                Return (refund) requests are processed within 5-7 business days. Once approved, the refund will be 
                credited to your original payment method within 5-10 business days, depending on your bank or payment provider.
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
