import React from 'react'

interface BillingToggleProps {
  billingCycle: 'monthly' | 'yearly'
  onChange: (cycle: 'monthly' | 'yearly') => void
  discountPercent?: number
}

export const BillingToggle: React.FC<BillingToggleProps> = ({
  billingCycle,
  onChange,
  discountPercent = 17,
}) => {
  return (
    <div className="billing-toggle-wrapper">
      <div className="billing-toggle-container" role="radiogroup" aria-label="Billing cycle selector">
        <button
          type="button"
          role="radio"
          aria-checked={billingCycle === 'monthly'}
          className={`billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
          onClick={() => onChange('monthly')}
        >
          Monthly billing
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={billingCycle === 'yearly'}
          className={`billing-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
          onClick={() => onChange('yearly')}
        >
          <span>Yearly billing</span>
          <span className="billing-discount-badge">
            Save ~{discountPercent}%
          </span>
        </button>
      </div>
      <p className="billing-toggle-subtext">
        {billingCycle === 'yearly'
          ? 'Billed annually. 2 months free with annual commitment.'
          : 'Billed monthly. Switch or cancel anytime with one click.'}
      </p>
    </div>
  )
}
