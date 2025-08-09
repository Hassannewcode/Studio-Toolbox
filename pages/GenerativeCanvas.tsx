
import React, { useState } from 'react';
import { generateImages } from '../services/geminiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { ImageIcon } from '../components/icons/ImageIcon';
import { PageHeader } from '../components/PageHeader';
import usePersistentState from '../hooks/usePersistentState';

type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

const ImageStudio: React.FC = () => {
  const [prompt, setPrompt] = usePersistentState<string>('imageStudio_prompt', 'A photorealistic image of a majestic lion wearing a crown, cinematic lighting.');
  const [numberOfImages, setNumberOfImages] = usePersistentState<number>('imageStudio_numberOfImages', 1);
  const [aspectRatio, setAspectRatio] = usePersistentState<AspectRatio>('imageStudio_aspectRatio', '1:1');
  const [images, setImages] = usePersistentState<string[]>('imageStudio_images', []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt) {
      setError('Prompt cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImages([]);
    try {
      const result = await generateImages(prompt, numberOfImages, aspectRatio);
      const base64Images = result.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
      setImages(base64Images);
    } catch (err) {
      setError('Failed to generate images. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
        <PageHeader
            icon={<ImageIcon className="w-6 h-6" />}
            title="Image Studio"
            description="Your personal canvas for generating stunning visuals with AI."
        />

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <Input
              id="prompt"
              label="Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A futuristic cityscape at sunset"
            />
          </div>
          <div>
            <Select
              id="aspectRatio"
              label="Aspect Ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="9:16">9:16 (Portrait)</option>
              <option value="4:3">4:3 (Landscape)</option>
              <option value="3:4">3:4 (Tall)</option>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} isLoading={isLoading} disabled={!prompt}>
            Generate Images
          </Button>
        </div>
      </Card>
      
      <Card className="p-6 min-h-[400px]">
        <h3 className="text-lg font-medium text-on-surface mb-4">Result</h3>
        <div className="bg-background rounded-md p-4 flex justify-center items-center border border-border-color min-h-[350px]">
          {isLoading && <Spinner />}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && images.length === 0 && <p className="text-on-surface-variant/70">Your generated images will appear here.</p>}
          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((imgSrc, index) => (
                <img key={index} src={imgSrc} alt={`Generated image ${index + 1}`} className="rounded-lg shadow-md w-full h-auto object-contain" />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ImageStudio;
