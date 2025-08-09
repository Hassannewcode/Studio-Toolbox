
import React from 'react';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MessageIcon } from '../components/icons/MessageIcon';
import { PuzzlePieceIcon } from '../components/icons/PuzzlePieceIcon';
import { CircleStackIcon } from '../components/icons/CircleStackIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { CubeTransparentIcon } from '../components/icons/CubeTransparentIcon';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  toolId: string;
  setActiveTool: (toolId: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, toolId, setActiveTool }) => (
    <button
        onClick={() => setActiveTool(toolId)}
        className="text-left w-full h-full p-6 bg-surface hover:bg-primary-light/50 transition-colors duration-200 rounded-lg border border-border-color flex items-start space-x-4"
    >
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary-light text-primary rounded-lg">
            {icon}
        </div>
        <div>
            <h3 className="font-semibold text-on-surface mb-1">{title}</h3>
            <p className="text-sm text-on-surface-variant">{description}</p>
        </div>
    </button>
);


const Hub: React.FC<{ setActiveTool: (toolId: string) => void }> = ({ setActiveTool }) => {
  const specializedTools = [
    {
      title: "Chat Sandbox",
      description: "Build and interact with conversational AI agents in a streaming interface.",
      icon: <MessageIcon className="w-5 h-5" />,
      toolId: "chat-sandbox",
    },
    {
      title: "Grounded Search",
      description: "Get answers to topical questions grounded in Google Search results.",
      icon: <SearchIcon className="w-5 h-5" />,
      toolId: "grounded-search",
    },
    {
      title: "Function Calling Lab",
      description: "Test how Gemini can call functions based on your prompts.",
      icon: <PuzzlePieceIcon className="w-5 h-5" />,
      toolId: "function-calling-lab",
    },
    {
      title: "Embeddings Studio",
      description: "Visualize text embeddings and run simulated semantic searches.",
      icon: <CircleStackIcon className="w-5 h-5" />,
      toolId: "embeddings-studio",
    },
    {
      title: "Architecture Designer",
      description: "Describe an app to generate a microservice architecture.",
      icon: <PuzzlePieceIcon className="w-5 h-5" />,
      toolId: "architecture-designer",
    },
    {
      title: "Quality Auditor",
      description: "Generate content and then use a second AI call to evaluate it.",
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      toolId: "quality-auditor",
    }
  ];

  return (
    <div className="max-w-screen-xl mx-auto space-y-12 animate-fade-in">
        <div className="text-center pt-8">
            <h1 className="text-5xl font-bold text-on-surface mb-3">
            Omni-Sandbox
            </h1>
            <p className="text-xl text-on-surface-variant max-w-3xl mx-auto">
            Your personal creative development environment for Generative AI.
            </p>
        </div>

        <Card className="bg-primary-light border-primary/50 transform hover:scale-[1.01] transition-transform duration-300 shadow-2xl shadow-primary/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8">
                <div className="flex-1 text-center md:text-left">
                    <CubeTransparentIcon className="w-12 h-12 text-primary mb-4 mx-auto md:mx-0" />
                    <h2 className="text-3xl font-bold text-on-surface">Enter The Model Foundry</h2>
                    <p className="text-on-surface-variant mt-2 max-w-xl">
                        A true developer's workplace. Define, configure, and train custom AI models from the ground up in a multi-stage, interactive IDE.
                    </p>
                </div>
                <Button
                    size="lg"
                    variant="primary"
                    onClick={() => setActiveTool('model-foundry')}
                    className="flex-shrink-0 mt-4 md:mt-0"
                >
                    Launch Foundry
                </Button>
            </div>
        </Card>
      
      <div>
        <h2 className="text-2xl font-bold text-on-surface mb-6 text-center">Or Explore Specialized Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specializedTools.map(tool => (
                <ToolCard key={tool.toolId} {...tool} setActiveTool={setActiveTool} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Hub;