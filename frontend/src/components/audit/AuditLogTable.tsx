import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api/audit'
import { format } from 'date-fns'
import Badge from '@/components/shared/Badge'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuditLogTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.list(),
  })

  // Backend returns { data: events[] } — map id→event_id, created_at→timestamp
  const rawEvents: any[] = (data as any)?.data ?? []
  const events = rawEvents.map((e: any) => ({
    event_id: e.id ?? e.event_id,
    timestamp: e.created_at ?? e.timestamp,
    user_id: e.user_id,
    action: e.action,
    resource: e.resource,
    ip_address: e.ip_address,
    status: e.status,
  }))

  const handleExport = async () => {
    try {
      await auditApi.exportCsv()
      toast.success('Export started')
    } catch {
      toast.error('CSV export not yet available')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-2)', fontWeight: 500 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)' }}>
              {['Timestamp', 'User', 'Action', 'Resource', 'IP', 'Status'].map((h) => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>Loading audit logs…</td></tr>}
            {!isLoading && events.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>No audit events found</td></tr>}
            {events.map((e: any) => (
              <tr key={e.event_id} style={{ borderBottom: '1px solid var(--border)', fontSize: 12.5 }}
                onMouseEnter={el => (el.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={el => (el.currentTarget.style.background = '')}>
                <td style={{ padding: '11px 16px', color: 'var(--text-3)', fontFamily: 'monospace', fontSize: 11.5 }}>
                  {e.timestamp ? format(new Date(e.timestamp), 'MMM d, HH:mm:ss') : '—'}
                </td>
                <td style={{ padding: '11px 16px', color: 'var(--text-2)', fontFamily: 'monospace', fontSize: 11.5 }}>
                  {String(e.user_id).slice(0, 8)}…
                </td>
                <td style={{ padding: '11px 16px', color: 'var(--text-1)', fontWeight: 500 }}>
                  <code style={{ background: 'var(--surface-hover)', padding: '2px 7px', borderRadius: 4, fontSize: 11.5 }}>{e.action}</code>
                </td>
                <td style={{ padding: '11px 16px', color: 'var(--text-2)' }}>{e.resource}</td>
                <td style={{ padding: '11px 16px', color: 'var(--text-3)', fontFamily: 'monospace', fontSize: 11.5 }}>{e.ip_address}</td>
                <td style={{ padding: '11px 16px' }}>
                  <Badge variant={e.status === 'success' ? 'green' : e.status === 'info' ? 'blue' : 'red'}>{e.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
