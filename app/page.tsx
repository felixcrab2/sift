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
      { threshold: 0.18 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(18px)',
      transition: `opacity 1.4s cubic-bezier(.2,.7,.2,1) ${delay}s, transform 1.4s cubic-bezier(.2,.7,.2,1) ${delay}s`,
    }}>
      {children}
    </div>
  )
}

const LINE1 = 'Your morning dose'
const LINE2 = 'of knowledge.'
const LINE3 = 'Written for you alone.'

function HeadlineTypewriter({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const [hideCursor, setHideCursor] = useState(false)
  const total = LINE1.length + LINE2.length + LINE3.length

  useEffect(() => {
    let cancelled = false
    const tick = (i: number) => {
      if (cancelled) return
      if (i > total) {
        onDone()
        setTimeout(() => { if (!cancelled) setHideCursor(true) }, 1200)
        return
      }
      setShown(i)
      const atLine1End = i === LINE1.length
      const atLine2End = i === LINE1.length + LINE2.length
      const delay = atLine1End ? 280 : atLine2End ? 380 : 38 + Math.random() * 28
      setTimeout(() => tick(i + 1), delay)
    }
    const start = setTimeout(() => tick(0), 600)
    return () => { cancelled = true; clearTimeout(start) }
  }, [])

  const l1 = LINE1.slice(0, Math.min(shown, LINE1.length))
  const l2 = shown > LINE1.length ? LINE2.slice(0, Math.min(shown - LINE1.length, LINE2.length)) : ''
  const l3 = shown > LINE1.length + LINE2.length ? LINE3.slice(0, shown - LINE1.length - LINE2.length) : ''

  const onLine1 = shown <= LINE1.length
  const onLine2 = !onLine1 && shown <= LINE1.length + LINE2.length

  const cursor = !hideCursor && (
    <span style={{
      display: 'inline-block',
      width: 2,
      height: '0.85em',
      background: 'currentColor',
      verticalAlign: '-0.04em',
      marginLeft: 4,
      animation: 'blink 1.05s step-end infinite',
    }} />
  )

  return (
    <>
      {l1}{onLine1 && cursor}
      {shown > LINE1.length && <br />}
      {shown > LINE1.length && <>{l2}{onLine2 && cursor}</>}
      {shown > LINE1.length + LINE2.length && <br />}
      {shown > LINE1.length + LINE2.length && (
        <em style={{ fontStyle: 'italic', color: '#c4a86b' }}>
          {l3}{!onLine1 && !onLine2 && cursor}
        </em>
      )}
    </>
  )
}

export default function Home() {
  const supabase = createClient()
  const [modal, setModal] = useState(false)
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [topicInput, setTopicInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [typingDone, setTypingDone] = useState(false)
  const heroEmailRef = useRef<HTMLInputElement>(null)
  const ctaEmailRef = useRef<HTMLInputElement>(null)
  const topicInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modal])

  const reveal = (delay: number) => ({
    opacity: typingDone ? 1 : 0,
    transform: typingDone ? 'none' : 'translateY(12px)',
    transition: `opacity 1s cubic-bezier(.2,.7,.2,1) ${delay}s, transform 1s cubic-bezier(.2,.7,.2,1) ${delay}s`,
  })

  function openModal(prefill = '', initialMode: 'signup' | 'signin' = 'signup') {
    if (prefill) setEmail(prefill)
    setMode(initialMode); setStep(1); setError(''); setModal(true)
  }

  const MAX_TOPICS = 6

  function addTopic() {
    const t = topicInput.trim()
    if (t && !topics.includes(t) && topics.length < MAX_TOPICS) setTopics(p => [...p, t])
    setTopicInput('')
  }

  function onTopicKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTopic() }
    if (e.key === 'Backspace' && !topicInput && topics.length) setTopics(p => p.slice(0, -1))
  }

  function onEmailKey(ref: React.RefObject<HTMLInputElement | null>) {
    return (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') openModal(ref.current?.value || '')
    }
  }

  async function handleSignup() {
    if (!email || !email.includes('@') || !name || !password) { setError('please complete all fields.'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    setLoading(false)
    if (error) { setError(error.message.toLowerCase()); return }
    if (!data.session) {
      setError('check your email — please confirm your address, then sign in to continue.')
      return
    }
    setStep(2)
  }

  async function handleSignIn() {
    if (!email || !email.includes('@') || !password) { setError('please complete all fields.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message.toLowerCase()); return }
    window.location.href = '/dashboard'
  }

  async function handleFinish() {
    if (!topics.length) { setError('please name at least one subject.'); return }
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('your session has expired. please sign in to continue.')
      return
    }
    setLoading(true)
    await supabase.from('interests').update({ topics }).eq('user_id', user.id)
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    const data = await res.json()
    setLoading(false)
    if (!res.ok || !data.url) {
      setError(data.error?.toLowerCase?.() || 'could not reach payment. please try again.')
      return
    }
    window.location.href = data.url
  }

  // Pseudo-edition number — gives a sense of provenance
  const editionNumber = 142
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0907; color: #c8c4b8; font-family: 'Courier Prime', 'Courier New', monospace; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        a { color: inherit; text-decoration: none; }
        button, input, textarea { font-family: 'Courier Prime', 'Courier New', monospace; }
        input::placeholder { color: #3a352d; }
        input:focus { outline: none; }
        .serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        button { transition: opacity 0.25s, color 0.25s; }
        .arrow { display: inline-block; transition: transform 0.3s cubic-bezier(.2,.7,.2,1); }
        .submit:hover { opacity: 0.8; }
        .submit:hover .arrow { transform: translateX(5px); }
        .link:hover { color: #ece7da !important; }
        ::selection { background: #2a2620; color: #ece7da; }

        @keyframes appear { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor::after { content: '_'; animation: blink 1.1s step-end infinite; color: #ece7da; }
        .pulse { animation: pulse 2.4s ease-in-out infinite; }

        .a1 { animation: appear 1.2s ease 0.05s both; }
        .a2 { animation: appear 1.4s ease 0.4s both; }
        .a3 { animation: appear 1.4s ease 0.7s both; }
        .a4 { animation: appear 1.4s ease 1.0s both; }
        .a5 { animation: appear 1.4s ease 1.3s both; }
        .a6 { animation: appear 1.4s ease 1.6s both; }

        @media (max-width: 700px) {
          .row { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, #0a0907 70%, transparent)' }}>
        <span className="a1 serif" style={{ fontSize: 32, fontWeight: 500, letterSpacing: 0.5, color: '#ece7da' }}>Sift</span>
        <div className="a1" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#7a7468', letterSpacing: 2, textTransform: 'uppercase' }}>
            <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#c4a86b' }}></span>
            intake open
          </span>
          <button onClick={() => openModal('', 'signin')} className="link" style={{ background: 'none', border: 'none', fontSize: 12, color: '#a8a294', cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' }}>sign in</button>
          <button onClick={() => openModal()} className="submit" style={{ background: 'none', border: '1px solid #3a352d', color: '#ece7da', padding: '9px 18px', fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>begin <span className="arrow">→</span></button>
        </div>
      </header>

      {/* Hero */}
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '140px 40px 80px', position: 'relative' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>

          {/* Masthead line */}
          <div className="a2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c1915', paddingBottom: 14, marginBottom: 56, fontSize: 11, color: '#7a7468', letterSpacing: 2, textTransform: 'uppercase' }}>
            <span>Edition №{editionNumber.toString().padStart(3, '0')}</span>
            <span>{today}</span>
            <span>For one reader</span>
          </div>

          <h1 className="serif" style={{ fontSize: 'clamp(44px,7vw,86px)', fontWeight: 400, color: '#ece7da', lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 32, minHeight: '3.3em' }}>
            <HeadlineTypewriter onDone={() => setTypingDone(true)} />
          </h1>

          <p style={{ fontSize: 16, color: '#a8a294', lineHeight: 1.85, marginBottom: 56, maxWidth: 520, ...reveal(0.1) }}>
            Three mornings a week — Monday, Wednesday, Friday — an edition composed for a single reader, around the subjects you choose to follow. Nothing else gets through.
          </p>

          <div style={{ marginBottom: 16, ...reveal(0.3) }}>
            <div className="row" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2620', paddingBottom: 14, gap: 14 }}>
              <span style={{ color: '#7a7468', fontSize: 14 }}>&gt;</span>
              <input
                ref={heroEmailRef}
                type="email"
                placeholder="your email address"
                onKeyDown={onEmailKey(heroEmailRef)}
                style={{ background: 'none', border: 'none', fontSize: 16, color: '#ece7da', flex: 1, letterSpacing: 0.3, padding: '4px 0' }}
              />
              <button
                onClick={() => openModal(heroEmailRef.current?.value || '')}
                className="submit"
                style={{ background: '#c4a86b', border: 'none', color: '#0a0907', padding: '11px 22px', fontSize: 11, cursor: 'pointer', letterSpacing: 2.5, whiteSpace: 'nowrap', textTransform: 'uppercase', fontWeight: 700 }}
              >
                begin <span className="arrow">→</span>
              </button>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#7a7468', letterSpacing: 0.5, marginTop: 18, ...reveal(0.5) }}>
            $1.99 / month &nbsp;·&nbsp; three editions a week &nbsp;·&nbsp; seven days free
          </p>

        </div>

        {/* Subtle scroll cue */}
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: typingDone ? 'translateX(-50%)' : 'translateX(-50%) translateY(12px)', fontSize: 11, color: '#3a352d', letterSpacing: 3, textTransform: 'uppercase', opacity: typingDone ? 1 : 0, transition: 'opacity 1s ease 0.7s, transform 1s ease 0.7s' }}>
          continue ↓
        </div>
      </main>

      {/* Manifest */}
      <section style={{ padding: '160px 40px', borderTop: '1px solid #1c1915' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7468', marginBottom: 64 }}>
              — the editorial line
            </p>
          </Reveal>

          {[
            'We do not aggregate.',
            'We do not link-dump.',
            'We do not chase virality.',
            'We write.',
          ].map((line, i) => (
            <Reveal key={i} delay={0.15 * i}>
              <p className="serif" style={{
                fontSize: 'clamp(28px,4vw,46px)',
                fontWeight: 400,
                color: i === 3 ? '#ece7da' : '#a8a294',
                lineHeight: 1.4,
                fontStyle: i === 3 ? 'italic' : 'normal',
                marginBottom: 8,
                letterSpacing: -0.3,
              }}>
                {line}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.7}>
            <p style={{ fontSize: 14, color: '#7a7468', lineHeight: 1.85, marginTop: 56, maxWidth: 480 }}>
              Sift exists because the morning briefings of others are written for everyone, which means written for no one.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Sample edition */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid #1c1915' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
              <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7468' }}>
                — a recent edition
              </p>
              <p style={{ fontSize: 11, color: '#5a564c', letterSpacing: 1 }}>composed for a single reader</p>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <article style={{ border: '1px solid #2a2620', padding: '48px 52px', background: '#0e0c09' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid #2a2620' }}>
                <span className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: 0.5, color: '#ece7da' }}>Sift</span>
                <span style={{ fontSize: 11, color: '#7a7468', letterSpacing: 2, textTransform: 'uppercase' }}>Edition №141 &nbsp;·&nbsp; 12 May 2026</span>
              </header>

              <p style={{ fontSize: 11, color: '#7a7468', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 36, paddingBottom: 18, borderBottom: '1px solid #2a2620', lineHeight: 1.7 }}>
                <span style={{ color: '#5a564c' }}>composed from:</span> &nbsp;byzantine numismatics &nbsp;·&nbsp; independent film distribution &nbsp;·&nbsp; cephalopod cognition &nbsp;·&nbsp; pre-socratic philosophy
              </p>

              <p style={{ fontSize: 11, letterSpacing: 2.5, color: '#8a8478', textTransform: 'uppercase', marginBottom: 6 }}>good morning, alex</p>
              <p className="serif" style={{ fontSize: 26, color: '#ece7da', marginBottom: 44, fontStyle: 'italic', fontWeight: 400 }}>your briefing is ready.</p>

              {[
                {
                  tag: 'byzantine numismatics',
                  headline: 'A solidus of Heraclius surfaces in Geneva — the first of its mint type in fifty years.',
                  body: 'The coin, struck at Constantinople between 610 and 613 AD, carries an unusual mint mark from the brief campaign year before the eastern offensive. It surfaced this week at a private sale for €188,000, at the high end of estimates but unremarkable for a piece of its rarity. What is remarkable is what the mark may indicate about Byzantine military logistics in the early years of Heraclius\'s reign — when the empire was simultaneously running mints at Constantinople, Carthage, and a third location nobody has firmly identified. A retired numismatist at Dumbarton Oaks has questioned the provenance documentation; the sale proceeded nonetheless.',
                  italic: 'Why it matters: a new data point for a half-century debate about how the empire moved silver during the Sasanian wars.',
                },
                {
                  tag: 'independent film',
                  headline: 'A quiet Cannes acquisition signals a shift in arthouse distribution.',
                  body: 'A small French sales agency has acquired worldwide rights to Ramata-Toulaye Sy\'s second feature for a figure under €600,000 — modest by Cannes standards, but unusual in structure. The deal includes a long theatrical window in eleven territories, an arrangement most arthouse distributors stopped offering after the streamers consolidated rights in 2020. If it holds, the model could quietly become the new template for festival titles whose value is theatrical rather than streaming. The buyer is keeping the price down by foregoing a Netflix-style P&A guarantee, which is the part of the structure your competitors will study.',
                  italic: 'Why it matters: the first material evidence that the theatre-first model for arthouse cinema is being rebuilt.',
                },
                {
                  tag: 'cephalopod cognition',
                  headline: 'Octopuses appear to make decisions in their arms before — or instead of — their central brain.',
                  body: 'A paper from the Stazione Zoologica in Naples extends earlier work on neural autonomy in Octopus vulgaris. In controlled foraging trials, individual arms responded to chemical cues in a manner inconsistent with central oversight; crucially, the same arm did not always make the same choice. The behavioural implications are easier to describe than to explain — octopus "preference" may be a kind of agreement-by-vote among nine semi-independent agents, rather than a unified will routed through a single brain. The methodology is contested, but no group has yet replicated it cleanly enough to refute the central finding.',
                  italic: 'Why it matters: quietly the strongest argument yet for distributed cognition as a genuine alternative to centralised models of mind.',
                },
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid #2a2620' }}>
                  <p style={{ fontSize: 11, letterSpacing: 2, color: '#9a9384', textTransform: 'uppercase', marginBottom: 12 }}>{s.tag}</p>
                  <p className="serif" style={{ fontSize: 21, color: '#ece7da', lineHeight: 1.35, marginBottom: 14, fontWeight: 500, letterSpacing: -0.2 }}>{s.headline}</p>
                  <p style={{ fontSize: 14, color: '#b8b3a4', lineHeight: 1.95, marginBottom: 14 }}>{s.body}</p>
                  <p className="serif" style={{ fontSize: 14, color: '#c4a86b', fontStyle: 'italic', lineHeight: 1.7 }}>{s.italic}</p>
                </div>
              ))}

              {/* One more thing */}
              <div>
                <p className="serif" style={{ fontSize: 16, color: '#c4a86b', fontStyle: 'italic', marginBottom: 14, letterSpacing: 0.2 }}>One more thing —</p>
                <p style={{ fontSize: 14, color: '#b8b3a4', lineHeight: 1.95 }}>
                  The Empedocles fragment that the Vesuvius Challenge team announced last month was decoded using a model originally trained on ancient Greek shopping lists. The team did not expect it to generalise to philosophical verse, and they have published a brief, slightly bewildered note explaining why it did. The note is worth reading in full; the model itself, less so.
                </p>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.3}>
            <p style={{ fontSize: 13, color: '#8a8478', marginTop: 32, lineHeight: 1.85, letterSpacing: 0.3, fontStyle: 'italic', textAlign: 'center' }}>
              That edition went to one reader, on her chosen subjects. Yours will be entirely different.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Range */}
      <section style={{ padding: '140px 40px', borderTop: '1px solid #1c1915' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7468', marginBottom: 32 }}>
              — among recent subjects
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="serif" style={{ fontSize: 'clamp(20px,2.5vw,30px)', color: '#a8a294', lineHeight: 1.7, fontWeight: 400, letterSpacing: -0.2 }}>
              <span style={{ color: '#ece7da' }}>Byzantine history.</span> Quantum computing. The independent film circuit. Formula 1. <span style={{ color: '#ece7da' }}>Central banking.</span> Ocean science. Venture capital. Literary fiction. <span style={{ color: '#ece7da' }}>Climate technology.</span> Biomimicry. <span style={{ fontStyle: 'italic', color: '#c4a86b' }}>Anything you can name.</span>
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p style={{ fontSize: 14, color: '#7a7468', lineHeight: 1.85, marginTop: 48, maxWidth: 520 }}>
              No predefined categories. No algorithm deciding what you'd like. You name the subjects in your own words; we read them every night.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Testimony */}
      <section style={{ padding: '120px 40px', borderTop: '1px solid #1c1915' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <p className="serif" style={{ fontSize: 'clamp(22px,3vw,32px)', color: '#dad5c8', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 400, letterSpacing: -0.2 }}>
              "I have read every edition since I joined. It is the one thing in my inbox I do not skim."
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p style={{ fontSize: 12, color: '#7a7468', marginTop: 28, letterSpacing: 2, textTransform: 'uppercase' }}>
              — J.M., London &nbsp;·&nbsp; reader since edition №38
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pricing & final CTA combined */}
      <section style={{ padding: '140px 40px 120px', borderTop: '1px solid #1c1915' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7468', marginBottom: 28 }}>
              — one plan, one price
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 className="serif" style={{ fontSize: 'clamp(72px,12vw,160px)', fontWeight: 400, color: '#ece7da', letterSpacing: -4, lineHeight: 1, marginBottom: 16 }}>
              $1.99
            </h2>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="serif" style={{ fontSize: 18, color: '#a8a294', fontStyle: 'italic', marginBottom: 12 }}>
              per month.
            </p>
          </Reveal>
          <Reveal delay={0.4}>
            <p style={{ fontSize: 14, color: '#8a8478', lineHeight: 1.9, maxWidth: 420, margin: '0 auto 56px', letterSpacing: 0.3 }}>
              Less than a single coffee. The first seven days are free, no charge taken. Leave from inside whenever you wish — the door is unlocked.
            </p>
          </Reveal>

          <Reveal delay={0.55}>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <div className="row" style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2620', paddingBottom: 14, gap: 14, marginBottom: 18 }}>
                <span style={{ color: '#7a7468', fontSize: 14 }}>&gt;</span>
                <input
                  ref={ctaEmailRef}
                  type="email"
                  placeholder="your email address"
                  onKeyDown={onEmailKey(ctaEmailRef)}
                  style={{ background: 'none', border: 'none', fontSize: 16, color: '#ece7da', flex: 1, letterSpacing: 0.3, padding: '4px 0', textAlign: 'left' }}
                />
                <button
                  onClick={() => openModal(ctaEmailRef.current?.value || '')}
                  className="submit"
                  style={{ background: '#c4a86b', border: 'none', color: '#0a0907', padding: '11px 22px', fontSize: 11, cursor: 'pointer', letterSpacing: 2.5, whiteSpace: 'nowrap', textTransform: 'uppercase', fontWeight: 700 }}
                >
                  begin <span className="arrow">→</span>
                </button>
              </div>
              <p className="serif" style={{ fontSize: 15, color: '#7a7468', fontStyle: 'italic', letterSpacing: 0.3, marginTop: 12 }}>
                Your first edition arrives the next Monday, Wednesday or Friday morning.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '36px 40px', borderTop: '1px solid #1c1915', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <span className="serif" style={{ fontSize: 18, fontWeight: 500, letterSpacing: 0.5, color: '#a8a294' }}>Sift</span>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Privacy', 'Terms', 'Contact'].map(l => <a key={l} href="#" className="link" style={{ fontSize: 12, color: '#7a7468', letterSpacing: 1 }}>{l}</a>)}
        </div>
        <span style={{ fontSize: 12, color: '#5a564c', letterSpacing: 0.5 }}>© 2025 Sift &nbsp;·&nbsp; mwf mornings</span>
      </footer>

      {/* Modal */}
      {modal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(5,4,3,0.94)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'appear 0.35s ease' }}
        >
          <div style={{ background: '#0e0c09', border: '1px solid #2a2620', padding: '48px 44px', maxWidth: 440, width: '100%', position: 'relative' }}>
            <button
              onClick={() => setModal(false)}
              style={{ position: 'absolute', top: 18, right: 22, background: 'none', border: 'none', color: '#5a564c', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
            >×</button>

            <p style={{ fontSize: 11, color: '#7a7468', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>
              {mode === 'signin' ? 'sign in' : (step === 1 ? 'step 01 of 02' : 'step 02 of 02')}
            </p>
            <p className="serif" style={{ fontSize: 26, fontWeight: 500, color: '#ece7da', marginBottom: 6, letterSpacing: -0.3 }}>
              {mode === 'signin' ? 'Welcome back.' : (step === 1 ? 'Begin your trial.' : 'Choose your subjects.')}
            </p>
            <p style={{ fontSize: 13, color: '#8a8478', marginBottom: 36, lineHeight: 1.7 }}>
              {mode === 'signin'
                ? 'Sign in to manage your subjects and read past editions.'
                : (step === 1
                  ? 'Seven days free, then $1.99 per month. Cancel from inside whenever you wish.'
                  : `Add up to ${MAX_TOPICS} subjects you follow. For each edition, three are chosen — so the rotation stays fresh.`)}
            </p>

            {error && <p style={{ color: '#c47a5a', fontSize: 12, marginBottom: 20, letterSpacing: 0.3 }}>{error}</p>}

            {step === 1 && (
              <>
                {(mode === 'signup'
                  ? [
                      { label: 'name', val: name, set: setName, type: 'text', ph: 'your name' },
                      { label: 'email', val: email, set: setEmail, type: 'email', ph: 'your email' },
                      { label: 'password', val: password, set: setPassword, type: 'password', ph: '8+ characters' },
                    ]
                  : [
                      { label: 'email', val: email, set: setEmail, type: 'email', ph: 'your email' },
                      { label: 'password', val: password, set: setPassword, type: 'password', ph: 'your password' },
                    ]
                ).map(f => (
                  <div key={f.label} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #2a2620', paddingBottom: 10, gap: 16 }}>
                      <span style={{ fontSize: 11, color: '#7a7468', letterSpacing: 2, minWidth: 64, textTransform: 'uppercase' }}>{f.label}</span>
                      <input
                        type={f.type}
                        value={f.val}
                        onChange={e => f.set(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') (mode === 'signin' ? handleSignIn : handleSignup)() }}
                        placeholder={f.ph}
                        style={{ background: 'none', border: 'none', fontSize: 14, color: '#ece7da', flex: 1, letterSpacing: 0.2 }}
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={mode === 'signin' ? handleSignIn : handleSignup}
                  disabled={loading}
                  className="submit"
                  style={{ marginTop: 16, width: '100%', background: '#c4a86b', border: 'none', color: '#0a0907', padding: '15px', fontSize: 12, cursor: 'pointer', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 700, opacity: loading ? 0.5 : 1 }}
                >
                  {loading ? 'one moment...' : <>{mode === 'signin' ? 'sign in' : 'continue'} <span className="arrow">→</span></>}
                </button>

                <p style={{ fontSize: 12, color: '#7a7468', textAlign: 'center', marginTop: 20, letterSpacing: 0.3 }}>
                  {mode === 'signin' ? (
                    <>No account yet? <button onClick={() => { setMode('signup'); setError('') }} style={{ background: 'none', border: 'none', color: '#c4a86b', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0 }}>Begin a trial</button></>
                  ) : (
                    <>Already have an account? <button onClick={() => { setMode('signin'); setError('') }} style={{ background: 'none', border: 'none', color: '#c4a86b', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0 }}>Sign in</button></>
                  )}
                </p>
                {mode === 'signup' && <p style={{ fontSize: 11, color: '#5a564c', textAlign: 'center', marginTop: 10, letterSpacing: 1 }}>no payment taken today.</p>}
              </>
            )}

            {step === 2 && (
              <>
                <div
                  onClick={() => topicInputRef.current?.focus()}
                  style={{ minHeight: 110, borderBottom: '1px solid #2a2620', paddingBottom: 16, marginBottom: 32, cursor: 'text' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: topics.length ? 14 : 0 }}>
                    {topics.map(t => (
                      <span key={t} style={{ fontSize: 13, color: '#dad5c8', letterSpacing: 0.3, display: 'inline-flex', alignItems: 'center' }}>
                        [{t}
                        <button
                          onClick={() => setTopics(p => p.filter(x => x !== t))}
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
                      placeholder={topics.length >= MAX_TOPICS ? 'maximum reached — backspace to remove one' : (topics.length ? '' : 'byzantine history, formula 1, venture capital...')}
                      style={{ background: 'none', border: 'none', fontSize: 14, color: '#ece7da', flex: 1, opacity: topics.length >= MAX_TOPICS ? 0.5 : 1 }}
                    />
                  </div>
                </div>

                <p style={{ fontSize: 11, color: '#5a564c', marginBottom: 14, letterSpacing: 0.5, textAlign: 'right' }}>{topics.length} of {MAX_TOPICS} subjects</p>

                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="submit"
                  style={{ width: '100%', background: '#c4a86b', border: 'none', color: '#0a0907', padding: '15px', fontSize: 12, cursor: 'pointer', letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: 700, opacity: loading ? 0.5 : 1 }}
                >
                  {loading ? 'redirecting...' : <>continue to payment <span className="arrow">→</span></>}
                </button>
                <p style={{ fontSize: 11, color: '#5a564c', textAlign: 'center', marginTop: 14, letterSpacing: 1 }}>no charge for seven days.</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
