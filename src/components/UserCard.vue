<template>
  
  <div class="user-card" :class="{ inactive: user.status === 'inactive' }">

    <!-- Header: avatar + status -->
    <div class="uc-header">
      <div class="uc-avatar" :class="user.role === 'student' ? 'av-student' : 'av-faculty'">
        <img v-if="user.avatar" :src="user.avatar"
          style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
        <span v-else>{{ user.initials }}</span>
      </div>
      <span class="uc-status" :class="user.status === 'active' ? 'st-active' : 'st-inactive'">
        <span class="st-dot"></span>{{ user.status }}
      </span>
    </div>

    <!-- Body: name, role badge, details from props -->
    <div class="uc-body">
      <div class="uc-name">{{ user.name }}</div>
      <div class="uc-id">{{ user.id }}</div>

      <span class="uc-role-badge" :class="user.role === 'student' ? 'rb-student' : 'rb-faculty'">
        <i :class="user.role === 'student' ? 'bi bi-person-badge-fill' : 'bi bi-person-workspace'"></i>
        {{ user.role === 'student' ? 'Student' : 'Faculty' }}
      </span>

      <!-- Student-specific fields — passed down through props -->
      <template v-if="user.role === 'student'">
        <div class="uc-detail"><i class="bi bi-journal-bookmark-fill"></i><span>{{ user.program }}</span></div>
        <div class="uc-detail"><i class="bi bi-layers-fill"></i><span>{{ user.yearLevel }} · {{ user.section }}</span></div>
        <div class="uc-detail"><i class="bi bi-award-fill"></i><span>GPA: <strong>{{ user.gpa }}</strong></span></div>
      </template>

      <!-- Faculty-specific fields — passed down through props -->
      <template v-if="user.role === 'faculty'">
        <div class="uc-detail"><i class="bi bi-building"></i><span>{{ user.department }}</span></div>
        <div class="uc-detail"><i class="bi bi-briefcase-fill"></i><span>{{ user.position }}</span></div>
        <div class="uc-detail"><i class="bi bi-clock-history"></i><span>{{ user.yearsOfService }} of service</span></div>
      </template>

      <div class="uc-detail"><i class="bi bi-envelope-fill"></i><span class="text-trunc">{{ user.email }}</span></div>
    </div>

    <!-- Footer: action buttons that emit events to parent -->
    <div class="uc-footer">
      <button class="uc-btn btn-view" @click="$emit('view', user)">
        <i class="bi bi-eye-fill"></i> View
      </button>
      <button
        class="uc-btn"
        :class="user.status === 'active' ? 'btn-deactivate' : 'btn-activate'"
        @click="$emit('toggle-status', user.id)"
      >
        <i :class="user.status === 'active' ? 'bi bi-pause-circle-fill' : 'bi bi-play-circle-fill'"></i>
        {{ user.status === 'active' ? 'Deactivate' : 'Activate' }}
      </button>
      <button class="uc-btn btn-remove" @click="$emit('remove', user.id)" title="Remove">
        <i class="bi bi-trash-fill"></i>
      </button>
    </div>

  </div>
</template>

<script setup>

defineProps({
  user: {
    type: Object,
    required: true,
    
  }
})

/**
 * EMITS — events sent UP to the parent
 * Parent handles these and mutates the store
 */
defineEmits(['view', 'toggle-status', 'remove'])
</script>

<style scoped>
.user-card {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow .2s, transform .2s;
}
.user-card:hover {
  box-shadow: 0 6px 24px rgba(0,0,0,.09);
  transform: translateY(-2px);
}
.user-card.inactive { opacity: .65; border-style: dashed; }

/* Header */
.uc-header {
  padding: 16px 16px 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.uc-avatar {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
}
.av-student { background: #e9a825; color: #0d3b66; }
.av-faculty { background: #0d3b66; color: #fff; }

.uc-status {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; padding: 3px 9px; border-radius: 99px;
}
.st-dot { width: 6px; height: 6px; border-radius: 50%; }
.st-active  { background: #d1fae5; color: #065f46; }
.st-active .st-dot  { background: #10b981; }
.st-inactive { background: #fee2e2; color: #991b1b; }
.st-inactive .st-dot { background: #ef4444; }

/* Body */
.uc-body { padding: 12px 16px 14px; flex: 1; }
.uc-name { font-size: 14px; font-weight: 700; color: #0d3b66; margin-bottom: 2px; }
.uc-id   { font-size: 11px; color: #adb5bd; margin-bottom: 8px; font-family: monospace; }
.uc-role-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700;
  padding: 3px 10px; border-radius: 99px; margin-bottom: 10px;
}
.rb-student { background: #fef3c7; color: #92400e; }
.rb-faculty { background: #dbeafe; color: #1e40af; }

.uc-detail {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 12px; color: #6c757d; margin-bottom: 5px;
}
.uc-detail i { font-size: 12px; color: #0d3b66; margin-top: 1px; flex-shrink: 0; }
.text-trunc { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Footer */
.uc-footer {
  padding: 10px 12px;
  border-top: 1px solid #f2f2f2;
  display: flex; gap: 6px;
  background: #fafbfc;
}
.uc-btn {
  flex: 1; padding: 7px 4px;
  border-radius: 7px; border: none;
  font-size: 11px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all .15s;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.btn-view       { background: #e8f0f8; color: #0d3b66; }
.btn-view:hover { background: #0d3b66; color: #fff; }
.btn-deactivate       { background: #fef3c7; color: #92400e; }
.btn-deactivate:hover { background: #f59e0b; color: #fff; }
.btn-activate         { background: #d1fae5; color: #065f46; }
.btn-activate:hover   { background: #10b981; color: #fff; }
.btn-remove       { flex: 0 0 auto; padding: 7px 10px; background: #fee2e2; color: #dc3545; }
.btn-remove:hover { background: #dc3545; color: #fff; }
</style>
