<template>
  <div class="events-wrap">
    <div v-if="loading" class="loading-state">
      <i class="bi bi-arrow-repeat spin"></i> Loading events…
    </div>
    <template v-else>
      <div class="events-layout">

        <!-- Events table -->
        <div class="panel events-panel">
          <div class="panel-head">
            <span class="panel-title">School Events</span>
            <span class="count-badge">{{ events.length }} event{{ events.length !== 1 ? 's' : '' }}</span>
          </div>
          <div v-if="events.length === 0" class="empty-msg">
            <i class="bi bi-calendar-x"></i>
            <span>No events available yet.</span>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th class="ps">Date</th>
                  <th>Event Title</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Audience</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in events" :key="e.id">
                  <td class="ps date-cell">{{ e.date }}</td>
                  <td><strong>{{ e.title }}</strong></td>
                  <td class="muted-cell">{{ e.location }}</td>
                  <td><span class="badge" :class="typeClass(e.type)">{{ e.type }}</span></td>
                  <td><span class="aud-badge" :class="audClass(e)">{{ audLabel(e) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: Calendar + Legend -->
        <div class="right-col">
          <div class="panel mb-panel">
            <div class="panel-head">
              <span class="panel-title">Calendar</span>
              <div class="cal-nav">
                <button @click="prevMonth" class="cal-btn"><i class="bi bi-chevron-left"></i></button>
                <span class="cal-label">{{ monthLabel }}</span>
                <button @click="nextMonth" class="cal-btn"><i class="bi bi-chevron-right"></i></button>
              </div>
            </div>
            <div class="panel-body">
              <div class="cal-grid">
                <div class="cal-dow" v-for="d in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="d">{{ d }}</div>
                <div v-for="n in blanksBefore" :key="'b'+n" class="cal-cell blank"></div>
                <div
                  v-for="day in daysInMonth" :key="day"
                  class="cal-cell"
                  :class="{ today: isToday(day), marked: isMarked(day), selected: selectedDay===day }"
                  @click="selectDay(day)"
                >{{ day }}</div>
              </div>
            </div>
          </div>

          <!-- Events on selected day -->
          <div class="panel mb-panel" v-if="selectedDayEvents.length > 0">
            <div class="panel-head"><span class="panel-title">{{ selectedDayLabel }}</span></div>
            <div v-for="e in selectedDayEvents" :key="e.id" class="day-event-row">
              <span class="badge" :class="typeClass(e.type)">{{ e.type }}</span>
              <span class="day-event-title">{{ e.title }}</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="panel">
            <div class="panel-head"><span class="panel-title">Legend</span></div>
            <div class="panel-body legend-body">
              <div class="leg-row"><div class="leg-dot today-dot"></div><span>Today</span></div>
              <div class="leg-row"><div class="leg-dot marked-dot"></div><span>Has Event</span></div>
              <div class="leg-row"><div class="leg-dot selected-dot"></div><span>Selected</span></div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import { supabase } from '@/lib/supabase.js'

const auth    = useAuthStore()
const loading = ref(true)
const events  = ref([])

const now         = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth= ref(now.getMonth()) // 0-indexed
const selectedDay = ref(null)

let channel
onMounted(async () => {
  await loadEvents()
  channel = supabase
    .channel('events-user-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEvents)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

async function loadEvents() {
  loading.value = true
  const uid  = auth.state.user?.id
  const role = auth.state.role  // 'student' or 'faculty'

  // Load events that are:
  // 1. owner_type = 'all'  (visible to everyone)
  // 2. owner_type = role AND owner_id IS NULL  (visible to all of that role)
  // 3. owner_type = role AND owner_id = uid  (visible only to this specific user)
  const { data } = await supabase
    .from('events')
    .select('*')
    .or(
      `owner_type.eq.all,` +
      `and(owner_type.eq.${role},owner_id.is.null),` +
      `and(owner_type.eq.${role},owner_id.eq.${uid})`
    )
    .order('date')

  events.value  = data || []
  loading.value = false
}

// ── Calendar logic ───────────────────────────────────────────
const monthLabel = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1)
    .toLocaleString('en-US', { month: 'long', year: 'numeric' })
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const blanksBefore = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

function isToday(day) {
  return day === now.getDate() &&
    currentMonth.value === now.getMonth() &&
    currentYear.value  === now.getFullYear()
}

// Parse event dates to see which calendar days are marked
const markedDays = computed(() => {
  const days = new Set()
  events.value.forEach(e => {
    const d = new Date(e.date)
    if (!isNaN(d) && d.getMonth() === currentMonth.value && d.getFullYear() === currentYear.value) {
      days.add(d.getDate())
    }
  })
  return days
})

function isMarked(day) { return markedDays.value.has(day) }

function selectDay(day) {
  selectedDay.value = selectedDay.value === day ? null : day
}

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''
  return new Date(currentYear.value, currentMonth.value, selectedDay.value)
    .toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
})

const selectedDayEvents = computed(() => {
  if (!selectedDay.value) return []
  return events.value.filter(e => {
    const d = new Date(e.date)
    return d.getDate() === selectedDay.value &&
      d.getMonth() === currentMonth.value &&
      d.getFullYear() === currentYear.value
  })
})

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
  selectedDay.value = null
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
  selectedDay.value = null
}

// ── Helpers ──────────────────────────────────────────────────
const typeClass = t => ({
  Academic: 'badge-blue', Sports: 'badge-green',
  Ceremony: 'badge-gold', Training: 'badge-purple', Community: 'badge-grey'
}[t] || 'badge-grey')

const audLabel = e => {
  if (e.owner_type === 'all') return 'Everyone'
  if (!e.owner_id) return `All ${e.owner_type}s`
  return e.owner_id === auth.state.user?.id ? 'You' : e.owner_type
}
const audClass = e => {
  if (e.owner_type === 'all') return 'aud-all'
  if (e.owner_id === auth.state.user?.id) return 'aud-you'
  return 'aud-role'
}
</script>

<style scoped>
.events-wrap{padding:2px;}
.loading-state{padding:60px;text-align:center;color:#6c757d;font-size:14px;}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}

.events-layout{display:flex;gap:14px;align-items:flex-start;}
.events-panel{flex:1;min-width:0;}
.right-col{width:260px;flex-shrink:0;}
.mb-panel{margin-bottom:12px;}

.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.panel-head{padding:11px 14px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.panel-body{padding:12px 14px;}
.count-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#eaf4ec;color:#1a6b2e;}

/* Table */
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:9px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
th.ps{padding-left:16px;}
td{padding:10px 12px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;}
td.ps{padding-left:16px;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.date-cell{white-space:nowrap;color:#1a6b2e;font-weight:600;}
.muted-cell{color:#6c757d;}

/* Badges */
.badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;}
.badge-blue{background:#eaf4ec;color:#1a6b2e;}
.badge-green{background:#f0fff4;color:#198754;}
.badge-gold{background:#fff8e1;color:#b8890e;}
.badge-purple{background:#f5f0ff;color:#6f42c1;}
.badge-grey{background:#f8f9fa;color:#6c757d;}

.aud-badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;}
.aud-all{background:#eaf4ec;color:#1a6b2e;}
.aud-role{background:#f0fff4;color:#198754;}
.aud-you{background:#fff8e1;color:#b8890e;}

/* Calendar */
.cal-nav{display:flex;align-items:center;gap:6px;}
.cal-btn{width:22px;height:22px;border:1px solid #d6e4d8;border-radius:5px;background:#fff;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;color:#6c757d;}
.cal-label{font-size:11px;font-weight:700;color:#1a6b2e;min-width:100px;text-align:center;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;}
.cal-dow{font-size:9px;font-weight:700;color:#6c757d;padding:3px 0;}
.cal-cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:11px;border-radius:5px;cursor:pointer;color:#495057;transition:all .1s;}
.cal-cell:hover{background:#f0f4f8;}
.cal-cell.blank{cursor:default;}
.cal-cell.today{background:#1a6b2e;color:#fff;font-weight:700;}
.cal-cell.marked{background:#fff8e1;color:#b8890e;font-weight:700;border:1px solid rgba(233,168,37,0.3);}
.cal-cell.selected{background:#d4a017;color:#fff;font-weight:700;}
.cal-cell.today.marked{background:#1a6b2e;color:#d4a017;}

/* Day events */
.day-event-row{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #f8f9fa;}
.day-event-row:last-child{border-bottom:none;}
.day-event-title{font-size:12px;color:#212529;font-weight:500;}

/* Legend */
.legend-body{display:flex;flex-direction:column;gap:8px;}
.leg-row{display:flex;align-items:center;gap:8px;font-size:11px;color:#495057;}
.leg-dot{width:12px;height:12px;border-radius:3px;flex-shrink:0;}
.today-dot{background:#1a6b2e;}
.marked-dot{background:#fff8e1;border:1px solid rgba(233,168,37,0.4);}
.selected-dot{background:#d4a017;}

/* Empty */
.empty-msg{padding:28px;display:flex;align-items:center;justify-content:center;gap:10px;color:#6c757d;font-size:13px;}
.empty-msg i{font-size:24px;color:#d6e4d8;}

@media(max-width:768px){.events-layout{flex-direction:column;}.right-col{width:100%;}}
</style>