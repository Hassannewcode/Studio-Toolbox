import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { VariableIcon } from '../components/icons/VariableIcon';
import { PageHeader } from '../components/PageHeader';

const DataScriptGenerator: React.FC = () => {
    const [prompt, setPrompt] = usePersistentState<string>('dataScript_prompt', 'Load a CSV named "sales_data.csv". It has columns "Date", "Product", and "Revenue". Calculate the total revenue per product and plot it as a bar chart.');
    const [response, setResponse] = usePersistentState<string>('dataScript_response', '');
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
        
        const systemInstruction = `You are an expert data scientist. Generate only the raw Python code for the following request. Use the pandas and matplotlib libraries. Assume the necessary data files are in the same directory. Do not include any explanatory text, comments, or markdown formatting.`;

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
                icon={<VariableIcon className="w-6 h-6" />}
                title="Data Script Generator"
                description="Describe a data analysis task and get a Python script to perform it."
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 p-6 flex flex-col self-start">
                    <div className="space-y-6 flex flex-col flex-grow">
                        <Textarea
                            id="prompt"
                            label="Analysis Task Description"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={10}
                            placeholder="e.g., Load a file, group by a column, and plot the results."
                            className="flex-grow"
                        />
                        <div className="mt-auto">
                            <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt} className="w-full">
                                Generate Python Script
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-2 p-6 flex-grow flex flex-col">
                    <h3 className="text-lg font-medium text-on-surface mb-4">Generated Python Code</h3>
                    <div className="flex-grow overflow-y-auto min-h-[400px] bg-background border border-border-color rounded-md">
                        {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                        {error && <div className="p-4"><p className="text-red-500">{error}</p></div>}
                        {response && <CodeBlock code={response} language="python" />}
                        {!isLoading && !response && !error && <p className="text-on-surface-variant/70 p-4">Your generated script will appear here.</p>}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DataScriptGenerator;
