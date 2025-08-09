import React, { useState } from 'react';
import { Type } from '@google/genai';
import { generateJson } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { RectangleGroupIcon } from '../components/icons/RectangleGroupIcon';
import { PageHeader } from '../components/PageHeader';

const schema = {
  type: Type.OBJECT,
  properties: {
    colorPalette: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING, description: 'Hex code for the primary color' },
        secondary: { type: Type.STRING, description: 'Hex code for the secondary color' },
        accent: { type: Type.STRING, description: 'Hex code for the accent color' },
        background: { type: Type.STRING, description: 'Hex code for the background color' },
      }
    },
    userFlow: {
      type: Type.ARRAY,
      description: "A high-level user flow as a series of steps.",
      items: { type: Type.STRING }
    },
    componentSuggestions: {
      type: Type.ARRAY,
      description: "A list of key UI components needed for the app.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Name of the component (e.g., "Project Card")' },
          description: { type: Type.STRING, description: 'A brief description of the component' }
        }
      }
    }
  }
};

const UiSpecGenerator: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('uiSpec_prompt', 'A project management app for small teams. It should feel modern and clean.');
  const [response, setResponse] = usePersistentState<string>('uiSpec_response', '');
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
      const result = await generateJson(prompt, schema);
      setResponse(result.text);
    } catch (err) {
      setError('Failed to generate design concepts. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader
            icon={<RectangleGroupIcon className="w-6 h-6" />}
            title="UI Spec Generator"
            description="Describe an application to generate UI/UX concepts like color palettes and user flows."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col">
                <div className="flex-grow flex flex-col space-y-6">
                    <Textarea
                        id="prompt"
                        label="App Description"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={8}
                        placeholder="Describe the app you want to design..."
                        className="flex-grow"
                    />
                     <div className="mt-auto">
                        <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt} className="w-full">
                            Generate Design Concepts
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="p-6 flex flex-col">
                <h3 className="text-lg font-medium text-on-surface mb-4">Generated Concepts (JSON)</h3>
                <div className="flex-grow overflow-y-auto min-h-[300px] bg-background border border-border-color rounded-md">
                    {isLoading && <div className="flex items-center justify-center h-full"><Spinner/></div>}
                    {error && <div className="p-4"><p className="text-red-500">{error}</p></div>}
                    {response && <CodeBlock code={response} language="json" />}
                    {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">Your generated design concepts will appear here.</p>}
                </div>
            </Card>
        </div>
    </div>
  );
};

export default UiSpecGenerator;
