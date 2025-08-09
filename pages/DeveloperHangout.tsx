
import React, { useState, useEffect, useRef } from 'react';
import { generateText } from '../services/geminiService';
import { type ChatMessage } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserGroupIcon } from '../components/icons/UserGroupIcon';
import usePersistentState from '../hooks/usePersistentState';

interface HangoutMessage extends ChatMessage {
  persona: 'User' | 'Senior Dev' | 'Junior Dev';
}

const DevTalkSimulator: React.FC = () => {
  const [messages, setMessages] = usePersistentState<HangoutMessage[]>('devTalk_messages', []);
  const [topic, setTopic] = usePersistentState<string>('devTalk_topic', '');
  const [isStarted, setIsStarted] = usePersistentState<boolean>('devTalk_isStarted', false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartDiscussion = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setError(null);
    setMessages([{ role: 'user', text: `Let's discuss: ${topic}`, persona: 'User' }]);
    setIsStarted(true);

    try {
      const prompt = `As a senior developer, give your initial thoughts on the following topic: "${topic}"`;
      const result = await generateText(prompt, 'You are a pragmatic and experienced senior software engineer.', 0.7, 1, 1);
      
      const seniorMessage: HangoutMessage = { role: 'model', text: result.text, persona: 'Senior Dev' };
      setMessages(prev => [...prev, seniorMessage]);

    } catch (err) {
      setError('Failed to start discussion. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    setError(null);

    const lastMessage = messages[messages.length - 1];
    const nextPersona = lastMessage.persona === 'Senior Dev' ? 'Junior Dev' : 'Senior Dev';
    
    let prompt = '';
    let systemInstruction = '';

    if (nextPersona === 'Junior Dev') {
      systemInstruction = 'You are a curious and slightly inexperienced junior developer. Ask a clarifying question or express a concern based on what the senior dev just said.';
      prompt = `The senior developer just said: "${lastMessage.text}". What is your response?`;
    } else { // Senior Dev
      systemInstruction = 'You are a pragmatic and experienced senior software engineer. Address the junior dev\'s question or comment with a helpful explanation or a counter-point.';
      prompt = `Your junior colleague just said: "${lastMessage.text}". What is your response?`;
    }

    try {
        const result = await generateText(prompt, systemInstruction, 0.7, 1, 1);
        const newMessage: HangoutMessage = { role: 'model', text: result.text, persona: nextPersona };
        setMessages(prev => [...prev, newMessage]);
    } catch(err) {
        setError('Failed to continue discussion. Check console for details.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Card className="h-full flex flex-col p-0">
      <div className="p-4 border-b border-border-color">
        <h2 className="text-xl font-semibold flex items-center gap-2"><UserGroupIcon className="w-6 h-6 text-primary" /> Dev-Talk Simulator</h2>
        <p className="text-sm text-on-surface-variant">Simulate a technical discussion.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                msg.persona === 'Senior Dev' ? 'bg-indigo-500 text-white' : 
                msg.persona === 'Junior Dev' ? 'bg-teal-500 text-white' : 'bg-surface'
            }`}>
              {msg.persona.substring(0, 3).toUpperCase()}
            </div>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">{msg.persona}</span>
                <div className="mt-1 px-4 py-2 rounded-lg bg-surface text-on-surface">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="text-center text-on-surface-variant">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-border-color">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {!isStarted ? (
            <div className="flex gap-2">
                <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleStartDiscussion()}
                    placeholder="Enter a technical topic to discuss..."
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button onClick={handleStartDiscussion} isLoading={isLoading} disabled={!topic.trim()}>
                    Start
                </Button>
            </div>
        ) : (
             <Button onClick={handleContinue} isLoading={isLoading} className="w-full">
                Continue Discussion
            </Button>
        )}
      </div>
    </Card>
  );
};

export default DevTalkSimulator;
