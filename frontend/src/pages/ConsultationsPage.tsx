import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Badge from '@/components/shared/Badge'
import { useConsultationStore } from '@/store/consultationStore'
import { useRecording } from '@/hooks/useRecording'
import { formatDuration } from '@/utils'
import { consultationsApi } from '@/api/consultations'
import { patientsApi } from '@/api/patients'
import { format } from 'date-fns'

export default function ConsultationsPage() {
  const navigate = useNavigate()
  const { isRecording, start, stop } = useRecording()
  const { transcript, recSeconds, confidence } = useConsultationStore()
  const waveRef = useRef<HTMLDivElement>(null)
  const waveInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [consultationType, setConsultationType] = useState('General Checkup')
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null)

  // Polling states
  const [isPollingTranscription, setIsPollingTranscription] = useState(false)
  const [isTranscriptionReady, setIsTranscriptionReady] = useState(false)
  const [isPollingReport, setIsPollingReport] = useState(false)

  // Queries
  const { data: patientsData } = useQuery({
    queryKey: ['patients', { limit: 100 }], // Fetch a list of patients for dropdown
    queryFn: () => patientsApi.list({ limit: 100 }),
  })

  const { data: consultationsData, isLoading: isLoadingConsultations } = useQuery({
    queryKey: ['consultations', { page: 1 }],
    queryFn: () => consultationsApi.list({ limit: 10 }),
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: consultationsApi.create,
    onSuccess: (data) => setActiveConsultationId(data.consultation_id),
    onError: () => toast.error('Failed to create consultation'),
  })

  const startMutation = useMutation({
    mutationFn: consultationsApi.start,
    onError: () => toast.error('Failed to start consultation in backend'),
  })

  const endMutation = useMutation({
    mutationFn: ({ id, audio_data }: { id: string, audio_data: string }) => consultationsApi.end(id, audio_data),
    onSuccess: () => {
      toast.success('Recording saved. Starting transcription...')
      setIsPollingTranscription(true)
    },
    onError: () => toast.error('Failed to save recording'),
  })

  const transcriptionQuery = useQuery({
    queryKey: ['transcription', activeConsultationId],
    queryFn: () => consultationsApi.getTranscription(activeConsultationId!),
    refetchInterval: (query) => {
      const data = query.state.data as any
      return (data?.transcription_status === 'completed' || data?.transcription_status === 'failed') ? false : 3000
    },
    enabled: isPollingTranscription && !!activeConsultationId,
  })

  useEffect(() => {
    if (transcriptionQuery.data?.transcription_status === 'completed') {
      setIsPollingTranscription(false)
      setIsTranscriptionReady(true)
      toast.success('Transcription complete! Ready to generate SOAP note.')
    }
  }, [transcriptionQuery.data])

  const reportQuery = useQuery({
    queryKey: ['report', activeConsultationId],
    queryFn: () => consultationsApi.getReport(activeConsultationId!),
    refetchInterval: (query) => {
      const data = query.state.data as any
      return data?.status === 'draft' || data?.status === 'reviewed' ? false : 3000
    },
    enabled: isPollingReport && !!activeConsultationId,
  })

  useEffect(() => {
    if (reportQuery.data?.status === 'draft' || reportQuery.data?.status === 'reviewed') {
      setIsPollingReport(false)
      toast.dismiss()
      toast.success('SOAP note generated!')
      navigate(`/consultations/${activeConsultationId}/soap`)
    }
  }, [reportQuery.data, activeConsultationId, navigate])


  // Animate waveform
  useEffect(() => {
    const bars = waveRef.current?.querySelectorAll('.wbar')
    if (isRecording) {
      waveInterval.current = setInterval(() => {
        bars?.forEach((b) => { (b as HTMLElement).style.height = (4 + Math.random() * 38) + 'px' })
      }, 120)
    } else {
      if (waveInterval.current) clearInterval(waveInterval.current)
      bars?.forEach((b) => { (b as HTMLElement).style.height = '4px' })
    }
    return () => { if (waveInterval.current) clearInterval(waveInterval.current) }
  }, [isRecording])

  const handleStart = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient first')
      return
    }
    useConsultationStore.setState({ transcript: '', recSeconds: 0 })
    setIsTranscriptionReady(false)
    setIsPollingTranscription(false)
    setIsPollingReport(false)
    
    // Step 2
    const consult = await createMutation.mutateAsync({
      patient_id: selectedPatientId,
      consultation_type: consultationType,
      chief_complaint: 'Routine checkup', // Defaulting for now
    })
    
    // Step 3
    await startMutation.mutateAsync(consult.consultation_id)
    
    // Step 4 & 5
    await start()
  }

  const handleStop = async () => {
    if (!activeConsultationId) return
    toast.loading('Saving audio...', { id: 'saving-audio' })
    const base64Audio = await stop()
    toast.dismiss('saving-audio')
    
    // Step 7
    endMutation.mutate({ id: activeConsultationId, audio_data: base64Audio || '' })
  }

  const toggle = () => {
    if (isRecording) {
      handleStop()
    } else {
      handleStart()
    }
  }

  const generateSOAP = async () => {
    if (!activeConsultationId) return
    toast.loading('Generating SOAP note with GPT-4…')
    try {
      // Assuming a custom fetch since it's not explicitly in consultationsApi
      const token = localStorage.getItem('ms_auth') ? JSON.parse(localStorage.getItem('ms_auth') as string).state.accessToken : ''
      await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || '/api/v1'}/consultations/${activeConsultationId}/generate-soap`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      setIsPollingReport(true)
    } catch (e) {
      toast.dismiss()
      toast.error('Failed to start SOAP generation')
    }
  }

  const history = consultationsData?.data || []
  const patients = patientsData?.data || []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Recording Panel */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 16 }}>Consultation Recording</div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center' }}>
            <select 
              className="form-control" 
              style={{ width: '200px' }}
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              disabled={isRecording || isPollingTranscription}
            >
              <option value="">Select Patient...</option>
              {patients.map((p: any) => (
                <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
            
            <select 
              className="form-control" 
              style={{ width: '150px' }}
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value)}
              disabled={isRecording || isPollingTranscription}
            >
              <option value="General Checkup">General Checkup</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Prescription">Prescription</option>
            </select>
          </div>

          <button
            onClick={toggle}
            className={isRecording ? 'recording' : ''}
            disabled={(!selectedPatientId && !isRecording) || isPollingTranscription}
            style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${isRecording ? '#c0392b' : 'var(--teal)'}`, background: isRecording ? '#c0392b' : 'var(--teal-light)', cursor: (!selectedPatientId && !isRecording) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px', transition: 'all 0.2s', opacity: (!selectedPatientId && !isRecording) ? 0.5 : 1 }}
          >
            {isRecording ? '⏹' : '🎙'}
          </button>

          <div style={{ fontSize: 13, color: isRecording ? '#c0392b' : 'var(--text-3)', marginBottom: 12 }}>
            {isRecording ? '● Recording in progress…' : isPollingTranscription ? 'Processing audio...' : 'Click to start recording'}
          </div>

          {/* Waveform */}
          <div ref={waveRef} style={{ height: 56, background: 'var(--surface-2)', borderRadius: 8, margin: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0 16px', overflow: 'hidden' }}>
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="wbar" style={{ width: 3, borderRadius: 2, background: 'var(--teal-mid)', height: 4, transition: 'height 0.1s' }} />
            ))}
          </div>

          <div style={{ fontSize: 22, fontFamily: 'DM Serif Display, serif', color: 'var(--text)', marginBottom: 14 }}>
            {formatDuration(recSeconds)}
          </div>
        </div>

        {/* Live Transcript */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 16 }}>Live Transcription</h3>
              <Badge variant="blue">
                {isPollingTranscription ? 'Processing...' : 'Azure Speech ●'}
              </Badge>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, minHeight: 100, fontSize: 13.5, lineHeight: 1.65 }}>
                {transcriptionQuery.data?.transcription_text || transcript || <span style={{ color: 'var(--text-3)' }}>Transcription will appear here in real-time…</span>}
                {isRecording && <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--teal)', marginLeft: 2, animation: 'blink 0.8s infinite', verticalAlign: 'middle' }} />}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--text-3)' }}>
                <span>{(transcriptionQuery.data?.transcription_text || transcript).split(' ').filter(Boolean).length} words</span>
                <span>Confidence: {transcriptionQuery.data?.confidence_score || confidence > 0 ? `${transcriptionQuery.data?.confidence_score || confidence}%` : '—'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isTranscriptionReady && (
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={generateSOAP} disabled={isPollingReport}>
                {isPollingReport ? 'Generating...' : '⚡ Generate SOAP Note'}
              </button>
            )}
            {activeConsultationId && (
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/consultations/${activeConsultationId}/soap`)}>
                ✓ View SOAP Editor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16 }}>Consultation History</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Patient ID', 'Date', 'Type', 'Transcription', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ background: 'var(--surface-2)', padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoadingConsultations ? (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>
                    <div className="animate-pulse">Loading history...</div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
                    No consultations found
                  </td>
                </tr>
              ) : history.map((r: any) => (
                <tr key={r.consultation_id}>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{r.patient_id.substring(0,8)}...</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>
                    {r.created_at ? format(new Date(r.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>{r.consultation_type}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                    <Badge variant={r.transcription_status === 'completed' ? 'green' : 'amber'}>
                      {r.transcription_status}
                    </Badge>
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                    <Badge variant={r.status === 'completed' ? 'green' : 'blue'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                    <button className="btn btn-sm" onClick={() => navigate(`/consultations/${r.consultation_id}/soap`)}>
                      View
                    </button>
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
