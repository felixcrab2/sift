import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateNewsletter, clusterKey } from '@/lib/newsletter'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data: activeUsers } = await supabase
    .from('subscriptions')
    .select('user_id, profiles(email, name), interests(topics)')
    .in('status', ['active', 'trialing'])

  if (!activeUsers?.length) return NextResponse.json({ sent: 0 })

  // Group users by interest cluster to minimise AI calls
  const clusters = new Map<string, { users: typeof activeUsers; topics: string[] }>()
  for (const u of activeUsers) {
    const topics = (u as any).interests?.topics ?? []
    if (!topics.length) continue
    const key = clusterKey(topics)
    if (!clusters.has(key)) clusters.set(key, { users: [], topics })
    clusters.get(key)!.users.push(u)
  }

  let sent = 0
  const today = new Date().toISOString().split('T')[0]

  for (const [key, { users, topics }] of clusters) {
    // Check cache
    const { data: cached } = await supabase
      .from('newsletter_cache')
      .select('content')
      .eq('cluster_key', key)
      .eq('sent_date', today)
      .single()

    let html = cached?.content
    if (!html) {
      const firstName = (users[0] as any).profiles?.name?.split(' ')[0] || 'there'
      html = await generateNewsletter(firstName, topics)
      await supabase.from('newsletter_cache').insert({ cluster_key: key, content: html, sent_date: today })
    }

    for (const user of users) {
      const profile = (user as any).profiles
      if (!profile?.email) continue
      const name = profile.name?.split(' ')[0] || 'there'
      const personalised = html.replace(/there|[A-Z][a-z]+(?=,)/g, (m: string, offset: number) => offset === 0 ? m : name)

      await resend.emails.send({
        from: 'Sift <hello@sift.so>',
        to: profile.email,
        subject: `Your Sift briefing — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`,
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1a1a2e">
            <div style="background:linear-gradient(135deg,#6366f1,#a855f7);padding:28px 32px;border-radius:12px 12px 0 0">
              <div style="color:#fff;font-size:22px;font-weight:800;font-family:sans-serif">Sift</div>
              <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:4px">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
              ${personalised}
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">
              <p style="font-size:12px;color:#94a3b8;text-align:center">
                You're receiving this because you subscribed to Sift.<br>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color:#6366f1">Manage preferences</a> ·
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color:#6366f1">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
      })
      sent++
    }
  }

  return NextResponse.json({ sent, clusters: clusters.size })
}
