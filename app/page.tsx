'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ALL_TOPICS = [
  'Technology', 'Finance', 'Science', 'World news',
  'Design', 'Sport', 'Music', 'Politics', 'Film',
  'Books', 'Startups', 'AI', 'Climate', 'Health',
  'Food', 'Travel', 'Biotech', 'Gaming',
]

const PLANS = [
  { key: 'starter', name: 'Starter', price: '$5', period: '/mo', features: ['3× weekly newsletter', 'Up to 5 topics', 'Standard delivery', 'Web archive'] },
  { key: 'daily', name: 'Daily', price: '$9', period: '/mo', features: ['Daily newsletter, 7 days a week', 'Unlimited topics', 'Custom delivery time', 'Full archive & search', 'Priority topic matching'], featured: true },
  { key: 'pro', name: 'Pro', price: '$19', period: '/mo', features: ['Morning & evening editions', 'Unlimited topics & subtopics', 'Deep-dive summaries', 'Priority sources', 'Early access to new features'] },
]

const TESTIMONIALS = [
  { q: 'I used to spend 45 minutes cycling through RSS feeds. Now I read Sift in three minutes and I\'m better informed.', name: 'James M.', role: 'Product designer, London' },
  { q: 'It feels like having a brilliant friend read the internet for you overnight. The finance coverage is surprisingly nuanced.', name: 'Sarah C.', role: 'VC analyst, New York' },
  { q: 'The design alone is worth the subscription. Every other newsletter looks amateurish by comparison.', name: 'Rahim K.', role: 'Founder, Berlin' },
]

export default function Home() {
  const supabase = createClient()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [modal, setModal] = useState(false)
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState('daily')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const heroEmailRef = useRef<HTMLInputElement>(null)

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

  async function handleInterestsContinue() {
    if (!selectedTopics.length) { setError('Pick at least one topic.'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('interests').update({ topics: selectedTopics }).eq('user_id', user.id)
    setStep(3)
  }

  async function handleCheckout() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selectedPlan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  const s: Record<string, React.CSSProperties> = {
    bg: { background: '#0e0d0b' },
    surface: { background: '#141410' },
    surface2: { background: '#1c1b17' },
    border: { borderColor: 'rgba(255,255,255,0.07)' },
    text: { color: '#ede8df' },
    muted: { color: '#7a7468' },
    accent: { color: '#c9a96e' },
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0e0d0b; color: #ede8df; font-family: 'DM Sans', sans-serif; overflow-x: hidden; line-height: 1.6; }
        ::selection { background: rgba(201,169,110,0.25); }
        .serif { font-family: 'Playfair Display', serif; }
        .wrap { max-width: 1080px; margin: 0 auto; padding: 0 32px; }
        .gold { color: #c9a96e; }
        input, button { font-family: 'DM Sans', sans-serif; }
        a { color: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade { opacity: 0; }
        .fade.in { animation: fadeUp 0.7s ease forwards; }
        hr.rule { border: none; border-top: 1px solid rgba(255,255,255,0.07); }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, transition: 'all 0.3s', background: scrolled ? 'rgba(14,13,11,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
          <span className="serif" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, color: '#ede8df' }}>Sift</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <button onClick={() => openModal()} style={{ background: 'none', border: 'none', color: '#7a7468', fontSize: 14, cursor: 'pointer', letterSpacing: 0.2 }}>Sign in</button>
            <button onClick={() => openModal()} style={{ background: '#c9a96e', border: 'none', color: '#0e0d0b', padding: '9px 20px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.2 }}>
              Start free trial
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '160px 0 100px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap">
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 28 }}>Daily intelligence</p>
          <h1 className="serif" style={{ fontSize: 'clamp(52px, 7vw, 96px)', fontWeight: 500, lineHeight: 1.06, letterSpacing: -2, maxWidth: 820, marginBottom: 32, color: '#ede8df' }}>
            The internet,<br /><em style={{ fontStyle: 'italic', color: '#c9a96e' }}>sifted</em> for you.
          </h1>
          <p style={{ fontSize: 18, color: '#7a7468', maxWidth: 480, lineHeight: 1.75, marginBottom: 48, fontWeight: 400 }}>
            One beautifully written email, every morning. Curated to your interests — no noise, no algorithm, no doom-scroll.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <input
              ref={heroEmailRef}
              type="email"
              placeholder="your@email.com"
              style={{ padding: '13px 18px', background: '#1c1b17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#ede8df', fontSize: 15, outline: 'none', width: 280 }}
            />
            <button onClick={() => openModal(heroEmailRef.current?.value || '')} style={{ background: '#c9a96e', border: 'none', color: '#0e0d0b', padding: '13px 24px', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Get started
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#4a4840' }}>7-day free trial — then from $9/month. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Pull quote strip ── */}
      <section style={{ padding: '56px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#141410' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0 }}>
            {[['14,200', 'Readers worldwide'], ['97%', 'Average open rate'], ['4.9 / 5', 'Reader satisfaction'], ['3 min', 'Average read time']].map(([num, label], i) => (
              <div key={i} style={{ padding: '0 32px 0 0', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div className="serif" style={{ fontSize: 36, fontWeight: 500, color: '#ede8df', letterSpacing: -1, marginBottom: 4 }}>{num}</div>
                <div style={{ fontSize: 13, color: '#7a7468', letterSpacing: 0.3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '100px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 20 }}>How it works</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.5, color: '#ede8df' }}>
                Set it once.<br />Read every morning.
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
              {[
                ['I.', 'Tell us what you care about', 'Pick your interests from technology to geopolitics, biotech to film. The more specific, the sharper your briefing.'],
                ['II.', 'We read the internet overnight', 'Our AI scans thousands of sources every night, finds what matters to you, and writes it up — clearly, without the noise.'],
                ['III.', 'It lands before you wake up', 'At 7am in your timezone, a beautiful, scannable briefing hits your inbox. Three minutes. Fully informed.'],
              ].map(([num, title, desc]) => (
                <div key={num as string} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 0, padding: '32px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
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

      {/* ── Newsletter preview ── */}
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
              {[['No sponsored content', 'Ever. Not now, not later.'], ['Deeply personal', 'Learns your preferences. Gets sharper every week.'], ['Arrives at 7am', 'In your timezone, before you reach for your phone.']].map(([t, d]) => (
                <div key={t as string} style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c9a96e', marginTop: 8, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#ede8df', marginBottom: 2 }}>{t as string}</div>
                    <div style={{ fontSize: 13, color: '#7a7468' }}>{d as string}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Newsletter mockup */}
            <div style={{ background: '#faf8f4', borderRadius: 12, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ background: '#1a1814', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: '#ede8df', fontSize: 16 }}>Sift</span>
                <span style={{ fontSize: 11, color: '#7a7468', letterSpacing: 0.5 }}>Wednesday, 13 May</span>
              </div>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #ede9e0' }}>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#9e9488', marginBottom: 6, fontFamily: "'DM Sans',sans-serif" }}>Good morning, Alex</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: '#1a1814', fontWeight: 500, lineHeight: 1.3 }}>Your 4-minute briefing is ready.</div>
              </div>
              {[
                { tag: 'Technology', title: 'OpenAI releases new reasoning model with 10× faster inference', body: 'The latest model sets new benchmarks on code generation and outperforms competitors on latency-sensitive tasks...' },
                { tag: 'Markets', title: 'Fed signals rate pause as inflation data surprises', body: 'Core PCE came in below expectations for the third consecutive month, easing pressure on the committee...' },
                { tag: 'World', title: 'EU Parliament passes landmark AI accountability directive', body: 'Companies deploying high-risk AI systems face mandatory audits and new transparency requirements...' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '18px 28px', borderBottom: '1px solid #ede9e0' }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 5, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{s.tag}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 500, color: '#1a1814', marginBottom: 4, lineHeight: 1.4 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: '#9e9488', lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{s.body}</div>
                </div>
              ))}
              <div style={{ padding: '14px 28px', background: '#f2efe8' }}>
                <div style={{ fontSize: 11, color: '#b5b0a5', textAlign: 'center' as const, fontFamily: "'DM Sans',sans-serif" }}>Curated by Sift · Manage preferences · Unsubscribe</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interests ── */}
      <section style={{ padding: '100px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 20 }}>Personalization</p>
              <h2 className="serif" style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 20, color: '#ede8df' }}>Your briefing,<br />your world.</h2>
              <p style={{ fontSize: 15, color: '#7a7468', lineHeight: 1.8 }}>Choose from dozens of topics. Update any time — tomorrow's briefing reflects tonight's changes.</p>
            </div>
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                {ALL_TOPICS.map(t => (
                  <button key={t} style={{ padding: '8px 16px', borderRadius: 4, fontSize: 13, fontWeight: 400, cursor: 'default', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#7a7468', letterSpacing: 0.2 }}>{t}</button>
                ))}
              </div>
              <p style={{ marginTop: 24, fontSize: 13, color: '#4a4840', lineHeight: 1.7 }}>Select from 50+ topics and subtopics. The more you share, the more precise your briefing becomes over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section style={{ padding: '100px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#141410' }}>
        <div className="wrap">
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 20 }}>Pricing</p>
            <h2 className="serif" style={{ fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, lineHeight: 1.2, letterSpacing: -0.5, color: '#ede8df' }}>Less than your morning coffee.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
            {PLANS.map(plan => (
              <div key={plan.key} style={{ background: plan.featured ? '#1c1b17' : '#141410', padding: '40px 32px', position: 'relative' }}>
                {plan.featured && (
                  <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: '#c9a96e', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 4, padding: '3px 8px' }}>Popular</div>
                )}
                <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#7a7468', marginBottom: 20 }}>{plan.name}</div>
                <div className="serif" style={{ fontSize: 48, fontWeight: 500, color: '#ede8df', letterSpacing: -2, lineHeight: 1, marginBottom: 4 }}>{plan.price}</div>
                <div style={{ fontSize: 13, color: '#4a4840', marginBottom: 32 }}>per month</div>
                <ul style={{ listStyle: 'none', marginBottom: 36, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#7a7468', paddingLeft: 16, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, top: 0, color: '#c9a96e' }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => openModal()} style={{ width: '100%', padding: '12px', background: plan.featured ? '#c9a96e' : 'transparent', border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.1)', color: plan.featured ? '#0e0d0b' : '#7a7468', borderRadius: 6, fontSize: 13, fontWeight: plan.featured ? 600 : 400, cursor: 'pointer', letterSpacing: 0.3 }}>
                  Start free trial
                </button>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: '#4a4840', textAlign: 'center' as const }}>Pay annually and save up to 25%.</p>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '100px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap">
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 64 }}>What readers say</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i}>
                <p className="serif" style={{ fontSize: 16, color: '#ede8df', lineHeight: 1.75, marginBottom: 24, fontStyle: 'italic', fontWeight: 400 }}>"{t.q}"</p>
                <div style={{ width: 24, height: 1, background: 'rgba(201,169,110,0.4)', marginBottom: 16 }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: '#ede8df' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#4a4840', marginTop: 2 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '120px 0', background: '#141410', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="wrap">
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: 3, textTransform: 'uppercase' as const, color: '#c9a96e', marginBottom: 24 }}>Join 14,000 readers</p>
          <h2 className="serif" style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 500, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 40, maxWidth: 640, color: '#ede8df' }}>
            Stop doom-scrolling.<br /><em>Start your morning right.</em>
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center' }}>
            <button onClick={() => openModal()} style={{ background: '#c9a96e', border: 'none', color: '#0e0d0b', padding: '14px 28px', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Start your free trial
            </button>
            <span style={{ fontSize: 13, color: '#4a4840' }}>7 days free. No card required. Cancel anytime.</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '36px 0', background: '#0e0d0b' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
          <span className="serif" style={{ fontSize: 16, fontWeight: 600, color: '#ede8df' }}>Sift</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: '#4a4840', textDecoration: 'none', letterSpacing: 0.3 }}>{l}</a>
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#4a4840' }}>© 2025 Sift</span>
        </div>
      </footer>

      {/* ── Modal ── */}
      {modal && (
        <div onClick={e => { if (e.target === e.currentTarget) setModal(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#141410', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '48px 40px', maxWidth: 480, width: '100%', position: 'relative' }}>
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#4a4840', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>

            {/* Progress */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 36 }}>
              {[1,2,3].map(n => (
                <div key={n} style={{ flex: 1, height: 2, borderRadius: 1, background: step >= n ? '#c9a96e' : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />
              ))}
            </div>

            {step === 1 && (
              <>
                <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, marginBottom: 6, color: '#ede8df' }}>Create your account</h3>
                <p style={{ fontSize: 14, color: '#7a7468', marginBottom: 28 }}>7 days free. Then $9/month. No card needed today.</p>
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
                <button onClick={handleSignup} disabled={loading} style={{ width: '100%', padding: '13px', background: '#c9a96e', border: 'none', borderRadius: 6, color: '#0e0d0b', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 6, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating account…' : 'Continue'}
                </button>
                <p style={{ fontSize: 12, color: '#4a4840', textAlign: 'center' as const, marginTop: 14 }}>No spam. Unsubscribe in one click.</p>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, marginBottom: 6, color: '#ede8df' }}>What do you follow?</h3>
                <p style={{ fontSize: 14, color: '#7a7468', marginBottom: 24 }}>Pick at least one topic. You can always refine later.</p>
                {error && <p style={{ color: '#e07070', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginBottom: 28 }}>
                  {ALL_TOPICS.map(t => (
                    <button key={t} onClick={() => setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                      style={{ padding: '7px 14px', borderRadius: 4, fontSize: 13, cursor: 'pointer', border: selectedTopics.includes(t) ? '1px solid rgba(201,169,110,0.5)' : '1px solid rgba(255,255,255,0.08)', background: selectedTopics.includes(t) ? 'rgba(201,169,110,0.1)' : 'transparent', color: selectedTopics.includes(t) ? '#c9a96e' : '#7a7468' }}>
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={handleInterestsContinue} style={{ width: '100%', padding: '13px', background: '#c9a96e', border: 'none', borderRadius: 6, color: '#0e0d0b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Continue
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="serif" style={{ fontSize: 26, fontWeight: 500, marginBottom: 6, color: '#ede8df' }}>Choose a plan</h3>
                <p style={{ fontSize: 14, color: '#7a7468', marginBottom: 24 }}>Free for 7 days — no charge until then.</p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 24 }}>
                  {PLANS.map(p => (
                    <div key={p.key} onClick={() => setSelectedPlan(p.key)}
                      style={{ border: selectedPlan === p.key ? '1px solid rgba(201,169,110,0.5)' : '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '14px 18px', cursor: 'pointer', background: selectedPlan === p.key ? 'rgba(201,169,110,0.07)' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#ede8df', marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: '#4a4840' }}>{p.features[0]}</div>
                      </div>
                      <div className="serif" style={{ fontSize: 20, fontWeight: 500, color: selectedPlan === p.key ? '#c9a96e' : '#7a7468' }}>{p.price}<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span></div>
                    </div>
                  ))}
                </div>
                {error && <p style={{ color: '#e07070', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: '13px', background: '#c9a96e', border: 'none', borderRadius: 6, color: '#0e0d0b', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Redirecting to payment…' : 'Start free trial'}
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
