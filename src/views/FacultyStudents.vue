<template>
    <div>
      <!-- Search bar -->
      <div class="page-bar">
        <div class="search-wrap">
          <i class="bi bi-search"></i>
          <input v-model="search" placeholder="Search students by name, ID, or program…" />
          <button v-if="search" class="clear-x" @click="search = ''">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
  
      <!-- Table -->
      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">Students</span>
          <span class="count-badge">{{ displayed.length }}</span>
        </div>
  
        <div v-if="loading" class="empty-state">
          <i class="bi bi-arrow-repeat spin"></i> Loading…
        </div>
        <div v-else-if="displayed.length === 0" class="empty-state">
          No students found.
        </div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Year / Section</th>
                <th>Adviser</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in displayed" :key="s.id">
                <td><strong>{{ s.id }}</strong></td>
                <td>
                  <div class="name-cell">
                    <div class="avatar">{{ s.initials }}</div>
                    <div>
                      <div class="sname">{{ s.name }}</div>
                      <div class="semail">{{ s.email }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ s.program }}</td>
                <td>{{ s.year_level }} · {{ s.section }}</td>
                <td>{{ s.faculty?.name || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { supabase } from '@/lib/supabase.js'
  
  const students = ref([])
  const loading  = ref(true)
  const search   = ref('')
  
  const displayed = computed(() => {
    const q = search.value.toLowerCase().trim()
    return students.value.filter(s =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.program || '').toLowerCase().includes(q)
    )
  })
  
  onMounted(async () => {
    const { data } = await supabase
      .from('students')
      .select('*, faculty:adviser_id(name)')
      .order('name')
    students.value = data || []
    loading.value  = false
  })
  </script>
  
  <style scoped>
  .page-bar { display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .search-wrap { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #dee2e6; border-radius:8px; padding:7px 12px; flex:1; }
  .search-wrap i { color:#6c757d; font-size:13px; }
  .search-wrap input { border:none; outline:none; font-size:13px; font-family:inherit; width:100%; }
  .clear-x { background:none; border:none; cursor:pointer; color:#6c757d; font-size:13px; padding:0; }
  .panel { background:#fff; border:1px solid #dee2e6; border-radius:10px; overflow:hidden; }
  .panel-head { padding:11px 16px; border-bottom:1px solid #f2f2f2; display:flex; align-items:center; justify-content:space-between; }
  .panel-title { font-size:13px; font-weight:700; color:#0d3b66; }
  .count-badge { font-size:10px; font-weight:700; padding:2px 9px; border-radius:20px; background:#e8f4fd; color:#0d3b66; }
  .empty-state { padding:30px 16px; text-align:center; font-size:13px; color:#6c757d; }
  .table-wrap { overflow-x:auto; }
  table { width:100%; border-collapse:collapse; }
  th { padding:9px 13px; font-size:10px; text-transform:uppercase; letter-spacing:.5px; font-weight:700; color:#6c757d; border-bottom:2px solid #dee2e6; background:#f8f9fa; text-align:left; }
  td { padding:9px 13px; font-size:12px; border-bottom:1px solid #f2f2f2; color:#495057; vertical-align:middle; }
  tr:hover td { background:#f8f9fa; }
  tr:last-child td { border-bottom:none; }
  .name-cell { display:flex; align-items:center; gap:9px; }
  .avatar { width:30px; height:30px; border-radius:8px; background:#e9a825; color:#0d3b66; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
  .sname { font-size:12px; font-weight:600; color:#0d3b66; }
  .semail { font-size:11px; color:#6c757d; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .spin { display:inline-block; animation:spin .7s linear infinite; }
  </style>