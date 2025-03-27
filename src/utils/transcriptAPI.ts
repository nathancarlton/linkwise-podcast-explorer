
// Re-export the functionality from the refactored files for backward compatibility
import { processTranscript } from './transcriptProcessor';
import { findLinksForTopics } from './linkFinder';

export { processTranscript, findLinksForTopics };
