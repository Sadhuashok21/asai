/**
 * ASAI API Client
 * Interacts with the Django ASAI backend endpoints under /api/asai/
 */

export function getApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  if (configured) return configured
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return 'http://localhost:8000'
    }
  }
  return ''
}

export const API_BASE_URL = getApiBaseUrl()

export function getEndpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath
}

export function getAuthHeaders(): HeadersInit {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('asai_token') || localStorage.getItem('token') : null
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// -------------------------------------------------------------
// 1. Models & System Health
// -------------------------------------------------------------
export interface AsaiModel {
  id: string
  name: string
  model_id: string
  model_type: string
  is_multimodal: boolean
  is_coding_specialist: boolean
  context_length: number
  description: string
  badge: string
}

export interface ServicesStatus {
  neural_network?: {
    model_name: string
    status: 'connected' | 'disconnected'
    device: string
    vram_total_mb: number
    parameters: string
    context_length: number
  }
  ollama?: {
    url: string
    status: 'connected' | 'disconnected'
    models_available: string[]
    recommended_chat_model?: string
  }
  comfyui: {
    url: string
    status: 'connected' | 'disconnected'
    active_gpu?: string
    vram_profile?: string
  }
  gpu: {
    device: string
    vram_total_mb: number
    mode: string
  }
}

export async function fetchModels(): Promise<AsaiModel[]> {
  try {
    const res = await fetch(getEndpoint('/api/asai/models/'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.models || []
  } catch (err) {
    console.warn('Failed to load ASAI models:', err)
    return []
  }
}

export async function fetchServicesStatus(): Promise<ServicesStatus | null> {
  try {
    const res = await fetch(getEndpoint('/api/asai/models/status/'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.warn('Failed to fetch services status:', err)
    return null
  }
}

// -------------------------------------------------------------
// 2. Chat & Conversations
// -------------------------------------------------------------
export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  model_used?: string
  created_at?: string
}

export interface ConversationSummary {
  id: string
  conversation_id: string
  title: string
  model_id: string
  model_name?: string
  message_count: number
  updated_at: string
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  try {
    const res = await fetch(getEndpoint('/api/asai/conversations/'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
    if (!res.ok) return []
    const data = await res.json()
    const rawList = Array.isArray(data) ? data : data.results || []
    return rawList.map((item: any) => {
      const cid = item.id || item.conversation_id || ''
      return {
        id: cid,
        conversation_id: cid,
        title: item.title || 'Conversation',
        model_id: item.model || item.model_id || 'ASAI Pro',
        model_name: item.model || 'ASAI Pro',
        message_count: item.message_count || (Array.isArray(item.messages) ? item.messages.length : 0),
        updated_at: item.updated_at || item.created_at || new Date().toISOString(),
      }
    })
  } catch (err) {
    console.warn('Failed to fetch conversations:', err)
    return []
  }
}

export async function fetchConversation(id: string): Promise<any> {
  const res = await fetch(getEndpoint(`/api/asai/conversations/${encodeURIComponent(id)}/`), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Conversation not found')
  return await res.json()
}

export async function createConversation(title?: string, modelId?: string): Promise<any> {
  const res = await fetch(getEndpoint('/api/asai/conversations/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      title: title || 'New Chat',
      model_id: modelId || 'asai-pro',
    }),
  })
  if (!res.ok) throw new Error('Failed to create conversation')
  return await res.json()
}

export async function sendChatMessage(data: {
  conversation_id?: string
  message?: string
  prompt?: string
  model?: string
  model_id?: string
  system_prompt?: string
  attachment_name?: string
  attachment_content?: string
  image?: string
}): Promise<{ reply: string; content: string; conversation_id: string; message_id: string; model_used: string; created_at?: string }> {
  const promptText = (data.prompt || data.message || '').trim()
  const payload = {
    prompt: promptText,
    message: promptText,
    conversation_id: data.conversation_id,
    model: data.model || data.model_id,
    model_id: data.model_id || data.model,
    system_prompt: data.system_prompt,
    attachment_name: data.attachment_name,
    attachment_content: data.attachment_content,
    image: data.image,
  }
  const res = await fetch(getEndpoint('/api/asai/chat/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || errData.message || `Chat error (${res.status})`)
  }
  const result = await res.json()
  return {
    reply: result.reply || result.content || '',
    content: result.content || result.reply || '',
    conversation_id: result.conversation_id,
    message_id: result.message_id,
    model_used: result.model_used || result.model || 'ASAI Pro',
    created_at: result.created_at,
  }
}

// -------------------------------------------------------------
// 3. Image Generation (ComfyUI)
// -------------------------------------------------------------
export interface ImageJobResponse {
  job_id: string
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  prompt: string
  image_urls?: string[]
  error_message?: string
}

export interface GeneratedMediaItem {
  id: string
  media_type: string
  file_url: string
  thumbnail_url: string
  prompt: string
  width: number
  height: number
  created_at: string
}

export async function generateImage(payload: {
  prompt: string
  negative_prompt?: string
  aspect_ratio?: string
  width?: number
  height?: number
  num_images?: number
}): Promise<ImageJobResponse> {
  const res = await fetch(getEndpoint('/api/asai/images/generate/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Image generation failed to queue')
  }
  return await res.json()
}

export async function fetchImageJob(jobId: string): Promise<any> {
  const res = await fetch(getEndpoint(`/api/asai/images/jobs/${encodeURIComponent(jobId)}/`), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Job not found')
  const data = await res.json()
  const job = data.job || data
  const statusUpper = (job.status || '').toUpperCase()
  const mediaList = Array.isArray(job.media) ? job.media : []
  const imageUrls = mediaList.map((m: any) => m.file_url || m.file || '').filter(Boolean)
  return {
    ...job,
    status: statusUpper === 'COMPLETED' ? 'completed' : statusUpper === 'FAILED' ? 'failed' : statusUpper.toLowerCase(),
    image_urls: imageUrls.length > 0 ? imageUrls : job.image_urls || [],
  }
}

export async function fetchImageHistory(): Promise<GeneratedMediaItem[]> {
  try {
    const res = await fetch(getEndpoint('/api/asai/images/history/'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.history || data.media || []
  } catch (err) {
    console.warn('Failed to load image history:', err)
    return []
  }
}

// -------------------------------------------------------------
// 4. Vision AI Analysis
// -------------------------------------------------------------
export interface VisionAnalysisResult {
  status: string
  model_used: string
  description: string
  detected_elements: { name: string; confidence: number }[]
  answers?: string
}

export async function analyzeImage(formData: FormData): Promise<VisionAnalysisResult> {
  const headers = getAuthHeaders() as Record<string, string>
  // Do NOT set Content-Type header so browser boundary is set automatically
  delete headers['Content-Type']

  const res = await fetch(getEndpoint('/api/asai/vision/analyze/'), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Vision analysis failed')
  }
  return await res.json()
}

// -------------------------------------------------------------
// 5. Coding Assistant
// -------------------------------------------------------------
export interface CodingResponse {
  answer: string
  code_blocks?: string[]
  language?: string
  model_used: string
  conversation_id: string
}

export async function askCoding(data: {
  prompt: string
  code_snippet?: string
  language?: string
  conversation_id?: string
}): Promise<CodingResponse> {
  const res = await fetch(getEndpoint('/api/asai/coding/ask/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Coding assistant error')
  }
  return await res.json()
}

// -------------------------------------------------------------
// 6. Document AI
// -------------------------------------------------------------
export interface AsaiDocumentItem {
  id: string
  title: string
  file_name: string
  file_type: string
  file_size_bytes: number
  file_url: string
  page_count: number
  summary: string
  created_at: string
}

export async function fetchDocuments(): Promise<AsaiDocumentItem[]> {
  try {
    const res = await fetch(getEndpoint('/api/asai/files/'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.documents || []
  } catch {
    return []
  }
}

export async function uploadDocument(formData: FormData): Promise<AsaiDocumentItem> {
  const headers = getAuthHeaders() as Record<string, string>
  delete headers['Content-Type']

  const res = await fetch(getEndpoint('/api/asai/files/upload/'), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Document upload failed')
  }
  const data = await res.json()
  return data.document
}

export async function askDocument(documentId: string, question: string): Promise<{ answer: string; document_id: string }> {
  const res = await fetch(getEndpoint('/api/asai/files/ask/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      document_id: documentId,
      question,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Document inquiry failed')
  }
  return await res.json()
}

// -------------------------------------------------------------
// 7. Voice Services (STT)
// -------------------------------------------------------------
export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string; language: string }> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')

  const headers = getAuthHeaders() as Record<string, string>
  delete headers['Content-Type']

  const res = await fetch(getEndpoint('/api/asai/voice/transcribe/'), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Voice transcription failed')
  }
  return await res.json()
}

// -------------------------------------------------------------
// 8. Video Generation Architecture
// -------------------------------------------------------------
export async function generateVideo(data: {
  prompt: string
  duration_seconds?: number
  aspect_ratio?: string
}): Promise<any> {
  const res = await fetch(getEndpoint('/api/asai/videos/generate/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Video job creation failed')
  }
  return await res.json()
}

// -------------------------------------------------------------
// 9. User Settings
// -------------------------------------------------------------
export async function fetchUserSettings(): Promise<any> {
  try {
    const res = await fetch(getEndpoint('/api/asai/settings/'), {
      headers: getAuthHeaders(),
      credentials: 'include',
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function updateUserSettings(settings: any): Promise<any> {
  const res = await fetch(getEndpoint('/api/asai/settings/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(settings),
  })
  if (!res.ok) throw new Error('Failed to update settings')
  return await res.json()
}

// -------------------------------------------------------------
// 10. Subscription, Pricing & Usage Enforcement
// -------------------------------------------------------------
export interface SubscriptionPlan {
  plan_id: 'free' | 'plus' | 'pro' | 'business'
  name: string
  tier: 'free' | 'plus' | 'pro' | 'business'
  tagline: string
  badge: string
  price_monthly_inr: number
  price_yearly_inr: number
  yearly_discount_percent: number
  daily_message_limit: number
  monthly_image_credits: number
  max_doc_size_mb: number
  monthly_doc_limit: number
  monthly_video_limit: number
  context_window: number
  has_advanced_code: boolean
  has_priority_processing: boolean
  has_voice: boolean
  has_team_workspace: boolean
  features_highlight: string[]
  cta_text: string
  is_active: boolean
  order: number
}

export interface UserSubscription {
  subscription_id: string
  plan: SubscriptionPlan
  billing_cycle: 'monthly' | 'yearly'
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired'
  current_period_start?: string
  current_period_end?: string | null
  cancel_at_period_end: boolean
  created_at?: string
}

export interface UsageStats {
  daily_messages_used: number
  daily_messages_limit: number
  daily_messages_remaining: number
  monthly_images_used: number
  monthly_images_limit: number
  monthly_images_remaining: number
  monthly_docs_used: number
  monthly_docs_limit: number
  max_doc_size_mb: number
  monthly_videos_used: number
  monthly_videos_limit: number
}

export interface SubscriptionStatusResponse {
  status: boolean
  subscription: UserSubscription
  usage: UsageStats
}

export interface CheckoutResponse {
  status: string
  order_id?: string
  amount_paise?: number
  currency?: string
  key_id?: string
  plan_name?: string
  transaction_id?: string
  is_free?: boolean
  is_test_mode?: boolean
  message?: string
}

export interface PaymentTransaction {
  transaction_id: string
  plan_name: string
  billing_cycle: string
  amount_paise: number
  currency: string
  gateway: string
  razorpay_order_id: string
  razorpay_payment_id: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  failure_reason?: string
  created_at: string
  completed_at?: string
}

export async function fetchSubscriptionPlans(): Promise<{ plans: SubscriptionPlan[]; currency: string; currency_symbol: string; annual_discount_headline: string }> {
  const res = await fetch(getEndpoint('/api/asai/plans/'), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch subscription plans')
  return await res.json()
}

export async function fetchCurrentSubscription(): Promise<SubscriptionStatusResponse> {
  const res = await fetch(getEndpoint('/api/asai/subscription/'), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch subscription status')
  return await res.json()
}

export async function fetchUsageStats(): Promise<any> {
  const res = await fetch(getEndpoint('/api/asai/usage/'), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) return null
  return await res.json()
}

export async function createSubscriptionCheckout(
  planId: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly',
  couponCode: string = '',
  idempotencyKey?: string
): Promise<CheckoutResponse> {
  const res = await fetch(getEndpoint('/api/asai/subscription/checkout/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      plan_id: planId,
      billing_cycle: billingCycle,
      coupon_code: couponCode,
      idempotency_key: idempotencyKey || `asai_chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to initiate checkout')
  }
  return await res.json()
}

export async function verifyPayment(
  transactionId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string = ''
): Promise<{ status: boolean; message: string; subscription?: UserSubscription }> {
  const res = await fetch(getEndpoint('/api/asai/subscription/verify/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      transaction_id: transactionId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Payment verification failed')
  }
  return await res.json()
}

export async function cancelSubscription(): Promise<any> {
  const res = await fetch(getEndpoint('/api/asai/subscription/cancel/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to cancel subscription')
  }
  return await res.json()
}

export async function fetchPaymentHistory(): Promise<{ transactions: PaymentTransaction[] }> {
  const res = await fetch(getEndpoint('/api/asai/subscription/history/'), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch payment history')
  return await res.json()
}

export async function createBusinessOrg(name: string, billingEmail: string = '', seats: number = 5): Promise<any> {
  const res = await fetch(getEndpoint('/api/asai/business/create/'), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, billing_email: billingEmail, seats }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create organization')
  }
  return await res.json()
}
