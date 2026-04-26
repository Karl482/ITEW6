<template>
  <div class="upload-page">

    <!-- Step 1: Download -->
    <div class="step-card">
      <div class="step-num">1</div>
      <div class="step-body">
        <div class="step-title">Download Applicant List</div>
        <div class="step-desc">
          Downloads an Excel file pre-filled with all applicants in the
          <strong>document_submission</strong> stage. The Registrar only needs to mark
          each document as <strong>Complete</strong> or <strong>Incomplete</strong>.
        </div>
        <button class="btn-download" @click="downloadExcel" :disabled="downloading">
          <i v-if="downloading" class="bi bi-arrow-repeat spin"></i>
          <i v-else class="bi bi-file-earmark-excel-fill"></i>
          {{ downloading ? 'Generating…' : 'Download Applicant List (.xlsx)' }}
        </button>
        <div v-if="downloadCount !== null" class="dl-note">
          <i class="bi bi-check-circle-fill"></i>
          {{ downloadCount }} applicant(s) exported. Give this file to the Registrar.
        </div>
        <div v-if="downloadCount === 0" class="dl-empty">
          No applicants are currently in the document submission stage.
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="divider"><span>After Registrar fills it in</span></div>

    <!-- Step 2: Upload -->
    <div class="step-card">
      <div class="step-num">2</div>
      <div class="step-body">
        <div class="step-title">Upload Filled Excel</div>
        <div class="step-desc">
          Upload the Excel file the Registrar has filled in. The system will automatically
          update each applicant's status based on their requirements.
        </div>

        <div class="upload-zone" :class="{ dragging }"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop">
          <div v-if="!parsed">
            <i class="bi bi-upload"></i>
            <div>Drop the filled Excel here, or <button class="inline-btn" @click="$refs.fi.click()">browse</button></div>
            <input ref="fi" type="file" accept=".xlsx" style="display:none" @change="e => handleFile(e.target.files[0])" />
          </div>
          <div v-else class="parsed-info">
            <i class="bi bi-file-earmark-excel-fill"></i>
            <div>
              <div class="pi-name">{{ fileName }}</div>
              <div class="pi-pills">
                <span class="pill green">{{ rows.filter(r=>r._req==='Complete').length }} Complete</span>
                <span class="pill red">{{ rows.filter(r=>r._req==='Incomplete').length }} Incomplete</span>
                <span v-if="parseErrors.length" class="pill grey">{{ parseErrors.length }} Skipped</span>
              </div>
            </div>
            <button class="btn-x" @click="reset"><i class="bi bi-x-lg"></i></button>
          </div>
        </div>

        <!-- Parse errors -->
        <div v-if="parseErrors.length" class="err-list">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>
            <strong>{{ parseErrors.length }} row(s) skipped:</strong>
            <ul>
              <li v-for="(e,i) in parseErrors.slice(0,5)" :key="i">Row {{ e.row }}: {{ e.msg }}</li>
              <li v-if="parseErrors.length > 5">…and {{ parseErrors.length - 5 }} more</li>
            </ul>
          </div>
        </div>

        <!-- Preview table -->
        <div v-if="parsed && rows.length" class="preview-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tracking Code</th>
                <th>Name</th>
                <th>Program</th>
                <th>PSA</th>
                <th>Report Card</th>
                <th>Good Moral</th>
                <th>2x2 Photo</th>
                <th>Diploma</th>
                <th>Requirements</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows" :key="i" :class="row._req === 'Complete' ? 'tr-ok' : 'tr-inc'">
                <td class="td-n">{{ i+1 }}</td>
                <td><code>{{ row['Tracking Code'] }}</code></td>
                <td>{{ row['Full Name'] }}</td>
                <td class="td-sm">{{ row['Program'] }}</td>
                <td class="td-c"><span class="dp" :class="dc(row['PSA Birth Cert'])">{{ row['PSA Birth Cert'] }}</span></td>
                <td class="td-c"><span class="dp" :class="dc(row['Report Card'])">{{ row['Report Card'] }}</span></td>
                <td class="td-c"><span class="dp" :class="dc(row['Good Moral'])">{{ row['Good Moral'] }}</span></td>
                <td class="td-c"><span class="dp" :class="dc(row['2x2 Photo'])">{{ row['2x2 Photo'] }}</span></td>
                <td class="td-c"><span class="dp" :class="dc(row['Diploma'])">{{ row['Diploma'] }}</span></td>
                <td class="td-c"><span class="req-badge" :class="row._req === 'Complete' ? 'req-ok' : 'req-inc'">
                  {{ row._req }}
                </span></td>
              </tr>
            </tbody>
          </table>

          <div class="upload-actions">
            <div class="ua-info">
              <i class="bi bi-info-circle"></i>
              <span>
                <b>{{ rows.filter(r=>r._req==='Complete').length }}</b> applicants will move to
                <em>Exam Stage</em>. &nbsp;
                <b>{{ rows.filter(r=>r._req==='Incomplete').length }}</b> will stay in
                <em>Submit Docs</em> with a note.
              </span>
            </div>
            <button class="btn-save" @click="saveAll" :disabled="saving">
              <i v-if="saving" class="bi bi-arrow-repeat spin"></i>
              <i v-else class="bi bi-check2-circle"></i>
              {{ saving ? `Saving… (${saveDone}/${rows.length})` : `Apply to ${rows.length} Applicants` }}
            </button>
          </div>
        </div>

        <!-- Result -->
        <div v-if="saveResult" class="save-result" :class="saveResult.errors ? 'sr-warn' : 'sr-ok'">
          <i :class="saveResult.errors ? 'bi bi-exclamation-circle-fill' : 'bi bi-check-circle-fill'"></i>
          <div>
            <div class="sr-title">{{ saveResult.errors ? 'Done with issues' : 'All done!' }}</div>
            <div class="sr-body">
              ✅ {{ saveResult.updated }} updated &nbsp;
              <span v-if="saveResult.notFound">⚠️ {{ saveResult.notFound }} tracking codes not found &nbsp;</span>
              <span v-if="saveResult.errors">❌ {{ saveResult.errors }} errors</span>
            </div>
          </div>
          <button class="btn-x" @click="saveResult = null"><i class="bi bi-x-lg"></i></button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase.js'

const downloading  = ref(false)
const downloadCount = ref(null)
const dragging     = ref(false)
const fileName     = ref('')
const parsed       = ref(false)
const rows         = ref([])
const parseErrors  = ref([])
const saving       = ref(false)
const saveDone     = ref(0)
const saveResult   = ref(null)

const DOCS = ['PSA Birth Cert', 'Report Card', 'Good Moral', '2x2 Photo', 'Diploma']

// ── DOWNLOAD: fetch applicants from Supabase and build Excel ──
async function downloadExcel() {
  downloading.value = true
  downloadCount.value = null

  const { data } = await supabase
    .from('applications')
    .select('tracking_code, name, email, phone, program, status')
    .eq('status', 'document_submission')
    .order('applied_at', { ascending: true })

  downloadCount.value = (data || []).length

  if (!data || data.length === 0) { downloading.value = false; return }

  // Load SheetJS
  if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
  const XLSX = window.XLSX
  const wb   = XLSX.utils.book_new()

  // ── Build worksheet ──
  const headers = [
    'Tracking Code', 'Full Name', 'Email', 'Phone', 'Program',
    'PSA Birth Cert', 'Report Card', 'Good Moral', '2x2 Photo', 'Diploma',
    'Requirements'
  ]

  const wsData = [
    // Title rows
    ['PAMANTASAN NG CABUYAO — Registrar Document Checklist'],
    [`Generated: ${new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })} | Fill in columns F–J for each student then upload back.`],
    [],
    headers,
    ...data.map(a => [
      a.tracking_code,
      a.name,
      a.email   || '',
      a.phone   || '',
      a.program || '',
      'No', 'No', 'No', 'No', 'No',  // default all docs to No
      'Incomplete'                     // Requirements column
    ])
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws['!cols'] = [
    { wch: 16 }, // Tracking Code
    { wch: 28 }, // Full Name
    { wch: 28 }, // Email
    { wch: 14 }, // Phone
    { wch: 26 }, // Program
    { wch: 14 }, // PSA
    { wch: 14 }, // Report Card
    { wch: 14 }, // Good Moral
    { wch: 12 }, // 2x2 Photo
    { wch: 12 }, // Diploma
    { wch: 16 }, // Requirements
  ]

  // Freeze panes correctly (freeze first 4 rows = header area)
  ws['!freeze'] = { xSplit: 0, ySplit: 4, topLeftCell: 'A5', activePane: 'bottomLeft' }

  XLSX.utils.book_append_sheet(wb, ws, 'Document Checklist')

  // Instructions sheet
  const wsInst = XLSX.utils.aoa_to_sheet([
    ['INSTRUCTIONS FOR THE REGISTRAR'],
    [],
    ['Column', 'What to do'],
    ['A  Tracking Code',  'DO NOT EDIT — used to match the record in the system'],
    ['B  Full Name',      'DO NOT EDIT'],
    ['C  Email',          'DO NOT EDIT'],
    ['D  Phone',          'DO NOT EDIT'],
    ['E  Program',        'DO NOT EDIT'],
    ['F  PSA Birth Cert', 'Change to "Yes" if the student submitted it, keep "No" if not'],
    ['G  Report Card',    'Change to "Yes" if submitted (Form 138)'],
    ['H  Good Moral',     'Change to "Yes" if submitted'],
    ['I  2x2 Photo',      'Change to "Yes" if submitted (white background)'],
    ['J  Diploma',        'Change to "Yes" if submitted (or Certificate of Completion)'],
    ['K  Requirements',   'Change to "Complete" ONLY if ALL 5 documents are Yes. Otherwise leave as "Incomplete".'],
    [],
    ['DO NOT rename the sheet or change column headers.'],
    ['DO NOT add or remove rows.'],
    ['Save as .xlsx before uploading back to the system.'],
  ])
  wsInst['!cols'] = [{ wch: 20 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions')

  // Write with bookType explicitly set to avoid corruption
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob  = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href      = url
  a.download  = 'PNC_Document_Checklist.xlsx'
  a.click()
  URL.revokeObjectURL(url)

  downloading.value = false
}

// ── UPLOAD: parse the filled Excel ──
function onDrop(e) { dragging.value = false; handleFile(e.dataTransfer.files[0]) }

async function handleFile(file) {
  if (!file) return
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    alert('Please upload an .xlsx file.')
    return
  }
  fileName.value = file.name
  rows.value = []; parseErrors.value = []; saveResult.value = null

  if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
  const XLSX = window.XLSX

  try {
    const buf = await file.arrayBuffer()
    const wb  = XLSX.read(buf, { type: 'array' })

    // Look for the checklist sheet
    const sheetName = wb.SheetNames.find(n =>
      n.toLowerCase().includes('checklist') || n.toLowerCase().includes('document')
    ) || wb.SheetNames[0]

    const ws      = wb.Sheets[sheetName]
    const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    // Find header row containing 'Tracking Code'
    let hdrIdx = -1
    for (let i = 0; i < allRows.length; i++) {
      if (allRows[i].some(c => String(c).trim().toLowerCase() === 'tracking code')) {
        hdrIdx = i; break
      }
    }
    if (hdrIdx === -1) {
      alert('Cannot find the header row. Make sure you used the official PNC template and did not rename the columns.')
      return
    }

    const headers = allRows[hdrIdx].map(h => String(h).trim())
    const parsed_ = []

    for (let r = hdrIdx + 1; r < allRows.length; r++) {
      const row = allRows[r]
      if (row.every(c => c === '' || c === null || c === undefined)) continue

      const obj = {}
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? '').trim() })

      const code = obj['Tracking Code']
      const name = obj['Full Name']
      if (!code || code === '—' || code === '') {
        parseErrors.value.push({ row: r + 1, msg: `Missing Tracking Code (${name || '?'})` })
        continue
      }

      // Normalize Yes/No values — accept Yes, YES, yes, Y, y, Complete, etc.
      const isYes = v => ['yes', 'y', 'complete', '1', 'true'].includes(String(v).trim().toLowerCase())

      // Compute completion from individual doc columns
      const allDone = DOCS.every(d => isYes(obj[d]))

      // Also check the Requirements column as fallback
      const reqCol = obj['Requirements'] || ''
      obj._req = (allDone || reqCol.toLowerCase() === 'complete') ? 'Complete' : 'Incomplete'

      // Normalize each doc column display value
      DOCS.forEach(d => { obj[d] = isYes(obj[d]) ? 'Yes' : 'No' })

      parsed_.push(obj)
    }

    rows.value   = parsed_
    parsed.value = true
  } catch (err) {
    alert(`Failed to read the file: ${err.message}. Make sure it is a valid .xlsx file and was not corrupted.`)
    reset()
  }
}

// ── SAVE: update applications in Supabase ──
async function saveAll() {
  saving.value = true; saveDone.value = 0; saveResult.value = null
  let updated = 0, notFound = 0, errors = 0

  for (const row of rows.value) {
    const code       = row['Tracking Code'].toUpperCase().trim()
    const isComplete = row._req === 'Complete'

    // Build a readable doc note
    const docSummary = DOCS.map(d => `${d}: ${row[d] || 'No'}`).join(' | ')
    const note = `[Registrar] ${docSummary}`

    const { data: app } = await supabase
      .from('applications').select('id, status').eq('tracking_code', code).single()

    if (!app) { notFound++; saveDone.value++; continue }

    // Complete → move to exam stage. Incomplete → stay in document_submission with a note.
    const newStatus = isComplete ? 'exam' : 'document_submission'
    const updates = {
      status:      newStatus,
      admin_notes: note,
      updated_at:  new Date().toISOString(),
    }
    if (isComplete) updates.docs_submitted_at = new Date().toISOString()

    const { error } = await supabase.from('applications').update(updates).eq('id', app.id)
    if (error) errors++
    else updated++
    saveDone.value++
  }

  saving.value    = false
  saveResult.value = { updated, notFound, errors }
  if (!errors && !notFound) { parsed.value = false; rows.value = [] }
}

function reset() {
  parsed.value = false; rows.value = []; parseErrors.value = []
  fileName.value = ''; saveResult.value = null
}

function dc(val) {
  if (!val) return 'dp-no'
  return val.toLowerCase() === 'yes' ? 'dp-yes' : 'dp-no'
}

function loadScript(src) {
  return new Promise(res => {
    const s = document.createElement('script'); s.src = src; s.onload = res
    document.head.appendChild(s)
  })
}
</script>

<style scoped>
.upload-page { display:flex; flex-direction:column; gap:20px; }

/* Step cards */
.step-card { background:#fff; border:1px solid #d6e4d8; border-radius:14px; padding:24px; display:flex; gap:18px; align-items:flex-start; }
.step-num { width:36px; height:36px; border-radius:50%; background:#1a6b2e; color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; flex-shrink:0; }
.step-body { flex:1; display:flex; flex-direction:column; gap:12px; }
.step-title { font-size:16px; font-weight:700; color:#0f3d1c; }
.step-desc  { font-size:13px; color:#607060; line-height:1.7; }

.btn-download { display:inline-flex; align-items:center; gap:8px; padding:11px 20px; background:#1a6b2e; color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .2s; }
.btn-download:hover:not(:disabled) { background:#134f22; }
.btn-download:disabled { opacity:.6; cursor:not-allowed; }
.dl-note  { font-size:12px; color:#1a6b2e; display:flex; align-items:center; gap:7px; font-weight:600; }
.dl-empty { font-size:12px; color:#adb5bd; }

/* Divider */
.divider { display:flex; align-items:center; gap:12px; color:#adb5bd; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
.divider::before, .divider::after { content:''; flex:1; height:1px; background:#d6e4d8; }

/* Upload zone */
.upload-zone { border:2px dashed #d6e4d8; border-radius:10px; padding:24px; text-align:center; color:#adb5bd; font-size:13px; transition:all .2s; }
.upload-zone.dragging { border-color:#1a6b2e; background:#eaf4ec; color:#1a6b2e; }
.upload-zone i { font-size:32px; color:#1a6b2e; display:block; margin-bottom:8px; }
.inline-btn { background:none; border:none; color:#1a6b2e; font-weight:700; cursor:pointer; font-size:13px; text-decoration:underline; font-family:inherit; }
.parsed-info { display:flex; align-items:center; gap:14px; text-align:left; }
.parsed-info > i { font-size:34px; color:#1a6b2e; flex-shrink:0; }
.pi-name  { font-size:14px; font-weight:700; color:#0f3d1c; margin-bottom:6px; }
.pi-pills { display:flex; gap:6px; flex-wrap:wrap; }
.pill { padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700; }
.pill.green { background:#d1fae5; color:#065f46; }
.pill.red   { background:#fee2e2; color:#991b1b; }
.pill.grey  { background:#f3f4f6; color:#6b7280; }
.btn-x { margin-left:auto; background:none; border:none; cursor:pointer; font-size:17px; color:#adb5bd; }
.btn-x:hover { color:#dc2626; }

/* Errors */
.err-list { display:flex; gap:12px; background:#fef3c7; border:1px solid #fcd34d; border-radius:9px; padding:12px 16px; font-size:12px; color:#92400e; }
.err-list i { font-size:17px; color:#d97706; flex-shrink:0; margin-top:2px; }
.err-list ul { margin:4px 0 0; padding-left:16px; }
.err-list li { margin-bottom:2px; }

/* Table */
.preview-wrap { border:1px solid #d6e4d8; border-radius:10px; overflow:hidden; }
table { width:100%; border-collapse:collapse; }
th { padding:9px 12px; font-size:10px; text-transform:uppercase; letter-spacing:.4px; font-weight:700; color:#607060; background:#f8fdf9; border-bottom:2px solid #d6e4d8; text-align:left; white-space:nowrap; position:sticky; top:0; }
td { padding:8px 12px; font-size:12px; border-bottom:1px solid #f2f2f2; color:#374151; vertical-align:middle; }
tr:last-child td { border-bottom:none; }
tr.tr-ok  td { background:#f0fdf4; }
tr.tr-inc td { background:#fff; }
.td-n  { color:#adb5bd; font-size:11px; width:28px; }
.td-sm { font-size:11px; color:#6b7280; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.td-c  { text-align:center; }
code { font-size:11px; background:#eaf4ec; padding:2px 6px; border-radius:4px; color:#1a6b2e; font-weight:700; font-family:monospace; }
.dp { padding:2px 8px; border-radius:99px; font-size:10px; font-weight:700; }
.dp-yes { background:#d1fae5; color:#065f46; }
.dp-no  { background:#fee2e2; color:#991b1b; }
.req-badge { padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700; }
.req-ok  { background:#d1fae5; color:#065f46; }
.req-inc { background:#fee2e2; color:#991b1b; }

/* Actions */
.upload-actions { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-top:1px solid #d6e4d8; flex-wrap:wrap; gap:10px; background:#f8fdf9; }
.ua-info { font-size:12px; color:#607060; display:flex; align-items:flex-start; gap:6px; flex:1; }
.btn-save { display:flex; align-items:center; gap:8px; padding:10px 20px; background:#1a6b2e; color:#fff; border:none; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap; }
.btn-save:hover:not(:disabled) { background:#134f22; }
.btn-save:disabled { opacity:.6; cursor:not-allowed; }

/* Result */
.save-result { display:flex; align-items:flex-start; gap:12px; border-radius:10px; padding:14px 18px; border:1px solid; }
.sr-ok   { background:#d1fae5; border-color:#6ee7b7; }
.sr-warn { background:#fef9c3; border-color:#fcd34d; }
.save-result > i { font-size:20px; flex-shrink:0; margin-top:2px; }
.sr-ok   > i { color:#065f46; }
.sr-warn > i { color:#d97706; }
.sr-title { font-size:14px; font-weight:700; margin-bottom:3px; }
.sr-ok   .sr-title { color:#065f46; }
.sr-warn .sr-title { color:#92400e; }
.sr-body { font-size:13px; color:#374151; }

@keyframes spin { to { transform:rotate(360deg); } }
.spin { display:inline-block; animation:spin .7s linear infinite; }
</style>