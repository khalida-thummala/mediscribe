import PatientTable from '@/components/patients/PatientTable'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export default function PatientsPage() {
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
          background: 'var(--emerald-light)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--emerald)', fontWeight: 600,
        }}>
          <ShieldCheck size={13} />
          Verified Database
        </div>
      </div>
      <PatientTable />
    </div>
  )
}
