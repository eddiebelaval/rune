import type { KnowledgeFileType } from '@/types/knowledge'

export interface TextDeltaStreamEvent {
  type: 'text_delta'
  text: string
}

export interface ToolResultStreamEvent {
  type: 'kb_operation'
  id: string
  operationType: 'create' | 'update' | 'activate'
  fileType: KnowledgeFileType
  title: string
  contentPreview: string
  status: 'done' | 'failed'
}

export interface StatusStreamEvent {
  type: 'status'
  phase: 'thinking' | 'tool_use' | 'complete'
  message: string
}

export interface ErrorStreamEvent {
  type: 'error'
  message: string
}

export interface DoneStreamEvent {
  type: 'done'
}

export type RuneStreamEvent =
  | TextDeltaStreamEvent
  | ToolResultStreamEvent
  | StatusStreamEvent
  | ErrorStreamEvent
  | DoneStreamEvent
