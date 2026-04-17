import { supabase } from './supabase'

/**
 * Returns FAQs for a given topic, ordered by updated_at DESC.
 * Falls back gracefully if Supabase is unavailable or table is empty.
 */
export async function getWeeklyFAQs(topic: string, neighborhood?: string) {
  let query = supabase
    .from('faqs')
    .select('*')
    .eq('active', true)
    .order('updated_at', { ascending: false })
    .limit(12)

  if (topic) query = query.eq('topic', topic)
  if (neighborhood) query = query.eq('neighborhood', neighborhood)

  const { data, error } = await query
  if (error) {
    console.error('getWeeklyFAQs error:', error)
    return []
  }
  return data ?? []
}

/**
 * Returns the ISO week string for the current week, used in "Last updated" labels.
 * Format: "Week of [Month] [Day], [Year]"
 */
export function getCurrentWeekLabel(): string {
  const now = new Date()
  // Find the Monday of the current week
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
}
