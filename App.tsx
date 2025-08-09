
import React, { useState } from 'react';
import UnifiedControlPanel from './components/UnifiedControlPanel';
import Hub from './pages/Home';

// Import all tool components
import ChatSandbox from './pages/AgentAssembly';
import GroundedSearch from './pages/ModelExplorer';
import AbModelTester from './pages/LLMSandbox';
import AbPromptTester from './pages/ExperimentationLab';
import ModelFoundry from './pages/ModelFoundry';
import MultimodalPipeline from './pages/MakersSpace';
import PromptRefiner from './pages/TestKitchen';
import TextToolkit from './pages/InteractiveWorkbench';
import QualityAuditor from './pages/AITestbed';
import ServerGenerator from './pages/DeploymentSandbox';
import DataScriptGenerator from './pages/DataScienceScratchpad';
import EmbeddingsStudio from './pages/VectorStorePlayground';
import UiSpecGenerator from './pages/DesignStudio';
import ArchitectureDesigner from './pages/MicroservicesSandbox';
import ApiConnector from './pages/APIIntegrationHub';
import FunctionCallingLab from './pages/FunctionCallingLab';
import SpecificationViewer from './pages/SpecificationViewer';
import GameDevForge from './pages/GameDevForge';
import DigitalWorkshop from './pages/DigitalWorkshop';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState('hub');

  const renderTool = () => {
    switch(activeTool) {
      case 'hub': return <Hub setActiveTool={setActiveTool} />;
      // The "Model Foundry" is the new primary builder tool
      case 'model-foundry': return <ModelFoundry />;
      case 'gamedev-forge': return <GameDevForge />;
      case 'digital-workshop': return <DigitalWorkshop />;
      case 'chat-sandbox': return <ChatSandbox />;
      case 'function-calling-lab': return <FunctionCallingLab />;
      case 'grounded-search': return <GroundedSearch />;
      case 'server-generator': return <ServerGenerator />;
      case 'datascript-generator': return <DataScriptGenerator />;
      case 'embeddings-studio': return <EmbeddingsStudio />;
      case 'architecture-designer': return <ArchitectureDesigner />;
      case 'api-connector': return <ApiConnector />;
      case 'ui-spec-generator': return <UiSpecGenerator />;
      case 'prompt-refiner': return <PromptRefiner />;
      case 'quality-auditor': return <QualityAuditor />;
      case 'ab-prompt-tester': return <AbPromptTester />;
      case 'ab-model-tester': return <AbModelTester />;
      case 'multimodal-pipeline': return <MultimodalPipeline />;
      case 'text-toolkit': return <TextToolkit />;
      case 'specification-viewer': return <SpecificationViewer />;
      default: return <Hub setActiveTool={setActiveTool} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-on-surface">
      <UnifiedControlPanel setActiveTool={setActiveTool} activeTool={activeTool} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderTool()}
        </div>
      </main>
    </div>
  );
};

export default App;