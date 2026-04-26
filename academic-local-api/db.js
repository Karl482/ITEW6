/**
 * db.js — Database switcher
 *
 * LOCAL  (npm run dev)  → calls your Express/MongoDB API at localhost:3001
 * PROD   (npm run build) → calls Supabase directly
 *
 * Set in .env:
 *   VITE_USE_LOCAL_API=true   ← use MongoDB (local)
 *   VITE_USE_LOCAL_API=false  ← use Supabase (production)
 */

import { supabase } from './supabase.js'

const USE_LOCAL = import.meta.env.VITE_USE_LOCAL_API === 'true'
const API_URL   = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3001/api'

// ── Low-level fetch helper ───────────────────────────────────
async function api(method, path, body = null, params = {}) {
  const url = new URL(`${API_URL}${path}`)
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) url.searchParams.set(k, v) })
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body && method !== 'GET') opts.body = JSON.stringify(body)
  const res  = await fetch(url.toString(), opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'API error')
  return data
}

// ────────────────────────────────────────────────────────────
//  AUTH
// ────────────────────────────────────────────────────────────
export async function dbLogin(role, id, password) {
  if (USE_LOCAL) {
    const data = await api('POST', '/auth/login', { role, id, password })
    return { data, error: null }
  }
  // Supabase: auth is handled in auth.js, this is just a passthrough
  return { data: null, error: null }
}

// ────────────────────────────────────────────────────────────
//  FACULTY
// ────────────────────────────────────────────────────────────
export async function getFaculty(filter = {}) {
  if (USE_LOCAL) return api('GET', '/faculty', null, filter)
  const { data } = await supabase.from('faculty').select('*').order('name')
  return data || []
}

export async function getFacultyById(id) {
  if (USE_LOCAL) return api('GET', `/faculty/${id}`)
  const { data } = await supabase.from('faculty').select('*').eq('id', id).single()
  return data
}

export async function createFaculty(payload) {
  if (USE_LOCAL) return api('POST', '/faculty', payload)
  const { data, error } = await supabase.from('faculty').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateFaculty(id, payload) {
  if (USE_LOCAL) return api('PUT', `/faculty/${id}`, payload)
  const { data, error } = await supabase.from('faculty').update({ ...payload, updated_at: new Date() }).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteFaculty(id) {
  if (USE_LOCAL) return api('DELETE', `/faculty/${id}`)
  await supabase.from('faculty').delete().eq('id', id)
}

// ────────────────────────────────────────────────────────────
//  STUDENTS
// ────────────────────────────────────────────────────────────
export async function getStudents() {
  if (USE_LOCAL) return api('GET', '/students')
  const { data } = await supabase.from('students').select('*, faculty:adviser_id(name, department)').order('name')
  return data || []
}

export async function getStudentById(id) {
  if (USE_LOCAL) return api('GET', `/students/${id}`)
  const { data } = await supabase.from('students').select('*, faculty:adviser_id(name,department,email,phone,initials)').eq('id', id).single()
  return data
}

export async function getStudentLastId() {
  if (USE_LOCAL) return api('GET', '/students/last-id')
  const year = new Date().getFullYear()
  const { data } = await supabase.from('students').select('id').like('id', `${year}-%`).order('id', { ascending: false }).limit(1)
  return { last_id: data?.[0]?.id || null }
}

export async function getStudentsByAdviser(adviserId) {
  if (USE_LOCAL) return api('GET', '/students', null, { adviser_id: adviserId })
  const { data } = await supabase.from('students').select('id,initials,name,program,year_level,section').eq('adviser_id', adviserId).order('name')
  return data || []
}

export async function createStudent(payload) {
  if (USE_LOCAL) return api('POST', '/students', payload)
  const { data, error } = await supabase.from('students').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateStudent(id, payload) {
  if (USE_LOCAL) return api('PUT', `/students/${id}`, payload)
  const { data, error } = await supabase.from('students').update({ ...payload, updated_at: new Date() }).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteStudent(id) {
  if (USE_LOCAL) return api('DELETE', `/students/${id}`)
  await supabase.from('students').delete().eq('id', id)
}

// ────────────────────────────────────────────────────────────
//  GRADES
// ────────────────────────────────────────────────────────────
export async function getGrades(studentId) {
  if (USE_LOCAL) return api('GET', '/grades', null, { student_id: studentId })
  const { data } = await supabase.from('grades').select('*').eq('student_id', studentId).order('code')
  return data || []
}

export async function upsertGrade(payload, editingId = null) {
  if (USE_LOCAL) {
    if (editingId) return api('PUT', `/grades/${editingId}`, payload)
    return api('POST', '/grades', payload)
  }
  if (editingId) {
    await supabase.from('grades').update({ ...payload, updated_at: new Date() }).eq('id', editingId)
  } else {
    await supabase.from('grades').insert(payload)
  }
}

export async function deleteGrade(id) {
  if (USE_LOCAL) return api('DELETE', `/grades/${id}`)
  await supabase.from('grades').delete().eq('id', id)
}

// ────────────────────────────────────────────────────────────
//  FACULTY SUBJECTS
// ────────────────────────────────────────────────────────────
export async function getFacultySubjects(filter = {}) {
  if (USE_LOCAL) return api('GET', '/faculty-subjects', null, filter)
  let q = supabase.from('faculty_subjects').select('*, faculty:faculty_id(name,department)').order('code')
  if (filter.faculty_id) q = q.eq('faculty_id', filter.faculty_id)
  if (filter.section)    q = q.eq('section', filter.section)
  const { data } = await q
  return data || []
}

export async function createFacultySubject(payload) {
  if (USE_LOCAL) return api('POST', '/faculty-subjects', payload)
  const { data, error } = await supabase.from('faculty_subjects').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateFacultySubject(id, payload) {
  if (USE_LOCAL) return api('PUT', `/faculty-subjects/${id}`, payload)
  await supabase.from('faculty_subjects').update({ ...payload, updated_at: new Date() }).eq('id', id)
}

export async function deleteFacultySubject(id) {
  if (USE_LOCAL) return api('DELETE', `/faculty-subjects/${id}`)
  await supabase.from('faculty_subjects').delete().eq('id', id)
}

// ────────────────────────────────────────────────────────────
//  EVENTS
// ────────────────────────────────────────────────────────────
export async function getEvents(ownerType = null, ownerId = null) {
  if (USE_LOCAL) return api('GET', '/events', null, { owner_type: ownerType, owner_id: ownerId })
  if (!ownerType) {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false })
    return data || []
  }
  const { data } = await supabase.from('events').select('*')
    .or(`owner_type.eq.all,and(owner_type.eq.${ownerType},owner_id.is.null),and(owner_type.eq.${ownerType},owner_id.eq.${ownerId})`)
    .order('date')
  return data || []
}

export async function createEvent(payload) {
  if (USE_LOCAL) return api('POST', '/events', payload)
  const { data, error } = await supabase.from('events').insert(payload).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateEvent(id, payload) {
  if (USE_LOCAL) return api('PUT', `/events/${id}`, payload)
  await supabase.from('events').update({ ...payload, updated_at: new Date() }).eq('id', id)
}

export async function deleteEvent(id) {
  if (USE_LOCAL) return api('DELETE', `/events/${id}`)
  await supabase.from('events').delete().eq('id', id)
}

// ────────────────────────────────────────────────────────────
//  ACTIVITY LOGS
// ────────────────────────────────────────────────────────────
export async function getLogs() {
  if (USE_LOCAL) return api('GET', '/activity-logs')
  const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500)
  return data || []
}

export async function addLog(payload) {
  if (USE_LOCAL) return api('POST', '/activity-logs', {
    actor_type:  payload.actorType,
    actor_id:    payload.actorId,
    actor_name:  payload.actorName,
    action:      payload.action,
    target_type: payload.targetType,
    target_id:   payload.targetId,
    target_name: payload.targetName,
    details:     payload.details,
  })
  await supabase.from('activity_logs').insert({
    actor_type:  payload.actorType,
    actor_id:    payload.actorId,
    actor_name:  payload.actorName,
    action:      payload.action,
    target_type: payload.targetType,
    target_id:   payload.targetId,
    target_name: payload.targetName,
    details:     payload.details,
  })
}

// ────────────────────────────────────────────────────────────
//  STATS (admin dashboard)
// ────────────────────────────────────────────────────────────
export async function getStats() {
  if (USE_LOCAL) return api('GET', '/stats')
  const [s, f, sub, e] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('faculty').select('id', { count: 'exact', head: true }),
    supabase.from('faculty_subjects').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
  ])
  return { students: s.count||0, faculty: f.count||0, subjects: sub.count||0, events: e.count||0 }
}

// ────────────────────────────────────────────────────────────
//  STUDENT PROFILE EXTENSIONS (generic CRUD)
// ────────────────────────────────────────────────────────────
export async function getStudentExt(table, studentId) {
  const mongoPath = {
    student_affiliations:        'student-affiliations',
    student_skills:              'student-skills',
    student_academic_history:    'student-academic-history',
    student_nonacademic_history: 'student-nonacademic-history',
    student_violations:          'student-violations',
  }
  if (USE_LOCAL) return api('GET', `/${mongoPath[table]}`, null, { student_id: studentId })
  const { data } = await supabase.from(table).select('*').eq('student_id', studentId).order('created_at', { ascending: false })
  return data || []
}

export async function upsertStudentExt(table, payload, editingId = null) {
  const mongoPath = {
    student_affiliations:        'student-affiliations',
    student_skills:              'student-skills',
    student_academic_history:    'student-academic-history',
    student_nonacademic_history: 'student-nonacademic-history',
    student_violations:          'student-violations',
  }
  if (USE_LOCAL) {
    if (editingId) return api('PUT', `/${mongoPath[table]}/${editingId}`, payload)
    return api('POST', `/${mongoPath[table]}`, payload)
  }
  if (editingId) {
    await supabase.from(table).update(payload).eq('id', editingId)
  } else {
    await supabase.from(table).insert(payload)
  }
}

export async function deleteStudentExt(table, id) {
  const mongoPath = {
    student_affiliations:        'student-affiliations',
    student_skills:              'student-skills',
    student_academic_history:    'student-academic-history',
    student_nonacademic_history: 'student-nonacademic-history',
    student_violations:          'student-violations',
  }
  if (USE_LOCAL) return api('DELETE', `/${mongoPath[table]}/${id}`)
  await supabase.from(table).delete().eq('id', id)
}
