<template>
  <div>
    <div class="page-bar">
      <div class="search-wrap"><i class="bi bi-search"></i><input v-model="search" type="text" placeholder="Search logs…" /></div>
      <select v-model="filterActor" class="filter-select">
        <option value="">All Actors</option>
        <option value="admin">Admin</option>
        <option value="student">Student</option>
        <option value="faculty">Faculty</option>
      </select>
      <select v-model="filterTarget" class="filter-select">
        <option value="">All Types</option>
        <option value="student">Student</option>
        <option value="faculty">Faculty</option>
        <option value="event">Event</option>
        <option value="subject">Subject</option>
      </select>
      <button class="btn-outline" @click="load"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
    </div>

    <!-- Stats row -->
    <div class="mini-stats">
      <div class="mini-stat"><i class="bi bi-activity"></i><strong>{{ logs.length }}</strong> total logs</div>
      <div class="mini-stat"><i class="bi bi-person-plus"></i><strong>{{ countAction('Created') }}</strong> created</div>
      <div class="mini-stat"><i class="bi bi-pencil"></i><strong>{{ countAction('Updated') }}</strong> updated</div>
      <div class="mini-stat"><i class="bi bi-trash"></i><strong>{{ countAction('Deleted') }}</strong> deleted</div>
    </div>

    <div class="panel">
      <div v-if="loading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
      <div v-else-if="filtered.length===0" class="empty-state">No activity logs found.</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filtered" :key="log.id">
              <td style="white-space:nowrap;color:#6c757d">{{ formatTime(log.created_at) }}</td>
              <td>
                <div class="actor-cell">
                  <div class="actor-avatar" :class="avatarClass(log.actor_type)">{{ log.actor_name?.charAt(0) }}</div>
                  <div>
                    <div class="actor-name">{{ log.actor_name }}</div>
                    <div class="actor-type">{{ log.actor_type }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="action-badge" :class="actionClass(log.action)">{{ log.action }}</span>
              </td>
              <td>
                <div v-if="log.target_name" class="target-name">{{ log.target_name }}</div>
                <div v-if="log.target_id" class="target-id">{{ log.target_id }}</div>
                <span v-if="!log.target_name && !log.target_id" style="color:#d6e4d8">—</span>
              </td>
              <td>
                <span v-if="log.target_type" class="type-badge" :class="typeClass(log.target_type)">{{ log.target_type }}</span>
                <span v-else style="color:#d6e4d8">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page<=1" @click="page--" class="pg-btn"><i class="bi bi-chevron-left"></i></button>
        <span class="pg-info">Page {{ page }} / {{ totalPages }}</span>
        <button :disabled="page>=totalPages" @click="page++" class="pg-btn"><i class="bi bi-chevron-right"></i></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase.js'

const logs        = ref([])
const loading     = ref(true)
const search      = ref('')
const filterActor = ref('')
const filterTarget= ref('')
const page        = ref(1)
const pageSize    = 20

const filtered = computed(() => {
  let list = logs.value
  if (filterActor.value)  list = list.filter(l => l.actor_type === filterActor.value)
  if (filterTarget.value) list = list.filter(l => l.target_type === filterTarget.value)
  const q = search.value.toLowerCase()
  if (q) list = list.filter(l => l.actor_name?.toLowerCase().includes(q) || l.action?.toLowerCase().includes(q) || l.target_name?.toLowerCase().includes(q))
  return list
})

const totalPages  = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paginated   = computed(() => filtered.value.slice((page.value-1)*pageSize, page.value*pageSize))

const countAction = (kw) => logs.value.filter(l => l.action?.includes(kw)).length

async function load() {
  loading.value = true; page.value = 1
  const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500)
  logs.value = data || []
  loading.value = false
}
let channel
onMounted(() => {
  load()
  channel = supabase
    .channel('activitylog-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, load)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-PH', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

const avatarClass  = t => ({ admin:'av-admin', student:'av-student', faculty:'av-faculty' }[t] || 'av-admin')
const actionClass  = a => {
  if (!a) return ''
  if (a.includes('Created') || a.includes('Added')) return 'ac-create'
  if (a.includes('Updated')) return 'ac-update'
  if (a.includes('Deleted')) return 'ac-delete'
  return 'ac-default'
}
const typeClass = t => ({ student:'type-blue', faculty:'type-gold', event:'type-red', subject:'type-green' }[t] || 'type-grey')
</script>

<style scoped>
.page-bar{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;padding:8px 12px;flex:1;min-width:180px;}
.search-wrap i{color:#6c757d;}
.search-wrap input{border:none;outline:none;font-size:13px;font-family:inherit;width:100%;}
.filter-select{padding:8px 10px;border:1px solid #d6e4d8;border-radius:8px;font-size:12px;font-family:inherit;background:#fff;outline:none;}
.btn-outline{padding:8px 14px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;color:#6c757d;}
.btn-outline:hover{background:#f8f9fa;}

.mini-stats{display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
.mini-stat{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;font-size:12px;color:#6c757d;}
.mini-stat strong{color:#1a6b2e;margin:0 2px;}
.mini-stat i{font-size:14px;}

.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
td{padding:10px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}

.actor-cell{display:flex;align-items:center;gap:8px;}
.actor-avatar{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
.av-admin{background:#eaf4ec;color:#1a6b2e;}
.av-student{background:#f0fff4;color:#198754;}
.av-faculty{background:#fff8e1;color:#b8890e;}
.actor-name{font-weight:600;color:#212529;font-size:12px;}
.actor-type{font-size:9px;color:#6c757d;text-transform:uppercase;letter-spacing:.3px;}

.action-badge{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:700;}
.ac-create{background:#f0fff4;color:#198754;}
.ac-update{background:#eaf4ec;color:#1a6b2e;}
.ac-delete{background:#fff0f0;color:#dc3545;}
.ac-default{background:#f8f9fa;color:#6c757d;}

.target-name{font-weight:600;color:#212529;font-size:12px;}
.target-id{font-size:10px;color:#6c757d;}

.type-badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;}
.type-blue{background:#eaf4ec;color:#1a6b2e;}
.type-gold{background:#fff8e1;color:#b8890e;}
.type-red{background:#fff0f0;color:#dc3545;}
.type-green{background:#f0fff4;color:#198754;}
.type-grey{background:#f8f9fa;color:#6c757d;}

.pagination{display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid #f2f2f2;justify-content:flex-end;}
.pg-btn{width:30px;height:30px;border:1px solid #d6e4d8;border-radius:7px;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;}
.pg-btn:disabled{opacity:.4;cursor:not-allowed;}
.pg-info{font-size:12px;color:#6c757d;}

.empty-state{padding:32px;text-align:center;color:#6c757d;font-size:13px;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>