<template>
  <div>
    <!-- Header -->
    <div class="subj-header">
      <button class="back-btn" @click="router.back()">
        <i class="bi bi-arrow-left"></i> Back
      </button>
      <div class="subj-info">
        <div class="subj-code-badge">{{ subject?.code }}</div>
        <div>
          <div class="subj-name">{{ subject?.description }}</div>
          <div class="subj-meta">{{ subject?.section }} · {{ subject?.schedule || subject?.days + ' ' + subject?.time }} · {{ subject?.room }}</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button :class="['tab', tab==='materials' ? 'active' : '']" @click="tab='materials'">
        <i class="bi bi-folder2-open"></i> Materials
      </button>
      <button :class="['tab', tab==='submissions' ? 'active' : '']" @click="tab='submissions'">
        <i class="bi bi-upload"></i>
        {{ auth.isStudent.value ? 'My Submissions' : 'Student Submissions' }}
      </button>
    </div>

    <!-- ══ MATERIALS TAB ══ -->
    <div v-if="tab==='materials'">
      <!-- Faculty: upload form -->
      <div class="upload-card" v-if="auth.isFaculty.value">
        <div class="upload-card-title"><i class="bi bi-cloud-upload"></i> Upload Material</div>
        <div class="form-row">
          <div class="field">
            <label>Title *</label>
            <input v-model="matForm.title" placeholder="e.g. Week 1 Lecture Slides" />
          </div>
          <div class="field">
            <label>Description</label>
            <input v-model="matForm.description" placeholder="Optional description" />
          </div>
        </div>
        <div class="file-drop" @click="$refs.matFile.click()" @dragover.prevent @drop.prevent="onMatDrop">
          <i class="bi bi-cloud-upload" style="font-size:24px;color:#1a6b2e;margin-bottom:6px"></i>
          <div v-if="matForm.file">
            <span class="file-chosen"><i class="bi bi-file-earmark-check"></i> {{ matForm.file.name }}</span>
          </div>
          <div v-else>
            <div style="font-size:13px;font-weight:600;color:#1a6b2e">Click or drag file here</div>
            <div style="font-size:11px;color:#6c757d;margin-top:3px">PDF, PPT, PPTX, DOCX, ZIP — max 50MB</div>
          </div>
        </div>
        <input ref="matFile" type="file" style="display:none" accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.rar,.xlsx,.xls" @change="onMatFileChange" />
        <div v-if="matUploadErr" class="form-error">{{ matUploadErr }}</div>
        <div class="upload-actions">
          <button class="btn-primary" @click="uploadMaterial" :disabled="matUploading || !matForm.file || !matForm.title">
            <i v-if="matUploading" class="bi bi-arrow-repeat spin"></i>
            <span v-else><i class="bi bi-upload"></i> Upload</span>
          </button>
        </div>
      </div>

      <!-- Materials list -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">Course Materials</span>
          <span class="count-badge">{{ materials.length }}</span>
        </div>
        <div v-if="matLoading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
        <div v-else-if="materials.length===0" class="empty-state">
          <i class="bi bi-folder2-open"></i>
          <span>No materials uploaded yet.</span>
        </div>
        <div v-else>
          <div v-for="m in materials" :key="m.id" class="file-row">
            <div class="file-icon" :class="fileIconClass(m.file_type)">
              <i :class="fileIconName(m.file_type)"></i>
            </div>
            <div class="file-info">
              <div class="file-title">{{ m.title }}</div>
              <div class="file-meta">{{ m.file_name }} · {{ formatSize(m.file_size) }} · {{ formatDate(m.created_at) }}</div>
              <div class="file-desc" v-if="m.description">{{ m.description }}</div>
            </div>
            <div class="file-actions">
              <a :href="m.file_url" target="_blank" class="btn-download">
                <i class="bi bi-download"></i> Download
              </a>
              <button v-if="auth.isFaculty.value" class="btn-del" @click="deleteMaterial(m)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ SUBMISSIONS TAB ══ -->
    <div v-if="tab==='submissions'">
      <!-- Student: submit form -->
      <div class="upload-card" v-if="auth.isStudent.value">
        <div class="upload-card-title"><i class="bi bi-send"></i> Submit Work</div>
        <div class="form-row">
          <div class="field">
            <label>Title *</label>
            <input v-model="subForm.title" placeholder="e.g. Assignment 1 - My Solution" />
          </div>
          <div class="field">
            <label>Description</label>
            <input v-model="subForm.description" placeholder="Optional notes" />
          </div>
        </div>
        <div class="file-drop" @click="$refs.subFile.click()" @dragover.prevent @drop.prevent="onSubDrop">
          <i class="bi bi-file-earmark-arrow-up" style="font-size:24px;color:#1a6b2e;margin-bottom:6px"></i>
          <div v-if="subForm.file">
            <span class="file-chosen"><i class="bi bi-file-earmark-check"></i> {{ subForm.file.name }}</span>
          </div>
          <div v-else>
            <div style="font-size:13px;font-weight:600;color:#1a6b2e">Click or drag your file here</div>
            <div style="font-size:11px;color:#6c757d;margin-top:3px">Any file type — max 50MB</div>
          </div>
        </div>
        <input ref="subFile" type="file" style="display:none" @change="onSubFileChange" />
        <div v-if="subUploadErr" class="form-error">{{ subUploadErr }}</div>
        <div class="upload-actions">
          <button class="btn-primary" @click="uploadSubmission" :disabled="subUploading || !subForm.file || !subForm.title">
            <i v-if="subUploading" class="bi bi-arrow-repeat spin"></i>
            <span v-else><i class="bi bi-send"></i> Submit</span>
          </button>
        </div>
      </div>

      <!-- Faculty: see all student submissions -->
      <div v-if="auth.isFaculty.value" class="filter-bar">
        <input v-model="subSearch" class="search-input" placeholder="Search student submissions…" />
      </div>

      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">
            {{ auth.isStudent.value ? 'My Submissions' : 'All Student Submissions' }}
          </span>
          <span class="count-badge">{{ filteredSubs.length }}</span>
        </div>
        <div v-if="subLoading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
        <div v-else-if="filteredSubs.length===0" class="empty-state">
          <i class="bi bi-inbox"></i>
          <span>No submissions yet.</span>
        </div>
        <div v-else>
          <div v-for="s in filteredSubs" :key="s.id" class="file-row">
            <div class="file-icon file-icon-sub">
              <i class="bi bi-file-earmark-arrow-up"></i>
            </div>
            <div class="file-info">
              <div class="file-title">{{ s.title }}</div>
              <div class="file-meta">
                <span v-if="auth.isFaculty.value">{{ s.students?.name || s.student_id }} · </span>
                {{ s.file_name }} · {{ formatSize(s.file_size) }} · {{ formatDate(s.created_at) }}
              </div>
              <div class="file-desc" v-if="s.description">{{ s.description }}</div>
              <div class="feedback-row" v-if="s.feedback">
                <i class="bi bi-chat-text"></i> {{ s.feedback }}
              </div>
            </div>
            <div class="file-actions">
              <span class="status-badge" :class="subStatusClass(s.status)">{{ s.status }}</span>
              <span v-if="s.grade" class="grade-badge">{{ s.grade }}</span>
              <a :href="s.file_url" target="_blank" class="btn-download">
                <i class="bi bi-download"></i>
              </a>
              <!-- Faculty: grade button -->
              <button v-if="auth.isFaculty.value" class="btn-grade" @click="openGradeModal(s)">
                <i class="bi bi-pencil-square"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grade Modal (Faculty only) -->
    <div v-if="gradeModal" class="modal-overlay" @click.self="gradeModal=false">
      <div class="modal">
        <div class="modal-head">
          <span>Grade Submission</span>
          <button @click="gradeModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div style="font-size:13px;font-weight:600;color:#1a6b2e;margin-bottom:12px">
            {{ gradeTarget?.title }} — {{ gradeTarget?.students?.name || gradeTarget?.student_id }}
          </div>
          <div class="field" style="margin-bottom:12px">
            <label>Grade</label>
            <select v-model="gradeForm.grade">
              <option value="">— No grade —</option>
              <option>1.0</option><option>1.25</option><option>1.5</option>
              <option>1.75</option><option>2.0</option><option>2.25</option>
              <option>2.5</option><option>2.75</option><option>3.0</option>
              <option>5.0 (Failed)</option><option>INC</option>
            </select>
          </div>
          <div class="field">
            <label>Feedback</label>
            <textarea v-model="gradeForm.feedback" rows="3" placeholder="Write feedback for the student…"></textarea>
          </div>
          <div class="field" style="margin-top:12px">
            <label>Status</label>
            <select v-model="gradeForm.status">
              <option>Submitted</option>
              <option>Graded</option>
              <option>Returned</option>
            </select>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="gradeModal=false">Cancel</button>
          <button class="btn-primary" @click="saveGrade" :disabled="gradeSaving">
            <i v-if="gradeSaving" class="bi bi-arrow-repeat spin"></i>
            <span v-else>Save</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { supabase } from '@/lib/supabase.js'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const tab        = ref('materials')
const subject    = ref(null)
const materials  = ref([])
const submissions= ref([])
const matLoading = ref(true)
const subLoading = ref(true)
const matUploading = ref(false)
const subUploading = ref(false)
const matUploadErr = ref('')
const subUploadErr = ref('')
const subSearch  = ref('')
const gradeModal = ref(false)
const gradeTarget= ref(null)
const gradeSaving= ref(false)

const matFile = ref(null)
const subFile = ref(null)

const matForm = ref({ title:'', description:'', file: null })
const subForm = ref({ title:'', description:'', file: null })
const gradeForm = ref({ grade:'', feedback:'', status:'Graded' })

const subjectCode = route.params.code
const section     = route.params.section

// ── Load subject info ────────────────────────────────────────
onMounted(async () => {
  // Get subject from faculty_subjects or schedules
  const { data: fs } = await supabase
    .from('faculty_subjects')
    .select('*, faculty:faculty_id(name)')
    .eq('code', subjectCode)
    .eq('section', section)
    .single()
  subject.value = fs

  await loadMaterials()
  await loadSubmissions()
})

async function loadMaterials() {
  matLoading.value = true
  const { data } = await supabase
    .from('subject_materials')
    .select('*')
    .eq('subject_code', subjectCode)
    .eq('section', section)
    .order('created_at', { ascending: false })
  materials.value = data || []
  matLoading.value = false
}

async function loadSubmissions() {
  subLoading.value = true
  const uid  = auth.state.user?.id
  const role = auth.state.role

  let query = supabase
    .from('subject_submissions')
    .select('*, students:student_id(name, initials)')
    .eq('subject_code', subjectCode)
    .eq('section', section)
    .order('created_at', { ascending: false })

  if (role === 'student') query = query.eq('student_id', uid)

  const { data } = await query
  submissions.value = data || []
  subLoading.value = false
}

const filteredSubs = computed(() => {
  if (!subSearch.value) return submissions.value
  const q = subSearch.value.toLowerCase()
  return submissions.value.filter(s =>
    s.title.toLowerCase().includes(q) ||
    (s.students?.name || '').toLowerCase().includes(q)
  )
})

// ── File helpers ─────────────────────────────────────────────
function onMatFileChange(e)  { matForm.value.file = e.target.files[0] || null }
function onSubFileChange(e)  { subForm.value.file = e.target.files[0] || null }
function onMatDrop(e)        { matForm.value.file = e.dataTransfer.files[0] || null }
function onSubDrop(e)        { subForm.value.file = e.dataTransfer.files[0] || null }

async function uploadFile(file, folder) {
  const ext  = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from('subject-files')
    .upload(path, file, { cacheControl:'3600', upsert:false })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('subject-files').getPublicUrl(path)
  return { url: urlData.publicUrl, path }
}

// ── Upload material (faculty) ────────────────────────────────
async function uploadMaterial() {
  if (!matForm.value.file || !matForm.value.title) return
  matUploading.value = true; matUploadErr.value = ''
  try {
    const { url } = await uploadFile(matForm.value.file, `materials/${subjectCode}`)
    await supabase.from('subject_materials').insert({
      subject_code: subjectCode,
      section:      section,
      faculty_id:   auth.state.user.id,
      title:        matForm.value.title,
      description:  matForm.value.description,
      file_url:     url,
      file_name:    matForm.value.file.name,
      file_size:    matForm.value.file.size,
      file_type:    matForm.value.file.type,
    })
    matForm.value = { title:'', description:'', file:null }
    if (matFile.value) matFile.value.value = ''
    await loadMaterials()
  } catch (err) {
    matUploadErr.value = err.message || 'Upload failed.'
  }
  matUploading.value = false
}

// ── Delete material (faculty) ────────────────────────────────
async function deleteMaterial(m) {
  if (!confirm(`Delete "${m.title}"?`)) return
  await supabase.from('subject_materials').delete().eq('id', m.id)
  await loadMaterials()
}

// ── Upload submission (student) ──────────────────────────────
async function uploadSubmission() {
  if (!subForm.value.file || !subForm.value.title) return
  subUploading.value = true; subUploadErr.value = ''
  try {
    const { url } = await uploadFile(subForm.value.file, `submissions/${subjectCode}`)
    await supabase.from('subject_submissions').insert({
      subject_code: subjectCode,
      section:      section,
      student_id:   auth.state.user.id,
      title:        subForm.value.title,
      description:  subForm.value.description,
      file_url:     url,
      file_name:    subForm.value.file.name,
      file_size:    subForm.value.file.size,
      file_type:    subForm.value.file.type,
    })
    subForm.value = { title:'', description:'', file:null }
    if (subFile.value) subFile.value.value = ''
    await loadSubmissions()
  } catch (err) {
    subUploadErr.value = err.message || 'Submission failed.'
  }
  subUploading.value = false
}

// ── Grade submission (faculty) ───────────────────────────────
function openGradeModal(s) {
  gradeTarget.value  = s
  gradeForm.value    = { grade: s.grade||'', feedback: s.feedback||'', status: s.status||'Graded' }
  gradeModal.value   = true
}
async function saveGrade() {
  gradeSaving.value = true
  await supabase.from('subject_submissions').update({
    grade:    gradeForm.value.grade || null,
    feedback: gradeForm.value.feedback,
    status:   gradeForm.value.status,
    updated_at: new Date()
  }).eq('id', gradeTarget.value.id)
  gradeSaving.value = false
  gradeModal.value  = false
  await loadSubmissions()
}

// ── Display helpers ──────────────────────────────────────────
function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)       return bytes + ' B'
  if (bytes < 1048576)    return (bytes/1024).toFixed(1) + ' KB'
  return (bytes/1048576).toFixed(1) + ' MB'
}
function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
}
function fileIconClass(type) {
  if (!type) return 'file-icon-doc'
  if (type.includes('pdf'))        return 'file-icon-pdf'
  if (type.includes('powerpoint') || type.includes('presentation')) return 'file-icon-ppt'
  if (type.includes('word') || type.includes('document')) return 'file-icon-doc'
  if (type.includes('sheet') || type.includes('excel'))   return 'file-icon-xls'
  if (type.includes('zip') || type.includes('rar'))       return 'file-icon-zip'
  return 'file-icon-doc'
}
function fileIconName(type) {
  if (!type) return 'bi bi-file-earmark'
  if (type.includes('pdf'))        return 'bi bi-file-earmark-pdf'
  if (type.includes('powerpoint') || type.includes('presentation')) return 'bi bi-file-earmark-slides'
  if (type.includes('word') || type.includes('document')) return 'bi bi-file-earmark-word'
  if (type.includes('sheet') || type.includes('excel'))   return 'bi bi-file-earmark-spreadsheet'
  if (type.includes('zip') || type.includes('rar'))       return 'bi bi-file-zip'
  return 'bi bi-file-earmark'
}
const subStatusClass = s => ({
  'Submitted': 'status-sub',
  'Graded':    'status-graded',
  'Returned':  'status-returned',
}[s] || 'status-sub')
</script>

<style scoped>
/* Header */
.subj-header{display:flex;align-items:center;gap:16px;margin-bottom:20px;flex-wrap:wrap;}
.back-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;font-size:12px;font-weight:600;color:#1a6b2e;cursor:pointer;font-family:inherit;}
.back-btn:hover{background:#eaf4ec;}
.subj-info{display:flex;align-items:center;gap:12px;}
.subj-code-badge{padding:4px 12px;background:#1a6b2e;color:#fff;border-radius:8px;font-size:13px;font-weight:700;}
.subj-name{font-size:15px;font-weight:700;color:#1a6b2e;}
.subj-meta{font-size:11px;color:#6c757d;margin-top:2px;}
/* Tabs */
.tabs{display:flex;gap:0;border-bottom:2px solid #d6e4d8;margin-bottom:18px;}
.tab{padding:9px 20px;background:none;border:none;border-bottom:3px solid transparent;margin-bottom:-2px;font-size:13px;font-weight:600;color:#6c757d;cursor:pointer;display:flex;align-items:center;gap:7px;font-family:inherit;}
.tab.active{color:#1a6b2e;border-bottom-color:#1a6b2e;}
/* Upload card */
.upload-card{background:#f8f9fa;border:1px solid #d6e4d8;border-radius:10px;padding:18px;margin-bottom:16px;}
.upload-card-title{font-size:13px;font-weight:700;color:#1a6b2e;margin-bottom:14px;display:flex;align-items:center;gap:7px;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
.field{display:flex;flex-direction:column;gap:5px;}
.field label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6c757d;}
.field input,.field select,.field textarea{padding:9px 11px;border:1px solid #d6e4d8;border-radius:7px;font-size:13px;font-family:inherit;outline:none;background:#fff;resize:vertical;}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#1a6b2e;}
/* File drop */
.file-drop{border:2px dashed #d6e4d8;border-radius:9px;padding:24px;text-align:center;cursor:pointer;margin-bottom:12px;transition:border-color .15s;background:#fff;}
.file-drop:hover{border-color:#1a6b2e;}
.file-chosen{font-size:12px;font-weight:600;color:#198754;display:flex;align-items:center;justify-content:center;gap:6px;}
.upload-actions{display:flex;justify-content:flex-end;}
.btn-primary{padding:9px 18px;background:#1a6b2e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit;}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;}
/* Panel */
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;margin-bottom:14px;}
.panel-head{padding:12px 16px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.count-badge{font-size:10px;font-weight:700;padding:2px 9px;border-radius:20px;background:#eaf4ec;color:#1a6b2e;}
/* File rows */
.file-row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f2f2f2;}
.file-row:last-child{border-bottom:none;}
.file-row:hover{background:#f8f9fa;}
.file-icon{width:40px;height:40px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.file-icon-pdf{background:#fff0f0;color:#dc3545;}
.file-icon-ppt{background:#fff3e0;color:#e65100;}
.file-icon-doc{background:#eaf4ec;color:#1a6b2e;}
.file-icon-xls{background:#f0fff4;color:#198754;}
.file-icon-zip{background:#f5f0ff;color:#6f42c1;}
.file-icon-sub{background:#eaf4ec;color:#1a6b2e;}
.file-info{flex:1;min-width:0;}
.file-title{font-size:13px;font-weight:600;color:#212529;}
.file-meta{font-size:10px;color:#6c757d;margin-top:2px;}
.file-desc{font-size:11px;color:#495057;margin-top:3px;font-style:italic;}
.feedback-row{font-size:11px;color:#0d6efd;margin-top:4px;display:flex;align-items:center;gap:5px;}
.file-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.btn-download{padding:5px 12px;background:#eaf4ec;color:#1a6b2e;border:1px solid #bee5fd;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;text-decoration:none;display:flex;align-items:center;gap:5px;}
.btn-download:hover{background:#1a6b2e;color:#fff;}
.btn-del{width:28px;height:28px;border-radius:7px;background:#fff;border:1px solid #d6e4d8;cursor:pointer;font-size:13px;color:#dc3545;display:flex;align-items:center;justify-content:center;}
.btn-del:hover{background:#fff0f0;border-color:#dc3545;}
.btn-grade{width:28px;height:28px;border-radius:7px;background:#fff;border:1px solid #d6e4d8;cursor:pointer;font-size:13px;color:#1a6b2e;display:flex;align-items:center;justify-content:center;}
.btn-grade:hover{background:#eaf4ec;border-color:#1a6b2e;}
/* Status badges */
.status-badge{padding:2px 9px;border-radius:5px;font-size:10px;font-weight:700;}
.status-sub    {background:#eaf4ec;color:#1a6b2e;}
.status-graded {background:#f0fff4;color:#198754;}
.status-returned{background:#fff8e1;color:#b8890e;}
.grade-badge{padding:2px 8px;border-radius:5px;font-size:11px;font-weight:700;background:#f0fff4;color:#198754;}
/* Filter bar */
.filter-bar{margin-bottom:12px;}
.search-input{width:100%;padding:9px 12px;border:1px solid #d6e4d8;border-radius:8px;font-size:13px;font-family:inherit;outline:none;}
.search-input:focus{border-color:#1a6b2e;}
/* Modal */
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;}
.modal{background:#fff;border-radius:12px;width:100%;max-width:480px;display:flex;flex-direction:column;overflow:hidden;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);}
.modal-head{padding:14px 18px;border-bottom:1px solid #d6e4d8;display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;color:#1a6b2e;flex-shrink:0;}
.modal-head button{background:none;border:none;cursor:pointer;font-size:16px;color:#6c757d;}
.modal-body{padding:18px;overflow-y:auto;max-height:60vh;}
.modal-foot{padding:14px 18px;border-top:1px solid #d6e4d8;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;background:#fff;}
.btn-cancel{padding:8px 16px;background:#f8f9fa;border:1px solid #d6e4d8;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;}
/* Empty / loading */
.empty-state{padding:32px;display:flex;align-items:center;justify-content:center;gap:10px;color:#6c757d;font-size:13px;}
.empty-state i{font-size:22px;color:#d6e4d8;}
.form-error{padding:8px 12px;background:#fff0f0;border:1px solid #f5c6cb;border-radius:7px;font-size:12px;color:#c0392b;margin-bottom:8px;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
@media(max-width:600px){.form-row{grid-template-columns:1fr;}}
</style>