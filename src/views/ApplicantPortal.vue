<template>
  <div class="apply-page">
    <div class="apply-container">

      <!-- Header -->
      <div class="apply-header">
        <div class="school-logo">
          <i class="bi bi-mortarboard-fill"></i>
        </div>
        <div>
          <h1 class="apply-title">Pamantasan ng Cabuyao</h1>
          <p class="apply-sub">Online Application Form · A.Y. 2025–2026</p>
        </div>
      </div>

      <!-- Success state -->
      <div v-if="submitted" class="success-card">
        <div class="success-icon"><i class="bi bi-check-circle-fill"></i></div>
        <h2 class="success-title">Application Submitted!</h2>
        <p class="success-msg">
          Thank you, <strong>{{ submittedName }}</strong>! Your application has been received.
          Our admissions team will review it and send next steps to <strong>{{ submittedEmail }}</strong>.
        </p>
        <div class="success-id">
          <span class="id-label">Application Reference</span>
          <span class="id-val">{{ submittedId }}</span>
        </div>
        <button class="btn-apply-again" @click="submitted=false; resetForm()">
          Submit another application
        </button>
      </div>

      <!-- Form -->
      <form v-else @submit.prevent="doSubmit" class="apply-form">

        <!-- Step indicator -->
        <div class="step-nav">
          <div
            v-for="(s, i) in steps" :key="i"
            class="step-dot-nav"
            :class="{ active: currentStep===i, done: currentStep>i }"
            @click="currentStep > i ? currentStep = i : null"
          >
            <div class="dot-circle">
              <i v-if="currentStep>i" class="bi bi-check"></i>
              <span v-else>{{ i+1 }}</span>
            </div>
            <span class="dot-label">{{ s }}</span>
          </div>
        </div>

        <!-- Step 1: Personal Info -->
        <div v-show="currentStep===0" class="form-section">
          <h3 class="section-title"><i class="bi bi-person"></i> Personal Information</h3>
          <div class="form-grid">
            <div class="field full">
              <label class="field-label">Full Name *</label>
              <input v-model="form.full_name" class="field-input" placeholder="Last Name, First Name Middle Name" required />
            </div>
            <div class="field">
              <label class="field-label">Email Address *</label>
              <input v-model="form.email" type="email" class="field-input" placeholder="you@email.com" required />
            </div>
            <div class="field">
              <label class="field-label">Phone Number *</label>
              <input v-model="form.phone" class="field-input" placeholder="09XX-XXX-XXXX" required />
            </div>
            <div class="field">
              <label class="field-label">Birthday *</label>
              <input v-model="form.birthday" type="date" class="field-input" required />
            </div>
            <div class="field">
              <label class="field-label">Gender *</label>
              <select v-model="form.gender" class="field-input" required>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div class="field full">
              <label class="field-label">Home Address *</label>
              <input v-model="form.address" class="field-input" placeholder="Brgy., City/Municipality, Province" required />
            </div>
          </div>
        </div>

        <!-- Step 2: Academic Background -->
        <div v-show="currentStep===1" class="form-section">
          <h3 class="section-title"><i class="bi bi-book"></i> Academic Background</h3>
          <div class="form-grid">
            <div class="field full">
              <label class="field-label">Program Applying For *</label>
              <select v-model="form.program" class="field-input" required>
                <option value="">Select program</option>
                <option>BS Computer Science</option>
                <option>BS Information Technology</option>
                <option>BS Computer Engineering</option>
                <option>BS Electronics Engineering</option>
                <option>BS Accountancy</option>
                <option>BS Business Administration</option>
                <option>BS Education</option>
                <option>BS Nursing</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">Senior High Strand</label>
              <select v-model="form.strand" class="field-input">
                <option value="">Select strand</option>
                <option>STEM</option>
                <option>ABM</option>
                <option>HUMSS</option>
                <option>GAS</option>
                <option>TVL</option>
                <option>Sports</option>
                <option>Arts & Design</option>
              </select>
            </div>
            <div class="field">
              <label class="field-label">General Weighted Average (GWA)</label>
              <input v-model.number="form.gwa" type="number" class="field-input" placeholder="e.g. 1.75" min="1" max="5" step="0.01" />
            </div>
            <div class="field full">
              <label class="field-label">Last School Attended *</label>
              <input v-model="form.school_last" class="field-input" placeholder="School name" required />
            </div>
            <div class="field">
              <label class="field-label">School Year *</label>
              <select v-model="form.school_year" class="field-input" required>
                <option value="">Select year</option>
                <option>2024-2025</option>
                <option>2023-2024</option>
                <option>2022-2023</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 3: Review & Submit -->
        <div v-show="currentStep===2" class="form-section">
          <h3 class="section-title"><i class="bi bi-clipboard-check"></i> Review & Submit</h3>
          <div class="review-grid">
            <div class="review-group">
              <div class="review-group-title">Personal Information</div>
              <div class="review-row"><span>Full Name</span><strong>{{ form.full_name || '—' }}</strong></div>
              <div class="review-row"><span>Email</span><strong>{{ form.email || '—' }}</strong></div>
              <div class="review-row"><span>Phone</span><strong>{{ form.phone || '—' }}</strong></div>
              <div class="review-row"><span>Birthday</span><strong>{{ form.birthday || '—' }}</strong></div>
              <div class="review-row"><span>Gender</span><strong>{{ form.gender || '—' }}</strong></div>
              <div class="review-row"><span>Address</span><strong>{{ form.address || '—' }}</strong></div>
            </div>
            <div class="review-group">
              <div class="review-group-title">Academic Background</div>
              <div class="review-row"><span>Program</span><strong>{{ form.program || '—' }}</strong></div>
              <div class="review-row"><span>Strand</span><strong>{{ form.strand || '—' }}</strong></div>
              <div class="review-row"><span>GWA</span><strong>{{ form.gwa || '—' }}</strong></div>
              <div class="review-row"><span>Last School</span><strong>{{ form.school_last || '—' }}</strong></div>
              <div class="review-row"><span>School Year</span><strong>{{ form.school_year || '—' }}</strong></div>
            </div>
          </div>
          <div class="consent-box">
            <label class="consent-check">
              <input type="checkbox" v-model="form.consent" required />
              <span>
                I certify that the information provided is true and correct. I agree to the
                <a href="#" class="link">Data Privacy Policy</a> of Pamantasan ng Cabuyao.
              </span>
            </label>
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="error-msg">
          <i class="bi bi-exclamation-triangle-fill"></i> {{ errorMsg }}
        </div>

        <!-- Navigation buttons -->
        <div class="form-nav">
          <button
            type="button"
            class="btn-back"
            v-if="currentStep > 0"
            @click="currentStep--"
          >
            <i class="bi bi-arrow-left"></i> Back
          </button>
          <div style="flex:1;"></div>
          <button
            v-if="currentStep < 2"
            type="button"
            class="btn-next"
            @click="nextStep"
          >
            Next <i class="bi bi-arrow-right"></i>
          </button>
          <button
            v-else
            type="submit"
            class="btn-submit"
            :disabled="!form.consent || submitting"
          >
            <i v-if="submitting" class="bi bi-arrow-repeat spin"></i>
            <i v-else class="bi bi-send-fill"></i>
            {{ submitting ? 'Submitting…' : 'Submit Application' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { createApplicant } from '@/lib/admissions.js'

const submitted     = ref(false)
const submitting    = ref(false)
const errorMsg      = ref('')
const currentStep   = ref(0)
const submittedName = ref('')
const submittedEmail = ref('')
const submittedId   = ref('')

const steps = ['Personal Info', 'Academic Background', 'Review & Submit']

const form = reactive({
  full_name: '', email: '', phone: '', birthday: '', gender: '', address: '',
  program: '', strand: '', gwa: null, school_last: '', school_year: '',
  consent: false,
})

function resetForm() {
  Object.assign(form, {
    full_name:'', email:'', phone:'', birthday:'', gender:'', address:'',
    program:'', strand:'', gwa:null, school_last:'', school_year:'', consent:false,
  })
  currentStep.value = 0
  errorMsg.value = ''
}

function nextStep() {
  errorMsg.value = ''
  if (currentStep.value === 0) {
    if (!form.full_name || !form.email || !form.phone || !form.birthday || !form.gender || !form.address) {
      errorMsg.value = 'Please fill in all required fields.'
      return
    }
  }
  if (currentStep.value === 1) {
    if (!form.program || !form.school_last || !form.school_year) {
      errorMsg.value = 'Please fill in all required fields.'
      return
    }
  }
  currentStep.value++
}

async function doSubmit() {
  if (!form.consent) return
  submitting.value = true
  errorMsg.value   = ''
  try {
    const { consent: _, ...payload } = form
    const result = await createApplicant(payload)
    submittedName.value  = form.full_name
    submittedEmail.value = form.email
    submittedId.value    = result.id.slice(0, 8).toUpperCase()
    submitted.value      = true
  } catch (e) {
    if (e.message?.includes('unique')) {
      errorMsg.value = 'An application with this email already exists.'
    } else {
      errorMsg.value = 'Failed to submit. Please try again.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.apply-page { min-height:100vh; background:#f0f4f0; display:flex; align-items:flex-start; justify-content:center; padding:40px 20px; font-family:'Segoe UI', sans-serif; }
.apply-container { width:100%; max-width:640px; }

.apply-header { display:flex; align-items:center; gap:16px; margin-bottom:24px; }
.school-logo { width:52px; height:52px; background:#1a6b2e; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; flex-shrink:0; }
.apply-title { font-size:20px; font-weight:700; color:#1a1a1a; margin:0; }
.apply-sub { font-size:12px; color:#888; margin:3px 0 0; }

/* Success */
.success-card { background:#fff; border-radius:16px; padding:40px; text-align:center; border:1px solid #e5e5e5; }
.success-icon { font-size:48px; color:#198754; margin-bottom:16px; }
.success-title { font-size:22px; font-weight:700; color:#155724; margin:0 0 10px; }
.success-msg { font-size:14px; color:#555; line-height:1.6; margin-bottom:24px; }
.success-id { display:inline-flex; flex-direction:column; align-items:center; background:#f0f9f4; border:1px solid #a3ddb8; border-radius:10px; padding:12px 24px; margin-bottom:24px; }
.id-label { font-size:11px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:.5px; }
.id-val { font-size:20px; font-weight:700; color:#1a6b2e; font-family:monospace; margin-top:4px; }
.btn-apply-again { border:1px solid #dde; border-radius:8px; background:#fff; padding:10px 20px; font-size:13px; cursor:pointer; color:#555; }

/* Form */
.apply-form { background:#fff; border-radius:16px; border:1px solid #e5e5e5; overflow:hidden; }

.step-nav { display:flex; padding:20px 24px; gap:0; border-bottom:1px solid #f0f0f0; background:#fafafa; }
.step-dot-nav { display:flex; align-items:center; gap:8px; flex:1; cursor:default; }
.step-dot-nav:not(:last-child)::after { content:''; flex:1; height:2px; background:#e0e0e0; margin:0 8px; }
.step-dot-nav.done::after { background:#1a6b2e; }
.dot-circle { width:28px; height:28px; border-radius:50%; background:#eee; border:2px solid #ddd; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#999; flex-shrink:0; }
.step-dot-nav.active .dot-circle { background:#1a6b2e; border-color:#1a6b2e; color:#fff; }
.step-dot-nav.done .dot-circle { background:#1a6b2e; border-color:#1a6b2e; color:#fff; }
.dot-label { font-size:11px; font-weight:600; color:#aaa; white-space:nowrap; }
.step-dot-nav.active .dot-label, .step-dot-nav.done .dot-label { color:#1a6b2e; }

.form-section { padding:24px; }
.section-title { font-size:15px; font-weight:700; color:#222; margin:0 0 20px; display:flex; align-items:center; gap:8px; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.field { display:flex; flex-direction:column; gap:5px; }
.field.full { grid-column:1/-1; }
.field-label { font-size:12px; font-weight:600; color:#555; }
.field-input { border:1px solid #dde; border-radius:8px; padding:9px 12px; font-size:13px; outline:none; font-family:inherit; box-sizing:border-box; width:100%; transition:.15s; }
.field-input:focus { border-color:#1a6b2e; box-shadow:0 0 0 3px rgba(26,107,46,.08); }

/* Review */
.review-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; }
.review-group { background:#f9f9f9; border:1px solid #eee; border-radius:10px; padding:14px; }
.review-group-title { font-size:11px; font-weight:700; color:#1a6b2e; text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; }
.review-row { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; padding:5px 0; border-bottom:1px solid #eee; font-size:12px; }
.review-row:last-child { border-bottom:none; }
.review-row span { color:#888; }
.review-row strong { color:#222; text-align:right; max-width:55%; word-break:break-word; }

.consent-box { background:#f0f9f4; border:1px solid #c3dfc9; border-radius:8px; padding:12px 14px; }
.consent-check { display:flex; align-items:flex-start; gap:10px; font-size:12px; color:#444; line-height:1.5; cursor:pointer; }
.consent-check input { margin-top:2px; accent-color:#1a6b2e; }
.link { color:#1a6b2e; }

.error-msg { margin:0 24px 0; padding:10px 14px; background:#fde8ea; border:1px solid #f5c6c9; border-radius:8px; font-size:13px; color:#842029; display:flex; align-items:center; gap:8px; }

.form-nav { display:flex; align-items:center; padding:16px 24px; border-top:1px solid #f0f0f0; gap:10px; }
.btn-back { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border:1px solid #dde; border-radius:8px; background:#fff; font-size:13px; cursor:pointer; color:#555; }
.btn-back:hover { background:#f5f5f5; }
.btn-next { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border:none; border-radius:8px; background:#1a6b2e; color:#fff; font-size:13px; font-weight:600; cursor:pointer; }
.btn-next:hover { background:#155724; }
.btn-submit { display:inline-flex; align-items:center; gap:6px; padding:9px 22px; border:none; border-radius:8px; background:#198754; color:#fff; font-size:13px; font-weight:600; cursor:pointer; }
.btn-submit:hover:not(:disabled) { background:#146c43; }
.btn-submit:disabled { opacity:.6; cursor:not-allowed; }

.spin { animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>