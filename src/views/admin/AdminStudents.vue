<template>
  <div>
    <div class="page-bar">
      <div class="search-wrap" :class="{ 'filter-active': activeFilter }">
        <i :class="activeFilter ? currentMode.icon : 'bi bi-search'"></i>
        <input
          v-model="search"
          :placeholder="activeFilter ? currentMode.placeholder : 'Search students…'"
          @input="onSearchInput"
        />
        <span v-if="filterLoading" class="spin-inline"><i class="bi bi-arrow-repeat spin"></i></span>
        <button v-else-if="search" class="clear-x" @click="search=''; onSearchInput()"><i class="bi bi-x"></i></button>
        <span v-if="activeFilter" class="scope-badge">{{ currentMode.label }}</span>
      </div>

      <button class="btn-primary" @click="openModal()">
        <i class="bi bi-plus-lg"></i> Add Student
      </button>
    </div>

    <!-- Filter scope buttons -->
    <div class="filter-btns">
      <span class="filter-label">Filter by:</span>
      <button
        v-for="f in filterModes" :key="f.key"
        class="filter-btn"
        :class="{ active: activeFilter === f.key }"
        @click="toggleFilter(f.key)"
      >
        <i :class="f.icon"></i> {{ f.label }}
      </button>
      <button v-if="activeFilter" class="filter-btn clear-filter" @click="clearFilter">
        <i class="bi bi-x"></i> Clear
      </button>
    </div>

    <!-- Status line -->
    <div v-if="activeFilter && search && filterDone" class="filter-result-line">
      <i class="bi bi-check-circle" style="color:#198754"></i>
      Found <strong>{{ displayed.length }}</strong> student(s) with
      <strong>"{{ search }}"</strong> in <strong>{{ currentMode.label }}</strong>
    </div>

    <!-- Table -->
    <div class="panel">
      <div v-if="loading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
      <div v-else-if="displayed.length === 0 && activeFilter && search && !filterDone" class="empty-state muted">
        <i class="bi bi-arrow-repeat spin"></i> Searching {{ currentMode.label }}…
      </div>
      <div v-else-if="displayed.length === 0" class="empty-state">No students found.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Program</th><th>Year / Section</th><th>Adviser</th>
              <th v-if="activeFilter && search && filterDone">Matched</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in displayed" :key="s.id"
              class="clickable-row"
              @click="goToDetail(s.id)"
            >
              <td><strong>{{ s.id }}</strong></td>
              <td>
                <div class="name-cell">
                  <div class="avatar">{{ s.initials }}</div>
                  <div>
                    <div class="name">{{ s.name }}</div>
                    <div class="email">{{ s.email }}</div>
                  </div>
                </div>
              </td>
              <td>{{ s.program }}</td>
              <td>{{ s.year_level }} · {{ s.section }}</td>
              <td>{{ s.faculty?.name || '—' }}</td>
              <td v-if="activeFilter && search && filterDone">
                <span class="match-val">
                  <i :class="currentMode.icon" style="font-size:10px"></i>
                  {{ s.matchDetail || '—' }}
                </span>
              </td>
              <td @click.stop>
                <div class="action-btns">
                  <button class="btn-icon" @click="goToDetail(s.id)" title="View Full Profile"><i class="bi bi-eye"></i></button>
                  <button class="btn-icon" @click="openModal(s)" title="Edit"><i class="bi bi-pencil"></i></button>
                  <button class="btn-icon danger" @click="confirmDelete(s)" title="Delete"><i class="bi bi-trash"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add / Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal">
        <div class="modal-head">
          <span>{{ editing ? 'Edit Student' : 'Add Student' }}</span>
          <button @click="showModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field">
              <label>Student ID *</label>
              <div class="input-with-btn">
                <input v-model="form.id" :disabled="!!editing" placeholder="Auto-generated" />
                <button v-if="!editing" class="gen-btn" @click="generateId" title="Generate ID"><i class="bi bi-arrow-repeat"></i></button>
              </div>
              <span class="field-hint">Format: YYYY-XXXXX · Click ↻ to regenerate</span>
            </div>
            <div class="field"><label>Full Name *</label><input v-model="form.name" placeholder="Juan dela Cruz" /></div>
            <div class="field"><label>Initials</label><input v-model="form.initials" placeholder="JD" maxlength="5" /></div>
            <div class="field"><label>Email *</label><input v-model="form.email" type="email" placeholder="student@edu.ph" /></div>
            <div class="field"><label>Date of Birth</label><CalendarPicker v-model="form.date_of_birth" placeholder="Select date of birth" :max-year="new Date().getFullYear()" /></div>
            <div class="field"><label>Phone</label><input v-model="form.phone" placeholder="09XXXXXXXXX" /></div>
            <div class="field full"><label>Address</label><input v-model="form.address" placeholder="Brgy., City, Province" /></div>
            <div class="field">
              <label>Gender</label>
              <select v-model="form.gender"><option>Male</option><option>Female</option><option>Other</option></select>
            </div>
            <div class="field">
              <label>Program / Course *</label>
              <select v-model="form.program" @change="form.section=''">
                <option value="">— Select Course —</option>
                <optgroup v-for="col in courses" :key="col.label" :label="col.label">
                  <option v-for="c in col.programs" :key="c">{{ c }}</option>
                </optgroup>
              </select>
            </div>
            <div class="field">
              <label>Year Level *</label>
              <select v-model="form.year_level" @change="form.section=''">
                <option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option>
              </select>
            </div>
            <div class="field">
              <label>Section *</label>
              <select v-model="form.section" :disabled="!form.program || !form.year_level">
                <option value="">— Select Section —</option>
                <option v-for="sec in sectionOptions" :key="sec" :value="sec">{{ sec }}</option>
              </select>
              <span class="field-hint" v-if="!form.program || !form.year_level">Select course and year level first</span>
            </div>
            <div class="field">
              <label>Semester</label>
              <select v-model="form.semester">
                <option>1st Semester, A.Y. 2024-2025</option>
                <option>2nd Semester, A.Y. 2024-2025</option>
                <option>Summer, A.Y. 2024-2025</option>
                <option>1st Semester, A.Y. 2025-2026</option>
                <option>2nd Semester, A.Y. 2025-2026</option>
                <option>Summer, A.Y. 2025-2026</option>
              </select>
            </div>
            <div class="field">
              <label>Adviser (Faculty)</label>
              <select v-model="form.adviser_id">
                <option value="">— None —</option>
                <option v-for="f in facultyList" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
            </div>
          </div>
          <div class="pw-preview" v-if="passwordPreview">
            <i class="bi bi-key"></i>
            <span>Default password: <strong>{{ passwordPreview }}</strong></span>
          </div>
          <div v-if="formError" class="form-error">{{ formError }}</div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="showModal=false">Cancel</button>
          <button class="btn-primary" @click="saveStudent" :disabled="saving">
            <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
            <span v-else>{{ editing ? 'Save Changes' : 'Add Student' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget=null">
      <div class="modal confirm-modal">
        <div class="modal-head">
          <span>Delete Student</span>
          <button @click="deleteTarget=null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p>Delete <strong>{{ deleteTarget.name }}</strong>? This will remove all their records.</p>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="deleteTarget=null">Cancel</button>
          <button class="btn-danger" @click="deleteStudent" :disabled="saving">{{ saving ? 'Deleting…' : 'Yes, Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import { logActivity } from '@/lib/activityLog.js'
import { useAuthStore } from '@/store/auth.js'
import CalendarPicker from '@/components/CalendarPicker.vue'

const router       = useRouter()
const auth         = useAuthStore()
const students     = ref([])
const facultyList  = ref([])
const loading      = ref(true)
const saving       = ref(false)
const search       = ref('')
const showModal    = ref(false)
const editing      = ref(null)
const deleteTarget = ref(null)
const formError    = ref('')

// ── Filter scope ──────────────────────────────────────────────
const filterModes = [
  { key:'skill',       label:'By Skill',        icon:'bi bi-star-fill',                 placeholder:'Search by skill e.g. Basketball, Singing…' },
  { key:'affiliation', label:'By Affiliation',   icon:'bi bi-people-fill',               placeholder:'Search by affiliation e.g. CSC, ROTC…' },
  { key:'violation',   label:'By Violation',     icon:'bi bi-exclamation-triangle-fill', placeholder:'Search by violation e.g. Minor, cheating…' },
  { key:'grade',       label:'By Grade/Subject', icon:'bi bi-award',                     placeholder:'Search by subject e.g. CS301, Passed…' },
  { key:'academic',    label:'By Academic',      icon:'bi bi-mortarboard-fill',          placeholder:"Search by academic record e.g. Dean's Lister…" },
]
const activeFilter  = ref('')
const filterLoading = ref(false)
const filterDone    = ref(false)
const filterMatches = ref(new Map())
// Track the query that produced the current filterMatches
// so stale results from a slow previous request don't overwrite newer ones
let   currentQueryId = 0

const currentMode = computed(() => filterModes.find(f => f.key === activeFilter.value) || {})

function toggleFilter(key) {
  if (activeFilter.value === key) { clearFilter(); return }
  activeFilter.value  = key
  filterMatches.value = new Map()
  filterDone.value    = false
  filterLoading.value = false
  // Re-run immediately if there's already text
  if (search.value.trim()) scheduleFilter(search.value.trim())
}

function clearFilter() {
  activeFilter.value  = ''
  filterMatches.value = new Map()
  filterDone.value    = false
  filterLoading.value = false
}

// ── Search handler ────────────────────────────────────────────
let searchTimer = null
function onSearchInput() {
  const q = search.value.trim()

  // Reset filter state immediately so stale results don't show
  filterDone.value    = false
  filterMatches.value = new Map()
  filterLoading.value = false
  clearTimeout(searchTimer)

  if (!q || !activeFilter.value) return

  // Show loading spinner right away — list is already empty via computed
  filterLoading.value = true
  searchTimer = setTimeout(() => scheduleFilter(q), 300)
}

function scheduleFilter(q) {
  filterLoading.value = true
  const myId = ++currentQueryId
  runFilter(q, myId)
}

async function runFilter(q, queryId) {
  const map = new Map()

  if (activeFilter.value === 'skill') {
    const { data } = await supabase.from('student_skills').select('student_id,name,category').ilike('name', `%${q}%`)
    ;(data||[]).forEach(r => { if (!map.has(r.student_id)) map.set(r.student_id, `${r.name} (${r.category})`) })

  } else if (activeFilter.value === 'affiliation') {
    const { data } = await supabase.from('student_affiliations').select('student_id,name,role').or(`name.ilike.%${q}%,role.ilike.%${q}%`)
    ;(data||[]).forEach(r => { if (!map.has(r.student_id)) map.set(r.student_id, `${r.name}${r.role?' – '+r.role:''}`) })

  } else if (activeFilter.value === 'violation') {
    const isSev = ['Minor','Major','Serious'].includes(q)
    let qb = supabase.from('student_violations').select('student_id,violation,severity')
    qb = isSev ? qb.eq('severity', q) : qb.or(`violation.ilike.%${q}%,sanction.ilike.%${q}%`)
    const { data } = await qb
    ;(data||[]).forEach(r => { if (!map.has(r.student_id)) map.set(r.student_id, `[${r.severity}] ${r.violation}`) })

  } else if (activeFilter.value === 'grade') {
    const { data } = await supabase.from('grades').select('student_id,code,description,remarks').or(`code.ilike.%${q}%,description.ilike.%${q}%,remarks.ilike.%${q}%`)
    ;(data||[]).forEach(r => { if (!map.has(r.student_id)) map.set(r.student_id, `${r.code} – ${r.description}`) })

  } else if (activeFilter.value === 'academic') {
    const [a, b] = await Promise.all([
      supabase.from('student_academic_history').select('student_id,title,type').or(`title.ilike.%${q}%,type.ilike.%${q}%,institution.ilike.%${q}%`),
      supabase.from('student_nonacademic_history').select('student_id,title,category').or(`title.ilike.%${q}%,category.ilike.%${q}%`),
    ])
    ;(a.data||[]).forEach(r => { if (!map.has(r.student_id)) map.set(r.student_id, `${r.title} (${r.type})`) })
    ;(b.data||[]).forEach(r => { if (!map.has(r.student_id)) map.set(r.student_id, `${r.title} (${r.category})`) })
  }

  // Discard if a newer query has been fired since this one started
  if (queryId !== currentQueryId) return

  filterMatches.value = map
  filterLoading.value = false
  filterDone.value    = true
}

// ── Displayed rows ────────────────────────────────────────────
const displayed = computed(() => {
  const q = search.value.toLowerCase().trim()

  // No filter → plain name/ID/program search
  if (!activeFilter.value) {
    return students.value.filter(s =>
      !q || s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.program||'').toLowerCase().includes(q)
    )
  }

  // Filter active, no query → show all
  if (!q) return students.value

  // Filter active, query typed but result not yet back → show NOTHING
  // This is the key fix: no blinking because we return [] immediately
  if (!filterDone.value) return []

  // Result is back → show only matched students
  return students.value
    .filter(s => filterMatches.value.has(s.id))
    .map(s => ({ ...s, matchDetail: filterMatches.value.get(s.id) }))
})

// ── Courses / sections ────────────────────────────────────────
const courses = [
  { label:'College of Computing',      programs:['BS Computer Science','BS Information Technology','BS Information Systems'] },
  { label:'College of Engineering',    programs:['BS Computer Engineering','BS Electronics Engineering','BS Civil Engineering','BS Mechanical Engineering','BS Electrical Engineering'] },
  { label:'College of Business',       programs:['BS Business Administration','BS Accountancy','BS Management Accounting'] },
  { label:'College of Education',      programs:['BS Education','BS Secondary Education','BS Elementary Education'] },
  { label:'College of Arts & Sciences',programs:['BS Psychology','AB Communication','AB Political Science'] },
]
const courseAbbrev = {
  'BS Computer Science':'BSCS','BS Information Technology':'BSIT','BS Information Systems':'BSIS',
  'BS Computer Engineering':'BSCpE','BS Electronics Engineering':'BSEE','BS Civil Engineering':'BSCE',
  'BS Mechanical Engineering':'BSME','BS Electrical Engineering':'BSElecE',
  'BS Business Administration':'BSBA','BS Accountancy':'BSA','BS Management Accounting':'BSMA',
  'BS Education':'BSEd','BS Secondary Education':'BSSEd','BS Elementary Education':'BSEEd',
  'BS Psychology':'BSPsych','AB Communication':'ABComm','AB Political Science':'ABPS',
}
const yearNum = { '1st Year':'1','2nd Year':'2','3rd Year':'3','4th Year':'4' }

const blankForm = () => ({ id:'', name:'', initials:'', email:'', date_of_birth:'', phone:'', address:'', gender:'Male', program:'', year_level:'1st Year', section:'', semester:'1st Semester, A.Y. 2024-2025', adviser_id:'' })
const form = ref(blankForm())

const sectionOptions = computed(() => {
  if (!form.value.program || !form.value.year_level) return []
  const abbrev = courseAbbrev[form.value.program]; const yr = yearNum[form.value.year_level]
  if (!abbrev || !yr) return []
  return ['A','B','C','D'].map(l => `${abbrev} ${yr}-${l}`)
})

const passwordPreview = computed(() => {
  if (!form.value.id || !form.value.date_of_birth || editing.value) return ''
  const last5 = form.value.id.replace(/\D/g,'').slice(-5)
  const yearMatch = form.value.date_of_birth.match(/\b(19|20)\d{2}\b/)
  return (last5 && yearMatch) ? last5 + yearMatch[0] : ''
})

// ── Load ──────────────────────────────────────────────────────
async function load() {
  loading.value = true
  const { data } = await supabase.from('students').select('*, faculty:adviser_id(name, department)').order('name')
  students.value = data || []
  const { data: fac } = await supabase.from('faculty').select('id,name,department').order('name')
  facultyList.value = fac || []
  loading.value = false
}
let channel
onMounted(() => {
  load()
  channel = supabase
    .channel('students-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, load)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

function goToDetail(id) { router.push(`/admin/students/${id}`) }

async function generateId() {
  const year = new Date().getFullYear()
  const { data } = await supabase.from('students').select('id').like('id',`${year}-%`).order('id',{ascending:false}).limit(1)
  let nextNum = 1
  if (data && data.length > 0) nextNum = parseInt(data[0].id.replace(/\D/g,'').slice(-5)) + 1
  form.value.id = `${year}-${String(nextNum).padStart(5,'0')}`
}

async function openModal(s = null) {
  editing.value = s; formError.value = ''
  form.value = s ? { ...s, adviser_id: s.adviser_id||'' } : blankForm()
  showModal.value = true
  if (!s) await generateId()
}

async function saveStudent() {
  if (!form.value.id || !form.value.name || !form.value.email) { formError.value = 'ID, Name and Email are required.'; return }
  saving.value = true; formError.value = ''
  const payload = { ...form.value }
  if (!payload.adviser_id) payload.adviser_id = null
  delete payload.faculty
  let err
  if (editing.value) {
    const res = await supabase.from('students').update({ ...payload, updated_at: new Date() }).eq('id', editing.value.id)
    err = res.error
    if (!err) await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Updated student', targetType:'student', targetId:form.value.id, targetName:form.value.name })
  } else {
    const res = await supabase.from('students').insert(payload)
    err = res.error
    if (!err) await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Created student', targetType:'student', targetId:form.value.id, targetName:form.value.name })
  }
  saving.value = false
  if (err) { formError.value = err.message; return }
  showModal.value = false
  await load()
}

function confirmDelete(s) { deleteTarget.value = s }

async function deleteStudent() {
  saving.value = true
  await supabase.from('students').delete().eq('id', deleteTarget.value.id)
  await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Deleted student', targetType:'student', targetId:deleteTarget.value.id, targetName:deleteTarget.value.name })
  deleteTarget.value = null; saving.value = false
  await load()
}
</script>

<style scoped>
.page-bar{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
.search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;padding:8px 12px;flex:1;min-width:200px;transition:border-color .15s,background .15s;}
.search-wrap.filter-active{border-color:#1a6b2e;background:#eaf4ec;}
.search-wrap i{color:#6c757d;flex-shrink:0;}
.search-wrap.filter-active > i{color:#1a6b2e;}
.search-wrap input{border:none;outline:none;font-size:13px;font-family:inherit;width:100%;background:transparent;}
.clear-x{background:none;border:none;cursor:pointer;color:#adb5bd;font-size:13px;padding:0;line-height:1;flex-shrink:0;}
.clear-x:hover{color:#dc3545;}
.spin-inline{color:#1a6b2e;font-size:13px;flex-shrink:0;display:flex;align-items:center;}
.scope-badge{flex-shrink:0;padding:2px 8px;background:#1a6b2e;color:#fff;border-radius:20px;font-size:10px;font-weight:700;white-space:nowrap;}

.filter-btns{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:12px;}
.filter-label{font-size:11px;font-weight:700;color:#adb5bd;text-transform:uppercase;letter-spacing:.4px;margin-right:2px;white-space:nowrap;}
.filter-btn{padding:6px 12px;background:#fff;border:1px solid #d6e4d8;border-radius:20px;font-size:12px;font-weight:600;color:#495057;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit;white-space:nowrap;transition:all .15s;}
.filter-btn:hover{border-color:#1a6b2e;color:#1a6b2e;background:#eaf4ec;}
.filter-btn.active{background:#1a6b2e;color:#fff;border-color:#1a6b2e;}
.filter-btn.clear-filter{border-color:#d6e4d8;color:#6c757d;}
.filter-btn.clear-filter:hover{border-color:#dc3545;color:#dc3545;background:#fff0f0;}

.filter-result-line{font-size:12px;color:#6c757d;margin-bottom:10px;display:flex;align-items:center;gap:6px;}

.btn-primary{padding:9px 16px;background:#1a6b2e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;font-family:inherit;}
.btn-primary:disabled{opacity:.6;cursor:not-allowed;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
td{padding:11px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
.clickable-row{cursor:pointer;}
.clickable-row:hover td{background:#eaf4ec;}
tr:last-child td{border-bottom:none;}
.name-cell{display:flex;align-items:center;gap:9px;}
.avatar{width:30px;height:30px;border-radius:8px;background:#d4a017;color:#1a6b2e;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
.name{font-weight:600;color:#212529;font-size:12px;}
.email{font-size:10px;color:#6c757d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;}
.match-val{font-size:11px;color:#1a6b2e;font-weight:600;display:flex;align-items:center;gap:4px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.action-btns{display:flex;gap:6px;}
.btn-icon{width:30px;height:30px;border-radius:7px;border:1px solid #d6e4d8;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:#6c757d;}
.btn-icon:hover{background:#eaf4ec;color:#1a6b2e;border-color:#1a6b2e;}
.btn-icon.danger:hover{background:#fff0f0;color:#dc3545;border-color:#dc3545;}
.empty-state{padding:32px;text-align:center;color:#6c757d;font-size:13px;}
.empty-state.muted{color:#adb5bd;}

.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;overflow-y:auto;}
.modal{background:#fff;border-radius:12px;width:100%;max-width:680px;display:flex;flex-direction:column;overflow:hidden;position:relative;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);}
.confirm-modal{max-width:420px;}
.modal-head{padding:14px 18px;border-bottom:1px solid #d6e4d8;display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;color:#1a6b2e;flex-shrink:0;}
.modal-head button{background:none;border:none;cursor:pointer;font-size:16px;color:#6c757d;}
.modal-body{padding:18px;overflow-y:auto;max-height:65vh;}
.modal-body p{font-size:13px;color:#495057;line-height:1.6;}
.modal-foot{padding:14px 18px;border-top:1px solid #d6e4d8;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;background:#fff;}
.btn-cancel{padding:8px 16px;background:#f8f9fa;border:1px solid #d6e4d8;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;}
.btn-danger{padding:8px 16px;background:#dc3545;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
.btn-danger:disabled{opacity:.6;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.full{grid-column:1/-1;}
.field{display:flex;flex-direction:column;gap:5px;}
.field label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6c757d;}
.field input,.field select{padding:9px 11px;border:1px solid #d6e4d8;border-radius:7px;font-size:13px;font-family:inherit;outline:none;background:#fff;width:100%;box-sizing:border-box;}
.field input:focus,.field select:focus{border-color:#1a6b2e;}
.field input:disabled,.field select:disabled{background:#f8f9fa;color:#adb5bd;}
.field-hint{font-size:10px;color:#adb5bd;margin-top:2px;}
.input-with-btn{display:flex;gap:6px;align-items:center;}
.input-with-btn input{flex:1;}
.gen-btn{width:34px;height:34px;border:1px solid #d6e4d8;border-radius:7px;background:#f8f9fa;cursor:pointer;font-size:14px;color:#1a6b2e;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.gen-btn:hover{background:#eaf4ec;border-color:#1a6b2e;}
.pw-preview{margin-top:14px;padding:10px 14px;background:#f0fff4;border:1px solid #c3e6cb;border-radius:7px;font-size:12px;color:#155724;display:flex;align-items:center;gap:8px;}
.pw-preview strong{font-size:13px;letter-spacing:.5px;}
.form-error{margin-top:12px;padding:10px 12px;background:#fff0f0;border:1px solid #f5c6cb;border-radius:7px;font-size:12px;color:#c0392b;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>