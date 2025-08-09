import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Slider } from '../components/ui/Slider';
import { Spinner } from '../components/ui/Spinner';
import { ChatBubbleBottomCenterTextIcon } from '../components/icons/ChatBubbleBottomCenterTextIcon';
import { PageHeader } from '../components/PageHeader';

const AbModelTester: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('abModelTester_prompt', 'Write a short, dramatic paragraph about a storm approaching a lighthouse.');
  const [tempA, setTempA] = usePersistentState<number>('abModelTester_tempA', 0.2);
  const [tempB, setTempB] = usePersistentState<number>('abModelTester_tempB', 0.9);
  const [responseA, setResponseA] = usePersistentState<string>('abModelTester_responseA', '');
  const [responseB, setResponseB] = usePersistentState<string>('abModelTester_responseB', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt) {
      setError('Prompt cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponseA('');
    setResponseB('');

    try {
      const [resultA, resultB] = await Promise.all([
        generateText(prompt, 'You are a creative writer.', tempA, 1, 1),
        generateText(prompt, 'You are a creative writer.', tempB, 1, 1),
      ]);
      setResponseA(resultA.text);
      setResponseB(resultB.text);
    } catch (err) {
      setError('Failed to generate responses. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader
            icon={<ChatBubbleBottomCenterTextIcon className="w-6 h-6" />}
            title="A/B Model Tester"
            description="Compare model outputs using the same prompt but different temperature settings."
        />
      <Card className="p-6 mb-6">
        <Textarea
          id="prompt"
          label="Common Prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt}>
            Generate and Compare
          </Button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Model A (Less Creative)</h3>
          <Slider
            label="Temperature"
            min="0"
            max="1"
            step="0.05"
            value={tempA}
            onChange={(e) => setTempA(parseFloat(e.target.value))}
          />
          <div className="mt-4 bg-background border border-border-color rounded-md p-4 min-h-[200px]">
            {isLoading ? <Spinner /> : <p className="whitespace-pre-wrap text-on-surface-variant">{responseA}</p>}
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Model B (More Creative)</h3>
          <Slider
            label="Temperature"
            min="0"
            max="1"
            step="0.05"
            value={tempB}
            onChange={(e) => setTempB(parseFloat(e.target.value))}
          />
          <div className="mt-4 bg-background border border-border-color rounded-md p-4 min-h-[200px]">
            {isLoading ? <Spinner /> : <p className="whitespace-pre-wrap text-on-surface-variant">{responseB}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AbModelTester;
