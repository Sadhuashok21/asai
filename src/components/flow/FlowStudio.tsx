import React, { useState, useEffect, useRef } from 'react'
import {
  fetchFlowProjects,
  fetchFlowProject,
  createFlowProject,
  updateFlowProject,
  fetchModelCapabilities,
  generateSceneVideo,
  getJobStatus,
  createScene,
  updateScene,
  deleteScene,
} from './flowApi'
import {
  FlowProject,
  FlowScene,
  ModelProviderInfo,
  HardwareGPUInfo,
  FlowJob,
} from './types'
import { FlowSidebar } from './FlowSidebar'
import { FlowCenterWorkspace } from './FlowCenterWorkspace'
import { FlowRightPanel } from './FlowRightPanel'
import { FlowTimeline } from './FlowTimeline'
import { FlowStoryboardBuilder } from './FlowStoryboardBuilder'
import { FlowAssistantModal } from './FlowAssistantModal'
import { FlowExportModal } from './FlowExportModal'
import { FlowVersionHistoryModal } from './FlowVersionHistoryModal'

export const FlowStudio: React.FC = () => {
  const [projects, setProjects] = useState<FlowProject[]>([])
  const [currentProject, setCurrentProject] = useState<FlowProject | null>(null)
  const [scenes, setScenes] = useState<FlowScene[]>([])
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0)
  const [activeSidebarTab, setActiveSidebarTab] = useState<'scenes' | 'storyboard' | 'characters' | 'assets' | 'settings'>('scenes')

  // Capabilities & Hardware
  const [providers, setProviders] = useState<ModelProviderInfo[]>([])
  const [hardwareInfo, setHardwareInfo] = useState<HardwareGPUInfo | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string>('comfyui_animatediff')

  // Generation Job State
  const [activeJob, setActiveJob] = useState<FlowJob | null>(null)
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null)

  // Timeline & Playhead
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playheadTime, setPlayheadTime] = useState<number>(0)

  // Modals
  const [showAssistantModal, setShowAssistantModal] = useState<boolean>(false)
  const [showExportModal, setShowExportModal] = useState<boolean>(false)
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState<boolean>(false)

  // Playback timer ref
  const playbackTimerRef = useRef<any>(null)

  // 1. Initial Load: Capabilities & Projects
  useEffect(() => {
    fetchModelCapabilities()
      .then((data) => {
        setProviders(data.providers || [])
        setHardwareInfo(data.hardware || null)
        if (data.providers && data.providers.length > 0) {
          const defaultProv = data.providers.find((p) => p.is_available) || data.providers[0]
          setSelectedProviderId(defaultProv.id || defaultProv.provider_id)
        }
      })
      .catch((err) => console.warn('Could not load Flow model capabilities:', err))

    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const list = await fetchFlowProjects()
      setProjects(list)
      if (list.length > 0) {
        const firstId = list[0].project_id || (list[0] as any).id
        selectProject(firstId)
      } else {
        const initial = await createFlowProject({
          title: 'My First AI Film',
          description: 'Created with ASAI Flow Filmmaking Studio',
          aspect_ratio: '16:9',
        })
        setProjects([initial])
        selectProject(initial.project_id || (initial as any).id)
      }
    } catch (err) {
      console.warn('Failed to fetch Flow projects:', err)
    }
  }

  const selectProject = async (projectId: string) => {
    if (!projectId) return
    try {
      const full = await fetchFlowProject(projectId)
      setCurrentProject(full)
      setScenes(full.scenes || [])
      setActiveSceneIndex(0)
      setPlayheadTime(0)
      setIsPlaying(false)
    } catch (err) {
      console.warn('Failed to load project details:', err)
    }
  }

  const handleCreateProject = async (data: { title: string; description?: string; aspect_ratio?: string }) => {
    try {
      const created = await createFlowProject(data)
      setProjects((prev) => [created, ...prev])
      selectProject(created.project_id || (created as any).id)
    } catch (err: any) {
      alert(`Could not create project: ${err.message}`)
    }
  }

  // 2. Scene Management
  const activeScene = scenes[activeSceneIndex] || null

  const handleUpdateActiveScene = (fields: Partial<FlowScene>) => {
    if (!activeScene) return
    const updated = { ...activeScene, ...fields }
    const nextScenes = [...scenes]
    nextScenes[activeSceneIndex] = updated
    setScenes(nextScenes)

    const sceneId = activeScene.scene_id || (activeScene as any).id
    if (sceneId) {
      updateScene(sceneId, fields).catch((err) =>
        console.warn('Failed to auto-save scene:', err)
      )
    }
  }

  const handleAddScene = async () => {
    if (!currentProject) return
    const pid = currentProject.project_id || (currentProject as any).id
    try {
      const created = await createScene(pid, {
        prompt: 'New cinematic scene prompt...',
        camera_framing: 'Medium shot',
        camera_movement: 'Static',
        duration_seconds: 4,
        sequence_order: scenes.length,
      })
      const nextScenes = [...scenes, created]
      setScenes(nextScenes)
      setActiveSceneIndex(nextScenes.length - 1)
    } catch (err: any) {
      alert(`Could not add scene: ${err.message}`)
    }
  }

  const handleDeleteScene = async (sceneId: string) => {
    try {
      await deleteScene(sceneId)
      const nextScenes = scenes.filter((s) => (s.scene_id || (s as any).id) !== sceneId)
      setScenes(nextScenes)
      if (activeSceneIndex >= nextScenes.length) {
        setActiveSceneIndex(Math.max(0, nextScenes.length - 1))
      }
    } catch (err: any) {
      alert(`Could not delete scene: ${err.message}`)
    }
  }

  // 3. Scene Video Generation Trigger
  const handleGenerateActiveScene = async () => {
    if (!activeScene) return
    if (!activeScene.prompt?.trim()) {
      alert('Scene prompt cannot be empty.')
      return
    }

    const sceneId = activeScene.scene_id || (activeScene as any).id
    setGeneratingSceneId(sceneId)

    try {
      const job = await generateSceneVideo(sceneId, {
        provider_id: selectedProviderId,
        prompt: activeScene.prompt,
        negative_prompt: '',
        duration_seconds: activeScene.duration_seconds || 4,
        camera_movement: activeScene.camera_movement || 'Static',
        first_frame_url: activeScene.first_frame_url || activeScene.starting_frame_url,
      })
      setActiveJob(job)
    } catch (err: any) {
      alert(`Generation failed: ${err.message}`)
      setGeneratingSceneId(null)
    }
  }

  // 4. Job Polling Effect
  useEffect(() => {
    let interval: any = null
    if (activeJob && (activeJob.status === 'queued' || activeJob.status === 'running')) {
      interval = setInterval(async () => {
        try {
          const updated = await getJobStatus(activeJob.id)
          setActiveJob(updated)
          if (updated.status === 'completed' || updated.status === 'failed') {
            setGeneratingSceneId(null)
            if (updated.status === 'completed' && currentProject) {
              // Refresh scenes to get the rendered video URL
              const full = await fetchFlowProject(currentProject.id)
              setScenes(full.scenes || [])
            }
          }
        } catch {
          // Keep polling
        }
      }, 1500)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeJob, currentProject])

  // 5. Timeline Playhead Scrubber Logic
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration_seconds || 4), 0)

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev)
  }

  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setPlayheadTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.1
        })
      }, 100)
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)
    }
  }, [isPlaying, totalDuration])

  return (
    <div className="flow-studio-container">
      {/* 1. Main Workstation Body: Left Sidebar + Center Workspace + Right Inspector */}
      <div className="flow-workstation-main">
        {/* Left Sidebar Navigation */}
        <FlowSidebar
          activeProject={currentProject}
          projects={projects}
          onSelectProject={(p) => selectProject(p.project_id || (p as any).id)}
          onNewProject={() => handleCreateProject({ title: 'New Film Project', aspect_ratio: '16:9' })}
          activeTab={activeSidebarTab}
          onSelectTab={setActiveSidebarTab}
          onUpdateProjectSettings={(patch) => {
            if (currentProject) {
              const pid = currentProject.project_id || (currentProject as any).id
              setCurrentProject({ ...currentProject, ...patch })
              updateFlowProject(pid, patch).catch(console.warn)
            }
          }}
        />

        {/* Center Workspace */}
        <div className="flow-workspace-center-wrapper">
          {activeSidebarTab === 'storyboard' ? (
            <FlowStoryboardBuilder
              scenes={scenes}
              activeSceneIndex={activeSceneIndex}
              onSelectScene={(idx) => {
                setActiveSceneIndex(idx)
                setActiveSidebarTab('scenes')
              }}
              onAddScene={handleAddScene}
              onGenerateScene={(sc) => {
                const targetIdx = scenes.findIndex(
                  (s) => (s.scene_id || (s as any).id) === (sc.scene_id || (sc as any).id)
                )
                if (targetIdx >= 0) {
                  setActiveSceneIndex(targetIdx)
                  handleGenerateActiveScene()
                }
              }}
              onDeleteScene={handleDeleteScene}
              isGeneratingSceneId={generatingSceneId}
            />
          ) : (
            <FlowCenterWorkspace
              activeScene={activeScene}
              project={currentProject}
              characters={[]}
              isGenerating={generatingSceneId !== null}
              generationProgress={activeJob?.progress || 0}
              generationStage={activeJob?.stage || 'Preparing model weights...'}
              onUpdateScene={handleUpdateActiveScene}
              onGenerateText={handleGenerateActiveScene}
              onGenerateFrames={() => handleGenerateActiveScene()}
              onExtendClip={() => {
                if (activeScene) {
                  handleUpdateActiveScene({ duration_seconds: (activeScene.duration_seconds || 4) + 4 })
                }
              }}
              onOpenEditModal={() => setShowAssistantModal(true)}
              onOpenAssistantModal={() => setShowAssistantModal(true)}
              onOpenVersionHistory={() => setShowVersionHistoryModal(true)}
            />
          )}
        </div>

        {/* Right Settings Panel */}
        <FlowRightPanel
          scene={activeScene}
          providers={providers}
          selectedProviderId={selectedProviderId}
          gpuInfo={hardwareInfo}
          assets={[]}
          onSelectProvider={setSelectedProviderId}
          onUpdateScene={handleUpdateActiveScene}
          onOpenVersions={() => setShowVersionHistoryModal(true)}
        />
      </div>

      {/* 2. Bottom Multi-Scene Timeline */}
      <FlowTimeline
        scenes={scenes}
        activeSceneIndex={activeSceneIndex}
        onSelectScene={setActiveSceneIndex}
        onAddScene={handleAddScene}
        onDeleteScene={handleDeleteScene}
        onOpenExportModal={() => setShowExportModal(true)}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        playheadTime={playheadTime}
        onSeek={setPlayheadTime}
        isGenerating={generatingSceneId !== null}
      />

      {/* 5. Modals */}
      {showAssistantModal && (
        <FlowAssistantModal
          project={currentProject}
          onClose={() => setShowAssistantModal(false)}
          onScenesAdded={(newScenes) => {
            setScenes((prev) => [...prev, ...newScenes])
            setActiveSceneIndex(scenes.length)
          }}
        />
      )}

      {showExportModal && (
        <FlowExportModal
          project={currentProject}
          hardwareInfo={hardwareInfo}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showVersionHistoryModal && activeScene && (
        <FlowVersionHistoryModal
          scene={activeScene}
          onClose={() => setShowVersionHistoryModal(false)}
          onVersionRestored={(updatedScene) => {
            const next = [...scenes]
            next[activeSceneIndex] = updatedScene
            setScenes(next)
          }}
        />
      )}
    </div>
  )
}
export default FlowStudio
