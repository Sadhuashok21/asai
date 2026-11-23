import React, { useState, useEffect } from 'react'
import { getSceneVersions, restoreVersion } from './flowApi'
import { FlowScene, FlowVideoVersion } from './types'

interface FlowVersionHistoryModalProps {
  scene: FlowScene | null
  onClose: () => void
  onVersionRestored: (updatedScene: FlowScene) => void
}

export const FlowVersionHistoryModal: React.FC<FlowVersionHistoryModalProps> = ({
  scene,
  onClose,
  onVersionRestored,
}) => {
  const [versions, setVersions] = useState<FlowVideoVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!scene) return
    setLoading(true)
    getSceneVersions(scene.id)
      .then((data) => setVersions(data || []))
      .catch((err) => setError(err.message || 'Failed to load version history.'))
      .finally(() => setLoading(false))
  }, [scene])

  const handleRestore = async (version: FlowVideoVersion) => {
    if (!scene) return
    setRestoringId(version.id)
    setError(null)

    try {
      const updated = await restoreVersion(scene.id, version.id)
      onVersionRestored(updated)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to restore this version.')
    } finally {
      setRestoringId(null)
    }
  }

  const formatTimestamp = (iso: string): string => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return iso
    }
  }

  return (
    <div className="flow-modal-backdrop" onClick={onClose}>
      <div className="flow-modal-dialog version-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flow-modal-header">
          <div className="flow-modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="modal-title-icon">
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <h2>Scene Version History & Asset Stack</h2>
          </div>
          <button type="button" className="flow-modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flow-modal-body">
          <p className="flow-version-intro">
            Every generation iteration creates a non-destructive version snapshot in your asset stack. You can preview and switch back to any past generation at any time.
          </p>

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

          {loading ? (
            <div className="flow-loading-state">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span>Loading version history...</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="flow-empty-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 14 14" />
              </svg>
              <p>No prior versions found for this scene. Every new clip generation will be recorded here.</p>
            </div>
          ) : (
            <div className="flow-version-list">
              {versions.map((v) => {
                const isCurrent = scene?.video_url === v.video_url
                const isBusy = restoringId === v.id

                return (
                  <div key={v.id} className={`flow-version-card ${isCurrent ? 'current-active' : ''}`}>
                    <div className="flow-version-media">
                      {v.video_url ? (
                        <video
                          src={v.video_url}
                          controls
                          preload="metadata"
                          className="flow-version-thumb"
                        />
                      ) : (
                        <div className="flow-version-placeholder">No video file</div>
                      )}
                    </div>

                    <div className="flow-version-meta">
                      <div className="flow-version-top">
                        <span className="flow-version-num">v{v.version_number}</span>
                        <span className="flow-version-time">{formatTimestamp(v.created_at)}</span>
                        {isCurrent && <span className="flow-badge current">Current Active</span>}
                      </div>

                      <p className="flow-version-prompt">{v.prompt}</p>

                      <div className="flow-version-tags">
                        <span className="flow-dir-badge">Model: {v.provider}</span>
                        {v.seed !== undefined && <span className="flow-dir-badge">Seed: {v.seed}</span>}
                      </div>

                      <div className="flow-version-actions">
                        {!isCurrent && (
                          <button
                            type="button"
                            className="flow-btn-restore"
                            onClick={() => handleRestore(v)}
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <span>Restoring...</span>
                            ) : (
                              <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="1 4 1 10 7 10" />
                                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                </svg>
                                <span>Restore this Version</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flow-modal-footer">
          <button type="button" className="flow-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
