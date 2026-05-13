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
    if (!email || !email.includes('@') || !name || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep(2)
  }

  async function handleFinish() {
    if (!topics.length) { setError('Add at least one interest.'); return }
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #fff; color: #111; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        .f { font-family: 'Playfair Display', serif; }
        a { color: inherit; text-decoration: none; }
        button, input { font-family: 'Inter', sans-serif; }
        input::placeholder { color: #ccc; }
      `}</style>

      {/* Nav */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f5f5f5' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <span className="f" style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>Sift</span>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <button onClick={() => openModal()} style={{ background: 'none', border: 'none', fontSize: 13, color: '#999', cursor: 'pointer' }}>Sign in</button>
            <button onClick={() => openModal()} style={{ padding: '7px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: 3, fontSize: 13, cursor: 'pointer', letterSpacing: 0.1 }}>Start free trial</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 48px 80px' }}>
        <h1 className="f" style={{ fontSize: 'clamp(56px,8vw,104px)', fontWeight: 400, lineHeight: 1.03, letterSpacing: -2.5, color: '#111', maxWidth: 820, marginBottom: 32 }}>
          The internet,<br /><em style={{ fontStyle: 'italic' }}>read for you.</em>
        </h1>
        <p style={{ fontSize: 18, color: '#999', fontWeight: 300, maxWidth: 400, lineHeight: 1.75, marginBottom: 52 }}>
          One beautifully written briefing every morning, shaped entirely around your interests.
        </p>
        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 380 }}>
          <input
            ref={heroEmailRef}
            type="email"
            placeholder="your@email.com"
            style={{ flex: 1, padding: '13px 16px', border: '1px solid #e0e0e0', borderRadius: 3, fontSize: 14, outline: 'none', color: '#111' }}
          />
          <button
            onClick={() => openModal(heroEmailRef.current?.value || '')}
            style={{ padding: '13px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: 3, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Get started
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#ccc', marginTop: 16, letterSpacing: 0.2 }}>$1.99 / month · 7 days free · cancel anytime</p>
      </section>

      {/* Editorial statement */}
      <section style={{ borderTop: '1px solid #f0f0f0', padding: '120px 48px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <p className="f" style={{ fontSize: 'clamp(22px,2.5vw,30px)', fontWeight: 400, lineHeight: 1.65, color: '#222', marginBottom: 64 }}>
            Every morning, Sift reads the internet for you. Real sources. Real writing. Shaped entirely around whatever you tell us you care about — no predefined categories, no filters, no algorithm.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px 56px' }}>
            {[
              ['Your topics, your words', 'Type anything. A niche subject, an era, a market. The more specific, the better your briefing.'],
              ['Written, not aggregated', 'Our AI searches thousands of sources and writes prose. Not a link dump — a briefing.'],
              ['In your inbox at 7am', 'Before your day begins. Three minutes to read. Fully informed.'],
              ['Nothing else', 'No ads. No sponsors. No filler. Just what matters to you.'],
            ].map(([t, d]) => (
              <div key={t}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 10, letterSpacing: -0.1 }}>{t}</div>
                <div style={{ fontSize: 14, color: '#aaa', lineHeight: 1.8, fontWeight: 300 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ borderTop: '1px solid #f0f0f0', padding: '120px 48px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 64 }}>
          {[
            { q: 'I used to spend 45 minutes cycling through RSS feeds. Now I read Sift in three minutes and I\'m better informed.', name: 'James M.', role: 'Product designer, London' },
            { q: 'It feels like having a brilliant friend read the internet for you overnight. The coverage is genuinely nuanced.', name: 'Sarah C.', role: 'VC analyst, New York' },
            { q: 'The design alone is worth it. Every other newsletter I get looks amateurish by comparison.', name: 'Rahim K.', role: 'Founder, Berlin' },
          ].map((t, i) => (
            <div key={i} style={{ paddingTop: 28, borderTop: '1px solid #e8e8e8' }}>
              <p className="f" style={{ fontSize: 16, fontStyle: 'italic', fontWeight: 400, color: '#444', lineHeight: 1.8, marginBottom: 24 }}>"{t.q}"</p>
              <div style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#bbb', marginTop: 3 }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ borderTop: '1px solid #f0f0f0', padding: '120px 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 460, margin: '0 auto' }}>
          <h2 className="f" style={{ fontSize: 'clamp(44px,6vw,72px)', fontWeight: 400, letterSpacing: -2, color: '#111', lineHeight: 1, marginBottom: 20 }}>
            $1.99<span style={{ fontSize: '0.45em', letterSpacing: 0, fontWeight: 300, color: '#aaa', marginLeft: 6 }}>/mo</span>
          </h2>
          <p style={{ fontSize: 16, color: '#999', fontWeight: 300, lineHeight: 1.8, marginBottom: 44, maxWidth: 360, margin: '0 auto 44px' }}>
            One plan. Seven days free. No tiers, no annual lock-in. Cancel from your dashboard whenever you like.
          </p>
          <button onClick={() => openModal()} style={{ padding: '14px 40px', background: '#111', color: '#fff', border: 'none', borderRadius: 3, fontSize: 14, cursor: 'pointer', letterSpacing: 0.2 }}>
            Start your free trial
          </button>
          <p style={{ fontSize: 12, color: '#ccc', marginTop: 16 }}>No charge for 7 days.</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #f0f0f0', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="f" style={{ fontWeight: 700, fontSize: 14 }}>Sift</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => <a key={l} href="#" style={{ fontSize: 12, color: '#ccc' }}>{l}</a>)}
        </div>
        <span style={{ fontSize: 12, color: '#ddd' }}>© 2025 Sift</span>
      </footer>

      {/* Modal */}
      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '44px 40px', maxWidth: 420, width: '100%', position: 'relative' }}>
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#ccc', fontSize: 18, cursor: 'pointer', lineHeight: 1, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

            <div style={{ display: 'flex', gap: 4, marginBottom: 36 }}>
              {[1, 2].map(n => <div key={n} style={{ flex: 1, height: 1, background: step >= n ? '#111' : '#eee', transition: 'background 0.3s' }} />)}
            </div>

            {step === 1 && (
              <>
                <h3 className="f" style={{ fontSize: 24, fontWeight: 400, marginBottom: 6, color: '#111', letterSpacing: -0.5 }}>Create your account</h3>
                <p style={{ fontSize: 13, color: '#bbb', marginBottom: 32, fontWeight: 300 }}>7 days free — then $1.99/month.</p>
                {error && <p style={{ color: '#c00', fontSize: 13, marginBottom: 16 }}>{error}</p>}
                {[
                  { label: 'Name', val: name, set: setName, type: 'text', ph: 'Alex' },
                  { label: 'Email', val: email, set: setEmail, type: 'email', ph: 'you@email.com' },
                  { label: 'Password', val: password, set: setPassword, type: 'password', ph: '8+ characters' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: '#777', marginBottom: 6, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      style={{ width: '100%', padding: '11px 14px', border: '1px solid #e8e8e8', borderRadius: 3, fontSize: 14, outline: 'none', color: '#111', background: '#fff' }} />
                  </div>
                ))}
                <button onClick={handleSignup} disabled={loading}
                  style={{ width: '100%', marginTop: 8, padding: '13px', background: '#111', border: 'none', borderRadius: 3, color: '#fff', fontWeight: 500, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'One moment…' : 'Continue'}
                </button>
                <p style={{ fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 16 }}>No spam. Unsubscribe any time.</p>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="f" style={{ fontSize: 24, fontWeight: 400, marginBottom: 6, color: '#111', letterSpacing: -0.5 }}>What do you follow?</h3>
                <p style={{ fontSize: 13, color: '#bbb', marginBottom: 28, fontWeight: 300 }}>Type anything and press Enter — as specific as you like.</p>
                {error && <p style={{ color: '#c00', fontSize: 13, marginBottom: 12 }}>{error}</p>}

                <div onClick={() => topicInputRef.current?.focus()}
                  style={{ minHeight: 110, padding: '10px 12px', border: '1px solid #e8e8e8', borderRadius: 3, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-start', cursor: 'text', marginBottom: 20, background: '#fff' }}>
                  {topics.map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#111', padding: '4px 10px', borderRadius: 2, fontSize: 13, color: '#fff' }}>
                      {t}
                      <button onClick={() => setTopics(p => p.filter(x => x !== t))}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                  <input
                    ref={topicInputRef}
                    value={topicInput}
                    onChange={e => setTopicInput(e.target.value)}
                    onKeyDown={onTopicKey}
                    onBlur={addTopic}
                    placeholder={topics.length ? '' : 'e.g. Byzantine history, quantum computing…'}
                    style={{ background: 'none', border: 'none', outline: 'none', color: '#111', fontSize: 14, flex: 1, minWidth: 160, padding: '4px 2px' }}
                  />
                </div>

                <button onClick={handleFinish} disabled={loading}
                  style={{ width: '100%', padding: '13px', background: '#111', border: 'none', borderRadius: 3, color: '#fff', fontWeight: 500, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Redirecting…' : 'Continue to payment — $1.99/mo'}
                </button>
                <p style={{ fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 14 }}>No charge for 7 days. Cancel before then and pay nothing.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
