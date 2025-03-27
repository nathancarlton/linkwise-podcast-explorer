
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface TranscriptFormProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
}

export const TranscriptForm: React.FC<TranscriptFormProps> = ({ transcript, setTranscript }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Enter Transcript
        </label>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste podcast transcript here..."
          className="min-h-[150px]"
        />
      </div>
    </div>
  );
};
