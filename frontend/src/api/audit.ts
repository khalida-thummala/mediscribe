import { apiClient } from './client'

export const auditApi = {
  list: (params = {}) =>
    apiClient.get('/audit', { params }).then((r) => r.data),

  exportCsv: () =>
    apiClient.get('/audit/export', { responseType: 'blob' }).then((r) => r.data),
}
