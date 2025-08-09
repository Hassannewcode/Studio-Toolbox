import React, { useState } from 'react';
import { generateText, generateImages } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { CubeTransparentIcon } from '../components/icons/CubeTransparentIcon';
import { PageHeader } from '../components/PageHeader';

const MultimodalPipeline: React.FC = () => {
  const [textPrompt, setTextPrompt] = usePersistentState<string>('multimodal_textPrompt', 'A brief, visually rich description of a futuristic cyber-punk market at night.');
  const [generatedText, setGeneratedText] = usePersistentState<string>('multimodal_generatedText', '');
  const [generatedImage, setGeneratedImage] = usePersistentState<string>('multimodal_generatedImage', '');
  const [isLoadingText, setIsLoadingText] = useState<boolean>(false);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateText = async () => {
    if (!textPrompt) {
      setError('Text prompt cannot be empty.');
      return;
    }
    setIsLoadingText(true);
    setError(null);
    setGeneratedText('');
    setGeneratedImage('');
    try {
      const result = await generateText(textPrompt, 'You are a descriptive writer, focusing on visual details.', 0.8, 1, 1);
      setGeneratedText(result.text);
    } catch (err) {
      setError('Failed to generate text. Check console for details.');
    } finally {
      setIsLoadingText(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedText) {
      setError('You must generate text first.');
      return;
    }
    setIsLoadingImage(true);
    setError(null);
    setGeneratedImage('');
    const imagePrompt = `A photorealistic image of: ${generatedText}`;
    try {
      const result = await generateImages(imagePrompt, 1, '16:9');
      if (result && result.length > 0) {
        const base64Image = `data:image/jpeg;base64,${result[0].image.imageBytes}`;
        setGeneratedImage(base64Image);
      }
    } catch (err) {
      setError('Failed to generate image. Check console for details.');
    } finally {
      setIsLoadingImage(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <PageHeader
            icon={<CubeTransparentIcon className="w-6 h-6" />}
            title="Multimodal Pipeline"
            description="A two-step pipeline: generate a rich text description, then use it to generate an image."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col">
                <h3 className="text-lg font-medium mb-4">Step 1: Generate a Description</h3>
                <Textarea
                id="textPrompt"
                label="Describe a scene"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                rows={4}
                />
                <Button onClick={handleGenerateText} isLoading={isLoadingText} disabled={!textPrompt} className="mt-4 w-full">
                Generate Text
                </Button>
                <div className="mt-4 flex-grow bg-background border border-border-color rounded-md p-4 min-h-[150px]">
                {isLoadingText && <Spinner />}
                {!isLoadingText && generatedText && <p className="whitespace-pre-wrap text-on-surface-variant">{generatedText}</p>}
                {!isLoadingText && !generatedText && <p className="text-on-surface-variant/70">Generated text will appear here.</p>}
                </div>
            </Card>

            <Card className="p-6 flex flex-col">
                <h3 className="text-lg font-medium mb-4">Step 2: Visualize the Scene</h3>
                <Button onClick={handleGenerateImage} isLoading={isLoadingImage} disabled={!generatedText || isLoadingText} className="w-full">
                Generate Image from Text
                </Button>
                <div className="mt-4 flex-grow bg-background border border-border-color rounded-md p-4 flex justify-center items-center min-h-[250px]">
                {isLoadingImage && <Spinner />}
                {!isLoadingImage && generatedImage && <img src={generatedImage} alt="Generated scene" className="rounded-lg shadow-md max-h-full max-w-full" />}
                {!isLoadingImage && !generatedImage && <p className="text-on-surface-variant/70 text-center">Generated image will appear here.</p>}
                </div>
            </Card>
        </div>
        {error && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-md text-red-300">
                {error}
            </div>
        )}
    </div>
  );
};

export default MultimodalPipeline;
