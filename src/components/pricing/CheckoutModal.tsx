import React, { useState } from 'react'
import {
  SubscriptionPlan,
  createSubscriptionCheckout,
  verifyPayment,
  createBusinessOrg,
} from '../../api'

interface CheckoutModalProps {
  plan: SubscriptionPlan
  billingCycle: 'monthly' | 'yearly'
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

declare global {
  interface Window {
    Razorpay?: any
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true)
      return
    }
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  billingCycle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState<string | null>(null)

  // Business fields
  const [orgName, setOrgName] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [orgSeats, setOrgSeats] = useState(5)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const isFree = plan.plan_id === 'free'
  const isBusiness = plan.plan_id === 'business'

  // Calculate pricing
  const basePrice = billingCycle === 'yearly' ? plan.price_yearly_inr : plan.price_monthly_inr
  const effectiveBasePrice = isBusiness
    ? (billingCycle === 'yearly' ? 19990 : 1999) * Math.max(1, Math.round(orgSeats / 5))
    : basePrice

  const discountAmount = couponApplied ? Math.round((effectiveBasePrice * couponDiscount) / 100) : 0
  const finalPrice = Math.max(0, effectiveBasePrice - discountAmount)

  const handleApplyCoupon = () => {
    setCouponError(null)
    const code = couponCode.trim().toUpperCase()
    if (!code) return

    if (code === 'ASAI20' || code === 'LAUNCH20') {
      setCouponApplied(true)
      setCouponDiscount(20)
      setCouponError(null)
    } else {
      setCouponError('Invalid coupon code. Try code "ASAI20" for 20% off.')
      setCouponApplied(false)
      setCouponDiscount(0)
    }
  }

  const handleProceedPayment = async () => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      // If Business plan, register org first
      if (isBusiness && orgName.trim()) {
        try {
          await createBusinessOrg(orgName.trim(), billingEmail.trim(), orgSeats)
        } catch {
          // Continue if already exists
        }
      }

      const checkoutRes = await createSubscriptionCheckout(
        plan.plan_id,
        billingCycle,
        couponApplied ? couponCode.trim() : ''
      )

      // 1. Free plan activation
      if (checkoutRes.is_free) {
        setSuccessMsg('Your plan has been updated to ASAI Free!')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1200)
        return
      }

      // Ensure Razorpay SDK is available
      const rzpLoaded = await loadRazorpayScript()

      // 2. Real Razorpay checkout flow
      if (
        !checkoutRes.is_test_mode &&
        rzpLoaded &&
        window.Razorpay &&
        checkoutRes.order_id &&
        checkoutRes.key_id
      ) {
        const options = {
          key: checkoutRes.key_id,
          amount: checkoutRes.amount_paise,
          currency: checkoutRes.currency || 'INR',
          name: 'Ascentracore Solutions',
          description: `ASAI ${plan.name} (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
          image: '/ascentra.webp',
          order_id: checkoutRes.order_id,
          modal: {
            ondismiss: function () {
              setLoading(false)
            },
            escape: true,
            backdropclose: false,
          },
          handler: async function (response: any) {
            setLoading(true)
            try {
              await verifyPayment(
                checkoutRes.transaction_id || '',
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              )
              setSuccessMsg('Payment confirmed! Your subscription is now active.')
              setTimeout(() => {
                onSuccess()
                onClose()
              }, 1200)
            } catch (err: any) {
              setError(`Payment verification failed: ${err.message}`)
            } finally {
              setLoading(false)
            }
          },
          prefill: {
            name: orgName || 'Ascentra User',
            email: billingEmail || 'user@ascentracore.com',
            contact: '',
          },
          notes: {
            platform: 'ASAI by Ascentracore',
            plan_id: plan.plan_id,
            billing_cycle: billingCycle,
          },
          theme: {
            color: '#10b981',
          },
        }

        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (resp: any) {
          setError(resp.error?.description || 'Payment failed or was declined.')
          setLoading(false)
        })
        rzp.open()
        setLoading(false)
        return
      }

      // 3. Fallback Test Mode (Instant Mock Activation)
      const mockPaymentId = `pay_mock_${Date.now()}`
      await verifyPayment(
        checkoutRes.transaction_id || '',
        checkoutRes.order_id || `order_mock_${Date.now()}`,
        mockPaymentId,
        'simulated_secure_signature'
      )

      setSuccessMsg(`Payment successful! Welcome to ${plan.name}.`)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout-modal-backdrop" onClick={onClose}>
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="checkout-modal-header">
          <div className="checkout-title-wrap">
            <span className="checkout-badge">SECURE UPGRADE</span>
            <h2 className="checkout-title">Subscribe to {plan.name}</h2>
          </div>
          <button type="button" className="checkout-close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="checkout-modal-body">
          {/* Order Summary Box */}
          <div className="checkout-summary-box">
            <div className="summary-row">
              <span className="summary-label">Selected Tier</span>
              <span className="summary-val font-semibold">{plan.name}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Billing Frequency</span>
              <span className="summary-val capitalize">
                {isFree ? 'Free Forever' : billingCycle === 'yearly' ? 'Annual (Yearly)' : 'Monthly'}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Daily Message Allowance</span>
              <span className="summary-val text-green-500 font-medium">
                {plan.daily_message_limit.toLocaleString('en-IN')} msgs/day
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Monthly Image Credits</span>
              <span className="summary-val text-green-500 font-medium">
                {plan.monthly_image_credits.toLocaleString('en-IN')} credits/mo
              </span>
            </div>
          </div>

          {/* Business Organization Input */}
          {isBusiness && (
            <div className="business-config-fields">
              <div className="field-group">
                <label>Company / Organization Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ascentracore Technologies"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label>Work Email for Billing &amp; Invoices</label>
                <input
                  type="email"
                  placeholder="billing@company.com"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                />
              </div>
              <div className="field-group">
                <label>Team Seats ({orgSeats} users)</label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={orgSeats}
                  onChange={(e) => setOrgSeats(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Discount Coupon Code Box */}
          {!isFree && (
            <div className="coupon-code-container">
              <div className="coupon-input-row">
                <input
                  type="text"
                  className="coupon-input"
                  placeholder="Coupon code (e.g. ASAI20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={couponApplied}
                />
                <button
                  type="button"
                  className="coupon-apply-btn"
                  onClick={handleApplyCoupon}
                  disabled={couponApplied || !couponCode.trim()}
                >
                  {couponApplied ? 'Applied' : 'Apply'}
                </button>
              </div>
              {couponApplied && (
                <div className="coupon-success-tag">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Coupon {couponCode.toUpperCase()} applied &bull; 20% discount</span>
                </div>
              )}
              {couponError && <div className="coupon-error-tag">{couponError}</div>}
            </div>
          )}

          {/* Price Breakdown */}
          <div className="checkout-price-breakdown">
            <div className="price-breakdown-row">
              <span>Base Subscription Price</span>
              <span>₹{effectiveBasePrice.toLocaleString('en-IN')}</span>
            </div>
            {couponApplied && (
              <div className="price-breakdown-row discount-row">
                <span>Discount ({couponDiscount}%)</span>
                <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="price-breakdown-row total-row">
              <span className="total-title">Total Due Today</span>
              <span className="total-amount">₹{finalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Alerts / Feedback */}
          {error && (
            <div className="checkout-alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="checkout-alert-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="checkout-modal-footer">
          <div className="payment-gateways-row">
            <span className="security-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              256-Bit SSL Encryption &bull; UPI &bull; Cards &bull; NetBanking
            </span>
          </div>

          <div className="modal-buttons-row">
            <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-modal-pay"
              onClick={handleProceedPayment}
              disabled={loading}
            >
              {loading ? (
                <span>Processing...</span>
              ) : isFree ? (
                <span>Confirm Free Plan</span>
              ) : (
                <span>Pay ₹{finalPrice.toLocaleString('en-IN')} &amp; Activate</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
