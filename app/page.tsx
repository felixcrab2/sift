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
    if (e.key === 'Backspace' && !topicInput && topics.length) setTopics(prev => prev.slice(0, -1))
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
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #f0ebe0; color: #1a1612; font-family: 'DM Sans', sans-serif; overflow-x: hidden; line-height: 1.6; }
        ::selection { background: rgba(181,137,58,0.2); }
        .serif { font-family: 'Playfair Display', serif; }
        .mono { font-family: 'Courier New', Courier, monospace; }
        .wrap { max-width: 960px; margin: 0 auto; padding: 0 40px; }
        .wrap-wide { max-width: 1100px; margin: 0 auto; padding: 0 40px; }
        .rule { border: none; border-top: 1px solid rgba(26,22,18,0.12); }
        .rule-heavy { border: none; border-top: 2px solid #1a1612; }
        input, button, textarea { font-family: 'DM Sans', sans-serif; }
        .label { font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #9e9185; }
        .gold { color: #b5893a; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        background: scrolled ? 'rgba(240,235,224,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(26,22,18,0.1)' : 'none',
        transition: 'all 0.4s',
      }}>
        <div className="wrap-wide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px' }}>
          <span className="serif" style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.5, color: '#1a1612' }}>Sift</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <button onClick={() => openModal()} style={{ background: 'none', border: 'none', color: '#9e9185', fontSize: 13, cursor: 'pointer', fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>Sign in</button>
            <button onClick={() => openModal()} style={{ background: '#1a1612', border: 'none', color: '#f0ebe0', padding: '9px 22px', fontSize: 12, fontWeight: 500, cursor: 'pointer', letterSpacing: 1.5, fontFamily: "'Courier New', Courier, monospace", textTransform: 'uppercase' }}>
              Subscribe
            </button>
          </div>
        </div>
      </nav>

      {/* ── Masthead Hero ── */}
      <section style={{ paddingTop: 120, paddingBottom: 0, borderBottom: '2px solid #1a1612' }}>
        <div className="wrap" style={{ textAlign: 'center', paddingTop: 60, paddingBottom: 0 }}>

          {/* Masthead line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="mono" style={{ fontSize: 10, color: '#9e9185', letterSpacing: 2 }}>Est. 2025</span>
            <span className="mono" style={{ fontSize: 10, color: '#9e9185', letterSpacing: 2 }}>{today}</span>
            <span className="mono" style={{ fontSize: 10, color: '#9e9185', letterSpacing: 2 }}>sift-daily.com</span>
          </div>

          <hr className="rule-heavy" style={{ marginBottom: 28 }} />

          <h1 className="serif" style={{ fontSize: 'clamp(72px, 12vw, 148px)', fontWeight: 700, lineHeight: 0.92, letterSpacing: -4, color: '#1a1612', marginBottom: 20 }}>
            Sift
          </h1>

          <hr className="rule-heavy" style={{ marginBottom: 20 }} />
          <hr className="rule" style={{ marginBottom: 32 }} />

          <p className="serif" style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', fontStyle: 'italic', fontWeight: 400, color: '#3a3430', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.5 }}>
            The internet, read and distilled for you — every morning, before you wake.
          </p>

          <div style={{ display: 'flex', gap: 0, maxWidth: 440, margin: '0 auto 16px', border: '1px solid rgba(26,22,18,0.2)' }}>
            <input
              ref={heroEmailRef}
              type="email"
              placeholder="your@email.com"
              style={{ flex: 1, padding: '14px 18px', background: '#f8f4ec', border: 'none', outline: 'none', fontSize: 14, color: '#1a1612', fontFamily: "'Courier New', monospace" }}
            />
            <button
              onClick={() => openModal(heroEmailRef.current?.value || '')}
              style={{ background: '#1a1612', border: 'none', color: '#f0ebe0', padding: '14px 24px', fontSize: 11, fontWeight: 500, cursor: 'pointer', letterSpacing: 2, fontFamily: "'Courier New', Courier, monospace", textTransform: 'uppercase', whiteSpace: 'nowrap' }}
            >
              Get started
            </button>
          </div>
          <p className="mono" style={{ fontSize: 10, color: '#b5ae9f', letterSpacing: 1.5, marginBottom: 64 }}>$1.99 / month · 7-day free trial · cancel anytime</p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ borderBottom: '1px solid rgba(26,22,18,0.12)', background: '#e8e2d5' }}>
        <div className="wrap-wide">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[['14,200', 'Readers worldwide'], ['97%', 'Open rate'], ['4.9/5', 'Satisfaction'], ['3 min', 'Read time']].map(([num, label], i) => (
              <div key={i} style={{ padding: '28px 0', paddingLeft: i > 0 ? 32 : 0, borderLeft: i > 0 ? '1px solid rgba(26,22,18,0.1)' : 'none', marginLeft: i > 0 ? 0 : 0 }}>
                <div className="serif" style={{ fontSize: 32, fontWeight: 700, color: '#1a1612', letterSpacing: -1, lineHeight: 1 }}>{num}</div>
                <div className="mono" style={{ fontSize: 9, color: '#9e9185', letterSpacing: 2, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '88px 0', borderBottom: '1px solid rgba(26,22,18,0.12)' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 64, alignItems: 'start' }}>
            <div style={{ paddingTop: 6 }}>
              <div className="label" style={{ marginBottom: 12 }}>How it works</div>
              <hr className="rule" />
            </div>
            <div>
              {[
                ['I.', 'Tell us what you care about', 'Type anything — a subject, a niche, a passion. There are no predefined categories. Your briefing is shaped entirely by you.'],
                ['II.', 'We read the internet overnight', 'Our AI searches thousands of sources each night, finds what is actually interesting, and writes it up with care.'],
                ['III.', 'It arrives before you wake', 'At 7am in your timezone, a clean, beautiful briefing is in your inbox. Three minutes to read. Fully informed.'],
              ].map(([num, title, desc], i) => (
                <div key={num as string} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', paddingBottom: 36, marginBottom: 36, borderBottom: i < 2 ? '1px solid rgba(26,22,18,0.08)' : 'none' }}>
                  <div className="mono" style={{ fontSize: 11, color: '#b5ae9f', paddingTop: 4 }}>{num}</div>
                  <div>
                    <div className="serif" style={{ fontSize: 22, fontWeight: 500, color: '#1a1612', marginBottom: 8, lineHeight: 1.2 }}>{title as string}</div>
                    <div style={{ fontSize: 14, color: '#6b6356', lineHeight: 1.75 }}>{desc as string}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter preview ── */}
      <section style={{ padding: '88px 0', borderBottom: '1px solid rgba(26,22,18,0.12)', background: '#e8e2d5' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }}>
            <div>
              <div className="label" style={{ marginBottom: 16 }}>The product</div>
              <hr className="rule" style={{ marginBottom: 28 }} />
              <h2 className="serif" style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.5, marginBottom: 20, color: '#1a1612' }}>
                Genuinely beautiful<br />to read.
              </h2>
              <p style={{ fontSize: 15, color: '#6b6356', lineHeight: 1.85, marginBottom: 36 }}>
                Not a wall of links. Not a dump of headlines. Sift writes considered, intelligent summaries — the kind a well-read friend would send you.
              </p>
              {[
                ['No sponsored content', 'Ever. Not now, not later.'],
                ['Entirely yours', 'Shaped by what you tell us, nothing else.'],
                ['Arrives at 7am', 'In your timezone. Before your day begins.'],
              ].map(([t, d]) => (
                <div key={t as string} style={{ borderLeft: '2px solid #b5893a', paddingLeft: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1612' }}>{t as string}</div>
                  <div style={{ fontSize: 13, color: '#9e9185', marginTop: 2 }}>{d as string}</div>
                </div>
              ))}
            </div>

            {/* Mockup — newspaper column style */}
            <div style={{ background: '#faf7f0', border: '1px solid rgba(26,22,18,0.12)', boxShadow: '4px 4px 0 rgba(26,22,18,0.08)' }}>
              <div style={{ background: '#1a1612', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: '#f0ebe0', fontSize: 16, letterSpacing: 0.5 }}>Sift</span>
                <span style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: '#6b6356', letterSpacing: 1 }}>Wednesday · 13 May</span>
              </div>
              <div style={{ padding: '20px 24px', borderBottom: '2px solid #1a1612' }}>
                <div style={{ fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: 2, color: '#b5ae9f', marginBottom: 6, textTransform: 'uppercase' }}>Good morning, Alex</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: '#1a1612', fontStyle: 'italic', lineHeight: 1.3 }}>Your briefing is ready.</div>
              </div>
              {[
                { tag: 'Technology', title: 'OpenAI releases reasoning model with 10× faster inference', body: 'New benchmarks on code generation. Outperforms competitors on latency-sensitive tasks by a significant margin...' },
                { tag: 'Markets', title: 'Fed signals pause as inflation data surprises to the downside', body: 'Core PCE below expectations for the third month running. Committee pressure eases considerably...' },
                { tag: 'World', title: 'EU passes landmark AI accountability directive', body: 'High-risk deployments face mandatory audits. Companies given 18 months to comply with new transparency rules...' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid rgba(26,22,18,0.08)' }}>
                  <div style={{ fontFamily: "'Courier New',monospace", fontSize: 9, letterSpacing: 2, color: '#b5893a', textTransform: 'uppercase', marginBottom: 5 }}>{item.tag}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, fontWeight: 600, color: '#1a1612', marginBottom: 4, lineHeight: 1.35 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#9e9185', lineHeight: 1.65, fontFamily: "'DM Sans',sans-serif" }}>{item.body}</div>
                </div>
              ))}
              <div style={{ padding: '12px 24px', background: '#f0ebe0' }}>
                <div style={{ fontFamily: "'Courier New',monospace", fontSize: 9, color: '#b5ae9f', letterSpacing: 1 }}>Curated by Sift · sift-daily.com</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: '88px 0', borderBottom: '1px solid rgba(26,22,18,0.12)' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <div className="label" style={{ marginBottom: 16 }}>Pricing</div>
              <hr className="rule" style={{ marginBottom: 28 }} />
              <h2 className="serif" style={{ fontSize: 'clamp(28px,3vw,42px)', fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.5, color: '#1a1612' }}>
                One plan.<br /><em style={{ fontStyle: 'italic' }}>One dollar ninety-nine.</em>
              </h2>
              <p style={{ fontSize: 14, color: '#6b6356', lineHeight: 1.85, marginTop: 16 }}>No tiers. No upsells. No annual trap. Just your briefing, every morning, for less than a decent cup of tea.</p>
            </div>
            <div style={{ border: '1px solid rgba(26,22,18,0.15)', background: '#faf7f0', boxShadow: '4px 4px 0 rgba(26,22,18,0.06)' }}>
              <div style={{ padding: '32px 32px 0' }}>
                <div className="serif" style={{ fontSize: 72, fontWeight: 700, color: '#1a1612', letterSpacing: -3, lineHeight: 1 }}>$1<span style={{ fontSize: 36 }}>.99</span></div>
                <div className="mono" style={{ fontSize: 10, color: '#9e9185', letterSpacing: 2, marginTop: 6, marginBottom: 28 }}>Per month, billed monthly</div>
                <hr className="rule" style={{ marginBottom: 24 }} />
                {['Daily newsletter, 7 days a week', 'Unlimited custom interests — type anything', 'Delivered at 7am your time', 'Update your topics any time', '7-day free trial'].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                    <span className="mono" style={{ fontSize: 10, color: '#b5893a', marginTop: 3 }}>—</span>
                    <span style={{ fontSize: 13, color: '#6b6356' }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '24px 32px 32px' }}>
                <button onClick={() => openModal()} style={{ width: '100%', padding: '14px', background: '#1a1612', border: 'none', color: '#f0ebe0', fontSize: 11, fontWeight: 500, cursor: 'pointer', letterSpacing: 2, fontFamily: "'Courier New', Courier, monospace", textTransform: 'uppercase' }}>
                  Start free trial
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '88px 0', borderBottom: '1px solid rgba(26,22,18,0.12)', background: '#e8e2d5' }}>
        <div className="wrap">
          <div className="label" style={{ marginBottom: 16 }}>Reader voices</div>
          <hr className="rule" style={{ marginBottom: 56 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i}>
                <p className="serif" style={{ fontSize: 17, fontStyle: 'italic', color: '#1a1612', lineHeight: 1.8, marginBottom: 24, fontWeight: 400 }}>
                  "{t.q}"
                </p>
                <div style={{ width: 20, height: 1, background: '#b5893a', marginBottom: 14 }} />
                <div className="mono" style={{ fontSize: 10, color: '#6b6356', letterSpacing: 1.5 }}>{t.name} · {t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '100px 0', borderBottom: '2px solid #1a1612' }}>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="label" style={{ marginBottom: 20 }}>Join 14,000 readers</div>
          <h2 className="serif" style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 700, letterSpacing: -2, lineHeight: 1.05, color: '#1a1612', marginBottom: 16 }}>
            Stop doom-scrolling.
          </h2>
          <h2 className="serif" style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 400, fontStyle: 'italic', letterSpacing: -2, lineHeight: 1.05, color: '#3a3430', marginBottom: 48 }}>
            Start your morning right.
          </h2>
          <button onClick={() => openModal()} style={{ background: '#1a1612', border: 'none', color: '#f0ebe0', padding: '16px 36px', fontSize: 11, fontWeight: 500, cursor: 'pointer', letterSpacing: 2.5, fontFamily: "'Courier New', Courier, monospace", textTransform: 'uppercase' }}>
            Start your free trial
          </button>
          <p className="mono" style={{ fontSize: 9, color: '#b5ae9f', letterSpacing: 2, marginTop: 20 }}>$1.99 / month · 7 days free · cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '28px 0', background: '#1a1612' }}>
        <div className="wrap-wide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span className="serif" style={{ fontSize: 16, fontWeight: 700, color: '#f0ebe0' }}>Sift</span>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontFamily: "'Courier New',monospace", fontSize: 9, color: '#6b6356', textDecoration: 'none', letterSpacing: 1.5, textTransform: 'uppercase' }}>{l}</a>
            ))}
          </div>
          <span className="mono" style={{ fontSize: 9, color: '#4a4540', letterSpacing: 1 }}>© 2025 Sift · sift-daily.com</span>
        </div>
      </footer>

      {/* ── Modal ── */}
      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,18,14,0.7)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#f0ebe0', border: '1px solid rgba(26,22,18,0.15)', maxWidth: 460, width: '100%', position: 'relative', boxShadow: '8px 8px 0 rgba(26,22,18,0.08)' }}>

            {/* Modal header */}
            <div style={{ background: '#1a1612', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="serif" style={{ fontSize: 16, fontWeight: 700, color: '#f0ebe0' }}>Sift</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2].map(n => (
                    <div key={n} style={{ width: 20, height: 2, background: step >= n ? '#b5893a' : '#3a3430', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: '#6b6356', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div style={{ padding: '36px 32px' }}>
              {step === 1 && (
                <>
                  <h3 className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 4, color: '#1a1612' }}>Create your account</h3>
                  <p className="mono" style={{ fontSize: 10, color: '#9e9185', letterSpacing: 1.5, marginBottom: 28 }}>7 days free — then $1.99/month</p>
                  {error && <p style={{ color: '#b54a3a', fontSize: 13, marginBottom: 16, fontFamily: "'Courier New',monospace" }}>{error}</p>}
                  {[
                    { label: 'Your name', val: name, set: setName, type: 'text', ph: 'Alex' },
                    { label: 'Email address', val: email, set: setEmail, type: 'email', ph: 'you@email.com' },
                    { label: 'Password', val: password, set: setPassword, type: 'password', ph: 'At least 8 characters' },
                  ].map(f => (
                    <div key={f.label} style={{ marginBottom: 14 }}>
                      <label className="mono" style={{ fontSize: 9, color: '#9e9185', marginBottom: 6, display: 'block', letterSpacing: 2 }}>{f.label.toUpperCase()}</label>
                      <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                        style={{ width: '100%', padding: '12px 14px', background: '#faf7f0', border: '1px solid rgba(26,22,18,0.12)', color: '#1a1612', fontSize: 14, outline: 'none', fontFamily: "'Courier New', Courier, monospace" }} />
                    </div>
                  ))}
                  <button onClick={handleSignup} disabled={loading}
                    style={{ width: '100%', marginTop: 8, padding: '14px', background: '#1a1612', border: 'none', color: '#f0ebe0', fontSize: 11, fontWeight: 500, cursor: 'pointer', letterSpacing: 2, fontFamily: "'Courier New', Courier, monospace", textTransform: 'uppercase', opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'One moment…' : 'Continue'}
                  </button>
                  <p className="mono" style={{ fontSize: 9, color: '#b5ae9f', textAlign: 'center', marginTop: 14, letterSpacing: 1 }}>No spam · Unsubscribe in one click</p>
                </>
              )}

              {step === 2 && (
                <>
                  <h3 className="serif" style={{ fontSize: 24, fontWeight: 500, marginBottom: 4, color: '#1a1612' }}>What do you follow?</h3>
                  <p className="mono" style={{ fontSize: 10, color: '#9e9185', letterSpacing: 1.5, marginBottom: 24 }}>Type anything — press Enter to add</p>
                  {error && <p style={{ color: '#b54a3a', fontSize: 13, marginBottom: 12, fontFamily: "'Courier New',monospace" }}>{error}</p>}

                  <div onClick={() => topicInputRef.current?.focus()}
                    style={{ minHeight: 120, padding: '10px 12px', background: '#faf7f0', border: '1px solid rgba(26,22,18,0.12)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-start', cursor: 'text', marginBottom: 24 }}>
                    {topics.map(t => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a1612', padding: '4px 10px', fontSize: 11, color: '#f0ebe0', fontFamily: "'Courier New',monospace", letterSpacing: 0.5 }}>
                        {t}
                        <button onClick={() => setTopics(prev => prev.filter(x => x !== t))}
                          style={{ background: 'none', border: 'none', color: '#9e9185', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                      </span>
                    ))}
                    <input
                      ref={topicInputRef}
                      value={topicInput}
                      onChange={e => setTopicInput(e.target.value)}
                      onKeyDown={handleTopicKey}
                      onBlur={addTopic}
                      placeholder={topics.length ? '' : 'e.g. Byzantine history, quantum computing, Serie A…'}
                      style={{ background: 'none', border: 'none', outline: 'none', color: '#1a1612', fontSize: 13, flex: 1, minWidth: 120, padding: '4px 2px', fontFamily: "'Courier New', Courier, monospace" }}
                    />
                  </div>

                  <button onClick={handleTopicsContinue} disabled={loading}
                    style={{ width: '100%', padding: '14px', background: '#1a1612', border: 'none', color: '#f0ebe0', fontSize: 11, fontWeight: 500, cursor: 'pointer', letterSpacing: 2, fontFamily: "'Courier New', Courier, monospace", textTransform: 'uppercase', opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'Redirecting…' : 'Continue to payment — $1.99/mo'}
                  </button>
                  <p className="mono" style={{ fontSize: 9, color: '#b5ae9f', textAlign: 'center', marginTop: 14, letterSpacing: 1 }}>No charge for 7 days · Cancel anytime</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
