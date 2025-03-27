
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

interface DomainAvoidListProps {
  domains: string[];
  onRemove: (domain: string) => void;
  newDomain: string;
  setNewDomain: (domain: string) => void;
  onAdd: (e: React.FormEvent) => void;
  disabled?: boolean;
}

const DomainAvoidList: React.FC<DomainAvoidListProps> = ({
  domains,
  onRemove,
  newDomain,
  setNewDomain,
  onAdd,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Domains to Avoid ({domains.length}/10)</h3>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {domains.map((domain) => (
          <div 
            key={domain} 
            className="inline-flex items-center bg-secondary/70 text-sm rounded-md px-2 py-1"
          >
            <button
              type="button"
              onClick={() => onRemove(domain)}
              className="mr-1 hover:text-destructive transition-colors"
              disabled={disabled}
              aria-label={`Remove ${domain}`}
            >
              <X className="h-3 w-3" />
            </button>
            <span>{domain}</span>
          </div>
        ))}
      </div>
      
      <form onSubmit={onAdd} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Enter domain to avoid (e.g., example.com)"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          disabled={disabled || domains.length >= 10}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="sm" 
          variant="outline"
          disabled={disabled || !newDomain.trim() || domains.length >= 10}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground">
        Enter comma-separated domains to avoid in search results. Example: example.com, another.org
      </p>
    </div>
  );
};

export default DomainAvoidList;
