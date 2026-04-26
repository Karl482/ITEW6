<template>
  <div>
    <div class="page-bar">
      <div class="search-wrap"><i class="bi bi-search"></i><input v-model="search" type="text" placeholder="Search subjects…" /></div>
      <select v-model="filterFaculty" class="filter-select">
        <option value="">All Faculty</option>
        <option v-for="f in facultyList" :key="f.id" :value="f.id">{{ f.name }}</option>
      </select>
      <select v-model="filterCourse" class="filter-select">
        <option value="">All Courses</option>
        <option v-for="c in allCourses" :key="c">{{ c }}</option>
      </select>
      <button class="btn-primary" @click="openModal()"><i class="bi bi-plus-lg"></i> Add Subject</button>
    </div>

    <div class="panel">
      <div v-if="loading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
      <div v-else-if="filtered.length===0" class="empty-state">No subjects found.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>Code</th><th>Description</th><th>Course</th><th>Faculty</th><th>Section</th><th>Schedule</th><th>Room</th><th>Units</th><th>Enrolled</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in filtered" :key="s.id">
              <td><strong>{{ s.code }}</strong></td>
              <td>{{ s.description }}</td>
              <td><span class="course-badge">{{ s.course || '—' }}</span></td>
              <td>{{ s.faculty?.name || '—' }}</td>
              <td>{{ s.section }}</td>
              <td>{{ s.schedule }}</td>
              <td>{{ s.room }}</td>
              <td class="center">{{ s.units }}</td>
              <td class="center">{{ s.enrolled }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon" @click="openModal(s)"><i class="bi bi-pencil"></i></button>
                  <button class="btn-icon danger" @click="confirmDelete(s)"><i class="bi bi-trash"></i></button>
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
          <span>{{ editing ? 'Edit Subject' : 'Add Subject' }}</span>
          <button @click="showModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">

            <div class="field">
              <label>Subject Code *</label>
              <input v-model="form.code" placeholder="CS301" />
            </div>
            <div class="field full">
              <label>Description *</label>
              <input v-model="form.description" placeholder="Data Structures & Algorithms" />
            </div>

            <div class="field full">
              <label>Course / Program *</label>
              <select v-model="form.course" @change="form.section=''">
                <option value="">— Select Course —</option>
                <optgroup v-for="col in courses" :key="col.label" :label="col.label">
                  <option v-for="c in col.programs" :key="c">{{ c }}</option>
                </optgroup>
                <option value="General Education">General Education (All Courses)</option>
              </select>
            </div>

            <div class="field full">
              <label>Faculty *</label>
              <select v-model="form.faculty_id">
                <option value="">— Select Faculty —</option>
                <option v-for="f in facultyList" :key="f.id" :value="f.id">{{ f.name }} — {{ f.department }}</option>
              </select>
            </div>

            <div class="field">
              <label>Year Level (for section)</label>
              <select v-model="form.year_level" @change="form.section=''">
                <option value="">— Select Year —</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>

            <div class="field">
              <label>Section</label>
              <select v-model="form.section" :disabled="!form.course || !form.year_level">
                <option value="">— Select Section —</option>
                <option v-for="sec in sectionOptions" :key="sec" :value="sec">{{ sec }}</option>
              </select>
              <span class="field-hint" v-if="!form.course || !form.year_level">Select course and year level first</span>
            </div>

            <div class="field">
              <label>Units</label>
              <input v-model.number="form.units" type="number" min="1" max="6" />
            </div>
            <div class="field">
              <label>Schedule</label>
              <input v-model="form.schedule" placeholder="MWF 7:30-8:30 AM" />
            </div>
            <div class="field">
              <label>Room</label>
              <input v-model="form.room" placeholder="CS Lab 1" />
            </div>
            <div class="field">
              <label>Enrolled</label>
              <input v-model.number="form.enrolled" type="number" min="0" max="50" />
            </div>

          </div>
          <div v-if="formError" class="form-error">{{ formError }}</div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="showModal=false">Cancel</button>
          <button class="btn-primary" @click="saveSubject" :disabled="saving">
            <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
            <span v-else>{{ editing ? 'Save Changes' : 'Add Subject' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget=null">
      <div class="modal confirm-modal">
        <div class="modal-head">
          <span>Delete Subject</span>
          <button @click="deleteTarget=null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p>Delete <strong>{{ deleteTarget.code }} — {{ deleteTarget.description }}</strong>?</p>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="deleteTarget=null">Cancel</button>
          <button class="btn-danger" @click="deleteSubject" :disabled="saving">{{ saving ? 'Deleting…' : 'Yes, Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase.js'
import { logActivity } from '@/lib/activityLog.js'
import { useAuthStore } from '@/store/auth.js'

const auth        = useAuthStore()
const subjects    = ref([])
const facultyList = ref([])
const loading     = ref(true)
const saving      = ref(false)
const search      = ref('')
const filterFaculty = ref('')
const filterCourse  = ref('')
const showModal   = ref(false)
const editing     = ref(null)
const deleteTarget = ref(null)
const formError   = ref('')

// ── Courses grouped ──────────────────────────────────────────
const courses = [
  { label:'College of Computing',      programs:['BS Computer Science','BS Information Technology','BS Information Systems'] },
  { label:'College of Engineering',    programs:['BS Computer Engineering','BS Electronics Engineering','BS Civil Engineering','BS Mechanical Engineering','BS Electrical Engineering'] },
  { label:'College of Business',       programs:['BS Business Administration','BS Accountancy','BS Management Accounting'] },
  { label:'College of Education',      programs:['BS Education','BS Secondary Education','BS Elementary Education'] },
  { label:'College of Arts & Sciences',programs:['BS Psychology','AB Communication','AB Political Science'] },
]

const allCourses = computed(() => {
  const list = []
  courses.forEach(c => c.programs.forEach(p => list.push(p)))
  list.push('General Education')
  return list
})

// ── Abbreviation map ─────────────────────────────────────────
const courseAbbrev = {
  'BS Computer Science':        'BSCS',
  'BS Information Technology':  'BSIT',
  'BS Information Systems':     'BSIS',
  'BS Computer Engineering':    'BSCpE',
  'BS Electronics Engineering': 'BSEE',
  'BS Civil Engineering':       'BSCE',
  'BS Mechanical Engineering':  'BSME',
  'BS Electrical Engineering':  'BSElecE',
  'BS Business Administration': 'BSBA',
  'BS Accountancy':             'BSA',
  'BS Management Accounting':   'BSMA',
  'BS Education':               'BSEd',
  'BS Secondary Education':     'BSSEd',
  'BS Elementary Education':    'BSEEd',
  'BS Psychology':              'BSPsych',
  'AB Communication':           'ABComm',
  'AB Political Science':       'ABPS',
  'General Education':          'GE',
}

const yearNum = { '1st Year':'1', '2nd Year':'2', '3rd Year':'3', '4th Year':'4' }

// ── Section options: BSIT 1-A, BSIT 1-B, BSIT 1-C, BSIT 1-D ─
const sectionOptions = computed(() => {
  if (!form.value.course || !form.value.year_level) return []
  const abbrev = courseAbbrev[form.value.course]
  const yr     = yearNum[form.value.year_level]
  if (!abbrev || !yr) return []
  return ['A','B','C','D'].map(l => `${abbrev} ${yr}-${l}`)
})

const blank = () => ({
  code:'', description:'', course:'', faculty_id:'',
  year_level:'', section:'', units:3, schedule:'', room:'', enrolled:0
})
const form = ref(blank())

const filtered = computed(() => {
  let list = subjects.value
  if (filterFaculty.value) list = list.filter(s => s.faculty_id === filterFaculty.value)
  if (filterCourse.value)  list = list.filter(s => s.course === filterCourse.value)
  const q = search.value.toLowerCase()
  if (q) list = list.filter(s => s.code.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || (s.course||'').toLowerCase().includes(q))
  return list
})

async function load() {
  loading.value = true
  const [sub, fac] = await Promise.all([
    supabase.from('faculty_subjects').select('*, faculty:faculty_id(name,department)').order('code'),
    supabase.from('faculty').select('id,name,department').order('name'),
  ])
  subjects.value    = sub.data || []
  facultyList.value = fac.data || []
  loading.value = false
}
let channel
onMounted(() => {
  load()
  channel = supabase
    .channel('subjects-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty_subjects' }, load)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

function openModal(s = null) {
  editing.value   = s
  formError.value = ''
  form.value      = s
    ? { code:s.code, description:s.description, course:s.course||'', faculty_id:s.faculty_id, year_level:s.year_level||'', section:s.section, units:s.units, schedule:s.schedule, room:s.room, enrolled:s.enrolled }
    : blank()
  showModal.value = true
}

async function saveSubject() {
  if (!form.value.code || !form.value.description || !form.value.faculty_id) {
    formError.value = 'Code, Description and Faculty are required.'
    return
  }
  saving.value = true; formError.value = ''
  const payload = { ...form.value }
  delete payload.year_level  // not a real column, just used for section generation
  let err
  if (editing.value) {
    const res = await supabase.from('faculty_subjects').update({ ...payload, updated_at:new Date() }).eq('id', editing.value.id)
    err = res.error
    if (!err) await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Updated subject', targetType:'subject', targetName:`${form.value.code} — ${form.value.description}` })
  } else {
    const res = await supabase.from('faculty_subjects').insert(payload)
    err = res.error
    if (!err) await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Added subject', targetType:'subject', targetName:`${form.value.code} — ${form.value.description}` })
  }
  saving.value = false
  if (err) { formError.value = err.message; return }
  showModal.value = false
  await load()
}

function confirmDelete(s) { deleteTarget.value = s }

async function deleteSubject() {
  saving.value = true
  await supabase.from('faculty_subjects').delete().eq('id', deleteTarget.value.id)
  await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Deleted subject', targetType:'subject', targetName:`${deleteTarget.value.code} — ${deleteTarget.value.description}` })
  deleteTarget.value = null; saving.value = false
  await load()
}
</script>

<style scoped>
.page-bar{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap;}
.search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;padding:8px 12px;flex:1;min-width:160px;}
.search-wrap i{color:#6c757d;}
.search-wrap input{border:none;outline:none;font-size:13px;font-family:inherit;width:100%;}
.filter-select{padding:8px 10px;border:1px solid #d6e4d8;border-radius:8px;font-size:12px;font-family:inherit;background:#fff;outline:none;}
.btn-primary{padding:9px 16px;background:#1a6b2e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;font-family:inherit;}
.btn-primary:disabled{opacity:.6;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
td{padding:10px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
td.center{text-align:center;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.course-badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:600;background:#eaf4ec;color:#1a6b2e;}
.action-btns{display:flex;gap:6px;}
.btn-icon{width:30px;height:30px;border-radius:7px;border:1px solid #d6e4d8;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:#6c757d;}
.btn-icon:hover{background:#eaf4ec;color:#1a6b2e;border-color:#1a6b2e;}
.btn-icon.danger:hover{background:#fff0f0;color:#dc3545;border-color:#dc3545;}
.empty-state{padding:32px;text-align:center;color:#6c757d;font-size:13px;}
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;overflow-y:auto;}
.modal{background:#fff;border-radius:12px;width:100%;max-width:640px;display:flex;flex-direction:column;overflow:hidden;position:relative;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);}
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
.form-error{margin-top:12px;padding:10px 12px;background:#fff0f0;border:1px solid #f5c6cb;border-radius:7px;font-size:12px;color:#c0392b;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>