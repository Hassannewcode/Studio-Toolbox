
import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { PencilIcon } from '../components/icons/PencilIcon';
import usePersistentState from '../hooks/usePersistentState';

type CreativeFormat = 'a short story' | 'a poem' | 'a movie scene script';

const WritersRoom: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('writersRoom_prompt', 'a lone astronaut discovering an ancient alien artifact on Mars');
  const [format, setFormat] = usePersistentState<CreativeFormat>('writersRoom_format', 'a short story');
  const [response, setResponse] = usePersistentState<string>('writersRoom_response', '');
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

    const systemInstruction = `You are a world-class creative writer. Your specialty is writing ${format}.`;
    const fullPrompt = `Write ${format} about: ${prompt}`;

    try {
      const result = await generateText(fullPrompt, systemInstruction, 0.8, 1, 1);
      setResponse(result.text);
    } catch (err) {
      setError('Failed to generate creative text. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Config Panel */}
      <Card className="lg:col-span-1 p-6 flex flex-col space-y-6 self-start">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PencilIcon className="w-6 h-6 text-primary" /> Writer's Room
        </h2>
        <Select
          id="format"
          label="Creative Format"
          value={format}
          onChange={(e) => setFormat(e.target.value as CreativeFormat)}
        >
          <option value="a short story">Short Story</option>
          <option value="a poem">Poem</option>
          <option value="a movie scene script">Movie Scene</option>
        </Select>
        <Textarea
          id="prompt"
          label="What should it be about?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          placeholder="e.g., a detective solving a case in a cyberpunk city"
        />
        <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt}>
          Create
        </Button>
      </Card>

      {/* Result Panel */}
      <div className="lg:col-span-2 flex flex-col">
        <Card className="p-6 flex-grow flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <div className="flex-grow overflow-y-auto bg-background rounded-md p-4 min-h-[400px]">
            {isLoading && <Spinner />}
            {error && <p className="text-red-500">{error}</p>}
            {response && <p className="whitespace-pre-wrap text-on-surface-variant">{response}</p>}
            {!isLoading && !response && !error && <p className="text-on-surface-variant/50">Your creative work will appear here.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WritersRoom;
