
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Type, Chat } from '@google/genai';
import { generateText, createChat, sendMessageStream, simulateExecution, generateJson } from '../services/geminiService';
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
import { type ChatMessage, type AIActionPlan, type AIActionOperation, AIAction } from '../types';
import { ArrowsPointingOutIcon } from '../components/icons/ArrowsPointingOutIcon';
import { ArrowsPointingInIcon } from '../components/icons/ArrowsPointingInIcon';
import { PlayIcon } from '../components/icons/PlayIcon';
import { FolderIcon } from '../components/icons/FolderIcon';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';


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
type ActiveOutputTab = 'preview' | 'terminal' | 'console';

interface WorkshopState {
    goal: string;
    stage: BuildStage;
    blueprint: Blueprint | null;
    blueprintText: string;
    projectFiles: ProjectFile[];
    selectedFileName: string | null;
    consoleMessages: ConsoleMessage[];
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
    isPreviewFullscreen: false,
    showOutputPanel: true,
    activeOutputTab: 'preview',
    terminalOutput: ''
};

// Types for file tree
interface FileTreeNode {
  [key: string]: FileTreeNode | ProjectFile;
}

const consoleForwarderScript = `
    const seen = new WeakSet();
    const replacer = (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) { return '[Circular]'; }
            seen.add(value);
        } else if (typeof value === 'function') {
            return '[Function]';
        }
        return value;
    };
    const forwarder = (type) => (...args) => {
        try {
            const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, replacer)).join(' ');
            window.parent.postMessage({ source: 'iframe-console', type, message }, '*');
        } catch (e) {
            window.parent.postMessage({ source: 'iframe-console', type: 'error', message: 'Error forwarding console message.' }, '*');
        }
    };
    window.console.log = forwarder('log');
    window.console.error = forwarder('error');
    window.console.warn = forwarder('warn');
    window.console.info = forwarder('info');
    window.addEventListener('error', (event) => {
        forwarder('error')(event.message, 'at', event.filename + ':' + event.lineno);
        event.preventDefault();
    });
    window.addEventListener('unhandledrejection', event => {
        forwarder('error')('Unhandled promise rejection:', event.reason);
    });
`;

const ChangeProposal: React.FC<{
    plan: AIActionPlan,
    onApply: (operations: AIActionOperation[]) => void,
    onDiscard: () => void
}> = ({ plan, onApply, onDiscard }) => {
    const iconMap: { [key in AIAction]: React.ReactNode } = {
        CREATE_FILE: <PlusCircleIcon className="w-5 h-5 text-green-400" />,
        UPDATE_FILE: <PencilIcon className="w-5 h-5 text-yellow-400" />,
        DELETE_FILE: <TrashIcon className="w-5 h-5 text-red-400" />,
        RENAME_FILE: <ArrowPathIcon className="w-5 h-5 text-blue-400" />,
    };

    return (
        <div className="bg-primary-light/50 border border-primary/50 rounded-lg p-3 mt-2 text-sm">
            <p className="font-semibold text-on-surface mb-2">AI Proposed Changes:</p>
            <p className="text-on-surface-variant italic mb-3 text-xs">"{plan.thought}"</p>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                {plan.operations.map((op, index) => (
                    <div key={index} className="flex items-center gap-2 bg-surface p-1.5 rounded-md">
                        {iconMap[op.action]}
                        <span className="font-mono text-xs text-on-surface-variant break-all">
                            {op.path} {op.action === 'RENAME_FILE' && `-> ${op.newPath}`}
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={onDiscard}>Discard</Button>
                <Button size="sm" variant="primary" onClick={() => onApply(plan.operations)}>Apply Changes</Button>
            </div>
        </div>
    );
};

const ChatMessageDisplay: React.FC<{ message: ChatMessage, onApplyChanges: (operations: AIActionOperation[]) => void }> = ({ message, onApplyChanges }) => {
    const [isApplied, setIsApplied] = useState(false);

    const handleApply = (operations: AIActionOperation[]) => {
        onApplyChanges(operations);
        setIsApplied(true);
    };

    const handleDiscard = () => {
        setIsApplied(true); // Effectively hides the buttons
    };

    return (
        <div className="text-sm">
            <p className="whitespace-pre-wrap">{message.text || <span className="animate-pulse">...</span>}</p>
            {message.proposedPlan && !isApplied && (
                <ChangeProposal plan={message.proposedPlan} onApply={handleApply} onDiscard={handleDiscard} />
            )}
        </div>
    );
};

// Helper to build file tree
const buildFileTree = (files: ProjectFile[]): FileTreeNode => {
  const tree: FileTreeNode = {};
  files.forEach(file => {
    const parts = file.fileName.split('/');
    let currentLevel = tree;
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        currentLevel[part] = file;
      } else {
        currentLevel[part] = currentLevel[part] || {};
        currentLevel = currentLevel[part] as FileTreeNode;
      }
    });
  });
  return tree;
};

// Recursive component to display the file tree
const FileNodeDisplay: React.FC<{
  node: FileTreeNode | ProjectFile;
  name: string;
  selectedFile: string | null;
  onSelectFile: (fileName: string) => void;
  path?: string;
}> = ({ node, name, selectedFile, onSelectFile, path = '' }) => {
  const [isOpen, setIsOpen] = useState(true);
  const currentPath = path ? `${path}/${name}` : name;

  // Check if node is a file (has fileName property)
  if ('fileName' in node) {
    return (
      <button
        onClick={() => onSelectFile(node.fileName)}
        className={`w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors ${selectedFile === node.fileName ? 'bg-primary-light text-primary font-medium' : 'text-on-surface-variant hover:bg-surface'}`}
      >
        <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{name}</span>
      </button>
    );
  }

  // It's a folder
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 text-sm text-on-surface-variant hover:bg-surface">
        <FolderIcon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate font-medium">{name}</span>
      </button>
      {isOpen && (
        <div className="pl-4 border-l border-border-color ml-2">
            {Object.entries(node as FileTreeNode).sort(([a], [b]) => a.localeCompare(b)).map(([childName, childNode]) => (
               <FileNodeDisplay key={childName} node={childNode} name={childName} selectedFile={selectedFile} onSelectFile={onSelectFile} path={currentPath} />
            ))}
        </div>
      )}
    </div>
  );
};

const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
        case 'html': return 'text/html';
        case 'css': return 'text/css';
        case 'js': return 'application/javascript';
        case 'json': return 'application/json';
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'svg': return 'image/svg+xml';
        case 'woff': return 'font/woff';
        case 'woff2': return 'font/woff2';
        case 'ttf': return 'font/ttf';
        default: return 'text/plain';
    }
};


const DigitalWorkshop: React.FC = () => {
  const [workshopState, setWorkshopState] = usePersistentState<WorkshopState>('digitalWorkshop_v9', initialWorkshopState);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [chat, setChat] = useState<Chat | null>(null);
  const chatMessagesKey = `digitalWorkshop_chatMessages_${workshopState.blueprint?.projectName || 'default'}_v4`;
  const [chatMessages, setChatMessages] = usePersistentState<ChatMessage[]>(chatMessagesKey, []);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [previewSrcDoc, setPreviewSrcDoc] = useState<string>('');
  const blobUrlsRef = useRef<string[]>([]);

  const { goal, stage, blueprint, blueprintText, projectFiles, selectedFileName, consoleMessages, isPreviewFullscreen, showOutputPanel, activeOutputTab, terminalOutput } = workshopState;
  
  const selectedFile = projectFiles.find(f => f.fileName === selectedFileName) || null;
  const previewFile = projectFiles.find(f => f.fileName.toLowerCase() === 'index.html');
  const fileTree = buildFileTree(projectFiles);

  const logToConsole = useCallback((message: string, type: ConsoleMessage['type'] = 'info') => {
    setWorkshopState(prev => ({...prev, consoleMessages: [{ id: Date.now(), type, message }, ...prev.consoleMessages].slice(0, 100)}));
  }, [setWorkshopState]);
  
  // Console forwarder listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.source === 'iframe-console') {
            logToConsole(`[PREVIEW] ${event.data.message}`, event.data.type);
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [logToConsole]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
        blobUrlsRef.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  // Auto-refresh preview
  useEffect(() => {
    const entryPoint = projectFiles.find(f => f.fileName.toLowerCase() === 'index.html');
    if (!entryPoint) {
        setPreviewSrcDoc(
             `<div style="font-family: sans-serif; color: #9da0a5; display: flex; align-items: center; justify-content: center; height: 100%; background-color: #282a2e;">Create an 'index.html' file to see a live preview.</div>`
        );
        return;
    }

    // Revoke previous blob URLs to prevent memory leaks
    blobUrlsRef.current.forEach(URL.revokeObjectURL);
    const newBlobUrls: string[] = [];

    const fileMap = new Map<string, string>();
    projectFiles.forEach(file => {
        const mimeType = getMimeType(file.fileName);
        const blob = new Blob([file.content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        newBlobUrls.push(url);
        fileMap.set(file.fileName, url);
    });
    
    blobUrlsRef.current = newBlobUrls;

    let processedHtml = entryPoint.content;

    // Replace all file references with blob URLs
    fileMap.forEach((blobUrl, filePath) => {
        const escapedPath = filePath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(href|src)=["'](?:\\.\\/)?${escapedPath}["']`, 'g');
        processedHtml = processedHtml.replace(regex, `$1="${blobUrl}"`);
    });

    const finalSrcDoc = `<script>${consoleForwarderScript}</script>${processedHtml}`;
    setPreviewSrcDoc(finalSrcDoc);
    
  }, [projectFiles, previewKey]);

  useEffect(() => {
    if (stage === 'build' && !chat && blueprint) {
        const systemInstruction = `You are an expert AI pair programmer.
The project is "${blueprint.projectName}". Description: "${blueprint.description}".
The project files are: ${projectFiles.map(f => f.fileName).join(', ')}.
When you need to make changes to the file system, you MUST respond with a JSON object inside a markdown block like this:
\`\`\`json_actions
{
  "thought": "Here is my plan to implement the feature...",
  "operations": [
    { "action": "CREATE_FILE", "path": "src/style.css", "content": "body { ... }" },
    { "action": "UPDATE_FILE", "path": "index.html", "content": "<!DOCTYPE html>..." }
  ]
}
\`\`\`
First, provide your 'thought' process streaming as regular text. Then, after your thoughts, provide the final \`\`\`json_actions\`\`\` block. Do not add any text after the block.
The available actions are: "CREATE_FILE", "UPDATE_FILE", "DELETE_FILE", "RENAME_FILE".
- For CREATE_FILE and UPDATE_FILE, you must provide the full file 'content'.
- For RENAME_FILE, you must provide the 'path' of the file to rename and a 'newPath'.
- Folders are created implicitly by creating a file with a nested path.
- To delete a folder, use DELETE_FILE on all files within it.`;
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
      const result = await generateJson(blueprintPrompt, blueprintSchema);
      
      const cleanedText = result.text.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/, '$1').trim();

      const blueprintData: Blueprint = JSON.parse(cleanedText);
      setWorkshopState(prev => ({
        ...prev,
        stage: 'blueprint_review',
        blueprint: blueprintData,
        blueprintText: JSON.stringify(blueprintData, null, 2)
      }));
      logToConsole('Blueprint generated. Please review.');
    } catch (err: any) {
        if (err instanceof SyntaxError) {
            const errorMessage = `Failed to parse blueprint from AI. Please try again. Details: ${err.message}`;
            setError(errorMessage);
            logToConsole(errorMessage, 'error');
        } else {
            const errorMessage = err.message || 'An unknown error occurred during blueprint generation.';
            setError(errorMessage);
            logToConsole(errorMessage, 'error');
        }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const generateAllFiles = async (approvedBlueprint: Blueprint) => {
    setIsLoading(true);
    logToConsole('Generating all project files...', 'info');
    let generatedFiles: ProjectFile[] = [];

    for (const fileInfo of approvedBlueprint.files) {
        setLoadingMessage(`Generating ${fileInfo.fileName}...`);
        logToConsole(`Generating code for ${fileInfo.fileName}...`, 'info');
        try {
            const prompt = `Based on the project blueprint for "${approvedBlueprint.projectName}", generate complete, production-ready code for the file: ${fileInfo.fileName}. File Description: ${fileInfo.description}. IMPORTANT: Only output the raw code content for the file. Do not include any explanatory text, markdown formatting like \`\`\`, or anything that is not part of the file's content.`;
            const result = await generateText(prompt, 'You are an expert software engineer.', 0.1, 1, 1);
            const content = result.text.replace(/^```(?:\w+\n)?([\s\S]+)```$/, '$1').trim();
            generatedFiles.push({ ...fileInfo, content });
            setWorkshopState(prev => ({...prev, projectFiles: [...generatedFiles, ...approvedBlueprint.files.slice(generatedFiles.length).map(f => ({...f, content:''}))] }));
            logToConsole(`Code for ${fileInfo.fileName} generated successfully.`);
        } catch(err: any) {
            logToConsole(`Error generating code for ${fileInfo.fileName}: ${err.message}`, 'error');
            generatedFiles.push({ ...fileInfo, content: `// Error generating file: ${err.message}` });
        }
    }
    setWorkshopState(prev => ({...prev, projectFiles: generatedFiles }));
    logToConsole('All project files generated!', 'info');
    setIsLoading(false);
    setLoadingMessage('');
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
        generateAllFiles(approvedBlueprint);
      } catch (e: any) {
          logToConsole(`Invalid blueprint JSON: ${e.message}`, 'error');
          setError(`Blueprint is not valid JSON. Please fix it before proceeding.`);
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
        setLoadingMessage(`Simulating ${fileName}...`);
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
  
    const applyChanges = (operations: AIActionOperation[]) => {
        logToConsole('Applying AI changes...');
        setWorkshopState(prev => {
            let newFiles = [...prev.projectFiles];
            for (const op of operations) {
                switch (op.action) {
                    case 'CREATE_FILE':
                        if (!newFiles.some(f => f.fileName === op.path)) {
                            newFiles.push({ fileName: op.path, content: op.content || '', description: 'File created by AI' });
                            logToConsole(`CREATED: ${op.path}`);
                        } else {
                            logToConsole(`CREATE SKIPPED (exists): ${op.path}`, 'warn');
                        }
                        break;
                    case 'UPDATE_FILE':
                        newFiles = newFiles.map(f => f.fileName === op.path ? { ...f, content: op.content || '' } : f);
                        logToConsole(`UPDATED: ${op.path}`);
                        break;
                    case 'DELETE_FILE':
                        newFiles = newFiles.filter(f => f.fileName !== op.path);
                        logToConsole(`DELETED: ${op.path}`);
                        break;
                    case 'RENAME_FILE':
                        newFiles = newFiles.map(f => f.fileName === op.path ? { ...f, fileName: op.newPath || f.fileName } : f);
                        logToConsole(`RENAMED: ${op.path} to ${op.newPath}`);
                        break;
                }
            }
            return { ...prev, projectFiles: newFiles };
        });
    };
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chat || isChatLoading) return;
    
    const context = `The user is currently editing the file: "${selectedFileName}". Here is the full content of that file:\n\n\`\`\`\n${selectedFile?.content || ''}\n\`\`\`\n\nUser's request: "${chatInput}"`;
    
    const newUserMessage: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
        const stream = await sendMessageStream(chat, context);
        let modelResponse = '';
        const modelMessage: ChatMessage = { role: 'model', text: '' };
        setChatMessages(prev => [...prev, modelMessage]);

        for await (const chunk of stream) {
            modelResponse += chunk.text;
            setChatMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], text: modelResponse };
                return newMessages;
            });
        }
        
        // After stream, parse for action plan
        const actionJsonRegex = /```json_actions\n([\s\S]+?)```/;
        const match = modelResponse.match(actionJsonRegex);
        if (match && match[1]) {
            try {
                const plan: AIActionPlan = JSON.parse(match[1]);
                setChatMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    lastMsg.proposedPlan = plan;
                    lastMsg.text = modelResponse.replace(actionJsonRegex, '').trim(); // Remove the JSON block from display text
                    return newMessages;
                });
            } catch (e) {
                logToConsole("Failed to parse AI action plan JSON.", "error");
                console.error("AI Action Plan Parse Error:", e);
            }
        }

    } catch(e) {
        console.error(e);
        const errorMsg = {role: 'model' as const, text: 'Sorry, an error occurred.'};
        setChatMessages(p => [...p.slice(0, -1), errorMsg]);
    } finally {
        setIsChatLoading(false);
    }
  }
  
  const OutputTabButton: React.FC<{tabId: ActiveOutputTab, activeTab: ActiveOutputTab, setTab: (tab: ActiveOutputTab) => void, icon: React.ReactNode, children: React.ReactNode, disabled?: boolean}> = ({ tabId, icon, children, activeTab, setTab, disabled }) => (
    <button onClick={() => setTab(tabId)} disabled={disabled} className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === tabId ? 'bg-primary text-white font-medium' : 'bg-surface text-on-surface-variant hover:bg-border-color'} disabled:opacity-50 disabled:cursor-not-allowed`}>
        {icon}
        {children}
    </button>
  );

  const resetState = () => {
      setWorkshopState(initialWorkshopState);
      setChatMessages([]);
  }

  const handleSelectFile = (fileName: string, currentFiles = projectFiles) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const isBackendExecutable = extension && ['py', 'go', 'sh', 'rb', 'java', 'js', 'ts'].includes(extension);
    
    setWorkshopState(prev => ({
        ...prev,
        selectedFileName: fileName,
        activeOutputTab: isBackendExecutable ? 'terminal' : 'preview'
    }));
  };

  const handleCodeChange = (newContent: string) => {
      if (!selectedFileName) return;
      setWorkshopState(p => ({...p, projectFiles: p.projectFiles.map(f => f.fileName === selectedFileName ? {...f, content: newContent} : f)}));
  }

  if (stage === 'ideation') {
    return (
        <div className="max-w-3xl mx-auto animate-fade-in flex flex-col justify-center h-full">
            <PageHeader
                icon={<WrenchScrewdriverIcon className="w-8 h-8" />}
                title="Digital Workshop"
                description="Describe a project. The AI will generate the blueprint, code, and a live preview."
            />
            <Card className="p-6">
                <Textarea 
                  id="goal" 
                  label="Project Goal" 
                  value={goal} 
                  onChange={(e) => setWorkshopState(prev => ({...prev, goal: e.target.value}))} 
                  rows={8} 
                  placeholder="e.g., A Python Flask API with a /weather endpoint..." 
                />
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleGenerateBlueprint} disabled={!goal || isLoading} isLoading={isLoading} size="lg">{loadingMessage || 'Generate Blueprint'}</Button>
                </div>
                {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
            </Card>
        </div>
    );
  }

  if (stage === 'blueprint_review') {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in flex flex-col h-full py-4">
            <PageHeader
                icon={<DocumentTextIcon className="w-8 h-8" />}
                title="Review Project Blueprint"
                description="The AI has generated a blueprint. Review and edit the JSON below, then approve to start building."
            />
            <Card className="p-0 flex flex-col flex-grow overflow-hidden">
                <Textarea
                    id="blueprint-editor"
                    value={blueprintText}
                    onChange={(e) => setWorkshopState(p => ({...p, blueprintText: e.target.value }))}
                    className="!bg-background font-mono text-xs flex-grow !border-0 focus:!ring-0 resize-none"
                />
            </Card>
            <div className="mt-4 flex justify-between items-center flex-shrink-0">
                <Button onClick={resetState} variant="secondary">Start Over</Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button onClick={handleApproveBlueprint} size="lg">Approve & Build Project</Button>
            </div>
        </div>
    );
  }

  const OutputPanel = ({isFullScreen = false} : {isFullScreen?: boolean}) => (
    <Card className="flex-1 flex flex-col min-h-0" padding="none">
        <div className="flex-shrink-0 p-2 border-b border-border-color flex justify-between items-center">
             <div className="flex items-center gap-2">
                    <OutputTabButton 
                        tabId="preview" 
                        icon={<EyeIcon className="w-4 h-4"/>} 
                        activeTab={activeOutputTab} 
                        setTab={(t) => setWorkshopState(p=>({...p, activeOutputTab: t}))}
                        disabled={!previewFile}
                    >
                        Preview
                    </OutputTabButton>
                    <OutputTabButton 
                        tabId="terminal" 
                        icon={<TerminalIcon className="w-4 h-4"/>} 
                        activeTab={activeOutputTab} 
                        setTab={(t) => setWorkshopState(p=>({...p, activeOutputTab: t}))}
                    >
                        Terminal
                    </OutputTabButton>
                    <OutputTabButton
                        tabId="console"
                        icon={<ChatBubbleBottomCenterTextIcon className="w-4 h-4" />}
                        activeTab={activeOutputTab}
                        setTab={(t) => setWorkshopState(p => ({ ...p, activeOutputTab: t }))}
                    >
                        Console {consoleMessages.some(m => m.type === 'error') && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                    </OutputTabButton>
             </div>
             {isFullScreen && (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="tertiary" onClick={() => setPreviewKey(Date.now())} title="Refresh Preview"><ArrowPathIcon className="w-4 h-4"/></Button>
                    <Button size="sm" variant="tertiary" onClick={() => setWorkshopState(p => ({...p, isPreviewFullscreen: false}))}>
                        <ArrowsPointingInIcon className="w-4 h-4 mr-1"/>Exit Fullscreen
                    </Button>
                </div>
            )}
        </div>
        <div className="flex-grow bg-white relative overflow-hidden">
            {activeOutputTab === 'preview' && (
                <iframe 
                    srcDoc={previewSrcDoc} 
                    className="w-full h-full border-0 bg-surface" 
                    sandbox="allow-scripts allow-modals allow-popups allow-forms allow-same-origin"
                    title="Live Preview"
                />
            )}
            {activeOutputTab === 'terminal' && (
                <div className="w-full h-full bg-black text-on-surface-variant p-2 font-mono text-xs whitespace-pre-wrap overflow-y-auto">
                   {terminalOutput ? <pre>{terminalOutput}</pre> : <div className="text-on-surface-variant/70">Terminal output from running code will appear here.</div>}
                </div>
            )}
            {activeOutputTab === 'console' && (
                 <div className="flex flex-col h-full overflow-hidden bg-background">
                    <div className="flex-grow p-2 space-y-1 font-mono text-xs overflow-y-auto text-on-surface-variant flex flex-col-reverse">{consoleMessages.map(msg => (<div key={msg.id} className={`p-1.5 rounded flex justify-between items-start gap-2 text-wrap break-words ${msg.type === 'error' ? 'bg-red-500/20 text-red-300' : msg.type === 'warn' ? 'bg-yellow-500/20 text-yellow-300' : ''}`}><span className="opacity-60 flex-shrink-0">{new Date(msg.id).toLocaleTimeString()}</span><span className="flex-grow text-right">{msg.message}</span></div>))}</div>
                    <div className="p-2 border-t border-border-color"><Button size="sm" variant="tertiary" onClick={() => setWorkshopState(prev => ({...prev, consoleMessages: []}))}>Clear Logs</Button></div>
                </div>
            )}
        </div>
    </Card>
  );

  return (
    <>
    <div className={`h-full flex flex-col ${isPreviewFullscreen ? 'hidden' : ''}`}>
        <div className="flex-grow flex gap-4 p-4 overflow-hidden">
            {/* File Explorer */}
            <Card className="w-64 flex-shrink-0 flex flex-col" padding="none">
                <div className="p-2 border-b border-border-color flex justify-between items-center">
                    <h3 className="font-semibold text-sm px-2 text-on-surface">Files</h3>
                    <Button onClick={resetState} variant="tertiary" size="sm" title="Start Over">Reset</Button>
                </div>
                <div className="p-2 overflow-y-auto flex-grow">
                    <p className="px-2 pb-2 text-xs text-on-surface-variant truncate font-semibold">{blueprint?.projectName}</p>
                    {Object.entries(fileTree).map(([name, node]) => (
                        <FileNodeDisplay key={name} node={node} name={name} selectedFile={selectedFileName} onSelectFile={handleSelectFile} />
                    ))}
                </div>
            </Card>
            
            {/* Center Panel (Editor + Output) */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <Card className={`flex flex-col ${showOutputPanel ? 'flex-[2]' : 'flex-1'}`} padding="none">
                    <div className="flex-shrink-0 p-2 border-b border-border-color flex justify-between items-center">
                        <span className="font-mono text-sm pl-2 flex items-center gap-2 text-on-surface"><CodeIcon className="w-4 h-4"/>{selectedFileName || 'No file selected'}</span>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="tertiary" onClick={handleRunCode} isLoading={isLoading && loadingMessage.startsWith('Simulating')} title="Run Code">
                                <PlayIcon className="w-4 h-4"/>
                            </Button>
                            <Button size="sm" variant="tertiary" onClick={() => setWorkshopState(p => ({...p, showOutputPanel: !p.showOutputPanel}))} title={showOutputPanel ? "Hide Output" : "Show Output"}>
                                <EyeIcon className="w-4 h-4"/>
                            </Button>
                            <Button size="sm" variant="tertiary" onClick={() => setWorkshopState(p => ({...p, isPreviewFullscreen: true, showOutputPanel: true}))} title="Fullscreen Preview" disabled={!previewFile}>
                                <ArrowsPointingOutIcon className="w-4 h-4"/>
                            </Button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-hidden bg-background relative">
                        {selectedFile ? (
                           <Textarea 
                                value={selectedFile.content} 
                                onChange={(e) => handleCodeChange(e.target.value)} 
                                className="!bg-background !border-0 font-mono text-sm w-full h-full resize-none focus:!ring-0"
                                placeholder={`// ${selectedFile.fileName} is empty. Ask the AI to write the code!`}
                           />
                        ) : (<div className="w-full h-full flex items-center justify-center"><p className="text-on-surface-variant">Select a file to view its content.</p></div>)}
                        {isLoading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white z-10"><Spinner/><p className="mt-2">{loadingMessage}</p></div>}
                    </div>
                </Card>
                {showOutputPanel && (
                    <div className="flex-1 flex flex-col min-h-0"><OutputPanel /></div>
                )}
            </div>
            
            {/* AI Chat Sidebar */}
            <Card className="w-[450px] flex-shrink-0 flex flex-col" padding="none">
                 <div className="p-2 border-b border-border-color flex justify-between items-center">
                    <h3 className="font-semibold text-sm px-2 text-on-surface flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-primary"/>AI Pair Programmer</h3>
                </div>
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                        {chatMessages.length === 0 && <div className="text-center text-on-surface-variant/70 text-sm p-4">Engage the AI. Request code, explanations, or improvements for the selected file.</div>}
                        {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex-shrink-0 flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            )}
                            <div className={`px-4 py-3 rounded-lg max-w-full shadow-sm ${msg.role === 'user' ? 'bg-primary text-background' : 'bg-surface'}`}>
                                <ChatMessageDisplay message={msg} onApplyChanges={applyChanges} />
                            </div>
                        </div>
                        ))}
                        {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== 'model' && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex-shrink-0 flex items-center justify-center">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                <div className="px-4 py-2 rounded-lg bg-surface">
                                    <span className="animate-pulse text-sm text-on-surface-variant">...</span>
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
                                placeholder="Message the AI..."
                                className="flex-1"
                                disabled={isChatLoading || !selectedFile}
                            />
                            <Button onClick={handleSendMessage} isLoading={isChatLoading} disabled={!chatInput.trim() || !selectedFile}>
                                Send
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    </div>
    {isPreviewFullscreen && <div className="fixed inset-0 z-50 flex flex-col bg-background p-4"><OutputPanel isFullScreen={true} /></div>}
    </>
  );
};

export default DigitalWorkshop;
