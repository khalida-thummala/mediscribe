import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Badge from '@/components/shared/Badge'
import Modal from '@/components/shared/Modal'
import { patientsApi } from '@/api/patients'
import { calcAge } from '@/utils'
import { format } from 'date-fns'
import type { Patient, CreatePatientPayload } from '@/types'

const addPatientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  medical_id: z.string().min(1, 'Medical ID is required'),
  blood_type: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  allergies: z.string().optional(),
})

type AddPatientForm = z.infer<typeof addPatientSchema>

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddPatientForm>({
    resolver: zodResolver(addPatientSchema),
    defaultValues: {
      gender: 'male'
    }
  })

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on new search
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients', { page, search: debouncedSearch }],
    queryFn: () => patientsApi.list({ page, limit: 20, search: debouncedSearch }),
  })

  if (isError) {
    toast.error('Failed to load patients')
  }

  const createMutation = useMutation({
    mutationFn: (newPatient: CreatePatientPayload) => patientsApi.create(newPatient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      setAddOpen(false)
      reset()
      toast.success('Patient record created!')
    },
    onError: () => {
      toast.error('Failed to create patient')
    }
  })

  const onSubmit = (formData: AddPatientForm) => {
    createMutation.mutate(formData as CreatePatientPayload)
  }

  const patients: Patient[] = data?.data || []
  const total = data?.total || 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{total} registered patients</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px' }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>🔍</span>
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by name, MRN…" 
              style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13.5, outline: 'none', width: 200 }} 
            />
          </div>
          <button className="btn btn-primary" onClick={() => { reset(); setAddOpen(true); }}>+ Add Patient</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Name', 'MRN', 'Age', 'Gender', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} style={{ background: 'var(--surface-2)', padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center' }}>
                    <div className="animate-pulse">Loading patients...</div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
                    No patients found
                  </td>
                </tr>
              ) : patients.map((p) => (
                <tr key={p.patient_id} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>
                    {p.first_name} {p.last_name}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', color: 'var(--text-3)', fontSize: 13 }}>{p.medical_id}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>{calcAge(p.date_of_birth)}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5, textTransform: 'capitalize' }}>{p.gender}</td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                    <Badge variant={p.status === 'active' ? 'green' : 'gray'}>{p.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-3)' }}>
                    {p.created_at ? format(new Date(p.created_at), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td style={{ padding: '13px 14px', borderBottom: '1px solid var(--border)' }}>
                    <button className="btn btn-sm" onClick={() => navigate(`/patients/${p.patient_id}`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination control could be added here if needed */}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Patient"
        footer={<>
          <button className="btn" onClick={() => setAddOpen(false)} disabled={createMutation.isPending}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Adding...' : 'Add Patient'}
          </button>
        </>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>First Name *</label>
            <input {...register('first_name')} className="form-control" placeholder="First name" />
            {errors.first_name && <span style={{ color: 'red', fontSize: 11 }}>{errors.first_name.message}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Last Name *</label>
            <input {...register('last_name')} className="form-control" placeholder="Last name" />
            {errors.last_name && <span style={{ color: 'red', fontSize: 11 }}>{errors.last_name.message}</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Date of Birth *</label>
            <input type="date" {...register('date_of_birth')} className="form-control" />
            {errors.date_of_birth && <span style={{ color: 'red', fontSize: 11 }}>{errors.date_of_birth.message}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Gender *</label>
            <select {...register('gender')} className="form-control">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Medical ID / MRN *</label>
            <input {...register('medical_id')} className="form-control" placeholder="MRN-XXXXXX" />
            {errors.medical_id && <span style={{ color: 'red', fontSize: 11 }}>{errors.medical_id.message}</span>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Blood Type</label>
            <select {...register('blood_type')} className="form-control">
              <option value="">—</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Phone</label>
            <input {...register('phone')} className="form-control" placeholder="+91-XXXXXXXXXX" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Email</label>
            <input type="email" {...register('email')} className="form-control" placeholder="patient@email.com" />
            {errors.email && <span style={{ color: 'red', fontSize: 11 }}>{errors.email.message}</span>}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Known Allergies</label>
          <textarea {...register('allergies')} className="form-control" rows={2} placeholder="NKDA or list allergies…" />
        </div>
      </Modal>
    </div>
  )
}
