<template>
  <div>
    <div class="page-bar">
      <div class="search-wrap"><i class="bi bi-search"></i><input v-model="search" type="text" placeholder="Search faculty…" /></div>
      <button class="btn-primary" @click="openModal()"><i class="bi bi-plus-lg"></i> Add Faculty</button>
    </div>

    <div class="panel">
      <div v-if="loading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
      <div v-else-if="filtered.length===0" class="empty-state">No faculty found.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Department</th><th>Position</th><th>Specialization</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="f in filtered" :key="f.id">
              <td><strong>{{ f.id }}</strong></td>
              <td>
                <div class="name-cell">
                  <div class="avatar gold">{{ f.initials }}</div>
                  <div>
                    <div class="name">{{ f.name }}</div>
                    <div class="email">{{ f.email }}</div>
                  </div>
                </div>
              </td>
              <td>{{ f.department }}</td>
              <td>{{ f.position }}</td>
              <td class="truncate">{{ f.specialization }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon" @click="openModal(f)"><i class="bi bi-pencil"></i></button>
                  <button class="btn-icon danger" @click="confirmDelete(f)"><i class="bi bi-trash"></i></button>
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
          <span>{{ editing ? 'Edit Faculty' : 'Add Faculty' }}</span>
          <button @click="showModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">

            <div class="field">
              <label>Faculty ID *</label>
              <div class="input-with-btn">
                <input v-model="form.id" :disabled="!!editing" placeholder="Auto-generated" />
                <button v-if="!editing" class="gen-btn" @click="generateId" title="Generate ID">
                  <i class="bi bi-arrow-repeat"></i>
                </button>
              </div>
              <span class="field-hint">Format: FAC-YYYY-XXX · Click ↻ to regenerate</span>
            </div>

            <div class="field">
              <label>Full Name *</label>
              <input v-model="form.name" placeholder="Dr. Juan dela Cruz" />
            </div>

            <div class="field">
              <label>Initials</label>
              <input v-model="form.initials" placeholder="JC" maxlength="5" />
            </div>
            <div class="field">
              <label>Email *</label>
              <input v-model="form.email" type="email" placeholder="faculty@edu.ph" />
            </div>

            <div class="field">
              <label>Date of Birth</label>
              <CalendarPicker v-model="form.date_of_birth" placeholder="Select date of birth" :max-year="new Date().getFullYear()" />
            </div>
            <div class="field">
              <label>Phone</label>
              <input v-model="form.phone" placeholder="09XXXXXXXXX" />
            </div>

            <div class="field full">
              <label>Address</label>
              <input v-model="form.address" placeholder="Brgy., City, Province" />
            </div>

            <div class="field">
              <label>Gender</label>
              <select v-model="form.gender">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div class="field">
              <label>Department *</label>
              <select v-model="form.department">
                <option value="">— Select Department —</option>
                <option>Computer Science</option>
                <option>Information Technology</option>
                <option>Information Systems</option>
                <option>Computer Engineering</option>
                <option>Electronics Engineering</option>
                <option>Civil Engineering</option>
                <option>Mechanical Engineering</option>
                <option>Electrical Engineering</option>
                <option>Business Administration</option>
                <option>Accountancy</option>
                <option>Education</option>
                <option>Psychology</option>
                <option>Communication</option>
                <option>Political Science</option>
                <option>General Education</option>
              </select>
            </div>

            <div class="field">
              <label>Position *</label>
              <select v-model="form.position">
                <option>Instructor I</option>
                <option>Instructor II</option>
                <option>Instructor III</option>
                <option>Assistant Professor I</option>
                <option>Assistant Professor II</option>
                <option>Assistant Professor III</option>
                <option>Associate Professor I</option>
                <option>Associate Professor II</option>
                <option>Associate Professor III</option>
                <option>Full Professor I</option>
                <option>Full Professor II</option>
                <option>Full Professor III</option>
              </select>
            </div>

            <div class="field full">
              <label>Specialization</label>
              <input v-model="form.specialization" placeholder="e.g. Machine Learning & AI" />
            </div>

            <div class="field">
              <label>Years of Service</label>
              <input v-model="form.years_of_service" placeholder="e.g. 5 years" />
            </div>

            <div class="field">
              <label>Employment Status</label>
              <select v-model="form.employment_status">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contractual</option>
              </select>
            </div>

            <div class="field full">
              <label>Education</label>
              <input v-model="form.education" placeholder="e.g. Ph.D. Computer Science, UP Diliman" />
            </div>

          </div>

          <!-- Password preview -->
          <div class="pw-preview" v-if="passwordPreview">
            <i class="bi bi-key"></i>
            <span>Default password: <strong>{{ passwordPreview }}</strong></span>
          </div>

          <div v-if="formError" class="form-error">{{ formError }}</div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="showModal=false">Cancel</button>
          <button class="btn-primary" @click="saveFaculty" :disabled="saving">
            <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
            <span v-else>{{ editing ? 'Save Changes' : 'Add Faculty' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget=null">
      <div class="modal confirm-modal">
        <div class="modal-head">
          <span>Delete Faculty</span>
          <button @click="deleteTarget=null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p>Delete <strong>{{ deleteTarget.name }}</strong>? Students advised by this faculty will have their adviser unset.</p>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="deleteTarget=null">Cancel</button>
          <button class="btn-danger" @click="deleteFaculty" :disabled="saving">
            {{ saving ? 'Deleting…' : 'Yes, Delete' }}
          </button>
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
import CalendarPicker from '@/components/CalendarPicker.vue'

const auth        = useAuthStore()
const faculty     = ref([])
const loading     = ref(true)
const saving      = ref(false)
const search      = ref('')
const showModal   = ref(false)
const editing     = ref(null)
const deleteTarget = ref(null)
const formError   = ref('')

const blank = () => ({
  id: '', name: '', initials: '', email: '', date_of_birth: '',
  phone: '', address: '', gender: 'Male', department: '',
  position: 'Instructor I', specialization: '',
  years_of_service: '', employment_status: 'Full-time', education: ''
})
const form = ref(blank())

// ── Auto-generate faculty ID: FAC-YYYY-XXX ───────────────────
async function generateId() {
  const year = new Date().getFullYear()
  const { data } = await supabase
    .from('faculty')
    .select('id')
    .like('id', `FAC-${year}-%`)
    .order('id', { ascending: false })
    .limit(1)

  let nextNum = 1
  if (data && data.length > 0) {
    const lastPart = data[0].id.split('-').pop()
    nextNum = parseInt(lastPart) + 1
  }
  form.value.id = `FAC-${year}-${String(nextNum).padStart(3, '0')}`
}

// ── Password preview: last 3 digits of ID + birth year ───────
const passwordPreview = computed(() => {
  if (!form.value.id || !form.value.date_of_birth || editing.value) return ''
  const idDigits  = form.value.id.replace(/\D/g, '')
  const last3     = idDigits.slice(-3)
  const yearMatch = form.value.date_of_birth.match(/\b(19|20)\d{2}\b/)
  const birthYear = yearMatch ? yearMatch[0] : ''
  if (!last3 || !birthYear) return ''
  return last3 + birthYear
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return faculty.value.filter(f =>
    !q ||
    f.name.toLowerCase().includes(q) ||
    f.id.toLowerCase().includes(q) ||
    (f.department || '').toLowerCase().includes(q)
  )
})

async function load() {
  loading.value = true
  const { data } = await supabase.from('faculty').select('*').order('name')
  faculty.value = data || []
  loading.value = false
}
let channel
onMounted(() => {
  load()
  channel = supabase
    .channel('faculty-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, load)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

async function openModal(f = null) {
  editing.value   = f
  formError.value = ''
  form.value      = f ? { ...f } : blank()
  showModal.value = true
  if (!f) await generateId()
}

async function saveFaculty() {
  if (!form.value.id || !form.value.name || !form.value.email) {
    formError.value = 'ID, Name and Email are required.'
    return
  }
  saving.value = true; formError.value = ''
  const payload = { ...form.value }
  let err
  if (editing.value) {
    const res = await supabase.from('faculty').update({ ...payload, updated_at: new Date() }).eq('id', editing.value.id)
    err = res.error
    if (!err) await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Updated faculty', targetType:'faculty', targetId:form.value.id, targetName:form.value.name })
  } else {
    const res = await supabase.from('faculty').insert(payload)
    err = res.error
    if (!err) await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Created faculty', targetType:'faculty', targetId:form.value.id, targetName:form.value.name })
  }
  saving.value = false
  if (err) { formError.value = err.message; return }
  showModal.value = false
  await load()
}

function confirmDelete(f) { deleteTarget.value = f }

async function deleteFaculty() {
  saving.value = true
  await supabase.from('faculty').delete().eq('id', deleteTarget.value.id)
  await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Deleted faculty', targetType:'faculty', targetId:deleteTarget.value.id, targetName:deleteTarget.value.name })
  deleteTarget.value = null; saving.value = false
  await load()
}
</script>

<style scoped>
.page-bar{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;padding:8px 12px;flex:1;min-width:200px;}
.search-wrap i{color:#6c757d;}
.search-wrap input{border:none;outline:none;font-size:13px;font-family:inherit;width:100%;}
.btn-primary{padding:9px 16px;background:#1a6b2e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;font-family:inherit;}
.btn-primary:disabled{opacity:.6;cursor:not-allowed;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
td{padding:11px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.name-cell{display:flex;align-items:center;gap:9px;}
.avatar{width:30px;height:30px;border-radius:8px;background:#eaf4ec;color:#1a6b2e;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
.avatar.gold{background:#fff8e1;color:#b8890e;}
.name{font-weight:600;color:#212529;font-size:12px;}
.email{font-size:10px;color:#6c757d;}
.truncate{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.action-btns{display:flex;gap:6px;}
.btn-icon{width:30px;height:30px;border-radius:7px;border:1px solid #d6e4d8;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:#6c757d;}
.btn-icon:hover{background:#eaf4ec;color:#1a6b2e;border-color:#1a6b2e;}
.btn-icon.danger:hover{background:#fff0f0;color:#dc3545;border-color:#dc3545;}
.empty-state{padding:32px;text-align:center;color:#6c757d;font-size:13px;}
/* Modal */
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
/* Form */
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
.gen-btn{width:34px;height:34px;border:1px solid #d6e4d8;border-radius:7px;background:#f8f9fa;cursor:pointer;font-size:14px;color:#1a6b2e;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.gen-btn:hover{background:#eaf4ec;border-color:#1a6b2e;}
.pw-preview{margin-top:14px;padding:10px 14px;background:#fff8e1;border:1px solid #ffeaa7;border-radius:7px;font-size:12px;color:#856404;display:flex;align-items:center;gap:8px;}
.pw-preview strong{font-size:13px;letter-spacing:.5px;}
.form-error{margin-top:12px;padding:10px 12px;background:#fff0f0;border:1px solid #f5c6cb;border-radius:7px;font-size:12px;color:#c0392b;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>