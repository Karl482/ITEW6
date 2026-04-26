<template>
  <div style="font-family:monospace;padding:32px;max-width:700px;margin:auto;">
    <h2 style="color:#1a6b2e;">🔧 Supabase Connection Debug</h2>

    <div style="background:#f8f8f8;border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:16px;">
      <div><strong>VITE_SUPABASE_URL:</strong>
        <span :style="{color: url ? '#1a6b2e' : 'red'}">
          {{ url || '❌ NOT SET' }}
        </span>
      </div>
      <div style="margin-top:8px;"><strong>VITE_SUPABASE_ANON_KEY:</strong>
        <span :style="{color: key ? '#1a6b2e' : 'red'}">
          {{ key ? '✅ ' + key.substring(0,20) + '…' : '❌ NOT SET' }}
        </span>
      </div>
    </div>

    <button @click="testInsert"
      style="padding:12px 24px;background:#1a6b2e;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-right:10px;">
      Test INSERT (submit fake application)
    </button>
    <button @click="testSelect"
      style="padding:12px 24px;background:#0f3d1c;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">
      Test SELECT (load all applications)
    </button>

    <div v-if="result" style="margin-top:20px;background:#111;color:#0f0;padding:16px;border-radius:8px;white-space:pre-wrap;font-size:13px;overflow-x:auto;">{{ result }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

const url    = import.meta.env.VITE_SUPABASE_URL
const key    = import.meta.env.VITE_SUPABASE_ANON_KEY
const result = ref('')

async function testInsert() {
  result.value = 'Inserting…'
  const code = 'PNC-DEBUG' + Date.now().toString().slice(-4)
  const { data, error } = await supabase.from('applications').insert({
    name:          'Debug Test User',
    email:         'debug@test.com',
    phone:         '09000000000',
    program:       'BS Information Technology',
    status:        'pending',
    tracking_code: code
  }).select()
  if (error) {
    result.value = '❌ INSERT FAILED:\n' + JSON.stringify(error, null, 2)
  } else {
    result.value = '✅ INSERT SUCCESS! Tracking code: ' + code + '\n\n' + JSON.stringify(data, null, 2)
  }
}

async function testSelect() {
  result.value = 'Loading…'
  const { data, error } = await supabase.from('applications').select('*').limit(5)
  if (error) {
    result.value = '❌ SELECT FAILED:\n' + JSON.stringify(error, null, 2)
  } else {
    result.value = '✅ SELECT SUCCESS! Found ' + data.length + ' rows:\n\n' + JSON.stringify(data, null, 2)
  }
}
</script>
