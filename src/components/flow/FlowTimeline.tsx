import React, { useState, useRef, useEffect } from 'react'
import { FlowScene } from './types'

interface FlowTimelineProps {
  scenes: FlowScene[]
  activeSceneIndex: number
  onSelectScene: (index: number) => void
  onAddScene: () => void
  onDeleteScene: (sceneId: string) => void
  onOpenExportModal: () => void
  isPlaying: boolean
  onTogglePlay: () => void
  playheadTime: number
  onSeek: (time: number) => void
  isGenerating?: boolean
}

export const FlowTimeline: React.FC<FlowTimelineProps> = ({
  scenes,
  activeSceneIndex,
  onSelectScene,
  onAddScene,
  onDeleteScene,
  onOpenExportModal,
  isPlaying,
  onTogglePlay,
  playheadTime,
  onSeek,
  isGenerating = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration_seconds || 4), 0)

  // Calculate cumulative start time for each scene
  const sceneTimeOffsets = scenes.reduce<number[]>((acc, s, idx) => {
    if (idx === 0) return [0]
    return [...acc, acc[idx - 1] + (scenes[idx - 1].duration_seconds || 4)]
  }, [])

  const formatSeconds = (sec: number): string => {
    const mins = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    const ms = Math.floor((sec % 1) * 10)
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`
  }

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || totalDuration === 0) return
    const rect = trackRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const fraction = Math.max(0, Math.min(1, clickX / rect.width))
    onSeek(fraction * totalDuration)
  }

  return (
    <div className="flow-timeline-container">
      {/* Timeline Controls Header */}
      <div className="flow-timeline-header">
        <div className="flow-timeline-controls-left">
          <button
            type="button"
            className="flow-playback-btn"
            onClick={onTogglePlay}
            disabled={scenes.length === 0}
            title={isPlaying ? 'Pause film preview' : 'Play film preview'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <div className="flow-timecode-display">
            <span className="flow-current-time">{formatSeconds(playheadTime)}</span>
            <span className="flow-time-separator">/</span>
            <span className="flow-total-time">{formatSeconds(totalDuration)}</span>
          </div>

          <div className="flow-timeline-stats">
            <span className="flow-badge scenes-count">{scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'}</span>
            {isGenerating && (
              <span className="flow-badge generating">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Rendering...
              </span>
            )}
          </div>
        </div>

        <div className="flow-timeline-controls-right">
          <button
            type="button"
            className="flow-btn-secondary"
            onClick={onAddScene}
            title="Add a new scene block to the timeline"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Add Scene</span>
          </button>

          <button
            type="button"
            className="flow-btn-export"
            onClick={onOpenExportModal}
            disabled={scenes.length === 0}
            title="Render and export full film as MP4"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export Film</span>
          </button>
        </div>
      </div>

      {/* Scrubber / Playhead Track */}
      <div className="flow-scrubber-bar" ref={trackRef} onClick={handleTrackClick}>
        <div
          className="flow-scrubber-progress"
          style={{ width: `${totalDuration > 0 ? (playheadTime / totalDuration) * 100 : 0}%` }}
        />
        <div
          className="flow-playhead-indicator"
          style={{ left: `${totalDuration > 0 ? (playheadTime / totalDuration) * 100 : 0}%` }}
        />
      </div>

      {/* Multi-Scene Timeline Blocks */}
      <div className="flow-timeline-track">
        {scenes.length === 0 ? (
          <div className="flow-timeline-empty" onClick={onAddScene}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span>Your timeline is empty. Click to add your first scene.</span>
          </div>
        ) : (
          <div className="flow-scene-blocks-list">
            {scenes.map((scene, index) => {
              const isActive = index === activeSceneIndex
              const duration = scene.duration_seconds || 4
              const widthWeight = Math.max(160, Math.min(320, duration * 45))

              return (
                <div
                  key={scene.id}
                  className={`flow-scene-block ${isActive ? 'active' : ''} ${scene.video_url ? 'has-video' : 'draft'}`}
                  style={{ minWidth: `${widthWeight}px` }}
                  onClick={() => onSelectScene(index)}
                >
                  <div className="flow-scene-block-header">
                    <span className="flow-scene-idx">Scene {index + 1}</span>
                    <span className="flow-scene-duration">{duration}s</span>
                    {scenes.length > 1 && (
                      <button
                        type="button"
                        className="flow-scene-del-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteScene(scene.id)
                        }}
                        title="Delete scene"
                        aria-label="Delete scene"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flow-scene-block-preview">
                    {scene.video_url ? (
                      <video
                        src={scene.video_url}
                        className="flow-scene-mini-thumb"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : scene.first_frame_url ? (
                      <img
                        src={scene.first_frame_url}
                        alt={`Scene ${index + 1}`}
                        className="flow-scene-mini-thumb"
                      />
                    ) : (
                      <div className="flow-scene-placeholder-thumb">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                          <line x1="7" y1="2" x2="7" y2="22" />
                          <line x1="17" y1="2" x2="17" y2="22" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <line x1="2" y1="7" x2="7" y2="7" />
                          <line x1="2" y1="17" x2="7" y2="17" />
                          <line x1="17" y1="17" x2="22" y2="17" />
                          <line x1="17" y1="7" x2="22" y2="7" />
                        </svg>
                        <span>Prompt only</span>
                      </div>
                    )}
                  </div>

                  <div className="flow-scene-block-meta">
                    <p className="flow-scene-prompt-snippet" title={scene.prompt}>
                      {scene.prompt || 'Untitled scene prompt'}
                    </p>
                    <div className="flow-scene-tags">
                      {scene.camera_movement && scene.camera_movement !== 'static' && (
                        <span className="flow-camera-pill">{scene.camera_movement}</span>
                      )}
                      {scene.transition_in && scene.transition_in !== 'cut' && (
                        <span className="flow-transition-pill">{scene.transition_in}</span>
                      )}
                    </div>
                  </div>

                  {/* Transition indicator between scenes */}
                  {index < scenes.length - 1 && (
                    <div className="flow-scene-transition-node" title={`Transition: ${scenes[index + 1].transition_in || 'cut'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 4 15 12 5 20 5 4" />
                        <line x1="19" y1="5" x2="19" y2="19" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Audio Waveform Track Representation */}
      <div className="flow-audio-waveform-track">
        <div className="flow-audio-track-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>Audio Master</span>
        </div>
        <div className="flow-audio-bars">
          {Array.from({ length: 48 }).map((_, i) => {
            const height = 15 + Math.sin(i * 0.45) * 12 + ((i % 5) * 4)
            return (
              <span
                key={i}
                className="flow-waveform-bar"
                style={{ height: `${height}px` }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
