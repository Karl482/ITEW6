<template>
  <div>
    <div class="page-head">
      <div>
        <h6 class="page-title">
          <i class="bi me-2" :class="auth.isStudent.value ? 'bi-person-badge-fill' : 'bi-person-workspace'"></i>
          {{ auth.isStudent.value ? 'My Enrolled Subjects' : 'Handled Subjects' }}
        </h6>
        <p class="page-sub">
          {{ auth.isStudent.value
            ? 'Subjects available for your section this semester.'
            : 'Subjects assigned to you this semester.' }}
        </p>
      </div>
      <div class="search-wrap">
        <i class="bi bi-search"></i>
        <input v-model="search" type="text" placeholder="Search subject…" />
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">Subject List</span>
        <span class="count-badge">{{ filtered.length }} subject{{ filtered.length !== 1 ? 's' : '' }}</span>
      </div>

      <div v-if="loading" class="empty-state">
        <i class="bi bi-arrow-repeat spin"></i> Loading…
      </div>
      <div v-else-if="filtered.length === 0" class="empty-state">
        <i class="bi bi-journal-x"></i>
        <span>No subjects found for your section.</span>
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="ps">Code</th>
              <th>Description</th>
              <th>Course</th>
              <th>Units</th>
              <th>Schedule</th>
              <th>{{ auth.isStudent.value ? 'Instructor' : 'Section' }}</th>
              <th>Room</th>
              <th>{{ auth.isStudent.value ? 'Status' : 'Enrolled' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filtered" :key="s.id">
              <td class="ps"><strong>{{ s.code }}</strong></td>
              <td>{{ s.description }}</td>
              <td>
                <span class="course-badge" v-if="s.course">{{ s.course }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td class="center">{{ s.units }}</td>
              <td style="white-space:nowrap">{{ s.schedule || '—' }}</td>
              <td>{{ auth.isStudent.value ? (s.faculty?.name || '—') : s.section }}</td>
              <td>{{ s.room || '—' }}</td>
              <td>
                <span v-if="auth.isStudent.value" class="badge badge-pass">Enrolled</span>
                <span v-else>{{ s.enrolled }} students</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import { supabase } from '@/lib/supabase.js'

const auth    = useAuthStore()
const loading = ref(true)
const search  = ref('')
const rows    = ref([])

async function loadData() {
  const user = auth.state.user
  const role = auth.state.role

  if (role === 'student') {
    const { data } = await supabase
      .from('faculty_subjects')
      .select('*, faculty:faculty_id(name)')
      .eq('section', user.section)
      .order('code')
    rows.value = data || []
  } else {
    const { data } = await supabase
      .from('faculty_subjects')
      .select('*')
      .eq('faculty_id', user.id)
      .order('code')
    rows.value = data || []
  }
  loading.value = false
}

let channel
onMounted(() => {
  loadData()
  channel = supabase
    .channel('syllabus-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty_subjects' }, loadData)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter(s =>
    !q ||
    (s.code || '').toLowerCase().includes(q) ||
    (s.description || '').toLowerCase().includes(q) ||
    (s.course || '').toLowerCase().includes(q)
  )
})
</script>

<style scoped>
.page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.page-title{font-size:14px;font-weight:700;color:#1a6b2e;margin:0 0 4px;}
.page-sub{font-size:12px;color:#6c757d;margin:0;}
.search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;padding:7px 12px;min-width:200px;}
.search-wrap i{color:#6c757d;font-size:13px;}
.search-wrap input{border:none;outline:none;font-size:13px;font-family:inherit;width:100%;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.panel-head{padding:12px 16px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.count-badge{font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#eaf4ec;color:#1a6b2e;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
th.ps{padding-left:20px;}
td{padding:10px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
td.ps{padding-left:20px;}
td.center{text-align:center;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.badge{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:700;}
.badge-pass{background:#f0fff4;color:#198754;}
.course-badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:600;background:#eaf4ec;color:#1a6b2e;}
.muted{color:#adb5bd;}
.empty-state{padding:32px;text-align:center;color:#6c757d;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;}
.empty-state i{font-size:20px;color:#d6e4d8;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>