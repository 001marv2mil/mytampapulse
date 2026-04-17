import { supabase } from './supabase'

// Events table
export async function getEvents(category?: string, neighborhood?: string, limit = 20) {
  let query = supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .limit(limit)

  if (category) query = query.eq('category', category)
  if (neighborhood) query = query.eq('neighborhood', neighborhood)

  const { data, error } = await query
  if (error) console.error('getEvents error:', error)
  return data ?? []
}

// Content/stories table
export async function getContent(category?: string, limit = 20) {
  let query = supabase
    .from('content')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) console.error('getContent error:', error)
  return data ?? []
}

// FAQ table
export async function getFAQs(topic?: string, neighborhood?: string) {
  let query = supabase
    .from('faqs')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (topic) query = query.eq('topic', topic)
  if (neighborhood) query = query.eq('neighborhood', neighborhood)

  const { data, error } = await query
  if (error) console.error('getFAQs error:', error)
  return data ?? []
}
