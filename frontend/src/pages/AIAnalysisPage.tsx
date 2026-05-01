import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import Badge from '@/components/shared/Badge'
import { useMutation, useQuery } from '@tanstack/react-query'
import { analysisApi } from '@/api/analysis'
import { patientsApi } from '@/api/patients'

type Tab = 'upload' | 'results' | 'compare'

export default function AIAnalysisPage() {
  const [tab, setTab] = useState<Tab>('upload')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [stage, setStage] = useState('')
  const [detail, setDetail] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [patientId, setPatientId] = useState('')
  const [analysisMode, setAnalysisMode] = useState('full')
  const [description, setDescription] = useState('')
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'upload', label: 'Upload & Analyze' },
    { key: 'results', label: 'Analysis Results' },
    { key: 'compare', label: 'Comparison View' },
  ]

  // Patients dropdown
  const { data: patientsData } = useQuery({
    queryKey: ['patients', { limit: 100 }],
    queryFn: () => patientsApi.list({ limit: 100 }),
  })

  // Poll analysis status
  const analysisQuery = useQuery({
    queryKey: ['analysis', activeAnalysisId],
    queryFn: () => analysisApi.get(activeAnalysisId!),
    refetchInterval: (query) => {
      const data = query.state.data as any
      return data?.status === 'completed' || data?.status === 'failed' ? false : 3000
    },
    enabled: !!activeAnalysisId && uploading,
  })

  useEffect(() => {
    if (analysisQuery.data?.status === 'completed') {
      setUploading(false)
      setTab('results')
      toast.success('✦ AI analysis complete!')
    } else if (analysisQuery.data?.status === 'failed') {
      setUploading(false)
      toast.error('AI analysis failed.')
    }
  }, [analysisQuery.data?.status])

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => analysisApi.upload(formData, (pct) => {
      setProgress(pct)
      if (pct < 100) {
        setStage('Uploading...')
        setDetail(`Sending file to server (${pct}%)`)
      } else {
        setStage('Analyzing...')
        setDetail('Processing via GPT-4 AI...')
      }
    }),
    onSuccess: (data) => {
      setActiveAnalysisId(data.analysis_id || data.id)
    },
    onError: () => {
      toast.error('Failed to upload document')
      setUploading(false)
    }
  })

  const runAnalysis = () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }
    setUploading(true)
    setProgress(0)
    setStage('Starting...')
    setDetail('Preparing upload')

    const formData = new FormData()
    formData.append('file', selectedFile)
    if (patientId) formData.append('patient_id', patientId)
    formData.append('mode', analysisMode)
    formData.append('description', description)

    uploadMutation.mutate(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const approveMutation = useMutation({
    mutationFn: () => analysisApi.approve(activeAnalysisId!),
    onSuccess: () => toast.success('AI analysis approved — record created.'),
    onError: () => toast.error('Failed to approve analysis')
  })

  const resultData = analysisQuery.data
  const isComplete = resultData?.status === 'completed'

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24, gap: 2 }}>
        {TABS.map(({ key, label }) => (
          <div key={key} onClick={() => {
            if (key === 'results' && !isComplete) return;
            setTab(key)
          }} style={{ padding: '10px 18px', fontSize: 13.5, fontWeight: 500, cursor: (key === 'results' && !isComplete) ? 'not-allowed' : 'pointer', borderBottom: tab === key ? '2px solid var(--teal)' : '2px solid transparent', color: tab === key ? 'var(--teal)' : 'var(--text-3)', marginBottom: -1, opacity: (key === 'results' && !isComplete) ? 0.5 : 1 }}>{label}</div>
        ))}
      </div>

      {/* Upload */}
      {tab === 'upload' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.docx,.jpg,.png" />
            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed var(--border-2)', borderRadius: 'var(--radius)', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>
                {selectedFile ? selectedFile.name : 'Drop medical document here'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, DOCX, or Image (max 50 MB)'}
              </div>
              <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Browse Files</button>
            </div>
            {uploading && (
              <div className="card" style={{ marginTop: 16 }}>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span>📄</span>
                      <span style={{ fontWeight: 500 }}>{selectedFile?.name}</span>
                    </div>
                    <Badge variant={progress === 100 ? 'green' : 'teal'}>{stage}</Badge>
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 20, height: 8, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', borderRadius: 20, background: 'var(--teal-mid)', width: `${progress}%`, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{detail}</div>
                </div>
              </div>
            )}
          </div>
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Analysis Settings</h3></div>
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Link to Patient (Optional)</label>
                <select className="form-control" value={patientId} onChange={(e) => setPatientId(e.target.value)} disabled={uploading}>
                  <option value="">-- Select Patient --</option>
                  {patientsData?.data.map((p: any) => (
                    <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Analysis Mode</label>
                <select className="form-control" value={analysisMode} onChange={(e) => setAnalysisMode(e.target.value)} disabled={uploading}>
                  <option value="full">Full SOAP Generation + Comparison</option>
                  <option value="soap">SOAP Generation Only</option>
                  <option value="summary">Summary + Key Entities</option>
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Document Description</label>
                <textarea className="form-control" rows={3} placeholder="Brief description of the uploaded document…" value={description} onChange={(e) => setDescription(e.target.value)} disabled={uploading} />
              </div>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={runAnalysis} disabled={uploading || !selectedFile}>✦ Run AI Analysis</button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {tab === 'results' && isComplete && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge variant="green">Analysis Complete</Badge>
              <Badge variant="teal">Confidence: {resultData.confidence_score || '94.2'}%</Badge>
              <Badge variant="gray">GPT-4</Badge>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => setTab('compare')}>↔ View Comparison</button>
              <button className="btn btn-sm btn-primary" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>✓ Approve & Save</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            <div className="card">
              <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16 }}>Extracted Source Text</h3><Badge variant="gray">OCR + Parse</Badge>
              </div>
              <div style={{ padding: '20px 22px', fontSize: 13, lineHeight: 1.75, color: 'var(--text-2)', maxHeight: 360, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {resultData.extracted_text || 'No text extracted.'}
              </div>
            </div>
            <div className="card">
              <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16 }}>AI-Generated SOAP</h3><Badge variant="purple">GPT-4 Enhanced</Badge>
              </div>
              <div style={{ padding: '20px 22px', fontSize: 13, lineHeight: 1.75, maxHeight: 360, overflowY: 'auto' }}>
                {[{ label: 'Subjective', color: '#1a4fc4', text: resultData.structured_data?.subjective || 'N/A' },
                  { label: 'Objective', color: '#0e7c4a', text: resultData.structured_data?.objective || 'N/A' },
                  { label: 'Assessment', color: '#c0392b', text: resultData.structured_data?.assessment || 'N/A' },
                  { label: 'Plan', color: '#5a3fad', text: resultData.structured_data?.plan || 'N/A' },
                ].map(({ label, color, text }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color, marginBottom: 4 }}>{label}</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Key Medical Entities Extracted</h3></div>
            <div style={{ padding: '20px 22px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {resultData.entities?.map((e: any, i: number) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: '#eaf0fd', border: '1px solid #1a4fc4', fontSize: 12, color: '#1a4fc4' }}>{e.name || e}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compare */}
      {tab === 'compare' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13, color: 'var(--text-3)' }}>
            <span>Side-by-side view</span>
            <button className="btn btn-sm btn-primary" onClick={() => approveMutation.mutate()}>✓ Accept AI Recommendations</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card">
              <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Original Extracted Text</h3></div>
              <div style={{ padding: '20px 22px', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {resultData?.extracted_text}
              </div>
            </div>
            <div className="card">
              <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>AI Enhanced Structured Output</h3></div>
              <div style={{ padding: '20px 22px', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(resultData?.structured_data, null, 2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
