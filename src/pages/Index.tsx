
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Beaker } from 'lucide-react';

import TranscriptInput from '@/components/TranscriptInput';
import LinksList from '@/components/LinksList';
import LinkSummary from '@/components/LinkSummary';
import TopicList from '@/components/TopicList';
import ApiKeyInput from '@/components/ApiKeyInput';
import BraveApiKeyInput from '@/components/BraveApiKeyInput';
import SearchApiToggle from '@/components/SearchApiToggle';

import { useApiKey } from '@/hooks/useApiKey';
import { useTopicsManager } from '@/hooks/useTopicsManager';
import { useTranscriptProcessor } from '@/hooks/useTranscriptProcessor';
import { ProcessingStage, SearchApiType } from '@/types';

const Index = () => {
  const { 
    openAIApiKey, 
    braveApiKey, 
    selectedSearchApi, 
    handleApiKeySave, 
    handleSearchApiChange, 
    hasValidOpenAIApiKey,
    hasValidBraveApiKey 
  } = useApiKey();
  
  const { 
    topicsToAvoid, newTopicToAvoid, setNewTopicToAvoid,
    handleAddTopicToAvoid, handleRemoveTopicToAvoid
  } = useTopicsManager();

  const {
    processingStage,
    links,
    topics,
    handleProcessTranscript,
    handleLinkToggle,
    handleTopicToggle
  } = useTranscriptProcessor(openAIApiKey, braveApiKey, selectedSearchApi);

  // Add fade effect when component mounts
  useEffect(() => {
    document.body.classList.add('animate-fade-in');
    return () => {
      document.body.classList.remove('animate-fade-in');
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 md:px-8">
      <header className="w-full max-w-4xl text-center mb-8 animate-slide-down">
        <div className="chip mb-2">Generate Useful Links from a Podcast Transcript</div>
        <h1 className="text-4xl font-bold mb-2">Podcast Link Generator</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
          Extract meaningful topics and generate authoritative links from your podcast transcripts.
          Perfect for show notes and resource pages.
        </p>
      </header>
      
      <main className="w-full max-w-4xl">
        <ApiKeyInput onApiKeySave={(key) => handleApiKeySave(key, 'openai')} />
        <BraveApiKeyInput onApiKeySave={(key) => handleApiKeySave(key, 'brave')} />
        
        <SearchApiToggle 
          selectedApi={selectedSearchApi} 
          onToggle={handleSearchApiChange}
          disabled={processingStage === ProcessingStage.ProcessingTranscript || processingStage === ProcessingStage.FindingLinks}
        />
        
        <TranscriptInput 
          onProcess={(transcript, topicCount, domainsToAvoid, topicsToAvoid) => 
            handleProcessTranscript(transcript, topicCount, domainsToAvoid, topicsToAvoid)} 
          processingStage={processingStage}
          hasApiKey={selectedSearchApi === SearchApiType.OpenAI ? hasValidOpenAIApiKey : hasValidBraveApiKey}
          selectedApi={selectedSearchApi}
          topicsToAvoid={topicsToAvoid}
          onAddTopicToAvoid={handleAddTopicToAvoid}
          onRemoveTopicToAvoid={handleRemoveTopicToAvoid}
          newTopicToAvoid={newTopicToAvoid}
          setNewTopicToAvoid={setNewTopicToAvoid}
        />
        
        {topics.length > 0 && (
          <TopicList 
            topics={topics}
            onTopicToggle={handleTopicToggle}
          />
        )}
        
        {links.length > 0 && (
          <>
            <LinksList 
              links={links}
              onLinkToggle={handleLinkToggle}
            />
            <LinkSummary links={links} />
          </>
        )}
      </main>
      
      <footer className="mt-12 text-center text-sm text-muted-foreground animate-fade-in">
        <p>Designed for podcasters to easily share relevant resources with their audience.</p>
        <div className="mt-4">
          <Link to="/tester" className="text-sm flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Beaker className="h-4 w-4" /> 
            Link Tester (DevTool)
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;
