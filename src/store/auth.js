import { reactive, computed } from 'vue'
import { supabase } from '@/lib/supabase.js'

// ── Restore session from localStorage on page load ──────────────
const SESSION_KEY = 'auth_session'

function loadPersistedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return { user: null, role: null }
    return JSON.parse(raw)
  } catch {
    return { user: null, role: null }
  }
}

function persistSession(user, role) {
  if (user && role) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, role }))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

const persisted = loadPersistedSession()
const state = reactive({
  user: persisted.user,
  role: persisted.role,
  loading: false,
  error: null,
})

export function useAuthStore() {

  async function login(role, idOrEmail, password) {
    state.loading = true
    state.error   = null

    try {
      // ── Admin ──────────────────────────────────────────────
      if (role === 'admin') {
        if (password !== 'admin1234') throw new Error('Invalid admin credentials')
        const { data, error } = await supabase
          .from('admins').select('*').eq('email', idOrEmail).single()
        if (error || !data) throw new Error('Admin not found')
        state.user = data
        state.role = 'admin'
        persistSession(data, 'admin')
        return { ok: true }
      }

      // ── Student ────────────────────────────────────────────
      // Password = last 5 digits of ID + birth year
      // e.g. ID 2024-20154, born 02/08/2004 → 20154 + 2004 = 201542004
      if (role === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('*, faculty:adviser_id(name, department, email)')
          .eq('id', idOrEmail).single()
        if (error || !data) throw new Error('Student not found')

        const birthYear = extractBirthYear(data.date_of_birth)
        const idDigits  = idOrEmail.replace(/\D/g, '')
        const last5     = idDigits.slice(-5)
        const expectedPassword = last5 + birthYear

        if (password !== expectedPassword) throw new Error('Invalid credentials')
        state.user = data
        state.role = 'student'
        persistSession(data, 'student')
        return { ok: true }
      }

      // ── Faculty ────────────────────────────────────────────
      // Password = last 3 digits of ID + birth year
      // e.g. ID FAC-2015-004, born 1978 → 004 + 1978 = 0041978
      if (role === 'faculty') {
        const { data, error } = await supabase
          .from('faculty').select('*').eq('id', idOrEmail).single()
        if (error || !data) throw new Error('Faculty not found')

        const birthYear = extractBirthYear(data.date_of_birth)
        const idDigits  = idOrEmail.replace(/\D/g, '')
        const last3     = idDigits.slice(-3)
        const expectedPassword = last3 + birthYear

        if (password !== expectedPassword) throw new Error('Invalid credentials')
        state.user = data
        state.role = 'faculty'
        persistSession(data, 'faculty')
        return { ok: true }
      }

      throw new Error('Unknown role')
    } catch (err) {
      state.error = err.message
      return { ok: false, error: err.message }
    } finally {
      state.loading = false
    }
  }

  // Works for: "02/08/2004", "2004-02-08", "March 14, 2002"
  function extractBirthYear(dateOfBirth) {
    if (!dateOfBirth) return ''
    const match = dateOfBirth.match(/\b(19|20)\d{2}\b/)
    return match ? match[0] : ''
  }

  function logout() {
    state.user  = null
    state.role  = null
    state.error = null
    persistSession(null, null)
  }

  const isLoggedIn = computed(() => state.user !== null)
  const isAdmin    = computed(() => state.role === 'admin')
  const isStudent  = computed(() => state.role === 'student')
  const isFaculty  = computed(() => state.role === 'faculty')

  return { state, isLoggedIn, isAdmin, isStudent, isFaculty, login, logout }
}