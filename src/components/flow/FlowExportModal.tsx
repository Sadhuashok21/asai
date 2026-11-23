import React, { useState, useEffect } from 'react'
import { createExport, getExportStatus } from './flowApi'
import { FlowProject, FlowExport, HardwareGPUInfo } from './types'

interface FlowExportModalProps {
  project: FlowProject | null
  hardwareInfo: HardwareGPUInfo | null
  onClose: () => void
}

export const FlowExportModal: React.FC<FlowExportModalProps> = ({
  project,
  hardwareInfo,
  onClose,
}) => {
  const [resolution, setResolution] = useState(hardwareInfo?.safe_max_resolution || '512x512')
  const [fps, setFps] = useState(24)
  const [format, setFormat] = useState('mp4')
  const [includeAudio, setIncludeAudio] = useState(true)
  const [burnSubtitles, setBurnSubtitles] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportJob, setExportJob] = useState<FlowExport | null>(null)

  // Poll export status if active
  useEffect(() => {
    let interval: any = null
    if (exportJob && exportJob.status === 'processing') {
      interval = setInterval(async () => {
        try {
          const updated = await getExportStatus(exportJob.id)
          setExportJob(updated)
          if (updated.status === 'completed' || updated.status === 'failed') {
            setRendering(false)
            if (updated.status === 'failed') {
              setError(updated.error_message || 'Video export failed during rendering.')
            }
          }
        } catch {
          // Retry next tick
        }
      }, 1500)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [exportJob])

  const handleStartExport = async () => {
    if (!project) return

    setRendering(true)
    setError(null)

    try {
      const exp = await createExport(project.id, {
        resolution,
        fps,
        format,
        include_audio: includeAudio,
        burn_subtitles: burnSubtitles,
      })
      setExportJob(exp)
    } catch (err: any) {
      setError(err.message || 'Failed to start video rendering export.')
      setRendering(false)
    }
  }

  return (
    <div className="flow-modal-backdrop" onClick={onClose}>
      <div className="flow-modal-dialog export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flow-modal-header">
          <div className="flow-modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="modal-title-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <h2>Export Film & Render Multi-Scene MP4</h2>
          </div>
          <button type="button" className="flow-modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flow-modal-body">
          {/* Hardware notice for entry GPU */}
          {hardwareInfo?.hardware_tier === 'entry_gpu_6gb' && (
            <div className="flow-info-callout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                <strong>Hardware Acceleration:</strong> Detected {hardwareInfo.device_name || 'NVIDIA RTX 3050'} (6GB VRAM). 512×512 resolution is recommended for optimal rendering performance without VRAM paging.
              </span>
            </div>
          )}

          {!exportJob || exportJob.status === 'failed' ? (
            <>
              <div className="flow-modal-row">
                <div className="flow-field-group flex-1">
                  <label className="flow-label">Output Resolution</label>
                  <select
                    className="flow-select"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    disabled={rendering}
                  >
                    <option value="512x512">512×512 (Standard / Safe 6GB VRAM)</option>
                    <option value="1280x720">1280×720 (720p HD)</option>
                    <option value="1920x1080">1920×1080 (1080p Full HD)</option>
                  </select>
                </div>

                <div className="flow-field-group" style={{ width: '130px' }}>
                  <label className="flow-label">Framerate</label>
                  <select
                    className="flow-select"
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    disabled={rendering}
                  >
                    <option value={24}>24 fps (Cinema)</option>
                    <option value={30}>30 fps (Web)</option>
                    <option value={60}>60 fps (Smooth)</option>
                  </select>
                </div>
              </div>

              <div className="flow-modal-row">
                <div className="flow-field-group flex-1">
                  <label className="flow-label">Container Format</label>
                  <select
                    className="flow-select"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    disabled={rendering}
                  >
                    <option value="mp4">MP4 (H.264 / AAC - Universal)</option>
                    <option value="webm">WebM (VP9 / Opus)</option>
                  </select>
                </div>
              </div>

              <div className="flow-checkbox-list">
                <label className="flow-checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeAudio}
                    onChange={(e) => setIncludeAudio(e.target.checked)}
                    disabled={rendering}
                  />
                  <span>Master and combine multi-scene audio soundtrack & ambient sound</span>
                </label>

                <label className="flow-checkbox-label">
                  <input
                    type="checkbox"
                    checked={burnSubtitles}
                    onChange={(e) => setBurnSubtitles(e.target.checked)}
                    disabled={rendering}
                  />
                  <span>Generate and burn-in cinematic dialogue subtitles</span>
                </label>
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
            </>
          ) : exportJob.status === 'processing' ? (
            <div className="flow-export-rendering-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <h3>Rendering Your Film...</h3>
              <p>FFmpeg is concatenating scenes, applying transitions, and mixing master audio.</p>
              <div className="flow-progress-bar-wrap">
                <div className="flow-progress-bar-fill" style={{ width: `${exportJob.progress || 35}%` }} />
              </div>
              <span className="flow-progress-text">{exportJob.progress || 35}% completed</span>
            </div>
          ) : (
            <div className="flow-export-completed-state">
              <div className="flow-export-success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3>Render Complete!</h3>
              <p>Your film has been successfully compiled and saved to ASAI media storage.</p>

              {exportJob.output_url && (
                <div className="flow-export-preview-player">
                  <video
                    src={exportJob.output_url}
                    controls
                    autoPlay
                    playsInline
                    className="flow-export-video"
                  />
                </div>
              )}

              <div className="flow-export-download-row">
                <a
                  href={exportJob.output_url || '#'}
                  download={`asai_film_${project?.id}.mp4`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flow-btn-primary download"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download MP4 Video</span>
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flow-modal-footer">
          <button
            type="button"
            className="flow-btn-secondary"
            onClick={onClose}
          >
            {exportJob?.status === 'completed' ? 'Close' : 'Cancel'}
          </button>

          {(!exportJob || exportJob.status === 'failed') && (
            <button
              type="button"
              className="flow-btn-primary"
              onClick={handleStartExport}
              disabled={rendering}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Start Rendering</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
