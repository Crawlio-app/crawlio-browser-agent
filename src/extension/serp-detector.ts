// Pure SERP detection module — no Chrome API calls, fully testable
// RE sources: Keywords Everywhere SourceList.js (26-site URL patterns, 'gsearc' key),
// Keyword Surfer serviceWorker.js (/google.[^/]*\/search\?/ regex),
// Detailed SEO serviceWorker-Crr5S-23.js (status:"loading" trigger, URL match)

/** Google SERP URL pattern — matches google.com, google.co.uk, google.com.au, etc.
 * Derived from Keyword Surfer's /google.[^/]*\/search\?/ and KE's gsearc pattern.
 * Must have /search? with a q= parameter to distinguish SERP from homepage/other pages. */
const GOOGLE_SERP_REGEX = /^https?:\/\/(?:www\.)?google\.[a-z.]+\/search\?/i;

export interface SerpPattern {
  name: string;
  test: (url: string) => boolean;
}

/** Compiled SERP patterns — Google for now, extensible for Bing/Yahoo/DDG later */
export const SERP_PATTERNS: SerpPattern[] = [
  {
    name: "Google",
    test: (url: string) => GOOGLE_SERP_REGEX.test(url) && extractSearchQuery(url) !== null,
  },
];

/** Check if a URL is a Google SERP page */
export function isGoogleSerp(url: string): boolean {
  if (!url) return false;
  return SERP_PATTERNS.some(p => p.test(url));
}

/** Extract the search query (q= parameter) from a Google SERP URL.
 * Returns null if URL is not a SERP or has no query. */
export function extractSearchQuery(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const q = parsed.searchParams.get("q");
    return q && q.trim().length > 0 ? q.trim() : null;
  } catch {
    return null;
  }
}
