
import React from 'react';
import { BeakerIcon } from './icons/BeakerIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { CubeTransparentIcon } from './icons/CubeTransparentIcon';
import { ChatBubbleBottomCenterTextIcon } from './icons/ChatBubbleBottomCenterTextIcon';
import { CircleStackIcon } from './icons/CircleStackIcon';
import { ArrowsRightLeftIcon } from './icons/ArrowsRightLeftIcon';
import { PuzzlePieceIcon } from './icons/PuzzlePieceIcon';
import { VariableIcon } from './icons/VariableIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { WrenchScrewdriverIcon } from './icons/WrenchScrewdriverIcon';
import { CursorArrowRaysIcon } from './icons/CursorArrowRaysIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { FireIcon } from './icons/FireIcon';
import { RectangleGroupIcon } from './icons/RectangleGroupIcon';
import { MessageIcon } from './icons/MessageIcon';
import { LayoutDashboardIcon } from './icons/LayoutDashboardIcon';
import { CogIcon } from './icons/CogIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { TrophyIcon } from './icons/TrophyIcon';

interface ToolButtonProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  setActiveTool: (id: string) => void;
  isActive: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ id, icon, label, setActiveTool, isActive }) => {
  const baseClasses = "flex items-center space-x-4 w-full pl-8 pr-4 py-2 rounded-r-full transition-colors duration-200 text-left relative text-sm";
  const inactiveClasses = "text-on-surface-variant hover:bg-white/5";
  const activeClasses = "bg-primary-light text-primary font-medium";

  return (
    <button
      onClick={() => setActiveTool(id)}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const PanelHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-8 pt-6 pb-1 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
    {children}
  </div>
);

const toolCategories = [
    {
        name: 'Creation Engines',
        tools: [
            { id: 'model-foundry', label: 'Model Foundry', icon: <CubeTransparentIcon className="w-5 h-5" /> },
            { id: 'gamedev-forge', label: 'GameDev Forge', icon: <TrophyIcon className="w-5 h-5" /> },
            { id: 'digital-workshop', label: 'Digital Workshop', icon: <WrenchScrewdriverIcon className="w-5 h-5" /> },
        ]
    },
    {
        name: 'Sandboxes',
        tools: [
            { id: 'chat-sandbox', label: 'Chat Sandbox', icon: <MessageIcon className="w-5 h-5" /> },
            { id: 'function-calling-lab', label: 'Function Calling Lab', icon: <CogIcon className="w-5 h-5" /> },
            { id: 'grounded-search', label: 'Grounded Search', icon: <EyeIcon className="w-5 h-5" /> },
        ]
    },
    {
        name: 'Advanced Tools',
        tools: [
            { id: 'server-generator', label: 'Server Generator', icon: <RocketLaunchIcon className="w-5 h-5" /> },
            { id: 'datascript-generator', label: 'Data Script Generator', icon: <VariableIcon className="w-5 h-5" /> },
        ]
    },
    {
        name: 'Testing & Analysis',
        tools: [
            { id: 'embeddings-studio', label: 'Embeddings Studio', icon: <CircleStackIcon className="w-5 h-5" /> },
            { id: 'prompt-refiner', label: 'Prompt Refiner', icon: <FireIcon className="w-5 h-5" /> },
            { id: 'quality-auditor', label: 'Quality Auditor', icon: <ShieldCheckIcon className="w-5 h-5" /> },
            { id: 'ab-prompt-tester', label: 'A/B Prompt Tester', icon: <BeakerIcon className="w-5 h-5" /> },
            { id: 'ab-model-tester', label: 'A/B Model Tester', icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" /> },
            { id: 'text-toolkit', label: 'Text Toolkit', icon: <CursorArrowRaysIcon className="w-5 h-5" /> },
        ]
    },
     {
        name: 'Planning & Design',
        tools: [
            { id: 'architecture-designer', label: 'Architecture Designer', icon: <PuzzlePieceIcon className="w-5 h-5" /> },
            { id: 'api-connector', label: 'API Connector', icon: <ArrowsRightLeftIcon className="w-5 h-5" /> },
            { id: 'ui-spec-generator', label: 'UI Spec Generator', icon: <RectangleGroupIcon className="w-5 h-5" /> },
            { id: 'multimodal-pipeline', label: 'Multimodal Pipeline', icon: <CubeTransparentIcon className="w-5 h-5" /> },
        ]
    },
    {
        name: 'Reference',
        tools: [
            { id: 'specification-viewer', label: 'Master Specification', icon: <DocumentTextIcon className="w-5 h-5" /> },
        ]
    },
];

const UnifiedControlPanel: React.FC<{setActiveTool: (tool: string) => void; activeTool: string;}> = ({ setActiveTool, activeTool }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-surface p-0 flex flex-col border-r border-border-color">
      <div className="flex items-center gap-3 p-4 flex-shrink-0 h-16 border-b border-border-color">
         <button onClick={() => setActiveTool('hub')} className="p-2 bg-primary-light rounded-full">
            <LayoutDashboardIcon className="w-5 h-5 text-primary"/>
         </button>
         <button onClick={() => setActiveTool('hub')} className="font-medium text-base text-on-surface hover:text-primary transition-colors">Omni-Sandbox</button>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        <nav className="flex flex-col py-4">
          {toolCategories.map(category => (
            <div key={category.name}>
              <PanelHeader>{category.name}</PanelHeader>
              <div className="flex flex-col space-y-1">
                {category.tools.map(tool => (
                  <ToolButton 
                    key={tool.id}
                    id={tool.id}
                    label={tool.label}
                    icon={tool.icon}
                    setActiveTool={setActiveTool}
                    isActive={activeTool === tool.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default UnifiedControlPanel;