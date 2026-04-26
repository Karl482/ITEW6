<template>
  <div class="cal-wrapper" ref="wrapperRef">
    <!-- Trigger input -->
    <div class="cal-input-row" @click="toggle">
      <i class="bi bi-calendar3 cal-icon"></i>
      <span class="cal-value" :class="{ placeholder: !modelValue }">
        {{ displayValue }}
      </span>
      <i class="bi bi-chevron-down cal-chevron" :class="{ open: show }"></i>
    </div>

    <!-- Dropdown calendar -->
    <div v-if="show" class="cal-dropdown">

      <!-- Header: nav + month/year -->
      <div class="cal-header">
        <button class="cal-nav" @click.stop="prevMonth"><i class="bi bi-chevron-left"></i></button>
        <div class="cal-month-year">
          <span class="cal-month-label" @click.stop="viewMode = viewMode === 'days' ? 'months' : 'days'">
            {{ monthNames[cursor.month] }}
          </span>
          <span class="cal-year-label" @click.stop="viewMode = viewMode === 'days' ? 'years' : 'days'">
            {{ cursor.year }}
          </span>
        </div>
        <button class="cal-nav" @click.stop="nextMonth"><i class="bi bi-chevron-right"></i></button>
      </div>

      <!-- Days view -->
      <div v-if="viewMode === 'days'" class="cal-grid">
        <div class="cal-dow" v-for="d in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="d">{{ d }}</div>
        <div
          v-for="cell in cells" :key="cell.key"
          class="cal-cell"
          :class="{
            'other-month': !cell.current,
            'today': cell.isToday,
            'selected': cell.isSelected,
            'disabled': cell.disabled
          }"
          @click.stop="selectDay(cell)"
        >{{ cell.day }}</div>
      </div>

      <!-- Months view -->
      <div v-if="viewMode === 'months'" class="cal-month-grid">
        <div
          v-for="(m, i) in monthNames" :key="m"
          class="cal-month-cell"
          :class="{ 'selected': cursor.month === i }"
          @click.stop="selectMonth(i)"
        >{{ m.slice(0,3) }}</div>
      </div>

      <!-- Years view -->
      <div v-if="viewMode === 'years'" class="cal-year-grid">
        <div
          v-for="y in yearRange" :key="y"
          class="cal-year-cell"
          :class="{ 'selected': cursor.year === y }"
          @click.stop="selectYear(y)"
        >{{ y }}</div>
      </div>

      <!-- Footer -->
      <div class="cal-footer">
        <button class="cal-today-btn" @click.stop="goToday">Today</button>
        <button class="cal-clear-btn" @click.stop="clearDate">Clear</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },   // YYYY-MM-DD
  placeholder: { type: String, default: 'Select date' },
  minYear: { type: Number, default: 1950 },
  maxYear: { type: Number, default: 2100 },
})
const emit = defineEmits(['update:modelValue'])

const show     = ref(false)
const viewMode = ref('days')  // 'days' | 'months' | 'years'
const wrapperRef = ref(null)

const today = new Date()
const cursor = ref({
  month: props.modelValue ? parseInt(props.modelValue.split('-')[1]) - 1 : today.getMonth(),
  year:  props.modelValue ? parseInt(props.modelValue.split('-')[0])     : today.getFullYear(),
})

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder
  const [y, m, d] = props.modelValue.split('-')
  return `${monthNames[parseInt(m)-1]} ${parseInt(d)}, ${y}`
})

const yearRange = computed(() => {
  const arr = []
  for (let y = props.minYear; y <= props.maxYear; y++) arr.push(y)
  return arr
})

const cells = computed(() => {
  const { month, year } = cursor.value
  const first = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()
  const result = []

  // Prev month tail
  for (let i = first - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear  = month === 0 ? year - 1 : year
    result.push({ key: `p${d}`, day: d, current: false, isToday: false, isSelected: false, disabled: true,
      date: `${prevYear}-${String(prevMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
    result.push({ key: `c${d}`, day: d, current: true, isToday, isSelected: dateStr === props.modelValue, disabled: false, date: dateStr })
  }

  // Next month head
  const remaining = 42 - result.length
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear  = month === 11 ? year + 1 : year
    result.push({ key: `n${d}`, day: d, current: false, isToday: false, isSelected: false, disabled: true,
      date: `${nextYear}-${String(nextMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}` })
  }
  return result
})

function toggle() { show.value = !show.value; viewMode.value = 'days' }
function prevMonth() {
  if (cursor.value.month === 0) { cursor.value.month = 11; cursor.value.year-- }
  else cursor.value.month--
}
function nextMonth() {
  if (cursor.value.month === 11) { cursor.value.month = 0; cursor.value.year++ }
  else cursor.value.month++
}
function selectDay(cell) {
  if (cell.disabled) return
  emit('update:modelValue', cell.date)
  show.value = false
}
function selectMonth(i) { cursor.value.month = i; viewMode.value = 'days' }
function selectYear(y)  { cursor.value.year = y;  viewMode.value = 'months' }
function goToday() {
  cursor.value.month = today.getMonth()
  cursor.value.year  = today.getFullYear()
  const d = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  emit('update:modelValue', d)
  show.value = false
}
function clearDate() { emit('update:modelValue', ''); show.value = false }

// Close on outside click
function onClickOutside(e) { if (wrapperRef.value && !wrapperRef.value.contains(e.target)) show.value = false }
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.cal-wrapper { position: relative; width: 100%; }

.cal-input-row {
  display: flex; align-items: center; gap: 8px;
  border: 1.5px solid #d6e4d8; border-radius: 8px;
  padding: 8px 12px; background: #fff; cursor: pointer;
  transition: border-color .15s;
  font-family: inherit; font-size: 13px;
}
.cal-input-row:hover { border-color: #1a6b2e; }
.cal-icon   { color: #1a6b2e; font-size: 14px; flex-shrink: 0; }
.cal-value  { flex: 1; color: #212529; }
.cal-value.placeholder { color: #adb5bd; }
.cal-chevron { color: #adb5bd; font-size: 11px; transition: transform .2s; flex-shrink: 0; }
.cal-chevron.open { transform: rotate(180deg); }

.cal-dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 9999;
  background: #fff; border: 1.5px solid #d6e4d8; border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.15); width: 280px;
  overflow: hidden;
}

/* Header */
.cal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 8px; border-bottom: 1px solid #f0f0f0;
}
.cal-nav {
  background: none; border: none; cursor: pointer;
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  color: #607060; font-size: 12px; transition: background .15s;
}
.cal-nav:hover { background: #eaf4ec; color: #1a6b2e; }
.cal-month-year { display: flex; gap: 6px; align-items: center; }
.cal-month-label, .cal-year-label {
  font-size: 13px; font-weight: 700; color: #0f3d1c;
  cursor: pointer; padding: 2px 6px; border-radius: 5px;
  transition: background .15s;
}
.cal-month-label:hover, .cal-year-label:hover { background: #eaf4ec; }

/* Days grid */
.cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  padding: 8px 10px 4px; gap: 2px;
}
.cal-dow {
  text-align: center; font-size: 10px; font-weight: 700;
  color: #adb5bd; padding: 4px 0; letter-spacing: .3px;
}
.cal-cell {
  text-align: center; padding: 6px 2px; font-size: 12px;
  border-radius: 6px; cursor: pointer; color: #212529;
  transition: background .12s, color .12s;
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
}
.cal-cell:hover:not(.disabled):not(.selected) { background: #eaf4ec; color: #1a6b2e; }
.cal-cell.other-month { color: #d0d0d0; cursor: default; }
.cal-cell.today { font-weight: 700; color: #1a6b2e; border: 1.5px solid #1a6b2e; }
.cal-cell.selected { background: #1a6b2e; color: #fff !important; font-weight: 700; }
.cal-cell.selected.today { border-color: #134f22; }
.cal-cell.disabled { pointer-events: none; }

/* Months grid */
.cal-month-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  padding: 10px; gap: 4px;
}
.cal-month-cell {
  text-align: center; padding: 10px 4px; font-size: 12px; font-weight: 600;
  border-radius: 8px; cursor: pointer; color: #212529;
  transition: background .12s;
}
.cal-month-cell:hover { background: #eaf4ec; color: #1a6b2e; }
.cal-month-cell.selected { background: #1a6b2e; color: #fff; }

/* Years grid */
.cal-year-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  padding: 10px; gap: 4px;
  max-height: 200px; overflow-y: auto;
}
.cal-year-cell {
  text-align: center; padding: 8px 2px; font-size: 12px; font-weight: 600;
  border-radius: 6px; cursor: pointer; color: #212529;
  transition: background .12s;
}
.cal-year-cell:hover { background: #eaf4ec; color: #1a6b2e; }
.cal-year-cell.selected { background: #1a6b2e; color: #fff; }

/* Footer */
.cal-footer {
  display: flex; justify-content: space-between;
  padding: 8px 12px; border-top: 1px solid #f0f0f0;
}
.cal-today-btn, .cal-clear-btn {
  background: none; border: none; cursor: pointer;
  font-size: 11px; font-weight: 600; font-family: inherit;
  padding: 4px 8px; border-radius: 5px; transition: background .12s;
}
.cal-today-btn { color: #1a6b2e; }
.cal-today-btn:hover { background: #eaf4ec; }
.cal-clear-btn { color: #adb5bd; }
.cal-clear-btn:hover { background: #f8f9fa; color: #dc3545; }
</style>