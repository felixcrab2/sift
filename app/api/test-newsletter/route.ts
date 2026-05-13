import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateNewsletter, gatherSources, emailTemplate, pickDailyTopics } from '@/lib/newsletter'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: interests } = await supabase
    .from('interests')
    .select('topics')
    .eq('user_id', user.id)
    .single()

  const topics: string[] = interests?.topics ?? []
  if (!topics.length) return NextResponse.json({ error: 'No topics set — add some in your dashboard first.' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const firstName = profile?.name?.split(' ')[0] || 'there'
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const dailyTopics = pickDailyTopics(topics, 3)
  const sources = await gatherSources(dailyTopics)
  if (!sources.length) return NextResponse.json({ error: 'No source material found for those topics today.' }, { status: 502 })

  const content = await generateNewsletter(firstName, dailyTopics, sources)
  const html = emailTemplate(firstName, content, dateLabel)
    .replace('{{dashboard_url}}', `${appUrl}/dashboard`)
    .replace('{{unsubscribe_url}}', `${appUrl}/unsubscribe`)

  await resend.emails.send({
    from: 'Sift <hello@sift-daily.com>',
    to: user.email!,
    subject: `[Test] Your Sift briefing — ${dateLabel}`,
    html,
  })

  return NextResponse.json({ ok: true, sentTo: user.email, dailyTopics })
}
