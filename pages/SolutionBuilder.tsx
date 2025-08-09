
import React, { useState } from 'react';
import { Type } from '@google/genai';
import { generateJson } from '../services/geminiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { CodeIcon } from '../components/icons/CodeIcon';
import { PageHeader } from '../components/PageHeader';
import usePersistentState from '../hooks/usePersistentState';

const defaultSchema = {
    type: Type.OBJECT,
    properties: {
        projectName: { type: Type.STRING },
        technologies: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
    },
    required: ["projectName", "technologies", "difficulty"]
};

const JsonGenerator: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('jsonGenerator_prompt', 'Generate a fun weekend project idea for a React developer.');
  const [schema, setSchema] = usePersistentState<string>('jsonGenerator_schema', JSON.stringify(defaultSchema, null, 2));
  const [response, setResponse] = usePersistentState<string>('jsonGenerator_response', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt || !schema) {
      setError('Prompt and schema cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResponse('');
    try {
      const parsedSchema = JSON.parse(schema);
      const result = await generateJson(prompt, parsedSchema);
      setResponse(result.text);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON in schema. Please correct it.');
      } else {
        setError('Failed to generate JSON. Check console for details.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader
            icon={<CodeIcon className="w-6 h-6" />}
            title="JSON Generator"
            description="Generate structured JSON data based on a prompt and a response schema."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
            <div className="flex-grow space-y-6 flex flex-col">
                <Textarea
                    id="prompt"
                    label="Prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Describe the data you want..."
                />
                <Textarea
                    id="schema"
                    label="Response Schema (JSON)"
                    value={schema}
                    onChange={(e) => setSchema(e.target.value)}
                    className="font-mono text-xs !bg-background flex-grow"
                />
            </div>
            <div className="mt-4 pt-4 border-t border-border-color">
                <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt || !schema} className="w-full">
                    Generate JSON
                </Button>
            </div>
        </Card>

        <Card className="flex flex-col">
            <h3 className="text-lg font-medium text-on-surface mb-4">Result</h3>
            <div className="flex-grow overflow-y-auto bg-background rounded-md border border-border-color min-h-[400px]">
            {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
            {error && <div className="p-4"><p className="text-red-500">{error}</p></div>}
            {response && <CodeBlock code={response} language="json" />}
            {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">Your generated JSON will appear here.</p>}
            </div>
        </Card>
        </div>
    </div>
  );
};

export default JsonGenerator;
