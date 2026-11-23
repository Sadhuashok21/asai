import {
  FlowProject,
  FlowScene,
  FlowCharacter,
  FlowAsset,
  FlowJob,
  FlowVideoVersion,
  FlowExport,
  ModelProviderInfo,
  HardwareGPUInfo,
} from './types'

function getEndpoint(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('asai_token') || localStorage.getItem('token') || ''
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// -----------------------------------------------------------------------------
// Capabilities & Hardware
// -----------------------------------------------------------------------------
export async function fetchFlowCapabilities(): Promise<{ gpu: HardwareGPUInfo; providers: ModelProviderInfo[]; hardware?: HardwareGPUInfo }> {
  const res = await fetch(getEndpoint('/api/asai/flow/models/capabilities/'), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch video capabilities')
  const data = await res.json()
  return {
    gpu: data.gpu || data.hardware,
    hardware: data.hardware || data.gpu,
    providers: data.providers || [],
  }
}
export const fetchModelCapabilities = fetchFlowCapabilities

// -----------------------------------------------------------------------------
// Projects
// -----------------------------------------------------------------------------
export async function fetchFlowProjects(): Promise<FlowProject[]> {
  const res = await fetch(getEndpoint('/api/asai/flow/projects/'), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch projects')
  const data = await res.json()
  return data.projects || []
}

export async function createFlowProject(
  nameOrData: string | { title?: string; name?: string; description?: string; aspect_ratio?: string; style?: string },
  aspect_ratio = '16:9',
  style = 'Cinematic'
): Promise<FlowProject> {
  const payload =
    typeof nameOrData === 'string'
      ? { name: nameOrData, title: nameOrData, aspect_ratio, style }
      : {
          name: nameOrData.name || nameOrData.title || 'Untitled Film',
          title: nameOrData.title || nameOrData.name || 'Untitled Film',
          description: nameOrData.description || '',
          aspect_ratio: nameOrData.aspect_ratio || '16:9',
          style: nameOrData.style || 'Cinematic',
        }

  const res = await fetch(getEndpoint('/api/asai/flow/projects/'), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create project')
  const data = await res.json()
  return data.project
}
export const createProject = createFlowProject

export async function fetchFlowProject(projectId: string): Promise<FlowProject> {
  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/`), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to load project')
  const data = await res.json()
  return data.project
}

export async function updateFlowProject(projectId: string, patch: Partial<FlowProject>): Promise<FlowProject> {
  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/`), {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update project')
  const data = await res.json()
  return data.project
}

export async function deleteFlowProject(projectId: string): Promise<void> {
  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete project')
}

// -----------------------------------------------------------------------------
// Scenes
// -----------------------------------------------------------------------------
export async function createFlowScene(projectId: string, data: Partial<FlowScene>): Promise<FlowScene> {
  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/scenes/`), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to add scene')
  const resData = await res.json()
  return resData.scene
}

export async function updateFlowScene(sceneId: string, patch: Partial<FlowScene>): Promise<FlowScene> {
  const res = await fetch(getEndpoint(`/api/asai/flow/scenes/${sceneId}/`), {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update scene')
  const data = await res.json()
  return data.scene
}

export async function deleteFlowScene(sceneId: string): Promise<void> {
  const res = await fetch(getEndpoint(`/api/asai/flow/scenes/${sceneId}/`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete scene')
}

export const createScene = createFlowScene
export const updateScene = updateFlowScene
export const deleteScene = deleteFlowScene

export async function reorderFlowScenes(projectId: string, sceneIds: string[]): Promise<FlowScene[]> {
  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/scenes/reorder/`), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scene_ids: sceneIds }),
  })
  if (!res.ok) throw new Error('Failed to reorder scenes')
  const data = await res.json()
  return data.scenes || []
}

// -----------------------------------------------------------------------------
// Assets & Characters
// -----------------------------------------------------------------------------
export async function uploadFlowAsset(file: File, assetType = 'style_ref', projectId?: string, name?: string): Promise<FlowAsset> {
  const form = new FormData()
  form.append('file', file)
  form.append('asset_type', assetType)
  if (projectId) form.append('project_id', projectId)
  if (name) form.append('name', name)

  const res = await fetch(getEndpoint('/api/asai/flow/assets/upload/'), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: form,
  })
  if (!res.ok) throw new Error('Failed to upload asset')
  const data = await res.json()
  return data.asset
}

export async function fetchFlowAssets(projectId: string): Promise<FlowAsset[]> {
  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/assets/`), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.assets || []
}

export async function fetchFlowCharacters(projectId: string): Promise<FlowCharacter[]> {
  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/characters/`), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.characters || []
}

export async function createFlowCharacter(projectId: string, data: { name: string; appearance_prompt: string; clothing_prompt?: string; reference_image?: File }): Promise<FlowCharacter> {
  const form = new FormData()
  form.append('name', data.name)
  form.append('appearance_prompt', data.appearance_prompt)
  if (data.clothing_prompt) form.append('clothing_prompt', data.clothing_prompt)
  if (data.reference_image) form.append('reference_image', data.reference_image)

  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/characters/`), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: form,
  })
  if (!res.ok) throw new Error('Failed to create character')
  const resData = await res.json()
  return resData.character
}

// -----------------------------------------------------------------------------
// Generation & Jobs
// -----------------------------------------------------------------------------
export async function generateTextToVideo(params: {
  project_id: string
  scene_id?: string
  prompt: string
  negative_prompt?: string
  provider?: string
  camera_framing?: string
  camera_movement?: string
  duration?: number
}): Promise<FlowJob> {
  const res = await fetch(getEndpoint('/api/asai/flow/generate/text/'), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to submit generation job')
  }
  const data = await res.json()
  return data.job
}

export async function generateFramesToVideo(params: {
  project_id: string
  scene_id?: string
  prompt?: string
  camera_movement?: string
  duration?: number
  provider?: string
  starting_frame?: File
}): Promise<FlowJob> {
  const form = new FormData()
  form.append('project_id', params.project_id)
  if (params.scene_id) form.append('scene_id', params.scene_id)
  if (params.prompt) form.append('prompt', params.prompt)
  if (params.camera_movement) form.append('camera_movement', params.camera_movement)
  if (params.duration) form.append('duration', String(params.duration))
  if (params.provider) form.append('provider', params.provider)
  if (params.starting_frame) form.append('starting_frame', params.starting_frame)

  const res = await fetch(getEndpoint('/api/asai/flow/generate/frames/'), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to submit frame generation')
  }
  const data = await res.json()
  return data.job
}

export async function extendFlowClip(sceneId: string, duration = 4.0): Promise<FlowJob> {
  const res = await fetch(getEndpoint('/api/asai/flow/extend/'), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scene_id: sceneId, duration }),
  })
  if (!res.ok) throw new Error('Failed to submit clip extension')
  const data = await res.json()
  return data.job
}

export async function editFlowClip(sceneId: string, instruction: string): Promise<FlowJob> {
  const res = await fetch(getEndpoint('/api/asai/flow/edit/'), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scene_id: sceneId, instruction }),
  })
  if (!res.ok) throw new Error('Failed to submit clip edit')
  const data = await res.json()
  return data.job
}

export async function generateSceneVideo(sceneId: string, options: {
  provider_id?: string
  prompt: string
  negative_prompt?: string
  duration_seconds?: number
  camera_movement?: string
  first_frame_url?: string
}): Promise<FlowJob> {
  const payload = {
    scene_id: sceneId,
    provider: options.provider_id,
    prompt: options.prompt,
    negative_prompt: options.negative_prompt,
    duration: options.duration_seconds || 4,
    camera_movement: options.camera_movement,
    first_frame_url: options.first_frame_url,
  }

  const res = await fetch(getEndpoint('/api/asai/flow/generate/text/'), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to submit scene generation job')
  }
  const data = await res.json()
  return data.job
}

export async function fetchFlowJob(jobId: string): Promise<FlowJob> {
  const res = await fetch(getEndpoint(`/api/asai/flow/jobs/${jobId}/`), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch job status')
  const data = await res.json()
  return data.job
}
export const getJobStatus = fetchFlowJob

export async function cancelFlowJob(jobId: string): Promise<boolean> {
  const res = await fetch(getEndpoint(`/api/asai/flow/jobs/${jobId}/cancel/`), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  return res.ok
}
export const cancelJob = cancelFlowJob

// -----------------------------------------------------------------------------
// Version Stacks
// -----------------------------------------------------------------------------
export async function fetchSceneVersions(sceneId: string): Promise<FlowVideoVersion[]> {
  const res = await fetch(getEndpoint(`/api/asai/flow/scenes/${sceneId}/versions/`), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.versions || []
}
export const getSceneVersions = fetchSceneVersions

export async function restoreSceneVersion(sceneIdOrVersionId: string, versionId?: string): Promise<FlowScene> {
  const targetId = versionId || sceneIdOrVersionId
  const res = await fetch(getEndpoint(`/api/asai/flow/versions/${targetId}/restore/`), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to restore version')
  const data = await res.json()
  return data.scene
}
export const restoreVersion = restoreSceneVersion

// -----------------------------------------------------------------------------
// Exports & AI Assistant
// -----------------------------------------------------------------------------
export async function submitProjectExport(
  projectId: string,
  resolutionOrOptions: string | { resolution?: string; fps?: number; format?: string; include_audio?: boolean; burn_subtitles?: boolean } = '720p',
  fps = 24,
  includeSubtitles = false
): Promise<FlowExport> {
  let bodyPayload: any
  if (typeof resolutionOrOptions === 'object') {
    bodyPayload = {
      resolution: resolutionOrOptions.resolution || '720p',
      fps: resolutionOrOptions.fps || 24,
      format: resolutionOrOptions.format || 'mp4',
      include_audio: resolutionOrOptions.include_audio !== false,
      include_subtitles: resolutionOrOptions.burn_subtitles || false,
    }
  } else {
    bodyPayload = {
      resolution: resolutionOrOptions,
      fps,
      include_subtitles: includeSubtitles,
    }
  }

  const res = await fetch(getEndpoint(`/api/asai/flow/projects/${projectId}/export/`), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(bodyPayload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to submit export')
  }
  const data = await res.json()
  return data.export
}
export const createExport = submitProjectExport

export async function fetchExportJob(exportId: string): Promise<FlowExport> {
  const res = await fetch(getEndpoint(`/api/asai/flow/exports/${exportId}/`), {
    headers: getAuthHeaders(),
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch export')
  const data = await res.json()
  return data.export
}
export const getExportStatus = fetchExportJob

export async function generateAssistantBreakdown(
  promptOrData: string | { brief?: string; prompt?: string; genre?: string; scene_count?: number; aspect_ratio?: string },
  scenesCount = 4
): Promise<any> {
  const payload =
    typeof promptOrData === 'string'
      ? { prompt: promptOrData, scenes_count: scenesCount }
      : {
          prompt: promptOrData.brief || promptOrData.prompt || '',
          genre: promptOrData.genre || 'cinematic_scifi',
          scenes_count: promptOrData.scene_count || 4,
          aspect_ratio: promptOrData.aspect_ratio || '16:9',
        }

  const res = await fetch(getEndpoint('/api/asai/flow/assistant/breakdown/'), {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to generate storyboard breakdown')
  return await res.json()
}
export const breakdownBriefWithAI = generateAssistantBreakdown
