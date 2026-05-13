'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ALL_TOPICS = [
  '🖥️ Technology', '📈 Finance', '🔬 Science', '🌍 World news',
  '🎨 Design', '⚽ Sport', '🎵 Music', '🏛️ Politics', '🎬 Film',
  '📚 Books', '🚀 Startups', '🤖 AI', '🌱 Climate', '🏋️ Health',
  '🍽️ Food', '✈️ Travel', '🧬 Biotech', '🎮 Gaming',
]

const PLANS = [
  { key: 'starter', name: 'Starter', price: '$5', period: '/mo', desc: '3× weekly newsletter', features: ['3× weekly newsletter', 'Up to 5 topics', 'Standard delivery', 'Web archive'] },
  { key: 'daily', name: 'Daily', price: '$9', period: '/mo', desc: 'Daily newsletter', features: ['Daily newsletter 7×/week', 'Unlimited topics', 'Custom delivery time', 'Full archive + search', 'Priority matching'], featured: true },
  { key: 'pro', name: 'Pro', price: '$19', period: '/mo', desc: 'Morning + evening editions', features: ['Morning + evening editions', 'Unlimited topics', 'Deep-dive summaries', 'Priority sources', 'Early access'] },
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
  const [activeTags, setActiveTags] = useState(['🖥️ Technology', '📈 Finance', '🌍 World news', '🏛️ Politics', '🤖 AI'])
  const heroEmailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (modal) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [modal])

  function openModal(prefill?: string) {
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
    if (selectedTopics.length < 1) { setError('Pick at least one topic.'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('interests').update({ topics: selectedTopics }).eq('user_id', user.id)
    }
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

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #070710; --surface: #0f0f1a; --surface2: #161627;
          --border: rgba(255,255,255,0.07); --indigo: #6366f1; --text: #f1f5f9;
          --muted: #94a3b8; --dim: #475569;
          --grad: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #f97316 100%);
        }
        body { background: var(--bg); color: var(--text); font-family: Inter, sans-serif; overflow-x: hidden; }
        h1,h2,h3 { font-family: 'Plus Jakarta Sans', sans-serif; }
        .grad-text { background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, padding: scrolled ? '14px 0' : '20px 0', background: scrolled ? 'rgba(7,7,16,0.85)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none', transition: 'all 0.3s' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 24, background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sift</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => openModal()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', padding: '10px 20px', borderRadius: 10, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Sign in</button>
            <button onClick={() => openModal()} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 10, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Start free trial</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '180px 0 120px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.1) 40%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '6px 16px 6px 10px', fontSize: 13, fontWeight: 500, color: '#a5b4fc', marginBottom: 32 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Over 14,000 readers worldwide
          </div>
          <h1 style={{ fontSize: 'clamp(48px,7vw,88px)', fontWeight: 800, letterSpacing: -3, lineHeight: 1.05, marginBottom: 24 }}>
            The internet,<br /><span className="grad-text">sifted for you.</span>
          </h1>
          <p style={{ fontSize: 20, color: '#94a3b8', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7 }}>One beautifully crafted email, every morning. Curated around your interests — no fluff, no noise, no doom-scroll.</p>
          <div style={{ display: 'flex', gap: 12, maxWidth: 480, margin: '0 auto 20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input ref={heroEmailRef} type="email" placeholder="your@email.com" style={{ flex: 1, minWidth: 200, padding: '16px 20px', background: '#161627', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: '#f1f5f9', fontSize: 15, outline: 'none', fontFamily: 'Inter,sans-serif' }} />
            <button onClick={() => openModal(heroEmailRef.current?.value || '')} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', border: 'none', color: '#fff', padding: '16px 24px', borderRadius: 12, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Get started →</button>
          </div>
          <p style={{ fontSize: 13, color: '#475569' }}>7-day free trial. Then from <span style={{ color: '#94a3b8' }}>$9/month.</span> Cancel anytime.</p>
        </div>
      </section>

      {/* Proof strip */}
      <div style={{ padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
            {[['14,200+','Active readers'],['97%','Open rate'],['4.9★','Average rating'],['3 min','Average read time']].map(([num, label], i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{num}</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#6366f1', marginBottom: 16, display: 'block' }}>How it works</span>
          <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 64 }}>Set it once. Read every morning.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[['🎯','Pick your interests','Tell us what you care about — tech, finance, science, culture, sport.'],['🤖','We curate overnight','Our AI reads thousands of sources and distills the most relevant stories for you.'],['☀️','Read with your coffee','Wake up to a crisp, beautiful newsletter tailored exactly to your taste.']].map(([icon, title, desc], i) => (
              <div key={i} style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px' }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 48, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', opacity: 0.3, lineHeight: 1, marginBottom: 20 }}>0{i+1}</div>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{title as string}</h3>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{desc as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interests */}
      <section style={{ padding: '100px 0', background: '#0f0f1a', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 80, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#6366f1', marginBottom: 16, display: 'block' }}>Personalization</span>
              <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 16 }}>Your briefing, your world.</h2>
              <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.7, marginBottom: 32 }}>Choose from dozens of categories. Sift adapts as your interests evolve.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {ALL_TOPICS.map(t => (
                  <button key={t} onClick={() => setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} style={{ padding: '10px 18px', borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: activeTags.includes(t) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)', background: activeTags.includes(t) ? 'rgba(99,102,241,0.15)' : '#161627', color: activeTags.includes(t) ? '#a5b4fc' : '#94a3b8', transition: 'all 0.15s' }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ background: '#161627', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 40, maxWidth: 360 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🗞️</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Your preferences, live</div>
                <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>Update any time. Tomorrow's briefing reflects tonight's changes.</p>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {[['Delivery time','7:00 AM 🌅'],['Depth','Concise ⚡'],['Active topics', `${activeTags.length} selected`]].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f0f1a', borderRadius: 10, padding: '10px 14px' }}>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#6366f1', display: 'block', marginBottom: 16 }}>Pricing</span>
            <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: -1.5 }}>Less than your morning coffee.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'center' }}>
            {PLANS.map(plan => (
              <div key={plan.key} style={{ background: plan.featured ? '#161627' : '#0f0f1a', border: plan.featured ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '40px 32px', position: 'relative', transform: plan.featured ? 'scale(1.04)' : 'none', boxShadow: plan.featured ? '0 0 60px rgba(99,102,241,0.12)' : 'none' }}>
                {plan.featured && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>✦ Most popular</div>}
                <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 16 }}>{plan.name}</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 52, fontWeight: 800, letterSpacing: -2, lineHeight: 1, marginBottom: 6 }}>{plan.price}<span style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}>{plan.period}</span></div>
                <div style={{ fontSize: 14, color: '#475569', marginBottom: 32 }}>{plan.desc}</div>
                <ul style={{ listStyle: 'none', marginBottom: 36, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#94a3b8' }}>
                      <span style={{ width: 18, height: 18, background: 'rgba(99,102,241,0.15)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#6366f1', fontSize: 11 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => openModal()} style={{ width: '100%', padding: 14, background: plan.featured ? 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)' : 'transparent', border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.07)', color: plan.featured ? '#fff' : '#94a3b8', borderRadius: 12, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                  Start free trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '100px 0', background: '#0f0f1a', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#6366f1', display: 'block', marginBottom: 16 }}>What readers say</span>
            <h2 style={{ fontSize: 'clamp(32px,4vw,48px)', fontWeight: 800, letterSpacing: -1.5 }}>They opened the email.<br />Then cancelled Twitter.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[{q:'"I used to spend 45 minutes each morning cycling through RSS feeds. Now I read Sift in three minutes and I\'m better informed."',name:'James M.',role:'Product designer, London',init:'JM',col:'rgba(99,102,241,0.2)',tc:'#a5b4fc'},{q:'"Sift feels like having a brilliant friend read the internet for you overnight. The finance and climate coverage is surprisingly nuanced."',name:'Sarah C.',role:'VC analyst, New York',init:'SC',col:'rgba(168,85,247,0.2)',tc:'#d8b4fe'},{q:'"The design alone is worth the subscription. Every other newsletter looks amateurish by comparison. $9 a month is frankly a steal."',name:'Rahim K.',role:'Founder, Berlin',init:'RK',col:'rgba(249,115,22,0.2)',tc:'#fdba74'}].map((t, i) => (
              <div key={i} style={{ background: '#161627', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                <div style={{ color: '#fbbf24', fontSize: 14, letterSpacing: 2, marginBottom: 16 }}>★★★★★</div>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>{t.q}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.col, color: t.tc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t.init}</div>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div><div style={{ fontSize: 12, color: '#475569' }}>{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: 'center', padding: '120px 0', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse at bottom, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 800, letterSpacing: -2, marginBottom: 20, lineHeight: 1.1 }}>
            Stop doom-scrolling.<br /><span className="grad-text">Start your morning right.</span>
          </h2>
          <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 48 }}>Join 14,000 readers who swapped chaos for clarity.</p>
          <button onClick={() => openModal()} style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', border: 'none', color: '#fff', padding: '18px 40px', borderRadius: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600, fontSize: 17, cursor: 'pointer' }}>Start your free trial →</button>
          <p style={{ marginTop: 20, fontSize: 13, color: '#475569' }}>7 days free · No card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sift</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => <a key={l} href="#" style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>{l}</a>)}
          </div>
          <span style={{ fontSize: 13, color: '#475569' }}>© 2025 Sift. All rights reserved.</span>
        </div>
      </footer>

      {/* Modal */}
      {modal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 28, padding: 48, maxWidth: 520, width: '100%', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: '#161627', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
              {[1,2,3].map(n => <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= n ? 'linear-gradient(135deg,#6366f1,#f97316)' : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />)}
            </div>

            {step === 1 && (
              <>
                <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>Start your <span className="grad-text">free trial</span></h3>
                <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 28 }}>7 days free, then $9/month. No card needed today.</p>
                {error && <p style={{ color: '#f87171', fontSize: 14, marginBottom: 16 }}>{error}</p>}
                {[{label:'Your name',val:name,set:setName,type:'text',ph:'Alex'},{label:'Email address',val:email,set:setEmail,type:'email',ph:'you@email.com'},{label:'Password',val:password,set:setPassword,type:'password',ph:'At least 8 characters'}].map(f => (
                  <div key={f.label} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6, display: 'block' }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ width: '100%', padding: '13px 16px', background: '#161627', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: '#f1f5f9', fontSize: 15, fontFamily: 'Inter,sans-serif', outline: 'none' }} />
                  </div>
                ))}
                <button onClick={handleSignup} disabled={loading} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 15, fontFamily: "'Plus Jakarta Sans',sans-serif", cursor: 'pointer', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Creating account...' : 'Continue →'}
                </button>
                <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 12 }}>No spam, ever. Unsubscribe in one click.</p>
              </>
            )}

            {step === 2 && (
              <>
                <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>What do you <span className="grad-text">care about?</span></h3>
                <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 24 }}>Pick at least one topic.</p>
                {error && <p style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{error}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {ALL_TOPICS.map(t => (
                    <button key={t} onClick={() => setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} style={{ padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: selectedTopics.includes(t) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)', background: selectedTopics.includes(t) ? 'rgba(99,102,241,0.15)' : '#161627', color: selectedTopics.includes(t) ? '#a5b4fc' : '#94a3b8' }}>
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={handleInterestsContinue} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 15, fontFamily: "'Plus Jakarta Sans',sans-serif", cursor: 'pointer' }}>
                  Choose my plan →
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>Choose your <span className="grad-text">plan</span></h3>
                <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 24 }}>Free for 7 days, then pick what works.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
                  {PLANS.map(p => (
                    <div key={p.key} onClick={() => setSelectedPlan(p.key)} style={{ border: selectedPlan === p.key ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16, cursor: 'pointer', background: selectedPlan === p.key ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800 }}>{p.price}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.period}</div>
                    </div>
                  ))}
                </div>
                {error && <p style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{error}</p>}
                <button onClick={handleCheckout} disabled={loading} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#6366f1,#a855f7,#f97316)', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 15, fontFamily: "'Plus Jakarta Sans',sans-serif", cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Redirecting to payment...' : 'Start free trial →'}
                </button>
                <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 12 }}>No charge for 7 days. Cancel before then and pay nothing.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
