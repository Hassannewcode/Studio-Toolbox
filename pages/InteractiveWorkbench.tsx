import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { CursorArrowRaysIcon } from '../components/icons/CursorArrowRaysIcon';
import { PageHeader } from '../components/PageHeader';

type Action = 'Summarize' | 'Keywords' | 'Translate to French' | 'Change Tone to Professional';

const TextToolkit: React.FC = () => {
  const [inputText, setInputText] = usePersistentState<string>('textToolkit_inputText', 'Generative artificial intelligence (AI) describes algorithms (such as ChatGPT) that can be used to create new content, including audio, code, images, text, simulations, and videos. Recent breakthroughs in the field have the potential to drastically change the way we approach content creation.');
  const [result, setResult] = usePersistentState<string>('textToolkit_result', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<Action | null>(null);

  const handleAction = async (action: Action) => {
    if (!inputText) {
      setError('Input text cannot be empty.');
      return;
    }
    setIsLoading(true);
    setActiveAction(action);
    setError(null);
    setResult('');
    
    let prompt = '';
    switch(action) {
      case 'Summarize':
        prompt = `Summarize the following text in one sentence:\n\n"""${inputText}"""`;
        break;
      case 'Keywords':
        prompt = `Extract the top 5 most important keywords from the following text, separated by commas:\n\n"""${inputText}"""`;
        break;
      case 'Translate to French':
        prompt = `Translate the following text to French:\n\n"""${inputText}"""`;
        break;
      case 'Change Tone to Professional':
        prompt = `Rewrite the following text in a more formal, professional tone:\n\n"""${inputText}"""`;
        break;
    }

    try {
      const response = await generateText(prompt, 'You are a helpful text processing assistant.', 0.5, 1, 1);
      setResult(response.text);
    } catch (err) {
      setError('Action failed. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const actions: Action[] = ['Summarize', 'Keywords', 'Translate to French', 'Change Tone to Professional'];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in">
      <PageHeader
        icon={<CursorArrowRaysIcon className="w-6 h-6" />}
        title="Text Toolkit"
        description="Perform powerful, one-click transformations on your text."
      />

      <Card className="p-6">
        <Textarea
          id="inputText"
          label="Input Text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={8}
        />
      </Card>
      
      <Card className="p-4">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map(action => (
            <Button 
                key={action} 
                onClick={() => handleAction(action)} 
                isLoading={isLoading && activeAction === action} 
                disabled={isLoading || !inputText}
                variant="secondary">
              {action}
            </Button>
          ))}
        </div>
      </Card>
      
      {(isLoading || result || error) && (
        <Card className="p-6 flex flex-col">
          <h3 className="text-lg font-medium text-on-surface mb-4">
            Result {activeAction && `from: ${activeAction}`}
          </h3>
          <div className="flex-grow overflow-y-auto bg-background border border-border-color rounded-md p-4 min-h-[150px]">
            {isLoading && <Spinner />}
            {error && <p className="text-red-500">{error}</p>}
            {!isLoading && result && <p className="whitespace-pre-wrap text-on-surface-variant">{result}</p>}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TextToolkit;
