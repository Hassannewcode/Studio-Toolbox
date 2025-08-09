
import React, { useState, useEffect, useRef } from 'react';
import { createChat, sendMessageStream } from '../services/geminiService';
import { type ChatMessage } from '../types';
import { type Chat } from "@google/genai";
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ComputerDesktopIcon } from '../components/icons/ComputerDesktopIcon';
import usePersistentState from '../hooks/usePersistentState';

const PersonaSimulator: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = usePersistentState<ChatMessage[]>('personaSim_messages', []);
  const [userInput, setUserInput] = usePersistentState<string>('personaSim_userInput', '');
  const [persona, setPersona] = usePersistentState<string>('personaSim_persona', 'a frustrated customer whose package has not arrived.');
  const [scenario, setScenario] = usePersistentState<string>('personaSim_scenario', 'The customer is talking to a support bot. The bot should try to be helpful and de-escalate the situation.');
  const [isSimulating, setIsSimulating] = usePersistentState<boolean>('personaSim_isSimulating', false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  
  useEffect(() => {
    // This effect synchronizes the chat object with the simulation state
    if (isSimulating) {
      const systemInstruction = `You are acting as ${persona}. The scenario is: ${scenario}. Stay in character.`;
      setChat(createChat(systemInstruction));
    } else {
      setChat(null);
    }
  }, [isSimulating, persona, scenario]);

  const startSimulation = () => {
    setMessages([]);
    setUserInput('');
    setIsSimulating(true);
  };

  const endSimulation = () => {
    setIsSimulating(false);
    setMessages([]); // Clear history on end for a fresh start next time
    setUserInput('');
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !chat) return;

    const newUserMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSimulating) {
    return (
      <Card className="p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <ComputerDesktopIcon className="w-6 h-6 text-primary" /> Persona Simulator Setup
        </h2>
        <div className="space-y-4">
          <Textarea
            label="AI Persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={3}
          />
          <Textarea
            label="Scenario Description"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            rows={4}
          />
          <Button onClick={startSimulation} disabled={!persona || !scenario} className="w-full">
            Start Simulation
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col p-0">
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <div>
            <h2 className="text-xl font-semibold flex items-center gap-2"><ComputerDesktopIcon className="w-6 h-6 text-primary" /> Simulation Running</h2>
            <p className="text-sm text-on-surface-variant truncate" title={persona}>Persona: {persona}</p>
        </div>
        <Button onClick={endSimulation} variant="secondary">End</Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0" />}
            <div className={`px-4 py-2 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-primary text-background' : 'bg-surface text-on-surface'}`}>
              <p className="whitespace-pre-wrap">{msg.text || <span className="animate-pulse">...</span>}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border-color">
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            placeholder="Type your message to the AI..."
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} isLoading={isLoading} disabled={!userInput.trim()}>
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PersonaSimulator;
