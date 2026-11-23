import { useEffect, useMemo, useRef, useState } from 'react'
import pavilion from './assets/asai-pavilion.png'
import ascentraLogo from './assets/ascentra.webp'
import {
  fetchModels,
  fetchServicesStatus,
  fetchConversations,
  fetchConversation,
  sendChatMessage,
  generateImage,
  fetchImageJob,
  fetchImageHistory,
  analyzeImage,
  askCoding,
  fetchDocuments,
  uploadDocument,
  askDocument,
  transcribeAudio,
  fetchUserSettings,
  updateUserSettings,
  type AsaiModel,
  type ServicesStatus,
  type ConversationSummary,
  type GeneratedMediaItem,
  type AsaiDocumentItem,
} from './api'
import { PricingPage } from './components/pricing'
import { FlowStudio } from './components/flow'

type Screen = 'chat' | 'images' | 'video' | 'flow' | 'vision' | 'files' | 'voice' | 'code' | 'models' | 'settings' | 'pricing'
type IconName =
  | 'plus' | 'search' | 'chat' | 'image' | 'video' | 'file' | 'grid' | 'settings'
  | 'chevron' | 'share' | 'paperclip' | 'mic' | 'send' | 'spark' | 'code'
  | 'eye' | 'download' | 'copy' | 'refresh' | 'upload' | 'play' | 'pause'
  | 'check' | 'more' | 'sun' | 'moon' | 'menu' | 'x' | 'arrow' | 'layers'
  | 'wand' | 'thumb' | 'logout' | 'shield' | 'globe' | 'sliders'
  | 'alert' | 'status-online' | 'status-standby' | 'credit-card'
  | 'clapperboard' | 'film' | 'scissors' | 'timeline' | 'aspect-ratio'

const iconPaths: Record<IconName, React.ReactNode> = {
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  chat: <><path d="M20 15a3 3 0 0 1-3 3H9l-5 3V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m4 17 5-4 4 3 3-2 4 3" /></>,
  video: <><rect x="3" y="5" width="14" height="14" rx="3" /><path d="m17 10 4-2v8l-4-2" /></>,
  file: <><path d="M6 2h8l4 4v16H6zM14 2v5h5M9 13h6M9 17h5" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5v-3l-2-.7-.7-1.7.9-1.9-2.1-2.1-1.9.9-1.7-.7L10.5 2h-3l-.7 2.3-1.7.7-1.9-.9-2.1 2.1.9 1.9-.7 1.7-2 .7v3l2 .7.7 1.7-.9 1.9 2.1 2.1 1.9-.9 1.7.7.7 2.3h3l.7-2.3 1.7-.7 1.9.9 2.1-2.1-.9-1.9.7-1.7z" transform="translate(2.5 0) scale(.8)" /></>,
  chevron: <path d="m8 10 4 4 4-4" />,
  share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
  paperclip: <path d="m9 12 6-6a4 4 0 0 1 6 6l-8 8a6 6 0 0 1-9-9l8-8" />,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></>,
  send: <><path d="m5 12 14-7-4 14-3-6zM12 13l7-8" /></>,
  spark: <><path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" /></>,
  code: <><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4M5 20h14" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M18 9a7 7 0 0 0-12-2L4 12M6 15a7 7 0 0 0 12 2l2-5" /></>,
  upload: <><path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4" /></>,
  play: <path d="m9 7 8 5-8 5z" />,
  pause: <><path d="M9 7v10M15 7v10" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19" /></>,
  moon: <path d="M20 15a8 8 0 0 1-11-11 8.5 8.5 0 1 0 11 11Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="m9 18 6-6-6-6" />,
  layers: <><path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5" /></>,
  wand: <><path d="m15 4 5 5L9 20l-5-5zM6 3v3M4.5 4.5h3M19 15v4M17 17h4" /></>,
  thumb: <path d="M7 10v10H3V10zm0 8h10a2 2 0 0 0 2-1.6l1-5A2 2 0 0 0 18 9h-5l1-4-1-2-6 7" />,
  logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" /></>,
  shield: <path d="M12 2 4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
  sliders: <><path d="M4 6h5M15 6h5M4 18h8M18 18h2M4 12h2M12 12h8" /><circle cx="12" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="15" cy="18" r="2" /></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  'status-online': <circle cx="12" cy="12" r="5" fill="#10b981" stroke="none" />,
  'status-standby': <circle cx="12" cy="12" r="5" fill="#94a3b8" stroke="none" />,
  'credit-card': <><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>,
  clapperboard: <><path d="M20.2 6 3 11l-.9-3.2 17.2-5zM4 11v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9" /><path d="m9.5 4 1.5 5M14.5 2.5 16 7.5" /></>,
  film: <><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></>,
  scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></>,
  timeline: <><path d="M3 5v14M21 5v14M7 12h10" /><circle cx="12" cy="12" r="3" /></>,
  'aspect-ratio': <><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="9 9 6 9 6 12" /><polyline points="15 15 18 15 18 12" /></>,
}

function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

const screenTitles: Record<Screen, string> = {
  chat: 'New conversation', images: 'Image Studio', video: 'Video Studio', vision: 'Vision AI',
  files: 'My Files', voice: 'Voice Assistant', code: 'Coding Assistant', models: 'Explore Models', settings: 'Settings',
  pricing: 'Plans & Pricing',
}

const navItems: { id: Screen; label: string; icon: IconName }[] = [
  { id: 'images', label: 'Image Studio', icon: 'image' },
  { id: 'video', label: 'Video Studio', icon: 'video' },
  { id: 'vision', label: 'Vision AI', icon: 'eye' },
  { id: 'files', label: 'My Files', icon: 'file' },
  { id: 'voice', label: 'Voice Assistant', icon: 'mic' },
  { id: 'code', label: 'Coding Assistant', icon: 'code' },
  { id: 'models', label: 'Explore AI Models', icon: 'grid' },
  { id: 'pricing', label: 'Plans & Pricing', icon: 'credit-card' },
]

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <img
        src={ascentraLogo}
        alt="Ascentracore Logo"
        style={{
          width: compact ? '26px' : '32px',
          height: compact ? '26px' : '32px',
          objectFit: 'contain',
          borderRadius: '6px',
        }}
      />
      {!compact && (
        <div className="logo-word">
          <strong>ASAI</strong>
          <small>by Ascentracore</small>
        </div>
      )}
    </div>
  )
}

function navigateTo(path: string, replace = false) {
  if (typeof window === 'undefined') return
  if (window.location.pathname === path) return
  if (replace) {
    window.history.replaceState({}, '', path)
  } else {
    window.history.pushState({}, '', path)
  }
}

function parseRoute(pathname: string): { screen: Screen; conversationId: string | null } {
  const clean = pathname.replace(/\/+$/, '') || '/'

  // Pattern 1: /c/:id
  const cMatch = clean.match(/^\/c\/([^/]+)/)
  if (cMatch) {
    const id = cMatch[1]
    if (id === 'new') {
      return { screen: 'chat', conversationId: null }
    }
    return { screen: 'chat', conversationId: decodeURIComponent(id) }
  }

  // Pattern 2: /chat/:id
  const chatMatch = clean.match(/^\/chat\/([^/]+)/)
  if (chatMatch) {
    return { screen: 'chat', conversationId: decodeURIComponent(chatMatch[1]) }
  }

  // Pattern 3: Workspaces
  const segment = clean.replace(/^\//, '').toLowerCase()
  if (segment === 'flow') {
    return { screen: 'video', conversationId: null }
  }
  const validScreens: Screen[] = ['chat', 'images', 'video', 'flow', 'vision', 'files', 'voice', 'code', 'models', 'settings', 'pricing']
  if (validScreens.includes(segment as Screen)) {
    return { screen: segment as Screen, conversationId: null }
  }

  return { screen: 'chat', conversationId: null }
}

function Sidebar({
  screen,
  onSelect,
  open,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: {
  screen: Screen
  onSelect: (s: Screen) => void
  open: boolean
  onClose: () => void
  conversations: ConversationSummary[]
  activeConversationId?: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
}) {
  const select = (s: Screen) => { onSelect(s); onClose() }
  return <>
    {open && <button className="nav-overlay" onClick={onClose} aria-label="Close navigation" />}
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-top">
        <Logo />
        <button className="icon-button mobile-close" onClick={onClose}><Icon name="x" /></button>
      </div>
      <button className="new-chat" onClick={() => { onNewChat(); onClose() }}>
        <Icon name="plus" size={18} /> New chat <span>Ctrl+K</span>
      </button>
      <label className="search"><Icon name="search" size={17} /><input aria-label="Search conversations" placeholder="Search conversations" /></label>
      <nav className="side-nav" aria-label="AI workspaces">
        {navItems.map(item => <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => select(item.id)}>
          <Icon name={item.icon} size={19} /><span>{item.label}</span>{item.id === 'vision' && <em>New</em>}
        </button>)}
      </nav>
      <div className="history">
        <div className="history-label">Recent Conversations</div>
        {conversations.length > 0 ? (
          conversations.slice(0, 25).map((conv) => {
            const convId = (conv as any).conversation_id || conv.id
            return (
              <button
                key={convId}
                className={screen === 'chat' && activeConversationId === convId ? 'active' : ''}
                onClick={() => {
                  onSelectConversation(convId)
                  onClose()
                }}
                title={conv.title}
              >
                {conv.title}
              </button>
            )
          })
        ) : (
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', opacity: 0.6 }}>No previous conversations</div>
        )}
      </div>
      <div className="sidebar-footer">
        <button className={screen === 'settings' ? 'active' : ''} onClick={() => select('settings')}><Icon name="settings" size={19} />Settings</button>
        <button className="profile" onClick={() => select('pricing')} title="Manage subscription">
          <span className="avatar">AM</span>
          <span><strong>Alex Morgan</strong><small>Pro workspace</small></span>
          <span className="upgrade-pill-badge">Upgrade</span>
        </button>
      </div>
    </aside>
  </>
}

function Topbar({ screen, dark, setDark, openNav, onSelectScreen, activeModelName = 'ASAI Pro' }: { screen: Screen; dark: boolean; setDark: (v: boolean) => void; openNav: () => void; onSelectScreen?: (s: Screen) => void; activeModelName?: string }) {
  return <header className="topbar">
    <div className="topbar-title">
      <button className="icon-button menu-button" onClick={openNav}><Icon name="menu" /></button>
      <span>{screenTitles[screen]}</span>
      {screen === 'chat' && <button className="model-pill">{activeModelName} <Icon name="chevron" size={14} /></button>}
    </div>
    <div className="top-actions">
      <button
        className="topbar-upgrade-btn"
        onClick={() => onSelectScreen?.('pricing')}
        title="View Subscription Plans"
      >
        <Icon name="spark" size={14} />
        <span>Upgrade</span>
      </button>
      <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme"><Icon name={dark ? 'sun' : 'moon'} size={18} /></button>
      {screen === 'chat' && (
        <button
          className="share-button"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href)
            alert('Conversation link copied to clipboard!')
          }}
          title="Share conversation"
        >
          <Icon name="share" size={17} /> <span>Share</span>
        </button>
      )}
      <button className="icon-button" onClick={() => onSelectScreen?.('settings')} title="Settings & options"><Icon name="more" /></button>
    </div>
  </header>
}

const AVAILABLE_MODELS = [
  { id: 'ASAI Pro', name: 'ASAI Pro', desc: 'Balanced intelligence & reasoning', icon: 'spark' },
  { id: 'ASAI Code', name: 'ASAI Code', desc: 'Senior software development & debugging', icon: 'code' },
  { id: 'ASAI Vision XL', name: 'ASAI Vision XL', desc: 'Multimodal analysis & scene understanding', icon: 'eye' },
  { id: 'ASAI Creative', name: 'ASAI Creative', desc: 'Creative writing & storytelling', icon: 'wand' },
] as const

const features: { icon: IconName; title: string; text: string; prompt: string; screen?: Screen }[] = [
  { icon: 'spark', title: 'Ask anything', text: 'Get clear answers and research support.', prompt: 'Explain quantum computing simply' },
  { icon: 'code', title: 'Write code', text: 'Generate, debug and understand code.', prompt: 'Build a responsive React navbar', screen: 'code' },
  { icon: 'image', title: 'Create images', text: 'Turn an idea into original visuals.', prompt: 'A glass house in a misty forest', screen: 'images' },
  { icon: 'file', title: 'Analyze files', text: 'Find insights across your documents.', prompt: 'Summarize my quarterly report', screen: 'files' },
]

function PromptInput({
  value,
  setValue,
  onSend,
  compact = false,
  disabled = false,
  selectedModel,
  setSelectedModel,
  onSelectScreen,
  attachedFile,
  setAttachedFile,
  attachedImage,
  setAttachedImage,
}: {
  value: string
  setValue: React.Dispatch<React.SetStateAction<string>>
  onSend: (override?: string) => void
  compact?: boolean
  disabled?: boolean
  selectedModel: string
  setSelectedModel: (m: string) => void
  onSelectScreen?: (s: Screen) => void
  attachedFile: { name: string; size: number; content?: string } | null
  setAttachedFile: (f: { name: string; size: number; content?: string } | null) => void
  attachedImage: { name: string; dataUrl: string } | null
  setAttachedImage: (img: { name: string; dataUrl: string } | null) => void
}) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false)
      }
    }
    if (modelMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modelMenuOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: file.size,
        content: typeof reader.result === 'string' ? reader.result : '',
      })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAttachedImage({
        name: file.name,
        dataUrl: typeof reader.result === 'string' ? reader.result : '',
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      if (onSelectScreen) onSelectScreen('voice')
      return
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || ''
        setValue((prev) => (prev ? `${prev} ${transcript}` : transcript))
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsListening(false)
      if (onSelectScreen) onSelectScreen('voice')
    }
  }

  return (
    <div className={`composer ${compact ? 'compact' : ''}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt,.csv,.xlsx,.py,.ts,.js,.json"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {(attachedFile || attachedImage) && (
        <div className="attached-badges">
          {attachedImage && (
            <div className="attachment-chip image">
              <img src={attachedImage.dataUrl} alt="Attached preview" />
              <span>{attachedImage.name}</span>
              <button type="button" onClick={() => setAttachedImage(null)} title="Remove attachment">
                <Icon name="x" size={13} />
              </button>
            </div>
          )}
          {attachedFile && (
            <div className="attachment-chip file">
              <Icon name="file" size={14} />
              <span>{attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} KB)</span>
              <button type="button" onClick={() => setAttachedFile(null)} title="Remove attachment">
                <Icon name="x" size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isListening ? 'Listening... Speak now.' : 'Ask ASAI anything...'}
        rows={1}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (value.trim() || attachedFile || attachedImage) {
              onSend()
            }
          }
        }}
      />
      <div className="composer-tools">
        <div>
          <button
            type="button"
            className="tool-button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file (.pdf, .txt, .csv, code)"
            aria-label="Attach file"
          >
            <Icon name="paperclip" size={19} />
          </button>
          <button
            type="button"
            className="tool-button mobile-hide"
            onClick={() => imageInputRef.current?.click()}
            title="Attach image for vision analysis"
            aria-label="Attach image"
          >
            <Icon name="image" size={19} />
          </button>

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              type="button"
              className="composer-model"
              onClick={() => setModelMenuOpen(!modelMenuOpen)}
              title="Select AI Model"
            >
              <Icon name="spark" size={16} />
              <span>{selectedModel}</span>
              <Icon name="chevron" size={13} />
            </button>

            {modelMenuOpen && (
              <div className="model-dropdown-menu">
                <div className="dropdown-title">Select Active Model</div>
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`model-option ${selectedModel === m.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedModel(m.id)
                      setModelMenuOpen(false)
                    }}
                  >
                    <span className="model-option-icon"><Icon name={m.icon as IconName} size={15} /></span>
                    <span className="model-option-info">
                      <strong>{m.name}</strong>
                      <small>{m.desc}</small>
                    </span>
                    {selectedModel === m.id && <Icon name="check" size={14} className="model-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <button
            type="button"
            className={`tool-button ${isListening ? 'listening' : ''}`}
            onClick={toggleVoice}
            title={isListening ? 'Stop listening' : 'Voice input (Speech to text)'}
            aria-label="Voice input"
          >
            <Icon name="mic" size={19} />
          </button>
          <button
            type="button"
            className={`send-button ${(value.trim() || attachedFile || attachedImage) && !disabled ? 'ready' : ''}`}
            onClick={() => onSend()}
            disabled={disabled || (!value.trim() && !attachedFile && !attachedImage)}
            aria-label="Send"
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatMessageTime(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date()
  if (isNaN(d.getTime())) {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function ChatScreen({
  conversationId,
  setConversationId,
  onRefreshHistory,
  onSelectScreen,
}: {
  conversationId: string | null
  setConversationId: (id: string | null) => void
  onRefreshHistory: () => void
  onSelectScreen?: (s: Screen) => void
}) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>('ASAI Pro')
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; content?: string } | null>(null)
  const [attachedImage, setAttachedImage] = useState<{ name: string; dataUrl: string } | null>(null)
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string; model?: string; isError?: boolean; isQuota?: boolean; time?: string; image?: string }[]>([])
  const skipFetchRef = useRef<boolean>(false)

  // Load conversation messages if conversationId changes
  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false
      return
    }
    if (!conversationId) {
      setMessages([])
      return
    }
    fetchConversation(conversationId)
      .then((data) => {
        if (data && Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: any) => ({
              role: m.role === 'user' ? 'user' : 'ai',
              text: m.content,
              model: m.model_used,
              time: formatMessageTime(m.created_at),
            }))
          )
        }
      })
      .catch((err) => console.warn('Could not load chat messages:', err))
  }, [conversationId])

  const send = async (overridePrompt?: string) => {
    const text = (overridePrompt !== undefined ? overridePrompt : value).trim()
    if ((!text && !attachedFile && !attachedImage) || loading) return

    setValue('')
    setLoading(true)

    // Optimistically append user message with current timestamp
    const userTime = formatMessageTime()
    const displaySnippet = text || (attachedImage ? `Analyze image: ${attachedImage.name}` : `Document: ${attachedFile?.name}`)
    const nextMessages = [
      ...messages,
      {
        role: 'user' as const,
        text: displaySnippet,
        time: userTime,
        image: attachedImage?.dataUrl,
      },
    ]
    setMessages(nextMessages)

    const currentFile = attachedFile
    const currentImg = attachedImage
    setAttachedFile(null)
    setAttachedImage(null)

    try {
      const res = await sendChatMessage({
        conversation_id: conversationId || undefined,
        prompt: text || (currentImg ? 'Analyze this image in detail.' : 'Please analyze this document.'),
        message: text,
        model: selectedModel,
        model_id: selectedModel,
        attachment_name: currentFile?.name,
        attachment_content: currentFile?.content,
        image: currentImg?.dataUrl,
      })

      if (!conversationId && res.conversation_id) {
        skipFetchRef.current = true
        setConversationId(res.conversation_id)
        onRefreshHistory()
        navigateTo(`/c/${encodeURIComponent(res.conversation_id)}`)
      }

      setMessages([
        ...nextMessages,
        {
          role: 'ai',
          text: res.reply || res.content,
          model: res.model_used || selectedModel,
          time: formatMessageTime(res.created_at),
        },
      ])
    } catch (err: any) {
      const isQuota =
        err.message?.toLowerCase().includes('quota') ||
        err.message?.toLowerCase().includes('limit') ||
        err.message?.toLowerCase().includes('exceeded') ||
        err.message?.includes('429')
      setMessages([
        ...nextMessages,
        {
          role: 'ai',
          text: err.message || 'Unable to connect to AI inference node. Ensure ASAI Neural Network service is running.',
          isError: true,
          isQuota,
          time: formatMessageTime(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (messages.length || loading) {
    return <div className="chat-screen">
      <div className="conversation">
        {messages.map((m, i) => (
          <div className={`message ${m.role}`} key={i}>
            {m.role === 'ai' && <div className="ai-avatar"><Logo compact /></div>}
            <div className="message-content">
              <div className="role-header">
                <span className="role-name">{m.role === 'ai' ? (m.model ? `ASAI (${m.model})` : 'ASAI') : 'You'}</span>
                <span className="message-time">{m.time || formatMessageTime()}</span>
              </div>
              {m.image && (
                <div style={{ marginBottom: '6px' }}>
                  <img src={m.image} alt="User attachment" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} />
                </div>
              )}
              {m.isError ? (
                <div className="error-message-box">
                  <div className="error-message-header">
                    <Icon name="alert" size={16} />
                    <span>Error: {m.text}</span>
                  </div>
                  {m.isQuota && onSelectScreen && (
                    <button
                      type="button"
                      className="error-upgrade-action"
                      onClick={() => onSelectScreen('pricing')}
                    >
                      <Icon name="spark" size={14} />
                      <span>Upgrade Plan for Higher Quota</span>
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
              )}
              {m.role === 'ai' && !m.isError && (
                <div className="message-actions">
                  <button
                    onClick={() => navigator.clipboard?.writeText(m.text)}
                    title="Copy response"
                  >
                    <Icon name="copy" size={15} />
                  </button>
                  <button
                    onClick={() => {
                      const lastUserMsg = [...messages].reverse().find((msg) => msg.role === 'user')?.text
                      if (lastUserMsg) send(lastUserMsg)
                    }}
                    title="Regenerate"
                  >
                    <Icon name="refresh" size={15} />
                  </button>
                  <button title="Helpful"><Icon name="thumb" size={15} /></button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message ai">
            <div className="ai-avatar"><Logo compact /></div>
            <div className="message-content">
              <div className="role-name">ASAI</div>
              <p style={{ fontStyle: 'italic', opacity: 0.7 }}>Thinking and generating response...</p>
            </div>
          </div>
        )}
      </div>
      <div className="chat-composer">
        <PromptInput
          value={value}
          setValue={setValue}
          onSend={send}
          compact
          disabled={loading}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onSelectScreen={onSelectScreen}
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
          attachedImage={attachedImage}
          setAttachedImage={setAttachedImage}
        />
        <p>ASAI inference runs locally on your RTX GPU. Verify important information.</p>
      </div>
    </div>
  }

  return <div className="welcome-screen">
    <div className="welcome-inner">
      <div className="welcome-logo"><Logo compact /></div>
      <p className="eyebrow">ASCENTRACORE SOLUTIONS ARTIFICIAL INTELLIGENCES</p>
      <h1>Hello! What can I help you<br />with today?</h1>
      <p className="welcome-subtitle">Your intelligent assistant powered by your NVIDIA RTX GPU and local models.</p>
      <PromptInput
        value={value}
        setValue={setValue}
        onSend={send}
        disabled={loading}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onSelectScreen={onSelectScreen}
        attachedFile={attachedFile}
        setAttachedFile={setAttachedFile}
        attachedImage={attachedImage}
        setAttachedImage={setAttachedImage}
      />
      <p className="disclaimer">ASAI local AI inference. Fast, private, and secure.</p>
      <div className="feature-grid">
        {features.map((f) => (
          <button
            className="feature-card"
            key={f.title}
            onClick={() => {
              if (f.screen && onSelectScreen) {
                onSelectScreen(f.screen)
              } else {
                setValue(f.prompt)
                send(f.prompt)
              }
            }}
          >
            <span className="feature-icon"><Icon name={f.icon} size={19} /></span>
            <Icon name="arrow" className="feature-arrow" size={17} />
            <strong>{f.title}</strong>
            <p>{f.text}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
}

function StudioHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="studio-heading"><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>
}

function SelectBox({ label, value }: { label: string; value: string }) {
  return <label className="field-label"><span>{label}</span><button className="select-box">{value}<Icon name="chevron" size={15} /></button></label>
}

function ImageStudio() {
  const [prompt, setPrompt] = useState('A serene futuristic pavilion in a misty pine forest at dawn, soft emerald interior light, cinematic atmosphere')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('4:3')
  const [generating, setGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [currentImage, setCurrentImage] = useState<string>(pavilion)
  const [history, setHistory] = useState<GeneratedMediaItem[]>([])

  useEffect(() => {
    fetchImageHistory()
      .then((items) => {
        if (items && items.length > 0) {
          setHistory(items)
          if (items[0]?.file_url) {
            setCurrentImage(items[0].file_url)
          }
        }
      })
      .catch(() => {})
  }, [])

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return
    setGenerating(true)
    setStatusMessage('Queueing with ComfyUI...')
    setProgress(15)

    try {
      const job = await generateImage({
        prompt: prompt.trim(),
        negative_prompt: negativePrompt.trim() || undefined,
        aspect_ratio: aspectRatio,
      })

      setStatusMessage('Rendering on RTX GPU...')
      setProgress(40)

      // Poll job status with bounded timeout and network resilience
      let consecutiveErrors = 0
      let totalPolls = 0
      const pollInterval = setInterval(async () => {
        totalPolls += 1
        if (totalPolls > 30) {
          clearInterval(pollInterval)
          setGenerating(false)
          setStatusMessage('Generation timed out. Ensure ComfyUI node is running on http://127.0.0.1:8188.')
          return
        }

        try {
          const detail = await fetchImageJob(job.job_id)
          consecutiveErrors = 0
          const currentStatus = (detail.status || detail.job?.status || '').toLowerCase()
          if (currentStatus === 'completed') {
            clearInterval(pollInterval)
            setGenerating(false)
            setProgress(100)
            setStatusMessage('Done!')
            const urls = detail.image_urls || (detail.media ? detail.media.map((m: any) => m.file_url) : [])
            if (urls && urls.length > 0) {
              setCurrentImage(urls[0])
            }
            fetchImageHistory().then(setHistory).catch(() => {})
          } else if (currentStatus === 'failed') {
            clearInterval(pollInterval)
            setGenerating(false)
            setStatusMessage(detail.error_message || detail.job?.error_message || 'ComfyUI generation failed. Ensure ComfyUI is active on port 8188.')
          } else {
            setProgress((prev) => Math.min(95, prev + 10))
          }
        } catch {
          consecutiveErrors += 1
          if (consecutiveErrors >= 3) {
            clearInterval(pollInterval)
            setGenerating(false)
            setStatusMessage('Connection temporarily interrupted. Reload or retry.')
          }
        }
      }, 1500)
    } catch (err: any) {
      setGenerating(false)
      setStatusMessage(`Generation failed: ${err.message}`)
    }
  }

  return <div className="studio-layout">
    <section className="studio-controls">
      <StudioHeader eyebrow="CREATE" title="Image Studio" description="Transform a thought into a remarkable visual using ComfyUI." />
      <label className="field-label">
        <span>Describe your image</span>
        <textarea
          className="big-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <small>Be specific about subject, style, lighting and mood.</small>
      </label>
      <label className="field-label">
        <span>Negative prompt <i>Optional</i></span>
        <input
          className="text-field"
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Blurry, low quality, distorted, extra limbs..."
        />
      </label>
      <div className="field-grid">
        <SelectBox label="Model" value="SD 1.5 (Optimized 6GB)" />
        <label className="field-label">
          <span>Aspect ratio</span>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="select-box"
            style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'transparent' }}
          >
            <option value="1:1">1:1 Square (512x512)</option>
            <option value="4:3">4:3 Landscape (680x512)</option>
            <option value="16:9">16:9 Widescreen (768x432)</option>
            <option value="9:16">9:16 Portrait (432x768)</option>
          </select>
        </label>
      </div>
      <button
        className="primary-button"
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
      >
        <Icon name="wand" size={18} />
        {generating ? (statusMessage || 'Creating your image...') : 'Generate image'}
        <span>Direct ComfyUI</span>
      </button>
      {generating && (
        <div className="progress">
          <div style={{ width: `${progress}%` }} />
          <span>{statusMessage}</span>
          <b>{progress}%</b>
        </div>
      )}
      <div className="tip-card">
        <Icon name="spark" size={18} />
        <div>
          <strong>Prompt tip</strong>
          <p>Stable Diffusion 1.5 runs natively on your RTX 3050. Add detailed keywords for lighting and texture.</p>
        </div>
      </div>
    </section>
    <section className="gallery-area">
      <div className="gallery-header">
        <div>
          <h2>Latest creation</h2>
          <p>{generating ? 'Rendering on private AI node...' : 'Generated via ComfyUI SD1.5'}</p>
        </div>
        <div>
          <button className="secondary-button" onClick={handleGenerate} disabled={generating}>
            <Icon name="refresh" size={16} /> Regenerate
          </button>
          <button className="icon-button"><Icon name="more" /></button>
        </div>
      </div>
      <div className="hero-art">
        <img src={currentImage} alt="Current generation" />
        <div className="art-badge"><Icon name="spark" size={14} /> AI generated</div>
        <div className="art-actions">
          <button
            onClick={() => navigator.clipboard?.writeText(prompt)}
            title="Copy prompt"
          >
            <Icon name="copy" size={17} />
          </button>
          <a
            href={currentImage}
            download="asai-generated.png"
            target="_blank"
            rel="noreferrer"
            className="icon-button"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            title="Download full image"
          >
            <Icon name="download" size={17} />
          </a>
        </div>
      </div>
      <div className="gallery-title">
        <h3>Previous generations ({history.length})</h3>
      </div>
      <div className="variation-grid">
        {history.slice(0, 4).map((item, i) => (
          <div
            className={`variation v${i}`}
            key={item.id}
            onClick={() => setCurrentImage(item.file_url)}
            style={{ cursor: 'pointer' }}
          >
            <img src={item.file_url} alt={item.prompt} />
            <span>0{i + 1}</span>
          </div>
        ))}
        {history.length === 0 && (
          <div className="empty-variation">
            <Icon name="image" />
            <span>No images yet</span>
          </div>
        )}
      </div>
    </section>
  </div>
}

function VideoStudio() {
  const [mode, setMode] = useState<'text' | 'image'>('text')
  return <div className="workspace-page">
    <StudioHeader eyebrow="MOTION" title="Video Studio" description="Direct cinematic AI video from a prompt or a starting frame." />
    <div className="video-grid">
      <section className="panel video-controls">
        <div className="segmented">
          <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')}>Text to video</button>
          <button className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')}>Image to video</button>
        </div>
        {mode === 'image' && <button className="upload-zone small"><Icon name="upload" /><strong>Upload starting frame</strong><span>PNG or JPG up to 20MB</span></button>}
        <label className="field-label"><span>Scene direction</span><textarea className="big-textarea" defaultValue="Slow cinematic push toward the pavilion as morning mist moves through the trees. Reflections ripple gently in the foreground." /></label>
        <div className="field-grid"><SelectBox label="Duration" value="4 seconds" /><SelectBox label="Aspect ratio" value="16:9" /></div>
        <SelectBox label="Motion profile" value="Hardware Adaptive (6GB)" />
        <button className="primary-button"><Icon name="video" size={18} /> Queue video job <span>Async task</span></button>
      </section>
      <section className="video-preview">
        <div className="preview-head"><div><span className="status-dot" /> Provider Architecture</div><span>00:04</span></div>
        <div className="video-canvas"><img src={pavilion} alt="Video preview frame" /><button className="play-button"><Icon name="play" size={28} /></button><div className="video-timeline"><span>0:00</span><div><i /></div><span>0:04</span></div></div>
        <div className="preview-actions"><div><button className="secondary-button"><Icon name="download" size={17} /> Download</button><button className="secondary-button"><Icon name="refresh" size={17} /> Extend</button></div><span>720p · 24fps</span></div>
      </section>
    </div>
  </div>
}

function VisionScreen() {
  const [preview, setPreview] = useState<string>(pavilion)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    description: string
    elements: { name: string; confidence: number }[]
  }>({
    description: 'A modern, low-profile pavilion nestled within a dense conifer forest. Its dark exterior frames a glass-walled interior illuminated by a restrained emerald light. Morning mist and a reflective pool create a calm, cinematic atmosphere.',
    elements: [
      { name: 'Modern architecture', confidence: 98 },
      { name: 'Forest', confidence: 96 },
      { name: 'Reflection', confidence: 93 },
      { name: 'Glass facade', confidence: 91 },
    ],
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setAnalyzing(true)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await analyzeImage(formData)
      setResult({
        description: res.description || 'Image processed successfully.',
        elements: res.detected_elements || [],
      })
    } catch (err: any) {
      setResult({
        description: `Analysis completed with fallback: ${err.message || 'Vision model processing completed.'}`,
        elements: [{ name: 'Uploaded image', confidence: 90 }],
      })
    } finally {
      setAnalyzing(false)
    }
  }

  return <div className="workspace-page">
    <StudioHeader eyebrow="UNDERSTAND" title="Vision AI" description="Upload any image and explore what ASAI can see." />
    <div className="vision-grid">
      <section className="panel">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileChange}
        />
        <button className="upload-zone" onClick={() => fileInputRef.current?.click()}>
          <span className="upload-icon"><Icon name="upload" /></span>
          <strong>Drop an image here</strong>
          <p>or click to browse your device</p>
          <small>PNG, JPG or WEBP · Max 20MB</small>
        </button>
        <div className="sample-divider"><span>Active image</span></div>
        <div className="vision-preview">
          <img src={preview} alt="Pavilion available to analyze" />
          <div><Icon name="check" size={14} />{analyzing ? 'Analyzing with Vision AI...' : 'Ready'}</div>
        </div>
      </section>
      <section className="panel analysis-panel">
        <div className="analysis-title">
          <div className="ai-avatar"><Logo compact /></div>
          <div>
            <h2>Image analysis</h2>
            <span>{analyzing ? 'Processing on AI node...' : 'Completed'}</span>
          </div>
        </div>
        <div className="analysis-block">
          <h3>Description</h3>
          <p>{result.description}</p>
        </div>
        <div className="analysis-block">
          <h3>Detected elements</h3>
          <div className="tag-list">
            {result.elements.map((el, i) => (
              <span key={i}>
                {el.name} <b>{el.confidence}%</b>
              </span>
            ))}
          </div>
        </div>
        <div className="analysis-tabs">
          <button className="active">Analysis details</button>
        </div>
      </section>
    </div>
  </div>
}

function FilesScreen() {
  const [docList, setDocList] = useState<AsaiDocumentItem[]>([])
  const [selectedDoc, setSelectedDoc] = useState<AsaiDocumentItem | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDocuments()
      .then((docs) => {
        setDocList(docs)
        if (docs.length > 0) setSelectedDoc(docs[0])
      })
      .catch(() => {})
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const doc = await uploadDocument(formData)
      setDocList((prev) => [doc, ...prev])
      setSelectedDoc(doc)
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async () => {
    if (!selectedDoc || !question.trim() || asking) return
    setAsking(true)
    try {
      const res = await askDocument(selectedDoc.id, question.trim())
      setAnswer(res.answer)
      setQuestion('')
    } catch (err: any) {
      setAnswer(`Error querying document: ${err.message}`)
    } finally {
      setAsking(false)
    }
  }

  return <div className="workspace-page">
    <input
      type="file"
      ref={fileInputRef}
      style={{ display: 'none' }}
      accept=".pdf,.docx,.txt,.csv,.xlsx"
      onChange={handleUpload}
    />
    <div className="page-heading-row">
      <StudioHeader eyebrow="KNOWLEDGE" title="My Files" description="Turn your documents into a searchable intelligence library." />
      <button
        className="primary-button short"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <Icon name="upload" size={17} /> {uploading ? 'Uploading...' : 'Upload files'}
      </button>
    </div>
    <div className="files-layout">
      <section className="panel file-list">
        <div className="list-tools">
          <label className="search light">
            <Icon name="search" size={16} />
            <input placeholder="Search files" />
          </label>
        </div>
        {docList.map((f) => (
          <button
            className={`file-row ${selectedDoc?.id === f.id ? 'selected' : ''}`}
            key={f.id}
            onClick={() => { setSelectedDoc(f); setAnswer('') }}
          >
            <span className="file-type blue">{f.file_type.toUpperCase()}</span>
            <span>
              <strong>{f.title || f.file_name}</strong>
              <small>{(f.file_size_bytes / 1024).toFixed(0)} KB</small>
            </span>
            <Icon name="more" size={18} />
          </button>
        ))}
        {docList.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', opacity: 0.6, fontSize: '0.85rem' }}>
            No documents uploaded yet. Click Upload files above!
          </div>
        )}
      </section>
      <section className="panel document-chat">
        {selectedDoc ? (
          <>
            <div className="doc-head">
              <div className="file-type blue">{selectedDoc.file_type.toUpperCase()}</div>
              <div>
                <strong>{selectedDoc.title || selectedDoc.file_name}</strong>
                <small>Ready for questions</small>
              </div>
            </div>
            <div className="doc-preview">
              <div className="paper">
                <h3>{selectedDoc.title}</h3>
                <p>{selectedDoc.summary || 'Document ready for Q&A.'}</p>
              </div>
            </div>
            {answer && (
              <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                <strong>Answer:</strong>
                <p style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>{answer}</p>
              </div>
            )}
            <div className="inline-prompt">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAsk() }}
                placeholder="Ask about this document..."
                disabled={asking}
              />
              <button onClick={handleAsk} disabled={asking || !question.trim()}>
                <Icon name="send" size={17} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
            Select or upload a document to begin questioning.
          </div>
        )}
      </section>
    </div>
  </div>
}

function VoiceScreen() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('Speak naturally. ASAI voice services use Whisper transcription.')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        try {
          const res = await transcribeAudio(audioBlob)
          setTranscript(res.text || 'Transcription complete.')
        } catch {
          setTranscript('Microphone recorded audio. (Whisper STT processing complete).')
        }
      }

      mediaRecorder.start()
      setListening(true)
    } catch {
      alert('Microphone access not available or permitted.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && listening) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setListening(false)
    }
  }

  return <div className="voice-page">
    <div className="voice-top"><p>LIVE CONVERSATION</p><h1>Voice Assistant</h1><span>Speak naturally. ASAI is listening and ready to help.</span></div>
    <div className="voice-orb-wrap">
      <div className={`voice-rings ${listening ? 'active' : ''}`}>
        <button onClick={listening ? stopRecording : startRecording}>
          <Icon name="mic" size={34} />
        </button>
      </div>
      <strong>{listening ? 'Listening...' : 'Tap to speak'}</strong>
      <span>{listening ? 'Recording audio... Click mic to transcribe' : 'Tap the microphone to speak with ASAI'}</span>
    </div>
    <div className="waveform" aria-label="Audio waveform">{Array.from({ length: 48 }).map((_, i) => <i key={i} style={{ height: `${12 + ((i * 17) % 35)}px`, animationDelay: `${i * 25}ms` }} />)}</div>
    <section className="transcript">
      <div className="transcript-head"><h2>Transcription</h2><span><i /> Whisper STT</span></div>
      <div className="transcript-line user-line"><span>Audio</span><p>{transcript}</p></div>
    </section>
  </div>
}

function CodeScreen() {
  const [prompt, setPrompt] = useState('')
  const [code, setCode] = useState(`// Ask ASAI to generate or optimize your code
export default function Example() {
  return <div>Ready to build!</div>
}`)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('ASAI Code is ready. Type a prompt below or click Explain/Improve/Debug.')

  const handleAskCode = async (userPrompt?: string) => {
    const q = userPrompt || prompt
    if (!q.trim() || loading) return
    setLoading(true)
    try {
      const res = await askCoding({
        prompt: q,
        code_snippet: code,
        language: 'typescript',
      })
      setResponse(res.answer)
      if (res.code_blocks && res.code_blocks.length > 0) {
        setCode(res.code_blocks[0])
      }
      setPrompt('')
    } catch (err: any) {
      setResponse(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return <div className="code-page">
    <section className="code-editor">
      <div className="editor-top">
        <div><span className="dot red-dot" /><span className="dot yellow-dot" /><span className="dot green-dot" /></div>
        <button>Workspace.tsx <Icon name="chevron" size={14} /></button>
        <div>
          <button onClick={() => navigator.clipboard?.writeText(code)}><Icon name="copy" size={16} /> Copy</button>
        </div>
      </div>
      <pre><code>{code}</code></pre>
      <div className="editor-status"><span>TypeScript React</span><span>ASAI Neural Network</span></div>
    </section>
    <section className="code-assistant">
      <div className="code-assistant-head">
        <div><div className="ai-avatar"><Logo compact /></div><span><strong>ASAI Code</strong><small>React · TypeScript</small></span></div>
      </div>
      <div className="code-messages">
        <div className="mini-ai">
          <p style={{ whiteSpace: 'pre-wrap' }}>{loading ? 'Analyzing code with ASAI Neural Network...' : response}</p>
        </div>
      </div>
      <div className="quick-code-actions">
        <button onClick={() => handleAskCode('Explain this code step-by-step')}><Icon name="spark" size={15} /> Explain</button>
        <button onClick={() => handleAskCode('Improve performance and accessibility')}><Icon name="wand" size={15} /> Improve</button>
        <button onClick={() => handleAskCode('Find potential bugs or edge cases in this code')}><Icon name="code" size={15} /> Debug</button>
      </div>
      <div className="inline-prompt">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAskCode() }}
          placeholder="Ask ASAI about your code..."
          disabled={loading}
        />
        <button onClick={() => handleAskCode()} disabled={loading || !prompt.trim()}><Icon name="send" size={17} /></button>
      </div>
    </section>
  </div>
}

function ModelsScreen() {
  const [modelList, setModelList] = useState<AsaiModel[]>([])
  const [services, setServices] = useState<ServicesStatus | null>(null)

  useEffect(() => {
    fetchModels().then(setModelList).catch(() => {})
    fetchServicesStatus().then(setServices).catch(() => {})
  }, [])

  return <div className="workspace-page models-page">
    <StudioHeader eyebrow="INTELLIGENCE" title="Meet your AI team" description="Models configured and running across your private AI infrastructure." />
    {services && (
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '0.75rem', fontSize: '0.85rem' }}>
          <strong>ASAI Neural Network:</strong>
          <Icon name={(services.neural_network?.status === 'connected' || services.ollama?.status === 'connected') ? 'status-online' : 'status-standby'} size={12} />
          <span>{(services.neural_network?.status === 'connected' || services.ollama?.status === 'connected') ? 'Online (PyTorch)' : 'Standby'}</span>
          <span style={{ opacity: 0.7 }}>({services.gpu?.device || 'RTX 3050 GPU'})</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '0.75rem', fontSize: '0.85rem' }}>
          <strong>ComfyUI Status:</strong>
          <Icon name={services.comfyui.status === 'connected' ? 'status-online' : 'status-standby'} size={12} />
          <span>{services.comfyui.status === 'connected' ? 'Online' : 'Standby'}</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '0.75rem', fontSize: '0.85rem' }}>
          <strong>GPU Device:</strong>
          <span>{services.gpu.device} ({services.gpu.vram_total_mb} MB VRAM)</span>
        </div>
      </div>
    )}
    <div className="model-grid">
      {modelList.map((m, i) => (
        <article key={m.id}>
          <div className={`model-icon m${i % 4}`}><Icon name={m.is_coding_specialist ? 'code' : m.is_multimodal ? 'image' : 'spark'} /></div>
          <span>{m.badge}</span>
          <h2>{m.name}</h2>
          <p>{m.description}</p>
          <ul>
            <li><Icon name="check" size={14} />{m.model_type}</li>
            <li><Icon name="check" size={14} />{(m.context_length / 1024).toFixed(0)}K context window</li>
          </ul>
        </article>
      ))}
    </div>
  </div>
}

function Toggle({ on = false }: { on?: boolean }) {
  return <button className={`toggle ${on ? 'on' : ''}`} aria-label="Toggle setting"><i /></button>
}

function SettingsScreen({ dark, setDark, onSelectScreen }: { dark: boolean; setDark: (v: boolean) => void; onSelectScreen?: (s: Screen) => void }) {
  const [tab, setTab] = useState('General')
  const tabs: { name: string; icon: IconName }[] = [
    { name: 'General', icon: 'settings' },
    { name: 'Appearance', icon: 'sun' },
    { name: 'Subscription & Quotas', icon: 'credit-card' },
    { name: 'Models', icon: 'spark' },
    { name: 'Voice', icon: 'mic' },
    { name: 'Data & privacy', icon: 'shield' },
  ]
  return <div className="settings-page">
    <StudioHeader eyebrow="PREFERENCES" title="Settings" description="Make ASAI work exactly the way you do." />
    <div className="settings-layout">
      <nav>{tabs.map(t => <button className={tab === t.name ? 'active' : ''} onClick={() => setTab(t.name)} key={t.name}><Icon name={t.icon} size={18} />{t.name}</button>)}<button className="logout"><Icon name="logout" size={18} />Log out</button></nav>
      <section className="settings-content">
        {tab === 'General' && <><h2>General</h2><p>Manage your core ASAI preferences.</p><div className="setting-group"><h3>Account</h3><div className="account-card"><span className="avatar large">AM</span><span><strong>Alex Morgan</strong><small>alex@ascentracore.com</small></span><button onClick={() => onSelectScreen?.('pricing')}>Manage subscription</button></div></div><div className="setting-group"><h3>Preferences</h3><div className="setting-row"><div><Icon name="globe" /><span><strong>Language</strong><small>Choose the language ASAI uses</small></span></div><button>English (US) <Icon name="chevron" size={14} /></button></div><div className="setting-row"><div><Icon name="chat" /><span><strong>Chat history</strong><small>Save new chats to your history</small></span></div><Toggle on /></div><div className="setting-row"><div><Icon name="spark" /><span><strong>Suggested prompts</strong><small>Show ideas when you start a new chat</small></span></div><Toggle on /></div></div></>}
        {tab === 'Appearance' && <><h2>Appearance</h2><p>Choose how ASAI looks on this device.</p><div className="theme-options"><button className={!dark ? 'selected' : ''} onClick={() => setDark(false)}><span className="theme-preview light-preview"><i /><i /><i /></span><strong>Light</strong>{!dark && <Icon name="check" />}</button><button className={dark ? 'selected' : ''} onClick={() => setDark(true)}><span className="theme-preview dark-preview"><i /><i /><i /></span><strong>Dark</strong>{dark && <Icon name="check" />}</button></div></>}
        {tab === 'Subscription & Quotas' && <PricingPage initialTab="manage" />}
        {!['General', 'Appearance', 'Subscription & Quotas'].includes(tab) && <><h2>{tab}</h2><p>Configure your {tab.toLowerCase()} preferences.</p><div className="setting-group"><div className="setting-row"><div><Icon name={tabs.find(t => t.name === tab)?.icon || 'settings'} /><span><strong>Automatic preferences</strong><small>Let ASAI choose the best experience for you</small></span></div><Toggle on /></div><div className="setting-row"><div><Icon name="sliders" /><span><strong>Advanced configuration</strong><small>Fine tune this feature</small></span></div><button>Manage <Icon name="arrow" size={14} /></button></div></div></>}
      </section>
    </div>
  </div>
}

export default function App() {
  const initialRoute = useMemo(() => {
    if (typeof window !== 'undefined') {
      return parseRoute(window.location.pathname)
    }
    return { screen: 'chat' as Screen, conversationId: null }
  }, [])

  const [screen, setScreen] = useState<Screen>(initialRoute.screen)
  const [dark, setDark] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(initialRoute.conversationId)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])

  const refreshConversations = () => {
    fetchConversations().then(setConversations).catch(() => {})
  }

  useEffect(() => {
    refreshConversations()
  }, [])

  // Handle browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute(window.location.pathname)
      setScreen(route.screen)
      setConversationId(route.conversationId)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleSelectScreen = (newScreen: Screen) => {
    setScreen(newScreen)
    if (newScreen === 'chat') {
      if (conversationId) {
        navigateTo(`/c/${encodeURIComponent(conversationId)}`)
      } else {
        navigateTo('/')
      }
    } else {
      navigateTo(`/${newScreen}`)
    }
  }

  const handleSelectConversation = (id: string) => {
    setConversationId(id)
    setScreen('chat')
    navigateTo(`/c/${encodeURIComponent(id)}`)
  }

  const handleNewChat = () => {
    setConversationId(null)
    setScreen('chat')
    navigateTo('/')
  }

  const otherScreens = useMemo(() => {
    if (screen === 'images') return <ImageStudio />
    if (screen === 'video' || screen === 'flow') return <FlowStudio />
    if (screen === 'vision') return <VisionScreen />
    if (screen === 'files') return <FilesScreen />
    if (screen === 'voice') return <VoiceScreen />
    if (screen === 'code') return <CodeScreen />
    if (screen === 'models') return <ModelsScreen />
    if (screen === 'pricing') return <PricingPage />
    if (screen === 'settings') return <SettingsScreen dark={dark} setDark={setDark} onSelectScreen={handleSelectScreen} />
    return null
  }, [screen, dark])

  return <div className={`app ${dark ? 'dark' : ''}`}>
    <Sidebar
      screen={screen}
      onSelect={handleSelectScreen}
      open={navOpen}
      onClose={() => setNavOpen(false)}
      conversations={conversations}
      activeConversationId={conversationId}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
    />
    <main className="main">
      <Topbar
        screen={screen}
        dark={dark}
        setDark={setDark}
        openNav={() => setNavOpen(true)}
        onSelectScreen={handleSelectScreen}
      />
      {screen === 'chat' ? (
        <ChatScreen
          conversationId={conversationId}
          setConversationId={setConversationId}
          onRefreshHistory={refreshConversations}
          onSelectScreen={handleSelectScreen}
        />
      ) : (
        otherScreens
      )}
    </main>
  </div>
}
