import React from 'react'
import { FlowScene, FlowAsset, ModelProviderInfo, HardwareGPUInfo } from './types'

interface FlowRightPanelProps {
  scene: FlowScene | null
  providers: ModelProviderInfo[]
  selectedProviderId: string
  gpuInfo: HardwareGPUInfo | null
  assets: FlowAsset[]
  onSelectProvider: (providerId: string) => void
  onUpdateScene: (patch: Partial<FlowScene>) => void
  onOpenVersions: () => void
}

export const FlowRightPanel: React.FC<FlowRightPanelProps> = ({
  scene,
  providers,
  selectedProviderId,
  gpuInfo,
  assets,
  onSelectProvider,
  onUpdateScene,
  onOpenVersions,
}) => {
  const currentProvider = providers.find((p) => p.provider_id === selectedProviderId) || providers[0]

  return (
    <aside className="flow-right-panel">
      {/* Provider Selector Section */}
      <div className="panel-section">
        <div className="panel-section-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>MODEL PROVIDER &amp; HARDWARE</span>
        </div>

        <select
          className="flow-select-full"
          value={selectedProviderId}
          onChange={(e) => onSelectProvider(e.target.value)}
        >
          {providers.map((p) => (
            <option key={p.provider_id} value={p.provider_id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Hardware & Provider Status Box */}
        <div className="provider-status-box">
          <div className="status-row">
            <span className="status-label">Runtime Status:</span>
            <span className={`status-pill ${currentProvider?.availability?.available ? 'online' : 'fallback'}`}>
              {currentProvider?.availability?.status || 'Active'}
            </span>
          </div>

          <div className="status-row">
            <span className="status-label">Dedicated GPU:</span>
            <span className="status-val">{gpuInfo?.device_name || 'NVIDIA RTX 3050 6GB'}</span>
          </div>

          <div className="status-row">
            <span className="status-label">Safe 6GB Ceiling:</span>
            <span className="status-val">512×512 • 4s–8s per clip</span>
          </div>

          {currentProvider?.incompatibility_reason && (
            <div className="provider-warning-box">
              {currentProvider.incompatibility_reason}
            </div>
          )}
        </div>

        {/* Capability Badges */}
        <div className="capabilities-tags-list">
          <span className={`cap-tag ${currentProvider?.capabilities?.text_to_video ? 'supported' : 'unsupported'}`}>
            Text-to-Video
          </span>
          <span className={`cap-tag ${currentProvider?.capabilities?.image_to_video ? 'supported' : 'unsupported'}`}>
            Keyframe Motion
          </span>
          <span className={`cap-tag ${currentProvider?.capabilities?.video_extension ? 'supported' : 'unsupported'}`}>
            Clip Extension
          </span>
          <span className={`cap-tag ${currentProvider?.capabilities?.native_camera_control ? 'supported' : 'unsupported'}`}>
            Camera Guidance
          </span>
        </div>
      </div>

      {/* Audio & Sound Design */}
      <div className="panel-section">
        <div className="panel-section-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>AUDIO &amp; SOUND DESIGN</span>
        </div>

        <div className="panel-control-group">
          <label className="field-caption">Scene Subtitle &amp; Narration Text</label>
          <textarea
            rows={2}
            className="flow-textarea-compact"
            placeholder="Voiceover script or subtitles for this scene..."
            value={scene?.subtitle_text || ''}
            onChange={(e) => onUpdateScene({ subtitle_text: e.target.value })}
          />
        </div>

        <div className="panel-control-group">
          <label className="field-caption">Scene Transition</label>
          <select
            className="flow-select-full"
            value={scene?.transition_type || 'cut'}
            onChange={(e) => onUpdateScene({ transition_type: e.target.value })}
          >
            <option value="cut">Direct Cut</option>
            <option value="crossfade">Crossfade (0.5s)</option>
            <option value="dissolve">Dissolve (1.0s)</option>
          </select>
        </div>
      </div>

      {/* Version Stack & Provenance */}
      <div className="panel-section">
        <div className="panel-section-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>VERSION HISTORY &amp; STACK</span>
        </div>

        <div className="version-info-box">
          <div className="version-status-text">
            All rendered iterations are permanently preserved.
          </div>
          <button type="button" className="btn-open-versions-panel" onClick={onOpenVersions}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>Compare &amp; Restore Versions ({scene?.versions_count || 1})</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
