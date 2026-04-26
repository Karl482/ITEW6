import { supabase } from '@/lib/supabase.js'

/**
 * Log an action to the activity_logs table.
 *
 * @param {Object} opts
 * @param {string} opts.actorType   - 'admin' | 'student' | 'faculty'
 * @param {string} opts.actorId     - ID of the person performing the action
 * @param {string} opts.actorName   - Display name
 * @param {string} opts.action      - e.g. 'Created student', 'Updated grade'
 * @param {string} [opts.targetType] - e.g. 'student', 'faculty', 'event'
 * @param {string} [opts.targetId]
 * @param {string} [opts.targetName]
 * @param {Object} [opts.details]   - any extra JSON data
 */
export async function logActivity({ actorType, actorId, actorName, action, targetType = null, targetId = null, targetName = null, details = null }) {
  await supabase.from('activity_logs').insert({
    actor_type:  actorType,
    actor_id:    actorId,
    actor_name:  actorName,
    action,
    target_type: targetType,
    target_id:   targetId,
    target_name: targetName,
    details
  })
}
