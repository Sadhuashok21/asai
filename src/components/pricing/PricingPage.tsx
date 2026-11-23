import React, { useState, useEffect } from 'react'
import {
  SubscriptionPlan,
  UserSubscription,
  UsageStats,
  fetchSubscriptionPlans,
  fetchCurrentSubscription,
} from '../../api'
import { PricingHero } from './PricingHero'
import { BillingToggle } from './BillingToggle'
import { PricingCard } from './PricingCard'
import { PlanComparison } from './PlanComparison'
import { BenefitsSection } from './BenefitsSection'
import { FAQSection } from './FAQSection'
import { SubscriptionStatus } from './SubscriptionStatus'
import { CheckoutModal } from './CheckoutModal'

interface PricingPageProps {
  initialTab?: 'plans' | 'manage'
}

// Fallback tier data ensuring instantaneous render even offline
const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    plan_id: 'free',
    name: 'ASAI Free',
    tagline: 'Essential AI intelligence for students and casual creators.',
    badge: '',
    price_monthly_inr: 0,
    price_yearly_inr: 0,
    yearly_discount_percent: 0,
    daily_message_limit: 20,
    monthly_image_credits: 5,
    max_doc_size_mb: 5,
    monthly_doc_limit: 10,
    monthly_video_limit: 0,
    context_window: 64,
    has_advanced_code: false,
    has_priority_processing: false,
    has_voice: false,
    has_team_workspace: false,
    features_highlight: [
      'Access to ASAI Chatbot',
      '20 AI messages daily',
      '5 monthly image generation credits',
      '5MB document upload & analysis',
      'Standard response queue',
      '30-day conversation history',
    ],
    cta_text: 'Get Started Free',
    is_active: true,
    order: 1,
  },
  {
    plan_id: 'plus',
    name: 'ASAI Plus',
    tagline: 'Accelerated intelligence for power users, developers, and writers.',
    badge: '',
    price_monthly_inr: 299,
    price_yearly_inr: 2990,
    yearly_discount_percent: 17,
    daily_message_limit: 100,
    monthly_image_credits: 50,
    max_doc_size_mb: 25,
    monthly_doc_limit: 50,
    monthly_video_limit: 0,
    context_window: 256,
    has_advanced_code: true,
    has_priority_processing: false,
    has_voice: true,
    has_team_workspace: false,
    features_highlight: [
      'Everything in Free, plus:',
      '100 messages daily (5x Free)',
      '50 image generation credits / month',
      '25MB document context & spreadsheet support',
      '2x faster response priority',
      'Advanced coding assistant & syntax debugging',
      '90-day searchable history',
    ],
    cta_text: 'Upgrade to Plus',
    is_active: true,
    order: 2,
  },
  {
    plan_id: 'pro',
    name: 'ASAI Pro',
    tagline: 'Maximum individual power, priority RTX GPU queues, and long context.',
    badge: 'Recommended',
    price_monthly_inr: 799,
    price_yearly_inr: 7990,
    yearly_discount_percent: 17,
    daily_message_limit: 500,
    monthly_image_credits: 250,
    max_doc_size_mb: 100,
    monthly_doc_limit: 200,
    monthly_video_limit: 5,
    context_window: 512,
    has_advanced_code: true,
    has_priority_processing: true,
    has_voice: true,
    has_team_workspace: false,
    features_highlight: [
      'Everything in Plus, plus:',
      '500 messages daily & priority GPU queue',
      '250 high-res image generation credits',
      '100MB document processing (large PDF/codebases)',
      'Priority RTX GPU execution (sub-20ms first-token)',
      'Natural voice mode & audio generation',
      'AI video generation preview access',
      'Unlimited conversation history retention',
    ],
    cta_text: 'Get ASAI Pro',
    is_active: true,
    order: 3,
  },
  {
    plan_id: 'business',
    name: 'ASAI Business',
    tagline: 'Centralized governance, shared team workspaces, and custom scale.',
    badge: 'For Teams',
    price_monthly_inr: 1999,
    price_yearly_inr: 19990,
    yearly_discount_percent: 17,
    daily_message_limit: 5000,
    monthly_image_credits: 2500,
    max_doc_size_mb: 500,
    monthly_doc_limit: 2000,
    monthly_video_limit: 50,
    context_window: 1024,
    has_advanced_code: true,
    has_priority_processing: true,
    has_voice: true,
    has_team_workspace: true,
    features_highlight: [
      'Everything in Pro, plus:',
      'Shared team workspace for 5 to 100+ members',
      'Centralized billing & consolidated tax invoices',
      '5,000 messages / day pooled team quota',
      '2,500 image credits & 500MB documents',
      'Role-based access & admin usage dashboard',
      'Dedicated cluster allocation & 24/7 SLA',
    ],
    cta_text: 'Contact Sales',
    is_active: true,
    order: 4,
  },
]

export const PricingPage: React.FC<PricingPageProps> = ({ initialTab = 'plans' }) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'manage'>(initialTab)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS)
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Checkout modal state
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  useEffect(() => {
    loadPricingData()
  }, [])

  const loadPricingData = async () => {
    try {
      setLoading(true)
      const [plansData, subData] = await Promise.all([
        fetchSubscriptionPlans().catch(() => ({ plans: DEFAULT_PLANS })),
        fetchCurrentSubscription().catch(() => null),
      ])

      if (plansData?.plans && plansData.plans.length > 0) {
        setPlans(plansData.plans)
      }

      if (subData?.subscription) {
        setSubscription(subData.subscription)
      }
      if (subData?.usage) {
        setUsage(subData.usage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlanForCheckout(plan)
    setIsCheckoutOpen(true)
  }

  const handleCheckoutSuccess = () => {
    loadPricingData()
    setActiveTab('manage')
  }

  const currentPlanId = subscription?.plan?.plan_id || 'free'

  return (
    <div className="pricing-page-container">
      {/* Top Navigation Tabs */}
      <div className="pricing-tabs-bar">
        <button
          type="button"
          className={`pricing-tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <span>Subscription Plans</span>
        </button>

        <button
          type="button"
          className={`pricing-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>My Subscription &amp; Quotas</span>
        </button>
      </div>

      {activeTab === 'manage' ? (
        <SubscriptionStatus
          subscription={subscription}
          usage={usage}
          onUpgradeClick={() => setActiveTab('plans')}
          onRefresh={loadPricingData}
        />
      ) : (
        <>
          {/* Hero Header */}
          <PricingHero />

          {/* Monthly / Yearly Billing Switch */}
          <BillingToggle
            billingCycle={billingCycle}
            onChange={setBillingCycle}
            discountPercent={17}
          />

          {/* Pricing Tier Cards Grid */}
          <div className="pricing-cards-grid">
            {plans.map((p) => (
              <PricingCard
                key={p.plan_id}
                plan={p}
                billingCycle={billingCycle}
                isCurrentPlan={p.plan_id === currentPlanId}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>

          {/* Benefits Grid */}
          <BenefitsSection />

          {/* Feature Comparison Table */}
          <PlanComparison
            plans={plans}
            currentPlanId={currentPlanId}
            onSelectPlan={handleSelectPlan}
          />

          {/* FAQ Accordions */}
          <FAQSection />
        </>
      )}

      {/* Checkout Drawer / Modal */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          plan={selectedPlanForCheckout}
          billingCycle={billingCycle}
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  )
}
