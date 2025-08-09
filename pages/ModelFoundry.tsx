import React, { useState, useEffect } from 'react';
import { createChat, generateText, sendMessageStream } from '../services/geminiService';
import { type Chat } from '@google/genai';
import { type ChatMessage } from '../types';
import usePersistentState from '../hooks/usePersistentState';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Slider } from '../components/ui/Slider';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { CubeTransparentIcon } from '../components/icons/CubeTransparentIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';

type Stage = 'config' | 'data' | 'train' | 'test';
type ModelType = 'Chat Bot' | 'Text Summarizer' | 'Code Generator';

interface ModelConfig {
    modelType: ModelType;
    creativity: number;
    layers: number;
    heads: number;
    dimensions: number;
}

interface FoundryState {
    stage: Stage;
    config: ModelConfig;
    trainingData: string;
}

const initialFoundryState: FoundryState = {
    stage: 'config',
    config: {
        modelType: 'Chat Bot',
        creativity: 0.7,
        layers: 12,
        heads: 8,
        dimensions: 768,
    },
    trainingData: '',
};

const ModelFoundry: React.FC = () => {
    const [foundryState, setFoundryState] = usePersistentState<FoundryState>('modelFoundry_state', initialFoundryState);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingLog, setTrainingLog] = useState<string[]>([]);
    
    // Test stage state
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    const { stage, config, trainingData } = foundryState;

    const setStage = (newStage: Stage) => setFoundryState(p => ({...p, stage: newStage}));
    const setConfig = (newConfig: Partial<ModelConfig>) => setFoundryState(p => ({...p, config: {...p.config, ...newConfig}}));
    const setTrainingData = (data: string) => setFoundryState(p => ({...p, trainingData: data}));

    const handleGenerateData = async () => {
        setIsLoading(true);
        setLoadingMessage('Generating sample data...');
        setError(null);
        try {
            const prompt = `Generate a small, realistic-looking sample of training data for a ${config.modelType}. For a chatbot, use prompt/response pairs. For a summarizer, use long text/summary pairs. For a code generator, use comment/code pairs.`;
            const result = await generateText(prompt, 'You are a data generation specialist.', 0.5, 1, 1);
            setTrainingData(result.text);
        } catch(e) {
            setError('Failed to generate sample data.');
            console.error(e);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }

    const handleStartTraining = () => {
        setIsTraining(true);
        setTrainingLog([]);
        setError(null);

        const totalSteps = 20;
        let currentStep = 0;

        const addLog = (log: string) => setTrainingLog(prev => [log, ...prev]);

        addLog("Training initiated...");
        addLog(`Model Config: ${config.modelType}, Layers: ${config.layers}, Heads: ${config.heads}`);

        const interval = setInterval(() => {
            currentStep++;
            const progress = (currentStep / totalSteps) * 100;
            const loss = (Math.random() * (3 - 0.1) + 0.1) / (currentStep * 0.5);
            addLog(`Epoch ${Math.ceil(currentStep/5)}/4 | Step ${currentStep}/${totalSteps} | Loss: ${loss.toFixed(4)}`);
            
            if (currentStep >= totalSteps) {
                clearInterval(interval);
                addLog("Training complete. Model ready for testing.");
                setIsTraining(false);
                setStage('test');
            }
        }, 400);
    }
    
    useEffect(() => {
        if(stage === 'test') {
            const systemInstruction = `You are a custom AI model.
            Your configuration is:
            - Type: ${config.modelType}
            - Creativity (Temperature): ${config.creativity}
            This is your training data which defines your knowledge and personality:
            ---
            ${trainingData || 'You are a helpful assistant.'}
            ---
            Now, act as the AI you were configured to be.`;
            setChat(createChat(systemInstruction));
            setMessages([]);
        }
    }, [stage, config, trainingData]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || !chat || isThinking) return;
        const newUserMessage: ChatMessage = { role: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsThinking(true);
        
        try {
            const stream = await sendMessageStream(chat, userInput);
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                    return newMessages;
                });
            }
        } catch(e) {
            console.error(e);
            setMessages(p => [...p, {role: 'model', text: 'Sorry, an error occurred.'}]);
        } finally {
            setIsThinking(false);
        }
    }

    const Stepper = () => {
        const stages: {id: Stage, name: string}[] = [
            { id: 'config', name: '1. Configure Architecture' },
            { id: 'data', name: '2. Provide Data' },
            { id: 'train', name: '3. Train Model' },
            { id: 'test', name: '4. Test & Playground' },
        ];
        const currentStageIndex = stages.findIndex(s => s.id === stage);

        return (
            <div className="flex items-center justify-center space-x-2 md:space-x-4 my-6">
                {stages.map((s, index) => (
                    <React.Fragment key={s.id}>
                        <button
                            onClick={() => setStage(s.id)}
                            disabled={index > currentStageIndex && s.id !== 'test'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                stage === s.id ? 'bg-primary text-white' : 
                                index < currentStageIndex ? 'bg-surface hover:bg-border-color text-on-surface' : 'bg-surface text-on-surface-variant cursor-not-allowed'
                            }`}
                        >
                            {s.name}
                        </button>
                        {index < stages.length - 1 && <div className={`h-0.5 flex-grow ${index < currentStageIndex ? 'bg-primary' : 'bg-border-color'}`}></div>}
                    </React.Fragment>
                ))}
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in">
            <PageHeader
                icon={<CubeTransparentIcon className="w-8 h-8" />}
                title="Model Foundry"
                description="Your personal workplace to define, configure, train, and test custom AI models from the ground up."
            />
            
            <Stepper />
            
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}

            {stage === 'config' && (
                <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Model Configuration</h3>
                        <div className="space-y-6">
                            <Select label="Base Model Type" value={config.modelType} onChange={e => setConfig({ modelType: e.target.value as ModelType })}>
                                <option>Chat Bot</option>
                                <option>Text Summarizer</option>
                                <option>Code Generator</option>
                            </Select>
                            <Slider label="Creativity (Temperature)" value={config.creativity} min="0" max="1" step="0.1" onChange={e => setConfig({ creativity: parseFloat(e.target.value) })} />
                             <details className="space-y-4 bg-surface p-4 rounded-lg border border-border-color">
                                 <summary className="cursor-pointer font-medium text-sm text-on-surface-variant">Advanced Settings</summary>
                                 <div className="pt-4 border-t border-border-color space-y-4">
                                    <Slider label="Layers" value={config.layers} min="1" max="24" step="1" onChange={e => setConfig({ layers: parseInt(e.target.value) })} />
                                    <Slider label="Attention Heads" value={config.heads} min="1" max="16" step="1" onChange={e => setConfig({ heads: parseInt(e.target.value) })} />
                                    <Slider label="Embedding Dimensions" value={config.dimensions} min="128" max="1024" step="64" onChange={e => setConfig({ dimensions: parseInt(e.target.value) })} />
                                 </div>
                             </details>
                        </div>
                         <Button onClick={() => setStage('data')} className="w-full mt-8">Next: Provide Data</Button>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-background rounded-lg p-6 border border-border-color">
                        <CubeTransparentIcon className="w-24 h-24 text-primary opacity-50"/>
                        <p className="text-on-surface-variant text-center mt-4">A visualization of your model architecture would appear here, updating as you change parameters.</p>
                    </div>
                </Card>
            )}

            {stage === 'data' && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Provide Training Data</h3>
                    <p className="text-sm text-on-surface-variant mb-4">Paste your training data below, or generate a sample. This data will define your model's knowledge and behavior.</p>
                    <Textarea 
                        value={trainingData}
                        onChange={(e) => setTrainingData(e.target.value)}
                        rows={15}
                        placeholder="e.g., prompt: Who are you?, response: I am a pirate chatbot!"
                    />
                    <div className="flex justify-between items-center mt-4">
                        <Button variant="secondary" onClick={handleGenerateData} isLoading={isLoading}>
                            {loadingMessage || 'Generate Sample Data'}
                        </Button>
                        <Button onClick={() => setStage('train')} disabled={!trainingData}>Next: Train Model</Button>
                    </div>
                </Card>
            )}

            {stage === 'train' && (
                 <Card className="p-6">
                     <h3 className="text-lg font-semibold mb-4">Train Model</h3>
                     {!isTraining && !trainingLog.length ? (
                         <div className="text-center">
                            <p className="mb-4">Ready to start training with your provided data and configuration.</p>
                            <Button size="lg" onClick={handleStartTraining}>Start Training</Button>
                         </div>
                     ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col items-center justify-center bg-background rounded-lg p-6 border border-border-color">
                               <p className="font-semibold">Simulated Training Loss</p>
                               <div className="w-full h-48 text-on-surface-variant flex items-center justify-center">A live loss curve graph would be displayed here.</div>
                            </div>
                            <div className="bg-background rounded-lg p-2 border border-border-color h-64 overflow-y-auto flex flex-col-reverse">
                               <pre className="font-mono text-xs whitespace-pre-wrap">
                                   {trainingLog.map((log, i) => <div key={i}>{log}</div>)}
                               </pre>
                            </div>
                         </div>
                     )}
                 </Card>
            )}
            
            {stage === 'test' && (
                <Card className="p-0 h-[60vh] flex flex-col">
                    <h3 className="text-lg font-semibold p-4 border-b border-border-color flex-shrink-0">Playground: Test Your Model</h3>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex-shrink-0 flex items-center justify-center">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            )}
                            <div className={`px-4 py-2 rounded-lg max-w-xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-background' : 'bg-surface text-on-surface'}`}>
                            <p className="whitespace-pre-wrap text-sm">{msg.text || <span className="animate-pulse">...</span>}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-border-color bg-surface">
                        <div className="flex gap-2">
                            <Input
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isThinking && handleSendMessage()}
                                placeholder="Chat with your new model..."
                                className="flex-1"
                                disabled={isThinking}
                            />
                            <Button onClick={handleSendMessage} isLoading={isThinking} disabled={!userInput.trim()}>
                                Send
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
            
        </div>
    );
}

export default ModelFoundry;