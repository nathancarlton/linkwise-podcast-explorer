
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

  return `For each of the given topics, search the web and find relevant, high-quality links. For EACH topic, clearly mark the topic with a number or heading (e.g., "1. Topic Name:") and provide at least 2 useful links. ${domainsToAvoidStr}`;
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
  const topicsStr = topicsFormatted.map((t, i) => `${i+1}. ${t.topic}`).join('\n');
  
  const domainsToAvoidStr = domainsToAvoid.length > 0 
    ? `\n\nAvoid these domains: ${domainsToAvoid.join(', ')}.` 
    : '';

  return `Find links for each of these topics (search for EACH topic separately):\n${topicsStr}${domainsToAvoidStr}\n\nFor each topic, provide at least 2 relevant links with clear section headers.`;
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
