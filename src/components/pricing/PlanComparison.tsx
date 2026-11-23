import React, { useState } from 'react'
import { SubscriptionPlan } from '../../api'

interface PlanComparisonProps {
  plans: SubscriptionPlan[]
  currentPlanId?: string
  onSelectPlan: (plan: SubscriptionPlan) => void
}

interface FeatureRow {
  name: string
  tooltip?: string
  free: string | boolean
  plus: string | boolean
  pro: string | boolean
  business: string | boolean
}

interface CategoryGroup {
  category: string
  rows: FeatureRow[]
}

const COMPARISON_DATA: CategoryGroup[] = [
  {
    category: 'AI Chat & Neural Intelligence',
    rows: [
      {
        name: 'ASAI Custom PyTorch Model',
        tooltip: 'Proprietary GPT-style Transformer neural network with zero third-party API leakage.',
        free: true,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Daily message allowance',
        tooltip: 'Number of AI chat queries processed per 24 hours.',
        free: '20 msgs / day',
        plus: '100 msgs / day',
        pro: '500 msgs / day',
        business: '5,000 msgs / day',
      },
      {
        name: 'Context window length',
        tooltip: 'Maximum token sequence memory preserved during ongoing chat.',
        free: '64 tokens',
        plus: '256 tokens',
        pro: '512 tokens',
        business: '1,024 tokens',
      },
      {
        name: 'Inference response priority',
        tooltip: 'Queue scheduling order on NVIDIA RTX GPU.',
        free: 'Standard',
        plus: '2x Faster queue',
        pro: 'Priority GPU queue',
        business: 'Dedicated allocation',
      },
      {
        name: 'Conversation history retention',
        tooltip: 'Storage period for browsing and searching past dialogues.',
        free: '30 days',
        plus: '90 days',
        pro: 'Unlimited',
        business: 'Unlimited + Audit log',
      },
    ],
  },
  {
    category: 'AI Image Studio & Media',
    rows: [
      {
        name: 'Local ComfyUI image generation',
        tooltip: 'Local diffusion generation powered by workstation GPU.',
        free: true,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Monthly image credits',
        tooltip: 'Credits allocated monthly for high-resolution image rendering.',
        free: '5 credits / mo',
        plus: '50 credits / mo',
        pro: '250 credits / mo',
        business: '2,500 credits / mo',
      },
      {
        name: 'Maximum image resolution',
        tooltip: 'Render output dimensions.',
        free: '512 x 512',
        plus: '1024 x 1024',
        pro: '2048 x 2048',
        business: '4096 x 4096 (Ultra)',
      },
      {
        name: 'Image upscaling & editing',
        free: false,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Render queue priority',
        free: 'Standard',
        plus: 'Accelerated',
        pro: 'Express priority',
        business: 'Cluster dedicated',
      },
    ],
  },
  {
    category: 'Coding & Developer Assistant',
    rows: [
      {
        name: 'Code generation & debugging',
        free: 'Basic',
        plus: 'Advanced',
        pro: 'Full repository analysis',
        business: 'Enterprise multi-repo',
      },
      {
        name: 'Multi-language code explanation',
        free: true,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Custom code execution sandbox',
        free: false,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Deep algorithmic optimization',
        free: false,
        plus: false,
        pro: true,
        business: true,
      },
    ],
  },
  {
    category: 'Documents & File Analysis',
    rows: [
      {
        name: 'PDF, DOCX, & TXT ingestion',
        free: true,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Spreadsheet (CSV/Excel) analysis',
        free: false,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Maximum file size',
        tooltip: 'Maximum size per uploaded document.',
        free: '5 MB',
        plus: '25 MB',
        pro: '100 MB',
        business: '500 MB',
      },
      {
        name: 'Monthly document uploads',
        free: '10 files / mo',
        plus: '50 files / mo',
        pro: '200 files / mo',
        business: '2,000 files / mo',
      },
    ],
  },
  {
    category: 'Voice & Video Studio',
    rows: [
      {
        name: 'Voice speech-to-text dictation',
        free: true,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Text-to-speech voice generation',
        free: false,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Natural voice interaction mode',
        free: false,
        plus: false,
        pro: true,
        business: true,
      },
      {
        name: 'AI Video generation access',
        tooltip: 'Access to local ComfyUI text-to-video workflow.',
        free: false,
        plus: false,
        pro: '5 videos / mo (Beta)',
        business: '50 videos / mo (Beta)',
      },
    ],
  },
  {
    category: 'Team & Enterprise Governance',
    rows: [
      {
        name: 'Team members / seats',
        free: '1 user',
        plus: '1 user',
        pro: '1 user',
        business: 'Up to 100+ seats',
      },
      {
        name: 'Centralized billing & invoices',
        free: false,
        plus: false,
        pro: false,
        business: true,
      },
      {
        name: 'Role-based access & admin control',
        free: false,
        plus: false,
        pro: false,
        business: true,
      },
      {
        name: 'Zero data leakage guarantee',
        tooltip: 'No training on your organization data, all weights hosted locally.',
        free: true,
        plus: true,
        pro: true,
        business: true,
      },
      {
        name: 'Priority support & SLA',
        free: 'Community',
        plus: 'Email (24-48h)',
        pro: 'Priority email (<12h)',
        business: 'Dedicated 24/7 SLA',
      },
    ],
  },
]

export const PlanComparison: React.FC<PlanComparisonProps> = ({
  plans,
  currentPlanId = 'free',
  onSelectPlan,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }))
  }

  const renderCell = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <span className="comparison-check">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : (
        <span className="comparison-dash">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      )
    }
    return <span className="comparison-text">{val}</span>
  }

  return (
    <div className="plan-comparison-section">
      <div className="comparison-header-block">
        <h2 className="comparison-title">Compare plan capabilities in detail</h2>
        <p className="comparison-subtitle">
          Find the exact technical limits, quotas, and feature sets tailored to your workflow.
        </p>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="feature-col-header">
                <span>Features &amp; Specifications</span>
              </th>
              <th className={`plan-col-header ${currentPlanId === 'free' ? 'is-current' : ''}`}>
                <div className="header-plan-title">ASAI Free</div>
                <div className="header-plan-price">₹0</div>
                <button
                  type="button"
                  className="header-plan-btn"
                  disabled={currentPlanId === 'free'}
                  onClick={() => {
                    const p = plans.find((x) => x.plan_id === 'free')
                    if (p) onSelectPlan(p)
                  }}
                >
                  {currentPlanId === 'free' ? 'Current' : 'Select'}
                </button>
              </th>
              <th className={`plan-col-header ${currentPlanId === 'plus' ? 'is-current' : ''}`}>
                <div className="header-plan-title">ASAI Plus</div>
                <div className="header-plan-price">₹299/mo</div>
                <button
                  type="button"
                  className="header-plan-btn"
                  disabled={currentPlanId === 'plus'}
                  onClick={() => {
                    const p = plans.find((x) => x.plan_id === 'plus')
                    if (p) onSelectPlan(p)
                  }}
                >
                  {currentPlanId === 'plus' ? 'Current' : 'Upgrade'}
                </button>
              </th>
              <th className={`plan-col-header highlight-pro ${currentPlanId === 'pro' ? 'is-current' : ''}`}>
                <div className="pro-rec-badge">Recommended</div>
                <div className="header-plan-title">ASAI Pro</div>
                <div className="header-plan-price">₹799/mo</div>
                <button
                  type="button"
                  className="header-plan-btn btn-highlight"
                  disabled={currentPlanId === 'pro'}
                  onClick={() => {
                    const p = plans.find((x) => x.plan_id === 'pro')
                    if (p) onSelectPlan(p)
                  }}
                >
                  {currentPlanId === 'pro' ? 'Current' : 'Get Pro'}
                </button>
              </th>
              <th className={`plan-col-header ${currentPlanId === 'business' ? 'is-current' : ''}`}>
                <div className="header-plan-title">ASAI Business</div>
                <div className="header-plan-price">Custom / ₹1,999+</div>
                <button
                  type="button"
                  className="header-plan-btn"
                  disabled={currentPlanId === 'business'}
                  onClick={() => {
                    const p = plans.find((x) => x.plan_id === 'business')
                    if (p) onSelectPlan(p)
                  }}
                >
                  Contact Sales
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {COMPARISON_DATA.map((group) => {
              const isCollapsed = !!collapsedCategories[group.category]
              return (
                <React.Fragment key={group.category}>
                  <tr className="category-header-row" onClick={() => toggleCategory(group.category)}>
                    <td colSpan={5}>
                      <div className="category-title-content">
                        <span>{group.category}</span>
                        <svg
                          className={`chevron-icon ${isCollapsed ? 'rotate' : ''}`}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </td>
                  </tr>

                  {!isCollapsed &&
                    group.rows.map((row, rIdx) => (
                      <tr className="feature-data-row" key={rIdx}>
                        <td className="feature-name-cell">
                          <div className="feature-name-content">
                            <span>{row.name}</span>
                            {row.tooltip && (
                              <span className="info-tooltip-wrap" title={row.tooltip}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="feature-val-cell">{renderCell(row.free)}</td>
                        <td className="feature-val-cell">{renderCell(row.plus)}</td>
                        <td className="feature-val-cell cell-pro">{renderCell(row.pro)}</td>
                        <td className="feature-val-cell">{renderCell(row.business)}</td>
                      </tr>
                    ))}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
