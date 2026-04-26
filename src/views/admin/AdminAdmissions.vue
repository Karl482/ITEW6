<template>
  <div>

    <!-- Toolbar -->
    <div class="page-bar">
      <div class="search-wrap">
        <i class="bi bi-search"></i>
        <input v-model="search" placeholder="Search name, email, program, tracking code…" />
        <button v-if="search" class="clear-x" @click="search=''"><i class="bi bi-x"></i></button>
      </div>
      <div class="filter-tabs">
        <button v-for="tab in tabs" :key="tab.key"
          class="filter-tab" :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key">
          <i :class="tab.icon"></i> {{ tab.label }}
          <span class="tab-count">{{ countByStatus(tab.key) }}</span>
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="panel">
      <div v-if="loading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
      <div v-else-if="filtered.length === 0" class="empty-state">No applications found.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Program</th>
              <th>Tracking Code</th>
              <th>Applied</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in filtered" :key="app.id"
              class="clickable-row" @click="openDetail(app)">
              <td>
                <div class="name-cell">
                  <div class="avatar">{{ initials(app.name) }}</div>
                  <div>
                    <div class="name-txt">{{ app.name }}</div>
                    <div class="email-txt">{{ app.email }}</div>
                  </div>
                </div>
              </td>
              <td>{{ app.program }}</td>
              <td><span class="tracking-chip">{{ app.tracking_code }}</span></td>
              <td>{{ formatDate(app.applied_at) }}</td>
              <td><span class="status-badge" :class="'sb-' + app.status">{{ statusLabel(app.status) }}</span></td>
              <td @click.stop>
                <button class="btn-icon" @click="openDetail(app)" title="View & Process">
                  <i class="bi bi-eye"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <div v-if="selected" class="modal-overlay" @click.self="closeModal">
      <div class="modal modal-lg">

        <div class="modal-head">
          <div class="mh-left">
            <div class="mh-name">{{ selected.name }}</div>
            <span class="status-badge" :class="'sb-' + selected.status">
              <i :class="statusIcon(selected.status)"></i> {{ statusLabel(selected.status) }}
            </span>
          </div>
          <button @click="closeModal"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="modal-body">

          <!-- Info grid -->
          <div class="info-grid">
            <div class="ig-item"><div class="ig-label">Full Name</div><div>{{ selected.name }}</div></div>
            <div class="ig-item"><div class="ig-label">Email</div><div>{{ selected.email }}</div></div>
            <div class="ig-item"><div class="ig-label">Phone</div><div>{{ selected.phone || '—' }}</div></div>
            <div class="ig-item"><div class="ig-label">Program</div><div>{{ selected.program }}</div></div>
            <div class="ig-item"><div class="ig-label">Tracking Code</div>
              <span class="tracking-chip">{{ selected.tracking_code }}</span></div>
            <div class="ig-item"><div class="ig-label">Date Applied</div><div>{{ formatDate(selected.applied_at) }}</div></div>
          </div>

          <!-- PENDING: approve and notify -->
          <div v-if="selected.status === 'pending'" class="stage-block stage-yellow">
            <div class="sb-title"><i class="bi bi-hourglass-split"></i> New Application</div>
            <p class="sb-desc">Review the applicant's details. If qualified, click <strong>Approve</strong> to notify them to bring their documents to the Registrar's Office in person.</p>
          </div>

          <!-- DOCUMENT_SUBMISSION: registrar confirmation -->
          <div v-if="selected.status === 'document_submission'" class="stage-block stage-blue">
            <div class="sb-title"><i class="bi bi-person-walking"></i> Awaiting In-Person Documents</div>
            <p class="sb-desc">The applicant has been notified to bring their documents to the Registrar's Office in person. Once the Registrar confirms all documents are physically received and complete, click <strong>Documents Complete → Schedule Exam</strong> below.</p>
            <div class="doc-ref-list">
              <div class="drl-label"><i class="bi bi-clipboard-check-fill"></i> Documents to Collect</div>
              <div class="drl-items">
                <div v-for="doc in requiredDocs" :key="doc.key" class="drl-item">
                  <i :class="'bi ' + doc.icon"></i>
                  <span>{{ doc.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- EXAM -->
          <div v-if="selected.status === 'exam'" class="stage-block stage-purple">
            <div class="sb-title"><i class="bi bi-pencil-square"></i> Admission Test</div>
            <p class="sb-desc">All documents have been verified. The applicant is cleared to take the Admission Test. Once the test is done, enter the score below and click <strong>Enroll</strong> (pass) or <strong>Reject</strong> (fail).</p>
            <div class="exam-score-row">
              <label>Exam Score <span style="color:#6d28d9;font-size:11px;">(out of 100 · passing score: 70)</span></label>
              <div class="score-input-row">
                <input v-model.number="examScore" type="number" min="0" max="100" placeholder="e.g. 85" />
                <div v-if="examScore !== null && examScore !== ''"
                  class="score-verdict" :class="examScore >= 70 ? 'verdict-pass' : 'verdict-fail'">
                  <i :class="examScore >= 70 ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                  {{ examScore >= 70 ? 'PASSED' : 'FAILED' }}
                </div>
              </div>
            </div>
          </div>

          <!-- ENROLLED -->
          <div v-if="selected.status === 'enrolled'" class="stage-block stage-green">
            <div class="sb-title"><i class="bi bi-mortarboard-fill"></i> Enrolled</div>
            <p class="sb-desc">This applicant has been officially enrolled at Pamantasan ng Cabuyao.</p>
            <div v-if="selected.exam_score !== null" class="score-display">
              Exam Score: <strong>{{ selected.exam_score }} / 100</strong>
            </div>
          </div>

          <!-- REJECTED -->
          <div v-if="selected.status === 'rejected'" class="stage-block stage-red">
            <div class="sb-title"><i class="bi bi-x-circle-fill"></i> Rejected</div>
            <p class="sb-desc">{{ selected.rejection_reason || 'This application was not accepted.' }}</p>
          </div>

          <!-- Admin note (not for final states) -->
          <div v-if="selected.status !== 'enrolled' && selected.status !== 'rejected'" class="notes-row">
            <label>Note to Applicant <span class="label-hint">(optional — visible on their tracker)</span></label>
            <textarea v-model="adminNotes" rows="2"
              placeholder="e.g. Please bring original documents and 2 photocopies each."></textarea>
          </div>

          <!-- Rejection reason box -->
          <div v-if="showRejectForm" class="notes-row reject-reason-box">
            <label>Rejection Reason <span style="color:#dc3545;">*</span></label>
            <textarea v-model="rejectionReason" rows="2"
              placeholder="e.g. Did not pass the minimum exam score of 70."></textarea>
          </div>

          <div v-if="actionError" class="action-error">
            <i class="bi bi-exclamation-circle"></i> {{ actionError }}
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-foot">
          <button class="btn-cancel" @click="closeModal">Close</button>

          <!-- Reject toggle -->
          <button v-if="canAct" class="btn-reject-toggle"
            :class="{ active: showRejectForm }"
            @click="showRejectForm = !showRejectForm">
            <i class="bi bi-x-circle"></i>
            {{ showRejectForm ? 'Cancel' : 'Reject' }}
          </button>

          <!-- Confirm reject -->
          <button v-if="showRejectForm" class="btn-danger-solid"
            @click="doAction('rejected')"
            :disabled="saving || !rejectionReason.trim()">
            <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
            <i v-else class="bi bi-x-circle-fill"></i>
            {{ saving ? 'Saving…' : 'Confirm Reject' }}
          </button>

          <!-- Main progression button -->
          <button v-if="mainAction && !showRejectForm"
            class="btn-primary-action"
            :disabled="saving || mainActionDisabled"
            @click="handleMainAction"
            :title="mainActionDisabledReason">
            <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
            <i v-else :class="mainAction.icon"></i>
            {{ saving ? 'Processing…' : mainAction.label }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { supabase } from '@/lib/supabase.js'

const applications    = ref([])
const loading         = ref(true)
const search          = ref('')
const activeTab       = ref('all')
const selected        = ref(null)
const adminNotes      = ref('')
const rejectionReason = ref('')
const examScore       = ref(null)
const saving          = ref(false)
const actionError     = ref('')
const showRejectForm  = ref(false)
const checklist       = reactive({})

const requiredDocs = [
  { key: 'birth_certificate', label: 'PSA Birth Certificate',     icon: 'bi-file-person-fill',  hint: 'Original or certified true copy' },
  { key: 'report_card',       label: 'Senior High Report Card',   icon: 'bi-journal-text',      hint: 'Form 138 or equivalent'          },
  { key: 'good_moral',        label: 'Certificate of Good Moral', icon: 'bi-patch-check-fill',  hint: 'From previous school'            },
  { key: 'photo',             label: '2x2 ID Photo',              icon: 'bi-person-square',     hint: 'White background, recent'        },
  { key: 'diploma',           label: 'High School Diploma / PEC', icon: 'bi-award-fill',        hint: 'Certificate of Completion'       },
]

const checklistCount    = computed(() => requiredDocs.filter(d => checklist[d.key]).length)
const checklistProgress = computed(() => (checklistCount.value / requiredDocs.length) * 100)
const allDocsChecked    = computed(() => checklistCount.value === requiredDocs.length)

const tabs = [
  { key: 'all',                label: 'All',          icon: 'bi bi-grid'             },
  { key: 'pending',            label: 'Pending',      icon: 'bi bi-hourglass-split'  },
  { key: 'document_submission',label: 'Submit Docs',  icon: 'bi bi-person-walking'   },
  { key: 'exam',               label: 'Exam',         icon: 'bi bi-pencil-square'    },
  { key: 'enrolled',           label: 'Enrolled',     icon: 'bi bi-mortarboard-fill' },
  { key: 'rejected',           label: 'Rejected',     icon: 'bi bi-x-circle'         },
]

function countByStatus(key) {
  if (key === 'all') return applications.value.length
  return applications.value.filter(a => a.status === key).length
}

let channel
onMounted(() => {
  load()
  channel = supabase
    .channel('admissions-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applicants' }, load)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })
async function load() {
  loading.value = true
  const { data } = await supabase
    .from('applications').select('*').order('applied_at', { ascending: false })
  applications.value = data || []
  loading.value = false
}

const filtered = computed(() => {
  let list = applications.value
  if (activeTab.value !== 'all') list = list.filter(a => a.status === activeTab.value)
  const q = search.value.toLowerCase().trim()
  if (q) list = list.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.email.toLowerCase().includes(q) ||
    a.program.toLowerCase().includes(q) ||
    a.tracking_code.toLowerCase().includes(q)
  )
  return list
})

async function openDetail(app) {
  // Always re-fetch fresh data so status is current
  const { data } = await supabase
    .from('applications').select('*').eq('id', app.id).single()
  selected.value        = data ? { ...data } : { ...app }
  adminNotes.value      = selected.value.admin_notes || ''
  rejectionReason.value = selected.value.rejection_reason || ''
  examScore.value       = selected.value.exam_score ?? null
  showRejectForm.value  = false
  actionError.value     = ''
  requiredDocs.forEach(d => { checklist[d.key] = false })
}
function closeModal() { selected.value = null }

const mainAction = computed(() => {
  const s = selected.value?.status
  return {
    pending:             { label: 'Approve — Notify to Submit Documents', icon: 'bi bi-check-circle-fill', next: 'document_submission' },
    document_submission: { label: 'Documents Complete → Proceed to Exam', icon: 'bi bi-pencil-square',    next: 'exam'                },
    exam:                { label: 'Enroll Applicant',                      icon: 'bi bi-mortarboard-fill', next: 'enrolled'            },
  }[s] || null
})

const mainActionDisabled = computed(() => {
  const s = selected.value?.status
  if (false) return true  // no blocking — admin proceeds freely
  if (s === 'exam' && (examScore.value === null || examScore.value === '')) return true
  return false
})

const mainActionDisabledReason = computed(() => {
  const s = selected.value?.status
  if (false) return ''  // no tooltip needed
  if (s === 'exam') return 'Enter the exam score first'
  return ''
})

const canAct = computed(() => {
  const s = selected.value?.status
  return s && s !== 'enrolled' && s !== 'rejected'
})

async function handleMainAction() {
  const next = mainAction.value?.next
  if (!next) return
  if (next === 'enrolled' && (examScore.value === null || examScore.value === '')) {
    actionError.value = 'Please enter the exam score before enrolling.'; return
  }
  await doAction(next)
}

async function doAction(newStatus) {
  saving.value = true; actionError.value = ''
  const now = new Date().toISOString()
  const updates = { status: newStatus, updated_at: now, admin_notes: adminNotes.value || null }
  if (newStatus === 'document_submission') updates.docs_requested_at = now
  if (newStatus === 'exam')               updates.docs_submitted_at  = now
  if (newStatus === 'enrolled') {
    updates.enrolled_at = now
    updates.exam_score  = examScore.value
    updates.exam_passed = examScore.value >= 70
  }
  if (newStatus === 'rejected') updates.rejection_reason = rejectionReason.value || null

  const { error } = await supabase
    .from('applications').update(updates).eq('id', selected.value.id)
  if (error) { actionError.value = error.message; saving.value = false; return }

  const idx = applications.value.findIndex(a => a.id === selected.value.id)
  if (idx !== -1) applications.value[idx] = { ...applications.value[idx], ...updates }
  selected.value      = { ...selected.value, ...updates }
  showRejectForm.value = false
  saving.value = false
}

function initials(n) { return n.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() }
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'})
}
function statusLabel(s) {
  return { pending:'Pending Review', document_submission:'Awaiting Documents',
    exam:'Exam Stage', enrolled:'Enrolled', rejected:'Rejected' }[s] || s
}
function statusIcon(s) {
  return { pending:'bi bi-hourglass-split', document_submission:'bi bi-person-walking',
    exam:'bi bi-pencil-square', enrolled:'bi bi-mortarboard-fill',
    rejected:'bi bi-x-circle-fill' }[s] || 'bi bi-circle'
}
</script>

<style scoped>
.page-bar { display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap; }
.search-wrap { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #d6e4d8; border-radius:8px; padding:8px 12px; flex:1; min-width:200px; }
.search-wrap i { color:#adb5bd; }
.search-wrap input { border:none; outline:none; font-size:13px; font-family:inherit; width:100%; background:transparent; }
.clear-x { background:none; border:none; cursor:pointer; color:#adb5bd; font-size:13px; padding:0; }
.clear-x:hover { color:#dc3545; }
.filter-tabs { display:flex; gap:4px; flex-wrap:wrap; }
.filter-tab { padding:7px 12px; background:#fff; border:1px solid #d6e4d8; border-radius:7px; font-size:11px; font-weight:600; color:#607060; cursor:pointer; display:flex; align-items:center; gap:5px; font-family:inherit; transition:all .15s; white-space:nowrap; }
.filter-tab:hover { border-color:#1a6b2e; color:#1a6b2e; }
.filter-tab.active { background:#1a6b2e; color:#fff; border-color:#1a6b2e; }
.tab-count { font-size:10px; background:rgba(255,255,255,.25); padding:1px 6px; border-radius:99px; }
.filter-tab:not(.active) .tab-count { background:#eaf4ec; color:#1a6b2e; }
.panel { background:#fff; border:1px solid #d6e4d8; border-radius:10px; overflow:hidden; }
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; }
th { padding:10px 14px; font-size:10px; text-transform:uppercase; letter-spacing:.5px; font-weight:700; color:#607060; border-bottom:2px solid #d6e4d8; background:#f8fdf9; text-align:left; white-space:nowrap; }
td { padding:11px 14px; font-size:12px; border-bottom:1px solid #f2f2f2; color:#495057; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
.clickable-row { cursor:pointer; }
.clickable-row:hover td { background:#f8fdf9; }
.name-cell { display:flex; align-items:center; gap:9px; }
.avatar { width:32px; height:32px; border-radius:8px; background:#d4a017; color:#0f3d1c; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
.name-txt  { font-weight:600; color:#212529; font-size:12px; }
.email-txt { font-size:10px; color:#adb5bd; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:160px; }
.tracking-chip { font-family:monospace; font-size:11px; background:#eaf4ec; color:#1a6b2e; padding:3px 8px; border-radius:5px; font-weight:700; }
.btn-icon { width:30px; height:30px; border-radius:7px; border:1px solid #d6e4d8; background:#fff; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; color:#607060; }
.btn-icon:hover { background:#eaf4ec; color:#1a6b2e; border-color:#1a6b2e; }
.empty-state { padding:32px; text-align:center; color:#adb5bd; font-size:13px; }
.status-badge { padding:3px 10px; border-radius:99px; font-size:10px; font-weight:700; white-space:nowrap; display:inline-flex; align-items:center; gap:5px; }
.sb-pending             { background:#fef3c7; color:#92400e; }
.sb-document_submission { background:#dbeafe; color:#1e40af; }
.sb-exam                { background:#ede9fe; color:#5b21b6; }
.sb-enrolled            { background:#d1fae5; color:#065f46; }
.sb-rejected            { background:#fee2e2; color:#991b1b; }
.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px; overflow-y:auto; box-sizing:border-box; }
.modal { background:#fff; border-radius:14px; width:100%; display:flex; flex-direction:column; margin:auto; box-shadow:0 20px 60px rgba(0,0,0,.3); position:relative; }
.modal-lg { max-width:680px; }
.modal-head { padding:12px 16px; border-bottom:1px solid #d6e4d8; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
.mh-left { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.mh-name { font-size:14px; font-weight:700; color:#0f3d1c; }
.modal-head > button { background:none; border:none; cursor:pointer; font-size:15px; color:#adb5bd; }
.modal-body { padding:12px 16px; overflow-y:auto; max-height:65vh; display:flex; flex-direction:column; gap:10px; }
.modal-foot { padding:10px 16px; border-top:1px solid #d6e4d8; display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; align-items:center; flex-shrink:0; }
.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.ig-item { background:#f8fdf9; border-radius:8px; padding:7px 10px; }
.ig-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#adb5bd; margin-bottom:3px; }
.stage-block { border-radius:10px; padding:10px 14px; }
.stage-block .sb-title { font-size:13px; font-weight:700; display:flex; align-items:center; gap:7px; margin-bottom:5px; }
.stage-block .sb-desc  { font-size:12px; line-height:1.6; margin:0; }
.stage-yellow { background:#fef3c7; color:#78350f; }
.stage-blue   { background:#eff6ff; color:#1e3a5f; border:1px solid #bfdbfe; }
.stage-purple { background:#f5f3ff; color:#3b1f70; border:1px solid #ddd6fe; }
.stage-green  { background:#ecfdf5; color:#064e3b; border:1px solid #a7f3d0; }
.stage-red    { background:#fff1f2; color:#881337; border:1px solid #fecdd3; }
.doc-ref-list { margin-top:8px; background:#fff; border:1.5px solid #bfdbfe; border-radius:10px; overflow:hidden; padding:10px; }
.drl-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#1e40af; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
.drl-items { display:flex; flex-direction:column; gap:4px; }
.drl-item { display:flex; align-items:center; gap:8px; font-size:12px; color:#0f3d1c; }
.drl-item > i { font-size:15px; color:#1a6b2e; flex-shrink:0; width:18px; }
.dcl-title { padding:12px 16px 4px; font-size:13px; font-weight:700; color:#1e40af; display:flex; align-items:center; gap:7px; }
.dcl-subtitle { padding:0 16px 10px; font-size:11px; color:#60a5fa; }
.dcl-items { display:flex; flex-direction:column; }
.dcl-item { display:flex; align-items:center; gap:12px; padding:12px 16px; border-top:1px solid #eff6ff; cursor:pointer; transition:background .15s; }
.dcl-item:hover { background:#eff6ff; }
.dcl-item.checked { background:#f0fdf4; }
.dcl-item input[type=checkbox] { width:17px; height:17px; accent-color:#1a6b2e; cursor:pointer; flex-shrink:0; }
.dcl-icon { width:34px; height:34px; border-radius:8px; background:#dbeafe; display:flex; align-items:center; justify-content:center; font-size:16px; color:#1e40af; flex-shrink:0; }
.dcl-item.checked .dcl-icon { background:#dcfce7; color:#16a34a; }
.dcl-name { font-size:13px; font-weight:600; color:#0f3d1c; }
.dcl-hint { font-size:11px; color:#adb5bd; margin-top:1px; }
.dcl-check { margin-left:auto; font-size:18px; color:#16a34a; }
.dcl-progress { padding:10px 16px 12px; display:flex; align-items:center; gap:10px; border-top:1px solid #eff6ff; }
.dcl-bar { flex:1; height:6px; background:#dbeafe; border-radius:99px; overflow:hidden; }
.dcl-fill { height:100%; background:#1a6b2e; border-radius:99px; transition:width .3s; }
.dcl-progress span { font-size:11px; color:#1e40af; font-weight:600; white-space:nowrap; }
.exam-score-row { margin-top:10px; }
.exam-score-row label { display:block; font-size:12px; font-weight:700; color:#5b21b6; margin-bottom:8px; }
.score-input-row { display:flex; align-items:center; gap:12px; }
.score-input-row input { padding:10px 14px; border:2px solid #c4b5fd; border-radius:8px; font-size:18px; font-family:monospace; font-weight:700; outline:none; width:100px; }
.score-input-row input:focus { border-color:#7c3aed; }
.score-verdict { padding:8px 16px; border-radius:8px; font-size:13px; font-weight:700; display:flex; align-items:center; gap:6px; }
.verdict-pass { background:#d1fae5; color:#065f46; }
.verdict-fail { background:#fee2e2; color:#991b1b; }
.score-display { margin-top:8px; font-size:14px; font-weight:600; color:#065f46; }
.notes-row { display:flex; flex-direction:column; gap:4px; }
.notes-row label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#607060; }
.label-hint { font-size:10px; color:#adb5bd; text-transform:none; letter-spacing:0; font-weight:400; }
.notes-row textarea { padding:7px 10px; border:1.5px solid #d6e4d8; border-radius:8px; font-size:12px; font-family:inherit; outline:none; resize:vertical; }
.notes-row textarea:focus { border-color:#1a6b2e; }
.reject-reason-box { background:#fff1f2; border-radius:8px; padding:8px 10px; border:1.5px solid #fecdd3; }
.reject-reason-box label { color:#be123c; }
.action-error { background:#fff0f0; border:1px solid #f5c6cb; border-radius:7px; padding:8px 12px; font-size:12px; color:#c0392b; display:flex; align-items:center; gap:8px; }
.btn-cancel { padding:7px 14px; background:#f8f9fa; border:1px solid #d6e4d8; border-radius:8px; font-size:12px; cursor:pointer; font-family:inherit; }
.btn-reject-toggle { padding:7px 14px; background:#fff1f2; border:1.5px solid #fca5a5; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; color:#be123c; display:flex; align-items:center; gap:6px; transition:all .15s; }
.btn-reject-toggle.active { background:#fecdd3; border-color:#fb7185; }
.btn-danger-solid { padding:7px 14px; background:#dc2626; color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:6px; }
.btn-danger-solid:disabled { opacity:.5; cursor:not-allowed; }
.btn-primary-action { padding:7px 16px; background:#1a6b2e; color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:6px; transition:all .2s; }
.btn-primary-action:hover:not(:disabled) { background:#134f22; }
.btn-primary-action:disabled { opacity:.45; cursor:not-allowed; }
@keyframes spin { to { transform:rotate(360deg); } }
.spin { display:inline-block; animation:spin .7s linear infinite; }
</style>