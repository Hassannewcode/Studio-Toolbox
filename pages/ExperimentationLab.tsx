import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { BeakerIcon } from '../components/icons/BeakerIcon';
import { PageHeader } from '../components/PageHeader';

const AbPromptTester: React.FC = () => {
  const [promptA, setPromptA] = usePersistentState<string>('abPromptTester_promptA', 'Write a marketing slogan for a new coffee brand called "Warp Drive". Be bold and exciting.');
  const [promptB, setPromptB] = usePersistentState<string>('abPromptTester_promptB', 'Write a marketing slogan for a new coffee brand called "Warp Drive". Focus on speed and energy.');
  const [responseA, setResponseA] = usePersistentState<string>('abPromptTester_responseA', '');
  const [responseB, setResponseB] = usePersistentState<string>('abPromptTester_responseB', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!promptA || !promptB) {
      setError('Both prompts must be filled.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponseA('');
    setResponseB('');

    try {
      const [resultA, resultB] = await Promise.all([
        generateText(promptA, 'You are a marketing copywriter.', 0.8, 1, 1),
        generateText(promptB, 'You are a marketing copywriter.', 0.8, 1, 1),
      ]);
      setResponseA(resultA.text);
      setResponseB(resultB.text);
    } catch (err) {
      setError('Failed to run experiment. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader
            icon={<BeakerIcon className="w-6 h-6" />}
            title="A/B Prompt Tester"
            description="Compare the outputs of two different prompts for the same task."
        />
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea
            id="promptA"
            label="Prompt A"
            value={promptA}
            onChange={(e) => setPromptA(e.target.value)}
            rows={6}
          />
          <Textarea
            id="promptB"
            label="Prompt B"
            value={promptB}
            onChange={(e) => setPromptB(e.target.value)}
            rows={6}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!promptA || !promptB}>
            Run A/B Test
          </Button>
        </div>
      </Card>

      {isLoading && <div className="text-center"><Spinner /></div>}
      {error && <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md text-red-300">{error}</div>}
      
      {!isLoading && (responseA || responseB) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-2">Result A</h3>
            <div className="bg-background border border-border-color rounded-md p-4 min-h-[150px]">
              <p className="whitespace-pre-wrap text-on-surface-variant">{responseA}</p>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-2">Result B</h3>
            <div className="bg-background border border-border-color rounded-md p-4 min-h-[150px]">
              <p className="whitespace-pre-wrap text-on-surface-variant">{responseB}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AbPromptTester;
