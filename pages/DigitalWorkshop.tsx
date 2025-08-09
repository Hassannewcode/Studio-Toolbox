


import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Type, Chat } from '@google/genai';
import { generateJson, generateText, createChat, sendMessageStream, simulateExecution } from '../services/geminiService';
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
import { Input } from '../components/ui/Input';
import { type ChatMessage } from '../types';
import { ArrowsPointingOutIcon } from '../components/icons/ArrowsPointingOutIcon';
import { ArrowsPointingInIcon } from '../components/icons/ArrowsPointingInIcon';
import { PaintBrushIcon } from '../components/icons/PaintBrushIcon';
import { PlayIcon } from '../components/icons/PlayIcon';


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
type ActiveSideTab = 'chat' | 'console';
type ActiveOutputTab = 'preview' | 'terminal';

interface WorkshopState {
    goal: string;
    stage: BuildStage;
    blueprint: Blueprint | null;
    blueprintText: string;
    projectFiles: ProjectFile[];
    selectedFileName: string | null;
    consoleMessages: ConsoleMessage[];
    activeSideTab: ActiveSideTab;
    isPreviewFullscreen: boolean;
    showOutputPanel: boolean;
    activeOutputTab: ActiveOutputTab;
    terminalOutput: string;
}

const initialWorkshopState: WorkshopState = {
    goal: 'A simple python flask API that has one route /hello that returns {"message": "hello world"}',
    stage: 'ideation',
    blueprint: null,
    blueprintText: '',
    projectFiles: [],
    selectedFileName: null,
    consoleMessages: [],
    activeSideTab: 'chat',
    isPreviewFullscreen: false,
    showOutputPanel: true,
    activeOutputTab: 'preview',
    terminalOutput: ''
};

const ChatMessageDisplay: React.FC<{ 
    text: string;
    onApplyCode: (code: string) => void;
    canApplyCode: boolean;
}> = ({ text, onApplyCode, canApplyCode }) => {
    if (!text) return <span className="animate-pulse">...</span>;

    const codeBlockRegex = /```(\w*)\n([\s\S]+?)```/g;
    const matches = Array.from(text.matchAll(codeBlockRegex));
    
    if (matches.length === 0) {
        return <p className="whitespace-pre-wrap text-sm">{text}</p>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
        const [fullMatch, language, code] = match;
        const matchIndex = match.index || 0;

        if (matchIndex > lastIndex) {
            elements.push(<p key={`text-${i}`} className="whitespace-pre-wrap">{text.substring(lastIndex, matchIndex)}</p>);
        }

        elements.push(
            <div key={`code-wrapper-${i}`} className="relative group/code">
                <CodeBlock code={code.trim()} language={language || 'text'} />
                {canApplyCode && (
                    <Button 
                        size="sm"
                        variant="secondary"
                        onClick={() => onApplyCode(code.trim())}
                        className="absolute top-2 right-14 !px-2 !py-1 text-xs opacity-0 group-hover/code:opacity-100 transition-opacity"
                        title="Apply this code to the current file"
                    >
                        <PaintBrushIcon className="w-4 h-4 mr-1" />
                        Apply
                    </Button>
                )}
            </div>
        );

        lastIndex = matchIndex + fullMatch.length;
    });

    if (lastIndex < text.length) {
        elements.push(<p key="text-last" className="whitespace-pre-wrap">{text.substring(lastIndex)}</p>);
    }

    return <div className="text-sm space-y-2">{elements}</div>;
};


const DigitalWorkshop: React.FC = () => {
  const [workshopState, setWorkshopState] = usePersistentState<WorkshopState>('digitalWorkshop_v6', initialWorkshopState);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const chatMessagesKey = `digitalWorkshop_chatMessages_${workshopState.blueprint?.projectName || 'default'}_v2`;
  const [chatMessages, setChatMessages] = usePersistentState<ChatMessage[]>(chatMessagesKey, []);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());


  const { goal, stage, blueprint, blueprintText, projectFiles, selectedFileName, consoleMessages, activeSideTab, isPreviewFullscreen, showOutputPanel, activeOutputTab, terminalOutput } = workshopState;
  
  const selectedFile = projectFiles.find(f => f.fileName === selectedFileName) || null;
  const previewFile = projectFiles.find(f => f.fileName.toLowerCase() === 'index.html');

  const logToConsole = useCallback((message: string, type: ConsoleMessage['type'] = 'info') => {
    setWorkshopState(prev => ({...prev, consoleMessages: [{ id: Date.now(), type, message }, ...prev.consoleMessages]}));
  }, [setWorkshopState]);
  
  useEffect(() => {
    if (stage === 'build' && !chat) {
        const systemInstruction = `You are an AI pair programmer assisting a developer.
The project is "${blueprint?.projectName}". Description: "${blueprint?.description}".
The project files are: ${projectFiles.map(f => f.fileName).join(', ')}.
The user will provide context on which file they are viewing. Be helpful and concise.
When asked to provide code, use markdown code blocks. The user can apply your code suggestions to the current file with a single click.`;
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
      const blueprintPrompt = `Generate a project blueprint for the following request: "${goal}". The project should be self-contained and runnable where possible. For web UIs, prioritize a single 'index.html' file with embedded CSS and JS. For backend apps (e.g., Python, Node.js), include a main runnable file (like app.py or index.js), a README.md explaining how to run it, and any necessary config files (like requirements.txt or package.json).`;
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
        const firstFile = files[0]?.fileName || null;
        setWorkshopState(prev => ({
            ...prev,
            stage: 'build',
            blueprint: approvedBlueprint,
            projectFiles: files,
            selectedFileName: firstFile
        }));
        logToConsole(`Blueprint approved. Project "${approvedBlueprint.projectName}" scaffolded.`);
        if (firstFile) handleSelectFile(firstFile, files);
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

  const handleRunCode = async () => {
    if (!selectedFile) return;
    const { fileName, content } = selectedFile;
    const extension = fileName.split('.').pop();

    if (extension === 'html') {
        setWorkshopState(p => ({ ...p, activeOutputTab: 'preview' }));
        setPreviewKey(Date.now());
        logToConsole(`Refreshing preview for ${fileName}.`, 'info');
    } else if (extension && ['py', 'js', 'ts', 'go', 'sh', 'bash'].includes(extension)) {
        setWorkshopState(p => ({ ...p, activeOutputTab: 'terminal', terminalOutput: '' }));
        setIsLoading(true);
        setLoadingMessage(`Running ${fileName}...`);
        logToConsole(`Simulating execution for ${fileName}...`, 'info');
        try {
            const languageMap: { [key: string]: string } = { 'js': 'javascript', 'py': 'python', 'ts': 'typescript', 'go': 'go', 'sh': 'bash' };
            const language = languageMap[extension] || extension;
            const result = await simulateExecution(content, language);
            setWorkshopState(p => ({ ...p, terminalOutput: result.text }));
            logToConsole(`Execution of ${fileName} simulated.`, 'info');
        } catch (err: any) {
            const errorMsg = `Failed to simulate execution: ${err.message}`;
            setWorkshopState(p => ({ ...p, terminalOutput: errorMsg }));
            logToConsole(errorMsg, 'error');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    } else {
        logToConsole(`Cannot run file type: .${extension}. Only web previews and script execution are supported.`, 'warn');
    }
};
  
  const handleApplyCodeChange = (codeToApply: string) => {
    if (!selectedFileName) return;
    setWorkshopState(prev => ({
        ...prev,
        projectFiles: prev.projectFiles.map(f =>
            f.fileName === selectedFileName ? { ...f, content: codeToApply } : f
        )
    }));
    logToConsole(`Applied AI suggestion to ${selectedFileName}.`, 'info');
  };
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chat || isChatLoading) return;
    
    const context = `The user is currently viewing the file: ${selectedFileName || 'none'}.`;
    const fullPrompt = `${context}\n\nUser question: ${chatInput}`;
    
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

  const handleSelectFile = (fileName: string, currentFiles = projectFiles) => {
    const extension = fileName.split('.').pop();
    const hasPreview = currentFiles.some(f => f.fileName.toLowerCase() === 'index.html');
    const newActiveTab = (extension === 'html' && hasPreview) ? 'preview' : 'terminal';
    setWorkshopState(prev => ({
        ...prev,
        selectedFileName: fileName,
        activeOutputTab: newActiveTab
    }));
};

  if (stage === 'ideation') {
    return (<div className="animate-fade-in max-w-3xl mx-auto text-center"><PageHeader icon={<WrenchScrewdriverIcon className="w-8 h-8" />} title="Digital Workshop" description="The ultimate AI-powered IDE. Describe a project, and watch as it generates the blueprint, code, and even a live preview in seconds." /><Card className="p-6"><Textarea id="goal" label="Describe your project goal" value={goal} onChange={(e) => setWorkshopState(prev => ({...prev, goal: e.target.value}))} rows={8} placeholder="e.g., A Python Flask API with a /weather endpoint..." /><Button onClick={handleGenerateBlueprint} disabled={!goal || isLoading} isLoading={isLoading} className="mt-4 w-full" size="lg">{loadingMessage || 'Generate Blueprint'}</Button>{error && <p className="text-red-400 mt-4 text-sm">{error}</p>}</Card></div>);
  }

  if (stage === 'blueprint_review') {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto flex flex-col" style={{height: 'calc(100vh - 10rem)'}}>
            <div className="flex-shrink-0"><PageHeader icon={<DocumentTextIcon className="w-8 h-8"/>} title="Review Project Blueprint" description="The AI has generated a blueprint for your project. Review and edit the JSON below, then approve to start building."/></div>
            <Card className="p-0 flex flex-col flex-grow overflow-hidden">
                <Textarea
                    id="blueprint-editor"
                    label="Blueprint Editor (JSON)"
                    value={blueprintText}
                    onChange={(e) => setWorkshopState(p => ({...p, blueprintText: e.target.value }))}
                    className="!bg-background font-mono text-xs flex-grow"
                />
            </Card>
            <div className="mt-4 flex justify-between items-center flex-shrink-0">
                <Button onClick={resetState} variant="secondary">Start Over</Button>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button onClick={handleApproveBlueprint} size="lg">Approve & Build Project</Button>
            </div>
        </div>
    );
  }

  const OutputPanel = ({isFullScreen = false} : {isFullScreen?: boolean}) => (
    <Card className="flex-1 flex flex-col" padding="none">
        <div className="flex-shrink-0 p-2 border-b border-border-color flex justify-between items-center">
             <div className="flex items-center gap-2">
                    <TabButton 
                        tabId="preview" 
                        icon={<EyeIcon className="w-4 h-4"/>} 
                        activeTab={activeOutputTab} 
                        setTab={(t) => setWorkshopState(p=>({...p, activeOutputTab: t}))}
                        disabled={!previewFile}
                    >
                        Preview
                    </TabButton>
                    <TabButton 
                        tabId="terminal" 
                        icon={<TerminalIcon className="w-4 h-4"/>} 
                        activeTab={activeOutputTab} 
                        setTab={(t) => setWorkshopState(p=>({...p, activeOutputTab: t}))}
                    >
                        Terminal
                    </TabButton>
             </div>
             {isFullScreen && (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setPreviewKey(Date.now())} title="Refresh Preview"><ArrowPathIcon className="w-4 h-4"/></Button>
                    <Button size="sm" variant="secondary" onClick={() => setWorkshopState(p => ({...p, isPreviewFullscreen: false}))}>
                        <ArrowsPointingInIcon className="w-4 h-4 mr-1"/>Exit
                    </Button>
                </div>
            )}
        </div>
        <div className="flex-grow bg-white relative">
            {activeOutputTab === 'preview' ? (
                previewFile ? (
                    <iframe key={previewKey} srcDoc={previewFile.content} className="w-full h-full border-0" sandbox="allow-scripts allow-modals allow-popups allow-forms" title="Live Preview"/>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-center p-4">
                        <p className="text-gray-500">Create an `index.html` file to see a live preview.</p>
                    </div>
                )
            ) : (
                <div className="w-full h-full bg-background text-on-surface-variant p-2 font-mono text-xs whitespace-pre-wrap overflow-y-auto">
                   {terminalOutput ? <pre>{terminalOutput}</pre> : <div className="text-on-surface-variant/50">Terminal output from running code will appear here.</div>}
                </div>
            )}
        </div>
    </Card>
  );

  return (
    <>
    <div className={`animate-fade-in h-full flex-col ${isPreviewFullscreen ? 'hidden' : 'flex'}`}>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div><h2 className="text-2xl font-bold text-on-surface">{blueprint?.projectName}</h2><p className="text-on-surface-variant">{blueprint?.description}</p></div>
            <Button onClick={resetState} variant="secondary">Start Over</Button>
        </div>

        <div className="flex-grow flex gap-4 overflow-hidden">
            <Card className="w-64 flex-shrink-0 flex flex-col" padding="none">
                <h3 className="font-semibold text-sm px-4 py-2 text-on-surface-variant border-b border-border-color">Files</h3>
                <div className="p-2 overflow-y-auto flex-grow">{projectFiles.map(file => (<button key={file.fileName} onClick={() => handleSelectFile(file.fileName)} className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${selectedFileName === file.fileName ? 'bg-primary-light text-primary' : 'hover:bg-surface'}`}><DocumentTextIcon className="w-4 h-4 flex-shrink-0" /><span className="truncate">{file.fileName}</span></button>))}</div>
            </Card>
            
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <Card className={`flex flex-col ${showOutputPanel ? 'flex-[2]' : 'flex-1'}`} padding="none">
                    <div className="flex-shrink-0 p-2 border-b border-border-color flex justify-between items-center">
                        <span className="font-mono text-sm pl-2 flex items-center gap-2"><CodeIcon className="w-4 h-4"/>{selectedFileName || 'No file selected'}</span>
                        <div className="flex items-center gap-2">
                             <Button size="sm" variant="secondary" onClick={handleRunCode} isLoading={isLoading && loadingMessage.startsWith('Running')} title="Run Code">
                                <PlayIcon className="w-4 h-4"/>
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setWorkshopState(p => ({...p, showOutputPanel: !p.showOutputPanel}))} title={showOutputPanel ? "Hide Output" : "Show Output"}>
                                <EyeIcon className="w-4 h-4"/>
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setWorkshopState(p => ({...p, isPreviewFullscreen: true, showOutputPanel: true}))} title="Fullscreen Preview" disabled={!previewFile}>
                                <ArrowsPointingOutIcon className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-auto bg-background relative">
                        {selectedFile ? (
                            !selectedFile.content && !isLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                                    <p className="mb-4 text-on-surface-variant">This file is empty.</p>
                                    <Button onClick={() => generateFileContent(selectedFile.fileName)} isLoading={isLoading} disabled={isLoading}>
                                        {loadingMessage || `Generate Code for ${selectedFile.fileName}`}
                                    </Button>
                                </div>
                            ) : (<CodeBlock code={selectedFile.content} language={selectedFile.fileName.split('.').pop() || 'text'} />)
                        ) : (<div className="w-full h-full flex items-center justify-center"><p className="text-on-surface-variant">Select a file to view its content.</p></div>)}
                         {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-background/50"><Spinner/></div>}
                    </div>
                </Card>
                {showOutputPanel && (
                    <div className="flex-1 flex flex-col"><OutputPanel /></div>
                )}
            </div>

            <Card className="w-[450px] flex-shrink-0 flex flex-col" padding="none">
                 <div className="flex-shrink-0 p-2 border-b border-border-color flex items-center gap-2">
                    <TabButton tabId="chat" icon={<ChatBubbleBottomCenterTextIcon className="w-4 h-4"/>} activeTab={activeSideTab} setTab={(t) => setWorkshopState(p=>({...p, activeSideTab: t}))}>AI Chat</TabButton>
                    <TabButton tabId="console" icon={<TerminalIcon className="w-4 h-4"/>} activeTab={activeSideTab} setTab={(t) => setWorkshopState(p=>({...p, activeSideTab: t}))}>Logs {consoleMessages.some(m => m.type === 'error') && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}</TabButton>
                </div>

                {activeSideTab === 'console' && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-grow p-2 space-y-1 font-mono text-xs overflow-y-auto text-on-surface-variant flex flex-col-reverse">{consoleMessages.map(msg => (<div key={msg.id} className={`p-1.5 rounded flex justify-between items-start gap-2 text-wrap break-words ${msg.type === 'error' ? 'bg-red-500/10 text-red-300' : msg.type === 'warn' ? 'bg-yellow-500/10 text-yellow-300' : ''}`}><span className="opacity-60 flex-shrink-0">{new Date(msg.id).toLocaleTimeString()}</span><span className="flex-grow text-right">{msg.message}</span></div>))}</div>
                         <div className="p-2 border-t border-border-color"><Button size="sm" variant="secondary" onClick={() => setWorkshopState(prev => ({...prev, consoleMessages: []}))}>Clear Logs</Button></div>
                    </div>
                )}

                {activeSideTab === 'chat' && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                            {chatMessages.length === 0 && <div className="text-center text-on-surface-variant text-sm p-4">Ask the AI for help with your project! You can ask it to write code, explain concepts, or suggest improvements.</div>}
                            {chatMessages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex-shrink-0 flex items-center justify-center">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                )}
                                <div className={`px-4 py-3 rounded-lg max-w-full shadow-sm ${msg.role === 'user' ? 'bg-primary text-background' : 'bg-surface text-on-surface'}`}>
                                    <ChatMessageDisplay text={msg.text} onApplyCode={handleApplyCodeChange} canApplyCode={!!selectedFileName} />
                                </div>
                            </div>
                            ))}
                             {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== 'model' && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex-shrink-0 flex items-center justify-center">
                                        <SparklesIcon className="w-5 h-5" />
                                    </div>
                                    <div className="px-4 py-2 rounded-lg bg-surface">
                                        <span className="animate-pulse text-sm">Thinking...</span>
                                    </div>
                                </div>
                            )}
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
            </Card>
        </div>
    </div>
    {isPreviewFullscreen && <div className="fixed inset-0 z-50 flex flex-col bg-background p-4"><OutputPanel isFullScreen={true} /></div>}
    </>
  );
};

export default DigitalWorkshop;
