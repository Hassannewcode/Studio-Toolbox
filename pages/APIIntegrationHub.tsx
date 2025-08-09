import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { ArrowsRightLeftIcon } from '../components/icons/ArrowsRightLeftIcon';
import { PageHeader } from '../components/PageHeader';

const ApiConnector: React.FC = () => {
  const [api1, setApi1] = usePersistentState<string>('apiConnector_api1', '// Weather API Endpoint\n// GET /weather?city={city}\n// Returns: { "temp_c": 25, "condition": "Sunny" }');
  const [api2, setApi2] = usePersistentState<string>('apiConnector_api2', '// Notification API Endpoint\n// POST /notify\n// Body: { "user": "test", "message": "Your message here" }');
  const [response, setResponse] = usePersistentState<string>('apiConnector_response', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!api1 || !api2) {
      setError('Both API descriptions are required.');
      return;
    }
    setIsLoading(true);
setError(null);
    setResponse('');

    const prompt = `
      You are an expert API integration specialist.
      Given the following two API specifications, provide a brief explanation of how to integrate them and a simple code snippet (in Python or JavaScript) demonstrating the integration.
      The goal is to use data from API 1 and send it to API 2.

      API 1 Spec:
      \`\`\`
      ${api1}
      \`\`\`

      API 2 Spec:
      \`\`\`
      ${api2}
      \`\`\`

      Provide the response as raw text, including a code block for the example.
    `;

    try {
      const result = await generateText(prompt, 'You are an expert software architect.', 0.3, 1, 1);
      setResponse(result.text);
    } catch (err) {
      setError('Failed to generate integration plan. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader
            icon={<ArrowsRightLeftIcon className="w-6 h-6" />}
            title="API Connector"
            description="Describe two APIs and get an AI-generated plan for how to connect them."
        />
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textarea
            id="api1"
            label="API 1 Specification"
            value={api1}
            onChange={(e) => setApi1(e.target.value)}
            rows={8}
            className="font-mono text-xs !bg-background"
            placeholder="Describe the first API endpoint, parameters, and response."
          />
          <Textarea
            id="api2"
            label="API 2 Specification"
            value={api2}
            onChange={(e) => setApi2(e.target.value)}
            rows={8}
            className="font-mono text-xs !bg-background"
            placeholder="Describe the second API endpoint and its expected input."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!api1 || !api2}>
            Generate Integration Plan
          </Button>
        </div>
      </Card>

      <Card className="p-6 min-h-[300px]">
        <h3 className="text-lg font-medium text-on-surface mb-4">Integration Plan & Code</h3>
        <div className="overflow-y-auto">
          {isLoading && <Spinner />}
          {error && <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md text-red-300">{error}</div>}
          {response && <CodeBlock code={response} language="markdown" />}
          {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">Your generated integration plan will appear here.</p>}
        </div>
      </Card>
    </div>
  );
};

export default ApiConnector;
