<template>
  <div>
    <div class="info-bar">
      <i class="bi bi-info-circle"></i>
      <span v-if="auth.isStudent.value">
        Showing subjects for your section: <strong>{{ auth.state.user?.section }}</strong>
      </span>
      <span v-else>Showing your teaching schedule for this semester.</span>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="bi bi-arrow-repeat spin"></i> Loading schedule…
    </div>
    <template v-else>

      <!-- Weekly grid -->
      <div class="panel mb-3">
        <div class="panel-head">
          <span class="panel-title">{{ auth.isStudent.value ? 'Class Schedule' : 'Teaching Schedule' }}</span>
        </div>
        <div class="panel-body" style="overflow-x:auto">
          <div class="week-grid">
            <div v-for="day in weekDays" :key="day">
              <div class="day-label">{{ day }}</div>
              <template v-if="scheduleByDay[day]?.length">
                <div v-for="s in scheduleByDay[day]" :key="s.id" class="sched-block">
                  <div class="sched-code">{{ s.code }}</div>
                  <div class="sched-name">{{ s.description }}</div>
                  <div class="sched-room">{{ s.room }}</div>
                </div>
              </template>
              <div v-else class="no-class">
                <i class="bi bi-dash" style="font-size:18px;color:#d6e4d8;display:block;margin-bottom:4px"></i>
                No class
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary table -->
      <div class="panel">
        <div class="panel-head"><span class="panel-title">Schedule Summary</span></div>
        <div v-if="schedules.length === 0" class="empty-state">
          <i class="bi bi-calendar-x"></i>
          <span>No schedule found for your section.</span>
        </div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="ps">Subject</th>
                <th>Section</th>
                <th>Days</th>
                <th>Time</th>
                <th>Room</th>
                <th>{{ auth.isStudent.value ? 'Instructor' : 'Enrolled' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in schedules" :key="s.id">
                <td class="ps">
                  <strong>{{ s.code }}</strong>
                  <div style="font-size:11px;color:#6c757d">{{ s.description }}</div>
                </td>
                <td>{{ s.section }}</td>
                <td>
                  <span class="days-badge" v-if="s.days">{{ s.days }}</span>
                  <span class="muted" v-else>—</span>
                </td>
                <td style="white-space:nowrap">{{ s.time || s.schedule || '—' }}</td>
                <td>{{ s.room || '—' }}</td>
                <td>
                  {{ auth.isStudent.value
                    ? (s.instructor || s.faculty?.name || '—')
                    : ((s.enrolled ?? '—') + (s.enrolled != null ? ' students' : '')) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import { supabase } from '@/lib/supabase.js'

const auth      = useAuthStore()
const loading   = ref(true)
const schedules = ref([])
const weekDays  = ['Monday','Tuesday','Wednesday','Thursday','Friday']

async function loadData() {
  const user = auth.state.user
  const role = auth.state.role

  if (role === 'student') {
    const { data: schedData } = await supabase
      .from('schedules')
      .select('*')
      .eq('owner_type', 'student')
      .eq('owner_id', user.id)
      .order('code')

    if (schedData && schedData.length > 0) {
      schedules.value = schedData
    } else {
      const { data: subjData } = await supabase
        .from('faculty_subjects')
        .select('*, faculty:faculty_id(name)')
        .eq('section', user.section)
        .order('code')
      schedules.value = subjData || []
    }
  } else {
    const { data: schedData } = await supabase
      .from('schedules')
      .select('*')
      .eq('owner_type', 'faculty')
      .eq('owner_id', user.id)
      .order('code')

    if (schedData && schedData.length > 0) {
      schedules.value = schedData
    } else {
      const { data: subjData } = await supabase
        .from('faculty_subjects')
        .select('*')
        .eq('faculty_id', user.id)
        .order('code')
      schedules.value = subjData || []
    }
  }

  loading.value = false
}

let channel
onMounted(() => {
  loadData()
  channel = supabase
    .channel('scheduling-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty_subjects' }, loadData)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

// Parse schedule string like "MWF 7:30-8:30 AM" into day arrays
function parseDays(s) {
  // Check s.days first (schedules table), then parse s.schedule string (faculty_subjects)
  const raw = (s.days || s.schedule || '').toUpperCase()
  const days = []
  if (raw.includes('MWF'))      { days.push('Monday','Wednesday','Friday') }
  else if (raw.includes('TTH')) { days.push('Tuesday','Thursday') }
  else if (raw.includes('TH'))  { days.push('Tuesday','Thursday') }
  else {
    if (raw.includes('M')) days.push('Monday')
    if (raw.includes('T') && !raw.includes('TH')) days.push('Tuesday')
    if (raw.includes('W')) days.push('Wednesday')
    if (raw.includes('H')) days.push('Thursday')
    if (raw.includes('F')) days.push('Friday')
  }
  return days
}

const scheduleByDay = computed(() => {
  const map = {}
  weekDays.forEach(d => { map[d] = [] })
  schedules.value.forEach(s => {
    parseDays(s).forEach(day => {
      if (map[day] && !map[day].find(x => x.id === s.id)) {
        map[day].push(s)
      }
    })
  })
  return map
})
</script>

<style scoped>
.info-bar{display:flex;align-items:center;gap:8px;background:#eaf4ec;border:1px solid #bee5fd;border-radius:8px;padding:10px 14px;font-size:12px;color:#1a6b2e;margin-bottom:16px;}
.loading-state{padding:60px;text-align:center;color:#6c757d;font-size:13px;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;margin-bottom:14px;}
.panel-head{padding:12px 16px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.panel-body{padding:16px;}
.week-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;min-width:500px;}
.day-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#6c757d;padding:4px 0;border-bottom:2px solid #d6e4d8;margin-bottom:8px;text-align:center;}
.sched-block{background:#1a6b2e;border-radius:8px;padding:9px 11px;margin-bottom:7px;border-left:3px solid #d4a017;}
.sched-code{font-size:11px;font-weight:700;color:#d4a017;margin-bottom:2px;}
.sched-name{font-size:10px;color:rgba(255,255,255,0.8);line-height:1.3;}
.sched-room{font-size:9px;color:rgba(255,255,255,0.5);margin-top:3px;}
.no-class{text-align:center;font-size:11px;color:#adb5bd;padding:16px 0;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
th.ps{padding-left:18px;}
td{padding:10px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
td.ps{padding-left:18px;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.days-badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;background:#eaf4ec;color:#1a6b2e;}
.muted{color:#adb5bd;}
.empty-state{padding:32px;display:flex;align-items:center;justify-content:center;gap:8px;color:#6c757d;font-size:13px;}
.empty-state i{font-size:20px;color:#d6e4d8;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>