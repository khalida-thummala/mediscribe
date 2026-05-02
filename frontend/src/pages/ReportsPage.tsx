import ReportList from '@/components/reports/ReportList'
import { FileText, ArrowLeft } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button 
          onClick={() => window.history.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}
        >
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--teal-light)', border: '1px solid var(--teal-glow)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--teal-dark)', fontWeight: 600,
        }}>
          <FileText size={13} />
          SOAP Standard
        </div>
      </div>
      <ReportList />
    </div>
  )
}
