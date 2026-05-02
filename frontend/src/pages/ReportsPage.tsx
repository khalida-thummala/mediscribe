import ReportList from '@/components/reports/ReportList'
import { FileText } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
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
