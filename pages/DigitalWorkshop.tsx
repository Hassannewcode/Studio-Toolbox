
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Type, Chat } from '@google/genai';
import { generateJson, generateText, createChat, sendMessageStream } from '../services/geminiService';
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import { WrenchScrewdriverIcon } from '../components/icons/WrenchScrewdriverIcon';
import { PageHeader } from '../components/PageHeader';
import { CodeBlock } from '../components/ui/CodeBlock';
import { DocumentTextIcon } from '../components/icons/DocumentTextIcon';
import { CodeIcon } from '../components/icons/CodeIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { TerminalIcon } from '../components/icons/TerminalIcon';
import { ChatBubbleBottomCenterTextIcon } from '../components/icons/ChatBubbleBottomCenterTextIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ArrowPathIcon } from '../components/icons/ArrowPathIcon';
import { CogIcon } from '../components/icons/CogIcon';
import { Input } from '../components/ui/Input';
import { type ChatMessage } from '../types';

const blueprintSchema = {
  type: Type.OBJECT,
  properties: {
    projectName: { type: Type.STRING, description: 'A short, file-system-friendly name for the project (e.g., "my-weather-api").' },
    projectType: { type: Type.STRING, description: 'The type of project (e.g., "Python Flask API", "React Web App", "Node.js Script").' },
    description: { type: Type.STRING, description: 'A one-sentence summary of the project.' },
    techStack: {
      type: Type.ARRAY,
      description: "A list of key technologies used.",
      items: { type: Type.STRING }
    },
    files: {
      type: Type.ARRAY,
      description: 'The list of files to be generated for this project.',
      items: {
        type: Type.OBJECT,
        properties: {
          fileName: { type: Type.STRING, description: 'The name of the file (e.g., "app.py", "package.json").' },
          description: { type: Type.STRING, description: 'A detailed description of the file\'s purpose and what code it should contain.' }
        },
        required: ["fileName", "description"]
      }
    }
  },
  required: ["projectName", "projectType", "description", "files"]
};

interface ProjectFile {
    fileName: string;
    description: string;
    content: string;
}

interface Blueprint {
    projectName: string;
    projectType: string;
    description: string;
    techStack: string[];
    files: Array<{fileName: string; description: string;}>;
}

interface ConsoleMessage {
    id: number;
    type: 'log' | 'error' | 'info' | 'warn';
    message: string;
}

type BuildStage = 'ideation' | 'blueprint_review' | 'build';
type ActiveSideTab = 'chat' | 'console' | 'settings';

interface WorkshopState {
    goal: string;
    stage: BuildStage;
    blueprint: Blueprint | null;
    blueprintText: string;
    projectFiles: ProjectFile[];
    selectedFileName: string | null;
    consoleMessages: ConsoleMessage[];
    activeSideTab: ActiveSideTab;
}

const initialWorkshopState: WorkshopState = {
    goal: 'A simple single-page app for managing a to-do list. It should have a clean interface with an input field to add tasks and a list to display them. Use TailwindCSS for styling.',
    stage: 'ideation',
    blueprint: null,
    blueprintText: '',
    projectFiles: [],
    selectedFileName: null,
    consoleMessages: [],
    activeSideTab: 'chat',
};

const ChatMessageDisplay: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return <span className="animate-pulse">...</span>;

    const codeBlockRegex = /```(\w*)\n([\s\S]+?)```/g;
    const matches = Array.from(text.matchAll(codeBlockRegex));
    
    if (matches.length === 0) {
        return <p className="whitespace-pre-wrap text-sm">{text}</p>;
    }

    const elements = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
        const [fullMatch, language, code] = match;
        const matchIndex = match.index || 0;

        // Add text before the code block
        if (matchIndex > lastIndex) {
            elements.push(<p key={`text-${i}`} className="whitespace-pre-wrap">{text.substring(lastIndex, matchIndex)}</p>);
        }

        // Add the code block
        elements.push(<CodeBlock key={`code-${i}`} code={code.trim()} language={language || 'text'} />);

        lastIndex = matchIndex + fullMatch.length;
    });

    // Add any remaining text after the last code block
    if (lastIndex < text.length) {
        elements.push(<p key="text-last" className="whitespace-pre-wrap">{text.substring(lastIndex)}</p>);
    }

    return <div className="text-sm space-y-2">{elements}</div>;
};


const DigitalWorkshop: React.FC = () => {
  const [workshopState, setWorkshopState] = usePersistentState<WorkshopState>('digitalWorkshop_v4', initialWorkshopState);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chat, setChat] = useState<Chat | null>(null);
  const chatMessagesKey = `digitalWorkshop_chatMessages_${workshopState.blueprint?.projectName || 'default'}`;
  const [chatMessages, setChatMessages] = usePersistentState<ChatMessage[]>(chatMessagesKey, []);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const { goal, stage, blueprint, blueprintText, projectFiles, selectedFileName, consoleMessages, activeSideTab } = workshopState;
  
  const selectedFile = projectFiles.find(f => f.fileName === selectedFileName) || null;

  const logToConsole = useCallback((message: string, type: ConsoleMessage['type'] = 'info') => {
    setWorkshopState(prev => ({...prev, consoleMessages: [{ id: Date.now(), type, message }, ...prev.consoleMessages]}));
  }, [setWorkshopState]);
  
  useEffect(() => {
    if (stage === 'build' && !chat) {
        const systemInstruction = `You are an AI pair programmer assisting a developer.
        The project is "${blueprint?.projectName}".
        Description: "${blueprint?.description}".
        The project files are: ${projectFiles.map(f => f.fileName).join(', ')}.
        The user will provide context on which file they are viewing. Be helpful and concise. When asked to provide code, use markdown code blocks.`;
        setChat(createChat(systemInstruction));
    }
  }, [stage, blueprint, projectFiles, chat]);

  const handleGenerateBlueprint = async () => {
    if (!goal) return;
    setIsLoading(true);
    setLoadingMessage('Generating project blueprint...');
    setError(null);
    setWorkshopState(prev => ({ ...initialWorkshopState, goal: prev.goal }));
    setChatMessages([]);
    logToConsole('Starting project generation...');
    try {
      const blueprintPrompt = `Generate a project blueprint for the following request: "${goal}". The project should be self-contained and runnable where possible. Prioritize a single, self-contained 'index.html' file for simple web UIs. For React, an index.tsx is acceptable.`;
      const blueprintResult = await generateJson(blueprintPrompt, blueprintSchema);
      const blueprintData: Blueprint = JSON.parse(blueprintResult.text);
      setWorkshopState(prev => ({
        ...prev,
        stage: 'blueprint_review',
        blueprint: blueprintData,
        blueprintText: JSON.stringify(blueprintData, null, 2)
      }));
      logToConsole('Blueprint generated. Please review.');
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred during blueprint generation.';
      setError(errorMessage);
      logToConsole(errorMessage, 'error');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleApproveBlueprint = () => {
      try {
        const approvedBlueprint: Blueprint = JSON.parse(blueprintText);
        const files: ProjectFile[] = approvedBlueprint.files.map(f => ({ ...f, content: '' }));
        setWorkshopState(prev => ({
            ...prev,
            stage: 'build',
            blueprint: approvedBlueprint,
            projectFiles: files,
            selectedFileName: files[0]?.fileName || null
        }));
        logToConsole(`Blueprint approved. Project "${approvedBlueprint.projectName}" scaffolded.`);
      } catch (e: any) {
          logToConsole(`Invalid blueprint JSON: ${e.message}`, 'error');
          setError(`Blueprint is not valid JSON. Please fix it before proceeding.`);
      }
  };

  const generateFileContent = async (fileName: string) => {
    if (!blueprint) return;
    setIsLoading(true);
    setLoadingMessage(`Generating code for ${fileName}...`);
    logToConsole(`Generating code for ${fileName}...`, 'info');
    try {
        const fileInfo = blueprint.files.find(f => f.fileName === fileName);
        if (!fileInfo) throw new Error(`File ${fileName} not found in blueprint.`);

        const prompt = `Based on the project blueprint, generate complete, production-ready code for the file: ${fileName}. File Description: ${fileInfo.description}. IMPORTANT: Only output the raw code content for the file. Do not include any explanatory text, markdown formatting like \`\`\`, or anything that is not part of the file's content.`;
        const result = await generateText(prompt, 'You are an expert software engineer.', 0.1, 1, 1);
        const content = result.text.replace(/^```(?:\w+\n)?([\s\S]+)```$/, '$1').trim();
        
        setWorkshopState(prev => ({
            ...prev,
            projectFiles: prev.projectFiles.map(f => f.fileName === fileName ? { ...f, content } : f)
        }));
        logToConsole(`Code for ${fileName} generated successfully.`);

    } catch (err: any) {
        logToConsole(`Error generating code for ${fileName}: ${err.message}`, 'error');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chat || isChatLoading) return;

    const fullPrompt = `(My current file is ${selectedFileName || 'none'}. The user is asking the following question about it.)\n\n${chatInput}`;
    
    const newUserMessage: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
        const stream = await sendMessageStream(chat, fullPrompt);
        let modelResponse = '';
        setChatMessages(prev => [...prev, { role: 'model', text: '' }]);
        for await (const chunk of stream) {
            modelResponse += chunk.text;
            setChatMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                return newMessages;
            });
        }
    } catch(e) {
        console.error(e);
        const errorMsg = {role: 'model' as const, text: 'Sorry, an error occurred.'};
        setChatMessages(p => [...p, errorMsg]);
    } finally {
        setIsChatLoading(false);
    }
  }
  
  const TabButton: React.FC<{tabId: any, activeTab: any, setTab: (tab: any) => void, icon: React.ReactNode, children: React.ReactNode, disabled?: boolean}> = ({ tabId, icon, children, activeTab, setTab, disabled }) => (
    <button onClick={() => setTab(tabId)} disabled={disabled} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === tabId ? 'bg-primary text-white' : 'bg-surface hover:bg-border-color'} disabled:opacity-50 disabled:cursor-not-allowed`}>
        {icon}
        {children}
    </button>
  );

  const resetState = () => {
      setWorkshopState(initialWorkshopState);
      setChatMessages([]);
  }

  // Ideation Stage
  if (stage === 'ideation') {
    return (<div className="animate-fade-in max-w-3xl mx-auto text-center"><PageHeader icon={<WrenchScrewdriverIcon className="w-8 h-8" />} title="Digital Workshop" description="The ultimate AI-powered IDE. Describe a project, and watch as it generates the blueprint, code, and even a live preview in seconds." /><Card className="p-6"><Textarea id="goal" label="Describe your project goal" value={goal} onChange={(e) => setWorkshopState(prev => ({...prev, goal: e.target.value}))} rows={8} placeholder="e.g., A Python Flask API with a /weather endpoint..." /><Button onClick={handleGenerateBlueprint} disabled={!goal || isLoading} isLoading={isLoading} className="mt-4 w-full" size="lg">{loadingMessage || 'Generate Blueprint'}</Button>{error && <p className="text-red-400 mt-4 text-sm">{error}</p>}</Card></div>);
  }

  // Blueprint Review Stage
  if (stage === 'blueprint_review') {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <PageHeader icon={<DocumentTextIcon className="w-8 h-8"/>} title="Review Project Blueprint" description="The AI has generated a blueprint for your project. Review and edit the JSON below, then approve to start building."/>
            <Card className="p-0 flex flex-col" style={{height: '60vh'}}>
                <Textarea
                    id="blueprint-editor"
                    label="Blueprint Editor (JSON)"
                    value={blueprintText}
                    onChange={(e) => setWorkshopState(p => ({...p, blueprintText: e.target.value }))}
                    className="!bg-background font-mono text-xs"
                />
            </Card>
            <div className="mt-4 flex justify-between items-center">
                <Button onClick={resetState} variant="secondary">Start Over</Button>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button onClick={handleApproveBlueprint} size="lg">Approve & Build Project</Button>
            </div>
        </div>
    );
  }

  // Build Stage
  return (
    <div className="animate-fade-in h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div><h2 className="text-2xl font-bold text-on-surface">{blueprint?.projectName}</h2><p className="text-on-surface-variant">{blueprint?.description}</p></div>
            <Button onClick={resetState} variant="secondary">Start Over</Button>
        </div>

        <div className="flex-grow flex gap-4 overflow-hidden">
            <Card className="w-64 flex-shrink-0 flex flex-col" padding="none">
                <h3 className="font-semibold text-sm px-4 py-2 text-on-surface-variant border-b border-border-color">Files</h3>
                <div className="p-2 overflow-y-auto flex-grow">{projectFiles.map(file => (<button key={file.fileName} onClick={() => setWorkshopState(prev => ({...prev, selectedFileName: file.fileName }))} className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${selectedFileName === file.fileName ? 'bg-primary-light text-primary' : 'hover:bg-surface'}`}><DocumentTextIcon className="w-4 h-4 flex-shrink-0" /><span className="truncate">{file.fileName}</span></button>))}</div>
            </Card>
            
            <Card className="flex-1 flex flex-col" padding="none">
                <div className="flex-shrink-0 p-2 border-b border-border-color flex justify-between items-center">
                    <span className="font-mono text-sm pl-2">{selectedFileName}</span>
                </div>
                <div className="flex-grow overflow-auto bg-background relative">
                    {selectedFile && !selectedFile.content && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                            <p className="mb-4 text-on-surface-variant">This file is empty.</p>
                            <Button onClick={() => generateFileContent(selectedFile.fileName)} isLoading={isLoading} disabled={isLoading}>
                                {loadingMessage || `Generate Code for ${selectedFile.fileName}`}
                            </Button>
                        </div>
                    )}
                    {selectedFile && <CodeBlock code={selectedFile.content} language={selectedFile.fileName.split('.').pop() || 'text'} />}
                </div>
            </Card>

            <Card className="w-[450px] flex-shrink-0 flex flex-col" padding="none">
                 <div className="flex-shrink-0 p-2 border-b border-border-color flex items-center gap-2">
                    <TabButton tabId="chat" icon={<ChatBubbleBottomCenterTextIcon className="w-4 h-4"/>} activeTab={activeSideTab} setTab={(t) => setWorkshopState(p=>({...p, activeSideTab: t}))}>AI Chat</TabButton>
                    <TabButton tabId="console" icon={<TerminalIcon className="w-4 h-4"/>} activeTab={activeSideTab} setTab={(t) => setWorkshopState(p=>({...p, activeSideTab: t}))}>Console {consoleMessages.some(m => m.type === 'error') && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}</TabButton>
                    <TabButton tabId="settings" icon={<CogIcon className="w-4 h-4"/>} activeTab={activeSideTab} setTab={(t) => setWorkshopState(p=>({...p, activeSideTab: t}))}>Settings</TabButton>
                </div>

                {activeSideTab === 'console' && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-grow p-2 space-y-1 font-mono text-xs overflow-y-auto text-on-surface-variant flex flex-col-reverse">{consoleMessages.map(msg => (<div key={msg.id} className={`p-2 rounded flex justify-between items-start gap-2 ${msg.type === 'error' ? 'bg-red-500/10 text-red-300' : msg.type === 'warn' ? 'bg-yellow-500/10 text-yellow-300' : ''}`}><span><span className="mr-2 opacity-50">{new Date(msg.id).toLocaleTimeString()}</span>{msg.message}</span></div>))}</div>
                         <div className="p-2 border-t border-border-color"><Button size="sm" variant="secondary" onClick={() => setWorkshopState(prev => ({...prev, consoleMessages: []}))}>Clear Console</Button></div>
                    </div>
                )}

                {activeSideTab === 'chat' && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                            {chatMessages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex-shrink-0 flex items-center justify-center">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                )}
                                <div className={`px-4 py-3 rounded-lg max-w-xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-background' : 'bg-surface text-on-surface'}`}>
                                    <ChatMessageDisplay text={msg.text} />
                                </div>
                            </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-border-color bg-surface">
                            <div className="flex gap-2">
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isChatLoading && handleSendMessage()}
                                    placeholder="Ask about your project..."
                                    className="flex-1"
                                    disabled={isChatLoading}
                                />
                                <Button onClick={handleSendMessage} isLoading={isChatLoading} disabled={!chatInput.trim()}>
                                    Send
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeSideTab === 'settings' && (
                     <div className="p-4 space-y-4">
                        <h4 className="font-semibold text-on-surface">Project Settings</h4>
                        <p className="text-sm text-on-surface-variant">Configuration options for your project will appear here.</p>
                        <Card className="p-4">
                            <h5 className="font-semibold text-sm mb-2">Dummy Model Hyperparameters</h5>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span>Learning Rate:</span> <span>0.001</span></div>
                                <div className="flex justify-between"><span>Batch Size:</span> <span>32</span></div>
                                <div className="flex justify-between"><span>Epochs:</span> <span>5</span></div>
                            </div>
                        </Card>
                    </div>
                )}
            </Card>
        </div>
    </div>
  );
};

export default DigitalWorkshop;
