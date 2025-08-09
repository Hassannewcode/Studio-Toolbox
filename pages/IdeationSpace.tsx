
import React, { useState } from 'react';
import { Type } from '@google/genai';
import { generateJson } from '../services/geminiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { LightBulbIcon } from '../components/icons/LightBulbIcon';
import { PageHeader } from '../components/PageHeader';
import usePersistentState from '../hooks/usePersistentState';

const schema = {
  type: Type.OBJECT,
  properties: {
    centralTopic: { type: Type.STRING },
    mainBranches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          subTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      }
    }
  }
};

const IdeationSpace: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('ideationSpace_prompt', 'The future of renewable energy');
  const [response, setResponse] = usePersistentState<string>('ideationSpace_response', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt) {
      setError('Topic cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse('');
    const fullPrompt = `Generate a mind map for the topic: ${prompt}`;
    try {
      const result = await generateJson(fullPrompt, schema);
      setResponse(result.text);
    } catch (err) {
      setError('Failed to generate ideas. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <PageHeader
            icon={<LightBulbIcon className="w-6 h-6" />}
            title="Ideation Space"
            description="A brainstorming tool to generate and explore new ideas as a mind map."
        />
      <Card className="p-6 mb-6">
        <div className="flex gap-2">
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a topic to brainstorm..."
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
            />
            <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt}>
                Generate Ideas
            </Button>
        </div>
      </Card>
      
      <Card className="p-6 min-h-[400px]">
        <h3 className="text-lg font-medium text-on-surface mb-4">Mind Map (JSON)</h3>
        <div className="overflow-y-auto">
          {isLoading && <Spinner />}
          {error && <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md text-red-300">{error}</div>}
          {response && <CodeBlock code={response} language="json" />}
          {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">Your generated mind map will appear here.</p>}
        </div>
      </Card>
    </div>
  );
};

export default IdeationSpace;
