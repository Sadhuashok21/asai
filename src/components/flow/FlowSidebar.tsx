import React from 'react'
import { FlowProject } from './types'

interface FlowSidebarProps {
  projects: FlowProject[]
  activeProject: FlowProject | null
  activeTab: 'scenes' | 'storyboard' | 'characters' | 'assets' | 'settings' | string
  onSelectProject: (project: FlowProject) => void
  onNewProject: () => void
  onSelectTab: (tab: any) => void
  onUpdateProjectSettings: (patch: Partial<FlowProject>) => void
}

export const FlowSidebar: React.FC<FlowSidebarProps> = ({
  projects,
  activeProject,
  activeTab,
  onSelectProject,
  onNewProject,
  onSelectTab,
  onUpdateProjectSettings,
}) => {
  return (
    <aside className="flow-sidebar">
      {/* Top Brand & New Project */}
      <div className="flow-sidebar-header">
        <div className="flow-brand-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="m9 8 7 4-7 4Z" />
          </svg>
          <span>ASAI FLOW</span>
        </div>
        <button type="button" className="flow-btn-new-project" onClick={onNewProject} title="Create New Film Project">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Project</span>
        </button>
      </div>

      {/* Project Selector */}
      <div className="flow-project-selector-wrap">
        <label className="flow-nav-heading">ACTIVE PROJECT</label>
        <select
          className="flow-project-dropdown"
          value={activeProject?.project_id || (activeProject as any)?.id || ''}
          onChange={(e) => {
            const found = projects.find((p) => (p.project_id || (p as any).id) === e.target.value)
            if (found) onSelectProject(found)
          }}
        >
          {projects.map((p) => {
            const pid = p.project_id || (p as any).id
            return (
              <option key={pid} value={pid}>
                {p.name} ({p.aspect_ratio})
              </option>
            )
          })}
        </select>
      </div>

      {/* Navigation Tabs */}
      <nav className="flow-sidebar-nav">
        <label className="flow-nav-heading">FILM WORKSPACE</label>

        <button
          type="button"
          className={`flow-nav-item ${activeTab === 'scenes' ? 'active' : ''}`}
          onClick={() => onSelectTab('scenes')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          <span>Scene Canvas</span>
        </button>

        <button
          type="button"
          className={`flow-nav-item ${activeTab === 'storyboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('storyboard')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="14" x="3" y="5" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="8" y1="5" x2="8" y2="10" />
            <line x1="16" y1="5" x2="16" y2="10" />
          </svg>
          <span>Storyboard Grid</span>
          <span className="flow-count-badge">{activeProject?.scenes_count || activeProject?.scenes?.length || 0}</span>
        </button>

        <button
          type="button"
          className={`flow-nav-item ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => onSelectTab('characters')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Character Library</span>
          <span className="flow-count-badge">{activeProject?.characters_count || 0}</span>
        </button>

        <button
          type="button"
          className={`flow-nav-item ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => onSelectTab('assets')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <span>Assets &amp; References</span>
          <span className="flow-count-badge">{activeProject?.assets_count || 0}</span>
        </button>

        <button
          type="button"
          className={`flow-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Project Settings</span>
        </button>
      </nav>

      {/* Project Format Settings Panel */}
      <div className="flow-sidebar-settings">
        <label className="flow-nav-heading">FILM FORMAT</label>
        <div className="format-control-row">
          <span>Aspect Ratio</span>
          <select
            value={activeProject?.aspect_ratio || '16:9'}
            onChange={(e) => onUpdateProjectSettings({ aspect_ratio: e.target.value as any })}
          >
            <option value="16:9">16:9 Widescreen</option>
            <option value="9:16">9:16 Vertical Reel</option>
            <option value="1:1">1:1 Square</option>
            <option value="2.39:1">2.39:1 Anamorphic</option>
          </select>
        </div>

        <div className="format-control-row">
          <span>Resolution</span>
          <select
            value={activeProject?.target_resolution || '720p'}
            onChange={(e) => onUpdateProjectSettings({ target_resolution: e.target.value as any })}
          >
            <option value="512p">512p (Fast / Low VRAM)</option>
            <option value="720p">720p HD Cinematic</option>
            <option value="1080p">1080p Full HD</option>
          </select>
        </div>

        <div className="format-control-row">
          <span>Framerate</span>
          <select
            value={activeProject?.frame_rate || 24}
            onChange={(e) => onUpdateProjectSettings({ frame_rate: Number(e.target.value) })}
          >
            <option value={24}>24 fps (Film standard)</option>
            <option value={30}>30 fps (Broadcast)</option>
          </select>
        </div>
      </div>
    </aside>
  )
}
