
import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { UsersIcon } from '../components/icons/UsersIcon';
import usePersistentState from '../hooks/usePersistentState';

const AiWritingPair: React.FC = () => {
  const [document, setDocument] = usePersistentState<string>('aiWritingPair_document', 'The internet is a big network of computers.');
  const [history, setHistory] = usePersistentState<string[]>('aiWritingPair_history', []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (role: 'writer' | 'editor') => {
    setIsLoading(true);
    setError(null);
    
    let prompt = '';
    let systemInstruction = '';

    if (role === 'writer') {
      systemInstruction = 'You are a creative writer. Your task is to expand and improve the given text, making it more engaging and descriptive.';
      prompt = `Please expand and improve upon the following text:\n\n"""${document}"""`;
    } else { // editor
      systemInstruction = 'You are a meticulous editor. Your task is to review the given text for clarity, conciseness, and correctness. Provide a rewritten version and a short note about your changes.';
      prompt = `Please review and edit the following text for clarity, conciseness, and correctness. Return just the edited text and a one-sentence comment about your changes, formatted like this: "EDITED TEXT: [...]\n\nCOMMENT: [...]":\n\n"""${document}"""`;
    }

    try {
      const result = await generateText(prompt, systemInstruction, 0.6, 1, 1);
      const newText = result.text;
      
      let updateText = newText;
      let comment = role === 'writer' ? 'Writer expanded the document.' : 'Editor reviewed the document.';

      if (role === 'editor' && newText.includes('EDITED TEXT:')) {
          const parts = newText.split('COMMENT:');
          updateText = parts[0].replace('EDITED TEXT:', '').trim();
          if (parts[1]) {
            comment = `Editor: ${parts[1].trim()}`;
          }
      }

      setDocument(updateText);
      setHistory(prev => [...prev, `${comment}\n\n---\n${updateText}`]);

    } catch (err) {
      setError('Action failed. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Document & Controls */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <UsersIcon className="w-6 h-6 text-primary" /> AI Writing Pair
          </h2>
          <Textarea
            id="document"
            label="Current Document"
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            rows={15}
            className="!bg-background"
          />
          <div className="mt-4 flex gap-4">
            <Button onClick={() => handleAction('writer')} isLoading={isLoading} className="flex-1">
              Invoke Writer
            </Button>
            <Button onClick={() => handleAction('editor')} isLoading={isLoading} variant="secondary" className="flex-1">
              Invoke Editor
            </Button>
          </div>
          {isLoading && <Spinner />}
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </Card>
      </div>

      {/* History Panel */}
      <Card className="lg:col-span-1 p-6 flex flex-col">
        <h3 className="text-lg font-semibold mb-4 text-on-surface">Version History</h3>
        <div className="flex-grow overflow-y-auto bg-background rounded-md p-2 space-y-4">
          {history.length === 0 && <p className="text-on-surface-variant/70 p-2">Document history will appear here.</p>}
          {[...history].reverse().map((entry, index) => (
            <div key={index} className="p-3 bg-surface rounded-md border border-border-color">
              <p className="whitespace-pre-wrap text-sm text-on-surface-variant">{entry}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AiWritingPair;
