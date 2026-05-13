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

  function onHeroEmailKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') openModal(heroEmailRef.current?.value || '')
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
        input:focus { outline: none; }
        button { transition: opacity 0.2s, transform 0.2s; }
        button:hover { opacity: 0.6; }
        .arrow { display: inline-block; transition: transform 0.25s ease; }
        .submit:hover .arrow { transform: translateX(4px); }
        @keyframes appear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor { display: inline-block; width: 8px; background: #c8c4b8; height: 1.05em; vertical-align: -0.15em; animation: blink 1.1s step-end infinite; margin-left: 2px; }
        .a1 { animation: appear 1.2s ease 0.1s both; }
        .a2 { animation: appear 1.2s ease 0.4s both; }
        .a3 { animation: appear 1.2s ease 0.7s both; }
        .a4 { animation: appear 1.2s ease 1.0s both; }
        .a5 { animation: appear 1.2s ease 1.3s both; }
        .a6 { animation: appear 1.4s ease 1.6s both; }
      `}</style>

      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="a1" style={{ fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', color: '#5a564c' }}>Sift</span>
        <button onClick={() => openModal()} className="a1" style={{ background: 'none', border: 'none', fontSize: 11, color: '#5a564c', cursor: 'pointer', letterSpacing: 2 }}>sign in</button>
      </header>

      {/* Hero — single confident screen */}
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 40px 80px', position: 'relative' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>

          <p className="a2" style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#5a564c', marginBottom: 56 }}>
            — a daily briefing
          </p>

          <h1 className="a3" style={{ fontSize: 'clamp(34px,5vw,54px)', fontWeight: 400, color: '#e6e1d4', lineHeight: 1.35, letterSpacing: -0.5, marginBottom: 28 }}>
            The internet,<br />
            written for you alone.
          </h1>

          <p className="a4" style={{ fontSize: 16, color: '#7a7468', lineHeight: 1.85, marginBottom: 64, maxWidth: 480 }}>
            Every morning, a briefing arrives in your inbox — shaped around the subjects you follow, no two readers receive the same one.
          </p>

          <div className="a5" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2620', paddingBottom: 14, gap: 14 }}>
              <span style={{ color: '#5a564c', fontSize: 14 }}>&gt;</span>
              <input
                ref={heroEmailRef}
                type="email"
                placeholder="your email address"
                onKeyDown={onHeroEmailKey}
                style={{ background: 'none', border: 'none', fontSize: 15, color: '#e6e1d4', flex: 1, letterSpacing: 0.3 }}
              />
              <button
                onClick={() => openModal(heroEmailRef.current?.value || '')}
                className="submit"
                style={{ background: 'none', border: 'none', fontSize: 12, color: '#9a9384', cursor: 'pointer', letterSpacing: 2, whiteSpace: 'nowrap', textTransform: 'uppercase' }}
              >
                begin <span className="arrow">→</span>
              </button>
            </div>
          </div>

          <p className="a6" style={{ fontSize: 12, color: '#3a3630', letterSpacing: 0.5, marginTop: 18 }}>
            $1.99 / month &nbsp;·&nbsp; seven days free &nbsp;·&nbsp; cancel anytime
          </p>

        </div>

        {/* Subtle scroll cue */}
        <button
          onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
          className="a6"
          style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', background: 'none', border: 'none', color: '#3a3630', fontSize: 11, letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase' }}
        >
          a sample ↓
        </button>
      </main>

      {/* Sample preview — what you actually get */}
      <section id="preview" style={{ minHeight: '100vh', padding: '120px 40px', borderTop: '1px solid #161310', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#5a564c', marginBottom: 32 }}>
            — a recent edition
          </p>

          <div style={{ border: '1px solid #1c1915', padding: '36px 40px', background: '#0e0d0a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid #1c1915' }}>
              <span style={{ fontSize: 12, letterSpacing: 4, color: '#7a7468', textTransform: 'uppercase' }}>Sift</span>
              <span style={{ fontSize: 11, color: '#3a3630', letterSpacing: 1 }}>Wed, 13 May</span>
            </div>

            <p style={{ fontSize: 11, letterSpacing: 2, color: '#5a564c', textTransform: 'uppercase', marginBottom: 8 }}>good morning, alex</p>
            <p style={{ fontSize: 18, color: '#e6e1d4', marginBottom: 36, fontStyle: 'italic' }}>your briefing is ready.</p>

            {[
              { tag: 'quantum computing', headline: 'IBM\'s 1,000-qubit prototype hits coherence threshold.', body: 'A milestone the field has been chasing for half a decade. The implications for cryptography are not subtle.' },
              { tag: 'venture capital', headline: 'A quiet down-round in the AI infrastructure space.', body: 'The valuation correction nobody wanted to write about. But the underlying business is, by most accounts, still real.' },
              { tag: 'central banking', headline: 'The ECB hints at an unusual policy divergence.', body: 'Lagarde\'s phrasing was specific. Markets noticed; analysts are still parsing what she chose not to say.' },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: 28, paddingBottom: i < 2 ? 28 : 0, borderBottom: i < 2 ? '1px solid #1c1915' : 'none' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: '#5a564c', textTransform: 'uppercase', marginBottom: 8 }}>{s.tag}</p>
                <p style={{ fontSize: 15, color: '#c8c4b8', lineHeight: 1.55, marginBottom: 8 }}>{s.headline}</p>
                <p style={{ fontSize: 13, color: '#6a6458', lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: '#3a3630', marginTop: 28, lineHeight: 1.85, letterSpacing: 0.3 }}>
            That edition went to one reader. Yours will be different — your subjects, your obsessions, your morning.
          </p>

          <button
            onClick={() => openModal()}
            className="submit"
            style={{ marginTop: 40, background: 'none', border: '1px solid #2a2620', color: '#c8c4b8', padding: '14px 28px', fontSize: 12, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' }}
          >
            begin your trial <span className="arrow">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px 40px', borderTop: '1px solid #161310', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#2a2620', letterSpacing: 2 }}>SIFT &nbsp;·&nbsp; mmxxv</span>
        <div style={{ display: 'flex', gap: 28 }}>
          {['privacy', 'terms', 'contact'].map(l => <a key={l} href="#" style={{ fontSize: 11, color: '#2a2620', letterSpacing: 1 }}>{l}</a>)}
        </div>
      </footer>

      {/* Modal */}
      {modal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'appear 0.3s ease' }}
        >
          <div style={{ background: '#0e0d0a', border: '1px solid #1c1915', padding: '44px 40px', maxWidth: 420, width: '100%', position: 'relative' }}>
            <button
              onClick={() => setModal(false)}
              style={{ position: 'absolute', top: 18, right: 22, background: 'none', border: 'none', color: '#3a3630', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
            >×</button>

            <p style={{ fontSize: 11, color: '#5a564c', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 36 }}>
              {step === 1 ? 'step 01 / 02' : 'step 02 / 02'}
            </p>

            {step === 1 && (
              <>
                <h3 style={{ fontSize: 22, fontWeight: 400, color: '#e6e1d4', marginBottom: 8, letterSpacing: -0.3 }}>
                  create your account
                </h3>
                <p style={{ fontSize: 13, color: '#5a564c', marginBottom: 40, lineHeight: 1.7 }}>seven days free, then $1.99 / month.</p>

                {error && <p style={{ color: '#9a5a4a', fontSize: 12, marginBottom: 20, letterSpacing: 0.3 }}>{error}</p>}

                {[
                  { label: 'name', val: name, set: setName, type: 'text', ph: 'your name' },
                  { label: 'email', val: email, set: setEmail, type: 'email', ph: 'your email' },
                  { label: 'password', val: password, set: setPassword, type: 'password', ph: '8+ characters' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 26 }}>
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1c1915', paddingBottom: 10, gap: 16 }}>
                      <span style={{ fontSize: 11, color: '#5a564c', letterSpacing: 2, minWidth: 64 }}>{f.label}</span>
                      <input
                        type={f.type}
                        value={f.val}
                        onChange={e => f.set(e.target.value)}
                        placeholder={f.ph}
                        style={{ background: 'none', border: 'none', fontSize: 14, color: '#e6e1d4', flex: 1, letterSpacing: 0.2 }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="submit"
                  style={{ marginTop: 12, width: '100%', background: 'none', border: '1px solid #2a2620', color: '#c8c4b8', padding: '14px', fontSize: 12, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', opacity: loading ? 0.4 : 1 }}
                >
                  {loading ? 'one moment...' : <>continue <span className="arrow">→</span></>}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h3 style={{ fontSize: 22, fontWeight: 400, color: '#e6e1d4', marginBottom: 8, letterSpacing: -0.3 }}>
                  what do you follow
                </h3>
                <p style={{ fontSize: 13, color: '#5a564c', marginBottom: 40, lineHeight: 1.7 }}>
                  type anything. press enter. as specific as you like.
                </p>

                {error && <p style={{ color: '#9a5a4a', fontSize: 12, marginBottom: 16, letterSpacing: 0.3 }}>{error}</p>}

                <div
                  onClick={() => topicInputRef.current?.focus()}
                  style={{ minHeight: 100, borderBottom: '1px solid #1c1915', paddingBottom: 16, marginBottom: 32, cursor: 'text' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: topics.length ? 14 : 0 }}>
                    {topics.map(t => (
                      <span key={t} style={{ fontSize: 12, color: '#9a9384', letterSpacing: 0.3 }}>
                        [{t}
                        <button
                          onClick={() => setTopics(p => p.filter(x => x !== t))}
                          style={{ background: 'none', border: 'none', color: '#3a3630', cursor: 'pointer', fontSize: 13, padding: '0 0 0 4px' }}
                        >×</button>]
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#5a564c', fontSize: 13 }}>&gt;</span>
                    <input
                      ref={topicInputRef}
                      value={topicInput}
                      onChange={e => setTopicInput(e.target.value)}
                      onKeyDown={onTopicKey}
                      onBlur={addTopic}
                      placeholder={topics.length ? '' : 'byzantine history, formula 1...'}
                      style={{ background: 'none', border: 'none', fontSize: 14, color: '#e6e1d4', flex: 1 }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="submit"
                  style={{ width: '100%', background: 'none', border: '1px solid #2a2620', color: '#c8c4b8', padding: '14px', fontSize: 12, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', opacity: loading ? 0.4 : 1 }}
                >
                  {loading ? 'redirecting...' : <>continue to payment <span className="arrow">→</span></>}
                </button>
                <p style={{ fontSize: 11, color: '#3a3630', textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>no charge for seven days.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
