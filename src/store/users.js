

import { reactive, computed } from 'vue'
import { students as sampleStudents, faculty as sampleFaculty } from '@/data/sampleData.js'

// ── Single source of truth ───────────────────────────────────────────────────
const state = reactive({
  users: [
    // Map students from sampleData into a unified user shape
    ...sampleStudents.map(s => ({
      id:          s.id,
      name:        s.name,
      initials:    s.initials,
      role:        'student',
      email:       s.email,
      phone:       s.phone,
      gender:      s.gender,
      status:      'active',
      avatar:      null,
      // student-specific
      program:     s.program,
      yearLevel:   s.yearLevel,
      section:     s.section,
      gpa:         s.grades?.length
        ? (s.grades.reduce((acc, g) => acc + g.finalGrade, 0) / s.grades.length).toFixed(2)
        : '—',
    })),
    // Map faculty from sampleData
    ...sampleFaculty.map(f => ({
      id:              f.id,
      name:            f.name,
      initials:        f.initials,
      role:            'faculty',
      email:           f.email,
      phone:           f.phone,
      gender:          f.gender,
      status:          'active',
      avatar:          null,
      // faculty-specific
      department:      f.department,
      position:        f.position,
      specialization:  f.specialization,
      yearsOfService:  f.yearsOfService,
    })),
  ]
})

// ── Store function ───────────────────────────────────────────────────────────
export function useUsersStore() {

  // Derived state (computed)
  const allUsers    = computed(() => state.users)
  const students    = computed(() => state.users.filter(u => u.role === 'student'))
  const faculty     = computed(() => state.users.filter(u => u.role === 'faculty'))
  const activeCount = computed(() => state.users.filter(u => u.status === 'active').length)
  const totalCount  = computed(() => state.users.length)

  // Mutations 
  function addUser(user) {
    state.users.push({ ...user, id: user.id || `USR-${Date.now()}` })
  }

  function removeUser(id) {
    const idx = state.users.findIndex(u => u.id === id)
    if (idx !== -1) state.users.splice(idx, 1)
  }

  function toggleStatus(id) {
    const user = state.users.find(u => u.id === id)
    if (user) user.status = user.status === 'active' ? 'inactive' : 'active'
  }

  return {
    // state (read)
    users: allUsers, students, faculty, activeCount, totalCount,
    // mutations (write)
    addUser, removeUser, toggleStatus,
  }
}
