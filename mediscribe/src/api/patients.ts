import { apiClient } from './client'
import type { Patient, CreatePatientPayload, PaginatedResponse, QueryParams } from '@/types'

export const patientsApi = {
  list: (params: QueryParams = {}) =>
    apiClient.get<PaginatedResponse<Patient>>('/patients', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Patient>(`/patients/${id}`).then((r) => r.data),

  create: (data: CreatePatientPayload) =>
    apiClient.post<Patient>('/patients', data).then((r) => r.data),

  update: (id: string, data: Partial<Patient>) =>
    apiClient.put<{ patient_id: string; updated_at: string }>(`/patients/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/patients/${id}`).then((r) => r.data),
}
