import React, { useState } from 'react';
import { Type } from '@google/genai';
import { generateJson } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { PuzzlePieceIcon } from '../components/icons/PuzzlePieceIcon';
import { PageHeader } from '../components/PageHeader';

const schema = {
  type: Type.OBJECT,
  properties: {
    applicationName: { type: Type.STRING },
    services: {
      type: Type.ARRAY,
      description: 'The list of microservices for the application.',
      items: {
        type: Type.OBJECT,
        properties: {
          serviceName: { type: Type.STRING, description: 'e.g., "auth-service"' },
          responsibility: { type: Type.STRING, description: 'A brief description of what this service does.' },
          apiEndpoints: {
            type: Type.ARRAY,
            description: 'A list of API endpoints for this service.',
            items: {
                type: Type.OBJECT,
                properties: {
                    path: { type: Type.STRING, description: 'e.g., "/users/register"' },
                    method: { type: Type.STRING, enum: ["GET", "POST", "PUT", "DELETE"] },
                    description: { type: Type.STRING }
                }
            }
          }
        }
      }
    }
  }
};

const ArchitectureDesigner: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('architectureDesigner_prompt', 'An e-commerce platform for selling custom t-shirts.');
  const [response, setResponse] = usePersistentState<string>('architectureDesigner_response', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt) {
      setError('App description cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse('');
    const fullPrompt = `Generate a microservice architecture for the following application: ${prompt}`;
    try {
      const result = await generateJson(fullPrompt, schema);
      setResponse(result.text);
    } catch (err) {
      setError('Failed to generate architecture. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader
            icon={<PuzzlePieceIcon className="w-6 h-6" />}
            title="Architecture Designer"
            description="Describe an application to generate a high-level microservice architecture."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col">
                <div className="flex-grow flex flex-col space-y-6">
                    <Textarea
                        id="prompt"
                        label="Application Description"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={8}
                        placeholder="Describe the application you want to architect..."
                        className="flex-grow"
                    />
                    <div className="mt-auto">
                        <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt} className="w-full">
                            Generate Architecture
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="p-6 flex flex-col">
                <h3 className="text-lg font-medium text-on-surface mb-4">Suggested Architecture (JSON)</h3>
                <div className="flex-grow overflow-y-auto min-h-[300px] bg-background border border-border-color rounded-md">
                    {isLoading && <div className="flex items-center justify-center h-full"><Spinner /></div>}
                    {error && <div className="p-4"><p className="text-red-500">{error}</p></div>}
                    {response && <CodeBlock code={response} language="json" />}
                    {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">Your generated architecture will appear here.</p>}
                </div>
            </Card>
        </div>
    </div>
  );
};

export default ArchitectureDesigner;
