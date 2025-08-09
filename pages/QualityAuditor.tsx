import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { PageHeader } from '../components/PageHeader';

const QualityAuditor: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('qualityAuditor_prompt', 'Explain the concept of quantum entanglement in simple terms.');
  const [criteria, setCriteria] = usePersistentState<string>('qualityAuditor_criteria', 'The explanation must be understandable by a high school student, be accurate, and use an analogy.');
  const [response, setResponse] = usePersistentState<string>('qualityAuditor_response', '');
  const [evaluation, setEvaluation] = usePersistentState<string>('qualityAuditor_evaluation', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt || !criteria) {
      setError('Prompt and criteria cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse('');
    setEvaluation('');

    try {
      // Step 1: Generate the initial response
      const initialResult = await generateText(prompt, 'You are a helpful expert.', 0.7, 1, 1);
      const initialResponseText = initialResult.text;
      setResponse(initialResponseText);

      // Step 2: Generate the evaluation
      const evaluationPrompt = `Based on the following criteria:\n\n"""${criteria}"""\n\nPlease evaluate the following response:\n\n"""${initialResponseText}"""\n\nProvide a score from 1-10 and a brief justification for your score.`;
      const evaluationResult = await generateText(evaluationPrompt, 'You are a strict but fair evaluator.', 0.5, 1, 1);
      setEvaluation(evaluationResult.text);

    } catch (err) {
      setError('Failed to run test. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="animate-fade-in">
        <PageHeader
            icon={<ShieldCheckIcon className="w-6 h-6" />}
            title="Quality Auditor"
            description="Generate content and then use a second AI call to evaluate it against your criteria."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
            <div className="flex-grow space-y-6">
                <Textarea
                    id="prompt"
                    label="Prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    placeholder="Enter the prompt for the AI..."
                />
                <Textarea
                    id="criteria"
                    label="Evaluation Criteria"
                    value={criteria}
                    onChange={(e) => setCriteria(e.target.value)}
                    rows={5}
                    placeholder="Enter the criteria to judge the response..."
                />
            </div>
            <div className="mt-4 pt-4 border-t border-border-color">
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt || !criteria} className="w-full">
                    Run Audit
                </Button>
            </div>
        </Card>

        <div className="flex flex-col gap-6">
            {isLoading && !response && (
                <Card className="p-6 flex-grow flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="mt-2 text-on-surface-variant">Generating response...</p>
                </Card>
            )}
            {error && <Card className="p-4 bg-red-900/20 border border-red-500/30"><p className="text-red-300">{error}</p></Card>}
            
            {response && (
              <Card className="p-6 flex flex-col">
                <h3 className="text-lg font-medium mb-2 text-on-surface">Generated Response</h3>
                <div className="flex-grow overflow-y-auto bg-background border border-border-color rounded-md p-4 min-h-[150px]">
                  <p className="whitespace-pre-wrap text-on-surface-variant">{response}</p>
                </div>
              </Card>
            )}

            {isLoading && response && (
                <Card className="p-6 flex flex-col items-center justify-center">
                    <Spinner />
                    <p className="mt-2 text-on-surface-variant">Evaluating response...</p>
                </Card>
            )}

            {evaluation && (
              <Card className="p-6 flex flex-col">
                <h3 className="text-lg font-medium mb-2 text-on-surface">AI Self-Evaluation</h3>
                 <div className="flex-grow overflow-y-auto bg-background border border-border-color rounded-md p-4 min-h-[150px]">
                  <p className="whitespace-pre-wrap text-on-surface-variant">{evaluation}</p>
                </div>
              </Card>
            )}
        </div>
        </div>
    </div>
  );
};

export default QualityAuditor;
