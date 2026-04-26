<template>
  <div>
    <div class="page-bar">
      <button class="back-btn" @click="router.back()">
        <i class="bi bi-arrow-left"></i> Back to Admissions
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="bi bi-arrow-repeat spin"></i> Loading applicant profile…
    </div>

    <template v-else-if="applicant">

      <!-- ═══ HERO ══════════════════════════════════════════════ -->
      <div class="profile-hero">
        <div class="hero-avatar" :style="{ background: avatarBg(applicant.full_name) }">
          {{ initials(applicant.full_name) }}
        </div>
        <div class="hero-body">
          <div class="hero-name">{{ applicant.full_name }}</div>
          <div class="hero-sub">{{ applicant.program }} · {{ applicant.school_last || 'No school recorded' }}</div>
          <div class="hero-meta">
            <span><i class="bi bi-envelope"></i> {{ applicant.email }}</span>
            <span v-if="applicant.phone"><i class="bi bi-phone"></i> {{ applicant.phone }}</span>
            <span><i class="bi bi-calendar3"></i> Applied {{ formatDate(applicant.created_at) }}</span>
          </div>
        </div>
        <div class="hero-status">
          <span class="status-badge-lg" :style="{ background: STATUS_META[applicant.status].bg, color: STATUS_META[applicant.status].color }">
            <i :class="'bi ' + STATUS_META[applicant.status].icon"></i>
            {{ STATUS_META[applicant.status].label }}
          </span>
          <span v-if="applicant.enrolled_as" class="student-id-chip">
            <i class="bi bi-mortarboard-fill"></i> {{ applicant.enrolled_as }}
          </span>
        </div>
      </div>

      <!-- ═══ STAGE PROGRESS BAR ════════════════════════════════ -->
      <div class="stage-track">
        <div
          v-for="(st, idx) in stages" :key="st.key"
          class="stage-step"
          :class="{
            done:    stageIndex(applicant.status) > idx,
            active:  stageIndex(applicant.status) === idx,
            skipped: applicant.status === 'rejected'
          }"
        >
          <div class="step-dot">
            <i v-if="stageIndex(applicant.status) > idx" class="bi bi-check"></i>
            <i v-else :class="'bi ' + st.icon"></i>
          </div>
          <div class="step-label">{{ st.label }}</div>
          <div v-if="idx < stages.length - 1" class="step-line"></div>
        </div>
      </div>

      <!-- ═══ ACTION PANEL ══════════════════════════════════════ -->
      <div
        v-if="applicant.status !== 'enrolled' && applicant.status !== 'rejected'"
        class="action-panel"
      >
        <div class="action-info">
          <i class="bi bi-arrow-right-circle-fill" style="color:#1a6b2e;font-size:18px;"></i>
          <div>
            <div class="action-title">Next Action</div>
            <div class="action-sub">
              <span v-if="applicant.status === 'exam'">
                Review exam results and enroll or reject this applicant.
              </span>
              <span v-else>
                Advance applicant to
                <strong>{{ STATUS_META[NEXT_STATUS[applicant.status]]?.label }}</strong>
                stage, or reject their application.
              </span>
            </div>
          </div>
        </div>
        <div class="action-btns-row">
          <!-- Exam stage: Enroll or Reject -->
          <template v-if="applicant.status === 'exam'">
            <button class="btn-enroll" @click="doEnroll" :disabled="actionLoading">
              <i v-if="actionLoading" class="bi bi-arrow-repeat spin"></i>
              <i v-else class="bi bi-mortarboard-fill"></i>
              {{ actionLoading ? 'Enrolling…' : 'Enroll Student' }}
            </button>
            <button class="btn-reject" @click="showRejectModal=true">
              <i class="bi bi-x-circle"></i> Reject
            </button>
          </template>
          <!-- Other stages: Advance -->
          <template v-else>
            <button class="btn-advance" @click="doAdvance" :disabled="actionLoading">
              <i v-if="actionLoading" class="bi bi-arrow-repeat spin"></i>
              <i v-else class="bi bi-arrow-right-circle"></i>
              {{ actionLoading ? 'Advancing…' : `Move to ${STATUS_META[NEXT_STATUS[applicant.status]]?.label}` }}
            </button>
            <button class="btn-reject" @click="showRejectModal=true">
              <i class="bi bi-x-circle"></i> Reject
            </button>
          </template>
        </div>
      </div>

      <!-- Enrolled success bar -->
      <div v-if="applicant.status === 'enrolled'" class="enrolled-bar">
        <i class="bi bi-check-circle-fill" style="color:#198754;font-size:20px;"></i>
        <div>
          <div style="font-weight:700;color:#155724;">Applicant enrolled successfully</div>
          <div style="font-size:12px;color:#3a7d4f;">
            Now an active student —
            <router-link :to="`/admin/students/${applicant.enrolled_as}`" style="color:#1a6b2e;font-weight:700;">
              View student profile →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Rejected bar -->
      <div v-if="applicant.status === 'rejected'" class="rejected-bar">
        <i class="bi bi-x-circle-fill" style="color:#dc3545;font-size:20px;"></i>
        <div>
          <div style="font-weight:700;color:#842029;">Application rejected</div>
          <div v-if="applicant.rejection_reason" style="font-size:12px;color:#b02a37;">
            Reason: {{ applicant.rejection_reason }}
          </div>
        </div>
      </div>

      <!-- ═══ TABS ═══════════════════════════════════════════════ -->
      <div class="tabs">
        <button v-for="t in tabList" :key="t.key" class="tab" :class="{ active: activeTab===t.key }" @click="activeTab=t.key">
          <i :class="t.icon"></i> {{ t.label }}
          <span v-if="t.count !== undefined" class="tab-count">{{ t.count }}</span>
        </button>
      </div>

      <!-- ── Tab: Profile ───────────────────────────────────── -->
      <div v-show="activeTab==='profile'" class="info-grid">
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
          <div class="panel-head"><span class="panel-title">Academic Background</span></div>
          <div class="panel-body">
            <div class="info-row" v-for="f in academicFields" :key="f.label">
              <span class="info-lbl">{{ f.label }}</span>
              <span class="info-val">{{ f.value || '—' }}</span>
            </div>
          </div>
        </div>
        <!-- Admin notes -->
        <div class="panel" style="grid-column:1/-1;">
          <div class="panel-head">
            <span class="panel-title">Internal Notes</span>
            <button class="btn-save-sm" v-if="notesDirty" @click="saveNotes">
              <i class="bi bi-floppy"></i> Save
            </button>
          </div>
          <div class="panel-body">
            <textarea
              v-model="localNotes"
              class="notes-field"
              rows="3"
              placeholder="Add internal notes about this applicant (visible to admin only)…"
              @input="notesDirty = true"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- ── Tab: Documents ─────────────────────────────────── -->
      <div v-show="activeTab==='documents'">
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">Submitted Documents</span>
            <span class="count-badge">{{ documents.length }}</span>
          </div>
          <div v-if="documents.length === 0" class="empty-table">No documents uploaded yet.</div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in documents" :key="doc.id">
                  <td>
                    <span class="doc-type-badge">
                      <i class="bi bi-file-earmark-fill"></i>
                      {{ doc.label || docTypeLabel(doc.document_type) }}
                    </span>
                  </td>
                  <td>
                    <a :href="doc.file_url" target="_blank" class="file-link">
                      <i class="bi bi-box-arrow-up-right"></i>
                      {{ doc.file_name || 'View file' }}
                    </a>
                  </td>
                  <td>{{ formatDate(doc.uploaded_at) }}</td>
                  <td>
                    <span class="doc-status" :class="doc.reviewed ? 'reviewed' : 'pending'">
                      <i :class="doc.reviewed ? 'bi bi-check-circle-fill' : 'bi bi-clock'"></i>
                      {{ doc.reviewed ? 'Reviewed' : 'Pending' }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn-icon sm"
                      :title="doc.reviewed ? 'Mark as pending' : 'Mark as reviewed'"
                      @click="toggleReview(doc)"
                    >
                      <i :class="doc.reviewed ? 'bi bi-x-circle' : 'bi bi-check-circle'"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── Tab: Exam ──────────────────────────────────────── -->
      <div v-show="activeTab==='exam'">
        <div class="panel">
          <div class="panel-head">
            <span class="panel-title">Exam Details</span>
            <button class="btn-save-sm" @click="showExamModal=true">
              <i class="bi bi-pencil"></i> {{ exam ? 'Edit Exam' : 'Set Exam' }}
            </button>
          </div>
          <div v-if="!exam" class="empty-table">
            No exam scheduled yet. Click "Set Exam" to add exam details.
          </div>
          <div v-else class="panel-body">
            <div class="info-row" v-for="f in examFields" :key="f.label">
              <span class="info-lbl">{{ f.label }}</span>
              <span class="info-val" :class="f.class">{{ f.value || '—' }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ REJECT MODAL ════════════════════════════════════════ -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal=false">
      <div class="modal">
        <div class="modal-head">
          <span class="modal-title"><i class="bi bi-x-circle-fill" style="color:#dc3545"></i> Reject Applicant</span>
          <button class="modal-close" @click="showRejectModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p style="margin:0 0 12px;font-size:14px;">Provide a reason for rejecting <strong>{{ applicant?.full_name }}</strong>.</p>
          <label class="field-label">Rejection Reason *</label>
          <textarea v-model="rejectReason" class="field-input" rows="3" placeholder="e.g. GWA does not meet the minimum requirement…"></textarea>
        </div>
        <div class="modal-foot">
          <button class="btn-ghost" @click="showRejectModal=false">Cancel</button>
          <button class="btn-danger" @click="doReject" :disabled="!rejectReason.trim() || actionLoading">
            <i class="bi bi-x-circle"></i> Confirm Reject
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ EXAM MODAL ══════════════════════════════════════════ -->
    <div v-if="showExamModal" class="modal-overlay" @click.self="showExamModal=false">
      <div class="modal modal-lg">
        <div class="modal-head">
          <span class="modal-title"><i class="bi bi-pencil-square" style="color:#d4a017"></i> Exam Details</span>
          <button class="modal-close" @click="showExamModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field">
              <label class="field-label">Exam Date</label>
              <CalendarPicker v-model="examForm.exam_date" placeholder="Select exam date" />
            </div>
            <div class="field">
              <label class="field-label">Exam Time</label>
              <input type="text" v-model="examForm.exam_time" class="field-input" placeholder="e.g. 9:00 AM" />
            </div>
            <div class="field">
              <label class="field-label">Type</label>
              <select v-model="examForm.exam_type" class="field-input">
                <option value="in-person">In-person</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Venue / Link</label>
              <input type="text" v-model="examForm.exam_venue" class="field-input" placeholder="Room 101 or Google Meet link" />
            </div>
            <div class="field">
              <label class="field-label">Score</label>
              <input type="number" v-model.number="examForm.score" class="field-input" placeholder="e.g. 85" min="0" max="100" />
            </div>
            <div class="field">
              <label class="field-label">Passing Score</label>
              <input type="number" v-model.number="examForm.passing_score" class="field-input" placeholder="75" min="0" max="100" />
            </div>
            <div class="field" style="grid-column:1/-1;">
              <label class="field-label">Result</label>
              <select v-model="examForm.result" class="field-input">
                <option value="pending">Pending</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div class="field" style="grid-column:1/-1;">
              <label class="field-label">Notes</label>
              <textarea v-model="examForm.notes" class="field-input" rows="2" placeholder="Additional notes…"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-ghost" @click="showExamModal=false">Cancel</button>
          <button class="btn-primary" @click="doSaveExam" :disabled="examSaving">
            <i v-if="examSaving" class="bi bi-arrow-repeat spin"></i>
            <i v-else class="bi bi-floppy"></i>
            {{ examSaving ? 'Saving…' : 'Save Exam' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ ENROLL SUCCESS TOAST ════════════════════════════════ -->
    <div v-if="successToast.show" class="toast-success">
      <i class="bi bi-check-circle-fill"></i>
      <div>
        <div style="font-weight:700;">{{ successToast.title }}</div>
        <div style="font-size:12px;">{{ successToast.sub }}</div>
      </div>
      <button @click="successToast.show=false" style="border:none;background:none;cursor:pointer;color:#155724;font-size:16px;"><i class="bi bi-x"></i></button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import CalendarPicker from '@/components/CalendarPicker.vue'
import {
  fetchApplicantDetail,
  advanceStatus,
  enrollApplicant,
  rejectApplicant,
  reviewDocument,
  saveExam,
  updateNotes,
  STATUS_META,
  NEXT_STATUS,
} from '@/lib/admissions.js'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const applicant      = ref(null)
const documents      = ref([])
const exam           = ref(null)
const loading        = ref(true)
const activeTab      = ref('profile')
const actionLoading  = ref(false)
const showRejectModal = ref(false)
const showExamModal   = ref(false)
const rejectReason   = ref('')
const examSaving     = ref(false)
const notesDirty     = ref(false)
const localNotes     = ref('')
const successToast   = ref({ show: false, title: '', sub: '' })

const examForm = ref({
  exam_date: '', exam_time: '', exam_type: 'in-person',
  exam_venue: '', score: null, passing_score: 75, result: 'pending', notes: ''
})

const stages = [
  { key: 'pending',             label: 'Applied',   icon: 'bi-hourglass'           },
  { key: 'document_submission', label: 'Documents', icon: 'bi-cloud-upload'        },
  { key: 'document_review',     label: 'Review',    icon: 'bi-file-earmark-check'  },
  { key: 'exam',                label: 'Exam',      icon: 'bi-pencil-square'       },
  { key: 'enrolled',            label: 'Enrolled',  icon: 'bi-mortarboard-fill'    },
]

const tabList = computed(() => [
  { key: 'profile',   label: 'Profile',   icon: 'bi bi-person'              },
  { key: 'documents', label: 'Documents', icon: 'bi bi-file-earmark',  count: documents.value.length },
  { key: 'exam',      label: 'Exam',      icon: 'bi bi-pencil-square'       },
])

const personalFields = computed(() => [
  { label: 'Full Name',  value: applicant.value?.full_name },
  { label: 'Email',      value: applicant.value?.email     },
  { label: 'Phone',      value: applicant.value?.phone     },
  { label: 'Birthday',   value: applicant.value?.birthday ? new Date(applicant.value.birthday).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'}) : null },
  { label: 'Gender',     value: applicant.value?.gender    },
  { label: 'Address',    value: applicant.value?.address   },
])

const academicFields = computed(() => [
  { label: 'Program Applied',  value: applicant.value?.program     },
  { label: 'Senior High Strand', value: applicant.value?.strand    },
  { label: 'Last School',      value: applicant.value?.school_last },
  { label: 'School Year',      value: applicant.value?.school_year },
  { label: 'GWA',              value: applicant.value?.gwa         },
])

const examFields = computed(() => {
  if (!exam.value) return []
  const e = exam.value
  return [
    { label: 'Exam Date',    value: e.exam_date                  },
    { label: 'Time',         value: e.exam_time                  },
    { label: 'Type',         value: e.exam_type                  },
    { label: 'Venue',        value: e.exam_venue                 },
    { label: 'Score',        value: e.score !== null ? `${e.score} / 100` : null },
    { label: 'Passing Score',value: e.passing_score              },
    { label: 'Result',       value: e.result,  class: e.result === 'passed' ? 'val-pass' : e.result === 'failed' ? 'val-fail' : '' },
    { label: 'Notes',        value: e.notes                      },
  ]
})

function stageIndex(status) {
  if (status === 'rejected') return -1
  return stages.findIndex(s => s.key === status)
}

function initials(name) {
  const p = name.trim().split(' ')
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase()
}
const BG_COLORS = ['#eaf4ec','#e7f1ff','#fff8e1','#f0ebff','#fde8ea','#fff0d6']
function avatarBg(name) { return BG_COLORS[name.charCodeAt(0) % BG_COLORS.length] }
function formatDate(ts) {
  return ts ? new Date(ts).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}
function docTypeLabel(type) {
  const m = { id_card:'ID Card', report_card:'Report Card', birth_certificate:'Birth Certificate', good_moral:'Good Moral', form_137:'Form 137', photo:'Photo', other:'Other' }
  return m[type] || type
}

async function load() {
  loading.value = true
  try {
    const d = await fetchApplicantDetail(route.params.id)
    applicant.value = d.applicant
    documents.value = d.documents
    exam.value      = d.exam
    localNotes.value = d.applicant.notes || ''
    if (d.exam) Object.assign(examForm.value, d.exam)
  } finally {
    loading.value = false
  }
}

async function doAdvance() {
  actionLoading.value = true
  try {
    const next = await advanceStatus(applicant.value, auth.state.user?.id, auth.state.user?.name)
    applicant.value.status = next
  } finally {
    actionLoading.value = false
  }
}

async function doEnroll() {
  actionLoading.value = true
  try {
    const studentId = await enrollApplicant(applicant.value, auth.state.user?.id, auth.state.user?.name)
    applicant.value.status     = 'enrolled'
    applicant.value.enrolled_as = studentId
    successToast.value = { show: true, title: 'Applicant enrolled!', sub: `Student ID: ${studentId}` }
    setTimeout(() => { successToast.value.show = false }, 5000)
  } finally {
    actionLoading.value = false
  }
}

async function doReject() {
  if (!rejectReason.value.trim()) return
  actionLoading.value = true
  try {
    await rejectApplicant(applicant.value, rejectReason.value, auth.state.user?.id, auth.state.user?.name)
    applicant.value.status           = 'rejected'
    applicant.value.rejection_reason = rejectReason.value
    showRejectModal.value = false
    rejectReason.value    = ''
  } finally {
    actionLoading.value = false
  }
}

async function toggleReview(doc) {
  await reviewDocument(doc.id, !doc.reviewed)
  doc.reviewed = !doc.reviewed
}

async function doSaveExam() {
  examSaving.value = true
  try {
    await saveExam(applicant.value.id, examForm.value, exam.value?.id)
    exam.value    = { ...examForm.value, id: exam.value?.id }
    showExamModal.value = false
  } finally {
    examSaving.value = false
  }
}

async function saveNotes() {
  await updateNotes(applicant.value.id, localNotes.value)
  applicant.value.notes = localNotes.value
  notesDirty.value = false
}

onMounted(load)
</script>

<style scoped>
.page-bar { margin-bottom:16px; }
.back-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border:1px solid #dde; border-radius:7px; background:#fff; font-size:13px; cursor:pointer; font-weight:600; color:#555; }
.back-btn:hover { background:#f5f5f5; }
.loading-state { text-align:center; padding:60px; color:#888; font-size:14px; }
.spin { animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Hero */
.profile-hero { background:#fff; border:1px solid #e5e5e5; border-radius:12px; padding:24px; display:flex; align-items:flex-start; gap:20px; margin-bottom:16px; }
.hero-avatar { width:60px; height:60px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; color:#1a6b2e; flex-shrink:0; }
.hero-body { flex:1; min-width:0; }
.hero-name { font-size:20px; font-weight:700; color:#1a1a1a; }
.hero-sub { font-size:13px; color:#666; margin:3px 0 8px; }
.hero-meta { display:flex; gap:16px; flex-wrap:wrap; }
.hero-meta span { display:flex; align-items:center; gap:5px; font-size:12px; color:#888; }
.hero-status { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
.status-badge-lg { display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:700; padding:6px 14px; border-radius:20px; }
.student-id-chip { font-size:12px; font-weight:700; color:#1a6b2e; background:#eaf4ec; padding:4px 12px; border-radius:12px; display:flex; align-items:center; gap:5px; }

/* Stage track */
.stage-track { background:#fff; border:1px solid #e5e5e5; border-radius:12px; padding:20px 24px; display:flex; align-items:flex-start; margin-bottom:16px; overflow-x:auto; }
.stage-step { display:flex; flex-direction:column; align-items:center; position:relative; flex:1; min-width:80px; }
.step-dot { width:32px; height:32px; border-radius:50%; background:#f0f0f0; border:2px solid #ddd; display:flex; align-items:center; justify-content:center; font-size:13px; color:#999; z-index:1; }
.stage-step.done .step-dot { background:#1a6b2e; border-color:#1a6b2e; color:#fff; }
.stage-step.active .step-dot { background:#fff; border-color:#1a6b2e; color:#1a6b2e; border-width:3px; }
.step-label { font-size:11px; font-weight:600; color:#888; margin-top:6px; text-align:center; }
.stage-step.done .step-label { color:#1a6b2e; }
.stage-step.active .step-label { color:#1a6b2e; }
.step-line { position:absolute; top:16px; left:calc(50% + 16px); right:calc(-50% + 16px); height:2px; background:#ddd; z-index:0; }
.stage-step.done .step-line { background:#1a6b2e; }

/* Action panel */
.action-panel { background:#f7fbf8; border:1px solid #c3dfc9; border-radius:12px; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
.action-info { display:flex; align-items:flex-start; gap:12px; }
.action-title { font-size:13px; font-weight:700; color:#1a1a1a; }
.action-sub { font-size:12px; color:#555; margin-top:2px; }
.action-btns-row { display:flex; gap:8px; flex-shrink:0; }

.btn-advance { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border:none; border-radius:8px; background:#1a6b2e; color:#fff; font-size:13px; font-weight:600; cursor:pointer; }
.btn-advance:hover:not(:disabled) { background:#155724; }
.btn-advance:disabled { opacity:.6; cursor:not-allowed; }
.btn-enroll { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border:none; border-radius:8px; background:#198754; color:#fff; font-size:13px; font-weight:600; cursor:pointer; }
.btn-enroll:hover:not(:disabled) { background:#146c43; }
.btn-enroll:disabled { opacity:.6; cursor:not-allowed; }
.btn-reject { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border:1px solid #f5c6c9; border-radius:8px; background:#fff; color:#dc3545; font-size:13px; font-weight:600; cursor:pointer; }
.btn-reject:hover { background:#fde8ea; }

.enrolled-bar { background:#d1f5e0; border:1px solid #a3ddb8; border-radius:10px; padding:14px 18px; display:flex; align-items:center; gap:12px; margin-bottom:16px; }
.rejected-bar  { background:#fde8ea; border:1px solid #f5c6c9; border-radius:10px; padding:14px 18px; display:flex; align-items:center; gap:12px; margin-bottom:16px; }

/* Tabs */
.tabs { display:flex; gap:4px; margin-bottom:16px; background:#fff; border:1px solid #e5e5e5; border-radius:10px; padding:4px; }
.tab { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 12px; border:none; border-radius:7px; background:transparent; font-size:12px; font-weight:600; color:#666; cursor:pointer; transition:.12s; }
.tab:hover { background:#f5f5f5; }
.tab.active { background:#1a6b2e; color:#fff; }
.tab-count { font-size:10px; background:rgba(255,255,255,.25); padding:1px 6px; border-radius:10px; }
.tab:not(.active) .tab-count { background:#eee; color:#666; }

/* Info grid */
.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
@media(max-width:700px){ .info-grid { grid-template-columns:1fr; } }
.panel { background:#fff; border:1px solid #e5e5e5; border-radius:10px; overflow:hidden; margin-bottom:16px; }
.panel-head { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #f0f0f0; }
.panel-title { font-size:13px; font-weight:700; color:#333; }
.count-badge { font-size:11px; font-weight:700; background:#eaf4ec; color:#1a6b2e; padding:2px 8px; border-radius:10px; }
.panel-body { padding:4px 0; }
.info-row { display:flex; justify-content:space-between; align-items:center; padding:9px 16px; border-bottom:1px solid #f5f5f5; }
.info-row:last-child { border-bottom:none; }
.info-lbl { font-size:12px; color:#888; font-weight:500; }
.info-val { font-size:13px; color:#222; font-weight:500; text-align:right; max-width:60%; word-break:break-word; }
.val-pass { color:#198754; font-weight:700; }
.val-fail { color:#dc3545; font-weight:700; }

.notes-field { width:100%; border:none; outline:none; font-size:13px; font-family:inherit; resize:vertical; padding:8px 16px; box-sizing:border-box; min-height:70px; }
.btn-save-sm { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border:1px solid #1a6b2e; border-radius:6px; background:#eaf4ec; color:#1a6b2e; font-size:11px; font-weight:600; cursor:pointer; }

/* Documents */
.table-wrap { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-size:13px; }
thead tr { background:#f9f9f9; }
th { padding:10px 14px; text-align:left; font-weight:600; color:#555; font-size:12px; border-bottom:1px solid #eee; white-space:nowrap; }
td { padding:11px 14px; border-bottom:1px solid #f0f0f0; vertical-align:middle; }
tbody tr:last-child td { border-bottom:none; }
.empty-table { text-align:center; padding:32px; color:#aaa; font-size:13px; }

.doc-type-badge { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#444; background:#f5f5f5; padding:3px 10px; border-radius:6px; }
.file-link { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#0d6efd; text-decoration:none; }
.file-link:hover { text-decoration:underline; }
.doc-status { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; }
.doc-status.reviewed { background:#d1f5e0; color:#198754; }
.doc-status.pending  { background:#fff8e1; color:#d4a017; }

.btn-icon { width:28px; height:28px; border:1px solid #dde; border-radius:6px; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; cursor:pointer; color:#555; }
.btn-icon:hover { background:#f5f5f5; }

/* Modal */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
.modal { background:#fff; border-radius:12px; width:460px; max-width:100%; box-shadow:0 8px 40px rgba(0,0,0,.15); max-height:90vh; overflow-y:auto; }
.modal-lg { width:580px; }
.modal-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #eee; position:sticky; top:0; background:#fff; z-index:1; }
.modal-title { font-size:15px; font-weight:700; display:flex; align-items:center; gap:8px; }
.modal-close { border:none; background:none; cursor:pointer; font-size:16px; color:#888; }
.modal-body { padding:20px; }
.modal-foot { display:flex; justify-content:flex-end; gap:8px; padding:16px 20px; border-top:1px solid #eee; }

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.field { display:flex; flex-direction:column; gap:4px; }
.field-label { font-size:12px; font-weight:600; color:#555; }
.field-input { border:1px solid #dde; border-radius:7px; padding:8px 10px; font-size:13px; outline:none; font-family:inherit; box-sizing:border-box; width:100%; }
.field-input:focus { border-color:#1a6b2e; }

.btn-ghost { padding:8px 16px; border:1px solid #dde; border-radius:7px; background:#fff; font-size:13px; cursor:pointer; }
.btn-ghost:hover { background:#f5f5f5; }
.btn-primary { display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border:none; border-radius:8px; background:#1a6b2e; color:#fff; font-size:13px; font-weight:600; cursor:pointer; }
.btn-primary:hover:not(:disabled) { background:#155724; }
.btn-primary:disabled { opacity:.6; cursor:not-allowed; }
.btn-danger { padding:8px 16px; border:none; border-radius:7px; background:#dc3545; color:#fff; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; }
.btn-danger:hover:not(:disabled) { background:#b02a37; }
.btn-danger:disabled { opacity:.6; cursor:not-allowed; }

/* Toast */
.toast-success { position:fixed; bottom:24px; right:24px; background:#d1f5e0; border:1px solid #a3ddb8; border-radius:10px; padding:14px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 4px 20px rgba(0,0,0,.12); z-index:2000; max-width:320px; animation:slideUp .3s ease; }
.toast-success .bi-check-circle-fill { color:#198754; font-size:20px; }
@keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
</style>