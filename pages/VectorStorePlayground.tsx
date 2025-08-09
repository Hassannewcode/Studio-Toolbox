import React, { useState } from 'react';
import { embedContent, generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { CircleStackIcon } from '../components/icons/CircleStackIcon';
import { PageHeader } from '../components/PageHeader';

const EmbeddingsStudio: React.FC = () => {
  const [text, setText] = usePersistentState<string>('embeddingsStudio_text', 'The Eiffel Tower is a famous landmark in Paris, France.');
  const [vector, setVector] = usePersistentState<number[] | null>('embeddingsStudio_vector', null);
  const [similarConcepts, setSimilarConcepts] = usePersistentState<string>('embeddingsStudio_similarConcepts', '');
  const [isLoadingEmbeddings, setIsLoadingEmbeddings] = useState<boolean>(false);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text) return;
    setIsLoadingEmbeddings(true);
    setError(null);
    setVector(null);
    setSimilarConcepts(''); 
    try {
        const result = await embedContent(text);
        setVector(result);
    } catch (err) {
        setError('Failed to generate embeddings. See console for details.');
        console.error(err);
    } finally {
        setIsLoadingEmbeddings(false);
    }
  };
  
  const handleFindSimilar = async () => {
    if(!text) return;
    setIsLoadingSimilar(true);
    setError(null);
    setSimilarConcepts('');

    const context = `
      You are a semantic search engine. Given a query, find related concepts from your knowledge base.
      Do not mention that this is a simulation. Simply return a list of related topics.
    `;
    const prompt = `Find concepts and entities semantically similar to: "${text}"`;

    try {
      const result = await generateText(prompt, context, 0.5, 1, 1);
      setSimilarConcepts(result.text);
    } catch(err) {
      setError('Failed to find similar concepts. Check console.');
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader 
            icon={<CircleStackIcon className="w-6 h-6" />}
            title="Embeddings Studio"
            description="Generate real text embeddings and perform simulated semantic search."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col">
            <div className="flex-grow">
                <Textarea
                id="text"
                label="Input Text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                />
            </div>
            <Button onClick={handleGenerate} disabled={!text || isLoadingEmbeddings} isLoading={isLoadingEmbeddings} className="mt-4 w-full">
                Generate Embedding
            </Button>

            {vector && (
            <div className="mt-6">
                <h3 className="text-md font-medium mb-2">Generated Vector Embedding</h3>
                <div className="bg-background p-3 rounded-md text-on-surface-variant break-all font-mono text-xs border border-border-color max-h-32 overflow-y-auto">
                [{vector.join(', ')}]
                </div>
                <p className="text-xs text-on-surface-variant/70 mt-2">
                Using model: text-embedding-004. Dimensions: {vector.length}.
                </p>
            </div>
            )}
        </Card>

        <Card className="p-6 flex flex-col">
            <h3 className="text-lg font-medium text-on-surface mb-4">Similarity Search</h3>
            <Button onClick={handleFindSimilar} isLoading={isLoadingSimilar} disabled={!vector}>
                Find Semantically Similar Concepts
            </Button>
            <div className="mt-4 flex-grow overflow-y-auto bg-background rounded-md p-4 min-h-[250px] border border-border-color">
            {isLoadingSimilar && <Spinner />}
            {error && <p className="text-red-500">{error}</p>}
            {similarConcepts && <p className="whitespace-pre-wrap text-on-surface-variant">{similarConcepts}</p>}
            {!isLoadingSimilar && !similarConcepts && !error && <p className="text-on-surface-variant/70">Results of semantic search will appear here. Generate an embedding first.</p>}
            </div>
        </Card>
        </div>
    </div>
  );
};

export default EmbeddingsStudio;
