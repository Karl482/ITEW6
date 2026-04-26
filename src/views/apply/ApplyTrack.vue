<template>
  <div class="track-page">

    <!-- Navbar -->
    <nav class="tnav">
      <div class="tnav-brand" @click="$router.push('/')">
        <i class="bi bi-mortarboard-fill" style="font-size:22px;color:#d4a017;"></i>
        <div>
          <div class="tnav-name">Pamantasan ng Cabuyao</div>
          <div class="tnav-sub">Application Tracker</div>
        </div>
      </div>
      <button class="tnav-back" @click="$router.push('/')">
        <i class="bi bi-house-fill"></i> Back to Homepage
      </button>
    </nav>

    <div class="track-body">

      <!-- ── LOOKUP FORM ── -->
      <div v-if="!application" class="lookup-card">
        <div class="lookup-icon"><i class="bi bi-search"></i></div>
        <h2>Track Your Application</h2>
        <p>Enter the tracking code you received after submitting your application form.</p>
        <div class="lk-field">
          <label>Tracking Code</label>
          <input v-model="codeInput" placeholder="e.g. PNC-AB12CD"
            @keyup.enter="lookup()" maxlength="20" />
        </div>
        <div v-if="lookupError" class="lk-error">
          <i class="bi bi-exclamation-circle"></i> {{ lookupError }}
        </div>
        <button class="btn-lookup" @click="lookup()" :disabled="loading">
          <i v-if="loading" class="bi bi-arrow-repeat spin"></i>
          <i v-else class="bi bi-search"></i>
          {{ loading ? 'Searching…' : 'Find My Application' }}
        </button>
        <div class="lk-hint">
          <i class="bi bi-info-circle"></i>
          Lost your tracking code? Contact the Registrar's Office with your full name and email.
        </div>
      </div>

      <!-- ── STATUS VIEW ── -->
      <div v-else class="status-card">

        <!-- Applicant header -->
        <div class="sc-header">
          <div class="sc-avatar">{{ initials(application.name) }}</div>
          <div class="sc-info">
            <div class="sc-name">{{ application.name }}</div>
            <div class="sc-prog">{{ application.program }}</div>
            <div class="sc-code">
              <i class="bi bi-tag-fill"></i> {{ application.tracking_code }}
            </div>
          </div>
          <div class="sc-badge" :class="'badge-' + application.status">
            <i :class="statusIcon"></i> {{ statusLabel }}
          </div>
        </div>

        <!-- Progress stepper -->
        <div class="stepper">
          <div v-for="(step, i) in steps" :key="step.key"
            class="step-item" :class="stepState(step.key)">
            <div class="step-line-before" v-if="i > 0"></div>
            <div class="step-dot">
              <i v-if="stepState(step.key) === 'done'" class="bi bi-check-lg"></i>
              <i v-else-if="stepState(step.key) === 'active'" class="bi bi-arrow-right"></i>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div class="step-lbl">{{ step.label }}</div>
          </div>
        </div>

        <!-- PENDING -->
        <div v-if="application.status === 'pending'" class="stage-card card-yellow">
          <div class="stage-icon"><i class="bi bi-hourglass-split"></i></div>
          <div class="stage-body">
            <div class="stage-title">Application Under Review</div>
            <div class="stage-desc">
              Your application has been received and is currently being reviewed by the Admissions Office.
              This usually takes <strong>1–3 working days</strong>.
            </div>
          </div>
        </div>

        <!-- DOCUMENT_SUBMISSION: go to registrar in person -->
        <div v-if="application.status === 'document_submission'" class="stage-card card-blue">
          <div class="stage-icon"><i class="bi bi-person-walking"></i></div>
          <div class="stage-body">
            <div class="stage-title">Action Required: Submit Documents In Person</div>
            <div class="stage-desc">
              Your initial application has been approved! Please visit the
              <strong>PNC Registrar's Office</strong> and submit the following documents in person:
            </div>
            <ul class="doc-list">
              <li><i class="bi bi-file-person-fill"></i> PSA Birth Certificate (original or certified true copy)</li>
              <li><i class="bi bi-journal-text"></i> Senior High School Report Card (Form 138)</li>
              <li><i class="bi bi-patch-check-fill"></i> Certificate of Good Moral Character</li>
              <li><i class="bi bi-person-square"></i> 2x2 ID Photo (white background, recent)</li>
              <li><i class="bi bi-award-fill"></i> High School Diploma or Certificate of Completion</li>
            </ul>
            <div class="office-info">
              <div class="oi-row"><i class="bi bi-geo-alt-fill"></i> Katapatan Village, Brgy. Banay-Banay, Cabuyao City, Laguna</div>
              <div class="oi-row"><i class="bi bi-clock-fill"></i> Monday – Friday, 8:00 AM – 5:00 PM</div>
              <div class="oi-row"><i class="bi bi-telephone-fill"></i> (049) 832-3033</div>
            </div>
          </div>
        </div>

        <!-- DOCUMENT_REVIEW -->
        <div v-if="application.status === 'document_review'" class="stage-card card-orange">
          <div class="stage-icon"><i class="bi bi-eye-fill"></i></div>
          <div class="stage-body">
            <div class="stage-title">Documents Being Verified</div>
            <div class="stage-desc">
              Your documents have been received by the Registrar's Office and are currently being verified.
              Once confirmed complete, you will be cleared to take the <strong>Admission Test</strong>.
            </div>
          </div>
        </div>

        <!-- EXAM -->
        <div v-if="application.status === 'exam'" class="stage-card card-purple">
          <div class="stage-icon"><i class="bi bi-pencil-square"></i></div>
          <div class="stage-body">
            <div class="stage-title">You're Qualified — Take the Admission Test!</div>
            <div class="stage-desc">
              Your documents have been verified. Please visit the Registrar's Office to take the
              <strong>PNC Admission Test</strong>. Bring a valid ID and your tracking code.
            </div>
            <div class="office-info">
              <div class="oi-row"><i class="bi bi-geo-alt-fill"></i> Katapatan Village, Brgy. Banay-Banay, Cabuyao City, Laguna</div>
              <div class="oi-row"><i class="bi bi-clock-fill"></i> Monday – Friday, 8:00 AM – 5:00 PM</div>
            </div>
          </div>
        </div>

        <!-- ENROLLED -->
        <div v-if="application.status === 'enrolled'" class="stage-card card-green">
          <div class="stage-icon big-icon"><i class="bi bi-mortarboard-fill"></i></div>
          <div class="stage-body">
            <div class="stage-title">🎉 Congratulations — You Passed!</div>
            <div class="stage-desc">
              You have successfully passed the PNC Admission Test and are now
              <strong>eligible to enroll</strong> at Pamantasan ng Cabuyao!
              Please visit the <strong>Registrar's Office</strong> in person to complete your enrollment
              and receive your Student ID.
            </div>
            <div v-if="application.exam_score !== null" class="score-pill">
              <i class="bi bi-star-fill"></i> Exam Score: {{ application.exam_score }} / 100
            </div>
            <div class="office-info" style="margin-top:14px;">
              <div class="oi-row"><i class="bi bi-geo-alt-fill"></i> Katapatan Village, Brgy. Banay-Banay, Cabuyao City, Laguna</div>
              <div class="oi-row"><i class="bi bi-clock-fill"></i> Monday – Friday, 8:00 AM – 5:00 PM</div>
              <div class="oi-row"><i class="bi bi-telephone-fill"></i> (049) 832-3033</div>
            </div>
            <div class="enroll-reminder">
              <i class="bi bi-exclamation-circle-fill"></i>
              Bring your tracking code and a valid ID when you visit the Registrar's Office.
            </div>
          </div>
        </div>

        <!-- REJECTED -->
        <div v-if="application.status === 'rejected'" class="stage-card card-red">
          <div class="stage-icon"><i class="bi bi-x-circle-fill"></i></div>
          <div class="stage-body">
            <div class="stage-title">Application Not Accepted</div>
            <div class="stage-desc">
              {{ application.rejection_reason || 'We regret to inform you that your application was not accepted at this time. You may reapply next term.' }}
            </div>
          </div>
        </div>

        <!-- Admin note -->
        <div v-if="application.admin_notes" class="admin-note">
          <i class="bi bi-info-circle-fill"></i>
          <div>
            <div class="an-label">Note from the Admissions Office</div>
            <div class="an-text">{{ application.admin_notes }}</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="sc-footer">
          <span><i class="bi bi-calendar3"></i> Applied: {{ formatDate(application.applied_at) }}</span>
          <button class="btn-back" @click="clearAndReset()">
            <i class="bi bi-arrow-left"></i> Check Another
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from '@/lib/supabase.js'

const codeInput   = ref('')
const loading     = ref(false)
const lookupError = ref('')
const application = ref(null)
let realtimeChannel = null

// ── On page load: restore last tracked code ──
onMounted(async () => {
  const saved = localStorage.getItem('pnc_tracking_code')
  if (saved) {
    codeInput.value = saved
    await lookup(true)
  }
})

// ── Cleanup subscription on unmount ──
onBeforeUnmount(() => {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
})

async function lookup(silent = false) {
  const code = codeInput.value.trim().toUpperCase()
  if (!code) {
    if (!silent) lookupError.value = 'Please enter your tracking code.'
    return
  }
  loading.value = true
  lookupError.value = ''
  const { data, error } = await supabase
    .from('applications').select('*').eq('tracking_code', code).single()
  loading.value = false
  if (error || !data) {
    if (!silent) lookupError.value = 'No application found. Please check your tracking code and try again.'
    localStorage.removeItem('pnc_tracking_code')
    return
  }
  application.value = data
  localStorage.setItem('pnc_tracking_code', code)

  // ── Subscribe to real-time updates for this specific row ──
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  realtimeChannel = supabase
    .channel('application-status-' + data.id)
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'applications',
      filter: `id=eq.${data.id}`
    }, (payload) => {
      // Merge new data — status updates automatically without refresh
      application.value = { ...application.value, ...payload.new }
    })
    .subscribe()
}

function clearAndReset() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  realtimeChannel    = null
  application.value  = null
  codeInput.value    = ''
  lookupError.value  = ''
  localStorage.removeItem('pnc_tracking_code')
}

const steps = [
  { key: 'pending',             label: 'Applied'        },
  { key: 'document_submission', label: 'Submit Docs'    },
  { key: 'document_review',     label: 'Docs Verified'  },
  { key: 'exam',                label: 'Admission Test' },
  { key: 'enrolled',            label: 'Enrolled'       },
]
const order = { pending:0, document_submission:1, document_review:2, exam:3, enrolled:4, rejected:4 }

function stepState(key) {
  const cur = order[application.value?.status] ?? 0
  const pos = order[key] ?? 0
  if (application.value?.status === 'rejected' && pos === 4) return 'upcoming'
  if (cur > pos) return 'done'
  if (cur === pos) return 'active'
  return 'upcoming'
}

const statusLabel = computed(() => ({
  pending:             'Under Review',
  document_submission: 'Submit Documents',
  document_review:     'Verifying Documents',
  exam:                'Admission Test',
  enrolled:            'Enrolled ✓',
  rejected:            'Not Accepted',
}[application.value?.status] || application.value?.status))

const statusIcon = computed(() => ({
  pending:             'bi bi-hourglass-split',
  document_submission: 'bi bi-person-walking',
  document_review:     'bi bi-eye-fill',
  exam:                'bi bi-pencil-square',
  enrolled:            'bi bi-mortarboard-fill',
  rejected:            'bi bi-x-circle-fill',
}[application.value?.status] || 'bi bi-circle'))

function initials(name) {
  return (name || '').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })
}
</script>

<style scoped>
.track-page { min-height: 100vh; background: #f5f7f5; font-family: 'Inter','Segoe UI',sans-serif; }

.tnav { background: #1a6b2e; padding: 14px 32px; display: flex; align-items: center; justify-content: space-between; }
.tnav-brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.tnav-name  { font-size: 14px; font-weight: 700; color: #fff; }
.tnav-sub   { font-size: 10px; color: #d4a017; text-transform: uppercase; letter-spacing: .5px; }
.tnav-back  { background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3); color: #fff; border-radius: 7px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; transition: all .15s; }
.tnav-back:hover { background: rgba(255,255,255,.25); }

.track-body { max-width: 680px; margin: 40px auto; padding: 0 20px 60px; }

.lookup-card { background: #fff; border-radius: 16px; padding: 44px 40px; text-align: center; box-shadow: 0 4px 24px rgba(26,107,46,.08); border: 1px solid #d6e4d8; }
.lookup-icon { font-size: 52px; color: #1a6b2e; margin-bottom: 16px; }
.lookup-card h2 { font-size: 24px; font-weight: 800; color: #0f3d1c; margin-bottom: 8px; }
.lookup-card p  { font-size: 14px; color: #607060; margin-bottom: 28px; line-height: 1.6; }
.lk-field { text-align: left; margin-bottom: 14px; }
.lk-field label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #1a6b2e; margin-bottom: 7px; }
.lk-field input { width: 100%; padding: 14px 18px; border: 2px solid #d6e4d8; border-radius: 10px; font-size: 18px; font-family: monospace; letter-spacing: 3px; outline: none; box-sizing: border-box; text-align: center; text-transform: uppercase; transition: border-color .2s; }
.lk-field input:focus { border-color: #1a6b2e; box-shadow: 0 0 0 3px rgba(26,107,46,.1); }
.lk-error { color: #c0392b; font-size: 13px; margin-bottom: 12px; background: #fff0f0; padding: 10px 14px; border-radius: 7px; border: 1px solid #f5c6cb; display: flex; align-items: center; gap: 7px; }
.btn-lookup { width: 100%; padding: 14px; background: #1a6b2e; color: #fff; border: none; border-radius: 9px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; transition: all .2s; margin-bottom: 16px; }
.btn-lookup:hover:not(:disabled) { background: #134f22; }
.btn-lookup:disabled { opacity: .6; cursor: not-allowed; }
.lk-hint { font-size: 12px; color: #adb5bd; display: flex; align-items: flex-start; gap: 6px; text-align: left; line-height: 1.5; }

.status-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(26,107,46,.08); border: 1px solid #d6e4d8; overflow: hidden; }
.sc-header { display: flex; align-items: center; gap: 16px; padding: 24px 28px; background: linear-gradient(135deg, #0f3d1c, #1a6b2e); flex-wrap: wrap; }
.sc-avatar { width: 52px; height: 52px; border-radius: 50%; background: #d4a017; color: #0f3d1c; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; flex-shrink: 0; border: 3px solid rgba(255,255,255,.3); }
.sc-info { flex: 1; min-width: 0; }
.sc-name { font-size: 18px; font-weight: 700; color: #fff; }
.sc-prog { font-size: 13px; color: rgba(255,255,255,.7); margin-top: 2px; }
.sc-code { font-size: 12px; color: #d4a017; margin-top: 5px; font-family: monospace; display: flex; align-items: center; gap: 5px; font-weight: 700; letter-spacing: 1px; }
.sc-badge { padding: 7px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0; }
.badge-pending             { background: #fef3c7; color: #92400e; }
.badge-document_submission { background: #dbeafe; color: #1e40af; }
.badge-document_review     { background: #ffedd5; color: #9a3412; }
.badge-exam                { background: #ede9fe; color: #5b21b6; }
.badge-enrolled            { background: #d1fae5; color: #065f46; }
.badge-rejected            { background: #fee2e2; color: #991b1b; }

.stepper { display: flex; align-items: flex-start; padding: 22px 28px; border-bottom: 1px solid #eef3ef; overflow-x: auto; }
.step-item { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; min-width: 56px; }
.step-line-before { position: absolute; top: 17px; right: 50%; width: 100%; height: 2px; background: #d6e4d8; z-index: 0; }
.step-item.done   .step-line-before { background: #1a6b2e; }
.step-item.active .step-line-before { background: linear-gradient(90deg, #1a6b2e, #d4a017); }
.step-dot { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; border: 2px solid #d6e4d8; background: #fff; color: #adb5bd; position: relative; z-index: 1; flex-shrink: 0; }
.step-item.done   .step-dot { background: #1a6b2e; border-color: #1a6b2e; color: #fff; }
.step-item.active .step-dot { background: #d4a017; border-color: #d4a017; color: #fff; box-shadow: 0 0 0 4px rgba(212,160,23,.2); }
.step-lbl { font-size: 10px; color: #adb5bd; margin-top: 7px; text-align: center; font-weight: 600; text-transform: uppercase; letter-spacing: .3px; line-height: 1.3; }
.step-item.done   .step-lbl { color: #1a6b2e; }
.step-item.active .step-lbl { color: #d4a017; }

.stage-card { display: flex; gap: 18px; padding: 24px 28px; border-bottom: 1px solid #eef3ef; align-items: flex-start; }
.stage-icon { font-size: 26px; flex-shrink: 0; width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.big-icon   { font-size: 32px; }
.card-yellow .stage-icon { background: #fef3c7; color: #d97706; }
.card-blue   .stage-icon { background: #dbeafe; color: #2563eb; }
.card-orange .stage-icon { background: #ffedd5; color: #ea580c; }
.card-purple .stage-icon { background: #ede9fe; color: #7c3aed; }
.card-green  .stage-icon { background: #d1fae5; color: #059669; }
.card-red    .stage-icon { background: #fee2e2; color: #dc2626; }
.stage-title { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.card-yellow .stage-title { color: #92400e; }
.card-blue   .stage-title { color: #1e40af; }
.card-orange .stage-title { color: #9a3412; }
.card-purple .stage-title { color: #5b21b6; }
.card-green  .stage-title { color: #065f46; }
.card-red    .stage-title { color: #991b1b; }
.stage-desc { font-size: 13px; line-height: 1.7; color: #495057; }

.doc-list { margin: 14px 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 7px; }
.doc-list li { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #1e40af; background: rgba(219,234,254,.5); padding: 8px 12px; border-radius: 7px; font-weight: 500; }
.doc-list i { color: #2563eb; font-size: 14px; flex-shrink: 0; }

.office-info { margin-top: 14px; background: rgba(255,255,255,.7); border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; border: 1px solid rgba(0,0,0,.06); }
.oi-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #374151; font-weight: 500; }
.oi-row i { color: #1a6b2e; font-size: 13px; flex-shrink: 0; }

.score-pill { margin-top: 14px; display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,.6); border: 1px solid rgba(16,185,129,.3); border-radius: 99px; padding: 6px 16px; font-size: 13px; font-weight: 700; color: #065f46; }
.enroll-reminder { margin-top: 14px; background: rgba(255,255,255,.6); border: 1.5px solid rgba(16,185,129,.4); border-radius: 9px; padding: 11px 14px; font-size: 13px; color: #065f46; font-weight: 600; display: flex; align-items: flex-start; gap: 8px; line-height: 1.5; }
.enroll-reminder i { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

.admin-note { display: flex; gap: 12px; background: #fef3c7; padding: 16px 28px; border-bottom: 1px solid #eef3ef; align-items: flex-start; }
.admin-note > i { font-size: 18px; color: #d97706; flex-shrink: 0; margin-top: 2px; }
.an-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #92400e; margin-bottom: 3px; }
.an-text  { font-size: 13px; color: #78350f; line-height: 1.6; }

.sc-footer { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; font-size: 12px; color: #adb5bd; flex-wrap: wrap; gap: 8px; }
.sc-footer span { display: flex; align-items: center; gap: 6px; }
.btn-back { background: none; border: 1px solid #d6e4d8; border-radius: 7px; padding: 8px 14px; font-size: 12px; color: #607060; cursor: pointer; display: flex; align-items: center; gap: 6px; font-family: inherit; transition: all .15s; }
.btn-back:hover { border-color: #1a6b2e; color: #1a6b2e; }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { display: inline-block; animation: spin .7s linear infinite; }

@media (max-width: 600px) {
  .tnav { padding: 12px 16px; }
  .track-body { padding: 0 12px 40px; margin-top: 20px; }
  .lookup-card { padding: 28px 20px; }
  .sc-header, .stage-card, .admin-note, .sc-footer { padding-left: 16px; padding-right: 16px; }
  .stepper { padding: 16px; }
  .stage-card { flex-direction: column; gap: 10px; }
}
</style>