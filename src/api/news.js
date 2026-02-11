/**
 * News API aggregator — fetches from Reddit (no API key needed)
 */

const NEWS_KEYS_STORAGE = 'gpt-advanced-news-keys';

export function loadNewsKeys() {
    try {
        return JSON.parse(localStorage.getItem(NEWS_KEYS_STORAGE) || '{}');
    } catch { return {}; }
}

export function saveNewsKeys(keys) {
    localStorage.setItem(NEWS_KEYS_STORAGE, JSON.stringify(keys));
}

// Subreddits for a general news feed
const NEWS_SUBREDDITS = [
    'worldnews', 'technology', 'science', 'business',
    'stocks', 'programming', 'gadgets', 'news',
];

// ─── Reddit ───
async function fetchReddit(subreddits, limit = 6) {
    const results = [];
    for (const sub of subreddits) {
        try {
            const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=${limit}`, {
                headers: { 'User-Agent': 'GPTAdvanced/1.0' },
            });
            if (!res.ok) continue;
            const data = await res.json();
            const posts = data.data?.children || [];
            for (const post of posts) {
                const d = post.data;
                if (d.stickied) continue;
                results.push({
                    source: 'Reddit',
                    sourceIcon: '🟠',
                    subreddit: `r/${sub}`,
                    title: d.title,
                    url: d.url_overridden_by_dest || `https://reddit.com${d.permalink}`,
                    permalink: `https://reddit.com${d.permalink}`,
                    score: d.score,
                    comments: d.num_comments,
                    author: d.author,
                    thumbnail: d.thumbnail && d.thumbnail.startsWith('http') ? d.thumbnail : null,
                    created: d.created_utc * 1000,
                    selftext: d.selftext?.substring(0, 500) || '',
                });
            }
        } catch { /* skip */ }
    }
    return results;
}

// ─── NewsAPI.org ───
async function fetchNewsAPI(apiKey, pageSize = 15) {
    if (!apiKey) return [];
    try {
        const res = await fetch(
            `https://newsapi.org/v2/top-headlines?language=en&pageSize=${pageSize}`,
            { headers: { 'X-Api-Key': apiKey } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.articles || []).map(a => ({
            source: a.source?.name || 'News',
            sourceIcon: '📰',
            title: a.title,
            description: a.description,
            url: a.url,
            thumbnail: a.urlToImage,
            author: a.author,
            created: new Date(a.publishedAt).getTime(),
            selftext: a.content || a.description || '',
        }));
    } catch { return []; }
}

/**
 * Fetch all news — unified feed, no categories
 */
export async function fetchAllNews() {
    const keys = loadNewsKeys();

    const [redditResults, newsResults] = await Promise.all([
        fetchReddit(NEWS_SUBREDDITS, 5),
        fetchNewsAPI(keys.newsapi),
    ]);

    const all = [...newsResults, ...redditResults];
    // Sort by recency
    all.sort((a, b) => (b.created || 0) - (a.created || 0));

    return all;
}
