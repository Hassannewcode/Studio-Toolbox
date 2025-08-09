
import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { CodeIcon } from '../components/icons/CodeIcon';
import { PageHeader } from '../components/PageHeader';
import usePersistentState from '../hooks/usePersistentState';

const languages = [
    "javascript", "python", "go", "java", "c++", "typescript", "html", "css", "sql"
];

const CodeGenerator: React.FC = () => {
    const [prompt, setPrompt] = usePersistentState<string>('codeGenerator_prompt', 'Create a function that returns the nth fibonacci number.');
    const [language, setLanguage] = usePersistentState<string>('codeGenerator_language', 'python');
    const [response, setResponse] = usePersistentState<string>('codeGenerator_response', '');
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
        
        const systemInstruction = `You are an expert programmer. Generate only the raw code for the following request in the ${language} programming language. Do not include any explanatory text, comments, markdown formatting like \`\`\`, or code fences.`;

        try {
            const result = await generateText(prompt, systemInstruction, 0.2, 1, 1);
            setResponse(result.text);
        } catch (err) {
            setError('Failed to generate code. Check console for details.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <PageHeader
                icon={<CodeIcon className="w-6 h-6" />}
                title="Code Generator"
                description="Generate code snippets in various languages from natural language descriptions."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 p-6 flex flex-col self-start">
                    <div className="space-y-6 flex flex-col flex-grow">
                        <Select
                            id="language"
                            label="Programming Language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            {languages.map(lang => (
                                <option key={lang} value={lang} className="capitalize">{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                            ))}
                        </Select>

                        <Textarea
                            id="prompt"
                            label="Code Description"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={8}
                            placeholder="e.g., A Python class for a doubly linked list."
                            className="flex-grow"
                        />
                        <div className="mt-auto">
                            <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt} className="w-full">
                                Generate Code
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="p-6 flex-grow flex flex-col">
                        <h3 className="text-lg font-medium text-on-surface mb-4">Generated Code</h3>
                        <div className="flex-grow overflow-y-auto min-h-[400px] bg-background border border-border-color rounded-md">
                            {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                            {error && <div className="p-4"><p className="text-red-500">{error}</p></div>}
                            {response && <CodeBlock code={response} language={language} />}
                            {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">Your generated code will appear here.</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CodeGenerator;
