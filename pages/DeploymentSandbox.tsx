import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { ArrowUpOnSquareIcon } from '../components/icons/ArrowUpOnSquareIcon';
import { PageHeader } from '../components/PageHeader';

type Language = 'Node.js (Express)' | 'Python (Flask)';

const ServerGenerator: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('serverGenerator_prompt', 'A function that takes a topic and returns a 3-sentence summary.');
  const [language, setLanguage] = usePersistentState<Language>('serverGenerator_language', 'Python (Flask)');
  const [response, setResponse] = usePersistentState<string>('serverGenerator_response', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt) {
      setError('Prompt description cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse('');

    const lang = language.split(' ')[0].toLowerCase();
    const systemInstruction = `
      You are an expert software developer. Your task is to generate a complete, runnable server file for the specified language and framework.
      The server should have a single POST endpoint at '/generate'.
      This endpoint should accept a JSON body with a 'prompt' key.
      It should then call the Gemini API with the provided prompt and return the model's response.
      The code should be a single file, well-commented, and include all necessary imports and setup.
      Do not include any explanatory text or markdown formatting outside of the code itself.
      Use placeholder "YOUR_API_KEY" for the API key.
    `;
    const fullPrompt = `Generate a ${language} server for the following purpose: ${prompt}`;

    try {
      const result = await generateText(fullPrompt, systemInstruction, 0.2, 1, 1);
      setResponse(result.text);
    } catch (err) {
      setError('Failed to generate deployment code. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<ArrowUpOnSquareIcon className="w-6 h-6" />}
        title="Server Generator"
        description="Generate complete, runnable server boilerplate for a specified task."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 flex flex-col self-start">
            <div className="space-y-6 flex flex-col flex-grow">
              <Select
                id="language"
                label="Language / Framework"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                <option value="Python (Flask)">Python (Flask)</option>
                <option value="Node.js (Express)">Node.js (Express)</option>
              </Select>
              <Textarea
                id="prompt"
                label="API Endpoint Purpose"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                placeholder="e.g., A function that translates text to French."
                className="flex-grow"
              />
              <div className="mt-auto">
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt} className="w-full">
                  Generate Boilerplate
                </Button>
              </div>
            </div>
        </Card>

        <Card className="lg:col-span-2 p-6 flex-grow flex flex-col">
          <h3 className="text-lg font-medium text-on-surface mb-4">Generated Server Code</h3>
          <div className="flex-grow overflow-y-auto min-h-[400px] bg-background border border-border-color rounded-md">
            {isLoading && <div className="flex items-center justify-center h-full"><Spinner /></div>}
            {error && <div className="p-4"><p className="text-red-500">{error}</p></div>}
            {response && <CodeBlock code={response} language={language.includes('Python') ? 'python' : 'javascript'} />}
            {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">Your generated server code will appear here.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ServerGenerator;
