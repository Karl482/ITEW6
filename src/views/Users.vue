<template>
  <div>
    <div class="concept-bar">
      <div class="cb-box cb-state">
        <div class="cb-tag">STATE</div>
        <div class="cb-name">users.js Store</div>
      </div>
      <div class="cb-arrow"><i class="bi bi-arrow-right"></i><span>reads</span></div>
      <div class="cb-box cb-parent">
        <div class="cb-tag">PARENT</div>
        <div class="cb-name">Users.vue</div>
      </div>
      <div class="cb-arrow"><i class="bi bi-arrow-right"></i><span>:user prop</span></div>
      <div class="cb-box cb-child">
        <div class="cb-tag">CHILD</div>
        <div class="cb-name">UserCard.vue</div>
      </div>
      <div class="cb-arrow cb-up"><i class="bi bi-arrow-up"></i><span>emits events</span></div>
    </div>

    <!-- Toolbar -->
    <div class="page-bar">
      <div class="search-wrap">
        <i class="bi bi-search"></i>
        <input v-model="search" placeholder="Search by name, ID, program…" />
        <button v-if="search" class="clear-x" @click="search = ''"><i class="bi bi-x"></i></button>
      </div>
      <button class="btn-primary" @click="showAddModal = true">
        <i class="bi bi-plus-lg"></i> Add User
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="filter-btns">
      <span class="filter-label">Show:</span>
      <button
        v-for="f in filterOptions" :key="f.value"
        class="filter-btn"
        :class="{ active: activeFilter === f.value }"
        @click="activeFilter = f.value"
      >
        <i :class="f.icon"></i> {{ f.label }}
        <span class="fc">{{ f.count }}</span>
      </button>
    </div>

    <!-- Summary stat cards -->
    <div class="stats-row">
      <div class="stat-card">
        <i class="bi bi-people-fill stat-icon"></i>
        <div class="stat-body">
          <div class="stat-val">{{ totalCount }}</div>
          <div class="stat-lbl">Total Users</div>
        </div>
      </div>
      <div class="stat-card">
        <i class="bi bi-person-badge-fill stat-icon" style="color:#e9a825"></i>
        <div class="stat-body">
          <div class="stat-val">{{ students.length }}</div>
          <div class="stat-lbl">Students</div>
        </div>
      </div>
      <div class="stat-card">
        <i class="bi bi-person-workspace stat-icon" style="color:#2563eb"></i>
        <div class="stat-body">
          <div class="stat-val">{{ faculty.length }}</div>
          <div class="stat-lbl">Faculty</div>
        </div>
      </div>
      <div class="stat-card">
        <i class="bi bi-check-circle-fill stat-icon" style="color:#10b981"></i>
        <div class="stat-body">
          <div class="stat-val">{{ activeCount }}</div>
          <div class="stat-lbl">Active</div>
        </div>
      </div>
    </div>

    <!-- Result count -->
    <div v-if="search || activeFilter !== 'all'" class="result-line">
      Showing <strong>{{ filteredUsers.length }}</strong> user(s)
      <span v-if="search"> matching "<strong>{{ search }}</strong>"</span>
    </div>

    <!--
      ─────────────────────────────────────────────────────────────────
      PARENT → CHILD prop passing happens here.
      For each user in filteredUsers, we render a UserCard child
      and pass the user object down via the :user prop.
      Events emitted by the child are caught by @view, @toggle-status, @remove.
      ─────────────────────────────────────────────────────────────────
    -->
    <div v-if="filteredUsers.length" class="cards-grid">
      <UserCard
        v-for="user in filteredUsers"
        :key="user.id"
        :user="user"
        @view="onView"
        @toggle-status="onToggleStatus"
        @remove="onRemove"
      />
    </div>

    <div v-else class="panel">
      <div class="empty-state">No users found.</div>
    </div>

    <!-- ── VIEW MODAL ── -->
    <div v-if="selectedUser" class="modal-overlay" @click.self="selectedUser = null">
      <div class="modal">
        <div class="modal-head">
          <span>User Details</span>
          <button @click="selectedUser = null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="modal-hero">
            <div class="modal-avatar" :class="selectedUser.role === 'student' ? 'av-student' : 'av-faculty'">
              {{ selectedUser.initials }}
            </div>
            <div>
              <div class="mh-name">{{ selectedUser.name }}</div>
              <div class="mh-id">{{ selectedUser.id }}</div>
              <span class="uc-status mt-1 d-inline-flex"
                :class="selectedUser.status === 'active' ? 'st-active' : 'st-inactive'">
                <span class="st-dot"></span>{{ selectedUser.status }}
              </span>
            </div>
          </div>

          <table class="detail-table">
            <tbody>
              <tr><td class="dl">Email</td><td>{{ selectedUser.email }}</td></tr>
              <tr><td class="dl">Phone</td><td>{{ selectedUser.phone || '—' }}</td></tr>
              <tr><td class="dl">Gender</td><td>{{ selectedUser.gender || '—' }}</td></tr>
              <template v-if="selectedUser.role === 'student'">
                <tr><td class="dl">Program</td><td>{{ selectedUser.program }}</td></tr>
                <tr><td class="dl">Year / Section</td><td>{{ selectedUser.yearLevel }} · {{ selectedUser.section }}</td></tr>
                <tr><td class="dl">GPA</td><td><strong>{{ selectedUser.gpa }}</strong></td></tr>
              </template>
              <template v-if="selectedUser.role === 'faculty'">
                <tr><td class="dl">Department</td><td>{{ selectedUser.department }}</td></tr>
                <tr><td class="dl">Position</td><td>{{ selectedUser.position }}</td></tr>
                <tr><td class="dl">Specialization</td><td>{{ selectedUser.specialization }}</td></tr>
                <tr><td class="dl">Service</td><td>{{ selectedUser.yearsOfService }}</td></tr>
              </template>
            </tbody>
          </table>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="selectedUser = null">Close</button>
        </div>
      </div>
    </div>

    <!-- ── ADD USER MODAL ── -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="closeAdd">
      <div class="modal">
        <div class="modal-head">
          <span>Add New User</span>
          <button @click="closeAdd"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">

          <!-- Role switcher -->
          <div class="role-switch mb-3">
            <button
              class="rs-btn"
              :class="{ active: newUser.role === 'student' }"
              @click="newUser.role = 'student'"
            >
              <i class="bi bi-person-badge-fill"></i> Student
            </button>
            <button
              class="rs-btn"
              :class="{ active: newUser.role === 'faculty' }"
              @click="newUser.role = 'faculty'"
            >
              <i class="bi bi-person-workspace"></i> Faculty
            </button>
          </div>

          <div v-if="addError" class="form-error">{{ addError }}</div>

          <div class="form-grid">
            <div class="field full"><label>Full Name *</label><input v-model="newUser.name" placeholder="e.g. Juan dela Cruz" /></div>
            <div class="field"><label>Email *</label><input v-model="newUser.email" type="email" placeholder="email@edu.ph" /></div>
            <div class="field"><label>Phone</label><input v-model="newUser.phone" placeholder="09XXXXXXXXX" /></div>
            <div class="field">
              <label>Gender</label>
              <select v-model="newUser.gender"><option>Male</option><option>Female</option><option>Other</option></select>
            </div>

            <!-- Student fields -->
            <template v-if="newUser.role === 'student'">
              <div class="field full"><label>Program *</label><input v-model="newUser.program" placeholder="e.g. BS Information Technology" /></div>
              <div class="field">
                <label>Year Level</label>
                <select v-model="newUser.yearLevel">
                  <option>1st Year</option><option>2nd Year</option>
                  <option>3rd Year</option><option>4th Year</option>
                </select>
              </div>
              <div class="field"><label>Section</label><input v-model="newUser.section" placeholder="e.g. BSIT 2-A" /></div>
            </template>

            <!-- Faculty fields -->
            <template v-if="newUser.role === 'faculty'">
              <div class="field full"><label>Department *</label><input v-model="newUser.department" placeholder="e.g. Computer Science" /></div>
              <div class="field"><label>Position</label><input v-model="newUser.position" placeholder="e.g. Associate Professor" /></div>
              <div class="field"><label>Specialization</label><input v-model="newUser.specialization" placeholder="e.g. Web Development" /></div>
            </template>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="closeAdd">Cancel</button>
          <button class="btn-primary" @click="submitAdd">
            <i class="bi bi-plus-lg"></i> Add User
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.show" class="toast-msg" :class="toast.type">
          <i :class="toast.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// ── Import child component ──
import UserCard from '@/components/UserCard.vue'

// ── Import STATE from store ──
// The parent reads from the store; it then passes slices down to children via props
import { useUsersStore } from '@/store/users.js'

const { users, students, faculty, activeCount, totalCount, addUser, removeUser, toggleStatus } = useUsersStore()

// ── Local UI state (not shared) ──
const search       = ref('')
const activeFilter = ref('all')
const selectedUser = ref(null)
const showAddModal = ref(false)
const addError     = ref('')

// ── Filter options ──
const filterOptions = computed(() => [
  { value: 'all',      label: 'All',      icon: 'bi bi-people',            count: users.value.length       },
  { value: 'student',  label: 'Students', icon: 'bi bi-person-badge-fill', count: students.value.length    },
  { value: 'faculty',  label: 'Faculty',  icon: 'bi bi-person-workspace',  count: faculty.value.length     },
  { value: 'active',   label: 'Active',   icon: 'bi bi-check-circle-fill', count: activeCount.value        },
  { value: 'inactive', label: 'Inactive', icon: 'bi bi-pause-circle-fill', count: users.value.filter(u => u.status === 'inactive').length },
])

// ── Filtered list — this is what the parent passes as props to each UserCard ──
const filteredUsers = computed(() => {
  let list = users.value

  if (activeFilter.value === 'student')  list = list.filter(u => u.role === 'student')
  if (activeFilter.value === 'faculty')  list = list.filter(u => u.role === 'faculty')
  if (activeFilter.value === 'active')   list = list.filter(u => u.status === 'active')
  if (activeFilter.value === 'inactive') list = list.filter(u => u.status === 'inactive')

  const q = search.value.toLowerCase().trim()
  if (q) {
    list = list.filter(u =>
      u.name.toLowerCase().includes(q)  ||
      u.id.toLowerCase().includes(q)    ||
      (u.program || u.department || '').toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }

  return list
})

// ── Event handlers — called when child UserCard emits ──
function onView(user)         { selectedUser.value = user }
function onToggleStatus(id)   { toggleStatus(id); showToast('User status updated.', 'success') }
function onRemove(id)         { removeUser(id);   showToast('User removed.',        'success') }

// ── Add user ──
const blankUser = () => ({
  name: '', email: '', phone: '', gender: 'Male', role: 'student', status: 'active', avatar: null,
  program: '', yearLevel: '1st Year', section: '', gpa: '—',
  department: '', position: '', specialization: '', yearsOfService: '0 years',
  initials: '',
})
const newUser = ref(blankUser())

function submitAdd() {
  addError.value = ''
  if (!newUser.value.name.trim()) { addError.value = 'Full name is required.'; return }
  if (!newUser.value.email.trim()) { addError.value = 'Email is required.'; return }
  if (newUser.value.role === 'student' && !newUser.value.program.trim()) { addError.value = 'Program is required.'; return }
  if (newUser.value.role === 'faculty' && !newUser.value.department.trim()) { addError.value = 'Department is required.'; return }

  const nameParts = newUser.value.name.trim().split(' ')
  newUser.value.initials = nameParts.map(p => p[0]).slice(0, 2).join('').toUpperCase()

  addUser({ ...newUser.value })
  showToast(`${newUser.value.name} added successfully.`, 'success')
  closeAdd()
}

function closeAdd() {
  showAddModal.value = false
  addError.value     = ''
  newUser.value      = blankUser()
}

// ── Toast ──
const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null
function showToast(message, type = 'success') {
  clearTimeout(toastTimer)
  toast.value = { show: true, message, type }
  toastTimer  = setTimeout(() => { toast.value.show = false }, 3000)
}
</script>

<style scoped>
/* Concept banner */
.concept-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: #0d3b66; border-radius: 10px;
  padding: 12px 18px; margin-bottom: 16px;
}
.cb-box { padding: 8px 14px; border-radius: 8px; text-align: center; min-width: 100px; }
.cb-state  { background: rgba(233,168,37,.25); border: 1px solid rgba(233,168,37,.5); }
.cb-parent { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25); }
.cb-child  { background: rgba(110,231,183,.18); border: 1px solid rgba(110,231,183,.4); }
.cb-tag  { font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,.5); }
.cb-name { font-size: 12px; font-weight: 700; color: #fff; margin-top: 2px; font-family: monospace; }
.cb-arrow { display: flex; flex-direction: column; align-items: center; gap: 2px; color: rgba(255,255,255,.5); font-size: 10px; }
.cb-arrow i { font-size: 16px; color: #e9a825; }
.cb-up i { color: #6ee7b7; }
.cb-up { color: rgba(110,231,183,.7); }

/* Toolbar */
.page-bar { display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
.search-wrap { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #dee2e6; border-radius:8px; padding:8px 12px; flex:1; min-width:200px; }
.search-wrap i { color:#6c757d; flex-shrink:0; }
.search-wrap input { border:none; outline:none; font-size:13px; font-family:inherit; width:100%; background:transparent; }
.clear-x { background:none; border:none; cursor:pointer; color:#adb5bd; font-size:13px; padding:0; }
.clear-x:hover { color:#dc3545; }
.btn-primary { padding:9px 16px; background:#0d3b66; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; white-space:nowrap; font-family:inherit; }
.btn-primary:hover { background:#1a4f82; }

/* Filter tabs */
.filter-btns { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:14px; }
.filter-label { font-size:11px; font-weight:700; color:#adb5bd; text-transform:uppercase; letter-spacing:.4px; }
.filter-btn { padding:6px 12px; background:#fff; border:1px solid #dee2e6; border-radius:20px; font-size:12px; font-weight:600; color:#495057; cursor:pointer; display:flex; align-items:center; gap:5px; font-family:inherit; white-space:nowrap; transition:all .15s; }
.filter-btn:hover { border-color:#0d3b66; color:#0d3b66; background:#f0f7ff; }
.filter-btn.active { background:#0d3b66; color:#fff; border-color:#0d3b66; }
.fc { font-size:10px; background:rgba(255,255,255,.25); padding:1px 6px; border-radius:99px; }
.filter-btn:not(.active) .fc { background:#f0f2f5; color:#6c757d; }

/* Stats row */
.stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
.stat-card { background:#fff; border:1px solid #dee2e6; border-radius:10px; padding:14px 16px; display:flex; align-items:center; gap:12px; }
.stat-icon { font-size:22px; color:#0d3b66; flex-shrink:0; }
.stat-val  { font-size:22px; font-weight:700; color:#0d3b66; line-height:1; }
.stat-lbl  { font-size:11px; color:#6c757d; margin-top:2px; }

.result-line { font-size:12px; color:#6c757d; margin-bottom:12px; }

/* Cards grid */
.cards-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
@media(max-width:900px) { .cards-grid { grid-template-columns:repeat(2,1fr); } }
@media(max-width:600px) { .cards-grid { grid-template-columns:1fr; } }

/* Empty */
.panel { background:#fff; border:1px solid #dee2e6; border-radius:10px; overflow:hidden; }
.empty-state { padding:32px; text-align:center; color:#6c757d; font-size:13px; }

/* Modal */
.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:9999; padding:20px; overflow-y:auto; }
.modal { background:#fff; border-radius:12px; width:100%; max-width:520px; display:flex; flex-direction:column; overflow:hidden; margin:auto; box-shadow:0 20px 60px rgba(0,0,0,.3); }
.modal-head { padding:14px 18px; border-bottom:1px solid #dee2e6; display:flex; align-items:center; justify-content:space-between; font-size:14px; font-weight:700; color:#0d3b66; }
.modal-head button { background:none; border:none; cursor:pointer; font-size:16px; color:#6c757d; }
.modal-body { padding:18px; overflow-y:auto; max-height:65vh; }
.modal-foot { padding:14px 18px; border-top:1px solid #dee2e6; display:flex; justify-content:flex-end; gap:10px; }
.btn-cancel { padding:8px 16px; background:#f8f9fa; border:1px solid #dee2e6; border-radius:8px; font-size:13px; cursor:pointer; font-family:inherit; }

/* Modal hero */
.modal-hero { display:flex; align-items:center; gap:14px; padding:14px; background:#f0f7ff; border-radius:10px; margin-bottom:16px; }
.modal-avatar { width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:700; }
.av-student { background:#e9a825; color:#0d3b66; }
.av-faculty { background:#0d3b66; color:#fff; }
.mh-name { font-size:15px; font-weight:700; color:#0d3b66; }
.mh-id   { font-size:11px; color:#adb5bd; font-family:monospace; }
.uc-status { display:flex; align-items:center; gap:5px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:3px 9px; border-radius:99px; }
.st-dot { width:6px; height:6px; border-radius:50%; }
.st-active  { background:#d1fae5; color:#065f46; }
.st-active .st-dot  { background:#10b981; }
.st-inactive { background:#fee2e2; color:#991b1b; }
.st-inactive .st-dot { background:#ef4444; }

/* Detail table */
.detail-table { width:100%; border-collapse:collapse; font-size:13px; }
.detail-table td { padding:9px 10px; border-bottom:1px solid #f2f2f2; vertical-align:top; }
.detail-table tr:last-child td { border-bottom:none; }
.dl { font-size:11px; font-weight:700; color:#6c757d; text-transform:uppercase; letter-spacing:.3px; width:35%; white-space:nowrap; }

/* Role switch */
.role-switch { display:flex; border:1px solid #dee2e6; border-radius:8px; overflow:hidden; }
.rs-btn { flex:1; padding:10px; border:none; background:#fff; font-size:13px; font-weight:600; color:#6c757d; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; font-family:inherit; transition:all .2s; }
.rs-btn.active { background:#0d3b66; color:#fff; }

/* Form */
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.full { grid-column:1/-1; }
.field { display:flex; flex-direction:column; gap:5px; }
.field label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:#6c757d; }
.field input,.field select { padding:9px 11px; border:1px solid #dee2e6; border-radius:7px; font-size:13px; font-family:inherit; outline:none; background:#fff; width:100%; }
.field input:focus,.field select:focus { border-color:#0d3b66; }
.form-error { margin-bottom:12px; padding:10px 12px; background:#fff0f0; border:1px solid #f5c6cb; border-radius:7px; font-size:12px; color:#c0392b; }

/* Toast */
.toast-msg { position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; align-items:center; gap:10px; padding:12px 18px; border-radius:10px; font-size:13px; font-weight:600; box-shadow:0 6px 24px rgba(0,0,0,.15); min-width:240px; }
.toast-msg.success { background:#d1fae5; color:#065f46; border:1px solid #6ee7b7; }
.toast-msg.error   { background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }
.toast-enter-active,.toast-leave-active { transition:opacity .2s,transform .2s; }
.toast-enter-from,.toast-leave-to { opacity:0; transform:translateY(10px); }
</style>
