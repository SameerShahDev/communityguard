"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Star, Zap, Shield, Crown } from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for small communities',
      price: 0,
      yearlyPrice: 0,
      currency: '₹',
      features: [
        'Up to 50 members',
        'Basic activity tracking',
        '3 recovery emails/month',
        'Community insights',
        'Email support'
      ],
      limitations: [
        'No advanced analytics',
        'Limited automation',
        'No custom alerts'
      ],
      popular: false,
      color: 'from-slate-500 to-slate-600'
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'Great for growing communities',
      price: 299,
      yearlyPrice: 2990,
      currency: '₹',
      features: [
        'Up to 200 members',
        'Advanced activity tracking',
        'Unlimited recovery emails',
        'Priority email support',
        'Custom alerts',
        'Weekly reports',
        'Member segmentation'
      ],
      limitations: [],
      popular: false,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'pro',
      name: 'Professional',
      description: 'Best for large communities',
      price: 499,
      yearlyPrice: 4990,
      currency: '₹',
      features: [
        'Up to 1000 members',
        'Real-time monitoring',
        'AI-powered predictions',
        'Unlimited everything',
        'Phone support',
        'Custom integrations',
        'Advanced analytics',
        'API access',
        'White-label options'
      ],
      limitations: [],
      popular: true,
      color: 'from-[#5865F2] to-[#4752C4]'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For maximum scale',
      price: 999,
      yearlyPrice: 9990,
      currency: '₹',
      features: [
        'Unlimited members',
        'Dedicated account manager',
        'Custom AI models',
        'SLA guarantee',
        'On-premise option',
        'Custom contracts',
        '24/7 phone support',
        'Advanced security',
        'Custom branding'
      ],
      limitations: [],
      popular: false,
      color: 'from-purple-500 to-purple-600',
      badge: '2 MONTHS FREE'
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') return;
    
    setSelectedPlan(planId);
    try {
      const response = await fetch('/api/cashfree/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          failureUrl: `${window.location.origin}/pricing?error=true`,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        console.error('Checkout error:', result.error);
        setSelectedPlan(null);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setSelectedPlan(null);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e12]">
      {/* Header */}
      <div className="text-center py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Choose the perfect plan for your Discord community. Start free, upgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-[#111318] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-[#5865F2] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-[#5865F2] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 px-2 py-1 bg-emerald-500 text-xs text-white rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const displayPrice = billingCycle === 'monthly' ? plan.price : plan.yearlyPrice;
            const monthlyEquivalent = billingCycle === 'yearly' ? Math.floor(plan.yearlyPrice / 12) : plan.price;

            return (
              <div
                key={plan.id}
                className={`relative bg-[#111318] border rounded-2xl overflow-hidden transition-all hover:scale-105 ${
                  plan.popular
                    ? 'border-[#5865F2] shadow-[0_0_40px_rgba(88,101,242,0.3)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white px-4 py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                {/* Free Months Badge */}
                {plan.badge && (
                  <div className="absolute top-12 left-0 right-0 mx-auto w-fit">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 text-xs font-bold rounded-full">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                      {plan.id === 'free' && <Shield className="w-8 h-8 text-white" />}
                      {plan.id === 'starter' && <Star className="w-8 h-8 text-white" />}
                      {plan.id === 'pro' && <Zap className="w-8 h-8 text-white" />}
                      {plan.id === 'enterprise' && <Crown className="w-8 h-8 text-white" />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                    
                    {/* Price */}
                    <div className="mb-4">
                      {plan.price === 0 ? (
                        <div className="text-4xl font-bold text-white">Free</div>
                      ) : (
                        <div>
                          <div className="text-4xl font-bold text-white">
                            {plan.currency}{displayPrice}
                            <span className="text-lg text-slate-400 font-normal">
                              /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                          {billingCycle === 'yearly' && (
                            <div className="text-sm text-slate-400">
                              {plan.currency}{monthlyEquivalent}/month
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-400 text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={plan.id === 'free' || selectedPlan === plan.id}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      plan.id === 'free'
                        ? 'bg-white/10 text-white cursor-not-allowed'
                        : plan.popular
                        ? 'bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white hover:shadow-[0_4px_20px_rgba(88,101,242,0.4)]'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    } ${selectedPlan === plan.id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {plan.id === 'free' ? 'Current Plan' : 
                     selectedPlan === plan.id ? 'Processing...' : 
                     billingCycle === 'monthly' ? `Get ${plan.name}` : `Get ${plan.name} (Yearly)`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#111318] border border-white/10 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-3">Can I change plans anytime?</h3>
              <p className="text-slate-400">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-[#111318] border border-white/10 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-3">What payment methods do you accept?</h3>
              <p className="text-slate-400">We accept all major credit cards, debit cards, and UPI payments through Cashfree.</p>
            </div>
            <div className="bg-[#111318] border border-white/10 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-3">Is there a free trial?</h3>
              <p className="text-slate-400">Yes! All paid plans come with a 7-day free trial. No credit card required to start.</p>
            </div>
            <div className="bg-[#111318] border border-white/10 rounded-xl p-6 text-left">
              <h3 className="text-lg font-semibold text-white mb-3">Do you offer refunds?</h3>
              <p className="text-slate-400">We offer a 30-day money-back guarantee. If you're not satisfied, get a full refund.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-[#5865F2]/10 to-[#4752C4]/10 rounded-3xl p-12 border border-[#5865F2]/20">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to grow your community?</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of Discord server owners who trust Igone to protect and grow their communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white font-semibold rounded-xl hover:shadow-[0_4px_20px_rgba(88,101,242,0.4)] transition-all"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
