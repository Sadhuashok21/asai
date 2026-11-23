import React from 'react'

export const PricingHero: React.FC = () => {
  return (
    <div className="pricing-hero">
      <div className="pricing-hero-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </svg>
        <span>ASCENTRACORE SOLUTIONS &bull; ASAI PLANS</span>
      </div>

      <h1 className="pricing-hero-title">
        Choose the right ASAI plan for your ambitions.
      </h1>

      <p className="pricing-hero-subtitle">
        Think Smarter. Build Faster. Powerful neural network intelligence for learning,
        coding, creating, and scaling teams &mdash; hosted locally and securely.
      </p>

      <div className="pricing-trust-indicators">
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>100% Private Local Inference</span>
        </div>
        <div className="trust-divider" />
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Dedicated RTX GPU Acceleration</span>
        </div>
        <div className="trust-divider" />
        <div className="trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>Zero External API Dependency</span>
        </div>
      </div>
    </div>
  )
}
