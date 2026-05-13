'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const supabase = createClient()
  const [modal, setModal] = useState(false)
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [topicInput, setTopicInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const heroEmailRef = useRef<HTMLInputElement>(null)
  const topicInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modal])

  function openModal(prefill = '') {
    if (prefill) setEmail(prefill)
    setStep(1); setError(''); setModal(true)
  }

  function addTopic() {
    const t = topicInput.trim()
    if (t && !topics.includes(t)) setTopics(p => [...p, t])
    setTopicInput('')
  }

  function onTopicKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTopic() }
    if (e.key === 'Backspace' && !topicInput && topics.length) setTopics(p => p.slice(0, -1))
  }

  async function handleSignup() {
    if (!email || !email.includes('@') || !name || !password) { setError('fill in all fields.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    setLoading(false)
    if (error) { setError(error.message.toLowerCase()); return }
    setStep(2)
  }

  async function handleFinish() {
    if (!topics.length) { setError('add at least one interest.'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('interests').update({ topics }).eq('user_id', user.id)
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { background: #0c0c0c; color: #c8c4b8; font-family: 'Courier Prime', 'Courier New', monospace; -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        button, input { font-family: 'Courier Prime', 'Courier New', monospace; }
        input::placeholder { color: #444; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor::after { content: '_'; animation: blink 1.1s step-end infinite; color: #c8c4b8; }
        button:hover { opacity: 0.7; }
        input:focus { outline: none; }
      `}</style>

      {/* Single screen */}
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 64px' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: '#666' }}>Sift</span>
          <button onClick={() => openModal()} style={{ background: 'none', border: 'none', fontSize: 13, color: '#444', cursor: 'pointer', letterSpacing: 1 }}>sign in</button>
        </div>

        {/* Centre content */}
        <div style={{ maxWidth: 560 }}>
          <p style={{ fontSize: 12, color: '#3a3a3a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 48 }}>
            est. 2025 — private briefing service
          </p>

          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 400, lineHeight: 1.5, color: '#dedad2', marginBottom: 48, letterSpacing: -0.5 }}>
            Every morning, a briefing<br />
            arrives in your inbox.<br />
            <span style={{ color: '#666' }}>Written for you.</span><br />
            <span style={{ color: '#444' }}>About the things you follow.</span>
          </h1>

          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.9, marginBottom: 56, maxWidth: 440 }}>
            You tell us what you care about — any subject, any niche, any obsession. We read the internet overnight and write it up. Nobody else receives what you receive.
          </p>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2a2a', paddingBottom: 12, gap: 12 }}>
              <span style={{ color: '#3a3a3a', fontSize: 13 }}>&gt;</span>
              <input
                ref={heroEmailRef}
                type="email"
                placeholder="your email address"
                style={{ background: 'none', border: 'none', fontSize: 14, color: '#c8c4b8', flex: 1, letterSpacing: 0.3 }}
              />
              <button
                onClick={() => openModal(heroEmailRef.current?.value || '')}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#666', cursor: 'pointer', letterSpacing: 1, whiteSpace: 'nowrap' }}
              >
                enter →
              </button>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#333', letterSpacing: 0.5 }}>$1.99 / month &nbsp;·&nbsp; seven days free &nbsp;·&nbsp; cancel anytime</p>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <p style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: 1 }}>© 2025 Sift</p>
          <div style={{ display: 'flex', gap: 32 }}>
            {['privacy', 'terms', 'contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: 1 }}>{l}</a>
            ))}
          </div>
        </div>
      </main>

      {/* Modal */}
      {modal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div style={{ background: '#0c0c0c', border: '1px solid #222', padding: '48px 44px', maxWidth: 420, width: '100%', position: 'relative' }}>
            <button
              onClick={() => setModal(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#333', fontSize: 16, cursor: 'pointer' }}
            >×</button>

            {/* Step indicator */}
            <p style={{ fontSize: 11, color: '#333', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 36 }}>
              {step === 1 ? '01 / 02 — account' : '02 / 02 — interests'}
            </p>

            {step === 1 && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 400, color: '#dedad2', marginBottom: 8, letterSpacing: -0.3 }}>
                  Create your account<span className="cursor" />
                </h3>
                <p style={{ fontSize: 13, color: '#444', marginBottom: 40, lineHeight: 1.7 }}>Seven days free, then $1.99 per month.</p>

                {error && <p style={{ color: '#8a4a4a', fontSize: 13, marginBottom: 20 }}>{error}</p>}

                {[
                  { label: 'name', val: name, set: setName, type: 'text', ph: 'your name' },
                  { label: 'email', val: email, set: setEmail, type: 'email', ph: 'your email' },
                  { label: 'password', val: password, set: setPassword, type: 'password', ph: '8+ characters' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1e1e1e', paddingBottom: 10, gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#333', letterSpacing: 1, minWidth: 72 }}>{f.label}</span>
                      <input
                        type={f.type}
                        value={f.val}
                        onChange={e => f.set(e.target.value)}
                        placeholder={f.ph}
                        style={{ background: 'none', border: 'none', fontSize: 14, color: '#c8c4b8', flex: 1, letterSpacing: 0.2 }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSignup}
                  disabled={loading}
                  style={{ marginTop: 16, background: 'none', border: '1px solid #2a2a2a', color: '#c8c4b8', padding: '12px 28px', fontSize: 13, cursor: 'pointer', letterSpacing: 1, opacity: loading ? 0.4 : 1, width: '100%' }}
                >
                  {loading ? 'one moment...' : 'continue →'}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 400, color: '#dedad2', marginBottom: 8, letterSpacing: -0.3 }}>
                  What do you follow<span className="cursor" />
                </h3>
                <p style={{ fontSize: 13, color: '#444', marginBottom: 40, lineHeight: 1.7 }}>
                  Type anything and press enter. The more specific, the better your briefing.
                </p>

                {error && <p style={{ color: '#8a4a4a', fontSize: 13, marginBottom: 16 }}>{error}</p>}

                <div
                  onClick={() => topicInputRef.current?.focus()}
                  style={{ minHeight: 100, marginBottom: 28, borderBottom: '1px solid #1e1e1e', paddingBottom: 16, cursor: 'text' }}
                >
                  {topics.map(t => (
                    <span
                      key={t}
                      style={{ display: 'inline-block', marginRight: 8, marginBottom: 8, fontSize: 13, color: '#c8c4b8', cursor: 'default' }}
                    >
                      [{t}
                      <button
                        onClick={() => setTopics(p => p.filter(x => x !== t))}
                        style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 13, padding: '0 0 0 4px' }}
                      >×</button>]
                    </span>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#333', fontSize: 13 }}>&gt;</span>
                    <input
                      ref={topicInputRef}
                      value={topicInput}
                      onChange={e => setTopicInput(e.target.value)}
                      onKeyDown={onTopicKey}
                      onBlur={addTopic}
                      placeholder={topics.length ? '' : 'e.g. byzantine history, formula 1, venture capital...'}
                      style={{ background: 'none', border: 'none', fontSize: 14, color: '#c8c4b8', flex: 1, letterSpacing: 0.2 }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleFinish}
                  disabled={loading}
                  style={{ background: 'none', border: '1px solid #2a2a2a', color: '#c8c4b8', padding: '12px 28px', fontSize: 13, cursor: 'pointer', letterSpacing: 1, opacity: loading ? 0.4 : 1, width: '100%' }}
                >
                  {loading ? 'redirecting...' : 'continue to payment →'}
                </button>
                <p style={{ fontSize: 11, color: '#2e2e2e', marginTop: 16, textAlign: 'center', letterSpacing: 0.5 }}>no charge for seven days.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
