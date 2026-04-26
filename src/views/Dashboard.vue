<template>
  <div class="page-body">
    <div v-if="loading" class="loading-state">
      <i class="bi bi-arrow-repeat spin"></i> Loading dashboard…
    </div>
    <template v-else>

      <!-- Stat cards -->
      <div class="stats-grid">
        <div class="stat-card" v-for="s in stats" :key="s.label">
          <div class="stat-icon" :style="{background:s.bg, color:s.color}">
            <i :class="s.icon"></i>
          </div>
          <div>
            <div class="stat-val">{{ s.val }}</div>
            <div class="stat-lbl">{{ s.label }}</div>
            <div class="stat-sub">{{ s.sub }}</div>
          </div>
        </div>
      </div>

      <!-- ── STUDENT: Enrolled Subjects ── -->
      <div v-if="auth.isStudent.value && subjects.length > 0" class="panel mb">
        <div class="panel-head">
          <span class="panel-title">Enrolled Subjects</span>
          <router-link to="/dashboard/syllabus" class="plink">View All</router-link>
        </div>
        <div class="subjects-grid">
          <router-link
            v-for="s in subjects"
            :key="s.id"
            :to="`/dashboard/subject/${s.code}/${encodeURIComponent(s.section)}`"
            class="subj-card"
          >
            <div class="subj-card-top">
              <span class="subj-code">{{ s.code }}</span>
              <span class="subj-units">{{ s.units }} units</span>
            </div>
            <div class="subj-desc">{{ s.description }}</div>
            <div class="subj-meta">
              <span><i class="bi bi-people"></i> {{ s.section }}</span>
              <span><i class="bi bi-clock"></i> {{ s.schedule || '—' }}</span>
            </div>
            <div class="subj-footer">
              <span class="subj-instructor">
                <i class="bi bi-person-fill"></i>
                {{ s.faculty?.name || '—' }}
              </span>
              <span class="subj-room"><i class="bi bi-geo-alt"></i> {{ s.room || '—' }}</span>
            </div>
            <div class="subj-arrow"><i class="bi bi-arrow-right-circle-fill"></i></div>
          </router-link>
        </div>
      </div>

      <!-- ── FACULTY: Handled Subjects ── -->
      <div v-if="auth.isFaculty.value && subjects.length > 0" class="panel mb">
        <div class="panel-head">
          <span class="panel-title">My Subjects</span>
          <router-link to="/dashboard/syllabus" class="plink">View All</router-link>
        </div>
        <div class="subjects-grid">
          <router-link
            v-for="s in subjects"
            :key="s.id"
            :to="`/dashboard/subject/${s.code}/${encodeURIComponent(s.section)}`"
            class="subj-card"
          >
            <div class="subj-card-top">
              <span class="subj-code">{{ s.code }}</span>
              <span class="subj-units">{{ s.units }} units</span>
            </div>
            <div class="subj-desc">{{ s.description }}</div>
            <div class="subj-meta">
              <span><i class="bi bi-people"></i> {{ s.section }}</span>
              <span><i class="bi bi-person-check"></i> {{ s.enrolled }} enrolled</span>
            </div>
            <div class="subj-footer">
              <span class="subj-schedule">
                <i class="bi bi-clock"></i> {{ s.schedule || '—' }}
              </span>
              <span class="subj-room"><i class="bi bi-geo-alt"></i> {{ s.room || '—' }}</span>
            </div>
            <div class="subj-arrow"><i class="bi bi-arrow-right-circle-fill"></i></div>
          </router-link>
        </div>
      </div>

      <!-- Schedule + Events -->
      <div class="row-panels">
        <div class="panel flex-2">
          <div class="panel-head">
            <span class="panel-title">Today's Schedule</span>
            <router-link to="/dashboard/scheduling" class="plink">View All</router-link>
          </div>
          <div v-if="todaySchedule.length === 0" class="empty-msg">No classes scheduled today.</div>
          <div v-for="s in todaySchedule" :key="s.id" class="list-item">
            <div class="li-icon"><i class="bi bi-clock-fill"></i></div>
            <div class="li-body">
              <div class="li-title">{{ s.description }}</div>
              <div class="li-sub">{{ s.code }} · {{ s.room }}</div>
            </div>
            <div class="li-time">{{ s.time || s.schedule || '' }}</div>
          </div>
        </div>
        <div class="panel flex-1">
          <div class="panel-head">
            <span class="panel-title">Upcoming Events</span>
            <router-link to="/dashboard/events" class="plink">See All</router-link>
          </div>
          <div v-if="upcomingEvents.length === 0" class="empty-msg">No upcoming events.</div>
          <div v-for="e in upcomingEvents" :key="e.id" class="list-item">
            <div class="li-icon" style="background:#fff8e1;color:#b8890e">
              <i class="bi bi-calendar-event-fill"></i>
            </div>
            <div class="li-body">
              <div class="li-title">{{ e.title }}</div>
              <div class="li-sub">{{ e.date }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Curriculum Progress (student) -->
      <div class="panel mb" v-if="auth.isStudent.value && subjects.length > 0">
        <div class="panel-head">
          <span class="panel-title">Subjects Overview</span>
          <router-link to="/dashboard/curriculum" class="plink">Details</router-link>
        </div>
        <div class="panel-body">
          <div v-for="s in subjects" :key="s.id" class="prog-row">
            <div class="prog-label-row">
              <span>{{ s.code }} — {{ s.description }}</span>
              <span class="badge-enroll">Enrolled</span>
            </div>
            <div class="prog-bar"><div class="prog-fill" style="width:100%"></div></div>
          </div>
        </div>
      </div>

      <!-- Faculty subject overview -->
      <div class="panel" v-if="auth.isFaculty.value && subjects.length > 0">
        <div class="panel-head">
          <span class="panel-title">Subjects Overview</span>
        </div>
        <div class="panel-body">
          <div v-for="s in subjects" :key="s.id" class="prog-row">
            <div class="prog-label-row">
              <span>{{ s.description }}</span>
              <span>{{ s.enrolled }} / 50 students</span>
            </div>
            <div class="prog-bar">
              <div class="prog-fill" :style="{width: Math.min(100,(s.enrolled/50)*100)+'%'}"></div>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import { supabase } from '@/lib/supabase.js'

const auth     = useAuthStore()
const loading  = ref(true)
const subjects = ref([])
const scheduleRows = ref([])
const events   = ref([])
const grades   = ref([])

async function loadData() {
  const user = auth.state.user
  const role = auth.state.role
  const uid  = user?.id

  if (role === 'student') {
    const [subj, sched, evts, grds] = await Promise.all([
      supabase.from('faculty_subjects')
        .select('*, faculty:faculty_id(name)')
        .eq('section', user.section)
        .order('code'),
      supabase.from('faculty_subjects')
        .select('*')
        .eq('section', user.section)
        .order('code'),
      supabase.from('events')
        .select('*')
        .or(`owner_type.eq.all,and(owner_type.eq.student,owner_id.is.null),and(owner_type.eq.student,owner_id.eq.${uid})`)
        .order('date').limit(3),
      supabase.from('grades')
        .select('*')
        .eq('student_id', uid),
    ])
    subjects.value     = subj.data || []
    scheduleRows.value = sched.data || []
    events.value       = evts.data || []
    grades.value       = grds.data || []
  } else {
    const [subj, sched, evts] = await Promise.all([
      supabase.from('faculty_subjects')
        .select('*').eq('faculty_id', uid).order('code'),
      supabase.from('faculty_subjects')
        .select('*').eq('faculty_id', uid).order('code'),
      supabase.from('events')
        .select('*')
        .or(`owner_type.eq.all,and(owner_type.eq.faculty,owner_id.is.null),and(owner_type.eq.faculty,owner_id.eq.${uid})`)
        .order('date').limit(3),
    ])
    subjects.value     = subj.data || []
    scheduleRows.value = sched.data || []
    events.value       = evts.data || []
  }
  loading.value = false
}

let channel
onMounted(() => {
  loadData()
  channel = supabase
    .channel('dashboard-user-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty_subjects' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, loadData)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

// Today's schedule — parse "MWF 7:30-8:30 AM" type strings
const todayName = new Date().toLocaleDateString('en-US', { weekday:'long' })
const dayLetterMap = {
  Monday:'M', Tuesday:'T', Wednesday:'W', Thursday:'H', Friday:'F'
}

const todaySchedule = computed(() => {
  const letter = dayLetterMap[todayName] || ''
  return scheduleRows.value.filter(s => {
    const raw = (s.days || s.schedule || '').toUpperCase()
    if (raw.includes('MWF')  && ['M','W','F'].includes(letter)) return true
    if ((raw.includes('TTH')||raw.includes('TH')) && ['T','H'].includes(letter)) return true
    if (raw === letter) return true
    return false
  }).slice(0, 3)
})

const upcomingEvents = computed(() => events.value.slice(0, 3))

const gpa = computed(() => {
  const g = grades.value.filter(x => x.final_grade)
  if (!g.length) return '—'
  return (g.reduce((a,b) => a + parseFloat(b.final_grade), 0) / g.length).toFixed(2)
})

const stats = computed(() => {
  if (auth.isStudent.value) return [
    { label:'Enrolled Subjects', val: subjects.value.length,                                         sub:'This semester',  icon:'bi bi-journals',        bg:'#eaf4ec', color:'#1a6b2e' },
    { label:'Passed Subjects',   val: grades.value.filter(g=>g.remarks==='Passed').length,           sub:'Recorded',       icon:'bi bi-check2-circle',   bg:'#f0fff4', color:'#198754' },
    { label:'Current GPA',       val: gpa.value,                                                     sub:'This semester',  icon:'bi bi-award',           bg:'#fff8e1', color:'#b8890e' },
    { label:'Section',           val: auth.state.user?.section || '—',                              sub:'Your class',     icon:'bi bi-people-fill',     bg:'#f5f0ff', color:'#6f42c1' },
  ]
  return [
    { label:'Total Students',    val: subjects.value.reduce((a,b)=>a+(b.enrolled||0),0),             sub:'All sections',   icon:'bi bi-people',          bg:'#eaf4ec', color:'#1a6b2e' },
    { label:'Subjects Handled',  val: subjects.value.length,                                          sub:'This semester',  icon:'bi bi-journals',        bg:'#f0fff4', color:'#198754' },
    { label:'Classes Today',     val: todaySchedule.value.length,                                     sub:'Scheduled',      icon:'bi bi-calendar-check',  bg:'#fff8e1', color:'#b8890e' },
    { label:'Department',        val: auth.state.user?.department || '—',                            sub:'Your dept.',     icon:'bi bi-building',        bg:'#f5f0ff', color:'#6f42c1' },
  ]
})
</script>

<style scoped>
.page-body{padding:20px 22px;}
.loading-state{padding:60px;text-align:center;color:#6c757d;font-size:14px;}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px;}
.stat-card{background:#fff;border:1px solid #d6e4d8;border-radius:10px;padding:16px;display:flex;align-items:flex-start;gap:12px;}
.stat-icon{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.stat-val{font-size:22px;font-weight:700;color:#1a6b2e;line-height:1;}
.stat-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6c757d;margin-top:3px;}
.stat-sub{font-size:10px;color:#6c757d;margin-top:2px;}
/* Subjects grid */
.subjects-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:14px;}
.subj-card{background:#f8f9fa;border:1px solid #d6e4d8;border-radius:10px;padding:14px;text-decoration:none;color:inherit;position:relative;transition:all .15s;display:block;}
.subj-card:hover{background:#eaf4ec;border-color:#1a6b2e;transform:translateY(-1px);box-shadow:0 4px 12px rgba(13,59,102,0.1);}
.subj-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.subj-code{font-size:12px;font-weight:700;color:#fff;background:#1a6b2e;padding:2px 9px;border-radius:5px;}
.subj-units{font-size:10px;font-weight:600;color:#6c757d;}
.subj-desc{font-size:13px;font-weight:600;color:#212529;margin-bottom:8px;line-height:1.4;}
.subj-meta{display:flex;gap:12px;font-size:10px;color:#6c757d;margin-bottom:6px;flex-wrap:wrap;}
.subj-meta span{display:flex;align-items:center;gap:3px;}
.subj-footer{display:flex;justify-content:space-between;font-size:10px;color:#6c757d;flex-wrap:wrap;gap:4px;}
.subj-instructor,.subj-schedule,.subj-room{display:flex;align-items:center;gap:3px;}
.subj-arrow{position:absolute;bottom:12px;right:12px;font-size:16px;color:#d6e4d8;}
.subj-card:hover .subj-arrow{color:#1a6b2e;}
/* Panels */
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.mb{margin-bottom:14px;}
.panel-head{padding:12px 16px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.plink{font-size:11px;font-weight:700;color:#1a6b2e;text-decoration:none;}
.panel-body{padding:14px 16px;}
/* Row panels */
.row-panels{display:flex;gap:14px;margin-bottom:14px;}
.flex-2{flex:2;}.flex-1{flex:1;}
.list-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f8f9fa;}
.list-item:last-child{border-bottom:none;}
.li-icon{width:32px;height:32px;border-radius:9px;background:#eaf4ec;color:#1a6b2e;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
.li-body{flex:1;min-width:0;}
.li-title{font-size:12px;font-weight:600;color:#212529;}
.li-sub{font-size:10px;color:#6c757d;}
.li-time{font-size:10px;color:#1a6b2e;font-weight:600;white-space:nowrap;}
.empty-msg{padding:18px 16px;font-size:12px;color:#6c757d;}
/* Progress */
.prog-row{margin-bottom:12px;}
.prog-label-row{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;color:#212529;margin-bottom:4px;}
.prog-bar{height:5px;background:#e9ecef;border-radius:99px;overflow:hidden;}
.prog-fill{height:100%;border-radius:99px;background:#1a6b2e;transition:width .4s;}
.badge-enroll{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;background:#f0fff4;color:#198754;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
@media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr);}.row-panels{flex-direction:column;}.subjects-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:600px){.subjects-grid{grid-template-columns:1fr;}}
</style>