import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import SOAPEditor from '@/components/soap/SOAPEditor'

export default function SoapEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) return <div style={{ color: 'var(--text-3)', padding: 40 }}>Consultation ID missing</div>

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => navigate('/consultations')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}
        >
          <ArrowLeft size={15} /> Back to Consultations
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>SOAP Note Editor</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Consultation ID: {id}</p>
        </div>
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 28 }}>
        <SOAPEditor consultationId={id} />
      </div>
    </div>
  )
}
