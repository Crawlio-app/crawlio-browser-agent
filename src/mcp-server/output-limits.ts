/**
 * Configurable output size limits for context flooding prevention.
 *
 * Prevents a single large page from consuming the entire LLM context window.
 * Modeled after agent-browser's AGENT_BROWSER_MAX_OUTPUT env var (cli/src/flags.rs:327).
 *
 * Enabled via CRAWLIO_MAX_OUTPUT env var — character-level truncation.
 * Default: unlimited (no truncation).
 *
 * Applied BEFORE content boundaries in the tool response pipeline.
 */

export interface TruncationResult {
  content: string;
  truncated: boolean;
  originalSize: number;
  estimatedTokens: number;
}

/**
 * Truncate content to a maximum character count.
 * If truncated, appends a marker showing original vs shown size.
 */
export function truncateOutput(content: string, maxChars: number): TruncationResult {
  const originalSize = content.length;
  const estimatedTokens = Math.ceil(originalSize / 4);

  if (originalSize <= maxChars) {
    return { content, truncated: false, originalSize, estimatedTokens };
  }

  const truncated = content.slice(0, maxChars);
  const shownChars = truncated.length;
  const result = `${truncated}\n[truncated: showing ${shownChars} of ${originalSize} chars]`;

  return {
    content: result,
    truncated: true,
    originalSize,
    estimatedTokens: Math.ceil(result.length / 4),
  };
}

/**
 * Read CRAWLIO_MAX_OUTPUT env var. Returns null if unset or invalid.
 */
export function getMaxOutput(): number | null {
  const raw = process.env.CRAWLIO_MAX_OUTPUT;
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}
