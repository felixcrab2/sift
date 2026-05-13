import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TOPIC_FEEDS: Record<string, string[]> = {
  'Technology': ['https://hnrss.org/frontpage', 'https://feeds.arstechnica.com/arstechnica/technology-lab'],
  'AI': ['https://hnrss.org/frontpage?q=AI+LLM+machine+learning', 'https://feeds.arstechnica.com/arstechnica/technology-lab'],
  'Finance': ['https://feeds.bloomberg.com/markets/news.rss', 'https://www.ft.com/?format=rss'],
  'World news': ['http://feeds.bbci.co.uk/news/world/rss.xml', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'],
  'Science': ['https://www.newscientist.com/feed/home/', 'https://www.science.org/rss/news_current.xml'],
  'Startups': ['https://hnrss.org/frontpage?q=startup+founder', 'https://techcrunch.com/feed/'],
  'Politics': ['https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', 'http://feeds.bbci.co.uk/news/politics/rss.xml'],
  'Climate': ['https://www.theguardian.com/environment/climate-crisis/rss', 'https://insideclimatenews.org/feed/'],
  'Health': ['https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', 'https://www.health.harvard.edu/blog/feed'],
  'Design': ['https://www.creativebloq.com/feeds/all', 'https://hnrss.org/frontpage?q=design+ux+ui'],
  'Sport': ['http://feeds.bbci.co.uk/sport/rss.xml'],
  'Music': ['https://pitchfork.com/rss/news/'],
  'Film': ['https://variety.com/feed/'],
  'Books': ['https://www.theguardian.com/books/rss'],
  'Biotech': ['https://www.statnews.com/feed/', 'https://hnrss.org/frontpage?q=biotech+biology+crispr'],
  'Gaming': ['https://www.eurogamer.net/?format=rss'],
  'Food': ['https://www.theguardian.com/food/rss'],
  'Travel': ['https://www.theguardian.com/travel/rss'],
}

async function fetchRSS(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Sift Newsletter Bot' }
    })
    const xml = await res.text()
    const titles = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>|<title>(.+?)<\/title>/g)]
      .slice(1, 8)
      .map(m => (m[1] || m[2]).trim())
    const descs = [...xml.matchAll(/<description><!\[CDATA\[(.+?)\]\]><\/description>|<description>(.+?)<\/description>/g)]
      .slice(1, 8)
      .map(m => (m[1] || m[2]).replace(/<[^>]+>/g, '').trim().slice(0, 200))
    return titles.map((t, i) => `• ${t}${descs[i] ? ': ' + descs[i] : ''}`)
  } catch {
    return []
  }
}

export async function generateNewsletter(name: string, topics: string[]): Promise<string> {
  const selectedFeeds = topics.flatMap(t => TOPIC_FEEDS[t] || []).slice(0, 6)
  const headlines = (await Promise.all(selectedFeeds.map(fetchRSS))).flat().slice(0, 20)

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const prompt = `You are Sift, a premium AI newsletter curator. Write a beautiful, concise morning briefing for ${name}.

Today is ${today}. Their interests: ${topics.join(', ')}.

Here are today's headlines to draw from:
${headlines.join('\n')}

Write a newsletter with:
1. A warm 1-sentence greeting personalised to ${name}
2. 3-5 stories, each with: a punchy headline, a 2-3 sentence summary in clear plain English, and why it matters
3. One short "something different" item (interesting, surprising, or delightful)
4. A one-line sign-off

Format as clean HTML using only <h2>, <p>, <strong>, <hr> tags. Be concise, smart, and never sensational. No bullet points in the stories — write in prose.`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  return (msg.content[0] as { type: string; text: string }).text
}

export function clusterKey(topics: string[]): string {
  return [...topics].sort().join('|')
}
