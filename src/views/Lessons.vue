<template>
  <div>
    <div class="filter-bar">
      <select v-model="filterSubject" class="filter-select">
        <option value="">All Subjects</option>
        <option v-for="s in subjectList" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="filterStatus" class="filter-select">
        <option value="">All Status</option>
        <option>Published</option>
        <option>Draft</option>
      </select>
      <div class="search-wrap">
        <i class="bi bi-search"></i>
        <input v-model="search" type="text" placeholder="Search lessons…" />
      </div>
    </div>

    <div v-if="auth.isFaculty.value" class="info-bar">
      <i class="bi bi-info-circle"></i>
      You are viewing lessons linked to your subjects. Students can only see Published lessons.
    </div>

    <div v-if="loading" class="loading-state"><i class="bi bi-arrow-repeat spin"></i> Loading lessons…</div>
    <template v-else>
      <div v-if="filtered.length === 0" class="panel">
        <div class="empty-state">
          <i class="bi bi-book-x"></i>
          <div>
            <div style="font-weight:600;color:#495057">No lessons found</div>
            <div style="font-size:11px;margin-top:2px">Try adjusting your filters.</div>
          </div>
        </div>
      </div>
      <div v-else class="lessons-grid">
        <div v-for="lesson in filtered" :key="lesson.id" class="lesson-card">
          <div class="lesson-thumb">
            <i :class="lesson.type === 'Lab' ? 'bi bi-cpu' : 'bi bi-journal-text'"></i>
          </div>
          <div class="lesson-body">
            <div class="lesson-meta-row">
              <span class="subj-badge">{{ lesson.subject }}</span>
              <span class="badge" :class="lesson.status === 'Published' ? 'badge-pass' : 'badge-draft'">
                {{ lesson.status }}
              </span>
            </div>
            <div class="lesson-title">{{ lesson.title }}</div>
            <div class="lesson-meta">
              <i class="bi bi-tag"></i> {{ lesson.type }}
              &nbsp;·&nbsp;
              <i class="bi bi-calendar"></i> {{ lesson.date }}
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

const auth          = useAuthStore()
const loading       = ref(true)
const lessons       = ref([])
const filterSubject = ref('')
const filterStatus  = ref('')
const search        = ref('')

async function loadData() {
  const uid  = auth.state.user?.id
  const role = auth.state.role

  let query = supabase
    .from('lessons')
    .select('*')
    .eq('owner_type', role)
    .eq('owner_id', uid)
    .order('date', { ascending: false })

  if (role === 'student') query = query.eq('status', 'Published')

  const { data } = await query
  lessons.value = data || []
  loading.value = false
}

let channel
onMounted(() => {
  loadData()
  channel = supabase
    .channel('lessons-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, loadData)
    .subscribe()
})
onUnmounted(() => { channel && supabase.removeChannel(channel) })

const subjectList = computed(() => [...new Set(lessons.value.map(l => l.subject))].sort())

const filtered = computed(() => {
  return lessons.value.filter(l => {
    if (filterSubject.value && l.subject !== filterSubject.value) return false
    if (filterStatus.value  && l.status  !== filterStatus.value)  return false
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!l.title.toLowerCase().includes(q) && !l.subject.toLowerCase().includes(q)) return false
    }
    return true
  })
})
</script>

<style scoped>
.filter-bar{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.filter-select{padding:7px 10px;border:1px solid #d6e4d8;border-radius:8px;font-size:12px;font-family:inherit;background:#fff;outline:none;}
.search-wrap{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d6e4d8;border-radius:8px;padding:7px 12px;flex:1;min-width:160px;margin-left:auto;}
.search-wrap i{color:#6c757d;font-size:13px;}
.search-wrap input{border:none;outline:none;font-size:13px;font-family:inherit;width:100%;}
.info-bar{display:flex;align-items:center;gap:8px;background:#fff8e1;border:1px solid #ffeaa7;border-radius:8px;padding:10px 14px;font-size:12px;color:#856404;margin-bottom:14px;}
.loading-state{padding:60px;text-align:center;color:#6c757d;font-size:13px;}
.panel{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.empty-state{padding:40px;display:flex;align-items:center;justify-content:center;gap:12px;color:#6c757d;font-size:13px;}
.empty-state i{font-size:28px;color:#d6e4d8;}
.lessons-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
.lesson-card{background:#fff;border:1px solid #d6e4d8;border-radius:10px;overflow:hidden;}
.lesson-thumb{height:72px;background:#f0f4f8;display:flex;align-items:center;justify-content:center;font-size:26px;color:#1a6b2e;border-bottom:2px solid #d4a017;}
.lesson-body{padding:12px;}
.lesson-meta-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.subj-badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;background:#eaf4ec;color:#1a6b2e;}
.badge{display:inline-block;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;}
.badge-pass{background:#f0fff4;color:#198754;}
.badge-draft{background:#fff8e1;color:#b8890e;}
.lesson-title{font-size:12px;font-weight:700;color:#1a6b2e;margin-bottom:5px;line-height:1.4;}
.lesson-meta{font-size:10px;color:#6c757d;display:flex;align-items:center;gap:3px;}
@media(max-width:900px){.lessons-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:600px){.lessons-grid{grid-template-columns:1fr;}}
@keyframes spin{to{transform:rotate(360deg);}}.spin{display:inline-block;animation:spin .7s linear infinite;}
</style>