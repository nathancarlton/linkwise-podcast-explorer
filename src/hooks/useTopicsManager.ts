
import { useState } from 'react';
import { toast } from 'sonner';

export const useTopicsManager = () => {
  // Topics to avoid state
  const [topicsToAvoid, setTopicsToAvoid] = useState<string[]>([]);
  const [newTopicToAvoid, setNewTopicToAvoid] = useState<string>('');
  
  // Topics to add state
  const [topicsToAdd, setTopicsToAdd] = useState<string[]>([]);
  const [newTopicToAdd, setNewTopicToAdd] = useState<string>('');

  const handleAddTopicToAvoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicToAvoid.trim() && topicsToAvoid.length < 10) {
      if (!topicsToAvoid.includes(newTopicToAvoid.trim())) {
        setTopicsToAvoid([...topicsToAvoid, newTopicToAvoid.trim()]);
        setNewTopicToAvoid('');
      } else {
        toast.error('This topic is already in the list');
      }
    }
  };

  const handleRemoveTopicToAvoid = (topic: string) => {
    setTopicsToAvoid(topicsToAvoid.filter(t => t !== topic));
  };

  const handleAddTopicToAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicToAdd.trim() && topicsToAdd.length < 10) {
      if (!topicsToAdd.includes(newTopicToAdd.trim())) {
        setTopicsToAdd([...topicsToAdd, newTopicToAdd.trim()]);
        setNewTopicToAdd('');
      } else {
        toast.error('This topic is already in the list');
      }
    }
  };

  const handleRemoveTopicToAdd = (topic: string) => {
    setTopicsToAdd(topicsToAdd.filter(t => t !== topic));
  };

  return {
    topicsToAvoid,
    newTopicToAvoid,
    setNewTopicToAvoid,
    handleAddTopicToAvoid,
    handleRemoveTopicToAvoid,
    topicsToAdd,
    newTopicToAdd,
    setNewTopicToAdd,
    handleAddTopicToAdd,
    handleRemoveTopicToAdd
  };
};
