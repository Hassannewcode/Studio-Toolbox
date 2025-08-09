import React, { useState } from 'react';
import { generateWithSearch } from '../services/geminiService';
import { type GroundingChunk } from '../types';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PageHeader } from '../components/PageHeader';

const GroundedSearch: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('groundedSearch_prompt', 'Who won the latest Formula 1 Grand Prix?');
  const [response, setResponse] = usePersistentState<string>('groundedSearch_response', '');
  const [sources, setSources] = usePersistentState<GroundingChunk[]>('groundedSearch_sources', []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt) {
      setError('Prompt cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse('');
    setSources([]);
    try {
      const result = await generateWithSearch(prompt);
      setResponse(result.text);
      if (result.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          setSources(result.candidates[0].groundingMetadata.groundingChunks as GroundingChunk[]);
      }
    } catch (err) {
      setError('Failed to generate response. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        icon={<SearchIcon className="w-6 h-6" />}
        title="Grounded Search"
        description="Get answers to topical questions grounded in Google Search results."
      />
      <Card className="p-6 mb-6">
        <div className="flex gap-2">
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about recent events..."
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
            />
            <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt}>
                Search & Generate
            </Button>
        </div>
      </Card>
      
      <Card className="p-6 min-h-[300px]">
        {isLoading && <Spinner />}
        {error && <p className="text-red-500">{error}</p>}
        {response && (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-on-surface mb-2">Response</h3>
                    <p className="whitespace-pre-wrap text-on-surface-variant">{response}</p>
                </div>
                {sources.length > 0 && (
                    <div>
                        <h4 className="text-md font-medium text-on-surface mb-2">Sources</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {sources.map((source, index) => (
                                <li key={index}>
                                    <a 
                                        href={source.web.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        {source.web.title || source.web.uri}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}
        {!isLoading && !response && !error && <p className="text-on-surface-variant/70">The response grounded with web search will appear here.</p>}
      </Card>
    </div>
  );
};

export default GroundedSearch;
