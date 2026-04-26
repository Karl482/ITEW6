import { addLog } from './db.js'

/**
 * Log an action — automatically routes to MongoDB (local) or Supabase (prod)
 */
export async function logActivity(opts) {
  try {
    await addLog(opts)
  } catch (e) {
    // Never crash the app over a logging error
    console.warn('Activity log failed:', e.message)
  }
}
