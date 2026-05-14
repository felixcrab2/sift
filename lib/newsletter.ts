import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type SourceItem = { topic: string; title: string; content: string; url: string }

// Search backend. Tavily for now (1,000 free credits/month covers ~13 users).
// To switch to Brave later, replace this function body with the Brave fetch.
async function searchTopic(topic: string): Promise<{ title: string; content: string; url: string }[]> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `recent developments, notable writing, and specific findings on: ${topic}`,
        search_depth: 'basic',
        max_results: 10,
        days: 7,
      }),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).slice(0, 8).map((r: any) => ({
      title: r.title ?? '',
      content: (r.content ?? '').slice(0, 800),
      url: r.url ?? '',
    }))
  } catch {
    return []
  }
}

export async function gatherSources(topics: string[]): Promise<SourceItem[]> {
  const perTopic = await Promise.all(topics.map(async topic => {
    const items = await searchTopic(topic)
    return items.map(i => ({ ...i, topic }))
  }))
  const seen = new Set<string>()
  const flat: SourceItem[] = []
  for (const row of perTopic) {
    for (const item of row) {
      if (!item.url || seen.has(item.url)) continue
      seen.add(item.url)
      flat.push(item)
    }
  }
  return flat
}

export async function generateNewsletter(name: string, topics: string[], sources: SourceItem[]): Promise<string> {
  if (!sources.length) throw new Error('No source material to generate from')

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const byTopic = new Map<string, SourceItem[]>()
  for (const s of sources) {
    if (!byTopic.has(s.topic)) byTopic.set(s.topic, [])
    byTopic.get(s.topic)!.push(s)
  }

  const context = [...byTopic.entries()]
    .map(([t, items]) => `=== ${t} ===\n${items.map(i => `• ${i.title}\n  ${i.content}`).join('\n\n')}`)
    .join('\n\n---\n\n')

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2200,
    messages: [{
      role: 'user',
      content: `You are the editor of Sift, a premium briefing sent Monday, Wednesday and Friday mornings — composed for one reader at a time. Write today's edition for ${name}.

Date: ${today}
Their chosen subjects: ${topics.join(', ')}

Source material gathered from across the web today (grouped by subject):

${context}

Write 3 to 5 stories. Use editorial judgement about distribution — do not mechanically tick a box for each subject. If one subject yields multiple interesting threads today, run two stories from it. If another has nothing worth reading, skip it entirely; the reader trusts you to make that call. Vary the order day to day — do not always lead with the same kind of subject.

For each story:
- A sharp, specific headline. Name people, places, institutions, sums of money. Avoid vague abstractions.
- 4–6 sentences of clear, intelligent prose. Include concrete detail: who said what, when, the dollar or euro figure, the methodology, the institution, the historical precedent. Beneath the surface is the part to read carefully — surface up the second-order point a casual reader would miss.
- One sentence beginning with "Why it matters:" in italics — sharp, second-order implication, not a recap.

End with a section titled "One more thing —" (italicised). Two or three sentences on something surprising, specific, or delightful drawn from any of their subjects. A detail, an anecdote, an unexpected connection.

Voice: a brilliant, well-read friend. Warm, precise, slightly understated. The reader is intelligent and follows these subjects already; assume they do not need the basics explained. Reach for the niche detail, not the headline. If a topic is obscure, lean into it — that is the entire point.

Rules:
- Flowing prose only. No bullet points within stories.
- Concrete, specific, named. Never vague.
- Do not pad. Do not repeat. Do not summarise the article — extend it.
- Total: ~600 words.

Output only clean HTML using: <h3>, <p>, <em>, <strong>, <hr>. No divs, no classes, no inline styles. Use <h3> for story headlines, <p> for body, <em> for "Why it matters:" and "One more thing —" lines. Do NOT wrap your output in markdown code fences (no \`\`\`html or \`\`\`). Begin directly with the first <h3> tag.`,
    }],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  return raw
    .trim()
    .replace(/^```(?:html)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
}

export function emailTemplate(name: string, content: string, date: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width" />
<title>Sift — ${date}</title>
</head>
<body style="margin:0;padding:0;background:#f2efe8;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2efe8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#1a1814;padding:22px 36px;border-radius:8px 8px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:Georgia,serif;font-size:20px;font-weight:600;color:#ede8df;">Sift</td>
              <td align="right" style="font-family:'Helvetica Neue',sans-serif;font-size:11px;color:#7a7468;letter-spacing:0.5px;">${date}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="background:#ffffff;padding:28px 36px 20px;border-bottom:1px solid #e8e4da;">
          <p style="margin:0 0 4px;font-family:'Helvetica Neue',sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9e9488;">Good morning, ${name}</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#1a1814;font-weight:normal;">Your briefing is ready.</p>
        </td></tr>

        <!-- Content -->
        <tr><td style="background:#ffffff;padding:8px 36px 32px;">
          <div style="font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#2a2722;">
            ${content
              .replace(/<h3>/g, '<h3 style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#1a1814;margin:28px 0 8px;letter-spacing:-0.3px;">')
              .replace(/<p>/g, '<p style="margin:0 0 14px;font-family:Georgia,serif;font-size:15px;line-height:1.8;color:#2a2722;">')
              .replace(/<em>/g, '<em style="color:#c9a96e;">')
              .replace(/<hr>/g, '<hr style="border:none;border-top:1px solid #e8e4da;margin:24px 0;">')
            }
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f7f4ee;padding:18px 36px;border-radius:0 0 8px 8px;border-top:1px solid #e8e4da;">
          <p style="margin:0;font-family:'Helvetica Neue',sans-serif;font-size:11px;color:#b5b0a5;text-align:center;">
            Sift · Your morning briefing ·
            <a href="{{dashboard_url}}" style="color:#c9a96e;text-decoration:none;">Manage topics</a> ·
            <a href="{{unsubscribe_url}}" style="color:#9e9488;text-decoration:none;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function clusterKey(topics: string[]): string {
  return [...topics].sort().join('|')
}

export function pickDailyTopics(topics: string[], count: number): string[] {
  if (topics.length <= count) return [...topics]
  const a = [...topics]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, count)
}
