import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Badge from '@/components/shared/Badge'
import Modal from '@/components/shared/Modal'
import { consultationsApi } from '@/api/consultations'
import { format } from 'date-fns'

const TABS = ['SOAP Note', 'Prescriptions', 'Visit History', 'Transcript'] as const
type Tab = typeof TABS[number]

export default function SoapEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('SOAP Note')
  const [pinOpen, setPinOpen] = useState(false)
  const [pin, setPin] = useState('')

  const [soap, setSoap] = useState({
    S: '', O: '', A: '', P: ''
  })
  
  const [medications, setMedications] = useState<any[]>([])

  // Queries
  const { data: consultation, isLoading: isLoadingConsultation } = useQuery({
    queryKey: ['consultation', id],
    queryFn: () => consultationsApi.get(id!),
    enabled: !!id,
  })

  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: ['report', id],
    queryFn: () => consultationsApi.getReport(id!),
    enabled: !!id,
  })

  const { data: historyData } = useQuery({
    queryKey: ['consultations', { patient_id: consultation?.patient_id }],
    queryFn: () => consultationsApi.list({ patient_id: consultation?.patient_id }),
    enabled: !!consultation?.patient_id,
  })

  const { data: transcription } = useQuery({
    queryKey: ['transcription', id],
    queryFn: () => consultationsApi.getTranscription(id!),
    enabled: !!id,
  })

  // Initialize local state from report
  useEffect(() => {
    if (report) {
      setSoap({
        S: report.subjective || '',
        O: report.objective || '',
        A: report.assessment || '',
        P: report.plan || ''
      })
      if (report.medications) {
        setMedications(report.medications)
      }
    }
  }, [report])

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: any) => consultationsApi.updateReport(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      toast.success('Draft auto-saved', { position: 'bottom-right' })
    },
    onError: () => toast.error('Failed to save draft'),
  })

  const approveMutation = useMutation({
    mutationFn: (signature_pin: string) => consultationsApi.approveReport(id!, signature_pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      setPinOpen(false)
      toast.success('✓ SOAP note approved and digitally signed!')
    },
    onError: () => toast.error('Failed to approve report'),
  })

  // Auto-save logic
  useEffect(() => {
    if (!report) return
    const handler = setTimeout(() => {
      if (
        soap.S !== (report.subjective || '') ||
        soap.O !== (report.objective || '') ||
        soap.A !== (report.assessment || '') ||
        soap.P !== (report.plan || '')
      ) {
        updateMutation.mutate({
          subjective: soap.S,
          objective: soap.O,
          assessment: soap.A,
          plan: soap.P
        })
      }
    }, 2000)

    return () => clearTimeout(handler)
  }, [soap, report])

  const handleBlur = () => {
    // Immediate save on blur
    if (!report) return
    if (
      soap.S !== (report.subjective || '') ||
      soap.O !== (report.objective || '') ||
      soap.A !== (report.assessment || '') ||
      soap.P !== (report.plan || '')
    ) {
      updateMutation.mutate({
        subjective: soap.S,
        objective: soap.O,
        assessment: soap.A,
        plan: soap.P
      })
    }
  }

  const addMedication = () => {
    const newMed = { name: 'New Med', dosage: '', frequency: '', duration: '', route: 'Oral', interaction_status: 'safe' }
    const updatedMeds = [...medications, newMed]
    setMedications(updatedMeds)
    updateMutation.mutate({ medications: updatedMeds })
  }

  const removeMedication = (index: number) => {
    const updatedMeds = [...medications]
    updatedMeds.splice(index, 1)
    setMedications(updatedMeds)
    updateMutation.mutate({ medications: updatedMeds })
  }

  const approveAndSign = () => {
    if (!soap.S || !soap.O || !soap.A || !soap.P) {
      toast.error('All SOAP sections must be filled before approval')
      return
    }
    setPinOpen(true)
  }

  if (isLoadingReport || isLoadingConsultation) return <div style={{ padding: 40, textAlign: 'center' }} className="animate-pulse">Loading SOAP editor...</div>

  const visitHistory = historyData?.data || []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Badge variant="green">● {consultation?.patient_id.substring(0,8)}...</Badge>
            <Badge variant="blue">{consultation?.consultation_type}</Badge>
            <Badge variant={report?.status === 'approved' ? 'green' : 'amber'}>{report?.status || 'Draft'}</Badge>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {consultation?.created_at ? format(new Date(consultation.created_at), 'MMM dd, yyyy') : 'N/A'} · Duration: {consultation?.duration_minutes || 0} min · Auto-saves every 2s
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={handleBlur} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : '💾 Save Draft'}
          </button>
          <button className="btn" onClick={() => navigate('/reports')}>📄 Export</button>
          {report?.status !== 'approved' && (
            <button className="btn btn-primary" onClick={approveAndSign}>✓ Approve & Sign</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24, gap: 2 }}>
        {TABS.map((t) => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--teal)' : '2px solid transparent', color: tab === t ? 'var(--teal)' : 'var(--text-3)', marginBottom: -1, transition: 'all 0.15s' }}>{t}</div>
        ))}
      </div>

      {/* SOAP Note */}
      {tab === 'SOAP Note' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {([
              { key: 'S' as const, label: 'S — Subjective', bg: '#eef4fb', color: '#1a4fc4' },
              { key: 'O' as const, label: 'O — Objective', bg: '#e8f8f1', color: '#0e7c4a' },
              { key: 'A' as const, label: 'A — Assessment', bg: '#fdf0ef', color: '#c0392b' },
              { key: 'P' as const, label: 'P — Plan', bg: '#f0ecfd', color: '#5a3fad' },
            ]).map(({ key, label, bg, color }) => (
              <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', background: bg, color }}>{label}</div>
                <textarea
                  value={soap[key]}
                  onChange={(e) => setSoap((s) => ({ ...s, [key]: e.target.value }))}
                  onBlur={handleBlur}
                  disabled={report?.status === 'approved'}
                  style={{ width: '100%', border: 'none', background: 'var(--surface)', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text)', padding: '14px 16px', resize: 'vertical', minHeight: 130, outline: 'none' }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 12.5, color: 'var(--text-3)' }}>
            <span>Last saved {report?.updated_at ? format(new Date(report.updated_at), 'hh:mm:ss a') : 'never'}</span>
          </div>
        </div>
      )}

      {/* Prescriptions */}
      {tab === 'Prescriptions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13, color: 'var(--text-3)' }}>
            <span>Prescription list for this consultation</span>
            <button className="btn btn-sm btn-primary" onClick={addMedication} disabled={report?.status === 'approved'}>+ Add Medication</button>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Medication', 'Dosage', 'Frequency', 'Duration', 'Route', 'Interaction', 'Actions'].map((h) => (
                    <th key={h} style={{ background: '#f0ecfd', color: '#5a3fad', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 12px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {medications.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)' }}>No medications added</td></tr>
                ) : medications.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontWeight: 500, fontSize: 13 }}>{r.name}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>{r.dosage}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>{r.frequency}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>{r.duration}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>{r.route}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}><Badge variant={r.interaction_status === 'safe' ? 'green' : 'amber'}>{r.interaction_status}</Badge></td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
                      <button className="btn btn-sm" onClick={() => removeMedication(i)} disabled={report?.status === 'approved'}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visit History */}
      {tab === 'Visit History' && (
        <div style={{ position: 'relative', paddingLeft: 28 }}>
          <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
          {visitHistory.length === 0 ? (
            <div style={{ color: 'var(--text-3)', padding: 20 }}>No past visits found</div>
          ) : visitHistory.map((item: any) => (
            <div key={item.consultation_id} style={{ position: 'relative', marginBottom: 22 }}>
              <div style={{ position: 'absolute', left: -24, top: 4, width: 10, height: 10, borderRadius: '50%', background: 'var(--teal)', border: '2px solid var(--surface)' }} />
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{item.created_at ? format(new Date(item.created_at), 'MMM dd, yyyy') : ''}</div>
              <div style={{ fontWeight: 500, fontSize: 13.5 }}>{item.consultation_type}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{item.chief_complaint}</div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript */}
      {tab === 'Transcript' && (
        <div className="card">
          <div style={{ padding: '20px 22px', fontSize: 13.5, lineHeight: 1.8, color: 'var(--text)' }}>
            {transcription?.transcription_text ? (
              <p>{transcription.transcription_text}</p>
            ) : (
              <span style={{ color: 'var(--text-3)' }}>No transcription available</span>
            )}
          </div>
        </div>
      )}

      {/* Approve PIN Modal */}
      <Modal open={pinOpen} onClose={() => setPinOpen(false)} title="Sign Report"
        footer={<>
          <button className="btn" onClick={() => setPinOpen(false)} disabled={approveMutation.isPending}>Cancel</button>
          <button className="btn btn-primary" onClick={() => approveMutation.mutate(pin)} disabled={approveMutation.isPending || pin.length < 4}>
            {approveMutation.isPending ? 'Signing...' : 'Sign & Approve'}
          </button>
        </>}
      >
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Enter 4-Digit PIN to Sign</label>
          <input 
            type="password" 
            className="form-control" 
            placeholder="****" 
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
