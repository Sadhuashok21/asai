export interface FlowCharacter {
  character_id: string
  name: string
  appearance_prompt: string
  clothing_prompt: string
  physical_attributes: Record<string, any>
  reference_image_url?: string
  voice_ref?: string
  created_at?: string
}

export interface FlowAsset {
  asset_id: string
  asset_type:
    | 'character_ref'
    | 'location_ref'
    | 'style_ref'
    | 'lighting_ref'
    | 'first_frame'
    | 'last_frame'
    | 'video_clip'
    | 'audio'
  name: string
  description?: string
  file_url: string
  file_size_bytes?: number
  mime_type?: string
  created_at?: string
}

export interface FlowVideoVersion {
  version_id: string
  version_number: number
  prompt: string
  model_used: string
  output_url: string
  duration_seconds: number
  is_active: boolean
  created_at: string
}

export interface FlowScene {
  scene_id: string
  order: number
  title: string
  description: string
  prompt: string
  negative_prompt?: string
  characters?: string[]
  characters_detail?: FlowCharacter[]
  camera_framing: string
  camera_movement: string
  visual_style: string
  lighting: string
  environment: string
  starting_frame_url?: string
  ending_frame_url?: string
  active_clip_url?: string
  duration_seconds: number
  timeline_position_ms: number
  audio_track_url?: string
  subtitle_text: string
  transition_type: string
  versions_count?: number
  created_at?: string
  updated_at?: string
}

export interface FlowProject {
  project_id: string
  name: string
  description: string
  thumbnail?: string
  aspect_ratio: '16:9' | '9:16' | '1:1' | '2.39:1'
  target_resolution: '512p' | '720p' | '1080p'
  frame_rate: number
  default_style: string
  auto_save_data?: Record<string, any>
  scenes?: FlowScene[]
  scenes_count?: number
  assets_count?: number
  characters_count?: number
  created_at?: string
  updated_at?: string
}

export interface FlowJob {
  job_id: string
  project_id?: string
  scene_id?: string
  provider_name: string
  mode: 'text_to_video' | 'image_to_video' | 'frames_to_video' | 'video_edit' | 'video_extend'
  prompt: string
  status:
    | 'PENDING'
    | 'QUEUED'
    | 'VALIDATING'
    | 'PREPARING'
    | 'GENERATING'
    | 'PROCESSING'
    | 'ASSEMBLING'
    | 'RENDERING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
  progress: number
  current_stage: string
  error_details?: string
  vram_allocated_mb?: number
  result_video_url?: string
  created_at: string
  completed_at?: string
}

export interface FlowExport {
  export_id: string
  project_id: string
  project_name: string
  format: string
  resolution: string
  frame_rate: number
  duration_seconds: number
  has_audio: boolean
  has_burned_subtitles: boolean
  output_video_url?: string
  status: 'PENDING' | 'RENDERING' | 'COMPLETED' | 'FAILED'
  progress: number
  error_message?: string
  created_at: string
  completed_at?: string
}

export interface ModelProviderInfo {
  provider_id: string
  name: string
  capabilities: {
    text_to_video: boolean
    image_to_video: boolean
    first_last_frame: boolean
    video_extension: boolean
    video_to_video_edit: boolean
    character_reference: boolean
    native_camera_control: boolean | string
    supported_aspect_ratios: string[]
    supported_resolutions: string[]
    max_duration_seconds: number
    min_vram_mb: number
    is_offline_capable: boolean
  }
  availability: {
    available: boolean
    status: string
    details: string
    vram_free_mb: number
  }
  is_hardware_compatible: boolean
  incompatibility_reason?: string
  hardware_profile?: {
    vram_headroom_mb: number
    recommended_resolution: string
  }
}

export interface HardwareGPUInfo {
  cuda_available: boolean
  device_name: string
  total_vram_mb: number
  free_vram_mb: number
  hardware_tier: string
  recommended_max_res: string
  safe_duration_sec: number
}
