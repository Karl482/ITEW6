<template>
  <div>
    <div class="page-bar">
      <div class="search-wrap"><i class="bi bi-search"></i><input v-model="search" type="text" placeholder="Search events…" /></div>
      <select v-model="filterType" class="filter-select">
        <option value="">All Types</option>
        <option v-for="t in eventTypes" :key="t">{{ t }}</option>
      </select>
      <button class="btn-primary" @click="openModal()"><i class="bi bi-plus-lg"></i> Add Event</button>
    </div>

    <div class="panel">
      <div v-if="loading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
      <div v-else-if="filtered.length===0" class="empty-state">No events found.</div>
      <div v-else class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Title</th><th>Location</th><th>Type</th><th>Audience</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="e in filtered" :key="e.id">
              <td style="white-space:nowrap">{{ e.date }}</td>
              <td><strong>{{ e.title }}</strong></td>
              <td>{{ e.location }}</td>
              <td><span class="badge" :class="typeClass(e.type)">{{ e.type }}</span></td>
              <td>{{ audienceLabel(e) }}</td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon" @click="openModal(e)"><i class="bi bi-pencil"></i></button>
                  <button class="btn-icon danger" @click="confirmDelete(e)"><i class="bi bi-trash"></i></button>
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
          <span>{{ editing ? 'Edit Event' : 'Add Event' }}</span>
          <button @click="showModal=false"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field full"><label>Event Title *</label><input v-model="form.title" placeholder="CS Department Seminar" /></div>
            <div class="field"><label>Date *</label><CalendarPicker v-model="form.date" placeholder="Select event date" /></div>
            <div class="field"><label>Location *</label><input v-model="form.location" placeholder="AVR Building A" /></div>
            <div class="field">
              <label>Type *</label>
              <select v-model="form.type">
                <option v-for="t in eventTypes" :key="t">{{ t }}</option>
              </select>
            </div>
            <div class="field">
              <label>Audience</label>
              <select v-model="form.owner_type">
                <option value="all">All Users</option>
                <option value="student">Students Only</option>
                <option value="faculty">Faculty Only</option>
              </select>
            </div>
            <div class="field" v-if="form.owner_type !== 'all'">
              <label>Specific ID <span class="optional">(leave blank for all {{ form.owner_type }}s)</span></label>
              <input v-model="form.owner_id" :placeholder="form.owner_type==='student' ? '2021-00142 or leave blank' : 'FAC-2015-004 or leave blank'" />
            </div>
          </div>
          <div v-if="formError" class="form-error">{{ formError }}</div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="showModal=false">Cancel</button>
          <button class="btn-primary" @click="saveEvent" :disabled="saving">
            <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
            <span v-else>{{ editing ? 'Save Changes' : 'Add Event' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget=null">
      <div class="modal confirm-modal">
        <div class="modal-head">
          <span>Delete Event</span>
          <button @click="deleteTarget=null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body">
          <p>Delete event <strong>{{ deleteTarget.title }}</strong>?</p>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="deleteTarget=null">Cancel</button>
          <button class="btn-danger" @click="deleteEvent" :disabled="saving">{{ saving ? 'Deleting…' : 'Yes, Delete' }}</button>
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
const events      = ref([])
const loading     = ref(true)
const saving      = ref(false)
const search      = ref('')
const filterType  = ref('')
const showModal   = ref(false)
const editing     = ref(null)
const deleteTarget = ref(null)
const formError   = ref('')
const eventTypes  = ['Academic','Sports','Ceremony','Training','Community']

const blank = () => ({ title:'', date:'', location:'', type:'Academic', owner_type:'all', owner_id:'' })
const form  = ref(blank())

const filtered = computed(() => {
  let list = events.value
  if (filterType.value) list = list.filter(e => e.type === filterType.value)
  const q = search.value.toLowerCase()
  if (q) list = list.filter(e => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q))
  return list
})

const typeClass = t => ({ Academic:'badge-blue', Sports:'badge-green', Ceremony:'badge-gold', Training:'badge-purple', Community:'badge-grey' }[t]||'badge-grey')
const audienceLabel = e => e.owner_type==='all' ? 'All Users' : e.owner_id ? `${e.owner_type} · ${e.owner_id}` : `All ${e.owner_type}s`

async function load() {
  loading.value = true
  const { data } = await supabase.from('events').select('*').order('date', { ascending: false })
  events.value = data || []
  loading.value = false
}
let channel
onMounted(() => {
  load()
  channel = supabase
    .channel('events-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, load)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

function openModal(e = null) {
  editing.value   = e
  formError.value = ''
  form.value      = e ? { title:e.title, date:e.date, location:e.location, type:e.type, owner_type:e.owner_type, owner_id:e.owner_id||'' } : blank()
  showModal.value = true
}

async function saveEvent() {
  if (!form.value.title || !form.value.date || !form.value.location) { formError.value = 'Title, Date and Location are required.'; return }
  saving.value = true; formError.value = ''
  const payload = {
    title:form.value.title, date:form.value.date, location:form.value.location,
    type:form.value.type, owner_type:form.value.owner_type,
    owner_id: form.value.owner_type==='all' ? null : (form.value.owner_id||null),
    created_by: auth.state.user?.id || null
  }
  let err
  if (editing.value) {
    const res = await supabase.from('events').update({ ...payload, updated_at:new Date() }).eq('id', editing.value.id)
    err = res.error
    if (!err) await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Updated event', targetType:'event', targetName:form.value.title })
  } else {
    const res = await supabase.from('events').insert(payload)
    err = res.error
    if (!err) await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Added event', targetType:'event', targetName:form.value.title })
  }
  saving.value = false
  if (err) { formError.value = err.message; return }
  showModal.value = false
  await load()
}

function confirmDelete(e) { deleteTarget.value = e }

async function deleteEvent() {
  saving.value = true
  await supabase.from('events').delete().eq('id', deleteTarget.value.id)
  await logActivity({ actorType:'admin', actorId:auth.state.user?.id||'admin', actorName:auth.state.user?.name||'Admin', action:'Deleted event', targetType:'event', targetName:deleteTarget.value.title })
  deleteTarget.value = null; saving.value = false
  await load()
}
</script>

<style scoped>
.page-bar{display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;padding:8px 12px;flex:1;min-width:180px;}
.search-wrap i{color:#6c757d;}
.search-wrap input{border:none;outline:none;font-size:13px;font-family:inherit;width:100%;}
.filter-select{padding:8px 12px;border:1px solid #d6e4d8;border-radius:8px;font-size:13px;font-family:inherit;background:#fff;outline:none;}
.btn-primary{padding:9px 16px;background:#1a6b2e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;font-family:inherit;}
.btn-primary:disabled{opacity:.6;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
td{padding:10px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.badge{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:700;}
.badge-blue{background:#eaf4ec;color:#1a6b2e;}
.badge-green{background:#f0fff4;color:#198754;}
.badge-gold{background:#fff8e1;color:#b8890e;}
.badge-purple{background:#f5f0ff;color:#6f42c1;}
.badge-grey{background:#f8f9fa;color:#6c757d;}
.action-btns{display:flex;gap:6px;}
.btn-icon{width:30px;height:30px;border-radius:7px;border:1px solid #d6e4d8;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:#6c757d;}
.btn-icon:hover{background:#eaf4ec;color:#1a6b2e;border-color:#1a6b2e;}
.btn-icon.danger:hover{background:#fff0f0;color:#dc3545;border-color:#dc3545;}
.empty-state{padding:32px;text-align:center;color:#6c757d;font-size:13px;}
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;overflow-y:auto;}
.modal{background:#fff;border-radius:12px;width:100%;max-width:560px;display:flex;flex-direction:column;overflow:hidden;position:relative;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);}
.confirm-modal{max-width:420px;}
.modal-head{padding:14px 18px;border-bottom:1px solid #d6e4d8;display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:700;color:#1a6b2e;flex-shrink:0;}
.modal-head button{background:none;border:none;cursor:pointer;font-size:16px;color:#6c757d;}
.modal-body{padding:18px;overflow-y:auto;max-height:60vh;}
.modal-body p{font-size:13px;color:#495057;line-height:1.6;}
.modal-foot{padding:14px 18px;border-top:1px solid #d6e4d8;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;background:#fff;}
.btn-cancel{padding:8px 16px;background:#f8f9fa;border:1px solid #d6e4d8;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;}
.btn-danger{padding:8px 16px;background:#dc3545;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
.btn-danger:disabled{opacity:.6;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.full{grid-column:1/-1;}
.field{display:flex;flex-direction:column;gap:5px;}
.field label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:#6c757d;}
.optional{font-weight:400;text-transform:none;letter-spacing:0;font-size:9px;}
.field input,.field select{padding:9px 11px;border:1px solid #d6e4d8;border-radius:7px;font-size:13px;font-family:inherit;outline:none;background:#fff;}
.field input:focus,.field select:focus{border-color:#1a6b2e;}
.form-error{margin-top:12px;padding:10px 12px;background:#fff0f0;border:1px solid #f5c6cb;border-radius:7px;font-size:12px;color:#c0392b;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>