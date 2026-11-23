import React from 'react'

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      title: 'Proprietary Neural Network',
      description:
        'Zero reliance on OpenAI, Google, or Claude APIs. ASAI is powered by a custom PyTorch Transformer decoder architecture running directly on dedicated hardware.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
        </svg>
      ),
    },
    {
      title: 'Priority RTX GPU Execution',
      description:
        'Paid plans unlock elevated priority on your NVIDIA RTX GPU, delivering instant prompt tokenization and high-speed token generation with minimal latency.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      title: 'Complete Data Confidentiality',
      description:
        'Enterprise-grade privacy. Your prompts, codebases, financial spreadsheets, and documents never train external models and never leak to the public web.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      title: 'Scalable Team Collaboration',
      description:
        'Easily add team members, consolidate billing onto a single invoice, share project workspaces, and track department-level AI resource consumption.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ]

  return (
    <div className="benefits-section">
      <div className="benefits-header">
        <h2 className="benefits-title">Why creators, engineers, and teams choose ASAI</h2>
        <p className="benefits-subtitle">
          Built from the ground up for speed, sovereign intelligence, and developer control.
        </p>
      </div>

      <div className="benefits-grid">
        {benefits.map((b, i) => (
          <div className="benefit-card" key={i}>
            <div className="benefit-icon-box">{b.icon}</div>
            <h3 className="benefit-card-title">{b.title}</h3>
            <p className="benefit-card-desc">{b.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
