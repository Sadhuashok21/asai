import React, { useState } from 'react'
import { breakdownBriefWithAI, createScene } from './flowApi'
import { FlowProject, FlowScene } from './types'

interface FlowAssistantModalProps {
  project: FlowProject | null
  onClose: () => void
  onScenesAdded: (newScenes: FlowScene[]) => void
}

const CINEMATIC_GENRES = [
  { id: 'cinematic_scifi', name: 'Cinematic Sci-Fi', desc: 'Futuristic atmosphere, neon lighting, sleek anamorphic lenses' },
  { id: 'film_noir', name: 'Film Noir', desc: 'Dramatic shadows, high contrast black & white, moody rainy cityscapes' },
  { id: 'nature_documentary', name: 'Nature Documentary', desc: 'Warm natural dawn light, macro wildlife, sweeping drone aerials' },
  { id: 'cyberpunk', name: 'Cyberpunk Action', desc: 'Dystopian high-tech megacity, holographic glare, rain-slicked pavement' },
  { id: 'vintage_cinema', name: 'Vintage 35mm Cinema', desc: 'Organic film grain, muted warm palette, vintage prime optics' },
  { id: 'hyperrealistic', name: 'Hyper-Realistic Commercial', desc: 'Crisp studio keylight, pristine product clarity, fluid motion' },
]

export const FlowAssistantModal: React.FC<FlowAssistantModalProps> = ({
  project,
  onClose,
  onScenesAdded,
}) => {
  const [brief, setBrief] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('cinematic_scifi')
  const [sceneCount, setSceneCount] = useState(4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [breakdownResult, setBreakdownResult] = useState<any | null>(null)
  const [applying, setApplying] = useState(false)

  const handleGenerateBreakdown = async () => {
    if (!brief.trim()) {
      setError('Please provide a brief description of your film concept.')
      return
    }

    setLoading(true)
    setError(null)
    setBreakdownResult(null)

    try {
      const data = await breakdownBriefWithAI({
        brief: brief.trim(),
        genre: selectedGenre,
        scene_count: sceneCount,
        aspect_ratio: project?.aspect_ratio || '16:9',
      })

      if (data && data.scenes && data.scenes.length > 0) {
        setBreakdownResult(data)
      } else {
        setError('No scenes could be generated. Please try a different brief.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate film breakdown using ASAI neural network.')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToProject = async () => {
    if (!project || !breakdownResult || !breakdownResult.scenes) return

    setApplying(true)
    setError(null)

    try {
      const createdScenes: FlowScene[] = []
      for (let i = 0; i < breakdownResult.scenes.length; i++) {
        const s = breakdownResult.scenes[i]
        const created = await createScene(project.id, {
          prompt: s.prompt || s.visual_prompt || 'Cinematic scene',
          narration: s.dialogue || s.narration || '',
          camera_framing: s.camera_framing || 'Medium shot',
          camera_movement: s.camera_movement || 'Cinematic Dolly In',
          transition_in: s.transition_in || (i === 0 ? 'cut' : 'cross_dissolve'),
          duration_seconds: s.duration_seconds || 4,
          sequence_order: i,
        })
        createdScenes.push(created)
      }

      onScenesAdded(createdScenes)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add generated scenes to project timeline.')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="flow-modal-backdrop" onClick={onClose}>
      <div className="flow-modal-dialog assistant-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flow-modal-header">
          <div className="flow-modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="modal-title-icon">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <h2>ASAI AI Filmmaking Assistant</h2>
          </div>
          <button type="button" className="flow-modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flow-modal-body">
          <p className="flow-assistant-intro">
            Describe your narrative story or film concept. The ASAI neural network will automatically architect a multi-scene storyboard with camera angles, visual prompts, and cinematic transitions.
          </p>

          <div className="flow-field-group">
            <label className="flow-label">Film Concept / Creative Brief</label>
            <textarea
              className="flow-textarea"
              rows={3}
              placeholder="e.g. A lone explorer lands on a bioluminescent alien planet at twilight, discovering an ancient crystal monolith pulsing with celestial energy..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              disabled={loading || applying}
            />
          </div>

          <div className="flow-modal-row">
            <div className="flow-field-group flex-1">
              <label className="flow-label">Cinematic Genre & Visual Style</label>
              <select
                className="flow-select"
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                disabled={loading || applying}
              >
                {CINEMATIC_GENRES.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} – {g.desc}</option>
                ))}
              </select>
            </div>

            <div className="flow-field-group" style={{ width: '140px' }}>
              <label className="flow-label">Scene Count</label>
              <select
                className="flow-select"
                value={sceneCount}
                onChange={(e) => setSceneCount(Number(e.target.value))}
                disabled={loading || applying}
              >
                <option value={2}>2 Scenes</option>
                <option value={3}>3 Scenes</option>
                <option value={4}>4 Scenes (Std)</option>
                <option value={5}>5 Scenes</option>
                <option value={6}>6 Scenes</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flow-error-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Generated Breakdown Preview */}
          {breakdownResult && (
            <div className="flow-breakdown-preview-area">
              <div className="flow-breakdown-concept-card">
                <h3>{breakdownResult.film_title || 'Generated Film Concept'}</h3>
                <p><strong>Logline:</strong> {breakdownResult.concept || breakdownResult.logline}</p>
              </div>

              <div className="flow-breakdown-scenes-list">
                <h4>Generated Storyboard Sequence ({breakdownResult.scenes?.length} Scenes):</h4>
                {breakdownResult.scenes?.map((sc: any, i: number) => (
                  <div key={i} className="flow-breakdown-scene-row">
                    <span className="flow-breakdown-idx">#{i + 1}</span>
                    <div className="flow-breakdown-content">
                      <div className="flow-breakdown-tags">
                        <span className="badge camera">{sc.camera_framing}</span>
                        <span className="badge motion">{sc.camera_movement}</span>
                        <span className="badge duration">{sc.duration_seconds || 4}s</span>
                      </div>
                      <p className="flow-breakdown-prompt">{sc.prompt || sc.visual_prompt}</p>
                      {sc.narration && (
                        <p className="flow-breakdown-narration"><em>Narration:</em> "{sc.narration}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flow-modal-footer">
          <button
            type="button"
            className="flow-btn-secondary"
            onClick={onClose}
            disabled={loading || applying}
          >
            Cancel
          </button>

          {!breakdownResult ? (
            <button
              type="button"
              className="flow-btn-primary"
              onClick={handleGenerateBreakdown}
              disabled={loading || !brief.trim()}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>Decomposing Storyboard...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span>Generate Storyboard</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="flow-btn-primary apply"
              onClick={handleApplyToProject}
              disabled={applying}
            >
              {applying ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>Adding to Timeline...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Apply {breakdownResult.scenes?.length} Scenes to Timeline</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
