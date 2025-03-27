
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface TopicsFormProps {
  topics: string;
  setTopics: (topics: string) => void;
}

export const TopicsForm: React.FC<TopicsFormProps> = ({ topics, setTopics }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Enter Topics (one per line)
        </label>
        <Textarea
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="Data Visualization,
Machine Learning Ethics,
Sustainable Technology"
          className="min-h-[150px]"
        />
      </div>
    </div>
  );
};
