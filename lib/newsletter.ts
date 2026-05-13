import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function searchTopic(topic: string): Promise<{ title: string; content: string }[]> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `recent developments, notable writing, and specific findings on: ${topic}`,
        search_depth: 'advanced',
        max_results: 8,
        days: 7,
      }),
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).slice(0, 5).map((r: any) => ({
      title: r.title ?? '',
      content: (r.content ?? '').slice(0, 800),
    }))
  } catch {
    return []
  }
}

export async function generateNewsletter(name: string, topics: string[]): Promise<string> {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const searches = await Promise.all(topics.map(async t => ({
    topic: t,
    results: await searchTopic(t),
  })))

  const context = searches
    .filter(s => s.results.length > 0)
    .map(s => `=== ${s.topic} ===\n${s.results.map(r => `• ${r.title}\n  ${r.content}`).join('\n\n')}`)
    .join('\n\n---\n\n')

  if (!context) throw new Error('No search results returned')

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2200,
    messages: [{
      role: 'user',
      content: `You are the editor of Sift, a premium daily briefing for one reader. Write today's edition for ${name}.

Date: ${today}
Their chosen subjects: ${topics.join(', ')}

Source material gathered from across the web today:

${context}

Write 3 stories, each centred on one of their subjects. For each:
- A sharp, specific headline. Name people, places, institutions, sums of money. Avoid vague abstractions.
- 4–6 sentences of clear, intelligent prose. Include concrete detail: who said what, when, the dollar/euro figure, the methodology, the institution, the historical precedent. Beneath the surface is the part to read carefully — surface up the second-order point that a casual reader would miss.
- One sentence beginning with "Why it matters:" in italics — sharp, second-order implication, not a recap.

End with a section titled "One more thing —" (italicised). Two or three sentences on something surprising, specific, or delightful drawn from any of their subjects. A detail, an anecdote, an unexpected connection.

Voice: a brilliant, well-read friend. Warm, precise, slightly understated. The reader is intelligent and follows these subjects already; assume they don't need the basics explained. Reach for the niche detail, not the headline. If a topic is obscure, lean into it — that is the entire point of the briefing.

Rules:
- Flowing prose only. No bullet points within stories.
- Concrete, specific, named. Never vague.
- Do not pad. Do not repeat. Do not summarise the article — extend it.
- Total: ~600 words.

Output only clean HTML using: <h3>, <p>, <em>, <strong>, <hr>. No divs, no classes, no inline styles. Use <h3> for story headlines, <p> for body, <em> for "Why it matters:" and "One more thing —" lines.`,
    }],
  })

  return (msg.content[0] as { type: string; text: string }).text
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
            Sift · Your daily briefing ·
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
