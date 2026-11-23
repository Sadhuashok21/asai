import React, { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const FAQS: FAQItem[] = [
  {
    question: 'Can I upgrade, downgrade, or cancel anytime?',
    answer:
      'Yes, absolutely. You can upgrade to Plus or Pro instantly, switch between monthly and yearly billing cycles, or cancel your subscription at any time directly from the Subscription settings tab. When you cancel, you retain full access until the end of your prepaid billing period.',
  },
  {
    question: 'How are daily messages and limits counted?',
    answer:
      'Each conversational turn with ASAI consumes 1 message from your daily quota. Quotas automatically reset every 24 hours at 00:00 UTC. If you require higher throughput, upgrading unlocks up to 500 messages per day on Pro and 5,000 messages per day on Business.',
  },
  {
    question: 'What happens if I exceed my daily message quota?',
    answer:
      'When you reach your daily limit, ASAI displays a clear notification showing your quota status and provides a 1-click upgrade option. Your conversation history, past outputs, and files remain completely accessible while you wait for the daily counter to refresh.',
  },
  {
    question: 'Are image generation credits renewed monthly?',
    answer:
      'Yes. Your monthly allowance of ComfyUI local image generation credits renews on the first day of each billing cycle. Unused credits do not roll over to subsequent months.',
  },
  {
    question: 'Is my data sent to OpenAI, Google, or external third parties?',
    answer:
      'Never. ASAI is architected with a proprietary GPT-style Transformer decoder neural network that runs on local hardware. We do not transmit your queries, documents, code, or data to any external LLM vendor or third-party inference service.',
  },
  {
    question: 'What payment methods are supported in India?',
    answer:
      'We accept all standard Indian payment methods including UPI (Google Pay, PhonePe, Paytm, BHIM, Cred), all major Credit and Debit Cards (Visa, MasterCard, RuPay), and Internet Banking from over 50+ Indian banks via secure 256-bit encrypted checkout.',
  },
  {
    question: 'How does the Business plan differ from individual plans?',
    answer:
      'The ASAI Business plan is built for organizations requiring centralized billing, team workspaces, multi-user seat management, granular role permissions, and dedicated cluster inference resources to support enterprise workloads.',
  },
  {
    question: 'Can I get an invoice with GST for my business?',
    answer:
      'Yes. All payment receipts and invoices are GST-compliant and generated automatically. You can add your company name and GSTIN during checkout or in your Billing settings to download tax invoices for business accounting.',
  },
  {
    question: 'What is the refund policy?',
    answer:
      'We stand behind ASAI with a 7-day money-back guarantee. If you are not satisfied with your experience after upgrading, simply reach out to support within 7 days of purchase for a prompt refund.',
  },
]

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <div className="faq-section">
      <div className="faq-header">
        <h2 className="faq-title">Frequently asked questions</h2>
        <p className="faq-subtitle">
          Everything you need to know about ASAI subscriptions, billing, and neural network quotas.
        </p>
      </div>

      <div className="faq-list">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div className={`faq-item ${isOpen ? 'open' : ''}`} key={i}>
              <button
                type="button"
                className="faq-question-btn"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
              >
                <span className="faq-question-text">{item.question}</span>
                <span className="faq-chevron">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="faq-answer-content">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
