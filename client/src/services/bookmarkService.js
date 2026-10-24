const BOOKMARKS_STORAGE_KEY = 'nexz_bookmarked_articles';

export function getBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read bookmarks from storage:', e);
    return [];
  }
}

export function isBookmarked(hashOrUrl) {
  if (!hashOrUrl) return false;
  const list = getBookmarks();
  return list.some((item) => item.hash === hashOrUrl || item.url === hashOrUrl);
}

export function toggleBookmark(article) {
  if (!article) return false;
  const list = getBookmarks();
  const id = article.hash || article.url;
  const existingIndex = list.findIndex((item) => (item.hash || item.url) === id);

  let updated;
  let added = false;
  if (existingIndex >= 0) {
    updated = list.filter((_, idx) => idx !== existingIndex);
  } else {
    updated = [
      {
        hash: article.hash,
        title: article.title,
        description: article.description,
        urlToImage: article.urlToImage,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
        savedAt: new Date().toISOString(),
      },
      ...list,
    ];
    added = true;
  }

  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexz-bookmarks-updated', { detail: { bookmarks: updated } }));
  } catch (e) {
    console.error('Failed to save bookmarks:', e);
  }

  return added;
}
