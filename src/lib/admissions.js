// src/lib/admissions.js
// ─────────────────────────────────────────────────────────────
//  Admissions service — all DB operations for the admissions
//  pipeline. Used by both admin views and the applicant portal.
// ─────────────────────────────────────────────────────────────
import { supabase } from '@/lib/supabase.js'
import { logActivity } from '@/lib/activityLog.js'

// ── Status labels & colours ───────────────────────────────────
export const STATUS_META = {
  pending:              { label: 'Pending',           color: '#6c757d', bg: '#f0f0f0',   icon: 'bi-hourglass'           },
  document_submission:  { label: 'Awaiting Docs',     color: '#0d6efd', bg: '#e7f1ff',   icon: 'bi-cloud-upload'        },
  document_review:      { label: 'Doc Review',        color: '#6f42c1', bg: '#f0ebff',   icon: 'bi-file-earmark-check'  },
  exam:                 { label: 'For Exam',          color: '#d4a017', bg: '#fff8e1',   icon: 'bi-pencil-square'       },
  enrolled:             { label: 'Enrolled',          color: '#198754', bg: '#d1f5e0',   icon: 'bi-mortarboard-fill'    },
  rejected:             { label: 'Rejected',          color: '#dc3545', bg: '#fde8ea',   icon: 'bi-x-circle-fill'       },
}

// ── Next stage after admin action ────────────────────────────
export const NEXT_STATUS = {
  pending:             'document_submission',
  document_submission: 'document_review',
  document_review:     'exam',
}

// ── Fetch all applicants (admin) ──────────────────────────────
export async function fetchApplicants(statusFilter = null) {
  let q = supabase
    .from('applicants')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusFilter) q = q.eq('status', statusFilter)

  const { data, error } = await q
  if (error) throw error
  return data
}

// ── Fetch single applicant with docs + exam ───────────────────
export async function fetchApplicantDetail(id) {
  const [appRes, docsRes, examRes] = await Promise.all([
    supabase.from('applicants').select('*').eq('id', id).single(),
    supabase.from('applicant_documents').select('*').eq('applicant_id', id).order('uploaded_at'),
    supabase.from('applicant_exams').select('*').eq('applicant_id', id).order('created_at', { ascending: false }).limit(1).single(),
  ])

  if (appRes.error) throw appRes.error
  return {
    applicant: appRes.data,
    documents: docsRes.data || [],
    exam:      examRes.data || null,
  }
}

// ── Create applicant (public apply form) ─────────────────────
export async function createApplicant(formData) {
  const { data, error } = await supabase
    .from('applicants')
    .insert({ ...formData, status: 'pending' })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Admin: advance status ─────────────────────────────────────
export async function advanceStatus(applicant, adminId, adminName) {
  const next = NEXT_STATUS[applicant.status]
  if (!next) throw new Error('No next stage available')

  const { error } = await supabase
    .from('applicants')
    .update({ status: next, updated_at: new Date() })
    .eq('id', applicant.id)

  if (error) throw error

  await logActivity({
    actorType:  'admin',
    actorId:    adminId,
    actorName:  adminName,
    action:     `Advanced applicant to "${STATUS_META[next].label}"`,
    targetType: 'applicant',
    targetId:   applicant.id,
    targetName: applicant.full_name,
  })

  return next
}

// ── Admin: save exam details ──────────────────────────────────
export async function saveExam(applicantId, examData, existingExamId = null) {
  if (existingExamId) {
    const { error } = await supabase
      .from('applicant_exams')
      .update({ ...examData, updated_at: new Date() })
      .eq('id', existingExamId)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('applicant_exams')
      .insert({ applicant_id: applicantId, ...examData })
    if (error) throw error
  }
}

// ── Admin: mark document reviewed ────────────────────────────
export async function reviewDocument(docId, reviewed, notes = '') {
  const { error } = await supabase
    .from('applicant_documents')
    .update({ reviewed, review_notes: notes })
    .eq('id', docId)
  if (error) throw error
}

// ── Admin: ENROLL applicant → create student record ──────────
export async function enrollApplicant(applicant, adminId, adminName) {
  // 1. Generate student ID (year-NNNNN)
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
  const studentId = `${year}-${String((count || 0) + 1).padStart(5, '0')}`

  // 2. Derive initials
  const parts    = applicant.full_name.trim().split(' ')
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()

  // 3. Insert into students table
  const { error: stuError } = await supabase.from('students').insert({
    id:         studentId,
    initials,
    name:       applicant.full_name,
    email:      applicant.email,
    phone:      applicant.phone    || '',
    address:    applicant.address  || '',
    gender:     applicant.gender   || '',
    date_of_birth: applicant.birthday
      ? new Date(applicant.birthday).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
      : '',
    program:    applicant.program,
    year_level: '1st Year',
    section:    'TBA',
    semester:   `1st Semester, A.Y. ${year}-${year + 1}`,
  })
  if (stuError) throw stuError

  // 4. Update applicant record
  const { error: appError } = await supabase
    .from('applicants')
    .update({ status: 'enrolled', enrolled_as: studentId, updated_at: new Date() })
    .eq('id', applicant.id)
  if (appError) throw appError

  // 5. Log
  await logActivity({
    actorType:  'admin',
    actorId:    adminId,
    actorName:  adminName,
    action:     'Enrolled applicant as student',
    targetType: 'student',
    targetId:   studentId,
    targetName: applicant.full_name,
    details:    { applicant_id: applicant.id, student_id: studentId },
  })

  return studentId
}

// ── Admin: REJECT applicant ───────────────────────────────────
export async function rejectApplicant(applicant, reason, adminId, adminName) {
  const { error } = await supabase
    .from('applicants')
    .update({ status: 'rejected', rejection_reason: reason, updated_at: new Date() })
    .eq('id', applicant.id)
  if (error) throw error

  await logActivity({
    actorType:  'admin',
    actorId:    adminId,
    actorName:  adminName,
    action:     'Rejected applicant',
    targetType: 'applicant',
    targetId:   applicant.id,
    targetName: applicant.full_name,
    details:    { reason },
  })
}

// ── Admin: update internal notes ──────────────────────────────
export async function updateNotes(applicantId, notes) {
  const { error } = await supabase
    .from('applicants')
    .update({ notes, updated_at: new Date() })
    .eq('id', applicantId)
  if (error) throw error
}

// ── Applicant: upload document ────────────────────────────────
export async function uploadDocument(applicantId, file, documentType, label) {
  // Upload to Supabase Storage bucket "applicant-docs"
  const ext      = file.name.split('.').pop()
  const path     = `${applicantId}/${documentType}_${Date.now()}.${ext}`

  const { error: upErr } = await supabase.storage
    .from('applicant-docs')
    .upload(path, file, { upsert: true })
  if (upErr) throw upErr

  const { data: urlData } = supabase.storage
    .from('applicant-docs')
    .getPublicUrl(path)

  const { error: dbErr } = await supabase.from('applicant_documents').insert({
    applicant_id:  applicantId,
    document_type: documentType,
    label,
    file_url:      urlData.publicUrl,
    file_name:     file.name,
    file_size:     file.size,
  })
  if (dbErr) throw dbErr
}

// ── Helper: counts per status (for admin dashboard cards) ────
export async function fetchAdmissionCounts() {
  const { data, error } = await supabase
    .from('applicants')
    .select('status')
  if (error) throw error

  const counts = { total: data.length }
  Object.keys(STATUS_META).forEach(s => { counts[s] = 0 })
  data.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })
  return counts
}