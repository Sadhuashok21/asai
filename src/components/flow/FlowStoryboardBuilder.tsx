import React from 'react'
import { FlowScene } from './types'

interface FlowStoryboardBuilderProps {
  scenes: FlowScene[]
  activeSceneIndex: number
  onSelectScene: (index: number) => void
  onAddScene: () => void
  onGenerateScene: (scene: FlowScene) => void
  onDeleteScene: (sceneId: string) => void
  isGeneratingSceneId?: string | null
}

export const FlowStoryboardBuilder: React.FC<FlowStoryboardBuilderProps> = ({
  scenes,
  activeSceneIndex,
  onSelectScene,
  onAddScene,
  onGenerateScene,
  onDeleteScene,
  isGeneratingSceneId,
}) => {
  return (
    <div className="flow-storyboard-container">
      <div className="flow-storyboard-header">
        <div className="flow-storyboard-title-group">
          <h2>Film Storyboard</h2>
          <p>Organize, review, and direct each individual scene card of your narrative sequence.</p>
        </div>
        <button
          type="button"
          className="flow-btn-secondary"
          onClick={onAddScene}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Add Storyboard Scene</span>
        </button>
      </div>

      <div className="flow-storyboard-grid">
        {scenes.map((scene, idx) => {
          const isActive = idx === activeSceneIndex
          const isBusy = isGeneratingSceneId === scene.id

          return (
            <div
              key={scene.id}
              className={`flow-storyboard-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectScene(idx)}
            >
              <div className="flow-card-top-bar">
                <span className="flow-scene-number">Scene #{idx + 1}</span>
                <div className="flow-card-actions">
                  <span className="flow-card-duration">{scene.duration_seconds || 4}s</span>
                  {scenes.length > 1 && (
                    <button
                      type="button"
                      className="flow-icon-btn danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteScene(scene.id)
                      }}
                      title="Remove scene"
                      aria-label="Remove scene"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Preview / Canvas */}
              <div className="flow-card-media-canvas">
                {scene.video_url ? (
                  <video
                    src={scene.video_url}
                    className="flow-card-video"
                    controls
                    preload="metadata"
                  />
                ) : scene.first_frame_url ? (
                  <img
                    src={scene.first_frame_url}
                    alt={`Scene ${idx + 1} Keyframe`}
                    className="flow-card-image"
                  />
                ) : (
                  <div className="flow-card-no-media">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                      <line x1="7" y1="2" x2="7" y2="22" />
                      <line x1="17" y1="2" x2="17" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <line x1="2" y1="7" x2="7" y2="7" />
                      <line x1="2" y1="17" x2="7" y2="17" />
                      <line x1="17" y1="17" x2="22" y2="17" />
                      <line x1="17" y1="7" x2="22" y2="7" />
                    </svg>
                    <span>No clip generated yet</span>
                  </div>
                )}

                {isBusy && (
                  <div className="flow-card-generating-overlay">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span>Generating Video...</span>
                  </div>
                )}
              </div>

              {/* Storyboard Content & Prompt */}
              <div className="flow-card-body">
                <div className="flow-card-prompt-label">Visual Direction & Prompt:</div>
                <p className="flow-card-prompt-text">{scene.prompt || 'Click to edit scene visual prompt...'}</p>

                {scene.narration && (
                  <div className="flow-card-narration-box">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>"{scene.narration}"</span>
                  </div>
                )}

                {/* Director Badges */}
                <div className="flow-card-badges">
                  <span className="flow-dir-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    {scene.camera_framing || 'Medium shot'}
                  </span>
                  <span className="flow-dir-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    {scene.camera_movement || 'Static'}
                  </span>
                  <span className="flow-dir-badge transition">
                    {scene.transition_in || 'Cut'}
                  </span>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="flow-card-footer">
                <button
                  type="button"
                  className="flow-btn-card-generate"
                  onClick={(e) => {
                    e.stopPropagation()
                    onGenerateScene(scene)
                  }}
                  disabled={isBusy}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{scene.video_url ? 'Regenerate Scene' : 'Generate Clip'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
