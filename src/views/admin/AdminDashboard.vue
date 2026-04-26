<template>
  <div>
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:#eaf4ec;color:#1a6b2e"><i class="bi bi-people-fill"></i></div>
        <div><div class="stat-val">{{ counts.students }}</div><div class="stat-lbl">Total Students</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fff8e1;color:#d4a017"><i class="bi bi-person-workspace"></i></div>
        <div><div class="stat-val">{{ counts.faculty }}</div><div class="stat-lbl">Total Faculty</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#f0fff4;color:#198754"><i class="bi bi-journals"></i></div>
        <div><div class="stat-val">{{ counts.subjects }}</div><div class="stat-lbl">Total Subjects</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fff0f0;color:#dc3545"><i class="bi bi-calendar-event-fill"></i></div>
        <div><div class="stat-val">{{ counts.events }}</div><div class="stat-lbl">Total Events</div></div>
      </div>
    </div>

    <div class="row-panels">
      <!-- Recent Activity -->
      <div class="panel flex-2">
        <div class="panel-head"><span class="panel-title">Recent Activity</span><router-link to="/admin/activity" class="panel-link">View All</router-link></div>
        <div v-if="logsLoading" class="empty-state"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>
        <div v-else-if="recentLogs.length === 0" class="empty-state">No activity yet.</div>
        <div v-else>
          <div v-for="log in recentLogs" :key="log.id" class="log-row">
            <div class="log-avatar">{{ log.actor_name?.charAt(0) }}</div>
            <div class="log-body">
              <div class="log-action"><strong>{{ log.actor_name }}</strong> {{ log.action }}<span v-if="log.target_name"> — <em>{{ log.target_name }}</em></span></div>
              <div class="log-time">{{ formatTime(log.created_at) }}</div>
            </div>
            <div class="log-badge" :class="badgeClass(log.target_type)">{{ log.target_type || 'system' }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="panel flex-1">
        <div class="panel-head"><span class="panel-title">Quick Actions</span></div>
        <div class="quick-links">
          <router-link to="/admin/students" class="quick-btn"><i class="bi bi-person-plus-fill"></i><span>Add Student</span></router-link>
          <router-link to="/admin/faculty"  class="quick-btn"><i class="bi bi-person-badge-fill"></i><span>Add Faculty</span></router-link>
          <router-link to="/admin/subjects" class="quick-btn"><i class="bi bi-journal-plus"></i><span>Add Subject</span></router-link>
          <router-link to="/admin/events"   class="quick-btn"><i class="bi bi-calendar-plus-fill"></i><span>Add Event</span></router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase.js'

const counts = ref({ students: 0, faculty: 0, subjects: 0, events: 0 })
const recentLogs = ref([])
const logsLoading = ref(true)

async function loadData() {
  const [s, f, sub, e, logs] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('faculty').select('id', { count: 'exact', head: true }),
    supabase.from('faculty_subjects').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
  ])
  counts.value.students = s.count || 0
  counts.value.faculty  = f.count || 0
  counts.value.subjects = sub.count || 0
  counts.value.events   = e.count || 0
  recentLogs.value = logs.data || []
  logsLoading.value = false
}

let channel
onMounted(() => {
  loadData()
  channel = supabase
    .channel('dashboard-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty_subjects' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadData)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, loadData)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
function badgeClass(type) {
  const map = { student:'badge-blue', faculty:'badge-gold', event:'badge-red', subject:'badge-green' }
  return map[type] || 'badge-grey'
}
</script>

<style scoped>
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px;}
.stat-card{background:#fff;border:1px solid #d6e4d8;border-radius:10px;padding:16px;display:flex;align-items:flex-start;gap:12px;}
.stat-icon{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.stat-val{font-size:24px;font-weight:700;color:#1a6b2e;line-height:1;}
.stat-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6c757d;margin-top:3px;}
.row-panels{display:flex;gap:16px;}
.flex-2{flex:2;}
.flex-1{flex:1;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.panel-head{padding:12px 16px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.panel-link{font-size:11px;font-weight:700;color:#1a6b2e;text-decoration:none;}
.log-row{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #f8f9fa;}
.log-row:last-child{border-bottom:none;}
.log-avatar{width:30px;height:30px;border-radius:8px;background:#eaf4ec;color:#1a6b2e;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
.log-body{flex:1;min-width:0;}
.log-action{font-size:12px;color:#212529;line-height:1.4;}
.log-time{font-size:10px;color:#6c757d;margin-top:2px;}
.log-badge{font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.4px;flex-shrink:0;}
.badge-blue{background:#eaf4ec;color:#1a6b2e;}
.badge-gold{background:#fff8e1;color:#b8890e;}
.badge-red{background:#fff0f0;color:#dc3545;}
.badge-green{background:#f0fff4;color:#198754;}
.badge-grey{background:#f8f9fa;color:#6c757d;}
.quick-links{padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.quick-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px 8px;border-radius:9px;background:#f8f9fa;border:1px solid #d6e4d8;text-decoration:none;color:#1a6b2e;font-size:11px;font-weight:600;transition:all .15s;}
.quick-btn i{font-size:20px;color:#1a6b2e;}
.quick-btn:hover{background:#eaf4ec;border-color:#1a6b2e;}
.empty-state{padding:24px;text-align:center;color:#6c757d;font-size:12px;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
@media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr);}.row-panels{flex-direction:column;}}
</style>