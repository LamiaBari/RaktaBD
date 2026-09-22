// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
})

// ─── AUTH ────────────────────────────────────────────────────────
export const auth = {
  signUp: (email, password, meta) =>
    supabase.auth.signUp({ email, password, options: { data: meta } }),
  signIn: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser(),
  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
}

// ─── DISTRICTS ───────────────────────────────────────────────────
export const districtQueries = {
  search: async (query) => {
    if (!query || query.length < 1) {
      const { data } = await supabase
        .from('bangladesh_districts')
        .select('name, division')
        .order('name')
        .limit(64)
      return data || []
    }
    const { data } = await supabase
      .rpc('search_districts', { p_query: query })
    return data || []
  },

  getAll: async () => {
    const { data } = await supabase
      .from('bangladesh_districts')
      .select('name, division')
      .order('name')
    return data || []
  }
}

// ─── EMERGENCY REQUESTS ──────────────────────────────────────────
export const emergencyQueries = {
  // getAll: async (filters = {}) => {
  //   let q = supabase
  //     .from('emergency_requests')
  //     .select(`*, profiles:user_id(full_name, district)`)
  getAll: async (filters = {}) => {
  let q = supabase
    .from('emergency_requests')
    .select('*')
      .order('created_at', { ascending: false })

    if (filters.urgency)    q = q.eq('urgency_level', filters.urgency)
    if (filters.status)     q = q.eq('status', filters.status)
    if (filters.district)   q = q.ilike('district', filters.district)
    if (filters.blood_group) q = q.eq('blood_group', filters.blood_group)

    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  // getById: async (id) => {
  //   const { data, error } = await supabase
  //     .from('emergency_requests')
  //     .select(`*, profiles:user_id(full_name, district)`)
  getById: async (id) => {
  const { data, error } = await supabase
    .from('emergency_requests')
    .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  create: async (payload) => {
    const { data, error } = await supabase
      .from('emergency_requests')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

update: async (id, payload) => {
  const { data, error } = await supabase
    .from('ambulance_services')
    .update(payload)
    .eq('id', id)
    .select()

  if (error) throw error
  return data?.[0]
},

  delete: async (id) => {
    const { error } = await supabase
      .from('emergency_requests')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  subscribeToChanges: (cb) => {
    return supabase
      .channel('emergency_requests_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'emergency_requests' }, cb)
      .subscribe()
  }
}

// ─── DONORS ──────────────────────────────────────────────────────
export const donorQueries = {
search: async ({ district, blood_group, active_only = true } = {}) => {
  let q = supabase
    .from('v_donors')
    .select('*')
    .order('is_active', { ascending: false })
    .order('donation_count', { ascending: false })

    // if (district)    q = q.ilike('district', district)
    if (district) q = q.ilike('district', `%${district}%`)
    if (blood_group) q = q.eq('blood_group', blood_group)
    if (active_only) q = q.eq('is_active', true)

    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  getMyRecord: async (userId) => {
    const { data } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data
  },

  create: async (payload) => {
    const { data, error } = await supabase
      .from('donors')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id, payload) => {
    const { data, error } = await supabase
      .from('donors')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Check active request before reveal
  checkActiveRequest: async (userId) => {
    const { data } = await supabase
      .rpc('user_has_active_request', { p_user_id: userId })
    return !!data
  },

  // Log contact reveal
  logReveal: async ({ donor_id, viewer_id, request_id }) => {
    const { data, error } = await supabase
      .from('contact_views')
      .upsert({ donor_id, viewer_id, request_id }, { onConflict: 'donor_id,viewer_id,request_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  getRevealLogs: async (donorId) => {
    const { data, error } = await supabase
      .from('contact_views')
      .select(`*, profiles:viewer_id(full_name, district)`)
      .eq('donor_id', donorId)
      .order('viewed_at', { ascending: false })
    if (error) throw error
    return data || []
  }
}

// ─── AMBULANCE ───────────────────────────────────────────────────
export const ambulanceQueries = {
  getAll: async (filters = {}) => {
    let q = supabase
      .from('ambulance_services')
      .select('*')
      .eq('is_active', true)
      .order('service_name')

    if (filters.district)     q = q.ilike('district', filters.district)
    if (filters.service_type && filters.service_type !== 'All')
                              q = q.eq('service_type', filters.service_type)
    if (filters.available_247) q = q.eq('available_24_7', true)

    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  create: async (payload) => {
    const { data, error } = await supabase
      .from('ambulance_services')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id, payload) => {
    const { data, error } = await supabase
      .from('ambulance_services')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('ambulance_services')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  subscribeToChanges: (cb) => {
    return supabase
      .channel('ambulance_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ambulance_services' }, cb)
      .subscribe()
  }
}

// ─── DONATION HISTORY ────────────────────────────────────────────
export const historyQueries = {
  getMyHistory: async (userId) => {
    const { data, error } = await supabase
      .from('donation_history')
      .select('*')
      .eq('user_id', userId)
      .order('donation_date', { ascending: false })
    if (error) throw error
    return data || []
  },

  getAll: async () => {
    const { data, error } = await supabase
      .from('donation_history')
      .select(`*, donors:donor_id(full_name, blood_group)`)
      .order('donation_date', { ascending: false })
    if (error) throw error
    return data || []
  },

  create: async (payload) => {
    const { data, error } = await supabase
      .from('donation_history')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id, payload) => {
    const { data, error } = await supabase
      .from('donation_history')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('donation_history')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  subscribeToChanges: (userId, cb) => {
    return supabase
      .channel('donation_history_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'donation_history',
          filter: `user_id=eq.${userId}` }, cb)
      .subscribe()
  }
}

// ─── USER PREFERENCES ────────────────────────────────────────────
export const preferenceQueries = {
  get: async (userId) => {
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data
  },

  upsert: async (userId, prefs) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...prefs })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────
export const notificationQueries = {
  getAll: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data || []
  },

  markRead: async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw error
  },

  markAllRead: async (userId) => {
    const { error } = await supabase
      .rpc('mark_all_notifications_read', { p_user_id: userId })
    if (error) throw error
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  subscribeToChanges: (userId, cb) => {
    return supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${userId}` }, cb)
      .subscribe()
  }
}
// ─── DONATIONS ───────────────────────────────────────────────────
export const donationQueries = {
  // All donations for a given donor, newest first
  getByDonor: async (donorId) => {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('donor_id', donorId)
      .order('donated_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Derived stats: count, last donation, next eligible — from v_donor_stats
  getStats: async (donorId) => {
    const { data, error } = await supabase
      .from('v_donor_stats')
      .select('*')
      .eq('donor_id', donorId)
      .single()
    if (error) throw error
    return data
  },

  create: async (payload) => {
    const { data, error } = await supabase
      .from('donations')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id, payload) => {
    const { data, error } = await supabase
      .from('donations')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('donations')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  subscribeToChanges: (donorId, cb) => {
    return supabase
      .channel(`donations_${donorId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'donations',
          filter: `donor_id=eq.${donorId}` }, cb)
      .subscribe()
  }
}