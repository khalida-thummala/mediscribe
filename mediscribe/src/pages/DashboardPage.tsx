import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import StatCard from '@/components/shared/StatCard'
import Badge from '@/components/shared/Badge'
import { analyticsApi } from '@/api/analytics'
import { consultationsApi } from '@/api/consultations'
import type { Consultation } from '@/types'

const COMPLIANCE = [
  { label: 'HIPAA Compliance', value: 100, color: '#0e7c4a', badge: '100%', badgeV: 'green' as const },
  { label: 'Data Encryption Coverage', value: 100, color: '#0e7c4a', badge: '100%', badgeV: 'green' as const },
  { label: 'Audit Trail Completeness', value: 98.7, color: 'var(--teal-mid)', badge: '98.7%', badgeV: 'green' as const },
  { label: 'GDPR Rights Processed', value: 96, color: 'var(--teal-mid)', badge: '96%', badgeV: 'teal' as const },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: summaryData, isLoading: isLoadingSummary, isError: isErrorSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.getSummary({ period: '30d' }),
  })

  const { data: consultationsData, isLoading: isLoadingConsultations, isError: isErrorConsultations } = useQuery({
    queryKey: ['consultations', { limit: 4 }],
    queryFn: () => consultationsApi.list({ limit: 4 }),
  })

  if (isErrorSummary || isErrorConsultations) {
    toast.error('Failed to load dashboard data')
  }

  const summary = summaryData || {
    total_patients: 0,
    reports_exported: 0,
    ai_accuracy_rate: 0,
    time_saved_hours: 0,
    total_consultations: 0,
    monthly_trend: [],
  }

  const recentConsultations: Consultation[] = consultationsData?.data || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'in_progress': return 'blue'
      case 'cancelled': return 'red'
      default: return 'amber'
    }
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard 
          label="Total Patients" 
          value={isLoadingSummary ? '...' : summary.total_patients.toString()} 
          sub="Registered in system" 
        />
        <StatCard 
          label="Reports Exported" 
          value={isLoadingSummary ? '...' : summary.reports_exported.toString()} 
          sub={`AI accuracy ${summary.ai_accuracy_rate}%`} 
          subColor="#0e7c4a" 
        />
        <StatCard 
          label="Time Saved" 
          value={isLoadingSummary ? '...' : `${summary.time_saved_hours}h`} 
          sub="vs manual documentation" 
        />
        <StatCard 
          label="Total Consultations" 
          value={isLoadingSummary ? '...' : summary.total_consultations.toString()} 
          sub="All time" 
        />
      </div>

      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Recent Consultations */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 16 }}>Recent Consultations</h3>
            <button className="btn btn-sm" onClick={() => navigate('/consultations')}>View All</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Patient ID', 'Type', 'Status', 'Time'].map((h) => (
                    <th key={h} style={{ background: 'var(--surface-2)', padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoadingConsultations ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>
                      <div className="animate-pulse">Loading recent consultations...</div>
                    </td>
                  </tr>
                ) : recentConsultations.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)' }}>
                      No recent consultations
                    </td>
                  </tr>
                ) : recentConsultations.map((c) => (
                  <tr key={c.consultation_id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/consultations/${c.consultation_id}`)}>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 500 }}>{c.patient_id.substring(0, 8)}...</div>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>{c.consultation_type}</td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                      <Badge variant={getStatusColor(c.status)}>{c.status.replace('_', ' ')}</Badge>
                    </td>
                    <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-3)' }}>
                      {c.created_at ? format(new Date(c.created_at), 'hh:mm a') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>Quick Actions</h3>
          </div>
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🎙', title: 'Start New Consultation', sub: 'Begin recording + transcription', path: '/consultations' },
              { icon: '✦', title: 'AI Report Analysis', sub: 'Upload document for AI review', path: '/ai-analysis' },
              { icon: '👤', title: 'Add New Patient', sub: 'Register patient record', path: '/patients' },
              { icon: '📄', title: 'Export Report', sub: 'PDF / DOCX with e-signature', path: '/reports' },
            ].map((a) => (
              <button key={a.path} className="btn" onClick={() => navigate(a.path)} style={{ justifyContent: 'flex-start', gap: 12, padding: '12px 16px' }}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 500 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Weekly Activity (Mock layout for now, to be replaced by charts/bars) */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Monthly Trend</h3></div>
          <div style={{ padding: '20px 22px' }}>
            {isLoadingSummary ? (
              <div className="animate-pulse" style={{ height: 100, background: 'var(--surface-2)', borderRadius: 4 }}></div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, gap: 8 }}>
                {(summary.monthly_trend && summary.monthly_trend.length > 0 ? summary.monthly_trend : Array(7).fill({ count: 0, month: '' })).slice(-7).map((trend: any, i: number) => {
                  const maxCount = Math.max(...(summary.monthly_trend?.map((t: any) => t.count) || [1])) || 1
                  const heightPct = trend.count > 0 ? (trend.count / maxCount) * 100 : 0
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${heightPct}%`, background: 'var(--teal-light)', borderTop: heightPct > 0 ? '3px solid var(--teal-mid)' : 'none', minHeight: 4 }} />
                      <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{trend.month || '-'}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
              <span>Based on total consultations</span>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Compliance Status</h3></div>
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {COMPLIANCE.map((c) => (
              <div key={c.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
                  <Badge variant={c.badgeV}>{c.badge}</Badge>
                </div>
                <div style={{ background: 'var(--surface-2)', borderRadius: 20, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 20, background: c.color, width: `${c.value}%`, transition: 'width 0.4s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
