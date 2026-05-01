import toast from 'react-hot-toast'
import Badge from '@/components/shared/Badge'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api/audit'
import { format } from 'date-fns'

export default function AuditPage() {
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => auditApi.list({ limit: 50 }),
  })

  const handleExport = async () => {
    toast.loading('Exporting audit log...', { id: 'export' })
    try {
      const blob = await auditApi.exportCsv()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit_log_${format(new Date(), 'yyyyMMdd')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      toast.success('Audit log exported!', { id: 'export' })
    } catch (err) {
      toast.error('Export failed', { id: 'export' })
    }
  }

  const events = auditData?.data || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Full HIPAA-compliant audit log · AES-256 encrypted · Tamper-proof</div>
        <button className="btn btn-sm" onClick={handleExport}>⬇ Export CSV</button>
      </div>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Timestamp', 'User ID', 'Action', 'Resource', 'IP Address', 'Status'].map((h) => (
                  <th key={h} style={{ background: 'var(--surface-2)', padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center' }}>Loading audit logs...</td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)' }}>No audit events found</td>
                </tr>
              ) : events.map((e: any) => (
                <tr key={e.id}>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {format(new Date(e.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>{e.user_id.substring(0,8)}...</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 12, color: 'var(--teal)' }}>{e.action}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-2)' }}>{e.resource}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' }}>{e.ip_address}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                    <Badge variant={e.status === 'success' ? 'green' : e.status === 'failed' ? 'red' : 'blue'}>
                      {e.status === 'success' ? 'Success' : e.status === 'failed' ? 'Failed' : 'Info'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
