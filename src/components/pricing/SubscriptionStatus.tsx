import React, { useState, useEffect } from 'react'
import {
  UserSubscription,
  UsageStats,
  PaymentTransaction,
  fetchPaymentHistory,
  cancelSubscription,
} from '../../api'

interface SubscriptionStatusProps {
  subscription: UserSubscription | null
  usage: UsageStats | null
  onUpgradeClick: () => void
  onRefresh: () => void
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription,
  usage,
  onUpgradeClick,
  onRefresh,
}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [cancelMessage, setCancelMessage] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    setLoadingHistory(true)
    try {
      const data = await fetchPaymentHistory()
      setTransactions(data.transactions || [])
    } catch {
      // In guest or local dev, history may be empty
      setTransactions([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your ASAI subscription? You will retain access until the end of the current billing cycle.')) {
      return
    }
    setCanceling(true)
    setCancelMessage(null)
    try {
      const res = await cancelSubscription()
      setCancelMessage(res.message || 'Subscription successfully scheduled for cancellation.')
      onRefresh()
    } catch (err: any) {
      setCancelMessage(`Cancellation failed: ${err.message}`)
    } finally {
      setCanceling(false)
    }
  }

  const plan = subscription?.plan
  const planName = plan?.name || 'ASAI Free'
  const isFree = !plan || plan.plan_id === 'free'

  // Usage calculations
  const msgLimit = usage?.daily_messages_limit || 20
  const msgUsed = usage?.daily_messages_used || 0
  const msgPercent = Math.min(100, Math.round((msgUsed / msgLimit) * 100))

  const imgLimit = usage?.monthly_images_limit || 5
  const imgUsed = usage?.monthly_images_used || 0
  const imgPercent = Math.min(100, Math.round((imgUsed / imgLimit) * 100))

  const docLimit = usage?.monthly_docs_limit || 10
  const docUsed = usage?.monthly_docs_used || 0
  const docPercent = Math.min(100, Math.round((docUsed / docLimit) * 100))

  return (
    <div className="subscription-status-view">
      {/* Active Plan Overview Card */}
      <div className="status-overview-card">
        <div className="status-header-row">
          <div>
            <div className="status-eyebrow">ACTIVE SUBSCRIPTION</div>
            <h2 className="status-plan-name">{planName}</h2>
            <p className="status-plan-tagline">
              {plan?.tagline || 'Essential neural network assistance for daily productivity.'}
            </p>
          </div>
          <div className="status-action-pill">
            <span className={`status-pill ${isFree ? 'pill-free' : 'pill-active'}`}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              {subscription?.status === 'canceled' ? 'Scheduled for cancellation' : 'Active'}
            </span>
          </div>
        </div>

        <div className="status-details-grid">
          <div className="status-detail-item">
            <span className="detail-label">Billing Cycle</span>
            <span className="detail-val">
              {isFree ? 'Forever Free' : subscription?.billing_cycle === 'yearly' ? 'Annual (Yearly)' : 'Monthly'}
            </span>
          </div>

          <div className="status-detail-item">
            <span className="detail-label">Renewal Date</span>
            <span className="detail-val">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No expiration'}
            </span>
          </div>

          <div className="status-detail-item">
            <span className="detail-label">Context Memory</span>
            <span className="detail-val">{plan?.context_window || 64} tokens</span>
          </div>

          <div className="status-detail-item">
            <span className="detail-label">Response Priority</span>
            <span className="detail-val">
              {plan?.has_priority_processing ? 'Priority RTX GPU' : 'Standard Queue'}
            </span>
          </div>
        </div>

        <div className="status-card-actions">
          <button type="button" className="btn-status-upgrade" onClick={onUpgradeClick}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{isFree ? 'Upgrade to Pro' : 'Change Plan'}</span>
          </button>

          {!isFree && subscription?.status !== 'canceled' && (
            <button
              type="button"
              className="btn-status-cancel"
              onClick={handleCancel}
              disabled={canceling}
            >
              {canceling ? 'Processing...' : 'Cancel Subscription'}
            </button>
          )}
        </div>

        {cancelMessage && <div className="cancel-feedback-banner">{cancelMessage}</div>}
      </div>

      {/* Quota Usage Breakdown */}
      <div className="usage-breakdown-card">
        <div className="usage-header">
          <h3 className="usage-title">Current Period Usage</h3>
          <span className="usage-reset-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Daily message quotas reset daily at 00:00 UTC
          </span>
        </div>

        <div className="usage-meters-grid">
          {/* Daily Messages */}
          <div className="usage-meter-box">
            <div className="meter-labels">
              <span className="meter-name">Daily AI Messages</span>
              <span className="meter-numbers">
                <strong>{msgUsed}</strong> / {msgLimit} msgs
              </span>
            </div>
            <div className="meter-track">
              <div
                className={`meter-bar ${msgPercent >= 90 ? 'critical' : msgPercent >= 70 ? 'warning' : 'ok'}`}
                style={{ width: `${msgPercent}%` }}
              />
            </div>
            <div className="meter-sub">
              {msgLimit - msgUsed > 0
                ? `${msgLimit - msgUsed} messages remaining today`
                : 'Quota exhausted for today'}
            </div>
          </div>

          {/* Monthly Images */}
          <div className="usage-meter-box">
            <div className="meter-labels">
              <span className="meter-name">Image Studio Credits</span>
              <span className="meter-numbers">
                <strong>{imgUsed}</strong> / {imgLimit} credits
              </span>
            </div>
            <div className="meter-track">
              <div
                className={`meter-bar ${imgPercent >= 90 ? 'critical' : imgPercent >= 70 ? 'warning' : 'ok'}`}
                style={{ width: `${imgPercent}%` }}
              />
            </div>
            <div className="meter-sub">
              {imgLimit - imgUsed > 0
                ? `${imgLimit - imgUsed} generation credits remaining`
                : 'All image credits used'}
            </div>
          </div>

          {/* Document Upload Limit */}
          <div className="usage-meter-box">
            <div className="meter-labels">
              <span className="meter-name">Document Uploads (Monthly)</span>
              <span className="meter-numbers">
                <strong>{docUsed}</strong> / {docLimit} files
              </span>
            </div>
            <div className="meter-track">
              <div
                className={`meter-bar ${docPercent >= 90 ? 'critical' : 'ok'}`}
                style={{ width: `${docPercent}%` }}
              />
            </div>
            <div className="meter-sub">
              Max file size allowed: <strong>{usage?.max_doc_size_mb || 5} MB</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Invoicing History */}
      <div className="payment-history-card">
        <div className="history-header-row">
          <h3 className="history-title">Payment &amp; Invoicing History</h3>
          <button type="button" className="history-refresh-btn" onClick={loadTransactions} disabled={loadingHistory}>
            <svg
              className={loadingHistory ? 'spin' : ''}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-history-state">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <p>No transactions yet. Upgraded plans will show receipts and GST invoices here.</p>
          </div>
        ) : (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td>{tx.plan_name} ({tx.billing_cycle})</td>
                    <td>₹{(tx.amount_paise / 100).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge-status ${tx.status.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="mono-cell">{tx.razorpay_payment_id || tx.transaction_id.substring(0, 12)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
