
import React, { useState } from 'react';
import { Type } from '@google/genai';
import { generateJson, generateImages, generateText } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CodeBlock } from '../components/ui/CodeBlock';
import { Spinner } from '../components/ui/Spinner';
import { TrophyIcon } from '../components/icons/TrophyIcon';

const gddSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        genre: { type: Type.STRING },
        summary: { type: Type.STRING },
        coreMechanics: { type: Type.ARRAY, items: { type: Type.STRING } },
        characterConcept: { type: Type.STRING, description: "A detailed visual description of the main character for an image generation model." }
    },
    required: ["title", "genre", "summary", "coreMechanics", "characterConcept"]
};

interface GDD {
    title: string;
    genre: string;
    summary: string;
    coreMechanics: string[];
    characterConcept: string;
}

const GameDevForge: React.FC = () => {
    const [gameIdea, setGameIdea] = usePersistentState<string>('gamedev_idea', 'A 2D platformer where a small robot uses a grappling hook to navigate a post-apocalyptic city of giant, overgrown plants.');
    const [gdd, setGdd] = usePersistentState<GDD | null>('gamedev_gdd', null);
    const [characterArt, setCharacterArt] = usePersistentState<string | null>('gamedev_art', null);
    const [gameCode, setGameCode] = usePersistentState<string | null>('gamedev_code', null);

    const [isLoadingGDD, setIsLoadingGDD] = useState(false);
    const [isLoadingArt, setIsLoadingArt] = useState(false);
    const [isLoadingCode, setIsLoadingCode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateGDD = async () => {
        setIsLoadingGDD(true);
        setError(null);
        setGdd(null);
        setCharacterArt(null);
        setGameCode(null);
        try {
            const result = await generateJson(`Create a game design document for this idea: ${gameIdea}`, gddSchema);
            const parsedGdd = JSON.parse(result.text);
            setGdd(parsedGdd);
        } catch (e) {
            setError("Failed to generate Game Design Document. Please try again.");
            console.error(e);
        } finally {
            setIsLoadingGDD(false);
        }
    };

    const handleGenerateArt = async () => {
        if (!gdd) return;
        setIsLoadingArt(true);
        setError(null);
        setCharacterArt(null);
        try {
            const artPrompt = `Cinematic, concept art of a video game character: ${gdd.characterConcept}. Game Genre: ${gdd.genre}.`;
            const result = await generateImages(artPrompt, 1, "1:1");
            setCharacterArt(`data:image/jpeg;base64,${result[0].image.imageBytes}`);
        } catch (e) {
            setError("Failed to generate character art. Please try again.");
            console.error(e);
        } finally {
            setIsLoadingArt(false);
        }
    };
    
    const handleGenerateCode = async () => {
        if (!gdd) return;
        setIsLoadingCode(true);
        setError(null);
        setGameCode(null);
        try {
            const codePrompt = `Generate a simple, runnable code prototype for a game based on this Game Design Document. The code should be a single, self-contained HTML file with embedded JavaScript and CSS.
            
            GDD:
            Title: ${gdd.title}
            Genre: ${gdd.genre}
            Summary: ${gdd.summary}
            Core Mechanics: ${gdd.coreMechanics.join(', ')}

            IMPORTANT: Output only the raw HTML code. Do not include any explanatory text or markdown formatting.
            `;
            const result = await generateText(codePrompt, 'You are an expert game developer who creates simple prototypes.', 0.2, 1, 1);
            setGameCode(result.text);
        } catch (e) {
            setError("Failed to generate game code. Please try again.");
            console.error(e);
        } finally {
            setIsLoadingCode(false);
        }
    };


    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
            <PageHeader
                icon={<TrophyIcon className="w-8 h-8" />}
                title="GameDev Forge"
                description="Bring your game ideas to life. Generate a design document, character art, and even a code prototype from a single concept."
            />
            <Card>
                <Textarea
                    id="game-idea"
                    label="Describe your game concept"
                    value={gameIdea}
                    onChange={(e) => setGameIdea(e.target.value)}
                    rows={4}
                    placeholder="e.g., A puzzle game where you control time to solve paradoxes."
                />
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenerateGDD} isLoading={isLoadingGDD} disabled={!gameIdea || isLoadingGDD}>
                        Forge Game Concept
                    </Button>
                </div>
            </Card>

            {isLoadingGDD && <Spinner />}
            {error && <Card><p className="p-4 text-red-400">{error}</p></Card>}

            {gdd && (
                <Card className="p-6 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold">{gdd.title}</h2>
                        <p className="text-primary font-medium">{gdd.genre}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                            <h3 className="font-semibold mb-2">Summary</h3>
                            <p className="text-on-surface-variant">{gdd.summary}</p>

                            <h3 className="font-semibold mt-4 mb-2">Core Mechanics</h3>
                            <ul className="list-disc list-inside text-on-surface-variant space-y-1">
                                {gdd.coreMechanics.map(m => <li key={m}>{m}</li>)}
                            </ul>
                       </div>
                       
                        <div className="space-y-4">
                            <Card className="p-4">
                                <h3 className="font-semibold mb-2">Character Concept Art</h3>
                                {isLoadingArt ? <Spinner /> : characterArt ? (
                                    <img src={characterArt} alt="Generated Character Art" className="rounded-md w-full" />
                                ) : (
                                    <p className="text-sm text-on-surface-variant">Generate character art to see a visualization of your hero.</p>
                                )}
                                <Button onClick={handleGenerateArt} isLoading={isLoadingArt} disabled={isLoadingArt} className="w-full mt-4">Generate Character Art</Button>
                            </Card>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mt-4 mb-2">Runnable Code Prototype</h3>
                        {isLoadingCode ? <Spinner /> : gameCode ? (
                           <CodeBlock code={gameCode} language="html" />
                        ) : (
                            <p className="text-sm text-on-surface-variant">Generate a code prototype to get a feel for the game.</p>
                        )}
                        <Button onClick={handleGenerateCode} isLoading={isLoadingCode} disabled={isLoadingCode} className="w-full mt-4">Generate Game Code</Button>
                    </div>

                </Card>
            )}
        </div>
    );
};

export default GameDevForge;
