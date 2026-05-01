import { apiClient } from './client'
import type { AIAnalysis } from '@/types'

export const analysisApi = {
  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    apiClient.post('/ai/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<AIAnalysis>(`/ai/analysis/${id}`).then((r) => r.data),

  approve: (id: string, reportId?: string) =>
    apiClient.post(`/ai/analysis/${id}/approve`, { report_id: reportId }).then((r) => r.data),

  list: (params = {}) =>
    apiClient.get('/ai/analysis', { params }).then((r) => r.data),
}
