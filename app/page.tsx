'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

const TESTIMONIALS = [
  { q: 'I used to spend 45 minutes cycling through RSS feeds. Now I read Sift in three minutes and I\'m better informed.', name: 'James M.', role: 'Product designer, London' },
  { q: 'It feels like having a brilliant friend read the internet for you overnight. The finance coverage is surprisingly nuanced.', name: 'Sarah C.', role: 'VC analyst, New York' },
  { q: 'The design alone is worth the subscription. Every other newsletter looks amateurish by comparison.', name: 'Rahim K.', role: 'Founder, Berlin' },
]

export default function Home() {
  const supabase = createClient()
  const [scrolled, setScrolled] = useState(false)
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
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    if (t && !topics.includes(t)) setTopics(prev => [...prev, t])
    setTopicInput('')
  }

  function handleTopicKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTopic() }
    if (e.key === 'Backspace' && !topicInput && topics.length) {
      setTopics(prev => prev.slice(0, -1))
    }
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

  async function handleTopicsContinue() {
    if (!topics.length) { setError('Add at least one interest.'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('interests').update({ topics }).eq('user_id', user.id)
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0e0d0b; color: #ede8df; font-family: 'DM Sans', sans-serif; overflow-x: hidden; line-height: 1.6; }
        ::selection { background: rgba(201,169,110,0.25); }
        .serif { font-family: 'Playfair Display', serif; }
        .wrap { max-width: 1080px; margin: 0 auto; padding: 0 32px; }
        input, button, textarea { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, transition: 'all 0.3s', background: scrolled ? 'rgba(14,13,11,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
          <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: '#ede8df' }}>Sift</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button onClick={() => openModal()} style={{ background: 'none', border: 'none', color: '#7a7468', fontSize: 14, cursor: 'pointer' }}>Sign in</button>
            <button onClick={() => openModal()} style={{ background: '#c9a96e', border: 'none', color: '#0e0d0b', padding: '9px 20px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Start free trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '160px 0 100px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap">
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 28 }}>Daily intelligence</p>
          <h1 className="serif" style={{ fontSize: 'clamp(52px, 7vw, 96px)', fontWeight: 500, lineHeight: 1.06, letterSpacing: -2, maxWidth: 820, marginBottom: 32, color: '#ede8df' }}>
            The internet,<br /><em style={{ fontStyle: 'italic', color: '#c9a96e' }}>sifted</em> for you.
          </h1>
          <p style={{ fontSize: 18, color: '#7a7468', maxWidth: 480, lineHeight: 1.75, marginBottom: 48 }}>
            One beautifully written email, every morning. Curated entirely around your interests — nothing else.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <input ref={heroEmailRef} type="email" placeholder="your@email.com"
              style={{ padding: '13px 18px', background: '#1c1b17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#ede8df', fontSize: 15, outline: 'none', width: 280 }} />
            <button onClick={() => openModal(heroEmailRef.current?.value || '')}
              style={{ background: '#c9a96e', border: 'none', color: '#0e0d0b', padding: '13px 24px', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Get started
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#4a4840' }}>$1.99 per month. 7-day free trial. Cancel anytime.</p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '56px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#141410' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {[['14,200', 'Readers worldwide'], ['97%', 'Average open rate'], ['4.9 / 5', 'Reader satisfaction'], ['3 min', 'Average read time']].map(([num, label], i) => (
              <div key={i} style={{ padding: '0 32px 0 0', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div className="serif" style={{ fontSize: 36, fontWeight: 500, color: '#ede8df', letterSpacing: -1, marginBottom: 4 }}>{num}</div>
                <div style={{ fontSize: 13, color: '#7a7468' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 20 }}>How it works</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.5, color: '#ede8df' }}>
                Set it once.<br />Read every morning.
              </h2>
            </div>
            <div>
              {[
                ['I.', 'Tell us what you care about', 'Type anything — a topic, a subject, a specific niche. There are no predefined categories. If you care about it, we\'ll find it.'],
                ['II.', 'We read the internet overnight', 'Our AI scans thousands of sources every night, finds what matters to you, and writes it up clearly, without the noise.'],
                ['III.', 'It lands before you wake up', 'At 7am in your timezone, a beautiful, scannable briefing hits your inbox. Three minutes. Fully informed.'],
              ].map(([num, title, desc]) => (
                <div key={num as string} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', padding: '32px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="serif" style={{ fontSize: 13, color: '#4a4840', fontStyle: 'italic', paddingTop: 3 }}>{num}</div>
                  <div>
                    <div className="serif" style={{ fontSize: 20, fontWeight: 500, color: '#ede8df', marginBottom: 8 }}>{title as string}</div>
                    <div style={{ fontSize: 14, color: '#7a7468', lineHeight: 1.7 }}>{desc as string}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter preview */}
      <section style={{ padding: '100px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#141410' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 20 }}>The product</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 20, color: '#ede8df' }}>
                Genuinely beautiful to read.
              </h2>
              <p style={{ fontSize: 15, color: '#7a7468', lineHeight: 1.8, marginBottom: 36 }}>
                Not a wall of links. Not a scrape-and-paste job. Sift writes clean, considered summaries that respect your time and your intelligence.
              </p>
              {[['No sponsored content', 'Ever.'], ['Completely yours', 'Shaped entirely by what you tell us you care about.'], ['Arrives at 7am', 'In your timezone, before you reach for your phone.']].map(([t, d]) => (
                <div key={t as string} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c9a96e', marginTop: 8, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#ede8df' }}>{t as string}</span>
                    <span style={{ fontSize: 15, color: '#7a7468' }}> — {d as string}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mockup */}
            <div style={{ background: '#faf8f4', borderRadius: 12, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ background: '#1a1814', padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, color: '#ede8df', fontSize: 16 }}>Sift</span>
                <span style={{ fontSize: 11, color: '#7a7468', letterSpacing: 0.5 }}>Wednesday, 13 May</span>
              </div>
              <div style={{ padding: '22px 28px', borderBottom: '1px solid #ede9e0' }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#9e9488', marginBottom: 4, fontFamily: "'DM Sans',sans-serif" }}>Good morning, Alex</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, color: '#1a1814', fontWeight: 500 }}>Your 4-minute briefing.</div>
              </div>
              {[
                { tag: 'Technology', title: 'OpenAI releases new reasoning model with 10× faster inference', body: 'The latest model sets new benchmarks on code generation and outperforms competitors on latency...' },
                { tag: 'Markets', title: 'Fed signals rate pause as inflation data surprises', body: 'Core PCE came in below expectations for the third consecutive month, easing pressure...' },
                { tag: 'World', title: 'EU Parliament passes landmark AI accountability directive', body: 'Companies deploying high-risk AI face mandatory audits and new transparency requirements...' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 28px', borderBottom: '1px solid #ede9e0' }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 4, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{item.tag}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 500, color: '#1a1814', marginBottom: 3, lineHeight: 1.4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#9e9488', lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{item.body}</div>
                </div>
              ))}
              <div style={{ padding: '12px 28px', background: '#f2efe8' }}>
                <div style={{ fontSize: 11, color: '#b5b0a5', textAlign: 'center' as const, fontFamily: "'DM Sans',sans-serif" }}>Curated by Sift · Manage preferences · Unsubscribe</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '100px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 20 }}>Pricing</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16, color: '#ede8df' }}>
                One plan.<br />$1.99 a month.
              </h2>
              <p style={{ fontSize: 15, color: '#7a7468', lineHeight: 1.8 }}>No tiers. No upsells. No annual trap. Just your daily briefing for less than a cup of tea.</p>
            </div>
            <div style={{ background: '#141410', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '40px 36px' }}>
              <div className="serif" style={{ fontSize: 64, fontWeight: 500, color: '#ede8df', letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>$1</div>
              <div style={{ fontSize: 14, color: '#4a4840', marginBottom: 28 }}>per month, billed monthly</div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10, marginBottom: 32 }}>
                {['Daily newsletter, 7 days a week', 'Unlimited custom interests', 'Delivered at 7am your time', 'Update your topics any time', '7-day free trial to start'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: '#c9a96e', marginTop: 1 }}>—</span>
                    <span style={{ fontSize: 14, color: '#7a7468' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => openModal()} style={{ width: '100%', padding: '13px', background: '#c9a96e', border: 'none', borderRadius: 6, color: '#0e0d0b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Start your free trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '100px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#141410' }}>
        <div className="wrap">
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 64 }}>What readers say</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i}>
                <p className="serif" style={{ fontSize: 16, color: '#ede8df', lineHeight: 1.75, marginBottom: 24, fontStyle: 'italic' }}>"{t.q}"</p>
                <div style={{ width: 24, height: 1, background: 'rgba(201,169,110,0.4)', marginBottom: 16 }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: '#ede8df' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#4a4840', marginTop: 2 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '120px 0', background: '#141410' }}>
        <div className="wrap">
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 24 }}>Join 14,000 readers</p>
          <h2 className="serif" style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 500, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 40, maxWidth: 640, color: '#ede8df' }}>
            Stop doom-scrolling.<br /><em>Start your morning right.</em>
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center' }}>
            <button onClick={() => openModal()} style={{ background: '#c9a96e', border: 'none', color: '#0e0d0b', padding: '14px 28px', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Start your free trial
            </button>
            <span style={{ fontSize: 13, color: '#4a4840' }}>$1.99/month. 7 days free. Cancel anytime.</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '36px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
          <span className="serif" style={{ fontSize: 16, fontWeight: 600, color: '#ede8df' }}>Sift</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: '#4a4840', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#4a4840' }}>© 2025 Sift</span>
        </div>
      </footer>

      {/* Modal */}
      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#141410', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '48px 40px', maxWidth: 480, width: '100%', position: 'relative' }}>
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#4a4840', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>

            <div style={{ display: 'flex', gap: 4, marginBottom: 36 }}>
              {[1, 2].map(n => (
                <div key={n} style={{ flex: 1, height: 2, borderRadius: 1, background: step >= n ? '#c9a96e' : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />
              ))}
            </div>

            {step === 1 && (
              <>
                <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, marginBottom: 6, color: '#ede8df' }}>Create your account</h3>
                <p style={{ fontSize: 14, color: '#7a7468', marginBottom: 28 }}>7 days free — then $1.99/month. No card needed today.</p>
                {error && <p style={{ color: '#e07070', fontSize: 13, marginBottom: 16 }}>{error}</p>}
                {[
                  { label: 'Your name', val: name, set: setName, type: 'text', ph: 'Alex' },
                  { label: 'Email address', val: email, set: setEmail, type: 'email', ph: 'you@email.com' },
                  { label: 'Password', val: password, set: setPassword, type: 'password', ph: 'At least 8 characters' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#7a7468', marginBottom: 6, display: 'block', letterSpacing: 0.3 }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      style={{ width: '100%', padding: '12px 14px', background: '#1c1b17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#ede8df', fontSize: 14, outline: 'none' }} />
                  </div>
                ))}
                <button onClick={handleSignup} disabled={loading}
                  style={{ width: '100%', padding: '13px', background: '#c9a96e', border: 'none', borderRadius: 6, color: '#0e0d0b', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 6, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating account…' : 'Continue'}
                </button>
                <p style={{ fontSize: 12, color: '#4a4840', textAlign: 'center' as const, marginTop: 14 }}>No spam. Unsubscribe in one click.</p>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, marginBottom: 6, color: '#ede8df' }}>What do you follow?</h3>
                <p style={{ fontSize: 14, color: '#7a7468', marginBottom: 24 }}>Type anything — topics, niches, subjects. Press <kbd style={{ background: '#1c1b17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px', fontSize: 11, color: '#7a7468' }}>Enter</kbd> to add each one.</p>
                {error && <p style={{ color: '#e07070', fontSize: 13, marginBottom: 12 }}>{error}</p>}

                {/* Tag input */}
                <div onClick={() => topicInputRef.current?.focus()}
                  style={{ minHeight: 100, padding: '10px 12px', background: '#1c1b17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, display: 'flex', flexWrap: 'wrap' as const, gap: 6, alignItems: 'flex-start', cursor: 'text', marginBottom: 24 }}>
                  {topics.map(t => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 4, padding: '4px 10px', fontSize: 13, color: '#c9a96e' }}>
                      {t}
                      <button onClick={() => setTopics(prev => prev.filter(x => x !== t))}
                        style={{ background: 'none', border: 'none', color: '#c9a96e', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.6 }}>×</button>
                    </span>
                  ))}
                  <input
                    ref={topicInputRef}
                    value={topicInput}
                    onChange={e => setTopicInput(e.target.value)}
                    onKeyDown={handleTopicKey}
                    onBlur={addTopic}
                    placeholder={topics.length ? '' : 'e.g. Byzantine history, quantum computing, Serie A…'}
                    style={{ background: 'none', border: 'none', outline: 'none', color: '#ede8df', fontSize: 14, flex: 1, minWidth: 120, padding: '4px 2px' }}
                  />
                </div>

                <button onClick={handleTopicsContinue} disabled={loading}
                  style={{ width: '100%', padding: '13px', background: '#c9a96e', border: 'none', borderRadius: 6, color: '#0e0d0b', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Redirecting to payment…' : 'Continue to payment — $1.99/month'}
                </button>
                <p style={{ fontSize: 12, color: '#4a4840', textAlign: 'center' as const, marginTop: 14 }}>No charge for 7 days. Cancel before then and pay nothing.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
