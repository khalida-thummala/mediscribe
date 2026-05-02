import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { consultationsApi } from '@/api/consultations'
import { useRecording } from '@/hooks/useRecording'
import { useConsultationStore } from '@/store/consultationStore'
import { Mic, StopCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  consultationId: string
  onComplete: () => void
}

export default function RecordingPanel({ consultationId, onComplete }: Props) {
  const { isRecording, start, stop } = useRecording()
  const { recSeconds, transcript } = useConsultationStore()
  const [phase, setPhase] = useState<'idle' | 'recording' | 'stopping' | 'done'>('idle')

  // Fetch transcription after done
  const { data: transcription } = useQuery({
    queryKey: ['transcription', consultationId],
    queryFn: () => consultationsApi.getTranscription(consultationId),
    enabled: phase === 'done',
  })

  const endMut = useMutation({
    mutationFn: (audioData: string) => consultationsApi.end(consultationId, audioData),
    onSuccess: () => {
      setPhase('done')
      toast.success('Consultation ended — SOAP generation triggered')
      setTimeout(onComplete, 2000)
    },
    onError: () => { toast.error('Failed to end consultation'); setPhase('idle') },
  })

  const handleStart = async () => {
    setPhase('recording')
    await start()
  }

  const handleStop = async () => {
    setPhase('stopping')
    const audioBase64 = await stop()
    endMut.mutate(audioBase64)
  }

  const minutes = Math.floor(recSeconds / 60).toString().padStart(2, '0')
  const seconds = (recSeconds % 60).toString().padStart(2, '0')

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Timer */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          fontSize: 48, fontWeight: 700, fontFamily: 'monospace',
          color: isRecording ? '#e74c3c' : 'var(--text-1)',
          transition: 'color 0.3s',
        }}>
          {minutes}:{seconds}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
          {phase === 'idle' && 'Ready to record'}
          {phase === 'recording' && <span style={{ color: '#e74c3c' }}>● Recording in progress</span>}
          {phase === 'stopping' && 'Stopping & processing…'}
          {phase === 'done' && '✓ Consultation completed'}
        </div>
      </div>

      {/* Live Transcript */}
      {(phase === 'recording' || phase === 'stopping') && (
        <div style={{
          background: 'var(--surface-hover)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 16, marginBottom: 20,
          maxHeight: 160, overflowY: 'auto', fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)',
        }}>
          {transcript || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Listening for speech…</span>}
        </div>
      )}

      {/* Final Transcript */}
      {phase === 'done' && transcription && (
        <div style={{
          background: '#0e7c4a10', border: '1px solid #0e7c4a40',
          borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--text-2)',
        }}>
          {(transcription as any).transcription_text || 'Processing transcription…'}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
        {phase === 'idle' && (
          <button
            onClick={handleStart}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px',
              background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Mic size={18} /> Start Recording
          </button>
        )}
        {phase === 'recording' && (
          <button
            onClick={handleStop}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px',
              background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <StopCircle size={18} /> End Consultation
          </button>
        )}
        {phase === 'stopping' && (
          <button disabled style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px',
            background: 'var(--border)', color: 'var(--text-3)', border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: 'not-allowed',
          }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing…
          </button>
        )}
      </div>
    </div>
  )
}
