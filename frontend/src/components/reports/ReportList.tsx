import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { FileText, Download, CheckCircle2, Clock, PenLine, Archive } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  approved: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2, label: 'Approved' },
  signed:   { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', icon: PenLine,      label: 'Signed' },
  draft:    { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: Clock,        label: 'Draft' },
  reviewed: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: FileText,     label: 'Reviewed' },
  archived: { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: Archive,      label: 'Archived' },
}

export default function ReportList() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list(),
  })

  const reports = Array.isArray(data) ? data : (data as any)?.data ?? []

  const handleExport = async (reportId: string, fmt: 'pdf' | 'docx') => {
    try {
      const res = await reportsApi.export(reportId, { format: fmt, include_signatures: true, include_metadata: true })
      
      // Since backend export is simulated (#), we'll simulate a download here
      const content = `MediScribe SOAP Report\nID: ${res.report_id}\n\nSubjective: ${res.subjective}\nObjective: ${res.objective}\nAssessment: ${res.assessment}\nPlan: ${res.plan}\n\nGenerated via MediScribe AI`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.file_name.replace('.pdf', `.${fmt === 'pdf' ? 'txt' : 'docx'}`)
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Report downloaded as ${fmt.toUpperCase()}`)
    } catch (err) {
      toast.error('Failed to export report')
    }
  }

  const draftCount    = reports.filter((r: any) => r.status === 'draft').length
  const approvedCount = reports.filter((r: any) => r.status === 'approved' || r.status === 'signed').length

  return (
    <div>
      {/* Mini Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Reports',    value: reports.length, color: '#7c3aed', bg: '#f5f3ff', icon: FileText },
          { label: 'Approved / Signed',value: approvedCount,  color: '#059669', bg: '#ecfdf5', icon: CheckCircle2 },
          { label: 'Drafts Pending',   value: draftCount,     color: '#d97706', bg: '#fffbeb', icon: Clock },
        ].map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${s.color}22`, flexShrink: 0,
              }}>
                <Icon size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
                  {isLoading ? '—' : s.value}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: 'var(--text-2)' }}>
            All SOAP Reports
          </h3>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={40} color="var(--text-4)" /></div>
            <h3>No reports generated yet</h3>
            <p>Complete a consultation session to automatically generate SOAP notes.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['Report', 'Status', 'Created', 'Approved By', 'Export'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any) => {
                const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.draft
                const StatusIcon = st.icon
                return (
                  <tr key={r.report_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8, background: '#f5f3ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid #ddd6fe', flexShrink: 0,
                        }}>
                          <FileText size={15} color="#7c3aed" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
                            SOAP Report
                          </div>
                          <code style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            #{r.report_id?.slice(0, 8)}…
                          </code>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                      }}>
                        <StatusIcon size={11} /> {st.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                      {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—'}
                      <br />
                      <span style={{ fontSize: 11 }}>{r.created_at ? format(new Date(r.created_at), 'h:mm a') : ''}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {r.approved_by ? (
                        <code style={{
                          fontSize: 11, background: 'var(--surface-2)', padding: '2px 7px',
                          borderRadius: 6, border: '1px solid var(--border)',
                        }}>
                          {r.approved_by.slice(0, 8)}…
                        </code>
                      ) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 7 }}>
                        {(['pdf', 'docx'] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => handleExport(r.report_id, fmt)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                              background: 'var(--surface-2)', border: '1px solid var(--border)',
                              fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)',
                              transition: 'all 0.15s', textTransform: 'uppercase',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--teal-light)'; e.currentTarget.style.color = 'var(--teal-dark)'; e.currentTarget.style.borderColor = '#99f6e4'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >
                            <Download size={12} /> {fmt}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
