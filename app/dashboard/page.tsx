'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ALL_TOPICS = [
  '🖥️ Technology', '📈 Finance', '🔬 Science', '🌍 World news',
  '🎨 Design', '⚽ Sport', '🎵 Music', '🏛️ Politics', '🎬 Film',
  '📚 Books', '🚀 Startups', '🤖 AI', '🌱 Climate', '🏋️ Health',
  '🍽️ Food', '✈️ Travel', '📸 Photography', '🧬 Biotech', '🎮 Gaming',
]

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [topics, setTopics] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const [{ data: sub }, { data: interests }] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
        supabase.from('interests').select('*').eq('user_id', user.id).single(),
      ])
      setSubscription(sub)
      setTopics(interests?.topics ?? [])
    }
    load()
  }, [])

  function toggleTopic(t: string) {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
    setSaved(false)
  }

  async function saveInterests() {
    if (!user) return
    setSaving(true)
    await supabase.from('interests').update({ topics, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    setSaving(false)
    setSaved(true)
  }

  async function handleUpgrade(plan: string) {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#070710', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
    </div>
  )

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <div style={{ minHeight: '100vh', background: '#070710', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '0' }}>
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 22, background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sift</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>{user.email}</span>
          <button onClick={signOut} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>Your dashboard</h1>
        <p style={{ color: '#94a3b8', marginBottom: 48 }}>Manage your interests and subscription.</p>

        {/* Subscription status */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6366f1', marginBottom: 6 }}>Subscription</div>
              {isActive ? (
                <div>
                  <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 18 }}>{subscription.plan?.charAt(0).toUpperCase() + subscription.plan?.slice(1)} plan</span>
                  <span style={{ marginLeft: 10, background: 'rgba(74,222,128,0.15)', color: '#4ade80', borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{subscription.status}</span>
                </div>
              ) : (
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#94a3b8' }}>No active subscription</div>
              )}
            </div>
            {!isActive && (
              <button onClick={() => handleUpgrade('daily')} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', border: 'none', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Start free trial →
              </button>
            )}
          </div>
        </div>

        {/* Interests */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6366f1', marginBottom: 6 }}>Your interests</div>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>Select topics to include in your daily briefing.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
            {ALL_TOPICS.map(t => (
              <button key={t} onClick={() => toggleTopic(t)} style={{
                padding: '9px 18px', borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                background: topics.includes(t) ? 'rgba(99,102,241,0.15)' : '#161627',
                border: topics.includes(t) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                color: topics.includes(t) ? '#a5b4fc' : '#94a3b8',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={saveInterests} disabled={saving} style={{
              background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', border: 'none', color: '#fff',
              padding: '12px 28px', borderRadius: 10, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving...' : 'Save interests'}
            </button>
            {saved && <span style={{ color: '#4ade80', fontSize: 14 }}>✓ Saved</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
