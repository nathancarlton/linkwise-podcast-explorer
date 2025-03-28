
/**
 * Configuration and setup for OpenAI API requests
 */

/**
 * Build a system prompt for finding high-quality links
 * 
 * @param domainsToAvoid Domains to exclude from results
 * @returns System prompt string
 */
export const buildSystemPrompt = (domainsToAvoid: string[] = []): string => {
  const domainsToAvoidStr = domainsToAvoid.length > 0 
    ? `Avoid linking to these domains: ${domainsToAvoid.join(', ')}.` 
    : '';

  return `Find high-quality links related to the given topics and their contexts.
For each topic, provide 2–3 unique links from diverse, authoritative sources (e.g., official sites, popular and respected sources of fact-based information, book publishers, .org, .edu), avoiding low-value sites (e.g., ads, forums, other podcasts).
Each link should include a clean, accurate description in plain text, using the meta description from the page, if available.
Or if meta description is not available, provide a relevant, concise, one-sentence summary of the page content.
(Ensure descriptions reflect what the user will find on the page.) Confirm the content is directly relevant to the topic and context.

  ${domainsToAvoidStr}`;
};

/**
 * Build a user prompt for finding links for topics
 * 
 * @param topicsFormatted Formatted topics for the prompt
 * @param domainsToAvoid Domains to exclude from results
 * @returns User prompt string
 */
export const buildUserPrompt = (
  topicsFormatted: any[],
  domainsToAvoid: string[] = []
): string => {
  const topicsJson = JSON.stringify(topicsFormatted);
  
  return `Find links for: ${topicsJson}. For each topic, find at least 2-3 different links from high-quality, authoritative sources. Each link must include a page title that represents the page topic (not the domain) and a clean, concise description of the page in plain text (no markdown). Do not add any extra text like "here are some links..." Do not use any markdown.
  ${domainsToAvoid.length > 0 ? `Avoid these domains: ${domainsToAvoid.join(', ')}.` : ''}`;
};

/**
 * Get the headers for OpenAI API requests
 * 
 * @param apiKey OpenAI API key
 * @returns Headers object
 */
export const getOpenAIHeaders = (apiKey: string) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
};
