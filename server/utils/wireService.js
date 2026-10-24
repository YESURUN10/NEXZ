import axios from 'axios';

/**
 * Validates whether the configured NEWS_API_KEY is a real key
 * rather than a placeholder string.
 */
export function isNewsApiKeyValid(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 24) return false;
  if (trimmed.toLowerCase().includes('your_') || trimmed.toLowerCase().includes('placeholder')) {
    return false;
  }
  return true;
}

/**
 * Topic mapping for Google News RSS feeds.
 */
const CATEGORY_TOPIC_MAP = {
  technology: 'TECHNOLOGY',
  tech: 'TECHNOLOGY',
  business: 'BUSINESS',
  finance: 'BUSINESS',
  science: 'SCIENCE',
  sports: 'SPORTS',
  health: 'HEALTH',
  entertainment: 'ENTERTAINMENT',
  world: 'WORLD',
  politics: 'POLITICS',
};

/**
 * Regional locale mapping.
 */
const REGION_LOCALE_MAP = {
  in: { hl: 'en-IN', gl: 'IN', ceid: 'IN:en' },
  us: { hl: 'en-US', gl: 'US', ceid: 'US:en' },
  gb: { hl: 'en-GB', gl: 'GB', ceid: 'GB:en' },
  ca: { hl: 'en-CA', gl: 'CA', ceid: 'CA:en' },
  au: { hl: 'en-AU', gl: 'AU', ceid: 'AU:en' },
  de: { hl: 'de', gl: 'DE', ceid: 'DE:de' },
  fr: { hl: 'fr', gl: 'FR', ceid: 'FR:fr' },
};

/**
 * Curated editorial topic backdrops for articles where RSS feeds
 * omit direct media:content/enclosure tags.
 */
const TOPIC_PHOTO_POOL = {
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=900&auto=format&fit=crop&q=80',
  ],
  business: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=900&auto=format&fit=crop&q=80',
  ],
  science: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=900&auto=format&fit=crop&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=900&auto=format&fit=crop&q=80',
  ],
  world: [
    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=900&auto=format&fit=crop&q=80',
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=900&auto=format&fit=crop&q=80',
  ],
  general: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80',
  ],
};

function getTopicPhoto(category, index = 0) {
  const cat = (category || 'general').toLowerCase();
  const pool = TOPIC_PHOTO_POOL[cat] || TOPIC_PHOTO_POOL.general;
  return pool[index % pool.length];
}

function cleanHtmlText(raw = '') {
  let cleaned = raw.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
  // First decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Then strip all HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * Parses RSS XML into unified article format.
 */
export function parseRssXml(xmlString, category = 'general') {
  if (!xmlString || typeof xmlString !== 'string') return [];

  const articles = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  let index = 0;

  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemXml = match[1];

    // Extract title
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    let rawTitle = titleMatch ? titleMatch[1] : '';
    rawTitle = cleanHtmlText(rawTitle);

    // Extract link
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
    const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';

    // Extract pubDate
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    let publishedAt = new Date().toISOString();
    if (pubDateMatch) {
      const parsedDate = new Date(pubDateMatch[1].trim());
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
      }
    }

    // Extract source
    const sourceMatch =
      itemXml.match(/<source[^>]*url=[\"'](.*?)[\"'][^>]*>([\s\S]*?)<\/source>/i) ||
      itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    let sourceName = sourceMatch ? cleanHtmlText(sourceMatch[2] || sourceMatch[1] || '') : '';

    // Strip source suffix from title if present (e.g. "Headline - Reuters")
    if (sourceName && rawTitle.endsWith(` - ${sourceName}`)) {
      rawTitle = rawTitle.slice(0, -(sourceName.length + 3)).trim();
    } else if (!sourceName) {
      const parts = rawTitle.split(' - ');
      if (parts.length > 1) {
        sourceName = parts[parts.length - 1].trim();
        rawTitle = parts.slice(0, -1).join(' - ').trim();
      } else {
        sourceName = 'Live Wire';
      }
    }

    // Extract description / content snippet
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i);
    let description = descMatch ? cleanHtmlText(descMatch[1]) : '';
    // Strip trailing publisher links often present in Google News RSS description
    if (description.includes(rawTitle)) {
      description = description.replace(rawTitle, '').trim();
    }
    if (description.startsWith(sourceName)) {
      description = description.replace(sourceName, '').trim();
    }
    if (!description || description.length < 15) {
      description = `${rawTitle}. Reporting live dispatch via ${sourceName}.`;
    }

    // Extract Image (enclosure, media:content, media:thumbnail, or img tag)
    let imageUrl = '';
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=[\"'](.*?)[\"']/i);
    const mediaContentMatch = itemXml.match(/<media:content[^>]+url=[\"'](.*?)[\"']/i);
    const mediaThumbMatch = itemXml.match(/<media:thumbnail[^>]+url=[\"'](.*?)[\"']/i);
    const imgTagMatch = itemXml.match(/<img[^>]+src=[\"'](.*?)[\"']/i);

    if (enclosureMatch && enclosureMatch[1]) imageUrl = enclosureMatch[1];
    else if (mediaContentMatch && mediaContentMatch[1]) imageUrl = mediaContentMatch[1];
    else if (mediaThumbMatch && mediaThumbMatch[1]) imageUrl = mediaThumbMatch[1];
    else if (imgTagMatch && imgTagMatch[1]) imageUrl = imgTagMatch[1];

    if (!imageUrl || !imageUrl.startsWith('http')) {
      imageUrl = getTopicPhoto(category, index);
    }

    if (rawTitle && link) {
      articles.push({
        source: {
          id: sourceName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: sourceName,
        },
        author: sourceName,
        title: rawTitle,
        description,
        url: link,
        urlToImage: imageUrl,
        publishedAt,
        content: `${rawTitle}\n\n${description}\n\nDispatched through real-time syndicated news wire from ${sourceName}.`,
        category: category || 'general',
      });
      index++;
    }
  }

  return articles;
}

/**
 * Fetch live syndicated news from verified public RSS wire feeds.
 */
export async function fetchLiveWireNews({
  country = 'in',
  category = '',
  query = '',
  limit = 20,
} = {}) {
  const locale = REGION_LOCALE_MAP[country.toLowerCase()] || REGION_LOCALE_MAP.us;
  const urls = [];

  if (query) {
    // Search query feed
    urls.push(
      `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`
    );
  } else if (category && CATEGORY_TOPIC_MAP[category.toLowerCase()]) {
    // Category feed
    const topic = CATEGORY_TOPIC_MAP[category.toLowerCase()];
    urls.push(
      `https://news.google.com/rss/headlines/section/topic/${topic}?hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`
    );
  } else {
    // Top headlines
    if (country === 'in') {
      urls.push('https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en');
      urls.push('https://timesofindia.indiatimes.com/rssfeedstopstories.cms');
    } else if (country === 'gb') {
      urls.push('https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en');
      urls.push('https://feeds.bbci.co.uk/news/world/rss.xml');
    } else {
      urls.push(`https://news.google.com/rss?hl=${locale.hl}&gl=${locale.gl}&ceid=${locale.ceid}`);
      urls.push('https://feeds.bbci.co.uk/news/world/rss.xml');
    }
  }

  let aggregated = [];

  for (const feedUrl of urls) {
    try {
      const response = await axios.get(feedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        timeout: 3500,
        maxRedirects: 5,
      });

      if (response.data) {
        const parsed = parseRssXml(response.data, category || 'general');
        aggregated.push(...parsed);
      }

      if (aggregated.length >= limit) break;
    } catch (err) {
      console.warn(`[WireService] Feed fetch failed for ${feedUrl}:`, err.message);
    }
  }

  // Deduplicate by title or URL safely
  const seen = new Set();
  const uniqueArticles = [];
  for (const art of aggregated) {
    if (!art || !art.title) continue;
    const key = art.title.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueArticles.push(art);
    }
  }

  return uniqueArticles.slice(0, limit);
}
