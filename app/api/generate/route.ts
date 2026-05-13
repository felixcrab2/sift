import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateNewsletter, emailTemplate, clusterKey } from '@/lib/newsletter'
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

  const clusters = new Map<string, { users: typeof activeUsers; topics: string[] }>()
  for (const u of activeUsers) {
    const topics: string[] = (u as any).interests?.topics ?? []
    if (!topics.length) continue
    const key = clusterKey(topics)
    if (!clusters.has(key)) clusters.set(key, { users: [], topics })
    clusters.get(key)!.users.push(u)
  }

  let sent = 0
  const today = new Date().toISOString().split('T')[0]
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  for (const [key, { users, topics }] of clusters) {
    const { data: cached } = await supabase
      .from('newsletter_cache')
      .select('content')
      .eq('cluster_key', key)
      .eq('sent_date', today)
      .single()

    let content = cached?.content
    if (!content) {
      const firstName = (users[0] as any).profiles?.name?.split(' ')[0] || 'there'
      content = await generateNewsletter(firstName, topics)
      await supabase.from('newsletter_cache').insert({ cluster_key: key, content, sent_date: today })
    }

    for (const user of users) {
      const profile = (user as any).profiles
      if (!profile?.email) continue
      const firstName = profile.name?.split(' ')[0] || 'there'

      const html = emailTemplate(firstName, content, dateLabel)
        .replace('{{dashboard_url}}', `${appUrl}/dashboard`)
        .replace('{{unsubscribe_url}}', `${appUrl}/unsubscribe`)

      await resend.emails.send({
        from: 'Sift <hello@sift-daily.com>',
        to: profile.email,
        subject: `Your Sift briefing — ${dateLabel}`,
        html,
      })
      sent++
    }
  }

  return NextResponse.json({ sent, clusters: clusters.size })
}
