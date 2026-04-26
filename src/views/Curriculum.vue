<template>
  <div>
    <div v-if="loading" class="loading-state">
      <i class="bi bi-arrow-repeat spin"></i> Loading…
    </div>
    <template v-else>

      <!-- Stat cards -->
      <div class="stats-grid">
        <div class="stat-card" v-for="c in summaryCards" :key="c.label">
          <div class="stat-icon" :style="{background:c.bg, color:c.color}">
            <i :class="c.icon"></i>
          </div>
          <div>
            <div class="stat-val">{{ c.value }}</div>
            <div class="stat-lbl">{{ c.label }}</div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="panel mb-3">
        <div class="panel-head">
          <span class="panel-title">
            {{ auth.isStudent.value ? 'Curriculum Plan' : 'Curriculum Overview' }}
          </span>
          <span v-if="auth.isStudent.value" class="section-tag">
            <i class="bi bi-people"></i> {{ auth.state.user?.section }}
          </span>
        </div>

        <div v-if="rows.length === 0" class="empty-state">
          <i class="bi bi-clipboard-x"></i>
          <div>
            <div style="font-weight:600;color:#495057">No curriculum data yet</div>
            <div style="font-size:11px;margin-top:2px;color:#6c757d">
              {{ auth.isStudent.value
                ? 'No subjects have been added for your section yet.'
                : 'No curriculum entries assigned yet.' }}
            </div>
          </div>
        </div>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th class="ps">Code</th>
                <th>Description</th>
                <th>Course</th>
                <th>Lec</th>
                <th>Lab</th>
                <th>Units</th>
                <th>Pre-Requisite</th>
                <th>{{ auth.isStudent.value ? 'Status' : 'Assigned To' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in rows" :key="c.id">
                <td class="ps"><strong>{{ c.code }}</strong></td>
                <td>{{ c.description }}</td>
                <td>
                  <span class="course-badge" v-if="c.course">{{ c.course }}</span>
                  <span v-else class="muted">—</span>
                </td>
                <td class="center">{{ c.lec ?? '—' }}</td>
                <td class="center">{{ c.lab ?? '—' }}</td>
                <td class="center">{{ c.units }}</td>
                <td>{{ c.prereq || '—' }}</td>
                <td>
                  <span v-if="auth.isStudent.value" class="badge" :class="statusClass(c.status)">
                    {{ c.status || 'Enrolled' }}
                  </span>
                  <span v-else class="days-badge">{{ c.assigned_to || c.section || '—' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Progress bars (student only) -->
      <div class="panel" v-if="auth.isStudent.value && rows.length > 0">
        <div class="panel-head"><span class="panel-title">Progress by Status</span></div>
        <div class="panel-body">
          <div v-for="item in progressItems" :key="item.label" class="prog-row">
            <div class="prog-label-row">
              <span>{{ item.label }}</span>
              <span>{{ item.count }} subject{{ item.count !== 1 ? 's' : '' }}</span>
            </div>
            <div class="prog-bar">
              <div class="prog-fill" :style="{width: item.pct+'%', background: item.color}"></div>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth.js'
import { supabase } from '@/lib/supabase.js'

const auth    = useAuthStore()
const loading = ref(true)
const rows    = ref([])

onMounted(async () => {
  const user = auth.state.user
  const role = auth.state.role

  if (role === 'student') {
    // ── Student: try curriculum table first ───────────────────
    // curriculum table has entries added by admin with owner_type=student
    const { data: currData } = await supabase
      .from('curriculum')
      .select('*')
      .eq('owner_type', 'student')
      .eq('owner_id', user.id)
      .order('code')

    if (currData && currData.length > 0) {
      rows.value = currData
    } else {
      // ── Fallback: pull from faculty_subjects by section ───────
      // Shows subjects available for the student's section
      const { data: subjData } = await supabase
        .from('faculty_subjects')
        .select('*, faculty:faculty_id(name)')
        .eq('section', user.section)
        .order('code')

      // Map faculty_subjects to curriculum-like shape
      rows.value = (subjData || []).map(s => ({
        id:          s.id,
        code:        s.code,
        description: s.description,
        course:      s.course || '',
        lec:         null,
        lab:         null,
        units:       s.units,
        prereq:      null,
        status:      'Enrolled',
        assigned_to: s.section,
      }))
    }
  } else {
    // ── Faculty: pull from curriculum table ───────────────────
    const { data: currData } = await supabase
      .from('curriculum')
      .select('*')
      .eq('owner_type', 'faculty')
      .eq('owner_id', user.id)
      .order('code')

    if (currData && currData.length > 0) {
      rows.value = currData
    } else {
      // Fallback: faculty_subjects
      const { data: subjData } = await supabase
        .from('faculty_subjects')
        .select('*')
        .eq('faculty_id', user.id)
        .order('code')
      rows.value = (subjData || []).map(s => ({
        id:          s.id,
        code:        s.code,
        description: s.description,
        course:      s.course || '',
        lec:         null,
        lab:         null,
        units:       s.units,
        prereq:      null,
        status:      null,
        assigned_to: s.section,
      }))
    }
  }

  loading.value = false
})

const statusClass = s => ({
  'Completed':     'badge-pass',
  'In Progress':   'badge-prog',
  'Not Yet Taken': 'badge-notyet',
  'Enrolled':      'badge-enroll',
}[s] || 'badge-enroll')

const summaryCards = computed(() => {
  const total = rows.value.length
  if (auth.isStudent.value) {
    const done   = rows.value.filter(c => c.status === 'Completed').length
    const inprog = rows.value.filter(c => c.status === 'In Progress').length
    const pct    = total ? Math.round((done / total) * 100) : 0
    return [
      { label:'Total Subjects', value:total,   icon:'bi bi-journals',        bg:'#eaf4ec', color:'#1a6b2e' },
      { label:'Completed',      value:done,    icon:'bi bi-check2-circle',   bg:'#f0fff4', color:'#198754' },
      { label:'In Progress',    value:inprog,  icon:'bi bi-hourglass-split', bg:'#fff8e1', color:'#b8890e' },
      { label:'Completion',     value:pct+'%', icon:'bi bi-graph-up',        bg:'#f5f0ff', color:'#6f42c1' },
    ]
  }
  const totalUnits = rows.value.reduce((a, b) => a + (b.units || 0), 0)
  return [
    { label:'Assigned Subjects', value:total,      icon:'bi bi-journals', bg:'#eaf4ec', color:'#1a6b2e' },
    { label:'Total Units',       value:totalUnits, icon:'bi bi-stack',    bg:'#f0fff4', color:'#198754' },
  ]
})

const progressItems = computed(() => {
  const total = rows.value.length || 1
  return [
    { label:'Completed',     color:'#198754', count: rows.value.filter(c => c.status === 'Completed').length },
    { label:'In Progress',   color:'#d4a017', count: rows.value.filter(c => c.status === 'In Progress').length },
    { label:'Enrolled',      color:'#1a6b2e', count: rows.value.filter(c => c.status === 'Enrolled').length },
    { label:'Not Yet Taken', color:'#d6e4d8', count: rows.value.filter(c => c.status === 'Not Yet Taken').length },
  ].filter(s => s.count > 0).map(s => ({ ...s, pct: Math.round((s.count / total) * 100) }))
})
</script>

<style scoped>
.loading-state{padding:60px;text-align:center;color:#6c757d;font-size:13px;}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;}
.stat-card{background:#fff;border:1px solid #d6e4d8;border-radius:10px;padding:16px;display:flex;align-items:flex-start;gap:12px;}
.stat-icon{width:38px;height:38px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.stat-val{font-size:22px;font-weight:700;color:#1a6b2e;line-height:1;}
.stat-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6c757d;margin-top:3px;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;margin-bottom:14px;}
.panel-head{padding:12px 16px;border-bottom:1px solid #f2f2f2;display:flex;align-items:center;justify-content:space-between;}
.panel-title{font-size:13px;font-weight:700;color:#1a6b2e;}
.section-tag{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:#eaf4ec;border-radius:20px;font-size:11px;font-weight:600;color:#1a6b2e;}
.panel-body{padding:14px 16px;}
.table-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;}
th{padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:.5px;font-weight:700;color:#6c757d;border-bottom:2px solid #d6e4d8;background:#f8f9fa;text-align:left;white-space:nowrap;}
th.ps{padding-left:18px;}
td{padding:10px 14px;font-size:12px;border-bottom:1px solid #f2f2f2;color:#495057;vertical-align:middle;}
td.ps{padding-left:18px;}
td.center{text-align:center;}
tr:hover td{background:#f8f9fa;}
tr:last-child td{border-bottom:none;}
.badge{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:700;}
.badge-pass  {background:#f0fff4;color:#198754;}
.badge-prog  {background:#eaf4ec;color:#1a6b2e;}
.badge-enroll{background:#f0fff4;color:#0d6efd;}
.badge-notyet{background:#f8f9fa;color:#6c757d;}
.course-badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:600;background:#eaf4ec;color:#1a6b2e;}
.days-badge{display:inline-block;padding:2px 9px;border-radius:5px;font-size:10px;font-weight:600;background:#eaf4ec;color:#1a6b2e;}
.muted{color:#adb5bd;}
.empty-state{padding:40px;display:flex;align-items:center;justify-content:center;gap:14px;color:#6c757d;font-size:13px;}
.empty-state i{font-size:28px;color:#d6e4d8;}
.prog-row{margin-bottom:14px;}
.prog-label-row{display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:#212529;margin-bottom:5px;}
.prog-bar{height:6px;background:#f0f0f0;border-radius:99px;overflow:hidden;}
.prog-fill{height:100%;border-radius:99px;transition:width .4s;}
@media(max-width:768px){.stats-grid{grid-template-columns:repeat(2,1fr);}}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>