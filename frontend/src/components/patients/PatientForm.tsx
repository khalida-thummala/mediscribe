import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { patientsApi } from '@/api/patients'
import toast from 'react-hot-toast'
import type { Patient, CreatePatientPayload } from '@/types'

interface Props {
  initial?: Patient | null
  onSuccess: () => void
}

export default function PatientForm({ initial, onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreatePatientPayload>({
    defaultValues: initial ? {
      first_name: initial.first_name,
      last_name: initial.last_name,
      date_of_birth: initial.date_of_birth,
      gender: initial.gender,
      medical_id: initial.medical_id,
      email: initial.email,
      phone: initial.phone,
      allergies: initial.allergies,
      blood_type: initial.blood_type,
    } : undefined,
  })

  const createMut = useMutation({
    mutationFn: patientsApi.create,
    onSuccess: () => { toast.success('Patient registered'); onSuccess() },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to create patient'),
  })

  const updateMut = useMutation({
    mutationFn: (data: Partial<Patient>) => patientsApi.update(initial!.patient_id, data),
    onSuccess: () => { toast.success('Patient updated'); onSuccess() },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to update patient'),
  })

  const onSubmit = (data: CreatePatientPayload) => {
    if (initial) updateMut.mutate(data as Partial<Patient>)
    else createMut.mutate(data)
  }

  const isPending = createMut.isPending || updateMut.isPending

  const field = (label: string, name: keyof CreatePatientPayload, type = 'text', required = false) => (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
        {label}{required && <span style={{ color: '#e74c3c' }}> *</span>}
      </label>
      <input
        type={type}
        {...register(name, { required: required ? `${label} is required` : false })}
        className="form-control"
        style={{ marginBottom: 0 }}
      />
      {errors[name] && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors[name]?.message as string}</span>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {field('First Name', 'first_name', 'text', true)}
        {field('Last Name', 'last_name', 'text', true)}
        {field('Date of Birth', 'date_of_birth', 'date', true)}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
            Gender <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <select {...register('gender', { required: 'Gender is required' })} className="form-control">
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.gender.message}</span>}
        </div>
        {field('Medical ID', 'medical_id', 'text', true)}
        {field('Blood Type', 'blood_type')}
        {field('Email', 'email', 'email')}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
            Phone <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <input
            type="tel"
            {...register('phone', { 
              required: 'Phone number is required',
              maxLength: { value: 10, message: 'Exactly 10 digits required' },
              minLength: { value: 10, message: 'Exactly 10 digits required' },
              pattern: { value: /^[0-9]+$/, message: 'Numbers only' }
            })}
            maxLength={10}
            className="form-control"
            placeholder="9876543210"
            style={{ marginBottom: 0 }}
          />
          {errors.phone && <span style={{ fontSize: 11, color: '#e74c3c' }}>{errors.phone.message as string}</span>}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Allergies</label>
        <textarea {...register('allergies')} className="form-control" rows={2} placeholder="List known allergies…" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
        <button type="submit" disabled={isPending} style={{
          padding: '9px 22px', background: 'var(--teal)', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 500,
          cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1,
        }}>
          {isPending ? 'Saving…' : initial ? 'Update Patient' : 'Register Patient'}
        </button>
      </div>
    </form>
  )
}
