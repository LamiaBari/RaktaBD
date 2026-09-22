import { createContext, useContext, useEffect, useState, useCallback } from 'react'
// import { supabase } from '../supabase.js'
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [donor, setDonor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const refreshDonor = useCallback(async (uid) => {
    if (!uid) { setDonor(null); return }
    const { data } = await supabase
      .from('donors')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()
    setDonor(data ?? null)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      refreshDonor(session?.user?.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        refreshDonor(session?.user?.id)
      }
    )
    return () => subscription.unsubscribe()
  }, [refreshDonor])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setModalOpen(false)
    return data
  }

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) throw error
    setModalOpen(false)
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDonor(null)
  }

  const openAuthModal  = () => setModalOpen(true)
  const closeAuthModal = () => setModalOpen(false)

  return (
    <AuthContext.Provider value={{
      user, donor, loading,
      signIn, signUp, signOut, refreshDonor,
      modalOpen, openAuthModal, closeAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}