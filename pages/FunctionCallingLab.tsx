import React, { useState } from 'react';
import { generateFunctionCall } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { CogIcon } from '../components/icons/CogIcon';
import { PageHeader } from '../components/PageHeader';
import { Tool, FunctionCall } from '../types';

const defaultTools: Tool[] = [{
    functionDeclarations: [
        {
            name: "find_movies",
            description: "find movies matching a search query",
            parameters: {
                type: "OBJECT",
                properties: {
                    query: {
                        type: "STRING",
                        description: "the search query to find movies"
                    }
                },
                required: ["query"]
            }
        },
        {
            name: "find_theaters",
            description: "find theaters near a location that are showing a specific movie",
            parameters: {
                type: "OBJECT",
                properties: {
                    location: {
                        type: "STRING",
                        description: "the location to search for theaters"
                    },
                    movie: {
                        type: "STRING",
                        description: "the movie to search for"
                    }
                },
                required: ["location", "movie"]
            }
        }
    ]
}];

interface FunctionCallResponse {
    text?: string;
    functionCalls?: FunctionCall[];
}

const FunctionCallingLab: React.FC = () => {
    const [prompt, setPrompt] = usePersistentState<string>('functionLab_prompt', 'Which theaters in Mountain View, CA are showing the new Barbie movie?');
    const [tools, setTools] = usePersistentState<string>('functionLab_tools', JSON.stringify(defaultTools, null, 2));
    const [response, setResponse] = usePersistentState<FunctionCallResponse | null>('functionLab_response', null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!prompt || !tools) {
            setError('Prompt and tools definition cannot be empty.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResponse(null);
        try {
            const parsedTools = JSON.parse(tools);
            const result = await generateFunctionCall(prompt, parsedTools);
            setResponse({
                text: result.text,
                functionCalls: result.functionCalls
            });
        } catch (err) {
            if (err instanceof SyntaxError) {
                setError('Invalid JSON in tools definition.');
            } else {
                setError('Failed to generate function call. Check console for details.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                icon={<CogIcon className="w-6 h-6" />}
                title="Function Calling Lab"
                description="Test how the model uses tools and functions to answer a prompt."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="flex flex-col">
                    <div className="flex-grow space-y-6 flex flex-col">
                        <Textarea
                            id="prompt"
                            label="User Prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                        />
                        <Textarea
                            id="tools"
                            label="Tools Definition (JSON)"
                            value={tools}
                            onChange={(e) => setTools(e.target.value)}
                            className="font-mono text-xs !bg-background flex-grow"
                        />
                    </div>
                    <div className="mt-4 pt-4 border-t border-border-color">
                        <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt || !tools} className="w-full">
                            Generate
                        </Button>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-medium text-on-surface mb-4">Result</h3>
                    <div className="overflow-y-auto">
                        {isLoading && <Spinner />}
                        {error && <p className="text-red-500">{error}</p>}
                        {response && (
                            <div className="space-y-4">
                                {response.text && (
                                    <div>
                                        <h4 className="font-semibold text-on-surface mb-2">Text Response</h4>
                                        <p className="text-on-surface-variant bg-background p-3 rounded-md border border-border-color">{response.text}</p>
                                    </div>
                                )}
                                {response.functionCalls && (
                                    <div>
                                        <h4 className="font-semibold text-on-surface mb-2">Function Call</h4>
                                        <CodeBlock code={JSON.stringify(response.functionCalls, null, 2)} language="json" />
                                    </div>
                                )}
                            </div>
                        )}
                         {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">The model's response or requested function call will appear here.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default FunctionCallingLab;
