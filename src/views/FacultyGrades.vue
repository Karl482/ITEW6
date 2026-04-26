<template>
  <div>

    <!-- Subject selector -->
    <div class="subject-tabs" v-if="subjects.length">
      <button
        v-for="s in subjects" :key="s.id"
        :class="['subj-tab', selected?.id === s.id ? 'active' : '']"
        @click="selectSubject(s)"
      >
        <span class="subj-code">{{ s.code }}</span>
        <span class="subj-sec">{{ s.section }}</span>
      </button>
    </div>
    <div v-else-if="!loadingSubjects" class="empty-state">
      <i class="bi bi-journal-x"></i> No subjects assigned.
    </div>

    <!-- Grade table -->
    <div v-if="selected" class="panel">
      <div class="panel-head">
        <div>
          <span class="panel-title">{{ selected.description }}</span>
          <span class="panel-sub">{{ selected.section }} · {{ selected.schedule || '—' }}</span>
        </div>
        <span class="count-badge">{{ students.length }} students</span>
      </div>

      <div v-if="loadingStudents" class="empty-state">
        <i class="bi bi-arrow-repeat spin"></i> Loading…
      </div>
      <div v-else-if="students.length === 0" class="empty-state">
        <i class="bi bi-people"></i> No enrolled students found for this section.
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>ID</th>
              <th>Midterm</th>
              <th>Finals</th>
              <th>Final Grade</th>
              <th>Remarks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.student.id">
              <td>
                <div class="name-cell">
                  <div class="avatar">{{ row.student.initials }}</div>
                  <div>
                    <div class="sname">{{ row.student.name }}</div>
                    <div class="semail">{{ row.student.email }}</div>
                  </div>
                </div>
              </td>
              <td><strong>{{ row.student.id }}</strong></td>
              <td>
                <span v-if="!row.editing" class="grade-val">{{ row.grade?.midterm ?? '—' }}</span>
              </td>
              <td>
                <span v-if="!row.editing" class="grade-val">{{ row.grade?.finals ?? '—' }}</span>
              </td>
              <td>
                <span v-if="!row.editing && row.grade?.final_grade" class="final-badge">
                  {{ row.grade.final_grade }}
                </span>
                <span v-else-if="!row.editing" class="grade-val">—</span>
              </td>
              <td>
                <span v-if="!row.editing" :class="['remarks-badge', row.grade?.remarks === 'Failed' ? 'failed' : 'passed']">
                  {{ row.grade?.remarks || '—' }}
                </span>
              </td>
              <td>
                <button class="btn-edit" @click="openEdit(row)" v-if="!row.editing">
                  <i class="bi bi-pencil-square"></i>
                  {{ row.grade ? 'Edit' : 'Add' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Grade Modal -->
    <div v-if="modal" class="modal-overlay" @click.self="modal = false">
      <div class="modal">
        <div class="modal-head">
          <span>{{ editTarget?.grade ? 'Edit Grade' : 'Add Grade' }}</span>
          <button @click="modal = false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="student-info">
            <div class="avatar lg">{{ editTarget?.student.initials }}</div>
            <div>
              <div class="sname">{{ editTarget?.student.name }}</div>
              <div class="semail">{{ editTarget?.student.id }} · {{ selected?.code }} {{ selected?.section }}</div>
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label>Midterm Score</label>
              <input v-model.number="form.midterm" type="number" min="0" max="100" placeholder="0–100" />
            </div>
            <div class="field">
              <label>Finals Score</label>
              <input v-model.number="form.finals" type="number" min="0" max="100" placeholder="0–100" />
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label>Final Grade <span class="auto-tag">auto</span></label>
              <div :class="['computed-box', form.final_grade === '5.00' ? 'failed' : form.final_grade ? 'passed' : 'empty']">
                {{ form.final_grade || '—' }}
              </div>
            </div>
            <div class="field">
              <label>Remarks <span class="auto-tag">auto</span></label>
              <div :class="['computed-box', form.remarks === 'Failed' ? 'failed' : form.remarks === 'Passed' ? 'passed' : 'empty']">
                {{ form.remarks || '—' }}
              </div>
            </div>
          </div>
          <div class="grading-hint">
            <i class="bi bi-info-circle"></i>
            Final grade is computed as: (Midterm × 40%) + (Finals × 60%)
          </div>
          <div v-if="saveErr" class="form-error">{{ saveErr }}</div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="modal = false">Cancel</button>
          <button class="btn-primary" @click="saveGrade" :disabled="saving">
            <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
            <span v-else><i class="bi bi-check-lg"></i> Save Grade</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import { supabase } from '@/lib/supabase.js'
import { logActivity } from '@/lib/activityLog.js'

const auth = useAuthStore()
const facultyId = computed(() => auth.state.user?.id)

const subjects       = ref([])
const selected       = ref(null)
const students       = ref([])
const gradesMap      = ref({})   // student_id → grade row
const loadingSubjects= ref(true)
const loadingStudents= ref(false)
const modal          = ref(false)
const saving         = ref(false)
const saveErr        = ref('')
const editTarget     = ref(null)

const form = ref({ midterm: '', finals: '', final_grade: '', remarks: '' })

// ── Grading scale (Philippine university standard) ───────────
// Average = (midterm * 40%) + (finals * 60%)
function computeGrade(midterm, finals) {
  const m = parseFloat(midterm)
  const f = parseFloat(finals)
  if (isNaN(m) || isNaN(f)) return { final_grade: '', remarks: '' }

  const avg = (m * 0.4) + (f * 0.6)

  let grade
  if      (avg >= 97) grade = '1.00'
  else if (avg >= 94) grade = '1.25'
  else if (avg >= 91) grade = '1.50'
  else if (avg >= 88) grade = '1.75'
  else if (avg >= 85) grade = '2.00'
  else if (avg >= 82) grade = '2.25'
  else if (avg >= 79) grade = '2.50'
  else if (avg >= 76) grade = '2.75'
  else if (avg >= 75) grade = '3.00'
  else                grade = '5.00'

  return { final_grade: grade, remarks: grade === '5.00' ? 'Failed' : 'Passed' }
}

// Auto-compute whenever midterm or finals changes
watch(() => [form.value.midterm, form.value.finals], ([m, f]) => {
  const result = computeGrade(m, f)
  form.value.final_grade = result.final_grade
  form.value.remarks     = result.remarks
})

// rows = students merged with their grade for this subject
const rows = computed(() =>
  students.value.map(s => ({
    student: s,
    grade:   gradesMap.value[s.id] || null,
    editing: false,
  }))
)

onMounted(async () => {
  const { data } = await supabase
    .from('faculty_subjects')
    .select('*')
    .eq('faculty_id', facultyId.value)
    .order('code')
  subjects.value = data || []
  loadingSubjects.value = false
  if (subjects.value.length) selectSubject(subjects.value[0])
})

async function selectSubject(subj) {
  selected.value = subj
  loadingStudents.value = true
  students.value = []
  gradesMap.value = {}

  // fetch students in this section
  const { data: stuData } = await supabase
    .from('students')
    .select('id, initials, name, email, section')
    .eq('section', subj.section)
    .order('name')
  students.value = stuData || []

  // fetch existing grades for this subject + these students
  if (students.value.length) {
    const ids = students.value.map(s => s.id)
    const { data: gradeData } = await supabase
      .from('grades')
      .select('*')
      .eq('code', subj.code)
      .in('student_id', ids)
    ;(gradeData || []).forEach(g => { gradesMap.value[g.student_id] = g })
  }

  loadingStudents.value = false
}

function openEdit(row) {
  editTarget.value = row
  const g = row.grade
  form.value = {
    midterm:     g?.midterm ?? '',
    finals:      g?.finals  ?? '',
    final_grade: g?.final_grade ?? '',
    remarks:     g?.remarks || '',
  }
  // trigger auto-compute if scores already exist
  if (g?.midterm != null && g?.finals != null) {
    const result = computeGrade(g.midterm, g.finals)
    form.value.final_grade = result.final_grade
    form.value.remarks     = result.remarks
  }
  saveErr.value = ''
  modal.value = true
}

async function saveGrade() {
  saving.value = true
  saveErr.value = ''
  const student = editTarget.value.student
  const existing = editTarget.value.grade

  const payload = {
    student_id:  student.id,
    code:        selected.value.code,
    description: selected.value.description,
    units:       selected.value.units,
    faculty_id:  facultyId.value,
    midterm:     form.value.midterm !== '' ? Number(form.value.midterm) : null,
    finals:      form.value.finals  !== '' ? Number(form.value.finals)  : null,
    final_grade: form.value.final_grade || null,
    remarks:     form.value.remarks,
    updated_at:  new Date(),
  }

  try {
    if (existing) {
      const { error } = await supabase.from('grades').update(payload).eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('grades').insert(payload)
      if (error) throw error
    }

    await logActivity({
      actorType:  'faculty',
      actorId:    facultyId.value,
      actorName:  auth.state.user?.name,
      action:     existing ? 'Updated grade' : 'Added grade',
      targetType: 'student',
      targetId:   student.id,
      targetName: student.name,
      details:    { subject: selected.value.code, section: selected.value.section },
    })

    // refresh grades for this subject
    await selectSubject(selected.value)
    modal.value = false
  } catch (err) {
    saveErr.value = err.message || 'Failed to save grade.'
  }
  saving.value = false
}
</script>

<style scoped>
/* Subject tabs */
.subject-tabs { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
.subj-tab { display:flex; flex-direction:column; align-items:flex-start; padding:8px 14px; background:#fff; border:1px solid #d6e4d8; border-radius:9px; cursor:pointer; font-family:inherit; transition:all .15s; }
.subj-tab:hover { border-color:#1a6b2e; background:#eaf4ec; }
.subj-tab.active { background:#1a6b2e; border-color:#1a6b2e; }
.subj-tab.active .subj-code, .subj-tab.active .subj-sec { color:#fff; }
.subj-code { font-size:12px; font-weight:700; color:#1a6b2e; }
.subj-sec  { font-size:10px; color:#6c757d; margin-top:1px; }

/* Panel */
.panel { background:#fff; border:1px solid #d6e4d8; border-radius:10px; overflow:hidden; }
.panel-head { padding:12px 16px; border-bottom:1px solid #f2f2f2; display:flex; align-items:center; justify-content:space-between; }
.panel-title { font-size:13px; font-weight:700; color:#1a6b2e; display:block; }
.panel-sub { font-size:11px; color:#6c757d; margin-top:2px; display:block; }
.count-badge { font-size:10px; font-weight:700; padding:2px 9px; border-radius:20px; background:#eaf4ec; color:#1a6b2e; white-space:nowrap; }

/* Table */
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
th { padding:9px 13px; font-size:10px; text-transform:uppercase; letter-spacing:.5px; font-weight:700; color:#6c757d; border-bottom:2px solid #dee2e6; background:#f8f9fa; text-align:left; }
td { padding:9px 13px; font-size:12px; border-bottom:1px solid #f2f2f2; color:#495057; vertical-align:middle; }
tr:hover td { background:#f8f9fa; }
tr:last-child td { border-bottom:none; }
.name-cell { display:flex; align-items:center; gap:9px; }
.avatar { width:30px; height:30px; border-radius:8px; background:#1a6b2e; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
.avatar.lg { width:40px; height:40px; font-size:14px; border-radius:10px; }
.sname { font-size:12px; font-weight:600; color:#1a6b2e; }
.semail { font-size:11px; color:#6c757d; }
.grade-val { font-size:12px; color:#495057; }
.final-badge { padding:2px 9px; border-radius:5px; background:#eaf4ec; color:#1a6b2e; font-size:11px; font-weight:700; }
.remarks-badge { padding:2px 9px; border-radius:5px; font-size:10px; font-weight:700; }
.remarks-badge.passed { background:#eaf4ec; color:#1a6b2e; }
.remarks-badge.failed { background:#fff0f0; color:#dc3545; }
.btn-edit { padding:5px 12px; background:#eaf4ec; color:#1a6b2e; border:1px solid #d6e4d8; border-radius:7px; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:5px; font-family:inherit; white-space:nowrap; }
.btn-edit:hover { background:#1a6b2e; color:#fff; }

/* Modal */
.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px; }
.modal { background:#fff; border-radius:12px; width:100%; max-width:480px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,.3); }
.modal-head { padding:14px 18px; border-bottom:1px solid #d6e4d8; display:flex; align-items:center; justify-content:space-between; font-size:14px; font-weight:700; color:#1a6b2e; }
.modal-head button { background:none; border:none; cursor:pointer; font-size:16px; color:#6c757d; }
.modal-body { padding:18px; }
.student-info { display:flex; align-items:center; gap:12px; margin-bottom:18px; padding:12px; background:#f8f9fa; border-radius:9px; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.field { display:flex; flex-direction:column; gap:5px; }
.field label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#6c757d; }
.field input, .field select { padding:9px 11px; border:1px solid #d6e4d8; border-radius:7px; font-size:13px; font-family:inherit; outline:none; background:#fff; }
.field input:focus, .field select:focus { border-color:#1a6b2e; }
.form-error { padding:8px 12px; background:#fff0f0; border:1px solid #f5c6cb; border-radius:7px; font-size:12px; color:#c0392b; margin-top:8px; }
.computed-box { padding:9px 11px; border-radius:7px; font-size:14px; font-weight:700; border:1px solid #d6e4d8; background:#f8f9fa; text-align:center; }
.computed-box.passed { background:#eaf4ec; color:#1a6b2e; border-color:#b2d8bc; }
.computed-box.failed { background:#fff0f0; color:#dc3545; border-color:#f5c6cb; }
.computed-box.empty  { color:#adb5bd; }
.auto-tag { font-size:9px; font-weight:700; background:#eaf4ec; color:#1a6b2e; padding:1px 6px; border-radius:4px; margin-left:4px; text-transform:uppercase; letter-spacing:.3px; }
.grading-hint { font-size:11px; color:#6c757d; margin-top:4px; display:flex; align-items:center; gap:5px; }
.modal-foot { padding:14px 18px; border-top:1px solid #d6e4d8; display:flex; justify-content:flex-end; gap:10px; background:#fff; }
.btn-cancel { padding:8px 16px; background:#f8f9fa; border:1px solid #d6e4d8; border-radius:8px; font-size:13px; cursor:pointer; font-family:inherit; }
.btn-primary { padding:9px 18px; background:#1a6b2e; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; font-family:inherit; }
.btn-primary:disabled { opacity:.5; cursor:not-allowed; }

/* Empty / loading */
.empty-state { padding:40px; display:flex; align-items:center; justify-content:center; gap:10px; color:#6c757d; font-size:13px; }
.empty-state i { font-size:22px; color:#d6e4d8; }
@keyframes spin { to { transform:rotate(360deg); } }
.spin { display:inline-block; animation:spin .7s linear infinite; }
@media(max-width:600px) { .form-row { grid-template-columns:1fr; } }
</style>
