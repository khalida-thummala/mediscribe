import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { consultationsApi } from '@/api/consultations'
import toast from 'react-hot-toast'
import type { CreateConsultationPayload } from '@/types'

interface Props {
  patients: any[]
  onSuccess: () => void
}

const CONSULTATION_TYPES = ['General Consultation', 'Follow-up', 'Emergency', 'Specialist Referral', 'Preventive Care', 'Mental Health', 'Pediatric', 'Geriatric']

export default function ConsultationForm({ patients, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateConsultationPayload>()

  const mut = useMutation({
    mutationFn: consultationsApi.create,
    onSuccess: () => { toast.success('Consultation scheduled'); onSuccess() },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to create consultation'),
  })

  return (
    <form onSubmit={handleSubmit((d) => mut.mutate(d))}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
            <span>Patient <span style={{ color: '#e74c3c' }}>*</span></span>
            <a href="/patients" style={{ color: 'var(--teal)', fontSize: 11, textDecoration: 'none' }}>+ Add New Patient</a>
          </label>
          <select {...register('patient_id', { required: 'Patient is required' })} className="form-control">
            <option value="">Select patient…</option>
            {patients.map((p: any) => (
              <option key={p.patient_id} value={p.patient_id}>{p.first_name} {p.last_name} — {p.medical_id}</option>
            ))}
          </select>
          {patients.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              No patients found. Please <a href="/patients" style={{ color: 'var(--teal)', fontWeight: 600 }}>add a patient</a> first.
            </div>
          )}
          {errors.patient_id && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.patient_id.message}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Consultation Type <span style={{ color: '#e74c3c' }}>*</span></label>
          <select {...register('consultation_type', { required: 'Type is required' })} className="form-control">
            <option value="">Select type…</option>
            {CONSULTATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.consultation_type && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.consultation_type.message}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Chief Complaint <span style={{ color: '#e74c3c' }}>*</span></label>
          <textarea {...register('chief_complaint', { required: 'Chief complaint is required' })} className="form-control" rows={3} placeholder="Describe the primary reason for consultation…" />
          {errors.chief_complaint && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.chief_complaint.message}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Scheduled Time</label>
          <input type="datetime-local" {...register('scheduled_time')} className="form-control" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button type="submit" disabled={mut.isPending} style={{
          padding: '9px 22px', background: 'var(--teal)', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: mut.isPending ? 'not-allowed' : 'pointer', opacity: mut.isPending ? 0.7 : 1,
        }}>
          {mut.isPending ? 'Creating…' : 'Create Consultation'}
        </button>
      </div>
    </form>
  )
}
