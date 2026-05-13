'use client'

import { useState, useEffect, useRef, KeyboardEvent, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.25 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(14px)',
      transition: `opacity 1.4s ease ${delay}s, transform 1.4s ease ${delay}s`,
    }}>
      {children}
    </div>
  )
}

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
        body { background: #0c0c0c; color: #c8c4b8; font-family: 'Courier Prime', 'Courier New', monospace; -webkit-font-smoothing: antialiased; }
        a { color: inherit; text-decoration: none; }
        button, input { font-family: 'Courier Prime', 'Courier New', monospace; }
        input::placeholder { color: #2e2e2e; }
        button { transition: opacity 0.2s; }
        button:hover { opacity: 0.5; }
        input:focus { outline: none; }
        @keyframes appear { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor::after { content: '_'; animation: blink 1.1s step-end infinite; }
        @keyframes fadeup { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Fixed top-left wordmark */}
      <div style={{ position: 'fixed', top: 32, left: 48, zIndex: 50 }}>
        <span style={{ fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: '#2e2e2e' }}>Sift</span>
      </div>
      <div style={{ position: 'fixed', top: 32, right: 48, zIndex: 50 }}>
        <button onClick={() => openModal()} style={{ background: 'none', border: 'none', fontSize: 11, color: '#2e2e2e', cursor: 'pointer', letterSpacing: 2 }}>sign in</button>
      </div>

      {/* Screen 1 — The hook */}
      <section style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'clamp(32px,5vw,56px)',
          fontWeight: 400,
          color: '#dedad2',
          lineHeight: 1.5,
          letterSpacing: -0.5,
          animation: 'appear 2s ease forwards',
        }}>
          You found this.
        </h1>
        <p style={{
          fontSize: 13,
          color: '#2a2a2a',
          marginTop: 32,
          letterSpacing: 2,
          animation: 'appear 2s 1.2s ease forwards',
          opacity: 0,
          animationFillMode: 'forwards',
        }}>scroll ↓</p>
      </section>

      {/* Screen 2 — What it is */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 72px', borderTop: '1px solid #141414' }}>
        <Reveal>
          <p style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 400, color: '#dedad2', lineHeight: 1.55, maxWidth: 580 }}>
            Every morning, a briefing<br />arrives in your inbox.
          </p>
        </Reveal>
        <Reveal delay={0.35}>
          <p style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 400, color: '#555', lineHeight: 1.55, marginTop: 20 }}>
            Written for you.<br />About the things you follow.
          </p>
        </Reveal>
        <Reveal delay={0.7}>
          <p style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 400, color: '#282828', lineHeight: 1.55, marginTop: 20 }}>
            Nobody else receives yours.
          </p>
        </Reveal>
      </section>

      {/* Screen 3 — How */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 72px', borderTop: '1px solid #141414' }}>
        <Reveal>
          <p style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 56 }}>how it works</p>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{ fontSize: 'clamp(18px,2.2vw,28px)', color: '#8a8578', lineHeight: 1.9, maxWidth: 540 }}>
            Tell us what you care about.<br />
            Any subject. Any obsession. Any niche.<br />
            The more specific, the better.
          </p>
        </Reveal>
        <Reveal delay={0.5}>
          <p style={{ fontSize: 'clamp(18px,2.2vw,28px)', color: '#3a3a3a', lineHeight: 1.9, maxWidth: 540, marginTop: 32 }}>
            We read the internet overnight.<br />
            We write it up.<br />
            It arrives before you wake.
          </p>
        </Reveal>
        <Reveal delay={0.8}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 520, marginTop: 52 }}>
            {['Byzantine history', 'Formula 1', 'quantum computing', 'venture capital', 'literary fiction', 'ocean science', 'central banking', 'anything you want'].map(t => (
              <span key={t} style={{ fontSize: 11, color: '#2e2e2e', border: '1px solid #1a1a1a', padding: '5px 12px', letterSpacing: 0.8 }}>{t}</span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Screen 4 — Price */}
      <section style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 72px', borderTop: '1px solid #141414' }}>
        <Reveal>
          <p style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>one plan</p>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{ fontSize: 'clamp(52px,9vw,100px)', fontWeight: 400, color: '#dedad2', letterSpacing: -3, lineHeight: 1 }}>
            $1.99
          </p>
        </Reveal>
        <Reveal delay={0.4}>
          <p style={{ fontSize: 15, color: '#3a3a3a', marginTop: 28, lineHeight: 2, letterSpacing: 0.3 }}>
            per month.<br />
            seven days free.<br />
            cancel anytime.
          </p>
        </Reveal>
      </section>

      {/* Screen 5 — CTA */}
      <section style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 72px', borderTop: '1px solid #141414' }}>
        <Reveal>
          <p style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 48 }}>begin</p>
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1e1e1e', paddingBottom: 14, gap: 12, maxWidth: 500 }}>
            <span style={{ color: '#2e2e2e', fontSize: 14 }}>&gt;</span>
            <input
              ref={heroEmailRef}
              type="email"
              placeholder="your email address"
              style={{ background: 'none', border: 'none', fontSize: 15, color: '#c8c4b8', flex: 1, letterSpacing: 0.3 }}
            />
            <button
              onClick={() => openModal(heroEmailRef.current?.value || '')}
              style={{ background: 'none', border: 'none', fontSize: 12, color: '#444', cursor: 'pointer', letterSpacing: 2, whiteSpace: 'nowrap' }}
            >
              enter →
            </button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 72px', borderTop: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#1e1e1e', letterSpacing: 2 }}>SIFT © 2025</span>
        <div style={{ display: 'flex', gap: 28 }}>
          {['privacy', 'terms'].map(l => <a key={l} href="#" style={{ fontSize: 11, color: '#1e1e1e', letterSpacing: 1 }}>{l}</a>)}
        </div>
      </footer>

      {/* Modal */}
      {modal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div style={{ background: '#0c0c0c', border: '1px solid #1a1a1a', padding: '48px 44px', maxWidth: 420, width: '100%', position: 'relative', animation: 'appear 0.4s ease forwards' }}>
            <button
              onClick={() => setModal(false)}
              style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#2a2a2a', fontSize: 16, cursor: 'pointer' }}
            >×</button>

            <p style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>
              {step === 1 ? '01 / 02' : '02 / 02'}
            </p>

            {step === 1 && (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 400, color: '#dedad2', marginBottom: 8, letterSpacing: -0.3 }}>
                  create your account<span className="cursor" />
                </h3>
                <p style={{ fontSize: 13, color: '#333', marginBottom: 44, lineHeight: 1.7 }}>seven days free — then $1.99/month.</p>

                {error && <p style={{ color: '#7a3a3a', fontSize: 12, marginBottom: 24, letterSpacing: 0.3 }}>{error}</p>}

                {[
                  { label: 'name', val: name, set: setName, type: 'text', ph: 'your name' },
                  { label: 'email', val: email, set: setEmail, type: 'email', ph: 'your email' },
                  { label: 'password', val: password, set: setPassword, type: 'password', ph: '8+ characters' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #181818', paddingBottom: 10, gap: 16 }}>
                      <span style={{ fontSize: 11, color: '#2e2e2e', letterSpacing: 2, minWidth: 64 }}>{f.label}</span>
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
                  style={{ marginTop: 8, width: '100%', background: 'none', border: '1px solid #1e1e1e', color: '#8a8578', padding: '13px', fontSize: 12, cursor: 'pointer', letterSpacing: 2, opacity: loading ? 0.3 : 1 }}
                >
                  {loading ? 'one moment...' : 'continue →'}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 400, color: '#dedad2', marginBottom: 8, letterSpacing: -0.3 }}>
                  what do you follow<span className="cursor" />
                </h3>
                <p style={{ fontSize: 13, color: '#333', marginBottom: 44, lineHeight: 1.7 }}>type anything. press enter to add.</p>

                {error && <p style={{ color: '#7a3a3a', fontSize: 12, marginBottom: 16, letterSpacing: 0.3 }}>{error}</p>}

                <div
                  onClick={() => topicInputRef.current?.focus()}
                  style={{ minHeight: 100, borderBottom: '1px solid #181818', paddingBottom: 16, marginBottom: 32, cursor: 'text' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: topics.length ? 12 : 0 }}>
                    {topics.map(t => (
                      <span key={t} style={{ fontSize: 11, color: '#555', letterSpacing: 0.5 }}>
                        [{t}
                        <button
                          onClick={() => setTopics(p => p.filter(x => x !== t))}
                          style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 12, padding: '0 0 0 3px' }}
                        >×</button>]
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#2e2e2e', fontSize: 13 }}>&gt;</span>
                    <input
                      ref={topicInputRef}
                      value={topicInput}
                      onChange={e => setTopicInput(e.target.value)}
                      onKeyDown={onTopicKey}
                      onBlur={addTopic}
                      placeholder={topics.length ? '' : 'byzantine history, formula 1...'}
                      style={{ background: 'none', border: 'none', fontSize: 13, color: '#c8c4b8', flex: 1 }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleFinish}
                  disabled={loading}
                  style={{ width: '100%', background: 'none', border: '1px solid #1e1e1e', color: '#8a8578', padding: '13px', fontSize: 12, cursor: 'pointer', letterSpacing: 2, opacity: loading ? 0.3 : 1 }}
                >
                  {loading ? 'redirecting...' : 'continue to payment →'}
                </button>
                <p style={{ fontSize: 11, color: '#1e1e1e', textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>no charge for seven days.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
