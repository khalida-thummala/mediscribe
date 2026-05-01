import { useState } from 'react'
import toast from 'react-hot-toast'
import Badge from '@/components/shared/Badge'
import { useQuery, useMutation } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { format } from 'date-fns'

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [emailRecipient, setEmailRecipient] = useState('')
  const [emailSubject, setEmailSubject] = useState('')

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list(),
  })

  const { data: selectedReport } = useQuery({
    queryKey: ['reports', selectedReportId],
    queryFn: () => reportsApi.get(selectedReportId!),
    enabled: !!selectedReportId,
  })

  const exportMutation = useMutation({
    mutationFn: (options: any) => reportsApi.export(selectedReportId!, options),
    onSuccess: (data) => {
      toast.success('Report exported! Download link ready.')
      if (data.download_url) {
        window.open(data.download_url, '_blank')
      }
    },
    onError: () => toast.error('Failed to export report'),
  })

  const emailMutation = useMutation({
    mutationFn: (payload: any) => reportsApi.email(selectedReportId!, payload),
    onSuccess: () => {
      toast.success('📧 Email sent successfully!')
      setEmailRecipient('')
      setEmailSubject('')
    },
    onError: () => toast.error('Failed to send email'),
  })

  const handleExport = () => {
    if (!selectedReportId) return toast.error('Select a report first')
    toast.loading('Generating report...', { id: 'export-toast' })
    exportMutation.mutate({ format: exportFormat, include_signature: true }, {
      onSettled: () => toast.dismiss('export-toast')
    })
  }

  const handleEmail = () => {
    if (!selectedReportId) return toast.error('Select a report first')
    if (!emailRecipient || !emailSubject) return toast.error('Fill in email recipient and subject')
    toast.loading('Sending email...', { id: 'email-toast' })
    emailMutation.mutate({ recipient_email: emailRecipient, subject: emailSubject }, {
      onSettled: () => toast.dismiss('email-toast')
    })
  }

  const reports = reportsData?.data || []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24 }}>
        {/* Report Preview */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16 }}>Report Preview {selectedReport ? '' : '(Select a report below)'}</h3>
            <button className="btn btn-sm" onClick={() => toast('Printing…', { icon: '🖨' })} disabled={!selectedReport}>🖨 Print</button>
          </div>
          <div style={{ padding: '20px 22px' }}>
            {selectedReport ? (
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, fontFamily: 'Times New Roman, serif' }}>
                <h1 style={{ textAlign: 'center', fontSize: 20, marginBottom: 4, fontFamily: 'Times New Roman, serif', fontWeight: 700 }}>MediScribe Clinical Report</h1>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#555', marginBottom: 24 }}>
                  Patient ID: {selectedReport.patient_id.substring(0,8)} | Date: {format(new Date(selectedReport.created_at), 'MMM dd, yyyy')}
                </div>
                {[
                  { heading: 'Subjective', text: selectedReport.subjective },
                  { heading: 'Objective', text: selectedReport.objective },
                  { heading: 'Assessment', text: selectedReport.assessment },
                  { heading: 'Plan', text: selectedReport.plan },
                ].map(({ heading, text }) => text && (
                  <div key={heading}>
                    <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #ccc', paddingBottom: 4, margin: '18px 0 8px', fontFamily: 'Times New Roman, serif', fontWeight: 700 }}>{heading}</h3>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: '#222', marginBottom: 8, whiteSpace: 'pre-wrap' }}>{text}</p>
                  </div>
                ))}
                <div style={{ marginTop: 28, borderTop: '1px solid #ddd', paddingTop: 12, fontSize: 11, color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                  <span>HIPAA Compliant · AES-256 Encrypted</span>
                  <span>Generated: MediScribe v2.0 · {format(new Date(), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                Please select a report from the list to preview it here.
              </div>
            )}
          </div>
        </div>

        {/* Export Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Export Options</h3></div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Export Format</label>
                <select className="form-control" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} disabled={!selectedReportId}>
                  <option value="pdf">PDF (Recommended)</option>
                  <option value="docx">DOCX (Word)</option>
                </select>
              </div>
              {[
                { label: 'Include digital signature', defaultChecked: true },
                { label: 'Password protect', defaultChecked: false },
                { label: 'Include HIPAA metadata', defaultChecked: true },
                { label: 'Add watermark', defaultChecked: false },
              ].map(({ label, defaultChecked }) => (
                <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked={defaultChecked} disabled={!selectedReportId} /> {label}
                </label>
              ))}
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={handleExport} disabled={!selectedReportId || exportMutation.isPending}>
                ⬇ {exportMutation.isPending ? 'Exporting...' : 'Export Report'}
              </button>
            </div>
          </div>
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Send via Email</h3></div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Recipient Email</label>
                <input type="email" className="form-control" placeholder="patient@email.com" value={emailRecipient} onChange={(e) => setEmailRecipient(e.target.value)} disabled={!selectedReportId} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Subject</label>
                <input className="form-control" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Your Clinical Report" disabled={!selectedReportId} />
              </div>
              <button className="btn" style={{ justifyContent: 'center' }} onClick={handleEmail} disabled={!selectedReportId || emailMutation.isPending}>
                {emailMutation.isPending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report List */}
      <div className="card">
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16 }}>All Reports</h3>
          <input className="form-control" style={{ width: 220 }} placeholder="Search reports…" />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Patient ID', 'Date', 'Consultation Type', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ background: 'var(--surface-2)', padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center' }}>Loading reports...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)' }}>No reports found</td>
                </tr>
              ) : reports.map((r: any) => (
                <tr key={r.report_id} style={{ background: selectedReportId === r.report_id ? 'var(--surface-2)' : 'transparent' }}>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{r.patient_id.substring(0,8)}...</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>{format(new Date(r.created_at), 'MMM dd, yyyy')}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>{r.consultation_type || 'Consultation'}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                    <Badge variant={r.status === 'approved' ? 'green' : 'amber'}>{r.status}</Badge>
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => {
                      setSelectedReportId(r.report_id)
                      setEmailSubject(`Your Clinical Report - ${format(new Date(r.created_at), 'MMM dd, yyyy')}`)
                    }}>
                      {selectedReportId === r.report_id ? 'Viewing' : 'View'}
                    </button>
                    {r.status === 'draft' && <button className="btn btn-sm btn-primary" onClick={() => setSelectedReportId(r.report_id)}>Export</button>}
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
