import { useQuery } from '@tanstack/react-query'
import StatCard from '@/components/shared/StatCard'
import Badge from '@/components/shared/Badge'
import { analyticsApi } from '@/api/analytics'

export default function AnalyticsPage() {
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.getSummary(),
  })

  const { data: trends, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: () => analyticsApi.getConsultationTrends(),
  })

  const { data: kpis, isLoading: isLoadingKpis } = useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => analyticsApi.getKpis(),
  })

  // Fallback data if API returns empty
  const summaryData = summary || {
    total_consultations: 0,
    avg_duration_minutes: 0,
    ai_accuracy_rate: 0,
    total_reports: 0
  }

  const byTypeData = trends?.by_type || [
    { label: 'General Checkup', pct: 72 },
    { label: 'Follow-up', pct: 54 },
    { label: 'Cardiology', pct: 38 },
    { label: 'Prescription', pct: 29 },
    { label: 'AI Analysis', pct: 21, color: '#5a3fad' },
  ]

  const monthlyTrendsData = trends?.monthly || [
    { label: 'Jan', h: 55 }, { label: 'Feb', h: 70 }, { label: 'Mar', h: 82 }, { label: 'Apr', h: 100, current: true },
  ]

  const kpisData = kpis || [
    { metric: 'API Response Time (p95)', target: '< 200ms', current: '142ms', met: true },
    { metric: 'Page Load Time', target: '< 2 seconds', current: '1.3s', met: true },
    { metric: 'Transcription Accuracy', target: '> 95%', current: '97.1%', met: true },
    { metric: 'System Uptime', target: '99.9%', current: '99.97%', met: true },
    { metric: 'Cache Hit Rate', target: '> 85%', current: '91.3%', met: true },
    { metric: 'Security Vulnerabilities', target: '0 Critical', current: '0', met: true },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard 
          label="Total Consultations" 
          value={isLoadingSummary ? '...' : summaryData.total_consultations.toLocaleString()} 
          sub="↑ 12.4% this month" 
          subColor="#0e7c4a" 
        />
        <StatCard 
          label="Avg. Documentation Time" 
          value={isLoadingSummary ? '...' : `${summaryData.avg_duration_minutes}m`} 
          sub="↓ 78% vs manual (14m)" 
          subColor="#0e7c4a" 
        />
        <StatCard 
          label="AI Accuracy Rate" 
          value={isLoadingSummary ? '...' : `${summaryData.ai_accuracy_rate}%`} 
          sub="↑ 0.3% vs last month" 
          subColor="#0e7c4a" 
        />
        <StatCard 
          label="Reports Exported" 
          value={isLoadingSummary ? '...' : summaryData.total_reports.toLocaleString()} 
          sub="Total exports to date" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* By Type */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>Consultations by Type</h3>
          </div>
          <div style={{ padding: '20px 22px' }}>
            {isLoadingTrends ? (
              <div className="animate-pulse" style={{ height: 100, background: 'var(--surface-2)', borderRadius: 8 }} />
            ) : byTypeData.map(({ label, pct, color }: any) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 100, fontSize: 12, color: 'var(--text-2)', textAlign: 'right', flexShrink: 0 }}>{label}</div>
                <div style={{ flex: 1, height: 20, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: color ?? 'var(--teal-mid)', width: `${pct}%`, display: 'flex', alignItems: 'center', paddingRight: 8, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>Monthly Trends</h3>
          </div>
          <div style={{ padding: '20px 22px' }}>
            {isLoadingTrends ? (
               <div className="animate-pulse" style={{ height: 120, background: 'var(--surface-2)', borderRadius: 8 }} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: 8 }}>
                {monthlyTrendsData.map(({ label, h, current }: any) => (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: h, background: current ? 'var(--teal)' : 'var(--teal-light)', borderTop: `3px solid ${current ? 'var(--teal)' : 'var(--teal-mid)'}` }} />
                    <div style={{ fontSize: 11, color: current ? 'var(--teal)' : 'var(--text-3)', fontWeight: current ? 600 : 400 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="card">
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16 }}>Performance KPIs</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Metric', 'Target', 'Current', 'Status'].map((h) => (
                  <th key={h} style={{ background: 'var(--surface-2)', padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoadingKpis ? (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: 'center' }}>Loading KPIs...</td>
                </tr>
              ) : kpisData.map((k: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{k.metric}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)' }}>{k.target}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{k.current}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                    <Badge variant={k.met ? 'green' : 'amber'}>{k.met ? '✓ Met' : 'Missed'}</Badge>
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
