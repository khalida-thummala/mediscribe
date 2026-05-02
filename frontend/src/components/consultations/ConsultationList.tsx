import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { consultationsApi } from '@/api/consultations'
import { patientsApi } from '@/api/patients'
import { Plus, Mic, StopCircle, Eye, Stethoscope, Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import Modal from '@/components/shared/Modal'
import ConsultationForm from './ConsultationForm'
import RecordingPanel from './RecordingPanel'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  completed:   { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Completed' },
  in_progress: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Recording' },
  scheduled:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Scheduled' },
  cancelled:   { color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', label: 'Cancelled' },
}

export default function ConsultationList() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['consultations'],
    queryFn: () => consultationsApi.list(),
  })

  const startMut = useMutation({
    mutationFn: (id: string) => consultationsApi.start(id),
    onSuccess: (_, id) => { setActiveId(id); qc.invalidateQueries({ queryKey: ['consultations'] }) },
    onError: () => toast.error('Failed to start consultation'),
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
  })

  const patients = Array.isArray(patientsData) ? patientsData : (patientsData as any)?.data ?? []
  const consultations = Array.isArray(data) ? data : (data as any)?.data ?? []
  const getPatient = (id: string) => patients.find((p: any) => p.patient_id === id)

  const stats = [
    { label: 'Total', value: consultations.length, icon: Stethoscope, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Completed', value: consultations.filter((c: any) => c.status === 'completed').length, icon: Clock, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Scheduled', value: consultations.filter((c: any) => c.status === 'scheduled').length, icon: Calendar, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Recording', value: consultations.filter((c: any) => c.status === 'in_progress').length, icon: Mic, color: '#f43f5e', bg: '#fff1f2' },
  ]

  return (
    <div className="fade-in">
      {/* ── Action Bar ────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setShowNew(true)}
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 10 }}
        >
          <Plus size={14} />
          New Consultation
        </button>
      </div>

      {/* ── Mini Stats ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 18px',
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
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
                  {isLoading ? '—' : s.value}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Table ────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: 14, margin: 0, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
            All Sessions
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {isLoading ? '…' : `${consultations.length} total`}
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
          </div>
        ) : consultations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Stethoscope size={40} color="var(--text-4)" /></div>
            <h3>No consultations yet</h3>
            <p>Create your first consultation session to begin recording and generating SOAP notes.</p>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={14} /> New Consultation
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['Patient', 'Type', 'Chief Complaint', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consultations.map((c: any) => {
                const patient = getPatient(c.patient_id)
                const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.scheduled
                return (
                  <tr key={c.consultation_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>
                          {patient ? `${patient.first_name[0]}${patient.last_name[0]}` : '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
                            {patient ? `${patient.first_name} ${patient.last_name}` : c.patient_id.slice(0, 8) + '…'}
                          </div>
                          {patient?.medical_id && (
                            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>#{patient.medical_id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: 13 }}>
                        {c.consultation_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        maxWidth: 200, display: 'block', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13,
                        color: 'var(--text-2)',
                      }}>
                        {c.chief_complaint ?? '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                        fontSize: 11.5, fontWeight: 600,
                        background: st.bg, color: st.color,
                        border: `1px solid ${st.border}`,
                      }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {c.created_at ? format(new Date(c.created_at), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 7 }}>
                        {c.status === 'scheduled' && (
                          <button
                            onClick={() => startMut.mutate(c.consultation_id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                              background: '#ecfdf5', color: '#059669',
                              border: '1px solid #a7f3d0', fontSize: 12, fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.color = '#059669'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                          >
                            <Mic size={12} /> Start
                          </button>
                        )}
                        {c.status === 'in_progress' && (
                          <button
                            onClick={() => setActiveId(c.consultation_id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                              background: '#fff1f2', color: '#e11d48',
                              border: '1px solid #fecdd3', fontSize: 12, fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48'; e.currentTarget.style.borderColor = '#fecdd3'; }}
                          >
                            <StopCircle size={12} /> End
                          </button>
                        )}
                        {c.status === 'completed' && (
                          <a
                            href={`/consultations/${c.consultation_id}/soap`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                              background: '#f5f3ff', color: '#7c3aed',
                              border: '1px solid #ddd6fe', fontSize: 12, fontWeight: 600,
                              textDecoration: 'none', transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#7c3aed'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; e.currentTarget.style.borderColor = 'transparent'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#f5f3ff'; (e.currentTarget as HTMLAnchorElement).style.color = '#7c3aed'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
                          >
                            <Eye size={12} /> SOAP
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modals ───────────────────────────── */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Consultation" width={520}>
        <ConsultationForm
          patients={patients}
          onSuccess={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ['consultations'] }) }}
        />
      </Modal>

      {activeId && (
        <Modal open={!!activeId} onClose={() => setActiveId(null)} title="Active Recording Session" width={700}>
          <RecordingPanel
            consultationId={activeId}
            onComplete={() => { setActiveId(null); qc.invalidateQueries({ queryKey: ['consultations'] }) }}
          />
        </Modal>
      )}
    </div>
  )
}
