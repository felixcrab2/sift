'use client'

import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const MAX_TOPICS = 6

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [topics, setTopics] = useState<string[]>([])
  const [topicInput, setTopicInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState('')
  const topicInputRef = useRef<HTMLInputElement>(null)

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

  function addTopic() {
    const t = topicInput.trim()
    if (t && !topics.includes(t) && topics.length < MAX_TOPICS) {
      setTopics(p => [...p, t])
      setSaved(false)
    }
    setTopicInput('')
  }

  function removeTopic(t: string) {
    setTopics(p => p.filter(x => x !== t))
    setSaved(false)
  }

  function onTopicKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTopic() }
    if (e.key === 'Backspace' && !topicInput && topics.length) {
      setTopics(p => p.slice(0, -1))
      setSaved(false)
    }
  }

  async function saveInterests() {
    if (!user) return
    setSaving(true)
    await supabase.from('interests').update({ topics, updated_at: new Date().toISOString() }).eq('user_id', user.id)
    setSaving(false)
    setSaved(true)
  }

  async function sendTest() {
    setSendingTest(true); setTestResult('')
    const res = await fetch('/api/test-newsletter', { method: 'POST' })
    const data = await res.json()
    setSendingTest(false)
    setTestResult(res.ok ? `Sent to ${data.sentTo}` : (data.error ?? 'Something went wrong.'))
  }

  async function handleUpgrade() {
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#0a0907', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Courier Prime', 'Courier New', monospace", color: '#7a7468', fontSize: 13, letterSpacing: 1 }}>
      loading...
    </div>
  )

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0907; color: #c8c4b8; font-family: 'Courier Prime', 'Courier New', monospace; -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        button, input { font-family: 'Courier Prime', 'Courier New', monospace; }
        input::placeholder { color: #3a352d; }
        input:focus { outline: none; }
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        button { transition: opacity 0.25s; }
        .arrow { display: inline-block; transition: transform 0.3s ease; }
        .submit:hover { opacity: 0.8; }
        .submit:hover .arrow { transform: translateX(4px); }
      `}</style>

      <header style={{ borderBottom: '1px solid #1c1915', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="serif" style={{ fontSize: 30, fontWeight: 500, letterSpacing: 0.5, color: '#ece7da' }}>Sift</span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#7a7468', letterSpacing: 0.5 }}>{user.email}</span>
          <button onClick={signOut} className="submit" style={{ background: 'none', border: '1px solid #2a2620', color: '#a8a294', padding: '7px 16px', fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' }}>sign out</button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 40px 120px' }}>
        <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7468', marginBottom: 16 }}>— your dashboard</p>
        <h1 className="serif" style={{ fontSize: 44, fontWeight: 400, color: '#ece7da', letterSpacing: -1, marginBottom: 56 }}>
          Manage your <em style={{ fontStyle: 'italic', color: '#c4a86b' }}>briefing</em>.
        </h1>

        {/* Subscription */}
        <section style={{ borderTop: '1px solid #1c1915', paddingTop: 32, marginBottom: 56 }}>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7468', marginBottom: 16 }}>subscription</p>
          {isActive ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <span className="serif" style={{ fontSize: 26, fontWeight: 500, color: '#ece7da' }}>$3.99 / month</span>
              <span style={{ fontSize: 12, color: '#c4a86b', letterSpacing: 2, textTransform: 'uppercase', border: '1px solid #2a2620', padding: '3px 10px' }}>{subscription.status}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <span className="serif" style={{ fontSize: 22, color: '#a8a294', fontStyle: 'italic' }}>No active subscription.</span>
              <button onClick={handleUpgrade} className="submit" style={{ background: '#c4a86b', border: 'none', color: '#0a0907', padding: '11px 22px', fontSize: 11, cursor: 'pointer', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 700 }}>
                begin trial <span className="arrow">→</span>
              </button>
            </div>
          )}
        </section>

        {/* Subjects */}
        <section style={{ borderTop: '1px solid #1c1915', paddingTop: 32, marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7468' }}>your subjects</p>
            <p style={{ fontSize: 11, color: '#5a564c', letterSpacing: 0.5 }}>{topics.length} of {MAX_TOPICS}</p>
          </div>
          <p style={{ fontSize: 14, color: '#8a8478', lineHeight: 1.85, marginBottom: 28 }}>
            Add up to {MAX_TOPICS} subjects you follow. Each morning, three are chosen at random for your briefing — so the rotation stays fresh.
          </p>

          <div
            onClick={() => topicInputRef.current?.focus()}
            style={{ minHeight: 120, borderBottom: '1px solid #2a2620', paddingBottom: 16, marginBottom: 24, cursor: 'text' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: topics.length ? 14 : 0 }}>
              {topics.map(t => (
                <span key={t} style={{ fontSize: 13, color: '#dad5c8', letterSpacing: 0.3, display: 'inline-flex', alignItems: 'center' }}>
                  [{t}
                  <button
                    onClick={() => removeTopic(t)}
                    style={{ background: 'none', border: 'none', color: '#5a564c', cursor: 'pointer', fontSize: 13, padding: '0 0 0 4px' }}
                  >×</button>]
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#7a7468', fontSize: 13 }}>&gt;</span>
              <input
                ref={topicInputRef}
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={onTopicKey}
                onBlur={addTopic}
                disabled={topics.length >= MAX_TOPICS}
                placeholder={topics.length >= MAX_TOPICS ? 'maximum reached — remove one to add another' : 'type a subject and press enter'}
                style={{ background: 'none', border: 'none', fontSize: 14, color: '#ece7da', flex: 1, opacity: topics.length >= MAX_TOPICS ? 0.5 : 1 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={saveInterests} disabled={saving} className="submit" style={{ background: '#c4a86b', border: 'none', color: '#0a0907', padding: '11px 22px', fontSize: 11, cursor: 'pointer', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 700, opacity: saving ? 0.5 : 1 }}>
              {saving ? 'saving...' : 'save subjects'}
            </button>
            {saved && <span style={{ fontSize: 12, color: '#c4a86b', fontStyle: 'italic' }}>saved.</span>}
          </div>
        </section>

        {/* Test send */}
        {isActive && (
          <section style={{ borderTop: '1px solid #1c1915', paddingTop: 32 }}>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7468', marginBottom: 16 }}>preview</p>
            <p style={{ fontSize: 14, color: '#8a8478', lineHeight: 1.85, marginBottom: 24 }}>
              Send a sample edition to your inbox right now using your current subjects.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <button onClick={sendTest} disabled={sendingTest} className="submit" style={{ background: 'none', border: '1px solid #2a2620', color: '#ece7da', padding: '11px 22px', fontSize: 11, cursor: 'pointer', letterSpacing: 2.5, textTransform: 'uppercase', opacity: sendingTest ? 0.5 : 1 }}>
                {sendingTest ? 'composing...' : <>send a test edition <span className="arrow">→</span></>}
              </button>
              {testResult && <span style={{ fontSize: 12, color: '#c4a86b', fontStyle: 'italic' }}>{testResult}</span>}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
