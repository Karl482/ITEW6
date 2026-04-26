<template>
  <div>
    <div v-if="loading" class="loading-state">
      <i class="bi bi-arrow-repeat spin"></i> Loading profile…
    </div>
    <template v-else>

      <!-- Hero -->
      <div class="profile-hero">
        <div class="hero-avatar">{{ auth.state.user?.initials || '?' }}</div>
        <div class="hero-body">
          <div class="hero-name">{{ auth.state.user?.name }}</div>
          <div class="hero-sub">
            {{ auth.isStudent.value ? 'Student' : 'Faculty' }} ·
            {{ auth.isStudent.value ? auth.state.user?.program : auth.state.user?.department }}
          </div>
          <div class="hero-id">
            <i class="bi bi-id-card"></i> {{ auth.state.user?.id }}
          </div>
        </div>
      </div>

      <!-- Info grid: personal + academic -->
      <div class="info-grid">
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Personal Information</span></div>
          <div class="panel-body">
            <div class="info-row" v-for="f in personalFields" :key="f.label">
              <span class="info-lbl">{{ f.label }}</span>
              <span class="info-val">{{ f.value || '—' }}</span>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">{{ auth.isStudent.value ? 'Academic Information' : 'Professional Information' }}</span>
          </div>
          <div class="panel-body">
            <div class="info-row" v-for="f in roleFields" :key="f.label">
              <span class="info-lbl">{{ f.label }}</span>
              <span class="info-val">{{ f.value || '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Adviser card (student) -->
      <div class="panel mb" v-if="auth.isStudent.value">
        <div class="panel-head"><span class="panel-title">Assigned Adviser</span></div>
        <div class="panel-body">
          <div v-if="adviser" class="adviser-card">
            <div class="adviser-avatar">{{ adviser.initials }}</div>
            <div>
              <div class="adviser-name">{{ adviser.name }}</div>
              <div class="adviser-pos">{{ adviser.position }} · {{ adviser.department }}</div>
              <div class="adviser-meta"><i class="bi bi-envelope"></i> {{ adviser.email }}</div>
              <div class="adviser-meta" v-if="adviser.phone"><i class="bi bi-telephone"></i> {{ adviser.phone }}</div>
            </div>
          </div>
          <div v-else class="empty-inline"><i class="bi bi-person-x"></i> No adviser assigned yet.</div>
        </div>
      </div>

      <!-- Advised students (faculty) -->
      <div class="panel mb" v-if="auth.isFaculty.value">
        <div class="panel-head">
          <span class="panel-title">Advised Students</span>
          <span class="count-badge">{{ advisedStudents.length }}</span>
        </div>
        <div class="panel-body">
          <div v-if="advisedStudents.length===0" class="empty-inline"><i class="bi bi-people"></i> No students assigned.</div>
          <div v-else class="advised-list">
            <div v-for="s in advisedStudents" :key="s.id" class="advised-row">
              <div class="advised-avatar">{{ s.initials }}</div>
              <div class="advised-info">
                <div class="advised-name">{{ s.name }}</div>
                <div class="advised-sub">{{ s.id }} · {{ s.program }} · {{ s.section }}</div>
              </div>
              <span class="section-chip">{{ s.section }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ STUDENT-ONLY SECTIONS ══ -->
      <template v-if="auth.isStudent.value">

        <!-- Grades -->
        <div class="panel mb">
          <div class="panel-head"><span class="panel-title">Grades Summary</span></div>
          <div v-if="grades.length===0" class="empty-table">No grades recorded yet.</div>
          <div v-else class="table-wrap">
            <table>
              <thead><tr><th class="ps">Code</th><th>Description</th><th>Units</th><th>Midterm</th><th>Finals</th><th>Grade</th><th>Remarks</th></tr></thead>
              <tbody>
                <tr v-for="g in grades" :key="g.id">
                  <td class="ps"><strong>{{ g.code }}</strong></td>
                  <td>{{ g.description }}</td>
                  <td class="center">{{ g.units }}</td>
                  <td class="center">{{ g.midterm ?? '—' }}</td>
                  <td class="center">{{ g.finals ?? '—' }}</td>
                  <td class="center"><strong class="grade-val">{{ g.final_grade ?? '—' }}</strong></td>
                  <td><span class="badge" :class="g.remarks==='Passed'?'badge-pass':'badge-fail'">{{ g.remarks||'Pending' }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Affiliations -->
        <div class="panel mb">
          <div class="panel-head">
            <span class="panel-title">Affiliations</span>
            <span class="count-badge">{{ affiliations.length }}</span>
          </div>
          <div v-if="affiliations.length===0" class="empty-table">No affiliations recorded.</div>
          <div v-else class="tag-grid">
            <div v-for="a in affiliations" :key="a.id" class="tag-card">
              <div class="tag-icon" :class="affTypeClass(a.type)">
                <i :class="affTypeIcon(a.type)"></i>
              </div>
              <div>
                <div class="tag-name">{{ a.name }}</div>
                <div class="tag-sub">{{ a.type }} · {{ a.role || 'Member' }}</div>
                <div class="tag-meta">Joined {{ a.year_joined || '—' }}</div>
              </div>
              <span class="status-dot" :class="a.status==='Active'?'dot-active':'dot-inactive'">{{ a.status }}</span>
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="panel mb">
          <div class="panel-head">
            <span class="panel-title">Skills & Talents</span>
            <span class="count-badge">{{ skills.length }}</span>
          </div>
          <div v-if="skills.length===0" class="empty-table">No skills recorded.</div>
          <div v-else class="skills-wrap">
            <span v-for="s in skills" :key="s.id" class="skill-tag" :class="skillCatClass(s.category)">
              <i :class="skillCatIcon(s.category)"></i> {{ s.name }}
            </span>
          </div>
        </div>

        <!-- Academic History -->
        <div class="panel mb">
          <div class="panel-head">
            <span class="panel-title">Academic History</span>
            <span class="count-badge">{{ academicHistory.length }}</span>
          </div>
          <div v-if="academicHistory.length===0" class="empty-table">No academic history recorded.</div>
          <div v-else class="history-list">
            <div v-for="h in academicHistory" :key="h.id" class="history-row">
              <div class="history-year">{{ h.year || '—' }}</div>
              <div class="history-dot"></div>
              <div class="history-body">
                <div class="history-title">{{ h.title }}</div>
                <div class="history-sub">{{ h.institution }}</div>
                <div class="history-desc" v-if="h.description">{{ h.description }}</div>
                <span class="hist-type-badge">{{ h.type }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Non-Academic History -->
        <div class="panel mb">
          <div class="panel-head">
            <span class="panel-title">Non-Academic History</span>
            <span class="count-badge">{{ nonAcademicHistory.length }}</span>
          </div>
          <div v-if="nonAcademicHistory.length===0" class="empty-table">No non-academic history recorded.</div>
          <div v-else class="history-list">
            <div v-for="h in nonAcademicHistory" :key="h.id" class="history-row">
              <div class="history-year">{{ h.year || '—' }}</div>
              <div class="history-dot" style="background:#d4a017"></div>
              <div class="history-body">
                <div class="history-title">{{ h.title }}</div>
                <div class="history-desc" v-if="h.description">{{ h.description }}</div>
                <span class="hist-type-badge" style="background:#fff8e1;color:#b8890e">{{ h.category }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Violations -->
        <div class="panel mb">
          <div class="panel-head">
            <span class="panel-title">Disciplinary Records</span>
            <span class="count-badge" :style="violations.length>0?'background:#fff0f0;color:#dc3545':''">{{ violations.length }}</span>
          </div>
          <div v-if="violations.length===0" class="empty-table clean">
            <i class="bi bi-shield-check" style="color:#198754;font-size:18px"></i> No violations on record.
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead><tr><th class="ps">Date</th><th>Violation</th><th>Severity</th><th>Sanction</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="v in violations" :key="v.id">
                  <td class="ps" style="white-space:nowrap">{{ v.date || '—' }}</td>
                  <td>{{ v.violation }}</td>
                  <td><span class="badge" :class="severityClass(v.severity)">{{ v.severity }}</span></td>
                  <td>{{ v.sanction || '—' }}</td>
                  <td><span class="badge" :class="vStatusClass(v.status)">{{ v.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>

      <!-- Faculty: handled subjects -->
      <div class="panel mb" v-if="auth.isFaculty.value">
        <div class="panel-head"><span class="panel-title">Handled Subjects</span></div>
        <div v-if="subjects.length===0" class="empty-table">No subjects assigned yet.</div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th class="ps">Code</th><th>Description</th><th>Section</th><th>Units</th><th>Schedule</th><th>Room</th><th>Enrolled</th></tr></thead>
            <tbody>
              <tr v-for="s in subjects" :key="s.id">
                <td class="ps"><strong>{{ s.code }}</strong></td>
                <td>{{ s.description }}</td>
                <td>{{ s.section }}</td>
                <td class="center">{{ s.units }}</td>
                <td>{{ s.schedule }}</td>
                <td>{{ s.room }}</td>
                <td class="center">{{ s.enrolled }}</td>
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

const auth    = useAuthStore()
const loading = ref(true)

const adviser          = ref(null)
const advisedStudents  = ref([])
const grades           = ref([])
const subjects         = ref([])
const affiliations     = ref([])
const skills           = ref([])
const academicHistory  = ref([])
const nonAcademicHistory = ref([])
const violations       = ref([])

async function loadData() {
  const user = auth.state.user
  const role = auth.state.role

  if (role === 'student') {
    const tasks = [
      supabase.from('grades').select('*').eq('student_id', user.id).order('code'),
      supabase.from('student_affiliations').select('*').eq('student_id', user.id).order('name'),
      supabase.from('student_skills').select('*').eq('student_id', user.id).order('name'),
      supabase.from('student_academic_history').select('*').eq('student_id', user.id).order('year', { ascending: false }),
      supabase.from('student_nonacademic_history').select('*').eq('student_id', user.id).order('year', { ascending: false }),
      supabase.from('student_violations').select('*').eq('student_id', user.id).order('date', { ascending: false }),
    ]
    if (user.adviser_id) {
      tasks.push(supabase.from('faculty').select('*').eq('id', user.adviser_id).single())
    }
    const results = await Promise.all(tasks)
    grades.value           = results[0].data || []
    affiliations.value     = results[1].data || []
    skills.value           = results[2].data || []
    academicHistory.value  = results[3].data || []
    nonAcademicHistory.value = results[4].data || []
    violations.value       = results[5].data || []
    if (user.adviser_id && results[6]?.data) adviser.value = results[6].data
  }

  if (role === 'faculty') {
    const [subs, advised] = await Promise.all([
      supabase.from('faculty_subjects').select('*').eq('faculty_id', user.id).order('code'),
      supabase.from('students').select('id,initials,name,program,year_level,section').eq('adviser_id', user.id).order('name'),
    ])
    subjects.value        = subs.data || []
    advisedStudents.value = advised.data || []
  }

  loading.value = false
}

let channel
onMounted(() => {
  loadData()
  channel = supabase
    .channel('profile-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_affiliations' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_skills' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_academic_history' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_nonacademic_history' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_violations' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty_subjects' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, loadData)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

// ── Computed fields ──────────────────────────────────────────
const personalFields = computed(() => {
  const u = auth.state.user
  return [
    { label:'Full Name',     value: u?.name },
    { label:'Date of Birth', value: formatDob(u?.date_of_birth) },
    { label:'Email',         value: u?.email },
    { label:'Phone',         value: u?.phone },
    { label:'Address',       value: u?.address },
    { label:'Gender',        value: u?.gender },
  ]
})

const roleFields = computed(() => {
  const u = auth.state.user
  if (auth.isStudent.value) return [
    { label:'Student ID',  value: u?.id },
    { label:'Program',     value: u?.program },
    { label:'Year Level',  value: u?.year_level },
    { label:'Section',     value: u?.section },
    { label:'Semester',    value: u?.semester },
    { label:'Adviser',     value: adviser.value?.name || (u?.adviser_id ? 'Loading…' : 'Not assigned') },
  ]
  return [
    { label:'Employee ID',       value: u?.id },
    { label:'Department',        value: u?.department },
    { label:'Position',          value: u?.position },
    { label:'Specialization',    value: u?.specialization },
    { label:'Years of Service',  value: u?.years_of_service },
    { label:'Education',         value: u?.education },
  ]
})

// ── Helpers ──────────────────────────────────────────────────
function formatDob(dob) {
  if (!dob) return '—'
  // if already like "2004-02-08" → format nicely
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const d = new Date(dob + 'T00:00:00')
    return d.toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })
  }
  return dob
}

const affTypeClass = t => ({ Organization:'aff-org', Sports:'aff-sport', Club:'aff-club', Committee:'aff-comm', Other:'aff-other' }[t]||'aff-other')
const affTypeIcon  = t => ({ Organization:'bi bi-people-fill', Sports:'bi bi-trophy-fill', Club:'bi bi-star-fill', Committee:'bi bi-briefcase-fill', Other:'bi bi-tag-fill' }[t]||'bi bi-tag-fill')
const skillCatClass = c => ({ Academic:'sk-acad', Sports:'sk-sport', Arts:'sk-arts', Technology:'sk-tech', Leadership:'sk-lead', Other:'sk-other' }[c]||'sk-other')
const skillCatIcon  = c => ({ Academic:'bi bi-book', Sports:'bi bi-trophy', Arts:'bi bi-palette', Technology:'bi bi-cpu', Leadership:'bi bi-person-badge', Other:'bi bi-star' }[c]||'bi bi-star')
const severityClass = s => ({ Minor:'badge-minor', Major:'badge-major', Serious:'badge-serious' }[s]||'badge-minor')
const vStatusClass  = s => ({ Pending:'badge-prog', Resolved:'badge-pass', Appealing:'badge-minor' }[s]||'badge-prog')
</script>

<style scoped>
.loading-state{padding:60px;text-align:center;color:#6c757d;font-size:14px;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}

/* Hero */
.profile-hero{background:#1a6b2e;border-radius:12px;padding:24px;display:flex;align-items:center;gap:20px;margin-bottom:16px;position:relative;overflow:hidden;}
.profile-hero::after{content:'';position:absolute;top:-60px;right:-60px;width:200px;height:200px;background:radial-gradient(circle,rgba(233,168,37,0.15),transparent 70%);border-radius:50%;}
.hero-avatar{width:60px;height:60px;border-radius:14px;background:#d4a017;color:#1a6b2e;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;flex-shrink:0;}
.hero-body{}
.hero-name{font-size:18px;font-weight:700;color:#fff;margin-bottom:3px;}
.hero-sub{font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:8px;}
.hero-id{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:rgba(233,168,37,0.2);border:1px solid rgba(233,168,37,0.35);border-radius:20px;font-size:10px;font-weight:700;color:#d4a017;}

/* Layout */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
.mb{margin-bottom:14px;}

/* Panel */
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.panel-head{padding:12px 16px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.panel-body{padding:14px 16px;}
.count-badge{font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#eaf4ec;color:#1a6b2e;}

/* Info rows */
.info-row{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid #f8f9fa;gap:12px;}
.info-row:last-child{border-bottom:none;}
.info-lbl{font-size:11px;color:#6c757d;font-weight:600;flex-shrink:0;}
.info-val{font-size:12px;color:#1a6b2e;font-weight:600;text-align:right;word-break:break-all;}

/* Adviser */
.adviser-card{display:flex;align-items:flex-start;gap:14px;}
.adviser-avatar{width:46px;height:46px;border-radius:12px;background:#fff8e1;color:#b8890e;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;border:2px solid #d4a017;}
.adviser-name{font-size:14px;font-weight:700;color:#1a6b2e;margin-bottom:2px;}
.adviser-pos{font-size:11px;color:#6c757d;margin-bottom:5px;}
.adviser-meta{font-size:11px;color:#495057;display:flex;align-items:center;gap:5px;margin-bottom:2px;}

/* Advised list */
.advised-list{display:flex;flex-direction:column;}
.advised-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f8f9fa;}
.advised-row:last-child{border-bottom:none;}
.advised-avatar{width:30px;height:30px;border-radius:8px;background:#eaf4ec;color:#1a6b2e;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
.advised-info{flex:1;min-width:0;}
.advised-name{font-size:12px;font-weight:600;color:#212529;}
.advised-sub{font-size:10px;color:#6c757d;}
.section-chip{font-size:10px;font-weight:700;padding:2px 8px;background:#f0f4f8;border-radius:20px;color:#1a6b2e;white-space:nowrap;}

/* Empty states */
.empty-inline{display:flex;align-items:center;gap:8px;color:#6c757d;font-size:12px;}
.empty-table{padding:20px 16px;font-size:12px;color:#6c757d;}
.empty-table.clean{display:flex;align-items:center;gap:8px;}

/* Table */
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
th.ps{padding-left:18px;}
td{padding:10px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;}
td.ps{padding-left:18px;}
td.center{text-align:center;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.grade-val{color:#1a6b2e;}

/* Badges */
.badge{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:700;}
.badge-pass   {background:#f0fff4;color:#198754;}
.badge-fail   {background:#fff0f0;color:#dc3545;}
.badge-prog   {background:#eaf4ec;color:#1a6b2e;}
.badge-minor  {background:#fff8e1;color:#b8890e;}
.badge-major  {background:#fff0f0;color:#dc3545;}
.badge-serious{background:#dc3545;color:#fff;}

/* Affiliations grid */
.tag-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:12px 16px;}
.tag-card{display:flex;align-items:flex-start;gap:10px;padding:12px;background:#f8f9fa;border-radius:9px;border:1px solid #d6e4d8;position:relative;}
.tag-icon{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
.aff-org  {background:#eaf4ec;color:#1a6b2e;}
.aff-sport{background:#fff8e1;color:#b8890e;}
.aff-club {background:#f5f0ff;color:#6f42c1;}
.aff-comm {background:#f0fff4;color:#198754;}
.aff-other{background:#f8f9fa;color:#6c757d;}
.tag-name{font-size:12px;font-weight:700;color:#212529;}
.tag-sub{font-size:10px;color:#6c757d;margin-top:1px;}
.tag-meta{font-size:10px;color:#adb5bd;margin-top:2px;}
.status-dot{position:absolute;top:10px;right:10px;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;}
.dot-active  {background:#f0fff4;color:#198754;}
.dot-inactive{background:#f8f9fa;color:#6c757d;}

/* Skills */
.skills-wrap{display:flex;flex-wrap:wrap;gap:8px;padding:14px 16px;}
.skill-tag{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;}
.sk-acad{background:#eaf4ec;color:#1a6b2e;}
.sk-sport{background:#fff8e1;color:#b8890e;}
.sk-arts{background:#f5f0ff;color:#6f42c1;}
.sk-tech{background:#f0fff4;color:#198754;}
.sk-lead{background:#fff0f0;color:#dc3545;}
.sk-other{background:#f8f9fa;color:#6c757d;}

/* History timeline */
.history-list{padding:14px 16px;display:flex;flex-direction:column;gap:0;}
.history-row{display:flex;gap:12px;padding-bottom:16px;position:relative;}
.history-row:not(:last-child)::before{content:'';position:absolute;left:38px;top:22px;bottom:0;width:2px;background:#e9ecef;}
.history-year{width:36px;font-size:11px;font-weight:700;color:#6c757d;text-align:right;padding-top:2px;flex-shrink:0;}
.history-dot{width:12px;height:12px;border-radius:50%;background:#1a6b2e;flex-shrink:0;margin-top:4px;border:2px solid #fff;box-shadow:0 0 0 2px #d6e4d8;}
.history-body{flex:1;min-width:0;}
.history-title{font-size:13px;font-weight:700;color:#212529;margin-bottom:2px;}
.history-sub{font-size:11px;color:#6c757d;margin-bottom:4px;}
.history-desc{font-size:11px;color:#495057;margin-bottom:5px;}
.hist-type-badge{display:inline-block;font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;background:#eaf4ec;color:#1a6b2e;}

@media(max-width:768px){.info-grid{grid-template-columns:1fr;}.tag-grid{grid-template-columns:1fr;}}
</style>