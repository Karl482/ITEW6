<template>
  <div>
    <div class="page-bar">
      <button class="back-btn" @click="router.back()">
        <i class="bi bi-arrow-left"></i> Back to Students
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="bi bi-arrow-repeat spin"></i> Loading student profile…
    </div>

    <template v-else-if="student">

      <!-- Hero -->
      <div class="profile-hero">
        <div class="hero-avatar">{{ student.initials }}</div>
        <div class="hero-body">
          <div class="hero-name">{{ student.name }}</div>
          <div class="hero-sub">{{ student.program }} · {{ student.year_level }} · {{ student.section }}</div>
          <div class="hero-id"><i class="bi bi-id-card"></i> {{ student.id }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button v-for="t in tabs" :key="t.key" :class="['tab', activeTab===t.key?'active':'']" @click="activeTab=t.key">
          <i :class="t.icon"></i> {{ t.label }}
          <span v-if="t.count !== undefined" class="tab-count" :class="t.key==='violations'&&t.count>0?'tab-count-warn':''">{{ t.count }}</span>
        </button>
      </div>

      <!-- ══ PERSONAL ══ -->
      <div v-show="activeTab==='personal'" class="info-grid">
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
          <div class="panel-head"><span class="panel-title">Academic Information</span></div>
          <div class="panel-body">
            <div class="info-row" v-for="f in academicFields" :key="f.label">
              <span class="info-lbl">{{ f.label }}</span>
              <span class="info-val">{{ f.value || '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ GRADES ══ -->
      <div v-show="activeTab==='grades'">
        <div class="tab-bar">
          <div class="search-wrap">
            <i class="bi bi-search"></i>
            <input v-model="gradeSearch" placeholder="Search subject…" />
          </div>
          <button class="btn-primary sm" @click="openModal('grade')">
            <i class="bi bi-plus-lg"></i> Add Grade
          </button>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Grades</span><span class="count-badge">{{ filteredGrades.length }}</span></div>
          <div v-if="filteredGrades.length===0" class="empty-table">No grades found.</div>
          <div v-else class="table-wrap">
            <table>
              <thead><tr><th class="ps">Code</th><th>Description</th><th>Units</th><th>Midterm</th><th>Finals</th><th>Grade</th><th>Remarks</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="g in filteredGrades" :key="g.id">
                  <td class="ps"><strong>{{ g.code }}</strong></td>
                  <td>{{ g.description }}</td>
                  <td class="ctr">{{ g.units }}</td>
                  <td class="ctr">{{ g.midterm ?? '—' }}</td>
                  <td class="ctr">{{ g.finals ?? '—' }}</td>
                  <td class="ctr"><strong style="color:#1a6b2e">{{ g.final_grade ?? '—' }}</strong></td>
                  <td><span class="badge" :class="g.remarks==='Passed'?'bp':'bf'">{{ g.remarks||'Pending' }}</span></td>
                  <td>
                    <div class="act-btns">
                      <button class="btn-icon" @click="openModal('grade',g)"><i class="bi bi-pencil"></i></button>
                      <button class="btn-icon danger" @click="del('grades',g.id)"><i class="bi bi-trash"></i></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══ AFFILIATIONS ══ -->
      <div v-show="activeTab==='affiliations'">
        <div class="tab-bar">
          <div class="search-wrap">
            <i class="bi bi-search"></i>
            <input v-model="affSearch" placeholder="Search affiliation…" />
          </div>
          <select v-model="affTypeFilter" class="filter-sel">
            <option value="">All Types</option>
            <option>Organization</option><option>Sports</option><option>Club</option><option>Committee</option><option>Other</option>
          </select>
          <select v-model="affStatusFilter" class="filter-sel">
            <option value="">All Status</option>
            <option>Active</option><option>Inactive</option><option>Alumni</option>
          </select>
          <button class="btn-primary sm" @click="openModal('affiliation')">
            <i class="bi bi-plus-lg"></i> Add Affiliation
          </button>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Affiliations</span><span class="count-badge">{{ filteredAffs.length }}</span></div>
          <div v-if="filteredAffs.length===0" class="empty-table">No affiliations found.</div>
          <div v-else class="table-wrap">
            <table>
              <thead><tr><th class="ps">Name</th><th>Type</th><th>Role</th><th>Year Joined</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="a in filteredAffs" :key="a.id">
                  <td class="ps"><strong>{{ a.name }}</strong></td>
                  <td>{{ a.type }}</td>
                  <td>{{ a.role || '—' }}</td>
                  <td>{{ a.year_joined || '—' }}</td>
                  <td><span class="badge" :class="a.status==='Active'?'bp':'bg'">{{ a.status }}</span></td>
                  <td><div class="act-btns">
                    <button class="btn-icon" @click="openModal('affiliation',a)"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon danger" @click="del('student_affiliations',a.id)"><i class="bi bi-trash"></i></button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══ SKILLS ══ -->
      <div v-show="activeTab==='skills'">
        <div class="tab-bar">
          <div class="search-wrap">
            <i class="bi bi-search"></i>
            <input v-model="skillSearch" placeholder="Search skills e.g. basketball, singing…" />
          </div>
          <select v-model="skillCatFilter" class="filter-sel">
            <option value="">All Categories</option>
            <option>Academic</option><option>Sports</option><option>Arts</option><option>Technology</option><option>Leadership</option><option>Other</option>
          </select>
          <button class="btn-primary sm" @click="openModal('skill')">
            <i class="bi bi-plus-lg"></i> Add Skill
          </button>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Skills & Talents</span><span class="count-badge">{{ filteredSkills.length }}</span></div>
          <div v-if="filteredSkills.length===0" class="empty-table">No skills found.</div>
          <div v-else class="skills-wrap">
            <div v-for="s in filteredSkills" :key="s.id" class="skill-row">
              <span class="skill-tag" :class="skClass(s.category)">
                <i :class="skIcon(s.category)"></i> {{ s.name }}
              </span>
              <span class="skill-cat-lbl">{{ s.category }}</span>
              <button class="btn-icon danger xs" @click="del('student_skills',s.id)"><i class="bi bi-x"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ ACADEMIC HISTORY ══ -->
      <div v-show="activeTab==='academic_history'">
        <div class="tab-bar">
          <div class="search-wrap">
            <i class="bi bi-search"></i>
            <input v-model="acadSearch" placeholder="Search academic history…" />
          </div>
          <select v-model="acadTypeFilter" class="filter-sel">
            <option value="">All Types</option>
            <option>Award</option><option>Honor</option><option>Previous School</option><option>Scholarship</option><option>Certificate</option><option>Other</option>
          </select>
          <button class="btn-primary sm" @click="openModal('academic_history')">
            <i class="bi bi-plus-lg"></i> Add Entry
          </button>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Academic History</span><span class="count-badge">{{ filteredAcad.length }}</span></div>
          <div v-if="filteredAcad.length===0" class="empty-table">No academic history found.</div>
          <div v-else class="table-wrap">
            <table>
              <thead><tr><th class="ps">Title</th><th>Institution</th><th>Type</th><th>Year</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="h in filteredAcad" :key="h.id">
                  <td class="ps"><strong>{{ h.title }}</strong></td>
                  <td>{{ h.institution || '—' }}</td>
                  <td><span class="badge bprog">{{ h.type }}</span></td>
                  <td>{{ h.year || '—' }}</td>
                  <td class="trunc">{{ h.description || '—' }}</td>
                  <td><div class="act-btns">
                    <button class="btn-icon" @click="openModal('academic_history',h)"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon danger" @click="del('student_academic_history',h.id)"><i class="bi bi-trash"></i></button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══ NON-ACADEMIC HISTORY ══ -->
      <div v-show="activeTab==='nonacademic_history'">
        <div class="tab-bar">
          <div class="search-wrap">
            <i class="bi bi-search"></i>
            <input v-model="nonAcadSearch" placeholder="Search non-academic history…" />
          </div>
          <select v-model="nonAcadCatFilter" class="filter-sel">
            <option value="">All Categories</option>
            <option>Sports</option><option>Arts</option><option>Community</option><option>Leadership</option><option>Competition</option><option>Other</option>
          </select>
          <button class="btn-primary sm" @click="openModal('nonacademic_history')">
            <i class="bi bi-plus-lg"></i> Add Entry
          </button>
        </div>
        <div class="panel">
          <div class="panel-head"><span class="panel-title">Non-Academic History</span><span class="count-badge">{{ filteredNonAcad.length }}</span></div>
          <div v-if="filteredNonAcad.length===0" class="empty-table">No entries found.</div>
          <div v-else class="table-wrap">
            <table>
              <thead><tr><th class="ps">Title</th><th>Category</th><th>Year</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="h in filteredNonAcad" :key="h.id">
                  <td class="ps"><strong>{{ h.title }}</strong></td>
                  <td><span class="badge bminor">{{ h.category }}</span></td>
                  <td>{{ h.year || '—' }}</td>
                  <td class="trunc">{{ h.description || '—' }}</td>
                  <td><div class="act-btns">
                    <button class="btn-icon" @click="openModal('nonacademic_history',h)"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon danger" @click="del('student_nonacademic_history',h.id)"><i class="bi bi-trash"></i></button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ══ VIOLATIONS ══ -->
      <div v-show="activeTab==='violations'">
        <div class="tab-bar">
          <div class="search-wrap">
            <i class="bi bi-search"></i>
            <input v-model="violSearch" placeholder="Search violations…" />
          </div>
          <select v-model="violSevFilter" class="filter-sel">
            <option value="">All Severity</option>
            <option>Minor</option><option>Major</option><option>Serious</option>
          </select>
          <select v-model="violStatFilter" class="filter-sel">
            <option value="">All Status</option>
            <option>Pending</option><option>Resolved</option><option>Appealing</option>
          </select>
          <button class="btn-primary sm" @click="openModal('violation')">
            <i class="bi bi-plus-lg"></i> Add Record
          </button>
        </div>
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">Disciplinary Records</span>
            <span class="count-badge" :style="violations.length>0?'background:#fff0f0;color:#dc3545':''">{{ filteredViols.length }}</span>
          </div>
          <div v-if="filteredViols.length===0" class="empty-table clean">
            <i class="bi bi-shield-check" style="color:#198754;font-size:18px"></i> No violations found.
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead><tr><th class="ps">Date</th><th>Violation</th><th>Severity</th><th>Sanction</th><th>Status</th><th>Recorded By</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="v in filteredViols" :key="v.id">
                  <td class="ps" style="white-space:nowrap">{{ v.date || '—' }}</td>
                  <td>{{ v.violation }}</td>
                  <td><span class="badge" :class="sevCls(v.severity)">{{ v.severity }}</span></td>
                  <td>{{ v.sanction || '—' }}</td>
                  <td><span class="badge" :class="vstCls(v.status)">{{ v.status }}</span></td>
                  <td>{{ v.recorded_by || '—' }}</td>
                  <td><div class="act-btns">
                    <button class="btn-icon" @click="openModal('violation',v)"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon danger" @click="del('student_violations',v.id)"><i class="bi bi-trash"></i></button>
                  </div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </template>

    <!-- ══ MODAL ══ -->
    <Teleport to="body">
    <div v-if="showModal" @click.self="showModal=false" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;box-sizing:border-box;">
      <div style="background:#fff;border-radius:12px;width:100%;max-width:640px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div class="modal-head">
          <span>{{ modalTitle }}</span>
          <button @click="showModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">

          <!-- Grade -->
          <template v-if="modalType==='grade'">
            <div class="form-grid">
              <div class="field"><label>Subject Code *</label><input v-model="mf.code" placeholder="CS301" /></div>
              <div class="field"><label>Description *</label><input v-model="mf.description" placeholder="Data Structures" /></div>
              <div class="field"><label>Units</label><input v-model.number="mf.units" type="number" min="1" max="6" /></div>
              <div class="field">
                <label>Midterm <span style="color:#adb5bd;font-weight:400;text-transform:none;letter-spacing:0">(0–100)</span></label>
                <input v-model.number="mf.midterm" type="number" min="0" max="100"
                  @input="mf.midterm = clampGrade(mf.midterm)"
                  @blur="mf.midterm = clampGrade(mf.midterm); autoComputeGrade()"
                  placeholder="Enter midterm score" />
                <div class="score-bar-wrap" v-if="mf.midterm !== null && mf.midterm !== ''">
                  <div class="score-bar-track">
                    <div class="score-bar-fill" :style="{width: mf.midterm + '%', background: scoreColor(mf.midterm)}"></div>
                  </div>
                  <span class="score-pct" :style="{color: scoreColor(mf.midterm)}">{{ mf.midterm }}%</span>
                </div>
              </div>
              <div class="field">
                <label>Finals <span style="color:#adb5bd;font-weight:400;text-transform:none;letter-spacing:0">(0–100)</span></label>
                <input v-model.number="mf.finals" type="number" min="0" max="100"
                  @input="mf.finals = clampGrade(mf.finals)"
                  @blur="mf.finals = clampGrade(mf.finals); autoComputeGrade()"
                  placeholder="Enter finals score" />
                <div class="score-bar-wrap" v-if="mf.finals !== null && mf.finals !== ''">
                  <div class="score-bar-track">
                    <div class="score-bar-fill" :style="{width: mf.finals + '%', background: scoreColor(mf.finals)}"></div>
                  </div>
                  <span class="score-pct" :style="{color: scoreColor(mf.finals)}">{{ mf.finals }}%</span>
                </div>
              </div>
              <div class="field">
                <label>Final Grade <span style="color:#adb5bd;font-weight:400;text-transform:none;letter-spacing:0">(auto-computed)</span></label>
                <input v-model="mf.final_grade" placeholder="e.g. 1.5" readonly style="background:#f8f9fa;color:#1a6b2e;font-weight:700;cursor:default;" />
              </div>
              <div class="field"><label>Remarks</label>
                <select v-model="mf.remarks"><option>Passed</option><option>Failed</option><option>Incomplete</option><option>Pending</option></select>
              </div>
            </div>
            <div class="grade-summary" v-if="mf.midterm !== null && mf.finals !== null && mf.midterm !== '' && mf.finals !== ''">
              <div class="grade-summary-row">
                <span>Average Score</span>
                <strong>{{ ((Number(mf.midterm) + Number(mf.finals)) / 2).toFixed(1) }}%</strong>
              </div>
              <div class="grade-summary-row">
                <span>Grade Equivalent</span>
                <strong style="color:#1a6b2e;font-size:15px">{{ mf.final_grade || '—' }}</strong>
              </div>
            </div>
          </template>

          <!-- Affiliation -->
          <template v-else-if="modalType==='affiliation'">
            <div class="form-grid">
              <div class="field full"><label>Name *</label><input v-model="mf.name" placeholder="e.g. Computer Science Society" /></div>
              <div class="field"><label>Type</label>
                <select v-model="mf.type"><option>Organization</option><option>Sports</option><option>Club</option><option>Committee</option><option>Other</option></select>
              </div>
              <div class="field"><label>Role / Position</label><input v-model="mf.role" placeholder="e.g. President, Member" /></div>
              <div class="field"><label>Year Joined</label><input v-model="mf.year_joined" placeholder="2023" /></div>
              <div class="field"><label>Status</label>
                <select v-model="mf.status"><option>Active</option><option>Inactive</option><option>Alumni</option></select>
              </div>
            </div>
          </template>

          <!-- Skill -->
          <template v-else-if="modalType==='skill'">
            <div class="form-grid">
              <div class="field full"><label>Skill / Talent *</label><input v-model="mf.name" placeholder="e.g. Basketball, Quiz Bee, Singing" /></div>
              <div class="field full"><label>Category</label>
                <select v-model="mf.category"><option>Academic</option><option>Sports</option><option>Arts</option><option>Technology</option><option>Leadership</option><option>Other</option></select>
              </div>
            </div>
          </template>

          <!-- Academic History -->
          <template v-else-if="modalType==='academic_history'">
            <div class="form-grid">
              <div class="field full"><label>Title *</label><input v-model="mf.title" placeholder="e.g. Dean's Lister, With Honors" /></div>
              <div class="field"><label>Institution</label><input v-model="mf.institution" placeholder="School / University" /></div>
              <div class="field"><label>Type</label>
                <select v-model="mf.type"><option>Award</option><option>Honor</option><option>Previous School</option><option>Scholarship</option><option>Certificate</option><option>Other</option></select>
              </div>
              <div class="field"><label>Year</label><input v-model="mf.year" placeholder="2023" /></div>
              <div class="field full"><label>Description</label><textarea v-model="mf.description" rows="2" placeholder="Details…"></textarea></div>
            </div>
          </template>

          <!-- Non-Academic History -->
          <template v-else-if="modalType==='nonacademic_history'">
            <div class="form-grid">
              <div class="field full"><label>Title *</label><input v-model="mf.title" placeholder="e.g. Regional Basketball Champion" /></div>
              <div class="field"><label>Category</label>
                <select v-model="mf.category"><option>Sports</option><option>Arts</option><option>Community</option><option>Leadership</option><option>Competition</option><option>Other</option></select>
              </div>
              <div class="field"><label>Year</label><input v-model="mf.year" placeholder="2023" /></div>
              <div class="field full"><label>Description</label><textarea v-model="mf.description" rows="2" placeholder="Details…"></textarea></div>
            </div>
          </template>

          <!-- Violation -->
          <template v-else-if="modalType==='violation'">
            <div class="form-grid">
              <div class="field full"><label>Violation *</label><input v-model="mf.violation" placeholder="Describe the violation" /></div>
              <div class="field"><label>Date</label><CalendarPicker v-model="mf.date" placeholder="Select date" /></div>
              <div class="field"><label>Severity</label>
                <select v-model="mf.severity"><option>Minor</option><option>Major</option><option>Serious</option></select>
              </div>
              <div class="field"><label>Sanction</label><input v-model="mf.sanction" placeholder="e.g. Warning, Suspension" /></div>
              <div class="field"><label>Status</label>
                <select v-model="mf.status"><option>Pending</option><option>Resolved</option><option>Appealing</option></select>
              </div>
              <div class="field"><label>Recorded By</label><input v-model="mf.recorded_by" placeholder="Admin / Faculty name" /></div>
              <div class="field full"><label>Notes</label><textarea v-model="mf.notes" rows="2" placeholder="Additional notes…"></textarea></div>
            </div>
          </template>

          <div v-if="modalErr" class="form-error">{{ modalErr }}</div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="showModal=false">Cancel</button>
          <button class="btn-primary" @click="saveModal" :disabled="saving">
            <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
            <span v-else>Save</span>
          </button>
        </div>
      </div>
    </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase.js'
import { logActivity } from '@/lib/activityLog.js'
import { useAuthStore } from '@/store/auth.js'
import CalendarPicker from '@/components/CalendarPicker.vue'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const studentId = route.params.id
const loading   = ref(true)
const student   = ref(null)

const grades             = ref([])
const affiliations       = ref([])
const skills             = ref([])
const academicHistory    = ref([])
const nonAcademicHistory = ref([])
const violations         = ref([])

// ── Search & filter state ────────────────────────────────────
const gradeSearch    = ref('')
const affSearch      = ref('')
const affTypeFilter  = ref('')
const affStatusFilter= ref('')
const skillSearch    = ref('')
const skillCatFilter = ref('')
const acadSearch     = ref('')
const acadTypeFilter = ref('')
const nonAcadSearch  = ref('')
const nonAcadCatFilter = ref('')
const violSearch     = ref('')
const violSevFilter  = ref('')
const violStatFilter = ref('')

// ── Filtered computed ────────────────────────────────────────
const filteredGrades = computed(() => {
  const q = gradeSearch.value.toLowerCase()
  return grades.value.filter(g => !q || g.code.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
})
const filteredAffs = computed(() => {
  return affiliations.value.filter(a => {
    const q = affSearch.value.toLowerCase()
    if (affTypeFilter.value && a.type !== affTypeFilter.value) return false
    if (affStatusFilter.value && a.status !== affStatusFilter.value) return false
    if (q && !a.name.toLowerCase().includes(q) && !(a.role||'').toLowerCase().includes(q)) return false
    return true
  })
})
const filteredSkills = computed(() => {
  return skills.value.filter(s => {
    const q = skillSearch.value.toLowerCase()
    if (skillCatFilter.value && s.category !== skillCatFilter.value) return false
    if (q && !s.name.toLowerCase().includes(q)) return false
    return true
  })
})
const filteredAcad = computed(() => {
  return academicHistory.value.filter(h => {
    const q = acadSearch.value.toLowerCase()
    if (acadTypeFilter.value && h.type !== acadTypeFilter.value) return false
    if (q && !h.title.toLowerCase().includes(q) && !(h.institution||'').toLowerCase().includes(q)) return false
    return true
  })
})
const filteredNonAcad = computed(() => {
  return nonAcademicHistory.value.filter(h => {
    const q = nonAcadSearch.value.toLowerCase()
    if (nonAcadCatFilter.value && h.category !== nonAcadCatFilter.value) return false
    if (q && !h.title.toLowerCase().includes(q)) return false
    return true
  })
})
const filteredViols = computed(() => {
  return violations.value.filter(v => {
    const q = violSearch.value.toLowerCase()
    if (violSevFilter.value && v.severity !== violSevFilter.value) return false
    if (violStatFilter.value && v.status !== violStatFilter.value) return false
    if (q && !v.violation.toLowerCase().includes(q) && !(v.sanction||'').toLowerCase().includes(q)) return false
    return true
  })
})

// ── Tabs ─────────────────────────────────────────────────────
const activeTab = ref('personal')
const tabs = computed(() => [
  { key:'personal',            label:'Profile',         icon:'bi bi-person-fill' },
  { key:'grades',              label:'Grades',          icon:'bi bi-award',                    count: grades.value.length },
  { key:'affiliations',        label:'Affiliations',    icon:'bi bi-people-fill',              count: affiliations.value.length },
  { key:'skills',              label:'Skills',          icon:'bi bi-star-fill',                count: skills.value.length },
  { key:'academic_history',    label:'Academic',        icon:'bi bi-mortarboard-fill',         count: academicHistory.value.length },
  { key:'nonacademic_history', label:'Non-Academic',    icon:'bi bi-trophy-fill',              count: nonAcademicHistory.value.length },
  { key:'violations',          label:'Violations',      icon:'bi bi-exclamation-triangle-fill',count: violations.value.length },
])

// ── Modal state ───────────────────────────────────────────────
const showModal  = ref(false)
const modalType  = ref('')
const modalTitle = ref('')
const saving     = ref(false)
const modalErr   = ref('')
const editingId  = ref(null)
const mf         = ref({})

const blankForms = {
  grade:               () => ({ code:'', description:'', units:3, midterm:null, finals:null, final_grade:'', remarks:'Passed' }),
  affiliation:         () => ({ name:'', type:'Organization', role:'', year_joined: String(new Date().getFullYear()), status:'Active' }),
  skill:               () => ({ name:'', category:'Academic' }),
  academic_history:    () => ({ title:'', institution:'', type:'Award', year: String(new Date().getFullYear()), description:'' }),
  nonacademic_history: () => ({ title:'', category:'Sports', year: String(new Date().getFullYear()), description:'' }),
  violation:           () => ({ violation:'', date:'', severity:'Minor', sanction:'', status:'Pending', recorded_by:'', notes:'' }),
}

const titleMap = {
  grade:'Grade', affiliation:'Affiliation', skill:'Skill / Talent',
  academic_history:'Academic History', nonacademic_history:'Non-Academic Entry', violation:'Disciplinary Record',
}

function openModal(type, existing = null) {
  modalType.value  = type
  modalTitle.value = (existing ? 'Edit ' : 'Add ') + (titleMap[type] || type)
  modalErr.value   = ''
  editingId.value  = existing?.id || null
  mf.value         = existing ? { ...existing } : blankForms[type]()
  showModal.value  = true
}

// ── Table map (Supabase table names) ─────────────────────────
const tableMap = {
  grade:               'grades',
  affiliation:         'student_affiliations',
  skill:               'student_skills',
  academic_history:    'student_academic_history',
  nonacademic_history: 'student_nonacademic_history',
  violation:           'student_violations',
}

async function saveModal() {
  saving.value = true; modalErr.value = ''
  const table   = tableMap[modalType.value]
  const payload = { ...mf.value }

  // Attach student_id
  if (table === 'grades') payload.student_id = studentId
  else payload.student_id = studentId

  let err
  if (editingId.value) {
    const res = await supabase.from(table).update({ ...payload, updated_at: new Date() }).eq('id', editingId.value)
    err = res.error
  } else {
    const res = await supabase.from(table).insert(payload)
    err = res.error
  }

  saving.value = false
  if (err) { modalErr.value = err.message; return }

  await logActivity({
    actorType:'admin', actorId: auth.state.user?.id||'admin',
    actorName: auth.state.user?.name||'Admin',
    action: (editingId.value?'Updated ':'Added ') + modalType.value,
    targetType:'student', targetId: studentId, targetName: student.value?.name
  })
  showModal.value = false
  await loadAll()
}

async function del(table, id) {
  if (!confirm('Delete this record?')) return
  await supabase.from(table).delete().eq('id', id)
  await loadAll()
}

// ── Load all data ─────────────────────────────────────────────
async function loadAll() {
  loading.value = true
  const [stu, grds, affs, skls, acad, nonacad, viols] = await Promise.all([
    supabase.from('students').select('*, faculty:adviser_id(name,department)').eq('id', studentId).single(),
    supabase.from('grades').select('*').eq('student_id', studentId).order('code'),
    supabase.from('student_affiliations').select('*').eq('student_id', studentId).order('name'),
    supabase.from('student_skills').select('*').eq('student_id', studentId).order('name'),
    supabase.from('student_academic_history').select('*').eq('student_id', studentId).order('year', { ascending: false }),
    supabase.from('student_nonacademic_history').select('*').eq('student_id', studentId).order('year', { ascending: false }),
    supabase.from('student_violations').select('*').eq('student_id', studentId).order('date', { ascending: false }),
  ])
  student.value            = stu.data
  grades.value             = grds.data || []
  affiliations.value       = affs.data || []
  skills.value             = skls.data || []
  academicHistory.value    = acad.data || []
  nonAcademicHistory.value = nonacad.data || []
  violations.value         = viols.data || []
  loading.value = false
}
onMounted(loadAll)

// ── Info fields ───────────────────────────────────────────────
const personalFields = computed(() => {
  const s = student.value
  return [
    { label:'Full Name',     value: s?.name },
    { label:'Date of Birth', value: formatDob(s?.date_of_birth) },
    { label:'Email',         value: s?.email },
    { label:'Phone',         value: s?.phone },
    { label:'Address',       value: s?.address },
    { label:'Gender',        value: s?.gender },
  ]
})
const academicFields = computed(() => {
  const s = student.value
  return [
    { label:'Student ID',  value: s?.id },
    { label:'Program',     value: s?.program },
    { label:'Year Level',  value: s?.year_level },
    { label:'Section',     value: s?.section },
    { label:'Semester',    value: s?.semester },
    { label:'Adviser',     value: s?.faculty?.name || '—' },
  ]
})

function formatDob(dob) {
  if (!dob) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return new Date(dob + 'T00:00:00').toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })
  }
  return dob
}

// ── Badge helpers ─────────────────────────────────────────────
const sevCls = s => ({ Minor:'bminor', Major:'bmajor', Serious:'bserious' }[s]||'bminor')
const vstCls = s => ({ Pending:'bprog', Resolved:'bp', Appealing:'bminor' }[s]||'bprog')
const skClass = c => ({ Academic:'sk-a', Sports:'sk-s', Arts:'sk-art', Technology:'sk-t', Leadership:'sk-l', Other:'sk-o' }[c]||'sk-o')
const skIcon  = c => ({ Academic:'bi bi-book', Sports:'bi bi-trophy', Arts:'bi bi-palette', Technology:'bi bi-cpu', Leadership:'bi bi-person-badge', Other:'bi bi-star' }[c]||'bi bi-star')

// ── Grade helpers ─────────────────────────────────────────────
function clampGrade(val) {
  if (val === null || val === '' || val === undefined) return val
  const n = Number(val)
  if (isNaN(n)) return 0
  return Math.min(100, Math.max(0, Math.round(n)))
}

function scoreColor(val) {
  const n = Number(val)
  if (n >= 90) return '#198754'  // green — excellent
  if (n >= 80) return '#1a6b2e'  // dark green — good
  if (n >= 75) return '#d4a017'  // gold — passing
  return '#dc3545'               // red — failing
}

// PH grading: average of midterm+finals → GWA equivalent
function autoComputeGrade() {
  const mid = Number(mf.value.midterm)
  const fin = Number(mf.value.finals)
  if (isNaN(mid) || isNaN(fin) || mf.value.midterm === '' || mf.value.finals === '') return
  const avg = (mid + fin) / 2

  let equiv, remarks
  if      (avg >= 97) { equiv = '1.00'; remarks = 'Passed' }
  else if (avg >= 94) { equiv = '1.25'; remarks = 'Passed' }
  else if (avg >= 91) { equiv = '1.50'; remarks = 'Passed' }
  else if (avg >= 88) { equiv = '1.75'; remarks = 'Passed' }
  else if (avg >= 85) { equiv = '2.00'; remarks = 'Passed' }
  else if (avg >= 82) { equiv = '2.25'; remarks = 'Passed' }
  else if (avg >= 79) { equiv = '2.50'; remarks = 'Passed' }
  else if (avg >= 76) { equiv = '2.75'; remarks = 'Passed' }
  else if (avg >= 75) { equiv = '3.00'; remarks = 'Passed' }
  else                { equiv = '5.00'; remarks = 'Failed' }

  mf.value.final_grade = equiv
  mf.value.remarks     = remarks
}
</script>

<style>
.page-bar{display:flex;align-items:center;gap:12px;margin-bottom:16px;}
.back-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;font-size:12px;font-weight:600;color:#1a6b2e;cursor:pointer;font-family:inherit;}
.back-btn:hover{background:#eaf4ec;}
.loading-state{padding:60px;text-align:center;color:#6c757d;font-size:14px;}

/* Hero */
.profile-hero{background:#1a6b2e;border-radius:12px;padding:22px 24px;display:flex;align-items:center;gap:18px;margin-bottom:16px;}
.hero-avatar{width:56px;height:56px;border-radius:13px;background:#d4a017;color:#1a6b2e;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;flex-shrink:0;}
.hero-name{font-size:17px;font-weight:700;color:#fff;margin-bottom:3px;}
.hero-sub{font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:7px;}
.hero-id{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:rgba(233,168,37,0.2);border:1px solid rgba(233,168,37,0.35);border-radius:20px;font-size:10px;font-weight:700;color:#d4a017;}

/* Tabs */
.tabs{display:flex;gap:0;border-bottom:2px solid #d6e4d8;margin-bottom:16px;overflow-x:auto;}
.tab{padding:9px 14px;background:none;border:none;border-bottom:3px solid transparent;margin-bottom:-2px;font-size:12px;font-weight:600;color:#6c757d;cursor:pointer;display:flex;align-items:center;gap:5px;white-space:nowrap;font-family:inherit;flex-shrink:0;}
.tab.active{color:#1a6b2e;border-bottom-color:#1a6b2e;}
.tab-count{font-size:10px;font-weight:700;padding:1px 6px;border-radius:20px;background:#eaf4ec;color:#1a6b2e;}
.tab-count-warn{background:#fff0f0!important;color:#dc3545!important;}

/* Info grid */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;margin-bottom:14px;}
.panel-head{padding:11px 16px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.panel-body{padding:14px 16px;}
.count-badge{font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#eaf4ec;color:#1a6b2e;}
.info-row{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f8f9fa;gap:12px;}
.info-row:last-child{border-bottom:none;}
.info-lbl{font-size:11px;color:#6c757d;font-weight:600;flex-shrink:0;}
.info-val{font-size:12px;color:#1a6b2e;font-weight:600;text-align:right;word-break:break-all;}

/* Tab toolbar */
.tab-bar{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;}
.search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;padding:7px 12px;flex:1;min-width:180px;}
.search-wrap i{color:#6c757d;font-size:13px;flex-shrink:0;}
.search-wrap input{border:none;outline:none;font-size:13px;font-family:inherit;width:100%;}
.filter-sel{padding:7px 10px;border:1px solid #d6e4d8;border-radius:8px;font-size:12px;font-family:inherit;background:#fff;outline:none;flex-shrink:0;}
.btn-primary{padding:9px 16px;background:#1a6b2e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit;white-space:nowrap;}
.btn-primary.sm{padding:7px 14px;font-size:12px;}
.btn-primary:disabled{opacity:.6;}

/* Table */
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:9px 13px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
th.ps{padding-left:18px;}
td{padding:9px 13px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
td.ps{padding-left:18px;}
td.ctr{text-align:center;}
td.trunc{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.act-btns{display:flex;gap:5px;}
.btn-icon{width:28px;height:28px;border-radius:7px;border:1px solid #d6e4d8;background:#fff;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;color:#6c757d;}
.btn-icon:hover{background:#eaf4ec;color:#1a6b2e;border-color:#1a6b2e;}
.btn-icon.danger:hover{background:#fff0f0;color:#dc3545;border-color:#dc3545;}
.btn-icon.xs{width:22px;height:22px;font-size:11px;}

/* Badges */
.badge{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:700;}
.bp    {background:#f0fff4;color:#198754;}
.bf    {background:#fff0f0;color:#dc3545;}
.bg    {background:#f8f9fa;color:#6c757d;}
.bprog {background:#eaf4ec;color:#1a6b2e;}
.bminor{background:#fff8e1;color:#b8890e;}
.bmajor{background:#fff0f0;color:#dc3545;}
.bserious{background:#dc3545;color:#fff;}

/* Skills */
.skills-wrap{display:flex;flex-direction:column;gap:0;padding:4px 0;}
.skill-row{display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid #f2f2f2;}
.skill-row:last-child{border-bottom:none;}
.skill-row:hover{background:#f8f9fa;}
.skill-tag{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;}
.sk-a  {background:#eaf4ec;color:#1a6b2e;}
.sk-s  {background:#fff8e1;color:#b8890e;}
.sk-art{background:#f5f0ff;color:#6f42c1;}
.sk-t  {background:#f0fff4;color:#198754;}
.sk-l  {background:#fff0f0;color:#dc3545;}
.sk-o  {background:#f8f9fa;color:#6c757d;}
.skill-cat-lbl{font-size:11px;color:#6c757d;flex:1;}

/* Empty */
.empty-table{padding:20px 16px;font-size:12px;color:#6c757d;}
.empty-table.clean{display:flex;align-items:center;gap:8px;}

/* Modal — fixed centered, no whitespace */
.modal-overlay{
  position:fixed;
  top:0 !important;
  left:0 !important;
  right:0 !important;
  bottom:0 !important;
  width:100vw !important;
  height:100vh !important;
  background:rgba(0,0,0,0.5);
  display:flex;align-items:center;justify-content:center;
  z-index:99999;padding:20px;
}
.modal{
  background:#fff;border-radius:12px;width:100%;max-width:640px;
  display:flex;flex-direction:column;
  overflow:hidden;margin:auto;
  box-shadow:0 20px 60px rgba(0,0,0,0.3);
  /* No fixed height — shrinks to fit content */
}
.modal-head{padding:14px 18px;border-bottom:1px solid #d6e4d8;display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;color:#1a6b2e;flex-shrink:0;}
.modal-head button{background:none;border:none;cursor:pointer;font-size:16px;color:#6c757d;}
.modal-body{padding:18px;overflow-y:auto;max-height:55vh;}
.modal-foot{padding:14px 18px;border-top:1px solid #d6e4d8;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;background:#fff;}
.btn-cancel{padding:8px 16px;background:#f8f9fa;border:1px solid #d6e4d8;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;}

/* Form */
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.full{grid-column:1/-1;}
.field{display:flex;flex-direction:column;gap:5px;}
.field label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6c757d;}
.field input,.field select,.field textarea{
  padding:9px 11px;border:1px solid #d6e4d8;border-radius:7px;
  font-size:13px;font-family:inherit;outline:none;background:#fff;
  width:100%;box-sizing:border-box;resize:vertical;
}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#1a6b2e;}
.form-error{margin-top:10px;padding:9px 12px;background:#fff0f0;border:1px solid #f5c6cb;border-radius:7px;font-size:12px;color:#c0392b;}

@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
@media(max-width:768px){.info-grid{grid-template-columns:1fr;}.tabs{flex-wrap:nowrap;overflow-x:auto;}}

/* Grade score bars */
.score-bar-wrap{display:flex;align-items:center;gap:8px;margin-top:6px;}
.score-bar-track{flex:1;height:6px;background:#f0f0f0;border-radius:99px;overflow:hidden;}
.score-bar-fill{height:100%;border-radius:99px;transition:width .3s ease, background .3s ease;}
.score-pct{font-size:11px;font-weight:700;min-width:36px;text-align:right;}

/* Grade summary box */
.grade-summary{margin-top:14px;padding:12px 16px;background:#f0fff4;border:1px solid #c3e6cb;border-radius:9px;display:flex;gap:20px;}
.grade-summary-row{display:flex;flex-direction:column;gap:3px;}
.grade-summary-row span{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6c757d;}
.grade-summary-row strong{font-size:14px;color:#212529;}
</style>