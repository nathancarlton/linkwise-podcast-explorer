
// Main functionality for processing transcripts and finding topics

import { processTranscript as processTranscriptImpl } from './transcriptUtils';
import { findLinksForTopics } from './linkFinder';
import { parseUserProvidedLinks } from './linkParser';
import { testLinkSearch, testFullProcess } from './testLinkSearch';

// Re-export the implementations
export {
  processTranscriptImpl as processTranscript,
  findLinksForTopics,
  parseUserProvidedLinks,
  testLinkSearch,
  testFullProcess
};
