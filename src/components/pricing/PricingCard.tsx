import React from 'react'
import { SubscriptionPlan } from '../../api'

interface PricingCardProps {
  plan: SubscriptionPlan
  billingCycle: 'monthly' | 'yearly'
  isCurrentPlan: boolean
  onSelect: (plan: SubscriptionPlan) => void
  currencySymbol?: string
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  billingCycle,
  isCurrentPlan,
  onSelect,
  currencySymbol = '₹',
}) => {
  const isFree = plan.plan_id === 'free' || plan.price_monthly_inr === 0
  const isBusiness = plan.plan_id === 'business'
  const isPro = plan.plan_id === 'pro'

  // Calculate display price
  let displayPrice = ''
  let subPriceText = ''

  if (isFree) {
    displayPrice = `${currencySymbol}0`
    subPriceText = 'Free forever &bull; No card required'
  } else if (isBusiness) {
    if (billingCycle === 'yearly') {
      displayPrice = `${currencySymbol}19,990`
      subPriceText = 'Per year starting at 5 seats &bull; ₹1,665/mo'
    } else {
      displayPrice = `${currencySymbol}1,999`
      subPriceText = 'Per month starting at 5 team seats'
    }
  } else if (billingCycle === 'yearly') {
    const monthlyEquivalent = Math.round(plan.price_yearly_inr / 12)
    displayPrice = `${currencySymbol}${monthlyEquivalent}`
    subPriceText = `Billed annually at ${currencySymbol}${plan.price_yearly_inr.toLocaleString('en-IN')}/yr`
  } else {
    displayPrice = `${currencySymbol}${plan.price_monthly_inr.toLocaleString('en-IN')}`
    subPriceText = `Billed monthly &bull; Cancel anytime`
  }

  // Quota summary tags
  const quotaHighlights = [
    {
      label: `${plan.daily_message_limit.toLocaleString('en-IN')} msgs/day`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: `${plan.monthly_image_credits.toLocaleString('en-IN')} images/mo`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
      ),
    },
    {
      label: `Up to ${plan.max_doc_size_mb}MB docs`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
  ]

  return (
    <div
      className={`pricing-card ${isPro ? 'recommended' : ''} ${isBusiness ? 'business' : ''} ${
        isCurrentPlan ? 'current-tier' : ''
      }`}
    >
      {/* Top Header / Badge */}
      <div className="pricing-card-header">
        <div className="plan-name-row">
          <h3 className="plan-name">{plan.name}</h3>
          {plan.badge && (
            <span className={`plan-badge ${isPro ? 'badge-pro' : 'badge-general'}`}>
              {isPro && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
              {plan.badge}
            </span>
          )}
        </div>
        <p className="plan-tagline">{plan.tagline}</p>
      </div>

      {/* Pricing Amount */}
      <div className="pricing-amount-block">
        <div className="price-line">
          <span className="price-currency">{displayPrice}</span>
          {!isFree && <span className="price-period">/ month</span>}
        </div>
        <div
          className="price-subtext"
          dangerouslySetInnerHTML={{ __html: subPriceText }}
        />
      </div>

      {/* Action CTA Button */}
      <div className="pricing-cta-block">
        <button
          type="button"
          className={`pricing-cta-button ${
            isPro ? 'btn-pro-primary' : isCurrentPlan ? 'btn-current' : 'btn-standard'
          }`}
          onClick={() => onSelect(plan)}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Current Plan</span>
            </>
          ) : (
            <>
              <span>{plan.cta_text || (isFree ? 'Get Started Free' : `Upgrade to ${plan.name}`)}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Key Quota Badges */}
      <div className="pricing-quotas">
        {quotaHighlights.map((q, idx) => (
          <div className="quota-pill" key={idx}>
            <span className="quota-icon">{q.icon}</span>
            <span className="quota-text">{q.label}</span>
          </div>
        ))}
      </div>

      {/* Features Included List */}
      <div className="pricing-features-section">
        <div className="features-section-title">
          {isFree ? 'Included with Free:' : `Everything in ${isBusiness ? 'Pro' : isPro ? 'Plus' : 'Free'}, plus:`}
        </div>
        <ul className="pricing-features-list">
          {plan.features_highlight.map((feature, i) => (
            <li className="feature-item" key={i}>
              <span className="check-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="feature-text">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
