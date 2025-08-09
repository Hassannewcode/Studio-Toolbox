import React, { useState } from 'react';
import { Type } from '@google/genai';
import { generateJson } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { FireIcon } from '../components/icons/FireIcon';
import { PageHeader } from '../components/PageHeader';

const schema = {
  type: Type.OBJECT,
  properties: {
    original_prompt: { type: Type.STRING },
    revised_prompt: { type: Type.STRING, description: 'An improved version of the prompt.' },
    reasoning: { type: Type.STRING, description: 'A brief explanation of why the revised prompt is better.' }
  },
  required: ["original_prompt", "revised_prompt", "reasoning"]
};

interface RefinerResult {
  revised_prompt: string;
  reasoning: string;
}

const PromptRefiner: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('promptRefiner_prompt', 'give me code');
  const [result, setResult] = usePersistentState<RefinerResult | null>('promptRefiner_result', null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt) {
      setError('Prompt cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    const fullPrompt = `Analyze and refine the following user prompt to make it more effective for a large language model. Provide a revised prompt and a short explanation for your changes. The user's prompt is: "${prompt}"`;
    try {
      const response = await generateJson(fullPrompt, schema);
      const data = JSON.parse(response.text);
      setResult(data);
    } catch (err) {
      setError('Failed to refine prompt. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        icon={<FireIcon className="w-6 h-6" />}
        title="Prompt Refiner"
        description="Get AI-powered suggestions to improve the clarity and effectiveness of your prompts."
      />
      <Card className="p-6 mb-6">
        <Textarea
          id="prompt"
          label="Prompt to Refine"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Enter a prompt you want to improve..."
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt}>
            Refine Prompt
          </Button>
        </div>
      </Card>

      <Card className="p-6 min-h-[300px]">
        <h3 className="text-lg font-medium text-on-surface mb-4">Refinement Suggestions</h3>
        <div className="overflow-y-auto">
          {isLoading && <Spinner />}
          {error && <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md text-red-300">{error}</div>}
          {result ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-semibold text-on-surface mb-1">Revised Prompt</h4>
                <div className="bg-background p-3 rounded-md text-on-surface-variant border border-border-color">{result.revised_prompt}</div>
              </div>
              <div>
                <h4 className="text-md font-semibold text-on-surface mb-1">Reasoning</h4>
                <div className="bg-background p-3 rounded-md text-on-surface-variant border border-border-color">{result.reasoning}</div>
              </div>
            </div>
          ) : (
            !isLoading && !error && <p className="text-on-surface-variant/70 p-4">Your prompt refinement suggestions will appear here.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PromptRefiner;
