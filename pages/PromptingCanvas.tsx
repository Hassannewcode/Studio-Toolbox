
import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Slider } from '../components/ui/Slider';
import { Spinner } from '../components/ui/Spinner';
import { BeakerIcon } from '../components/icons/BeakerIcon';
import { PageHeader } from '../components/PageHeader';
import usePersistentState from '../hooks/usePersistentState';

const PromptStudio: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('promptStudio_prompt', 'Write a short story about a robot who discovers music.');
  const [systemInstruction, setSystemInstruction] = usePersistentState<string>('promptStudio_systemInstruction', 'You are a creative writer for a tech-savvy audience.');
  const [temperature, setTemperature] = usePersistentState<number>('promptStudio_temperature', 0.9);
  const [topK, setTopK] = usePersistentState<number>('promptStudio_topK', 1);
  const [topP, setTopP] = usePersistentState<number>('promptStudio_topP', 1);
  const [response, setResponse] = usePersistentState<string>('promptStudio_response', '');
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
    try {
      const result = await generateText(prompt, systemInstruction, temperature, topK, topP);
      setResponse(result.text);
    } catch (err) {
      setError('Failed to generate text. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader 
            icon={<BeakerIcon className="w-6 h-6" />}
            title="Prompt Studio"
            description="The core sandbox for text generation. Craft, test, and refine your prompts."
        />

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Canvas Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="flex-grow flex flex-col" padding="none">
                 <div className="p-6 flex-grow">
                    <Textarea
                        id="prompt-canvas"
                        label="User Prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt here..."
                        className="flex-grow !bg-surface text-base min-h-[200px]"
                    />
                </div>
                 <div className="border-t border-border-color p-4 bg-surface rounded-b-lg flex items-center justify-end">
                    <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt}>
                        Generate
                    </Button>
                </div>
            </Card>
             <Card className="p-6">
                <h3 className="text-lg font-medium text-on-surface mb-4">Generated Output</h3>
                <div className="bg-background rounded-md p-4 min-h-[250px] overflow-y-auto border border-border-color">
                    {isLoading && <Spinner />}
                    {error && <p className="text-red-500">{error}</p>}
                    {response && <p className="whitespace-pre-wrap text-on-surface-variant">{response}</p>}
                    {!isLoading && !response && !error && <p className="text-on-surface-variant/70">Your generated text will appear here.</p>}
                </div>
            </Card>
        </div>

        {/* Right Sidebar for Config */}
        <div className="lg:col-span-1">
            <Card className="p-6 flex flex-col space-y-6 sticky top-6">
                <h3 className="text-lg font-medium text-on-surface">Configuration</h3>
                 <Textarea
                    id="systemInstruction"
                    label="System Instruction"
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    rows={4}
                    placeholder="e.g., You are a helpful assistant."
                />
                <Slider
                    label="Temperature"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
                <Slider
                    label="Top-K"
                    min="1"
                    max="100"
                    step="1"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                />
                <Slider
                    label="Top-P"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                />
            </Card>
        </div>
    </div>
    </div>
  );
};

export default PromptStudio;
