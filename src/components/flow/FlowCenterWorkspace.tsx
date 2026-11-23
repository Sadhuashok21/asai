import React, { useRef, useState, useEffect } from 'react'
import { FlowScene, FlowProject, FlowCharacter } from './types'

interface FlowCenterWorkspaceProps {
  project: FlowProject | null
  activeScene: FlowScene | null
  characters: FlowCharacter[]
  isGenerating: boolean
  generationProgress: number
  generationStage: string
  onUpdateScene: (patch: Partial<FlowScene>) => void
  onGenerateText: () => void
  onGenerateFrames: (file?: File) => void
  onExtendClip: () => void
  onOpenEditModal: () => void
  onOpenAssistantModal: () => void
  onOpenVersionHistory: () => void
}

export const FlowCenterWorkspace: React.FC<FlowCenterWorkspaceProps> = ({
  project,
  activeScene,
  characters,
  isGenerating,
  generationProgress,
  generationStage,
  onUpdateScene,
  onGenerateText,
  onGenerateFrames,
  onExtendClip,
  onOpenEditModal,
  onOpenAssistantModal,
  onOpenVersionHistory,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeMode, setActiveMode] = useState<'text' | 'frames' | 'consistency'>('text')

  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }, [activeScene?.scene_id, activeScene?.active_clip_url])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${mins}:${s.toString().padStart(2, '0')}`
  }

  const framingOptions = [
    'Extreme close-up',
    'Close-up',
    'Medium shot',
    'Wide shot',
    'Extreme wide shot',
    'Aerial shot',
    'POV',
  ]

  const movementOptions = [
    'Static',
    'Dolly in',
    'Dolly out',
    'Pan left',
    'Pan right',
    'Tilt up',
    'Tilt down',
    'Zoom in',
    'Zoom out',
    'Tracking shot',
    'Orbit',
  ]

  return (
    <div className="flow-center-workspace">
      {/* Top Scene Bar */}
      <div className="flow-workspace-topbar">
        <div className="scene-indicator">
          <span className="scene-num">SCENE {(activeScene?.order || 0) + 1}</span>
          <input
            type="text"
            className="scene-title-input"
            value={activeScene?.title || ''}
            onChange={(e) => onUpdateScene({ title: e.target.value })}
            placeholder="Scene title..."
          />
        </div>

        <div className="workspace-top-actions">
          <button
            type="button"
            className="btn-assistant-trigger"
            onClick={onOpenAssistantModal}
            title="Generate full script &amp; storyboard with AI Filmmaking Assistant"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
            <span>AI Storyboard Assistant</span>
          </button>

          <button
            type="button"
            className="btn-version-stack"
            onClick={onOpenVersionHistory}
            title="Inspect previous clip versions and restore"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Versions ({activeScene?.versions_count || 1})</span>
          </button>
        </div>
      </div>

      {/* Video Preview Canvas */}
      <div className="flow-preview-canvas-container">
        <div className={`flow-video-canvas aspect-${project?.aspect_ratio?.replace(':', '-') || '16-9'}`}>
          {activeScene?.active_clip_url ? (
            <video
              ref={videoRef}
              src={activeScene.active_clip_url}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
              playsInline
            />
          ) : activeScene?.starting_frame_url ? (
            <img src={activeScene.starting_frame_url} alt="Starting Keyframe" className="canvas-frame-preview" />
          ) : (
            <div className="empty-canvas-state">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="m9 8 7 4-7 4Z" />
              </svg>
              <span>No clip generated for this scene yet</span>
              <p>Type your cinematic prompt below or upload a starting frame to begin rendering.</p>
            </div>
          )}

          {/* Canvas Overlays & Playback Controls */}
          {activeScene?.active_clip_url && (
            <button type="button" className="canvas-play-button" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect width="4" height="16" x="6" y="4" />
                  <rect width="4" height="16" x="14" y="4" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              )}
            </button>
          )}

          {/* Generating Progress Overlay */}
          {isGenerating && (
            <div className="canvas-generating-overlay">
              <div className="render-pulse-loader" />
              <div className="render-status-title">RENDERING SCENE MOTION</div>
              <div className="render-stage-text">{generationStage}</div>
              <div className="render-progress-bar">
                <div className="render-bar-fill" style={{ width: `${generationProgress}%` }} />
              </div>
              <span className="render-percent">{generationProgress}%</span>
            </div>
          )}
        </div>

        {/* Video Scrubber & Playhead Controls */}
        <div className="canvas-controls-bar">
          <div className="timecode-display">
            <span>{formatTime(currentTime)}</span> / <span>{formatTime(activeScene?.duration_seconds || 4)}</span>
          </div>

          <div className="canvas-actions-right">
            {activeScene?.active_clip_url && (
              <>
                <button
                  type="button"
                  className="canvas-mini-btn"
                  onClick={onExtendClip}
                  title="Extend clip duration by extracting ending keyframe"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  <span>Extend (+4s)</span>
                </button>

                <button
                  type="button"
                  className="canvas-mini-btn"
                  onClick={onOpenEditModal}
                  title="Modify lighting, style, or color tone with instruction"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <span>Edit Clip</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filmmaking Prompt Director & Controls */}
      <div className="flow-director-panel">
        {/* Mode Selector Tabs */}
        <div className="flow-mode-tabs">
          <button
            type="button"
            className={`mode-tab ${activeMode === 'text' ? 'active' : ''}`}
            onClick={() => setActiveMode('text')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 12 14-7-4 14-3-6z" />
            </svg>
            <span>Text to Video</span>
          </button>

          <button
            type="button"
            className={`mode-tab ${activeMode === 'frames' ? 'active' : ''}`}
            onClick={() => setActiveMode('frames')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span>Keyframe to Video</span>
          </button>

          <button
            type="button"
            className={`mode-tab ${activeMode === 'consistency' ? 'active' : ''}`}
            onClick={() => setActiveMode('consistency')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <span>Character Continuity</span>
          </button>
        </div>

        {/* Prompt Input */}
        <div className="prompt-editor-box">
          <textarea
            className="flow-prompt-textarea"
            rows={3}
            placeholder="Describe the cinematic scene in detail (e.g. 'Slow tracking shot of an electric car driving through a rainy neon metropolis, reflective asphalt, volumetric headlights')..."
            value={activeScene?.prompt || ''}
            onChange={(e) => onUpdateScene({ prompt: e.target.value })}
            disabled={isGenerating}
          />
        </div>

        {/* Framing & Camera Trajectory Selectors */}
        <div className="cinematography-controls-row">
          <div className="control-field">
            <label>Camera Framing</label>
            <select
              value={activeScene?.camera_framing || 'Medium shot'}
              onChange={(e) => onUpdateScene({ camera_framing: e.target.value })}
              disabled={isGenerating}
            >
              {framingOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label>Camera Movement</label>
            <select
              value={activeScene?.camera_movement || 'Static'}
              onChange={(e) => onUpdateScene({ camera_movement: e.target.value })}
              disabled={isGenerating}
            >
              {movementOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="control-field">
            <label>Scene Duration</label>
            <select
              value={activeScene?.duration_seconds || 4.0}
              onChange={(e) => onUpdateScene({ duration_seconds: Number(e.target.value) })}
              disabled={isGenerating}
            >
              <option value={2.0}>2.0 seconds</option>
              <option value={4.0}>4.0 seconds (Recommended on 6GB)</option>
              <option value={6.0}>6.0 seconds</option>
              <option value={8.0}>8.0 seconds</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="action-button-field">
            <button
              type="button"
              className="btn-flow-generate"
              onClick={activeMode === 'frames' ? () => onGenerateFrames() : onGenerateText}
              disabled={isGenerating || !activeScene?.prompt?.trim()}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{isGenerating ? 'Rendering...' : 'Render Scene Clip'}</span>
            </button>
          </div>
        </div>

        {/* Frames Mode Dropzone */}
        {activeMode === 'frames' && (
          <div className="frame-dropzone-row">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onGenerateFrames(f)
              }}
            />
            <button
              type="button"
              className="dropzone-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{activeScene?.starting_frame_url ? 'Replace Opening Keyframe Image' : 'Upload Opening Keyframe Image'}</span>
            </button>
          </div>
        )}

        {/* Character Continuity Selection */}
        {activeMode === 'consistency' && (
          <div className="character-continuity-selector">
            <label className="continuity-label">Link Character to Scene:</label>
            <div className="character-pills-list">
              {characters.length === 0 ? (
                <span className="no-chars-hint">No characters defined yet in Character Library.</span>
              ) : (
                characters.map((c) => (
                  <button
                    type="button"
                    key={c.character_id}
                    className="character-chip"
                    onClick={() => {
                      const currentPrompt = activeScene?.prompt || ''
                      if (!currentPrompt.includes(c.name)) {
                        onUpdateScene({
                          prompt: `${currentPrompt}, character featuring ${c.name} (${c.appearance_prompt})`.trim(),
                        })
                      }
                    }}
                  >
                    <span>@{c.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
